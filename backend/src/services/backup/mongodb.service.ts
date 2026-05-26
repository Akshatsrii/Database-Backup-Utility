import { exec }      from "child_process";
import { promisify } from "util";
import path          from "path";
import { logger }    from "../../config/logger";
import { getBackupsDir } from "../../utils/fileHelper";
import type { DbConnection, BackupType } from "../../types";

const execAsync = promisify(exec);

export class MongoDBBackupService {

  async backup(
    connection: DbConnection,
    backupType: BackupType
  ): Promise<string> {
    const ts         = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename   = `${connection.database}_mongodb_${backupType}_${ts}`;
    const outputPath = path.join(getBackupsDir(), filename);

    logger.info(`Starting MongoDB ${backupType} backup: ${connection.database}`);

    const { host, port, username, password, database } = connection;

    const uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;

    let command = `mongodump --uri="${uri}" --out="${outputPath}"`;

    if (backupType === "incremental") {
      // Only dump indexes for incremental
      command += " --dumpDbUsersAndRoles";
    }

    await execAsync(command);

    // Tar the directory to single file
    const tarPath = `${outputPath}.tar.gz`;
    await execAsync(`tar -czf "${tarPath}" -C "${getBackupsDir()}" "${filename}"`);
    await execAsync(`rm -rf "${outputPath}"`);

    logger.info(`MongoDB backup completed: ${filename}.tar.gz`);
    return tarPath;
  }

  async testConnection(connection: DbConnection): Promise<boolean> {
    try {
      const { MongoClient } = await import("mongodb");
      const uri    = `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      await client.db().command({ ping: 1 });
      await client.close();
      return true;
    } catch {
      return false;
    }
  }
}

export const mongodbBackupService = new MongoDBBackupService();