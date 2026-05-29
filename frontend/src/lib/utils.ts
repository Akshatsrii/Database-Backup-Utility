import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow, format, isValid } from "date-fns";
import type { BackupStatus, DbType, LogLevel, BackupType } from "@/types";

// ─── Class names ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ─── Bytes formatter ──────────────────────────────────────────────────────────

/** @param binary - true = 1024-based (KiB, MiB…), false = 1000-based (KB, MB…) */
export function formatBytes(
  bytes: number,
  decimals = 2,
  binary = true,
): string {
  if (!isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";

  const k     = binary ? 1024 : 1000;
  const units = binary
    ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
    : ["B", "KB",  "MB",  "GB",  "TB",  "PB"];

  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    units.length - 1,
  );

  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));
  return `${value} ${units[i]}`;
}

// ─── Duration formatter ───────────────────────────────────────────────────────

/**
 * @param compact - true returns short form: "2h4m", "3m12s", "450ms"
 */
export function formatDuration(ms: number, compact = false): string {
  if (!isFinite(ms) || ms < 0) return "—";

  if (ms < 1_000) return `${Math.round(ms)}ms`;

  const totalSec = Math.floor(ms / 1_000);
  const h  = Math.floor(totalSec / 3_600);
  const m  = Math.floor((totalSec % 3_600) / 60);
  const s  = totalSec % 60;

  if (compact) {
    if (h > 0) return `${h}h${m > 0 ? `${m}m` : ""}`;
    if (m > 0) return `${m}m${s > 0 ? `${s}s` : ""}`;
    return `${s}s`;
  }

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${(ms / 1_000).toFixed(1)}s`;
}

// ─── Safe date parser ─────────────────────────────────────────────────────────

/**
 * Safely coerce an ISO string, Unix timestamp (ms), or null/undefined into a
 * Date. Returns `null` when the value is missing or invalid — never throws.
 */
export function parseApiDate(
  value: string | number | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function timeAgo(date: string | number | null | undefined): string {
  const d = parseApiDate(date);
  if (!d) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function fmtDate(
  date: string | number | null | undefined,
  pattern = "dd MMM yyyy, HH:mm",
): string {
  const d = parseApiDate(date);
  if (!d) return "—";
  return format(d, pattern);
}

/** Returns just the calendar date, e.g. "2024-06-01" — useful for groupBy keys */
export function fmtDateKey(date: string | number | null | undefined): string {
  return fmtDate(date, "yyyy-MM-dd");
}

// ─── Status colour maps ───────────────────────────────────────────────────────

export const statusColors: Record<BackupStatus, string> = {
  pending:   "text-terminal-yellow  bg-terminal-yellow/10  border-terminal-yellow/30",
  running:   "text-terminal-blue    bg-terminal-blue/10    border-terminal-blue/30",
  completed: "text-terminal-green   bg-terminal-green/10   border-terminal-green/30",
  failed:    "text-terminal-red     bg-terminal-red/10     border-terminal-red/30",
};

/** Unicode glyphs colocated with their status so icon choice never drifts */
export const statusIcons: Record<BackupStatus, string> = {
  pending:   "◌",
  running:   "◎",
  completed: "✓",
  failed:    "✗",
};

export const logLevelColors: Record<LogLevel, string> = {
  info:    "text-terminal-blue",
  warn:    "text-terminal-yellow",
  error:   "text-terminal-red",
  success: "text-terminal-green",
  debug:   "text-text-secondary",
};

export const dbLabels: Record<DbType, string> = {
  mysql:      "MySQL",
  postgresql: "PostgreSQL",
  mongodb:    "MongoDB",
  sqlite:     "SQLite",
};

export const backupTypeColors: Record<BackupType, string> = {
  full:         "text-acid",
  incremental:  "text-terminal-blue",
  differential: "text-terminal-yellow",
};

// ─── Compression ratio ────────────────────────────────────────────────────────

export interface CompressionResult {
  /** "37.4%" */
  percent: string;
  /** "37.4% saved" */
  label:   string;
  /** 0.374 */
  ratio:   number;
  saved:   number; // bytes saved
}

export function compressionSaved(
  before: number,
  after:  number,
): CompressionResult | null {
  if (!before || !after || before <= 0 || after <= 0) return null;

  const ratio   = (before - after) / before;
  const percent = `${(ratio * 100).toFixed(1)}%`;

  return {
    percent,
    label:  `${percent} saved`,
    ratio,
    saved:  before - after,
  };
}

// ─── Cron label ───────────────────────────────────────────────────────────────

const CRON_MAP: Record<string, string> = {
  "* * * * *":     "Every minute",
  "*/5 * * * *":   "Every 5 minutes",
  "*/15 * * * *":  "Every 15 minutes",
  "*/30 * * * *":  "Every 30 minutes",
  "0 * * * *":     "Every hour",
  "0 */2 * * *":   "Every 2 hours",
  "0 */6 * * *":   "Every 6 hours",
  "0 */12 * * *":  "Every 12 hours",
  "0 0 * * *":     "Daily at midnight",
  "0 6 * * *":     "Daily at 6 AM",
  "0 12 * * *":    "Daily at noon",
  "0 18 * * *":    "Daily at 6 PM",
  "0 0 * * 0":     "Weekly on Sunday",
  "0 0 * * 1":     "Weekly on Monday",
  "0 0 1 * *":     "Monthly on 1st",
  "0 0 1 1 *":     "Yearly on Jan 1st",
};

const WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Returns a human-readable label for common cron expressions, or the raw expression as fallback. */
export function cronLabel(expr: string): string {
  const trimmed = expr.trim();
  if (CRON_MAP[trimmed]) return CRON_MAP[trimmed];

  // Best-effort parser for patterns not in the static map
  const [min, hour, dom, mon, dow] = trimmed.split(" ");

  const everyN = (field: string, unit: string) => {
    const m = field.match(/^\*\/(\d+)$/);
    return m ? `Every ${m[1]} ${unit}` : null;
  };

  if (everyN(min,  "minutes")) return everyN(min,  "minutes")!;
  if (everyN(hour, "hours"))   return everyN(hour, "hours")!;

  // "At HH:MM on weekday"
  if (min !== "*" && hour !== "*" && dom === "*" && mon === "*" && dow !== "*") {
    const day = WEEKDAYS[parseInt(dow, 10)];
    if (day) return `Weekly on ${day} at ${hour.padStart(2,"0")}:${min.padStart(2,"0")}`;
  }

  // "At HH:MM on DOM of Month"
  if (min !== "*" && hour !== "*" && dom !== "*" && mon !== "*" && dow === "*") {
    const monthName = MONTHS[parseInt(mon, 10) - 1];
    return monthName
      ? `${monthName} ${dom} at ${hour.padStart(2,"0")}:${min.padStart(2,"0")}`
      : trimmed;
  }

  return trimmed;
}

// ─── String helpers ───────────────────────────────────────────────────────────

/**
 * Truncate a string to `max` chars.
 * @param position - "end" appends ellipsis, "middle" preserves start & end.
 */
export function truncate(
  str:      string,
  max:      number,
  position: "end" | "middle" = "end",
): string {
  if (str.length <= max) return str;

  if (position === "middle") {
    const half = Math.floor((max - 1) / 2);
    return `${str.slice(0, half)}…${str.slice(str.length - half)}`;
  }

  return `${str.slice(0, max - 1)}…`;
}

/**
 * Returns singular or plural form based on count.
 * @example pluralise(1, "backup") → "1 backup"
 * @example pluralise(3, "backup") → "3 backups"
 * @example pluralise(3, "entry", "entries") → "3 entries"
 */
export function pluralise(
  count:    number,
  singular: string,
  plural?:  string,
): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${word}`;
}

// ─── Numeric helpers ──────────────────────────────────────────────────────────

/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation between a and b at position t ∈ [0, 1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Map a value from one range to another. */
export function mapRange(
  value:  number,
  inMin:  number,
  inMax:  number,
  outMin: number,
  outMax: number,
): number {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// ─── Collection helpers ───────────────────────────────────────────────────────

/**
 * Group an array of objects by a key-returning function.
 * @example groupBy(logs, (l) => l.level)
 * @example groupBy(backups, (b) => fmtDateKey(b.createdAt))
 */
export function groupBy<T>(
  items:  T[],
  keyFn:  (item: T) => string,
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

/**
 * Sort an array of objects by a numeric or string field, non-mutating.
 * @example sortBy(backups, (b) => b.createdAt, "desc")
 */
export function sortBy<T>(
  items:  T[],
  keyFn:  (item: T) => string | number,
  dir:    "asc" | "desc" = "asc",
): T[] {
  return [...items].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Download helper ──────────────────────────────────────────────────────────

/**
 * Trigger a browser file download from a Blob or an object URL string.
 * Keeps download logic out of components entirely.
 */
export function downloadBlob(source: Blob | string, filename: string): void {
  const url =
    typeof source === "string" ? source : URL.createObjectURL(source);

  const a = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (typeof source !== "string") {
    // Revoke object URL after the browser has had time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}