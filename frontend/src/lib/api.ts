import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  DbConnection,
  CreateConnectionDto,
  ConnectionTestResult,
  Backup,
  CreateBackupDto,
  RestoreJob,
  RestoreDto,
  Schedule,
  CreateScheduleDto,
  LogEntry,
  DashboardStats,
  ApiResponse,
} from "@/types";

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

// ─── Retry helper ─────────────────────────────────────────────────────────────

const RETRY_MAX    = 3;
const RETRY_DELAY  = 300; // ms base
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);

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
    const status     = axios.isAxiosError(err) ? err.response?.status : undefined;
    const isNetwork  = axios.isAxiosError(err) && !err.response;

    if (attempt < RETRY_MAX && (isNetwork || (status && RETRY_STATUS.has(status)))) {
      await wait(RETRY_DELAY * 2 ** attempt);
      return withRetry(fn, attempt + 1);
    }
    throw err;
  }
}

// ─── In-flight GET deduplication ──────────────────────────────────────────────

const inFlight = new Map<string, Promise<AxiosResponse<unknown>>>();

function dedupKey(config: AxiosRequestConfig): string {
  return `${config.method?.toUpperCase() ?? "GET"}:${config.url}:${JSON.stringify(config.params ?? {})}`;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Request — attach bearer token (no-op until backend has auth)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response — normalise errors
// NOTE: Backend has no /auth/refresh endpoint yet — 401 auto-refresh logic
// removed until auth is actually implemented. Re-add when backend supports it.
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (!axios.isAxiosError(err)) {
      throw new ApiError(String(err));
    }
    const status  = err.response?.status;
    const message =
      (err.response?.data as { message?: string; error?: string } | undefined)
        ?.message ??
      (err.response?.data as { error?: string } | undefined)?.error ??
      err.message ??
      "Unknown error";
    throw new ApiError(message, status);
  }
);

// ─── Core request wrapper ─────────────────────────────────────────────────────
// IMPORTANT: This returns the FULL backend envelope `{ success, data, message? }`
// — NOT the unwrapped inner data. Callers must do `result.data` to get the
// actual payload. This matches every controller in backend/src/controllers/*.
//
// Why keep the envelope instead of auto-unwrapping?
// → `message` and `success` are sometimes needed by the UI (e.g. toasts),
//   and unwrapping silently drops them. One consistent rule avoids the
//   "double .data.data" bug that broke 9 call sites previously.

async function request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const isGet = !config.method || config.method.toUpperCase() === "GET";

  if (isGet) {
    const key = dedupKey(config);
    const existing = inFlight.get(key) as Promise<AxiosResponse<ApiResponse<T>>> | undefined;
    if (existing) return existing.then((r) => r.data);

    const promise = withRetry(() => api.request<ApiResponse<T>>(config))
      .finally(() => inFlight.delete(key));

    inFlight.set(key, promise as Promise<AxiosResponse<unknown>>);
    return promise.then((r) => r.data);
  }

  return withRetry(() => api.request<ApiResponse<T>>(config)).then((r) => r.data);
}

// ─── Connections ──────────────────────────────────────────────────────────────

export const connectionsApi = {
  list: (signal?: AbortSignal) =>
    request<DbConnection[]>({ url: "/connections", signal }),

  create: (data: CreateConnectionDto, signal?: AbortSignal) =>
    request<DbConnection>({ method: "POST", url: "/connections", data, signal }),

  remove: (id: string, signal?: AbortSignal) =>
    request<null>({ method: "DELETE", url: `/connections/${id}`, signal }),

  test: (id: string, signal?: AbortSignal) =>
    request<ConnectionTestResult>({
      method: "POST",
      url:    `/connections/${id}/test`,
      signal,
    }),
};

// ─── Backups ──────────────────────────────────────────────────────────────────

export const backupsApi = {
  list: (signal?: AbortSignal) =>
    request<Backup[]>({ url: "/backups", signal }),

  getById: (id: string, signal?: AbortSignal) =>
    request<Backup>({ url: `/backups/${id}`, signal }),

  create: (data: CreateBackupDto, signal?: AbortSignal) =>
    request<Backup>({ method: "POST", url: "/backups", data, signal }),

  remove: (id: string, signal?: AbortSignal) =>
    request<null>({ method: "DELETE", url: `/backups/${id}`, signal }),

  /** Direct download URL — used as <a href> or window.location, not via axios */
  download: (id: string): string => `${BASE}/api/backups/${id}/download`,
  /** @deprecated use `download` — kept so older call sites don't crash */
  downloadUrl: (id: string): string => `${BASE}/api/backups/${id}/download`,
};

// ─── Restore ──────────────────────────────────────────────────────────────────

export const restoreApi = {
  start: (data: RestoreDto, signal?: AbortSignal) =>
    request<RestoreJob>({ method: "POST", url: "/restore", data, signal }),

  jobs: (signal?: AbortSignal) =>
    request<RestoreJob[]>({ url: "/restore/jobs", signal }),

  job: (id: string, signal?: AbortSignal) =>
    request<RestoreJob>({ url: `/restore/jobs/${id}`, signal }),
};

// ─── Schedules ────────────────────────────────────────────────────────────────

export const schedulesApi = {
  list: (signal?: AbortSignal) =>
    request<Schedule[]>({ url: "/schedules", signal }),

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
    request<null>({ method: "DELETE", url: `/schedules/${id}`, signal }),
};

// ─── Logs ─────────────────────────────────────────────────────────────────────

export const logsApi = {
  list: (limit = 200, signal?: AbortSignal) =>
    request<LogEntry[]>({ url: "/logs", params: { limit }, signal }),

  clear: (signal?: AbortSignal) =>
    request<null>({ method: "DELETE", url: "/logs", signal }),
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  dashboard: (signal?: AbortSignal) =>
    request<DashboardStats>({ url: "/stats/dashboard", signal }),
  /** @deprecated use `dashboard` — kept so older call sites don't crash */
  get: (signal?: AbortSignal) =>
    request<DashboardStats>({ url: "/stats/dashboard", signal }),
};