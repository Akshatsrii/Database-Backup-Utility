import { logger }        from "../config/logger";
import { backupStore }   from "../services/backup/backup.service";
import { deleteFile }    from "../utils/fileHelper";
import { ENV }           from "../config/env";
import { subDays }       from "date-fns";

// Delete backups older than retention days
export async function runRetentionCleanup(): Promise<void> {
  const cutoff    = subDays(new Date(), ENV.BACKUP_RETENTION_DAYS);
  const toDelete  = backupStore.filter(
    (b) => new Date(b.startedAt) < cutoff
  );

  if (toDelete.length === 0) return;

  logger.info(`Retention cleanup: removing ${toDelete.length} old backups`);

  for (const backup of toDelete) {
    try {
      deleteFile(backup.storagePath);
      const idx = backupStore.findIndex((b) => b.id === backup.id);
      if (idx !== -1) backupStore.splice(idx, 1);
      logger.info(`Retention: deleted backup ${backup.id}`);
    } catch (err) {
      logger.error(`Retention: failed to delete ${backup.id}`, { err });
    }
  }
}