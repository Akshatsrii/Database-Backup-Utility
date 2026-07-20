// =============================================================================
// Primitive utilities
// =============================================================================

/** Make specific keys optional while keeping the rest required. */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific keys required while keeping the rest as-is. */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/** Wrap a type to allow null. */
export type Nullable<T> = T | null;

/** Recursively make every property readonly. */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

// =============================================================================
// Branded ID types
// Prevents accidental cross-domain ID substitution at compile time.
// =============================================================================

declare const __brand: unique symbol;
type Brand<T, B> = T & { [__brand]: B };

export type ConnectionId = Brand<string, "ConnectionId">;
export type BackupId     = Brand<string, "BackupId">;
export type ScheduleId   = Brand<string, "ScheduleId">;
export type RestoreJobId = Brand<string, "RestoreJobId">;
export type LogEntryId   = Brand<string, "LogEntryId">;

/** Cast a plain string to a branded ID — use only at API boundary / test factories. */
export const asConnectionId  = (s: string): ConnectionId  => s as ConnectionId;
export const asBackupId      = (s: string): BackupId      => s as BackupId;
export const asScheduleId    = (s: string): ScheduleId    => s as ScheduleId;
export const asRestoreJobId  = (s: string): RestoreJobId  => s as RestoreJobId;
export const asLogEntryId    = (s: string): LogEntryId    => s as LogEntryId;

// =============================================================================
// Shared literals
// =============================================================================

export type DbType            = "mysql" | "postgresql" | "mongodb" | "sqlite";
export type BackupType        = "full" | "incremental" | "differential";
export type StorageType       = "local" | "firebase";
export type ScheduleFrequency = "hourly" | "daily" | "weekly" | "monthly";
export type LogLevel          = "info" | "warn" | "error" | "success" | "debug";

// =============================================================================
// Status — discriminated unions
// Narrowing on `status` gives TypeScript the precise shape automatically.
// =============================================================================

export type BackupStatus  = "pending" | "running" | "completed" | "failed";
export type RestoreStatus = "idle"    | "running" | "completed" | "failed";

// ─── Backup progress stage (ordered) ─────────────────────────────────────────

export type BackupStage =
  | "connecting"
  | "dumping"
  | "compressing"
  | "encrypting"
  | "uploading"
  | "completed"
  | "failed";

/** Ordered list of non-terminal stages — useful for stepper UIs. */
export const BACKUP_STAGE_ORDER: readonly BackupStage[] = [
  "connecting",
  "dumping",
  "compressing",
  "encrypting",
  "uploading",
  "completed",
] as const;

// =============================================================================
// Timestamps mixin
// =============================================================================

interface Timestamps {
  createdAt:  string;
  updatedAt?: string;
}

// =============================================================================
// Connection
// =============================================================================

export interface DbConnection extends Timestamps {
  id:        ConnectionId;
  name:      string;
  type:      DbType;
  host:      string;
  port:      number;
  username:  string;
  password?: string;
  database:  string;
}

export interface ConnectionTestResult {
  success:    boolean;
  message:    string;
  latencyMs?: number;
}

// =============================================================================
// Backup — discriminated by status
// =============================================================================

interface BackupBase extends Timestamps {
  id:               BackupId;
  connectionId:     ConnectionId;
  connectionName:   string;
  dbType:           DbType;
  backupType:       BackupType;
  filename:         string;
  storagePath:      string;
  storageType:      StorageType;
  encrypted:        boolean;
  startedAt:        string;
}

export interface PendingBackup extends BackupBase {
  status: "pending";
  completedAt?:      never;
  durationMs?:       never;
  sizeBefore?:       never;
  sizeAfter?:        never;
  compressionRatio?: never;
  errorMessage?:     never;
}

export interface RunningBackup extends BackupBase {
  status:            "running";
  completedAt?:      never;
  durationMs?:       never;
  sizeBefore?:       number;
  sizeAfter?:        never;
  compressionRatio?: never;
  errorMessage?:     never;
}

export interface CompletedBackup extends BackupBase {
  status:           "completed";
  completedAt:      string;
  durationMs:       number;
  sizeBefore?:      number;
  sizeAfter?:       number;
  compressionRatio?: number;
  errorMessage?:    never;
}

export interface FailedBackup extends BackupBase {
  status:           "failed";
  completedAt?:     string;
  durationMs?:      number;
  sizeBefore?:      number;
  sizeAfter?:       never;
  compressionRatio?: never;
  errorMessage:     string;
}

export type Backup =
  | PendingBackup
  | RunningBackup
  | CompletedBackup
  | FailedBackup;

// ─── Backup progress ──────────────────────────────────────────────────────────

export interface BackupProgress {
  backupId: BackupId;
  stage:    BackupStage;
  percent:  number;        // 0–100
  message:  string;
}

// =============================================================================
// Restore — discriminated by status
// =============================================================================

interface RestoreJobBase extends Timestamps {
  id:           RestoreJobId;
  backupId:     BackupId;
  connectionId: ConnectionId;
  /** undefined or empty = full restore */
  tables?:      string[];
  startedAt:    string;
}

export interface IdleRestoreJob extends RestoreJobBase {
  status:        "idle";
  completedAt?:  never;
  errorMessage?: never;
}

export interface RunningRestoreJob extends RestoreJobBase {
  status:        "running";
  completedAt?:  never;
  errorMessage?: never;
}

export interface CompletedRestoreJob extends RestoreJobBase {
  status:       "completed";
  completedAt:  string;
  errorMessage?: never;
}

export interface FailedRestoreJob extends RestoreJobBase {
  status:        "failed";
  completedAt?:  string;
  errorMessage:  string;
}

export type RestoreJob =
  | IdleRestoreJob
  | RunningRestoreJob
  | CompletedRestoreJob
  | FailedRestoreJob;

// =============================================================================
// Schedule
// =============================================================================

export interface Schedule extends Timestamps {
  id:               ScheduleId;
  connectionId:     ConnectionId;
  connectionName:   string;
  frequency:        ScheduleFrequency;
  cronExpression:   string;
  backupType:       BackupType;
  enabled:          boolean;
  lastRun?:         string;
  nextRun?:         string;
}

// =============================================================================
// Log
// =============================================================================

export interface LogEntry extends Timestamps {
  id:        LogEntryId;
  level:     LogLevel;
  message:   string;
  meta?:     Record<string, unknown>;
  timestamp: string;
}

// =============================================================================
// Stats
// =============================================================================

/** Generic history point — used by charts */
export interface HistoryPoint {
  date:  string;
  value: number;
}

/** Size history point — exactly what backend sends */
export interface SizeHistoryPoint {
  date:  string;
  bytes: number;
}

/** Rate history point — exactly what backend sends */
export interface RateHistoryPoint {
  date: string;
  rate: number;
}

export interface DashboardStats {
  totalBackups:       number;
  successfulBackups:  number;
  failedBackups:      number;
  totalStorageBytes:  number;
  activeConnections:  number;
  schedulesActive:    number;
  /** Backend key — array of {date, bytes} */
  backupsSizeHistory: SizeHistoryPoint[];
  /** Backend key — array of {date, rate} */
  successRateHistory: RateHistoryPoint[];
  /** @deprecated alias for backupsSizeHistory — will be removed */
  storageHistory?:    HistoryPoint[];
  aiInsights?:        any[];
}

/** @deprecated Use DashboardStats — kept so old imports don't break */
export type Stats = DashboardStats;

// =============================================================================
// API response envelope
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?:   T;
  message?: string;
  error?:  string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total:    number;
  page:     number;
  pageSize: number;
  hasMore:  boolean;
}

/** Structured per-field validation errors — used by form error handling. */
export interface ValidationError {
  field:   string;
  message: string;
  code?:   string;
}

export interface ApiValidationResponse {
  success: false;
  message: string;
  errors:  ValidationError[];
}

// =============================================================================
// DTOs
// =============================================================================

export interface CreateConnectionDto {
  name:     string;
  type:     DbType;
  host:     string;
  port:     number;
  username: string;
  password: string;
  database: string;
}

export type UpdateConnectionDto = PartialBy<
  Omit<CreateConnectionDto, "type">,
  "password"
>;

export interface CreateBackupDto {
  connectionId: string;   // plain string at API boundary
  backupType:   BackupType;
  storageType:  StorageType;
  encrypt?:     boolean;
}

export interface CreateScheduleDto {
  connectionId: string;   // plain string at API boundary
  frequency:    ScheduleFrequency;
  backupType:   BackupType;
  /** When omitted the server derives the cron from frequency. */
  cronExpression?: string;
}

export type UpdateScheduleDto = Partial<
  Pick<CreateScheduleDto, "frequency" | "backupType" | "cronExpression"> & {
    enabled: boolean;
  }
>;

export interface RestoreDto {
  backupId:     string;   // plain string at API boundary
  connectionId: string;
  tables?:      string[];
}

// =============================================================================
// WebSocket event union
// Typed WS messages for live progress and log streaming.
// =============================================================================

export interface WsBackupProgressEvent {
  type:    "backup:progress";
  payload: BackupProgress;
}

export interface WsBackupCompletedEvent {
  type:    "backup:completed";
  payload: CompletedBackup;
}

export interface WsBackupFailedEvent {
  type:    "backup:failed";
  payload: FailedBackup;
}

export interface WsRestoreProgressEvent {
  type:    "restore:progress";
  payload: Pick<RestoreJob, "id" | "status"> & { percent: number };
}

export interface WsLogEvent {
  type:    "log";
  payload: LogEntry;
}

export interface WsPingEvent {
  type: "ping";
}

export type WebSocketEvent =
  | WsBackupProgressEvent
  | WsBackupCompletedEvent
  | WsBackupFailedEvent
  | WsRestoreProgressEvent
  | WsLogEvent
  | WsPingEvent;

/** Narrow a raw WS message to a typed event — returns null on parse failure. */
export function parseWsEvent(raw: unknown): WebSocketEvent | null {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) return null;
  // Runtime narrowing is minimal here — pair with a zod schema in production.
  return raw as WebSocketEvent;
}