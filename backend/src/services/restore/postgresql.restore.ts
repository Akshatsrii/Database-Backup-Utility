import { exec }      from "child_process";
import { promisify } from "util";
import { logger }    from "../../config/logger";
import type { DbConnection } from "../../types";

const execAsync = promisify(exec);

export class PostgreSQLRestoreService {

  async restore(
    connection: DbConnection,
    filePath:   string,
    tables?:    string[]
  ): Promise<void> {
    const { host, port, username, password, database } = connection;
    const env = { ...process.env, PGPASSWORD: password };

    logger.info(`Restoring PostgreSQL: ${database} from ${filePath}`);

    if (tables && tables.length > 0) {
      for (const table of tables) {
        const cmd = `psql -h ${host} -p ${port} -U ${username} -d ${database} -t ${table} < "${filePath}"`;
        await execAsync(cmd, { env });
      }
    } else {
      const cmd = `psql -h ${host} -p ${port} -U ${username} -d ${database} < "${filePath}"`;
      await execAsync(cmd, { env });
    }

    logger.info(`PostgreSQL restore completed: ${database}`);
  }
}

export const postgresqlRestoreService = new PostgreSQLRestoreService();