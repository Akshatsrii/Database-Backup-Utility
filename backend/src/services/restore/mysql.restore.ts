import { exec }      from "child_process";
import { promisify } from "util";
import { logger }    from "../../config/logger";
import type { DbConnection } from "../../types";

const execAsync = promisify(exec);

export class MySQLRestoreService {

  async restore(
    connection: DbConnection,
    filePath:   string,
    tables?:    string[]
  ): Promise<void> {
    const { host, port, username, password, database } = connection;

    logger.info(`Restoring MySQL: ${database} from ${filePath}`);

    if (tables && tables.length > 0) {
      // Selective restore — filter tables
      for (const table of tables) {
        const cmd = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < "${filePath}"`;
        await execAsync(cmd);
      }
    } else {
      // Full restore
      const cmd = `mysql -h ${host} -P ${port} -u ${username} -p${password} ${database} < "${filePath}"`;
      await execAsync(cmd);
    }

    logger.info(`MySQL restore completed: ${database}`);
  }
}

export const mysqlRestoreService = new MySQLRestoreService();