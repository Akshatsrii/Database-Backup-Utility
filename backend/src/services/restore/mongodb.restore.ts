import { exec }      from "child_process";
import { promisify } from "util";
import path          from "path";
import { logger }    from "../../config/logger";
import { getBackupsDir } from "../../utils/fileHelper";
import type { DbConnection } from "../../types";

const execAsync = promisify(exec);

export class MongoDBRestoreService {

  async restore(
    connection: DbConnection,
    filePath:   string,
    tables?:    string[]
  ): Promise<void> {
    const { host, port, username, password, database } = connection;

    logger.info(`Restoring MongoDB: ${database} from ${filePath}`);

    // Extract tar first
    const extractDir = path.join(getBackupsDir(), `restore_${Date.now()}`);
    await execAsync(`mkdir -p "${extractDir}" && tar -xzf "${filePath}" -C "${extractDir}"`);

    const uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
    let cmd   = `mongorestore --uri="${uri}" --dir="${extractDir}"`;

    if (tables && tables.length > 0) {
      cmd += ` --collection="${tables[0]}"`;
    }

    await execAsync(cmd);

    // Cleanup
    await execAsync(`rm -rf "${extractDir}"`);

    logger.info(`MongoDB restore completed: ${database}`);
  }
}

export const mongodbRestoreService = new MongoDBRestoreService();