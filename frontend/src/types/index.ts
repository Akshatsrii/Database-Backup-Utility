// ─── Database Types ────────────────────────────────────────────────────────
export type DbType = "mysql" | "postgresql" | "mongodb" | "sqlite";

export type BackupType = "full" | "incremental" | "differential";

export type BackupStatus = "pending" | "running" | "completed" | "failed";

export type RestoreStatus = "idle" | "running" | "completed" | "failed";

export type ScheduleFrequency = "hourly" | "daily" | "weekly" | "monthly";

// ─── Connection ────────────────────────────────────────────────────────────
export interface DbConnection {
  id: string;
  name: string;
  type: DbType;
  host: string;
  port: number;
  username: string;
  password?: string;
  database: string;
  createdAt: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
}

// ─── Backup ────────────────────────────────────────────────────────────────
export interface Backup {
  id: string;
  connectionId: string;
  connectionName: string;
  dbType: DbType;
  backupType: BackupType;
  status: BackupStatus;
  filename: string;
  sizeBefore?: number;   // bytes
  sizeAfter?: number;    // bytes — after compression
  compressionRatio?: number;
  storagePath: string;
  storageType: "local" | "firebase" | "s3";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  encrypted: boolean;
}

export interface BackupProgress {
  backupId: string;
  stage: "connecting" | "dumping" | "compressing" | "encrypting" | "uploading" | "completed" | "failed";
  percent: number;
  message: string;
}

// ─── Restore ───────────────────────────────────────────────────────────────
export interface RestoreJob {
  id: string;
  backupId: string;
  connectionId: string;
  status: RestoreStatus;
  tables?: string[];       // empty = full restore
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

// ─── Schedule ──────────────────────────────────────────────────────────────
export interface Schedule {
  id: string;
  connectionId: string;
  connectionName: string;
  frequency: ScheduleFrequency;
  cronExpression: string;
  backupType: BackupType;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}

// ─── Log ───────────────────────────────────────────────────────────────────
export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

// ─── Stats ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalStorageBytes: number;
  activeConnections: number;
  schedulesActive: number;
  backupsSizeHistory: { date: string; bytes: number }[];
  successRateHistory: { date: string; rate: number }[];
}

// ─── API Response ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── Create / Request DTOs ─────────────────────────────────────────────────
export interface CreateConnectionDto {
  name: string;
  type: DbType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface CreateBackupDto {
  connectionId: string;
  backupType: BackupType;
  storageType: "local" | "firebase" | "s3";
  encrypt?: boolean;
}

export interface CreateScheduleDto {
  connectionId: string;
  frequency: ScheduleFrequency;
  backupType: BackupType;
}

export interface RestoreDto {
  backupId: string;
  connectionId: string;
  tables?: string[];
}