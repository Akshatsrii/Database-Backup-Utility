import fs   from "fs";
import path from "path";
import { logger }       from "../../config/logger";
import { getBackupsDir, deleteFile } from "../../utils/fileHelper";

export class LocalStorageService {

  // Save backup file to local backups folder
  async save(sourcePath: string, filename: string): Promise<string> {
    const destDir  = getBackupsDir();
    const destPath = path.join(destDir, filename);

    fs.copyFileSync(sourcePath, destPath);
    logger.info(`Saved locally: ${destPath}`);

    return destPath;
  }

  // Get full path of a backup
  getPath(filename: string): string {
    return path.join(getBackupsDir(), filename);
  }

  // Delete local backup
  async delete(filename: string): Promise<void> {
    const filePath = path.join(getBackupsDir(), filename);
    deleteFile(filePath);
  }

  // Check if file exists locally
  exists(filename: string): boolean {
    const filePath = path.join(getBackupsDir(), filename);
    return fs.existsSync(filePath);
  }

  // List all local backups
  listFiles(): string[] {
    const dir = getBackupsDir();
    return fs.readdirSync(dir).filter((f) =>
      f.endsWith(".sql") ||
      f.endsWith(".gz")  ||
      f.endsWith(".enc")
    );
  }

  // Get file as readable stream (for download)
  getReadStream(filename: string): fs.ReadStream {
    const filePath = path.join(getBackupsDir(), filename);
    return fs.createReadStream(filePath);
  }
}

export const localStorageService = new LocalStorageService();