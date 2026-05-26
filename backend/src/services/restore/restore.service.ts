import { v4 as uuidv4 } from "uuid";
import path              from "path";
import { logger }        from "../../config/logger";
import { compressionService } from "../compression.service";
import { encryptionService }  from "../encryption.service";
import { localStorageService } from "../storage/local.storage";
import { firebaseStorageService } from "../storage/firebase.storage";
import { mysqlRestoreService }      from "./mysql.restore";
import { postgresqlRestoreService } from "./postgresql.restore";
import { mongodbRestoreService }    from "./mongodb.restore";
import { sqliteRestoreService }     from "./sqlite.restore";
import { backupStore } from "../backup/backup.service";
import { getBackupsDir } from "../../utils/fileHelper";
import type { DbConnection, RestoreDto, RestoreJob } from "../../types";

export const restoreStore: RestoreJob[] = [];

export class RestoreService {

  getAllJobs(): RestoreJob[] {
    return [...restoreStore].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async restore(
    connection: DbConnection,
    dto: RestoreDto,
    emitLog: (msg: string) => void
  ): Promise<RestoreJob> {

    const backup = backupStore.find((b) => b.id === dto.backupId);
    if (!backup) throw new Error("Backup not found");

    const job: RestoreJob = {
      id:           uuidv4(),
      backupId:     dto.backupId,
      connectionId: dto.connectionId,
      status:       "running",
      tables:       dto.tables,
      startedAt:    new Date().toISOString(),
    };

    restoreStore.push(job);

    try {
      emitLog(`[${job.id}] Starting restore from ${backup.filename}`);

      // ── Step 1: Get file ──────────────────────────────
      let filePath = localStorageService.getPath(backup.filename);

      if (!localStorageService.exists(backup.filename)) {
        // Download from Firebase
        emitLog(`[${job.id}] Downloading from Firebase...`);
        await firebaseStorageService.download(
          backup.filename,
          path.join(getBackupsDir(), backup.filename)
        );
        filePath = localStorageService.getPath(backup.filename);
      }

      // ── Step 2: Decrypt if encrypted ──────────────────
      if (backup.encrypted) {
        emitLog(`[${job.id}] Decrypting backup...`);
        filePath = await encryptionService.decryptFile(filePath);
      }

      // ── Step 3: Decompress ─────────────────────────────
      if (filePath.endsWith(".gz")) {
        emitLog(`[${job.id}] Decompressing backup...`);
        filePath = await compressionService.decompress(filePath);
      }

      // ── Step 4: Restore ────────────────────────────────
      emitLog(`[${job.id}] Restoring to ${connection.type}...`);
      await this.runRestore(connection, filePath, dto.tables);

      job.status      = "completed";
      job.completedAt = new Date().toISOString();

      emitLog(`[${job.id}] Restore completed successfully`);
      logger.info(`Restore completed: ${job.id}`);

    } catch (err) {
      job.status       = "failed";
      job.errorMessage = (err as Error).message;
      job.completedAt  = new Date().toISOString();
      emitLog(`[${job.id}] Restore failed: ${job.errorMessage}`);
      logger.error(`Restore failed: ${job.id}`, { err });
    }

    return job;
  }

  private async runRestore(
    connection: DbConnection,
    filePath:   string,
    tables?:    string[]
  ): Promise<void> {
    switch (connection.type) {
      case "mysql":
        return mysqlRestoreService.restore(connection, filePath, tables);
      case "postgresql":
        return postgresqlRestoreService.restore(connection, filePath, tables);
      case "mongodb":
        return mongodbRestoreService.restore(connection, filePath, tables);
      case "sqlite":
        return sqliteRestoreService.restore(connection, filePath);
      default:
        throw new Error(`Unsupported DB type: ${connection.type}`);
    }
  }
}

export const restoreService = new RestoreService();