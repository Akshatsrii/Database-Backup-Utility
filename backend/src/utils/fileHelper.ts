import fs   from "fs";
import path from "path";
import { logger } from "../config/logger";

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getFileSize(filePath: string): number {
  try { return fs.statSync(filePath).size; }
  catch { return 0; }
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted file: ${filePath}`);
    }
  } catch (err) {
    logger.error(`Failed to delete: ${filePath}`, { err });
  }
}

export function getBackupsDir(): string {
  const dir = path.join(process.cwd(), "backups");
  ensureDir(dir);
  return dir;
}

export function generateBackupFilename(
  dbName:     string,
  dbType:     string,
  backupType: string
): string {
  const ts = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  return `${dbName}_${dbType}_${backupType}_${ts}.sql`;
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function readFileBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

export function writeFileBuffer(filePath: string, data: Buffer): void {
  fs.writeFileSync(filePath, data);
}