import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow, format } from "date-fns";
import type { BackupStatus, DbType, LogLevel, BackupType } from "@/types";

// ─── Class names helper ───────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Bytes formatter ──────────────────────────────────────────────────────
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// ─── Duration formatter ───────────────────────────────────────────────────
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────
export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function fmtDate(date: string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

// ─── Status colour maps ───────────────────────────────────────────────────
export const statusColors: Record<BackupStatus, string> = {
  pending:   "text-terminal-yellow  bg-terminal-yellow/10  border-terminal-yellow/30",
  running:   "text-terminal-blue    bg-terminal-blue/10    border-terminal-blue/30",
  completed: "text-terminal-green   bg-terminal-green/10   border-terminal-green/30",
  failed:    "text-terminal-red     bg-terminal-red/10     border-terminal-red/30",
};

export const logLevelColors: Record<LogLevel, string> = {
  info:    "text-terminal-blue",
  warn:    "text-terminal-yellow",
  error:   "text-terminal-red",
  success: "text-terminal-green",
  debug:   "text-text-secondary",
};

// ─── DB type display ──────────────────────────────────────────────────────
export const dbLabels: Record<DbType, string> = {
  mysql:      "MySQL",
  postgresql: "PostgreSQL",
  mongodb:    "MongoDB",
  sqlite:     "SQLite",
};

export const backupTypeColors: Record<BackupType, string> = {
  full:          "text-acid",
  incremental:   "text-terminal-blue",
  differential:  "text-terminal-yellow",
};

// ─── Compression ratio helper ─────────────────────────────────────────────
export function compressionSaved(before: number, after: number): string {
  if (!before || !after) return "—";
  const saved = ((before - after) / before) * 100;
  return `${saved.toFixed(1)}% saved`;
}

// ─── Cron label ───────────────────────────────────────────────────────────
export function cronLabel(expr: string): string {
  const map: Record<string, string> = {
    "0 * * * *":   "Every hour",
    "0 0 * * *":   "Daily at midnight",
    "0 0 * * 0":   "Weekly on Sunday",
    "0 0 1 * *":   "Monthly on 1st",
  };
  return map[expr] ?? expr;
}