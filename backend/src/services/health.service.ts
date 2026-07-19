import crypto from "crypto";
import fs from "fs";
import { logger } from "../config/logger";
import { backupStore } from "./backup/backup.service";

export class HealthService {
  /**
   * Generates SHA256 and calculates basic health score
   */
  async checkHealth(filePath: string): Promise<{ sha256: string; healthScore: number; isCorrupted: boolean }> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return resolve({ sha256: "", healthScore: 0, isCorrupted: true });
      }

      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);
      let size = 0;

      stream.on("data", (data) => {
        hash.update(data);
        size += data.length;
      });

      stream.on("end", () => {
        const fileHash = hash.digest("hex");
        // A simple heuristic: if it has size and can be read, it's basically healthy.
        // In a real scenario, you'd check header signatures, run test commands (e.g., zip -t), etc.
        const score = size > 0 ? 100 : 0;
        const corrupted = score === 0;

        resolve({
          sha256: fileHash,
          healthScore: score,
          isCorrupted: corrupted,
        });
      });

      stream.on("error", (err) => {
        logger.error(`HealthCheck error for ${filePath}:`, err);
        resolve({ sha256: "", healthScore: 0, isCorrupted: true });
      });
    });
  }

  /**
   * Deep verify can be called on demand. Re-checks the hash.
   */
  async deepVerify(backupId: string): Promise<boolean> {
    const backup = backupStore.find((b) => b.id === backupId);
    if (!backup) return false;

    try {
      const result = await this.checkHealth(backup.storagePath);
      backup.healthScore = result.healthScore;
      backup.isCorrupted = result.isCorrupted;
      
      if (backup.sha256 && backup.sha256 !== result.sha256) {
        backup.isCorrupted = true;
        backup.healthScore = 0;
      }
      return !backup.isCorrupted;
    } catch {
      return false;
    }
  }
}

export const healthService = new HealthService();
