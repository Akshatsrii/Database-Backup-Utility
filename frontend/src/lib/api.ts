import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ─── Environment ──────────────────────────────────────────────────────────────

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ─── Typed error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

// Connections
export interface Connection {
  id:        string;
  name:      string;
  type:      string;
  host:      string;
  port:      number;
  database:  string;
  username:  string;
  createdAt: string;
}
export interface CreateConnectionDto {
  name:     string;
  type:     string;
  host:     string;
  port:     number;
  database: string;
  username: string;
  password: string;
}
export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
}

// Backups
export interface Backup {
  id:           string;
  connectionId: string;
  filename:     string;
  sizeBytes:    number;
  status:       "pending" | "running" | "done" | "failed";
  createdAt:    string;
}
export interface CreateBackupDto {
  connectionId: string;
  label?:       string;
}

// Restore
export interface RestoreJob {
  id:           string;
  backupId:     string;
  connectionId: string;
  status:       "pending" | "running" | "done" | "failed";
  progress:     number;
  startedAt:    string;
  finishedAt?:  string;
  error?:       string;
}
export interface StartRestoreDto {
  backupId:     string;
  connectionId: string;
}

// Schedules
export interface Schedule {
  id:           string;
  connectionId: string;
  cron:         string;
  enabled:      boolean;
  label?:       string;
  nextRunAt:    string;
  lastRunAt?:   string;
}
export interface CreateScheduleDto {
  connectionId: string;
  cron:         string;
  label?:       string;
}

// Logs
export interface LogEntry {
  id:        string;
  level:     "info" | "warn" | "error";
  message:   string;
  meta?:     Record<string, unknown>;
  timestamp: string;
}

// Stats
export interface DashboardStats {
  totalBackups:      number;
  totalSizeBytes:    number;
  activeConnections: number;
  activeSchedules:   number;
  recentJobs:        RestoreJob[];
}

// Generic paginated list
export interface ApiList<T> {
  items: T[];
  total: number;
}

// ─── Token refresh state ──────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}> = [];

async function refreshToken(): Promise<string> {
  const refresh = typeof window !== "undefined"
    ? localStorage.getItem("refreshToken")
    : null;

  if (!refresh) throw new ApiError("No refresh token", 401);

  const res = await axios.post<{ token: string }>(`${BASE}/api/auth/refresh`, {
    refreshToken: refresh,
  });
  const newToken = res.data.token;
  localStorage.setItem("token", newToken);
  return newToken;
}

function drainQueue(token: string | null, err: unknown) {
  pendingQueue.forEach((p) => (token ? p.resolve(token) : p.reject(err)));
  pendingQueue = [];
}

// ─── In-flight deduplication ─────────────────────────────────────────────────

const inFlight = new Map<string, Promise<AxiosResponse<unknown>>>();

function dedupKey(config: AxiosRequestConfig): string {
  return `${config.method?.toUpperCase()}:${config.url}:${JSON.stringify(config.params ?? {})}`;
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

const RETRY_MAX     = 3;
const RETRY_DELAY   = 300; // ms base
const RETRY_STATUS  = new Set([429, 500, 502, 503, 504]);

function wait(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function withRetry<T>(
  fn: () => Promise<AxiosResponse<T>>,
  attempt = 0,
): Promise<AxiosResponse<T>> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status =
      axios.isAxiosError(err) ? err.response?.status : undefined;
    const isNetwork = axios.isAxiosError(err) && !err.response;

    if (attempt < RETRY_MAX && (isNetwork || (status && RETRY_STATUS.has(status)))) {
      await wait(RETRY_DELAY * 2 ** attempt);
      return withRetry(fn, attempt + 1);
    }
    throw err;
  }
}

// ─── Axios instance ───────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Request — attach bearer token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response — normalise errors + handle 401 refresh
api.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    if (!axios.isAxiosError(err)) {
      throw new ApiError(String(err));
    }

    const status  = err.response?.status;
    const message = err.response?.data?.message ?? err.message ?? "Unknown error";
    const code    = err.response?.data?.code as string | undefined;

    // 401 — try token refresh, replay
    if (status === 401 && !err.config?.url?.includes("/auth/refresh")) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          const cfg = err.config!;
          cfg.headers.Authorization = `Bearer ${token}`;
          return api(cfg);
        });
      }

      isRefreshing = true;
      try {
        const token = await refreshToken();
        drainQueue(token, null);
        const cfg = err.config!;
        cfg.headers.Authorization = `Bearer ${token}`;
        return api(cfg);
      } catch (refreshErr) {
        drainQueue(null, refreshErr);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
        }
        throw new ApiError("Session expired — please log in again", 401);
      } finally {
        isRefreshing = false;
      }
    }

    throw new ApiError(message, status, code);
  }
);

// ─── Core request wrapper ─────────────────────────────────────────────────────
// Unwraps AxiosResponse<T> → T, applies retry, deduplicates GET requests.

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const isGet = !config.method || config.method.toUpperCase() === "GET";

  if (isGet) {
    const key = dedupKey(config);
    const existing = inFlight.get(key) as Promise<AxiosResponse<T>> | undefined;

    if (existing) return existing.then((r) => r.data);

    const promise = withRetry(() =>
      api.request<T>(config)
    ).finally(() => inFlight.delete(key));

    inFlight.set(key, promise as Promise<AxiosResponse<unknown>>);
    return promise.then((r) => r.data);
  }

  return withRetry(() => api.request<T>(config)).then((r) => r.data);
}

// ─── Connections ──────────────────────────────────────────────────────────────

export const connectionsApi = {
  list: (signal?: AbortSignal) =>
    request<ApiList<Connection>>({ url: "/connections", signal }),

  create: (data: CreateConnectionDto, signal?: AbortSignal) =>
    request<Connection>({ method: "POST", url: "/connections", data, signal }),

  remove: (id: string, signal?: AbortSignal) =>
    request<void>({ method: "DELETE", url: `/connections/${id}`, signal }),

  test: (id: string, signal?: AbortSignal) =>
    request<TestConnectionResult>({
      method: "POST",
      url:    `/connections/${id}/test`,
      signal,
    }),
};

// ─── Backups ──────────────────────────────────────────────────────────────────

export const backupsApi = {
  list: (signal?: AbortSignal) =>
    request<ApiList<Backup>>({ url: "/backups", signal }),

  create: (data: CreateBackupDto, signal?: AbortSignal) =>
    request<Backup>({ method: "POST", url: "/backups", data, signal }),

  remove: (id: string, signal?: AbortSignal) =>
    request<void>({ method: "DELETE", url: `/backups/${id}`, signal }),

  /** Returns a pre-signed download URL — no axios needed */
  downloadUrl: (id: string): string => `${BASE}/api/backups/${id}/download`,
};

// ─── Restore ──────────────────────────────────────────────────────────────────

export const restoreApi = {
  start: (data: StartRestoreDto, signal?: AbortSignal) =>
    request<RestoreJob>({ method: "POST", url: "/restore", data, signal }),

  jobs: (signal?: AbortSignal) =>
    request<ApiList<RestoreJob>>({ url: "/restore/jobs", signal }),

  job: (id: string, signal?: AbortSignal) =>
    request<RestoreJob>({ url: `/restore/jobs/${id}`, signal }),
};

// ─── Schedules ────────────────────────────────────────────────────────────────

export const schedulesApi = {
  list: (signal?: AbortSignal) =>
    request<ApiList<Schedule>>({ url: "/schedules", signal }),

  create: (data: CreateScheduleDto, signal?: AbortSignal) =>
    request<Schedule>({ method: "POST", url: "/schedules", data, signal }),

  toggle: (id: string, enabled: boolean, signal?: AbortSignal) =>
    request<Schedule>({
      method: "PATCH",
      url:    `/schedules/${id}`,
      data:   { enabled },
      signal,
    }),

  remove: (id: string, signal?: AbortSignal) =>
    request<void>({ method: "DELETE", url: `/schedules/${id}`, signal }),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

export const logsApi = {
  list: (limit = 200, signal?: AbortSignal) =>
    request<ApiList<LogEntry>>({ url: "/logs", params: { limit }, signal }),
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  dashboard: (signal?: AbortSignal) =>
    request<DashboardStats>({ url: "/stats/dashboard", signal }),
};