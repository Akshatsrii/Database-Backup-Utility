import fs   from "fs";
import { logger } from "../../config/logger";
import type { DbConnection } from "../../types";

export class SQLiteRestoreService {

  async restore(
    connection: DbConnection,
    filePath:   string
  ): Promise<void> {
    logger.info(`Restoring SQLite: ${connection.database} from ${filePath}`);

    // SQLite restore = overwrite the .db file
    fs.copyFileSync(filePath, connection.database);

    logger.info(`SQLite restore completed: ${connection.database}`);
  }
}

export const sqliteRestoreService = new SQLiteRestoreService();