import fs   from "fs";
import path from "path";
import { logger } from "../../config/logger";
import { getBackupsDir, generateBackupFilename } from "../../utils/fileHelper";
import type { DbConnection, BackupType } from "../../types";

export class SQLiteBackupService {

  async backup(
    connection: DbConnection,
    backupType: BackupType
  ): Promise<string> {
    const filename   = generateBackupFilename(connection.database, "sqlite", backupType);
    const outputPath = path.join(getBackupsDir(), filename);

    logger.info(`Starting SQLite ${backupType} backup: ${connection.database}`);

    // SQLite backup = copy the .db file
    const dbPath = connection.database; // SQLite uses file path as database name

    if (!fs.existsSync(dbPath)) {
      throw new Error(`SQLite database file not found: ${dbPath}`);
    }

    fs.copyFileSync(dbPath, outputPath);

    logger.info(`SQLite backup completed: ${filename}`);
    return outputPath;
  }

  async testConnection(connection: DbConnection): Promise<boolean> {
    try {
      const Database = (await import("better-sqlite3")).default;
      const db = new Database(connection.database, { readonly: true });
      db.prepare("SELECT 1").get();
      db.close();
      return true;
    } catch {
      return false;
    }
  }
}

export const sqliteBackupService = new SQLiteBackupService();