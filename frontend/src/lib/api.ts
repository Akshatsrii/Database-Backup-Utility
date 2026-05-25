import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// ─── Interceptors ──────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message ?? err.message ?? "Unknown error";
    console.error("[API]", msg);
    return Promise.reject(new Error(msg));
  }
);

// ─── Connections ──────────────────────────────────────────────────────────
export const connectionsApi = {
  list:   ()      => api.get("/connections"),
  create: (d: unknown) => api.post("/connections", d),
  remove: (id: string) => api.delete(`/connections/${id}`),
  test:   (id: string) => api.post(`/connections/${id}/test`),
};

// ─── Backups ──────────────────────────────────────────────────────────────
export const backupsApi = {
  list:    ()           => api.get("/backups"),
  create:  (d: unknown) => api.post("/backups", d),
  remove:  (id: string) => api.delete(`/backups/${id}`),
  download:(id: string) => `${BASE}/api/backups/${id}/download`,
};

// ─── Restore ─────────────────────────────────────────────────────────────
export const restoreApi = {
  start: (d: unknown) => api.post("/restore", d),
  jobs:  ()           => api.get("/restore/jobs"),
};

// ─── Schedules ────────────────────────────────────────────────────────────
export const schedulesApi = {
  list:   ()              => api.get("/schedules"),
  create: (d: unknown)    => api.post("/schedules", d),
  toggle: (id: string, enabled: boolean) => api.patch(`/schedules/${id}`, { enabled }),
  remove: (id: string)    => api.delete(`/schedules/${id}`),
};

// ─── Logs ─────────────────────────────────────────────────────────────────
export const logsApi = {
  list: (limit = 200) => api.get(`/logs?limit=${limit}`),
};

// ─── Stats ────────────────────────────────────────────────────────────────
export const statsApi = {
  dashboard: () => api.get("/stats/dashboard"),
};