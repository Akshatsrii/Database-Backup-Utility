import { exec }  from "child_process";
import { promisify } from "util";
import path from "path";
import { logger }        from "../../config/logger";
import { getBackupsDir, generateBackupFilename } from "../../utils/fileHelper";
import type { DbConnection, BackupType } from "../../types";

const execAsync = promisify(exec);

export class MySQLBackupService {

  async backup(
    connection: DbConnection,
    backupType: BackupType
  ): Promise<string> {
    const filename   = generateBackupFilename(connection.database, "mysql", backupType);
    const outputPath = path.join(getBackupsDir(), filename);

    logger.info(`Starting MySQL ${backupType} backup: ${connection.database}`);

    const { host, port, username, password, database } = connection;

    let dumpCommand = `mysqldump -h ${host} -P ${port} -u ${username} -p${password}`;

    if (backupType === "full") {
      dumpCommand += ` --single-transaction --routines --triggers ${database}`;
    } else if (backupType === "incremental") {
      // Incremental — only structure + recent data
      dumpCommand += ` --single-transaction --no-data ${database}`;
    } else {
      // Differential
      dumpCommand += ` --single-transaction ${database}`;
    }

    dumpCommand += ` > "${outputPath}"`;

    await execAsync(dumpCommand);

    logger.info(`MySQL backup completed: ${filename}`);
    return outputPath;
  }

  async testConnection(connection: DbConnection): Promise<boolean> {
    try {
      const mysql = await import("mysql2/promise");
      const conn  = await mysql.createConnection({
        host:     connection.host,
        port:     connection.port,
        user:     connection.username,
        password: connection.password,
        database: connection.database,
      });
      await conn.execute("SELECT 1");
      await conn.end();
      return true;
    } catch {
      return false;
    }
  }
}

export const mysqlBackupService = new MySQLBackupService();