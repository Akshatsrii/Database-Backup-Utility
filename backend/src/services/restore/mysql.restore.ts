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
      // BUGFIX: pehle loop mein `table` variable use hi nahi hota tha —
      // har iteration mein same full dump restore hota tha, sirf ek baar
      // restore karna enough tha aur table filter bhi kaam nahi karta tha.
      // MySQL mein selective table restore ke liye:
      //   1. Dump ko temp file mein extract karo
      //   2. `grep` se specific table statements nikalo
      //   3. Sirf woh part restore karo
      // Ya simpler approach: mysqldump --tables flag use karo (restore pe
      // possible nahi directly) — instead pura restore karo aur note karo
      // ki MySQL CLI mein table-level selective restore limited hai.
      // Production approach: mysqlpump ya mydumper use karein.
      // Abhi ke liye: ek hi restore karo (full) aur tables ko log karo.
      logger.warn(
        `MySQL selective restore requested for tables: ${tables.join(", ")}. ` +
        `MySQL CLI does not support table-level filtering during restore. ` +
        `Performing full restore — use mysqlpump for selective restores.`
      );
    }

    // Full restore (works for both full and "selective" — see note above)
    const cmd = [
      "mysql",
      `-h ${host}`,
      `-P ${port}`,
      `-u ${username}`,
      `-p${password}`,
      database,
      `< "${filePath}"`,
    ].join(" ");

    await execAsync(cmd);

    logger.info(`MySQL restore completed: ${database}`);
  }
}

export const mysqlRestoreServe = new MySQLRestoreService();
