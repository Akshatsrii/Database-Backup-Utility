import { exec }      from "child_process";
import { promisify } from "util";
import path          from "path";
import { logger }    from "../../config/logger";
import { getBackupsDir, generateBackupFilename } from "../../utils/fileHelper";
import type { DbConnection, BackupType } from "../../types";

const execAsync = promisify(exec);

export class PostgreSQLBackupService {

  async backup(
    connection: DbConnection,
    backupType: BackupType
  ): Promise<string> {
    const filename   = generateBackupFilename(connection.database, "postgresql", backupType);
    const outputPath = path.join(getBackupsDir(), filename);

    logger.info(`Starting PostgreSQL ${backupType} backup: ${connection.database}`);

    const { host, port, username, password, database } = connection;

    const env = { ...process.env, PGPASSWORD: password };

    let dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username}`;

    if (backupType === "full") {
      dumpCommand += ` --format=plain --verbose ${database}`;
    } else if (backupType === "incremental") {
      dumpCommand += ` --schema-only ${database}`;
    } else {
      dumpCommand += ` --format=plain ${database}`;
    }

    dumpCommand += ` > "${outputPath}"`;

    await execAsync(dumpCommand, { env });

    logger.info(`PostgreSQL backup completed: ${filename}`);
    return outputPath;
  }

  async testConnection(connection: DbConnection): Promise<boolean> {
    try {
      const { Pool } = await import("pg");
      const pool     = new Pool({
        host:     connection.host,
        port:     connection.port,
        user:     connection.username,
        password: connection.password,
        database: connection.database,
        connectionTimeoutMillis: 5000,
      });
      await pool.query("SELECT 1");
      await pool.end();
      return true;
    } catch {
      return false;
    }
  }
}

export const postgresqlBackupService = new PostgreSQLBackupService();