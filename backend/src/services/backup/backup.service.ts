import { v4 as uuidv4 }  from "uuid";
import path               from "path";
import { logger }         from "../../config/logger";
import { compressionService }  from "../compression.service";
import { encryptionService }   from "../encryption.service";
import { localStorageService } from "../storage/local.storage";
import { firebaseStorageService } from "../storage/firebase.storage";
import { mysqlBackupService }      from "./mysql.service";
import { postgresqlBackupService } from "./postgresql.service";
import { mongodbBackupService }    from "./mongodb.service";
import { sqliteBackupService }     from "./sqlite.service";
import { getFileSize, deleteFile } from "../../utils/fileHelper";
import type {
  DbConnection,
  CreateBackupDto,
  Backup,
  BackupStatus,
} from "../../types";

// In-memory store (replace with DB in production)
export const backupStore: Backup[] = [];

export class BackupService {

  // Get all backups
  getAllBackups(): Backup[] {
    return [...backupStore].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  // Get single backup
  getBackupById(id: string): Backup | undefined {
    return backupStore.find((b) => b.id === id);
  }

  // Delete backup
  async deleteBackup(id: string): Promise<void> {
    const idx    = backupStore.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Backup not found");

    const backup = backupStore[idx];

    // Delete files
    deleteFile(backup.storagePath);
    if (backup.storageType === "firebase") {
      await firebaseStorageService.delete(path.basename(backup.storagePath));
    }

    backupStore.splice(idx, 1);
    logger.info(`Deleted backup: ${id}`);
  }

  // ─── Main backup method ───────────────────────────────────
  async createBackup(
    connection: DbConnection,
    dto: CreateBackupDto,
    emitLog: (msg: string) => void
  ): Promise<Backup> {

    const backup: Backup = {
      id:             uuidv4(),
      connectionId:   connection.id,
      connectionName: connection.name,
      dbType:         connection.type,
      backupType:     dto.backupType,
      status:         "pending",
      filename:       "",
      storagePath:    "",
      storageType:    dto.storageType,
      startedAt:      new Date().toISOString(),
      encrypted:      dto.encrypt ?? false,
    };

    backupStore.push(backup);

    try {
      backup.status = "running";
      const startTime = Date.now();

      // ── Step 1: Dump ────────────────────────────────────
      emitLog(`[${backup.id}] Connecting to ${connection.type}...`);
      let filePath = await this.runDump(connection, dto.backupType);
      const sizeBefore = getFileSize(filePath);
      backup.sizeBefore = sizeBefore;

      // ── Step 2: Compress ────────────────────────────────
      emitLog(`[${backup.id}] Compressing backup...`);
      filePath = await compressionService.compress(filePath);
      const sizeAfter = getFileSize(filePath);
      backup.sizeAfter         = sizeAfter;
      backup.compressionRatio  = compressionService.getCompressionRatio(sizeBefore, sizeAfter);

      // ── Step 3: Encrypt (optional) ──────────────────────
      if (dto.encrypt) {
        emitLog(`[${backup.id}] Encrypting backup...`);
        filePath = await encryptionService.encryptFile(filePath);
      }

      // ── Step 4: Store ───────────────────────────────────
      emitLog(`[${backup.id}] Uploading to ${dto.storageType}...`);
      const filename = path.basename(filePath);

      if (dto.storageType === "firebase") {
        await firebaseStorageService.upload(filePath, filename);
        backup.storagePath = `firebase://backups/${filename}`;
        // Keep local copy too
        await localStorageService.save(filePath, filename);
      } else {
        await localStorageService.save(filePath, filename);
        backup.storagePath = localStorageService.getPath(filename);
      }

      backup.filename     = filename;
      backup.status       = "completed";
      backup.completedAt  = new Date().toISOString();
      backup.durationMs   = Date.now() - startTime;

      emitLog(`[${backup.id}] Backup completed in ${backup.durationMs}ms`);
      logger.info(`Backup completed: ${backup.id}`);

    } catch (err) {
      backup.status       = "failed";
      backup.errorMessage = (err as Error).message;
      backup.completedAt  = new Date().toISOString();
      emitLog(`[${backup.id}] Backup failed: ${backup.errorMessage}`);
      logger.error(`Backup failed: ${backup.id}`, { err });
    }

    return backup;
  }

  // ─── Run the correct dump ─────────────────────────────────
  private async runDump(
    connection: DbConnection,
    backupType: import("../../types").BackupType
  ): Promise<string> {
    switch (connection.type) {
      case "mysql":      return mysqlBackupService.backup(connection, backupType);
      case "postgresql": return postgresqlBackupService.backup(connection, backupType);
      case "mongodb":    return mongodbBackupService.backup(connection, backupType);
      case "sqlite":     return sqliteBackupService.backup(connection, backupType);
      default: throw new Error(`Unsupported DB type: ${connection.type}`);
    }
  }

  // ─── Test connection ──────────────────────────────────────
  async testConnection(connection: DbConnection): Promise<boolean> {
    switch (connection.type) {
      case "mysql":      return mysqlBackupService.testConnection(connection);
      case "postgresql": return postgresqlBackupService.testConnection(connection);
      case "mongodb":    return mongodbBackupService.testConnection(connection);
      case "sqlite":     return sqliteBackupService.testConnection(connection);
      default: return false;
    }
  }
}

export const backupService = new BackupService();