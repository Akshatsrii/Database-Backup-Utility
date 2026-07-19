import { logger }        from "../config/logger";
import { backupStore }   from "../services/backup/backup.service";
import { ENV }           from "../config/env";
import { subDays }       from "date-fns";
import fs                from "fs";
import path              from "path";

export async function runRetentionCleanup(): Promise<void> {
  const cutoff = subDays(new Date(), ENV.BACKUP_RETENTION_DAYS);
  const keepCount = 5; // Default Keep Last N

  // Group backups by connection
  const byConnection: Record<string, typeof backupStore> = {};
  for (const b of backupStore) {
    if (!byConnection[b.connectionId]) byConnection[b.connectionId] = [];
    byConnection[b.connectionId].push(b);
  }

  const toDelete = [];

  for (const connId in byConnection) {
    // Sort backups newest first
    const connBackups = byConnection[connId].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    
    // Keep first N (keepCount)
    const candidates = connBackups.slice(keepCount);
    
    // Out of the remaining, delete those older than X days
    for (const b of candidates) {
      if (new Date(b.startedAt) < cutoff) {
        toDelete.push(b);
      }
    }
  }

  if (toDelete.length === 0) return;

  logger.info(`Retention cleanup: archiving ${toDelete.length} old backups`);
  
  const archiveDir = path.join(process.cwd(), "archives");
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

  for (const backup of toDelete) {
    try {
      if (fs.existsSync(backup.storagePath)) {
        // Archive instead of delete
        const archivePath = path.join(archiveDir, backup.filename);
        fs.renameSync(backup.storagePath, archivePath);
        backup.storagePath = archivePath; // update path
        backup.status = "completed"; // could introduce 'archived' status
      }
      // Note: we don't remove from backupStore so we can still preview archived files
      // or we can remove it and keep an archiveStore. We'll just leave it for now.
      logger.info(`Retention: archived backup ${backup.id} (${backup.version})`);
    } catch (err) {
      logger.error(`Retention: failed to archive ${backup.id}`, { err });
    }
  }
}

export function getCleanupPreview() {
  const cutoff = subDays(new Date(), ENV.BACKUP_RETENTION_DAYS);
  const keepCount = 5;
  const byConnection: Record<string, typeof backupStore> = {};
  for (const b of backupStore) {
    if (!byConnection[b.connectionId]) byConnection[b.connectionId] = [];
    byConnection[b.connectionId].push(b);
  }

  const preview = [];
  for (const connId in byConnection) {
    const connBackups = byConnection[connId].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    const candidates = connBackups.slice(keepCount);
    for (const b of candidates) {
      if (new Date(b.startedAt) < cutoff) {
        preview.push(b);
      }
    }
  }
  return preview;
}