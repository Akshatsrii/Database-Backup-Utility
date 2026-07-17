import fs   from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { logger }   from "../config/logger";
import { getFileSize, deleteFile } from "../utils/fileHelper";

export class CompressionService {

  // ── Compress file → file.gz ───────────────────────────────────────────────
  async compress(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.gz`;

    logger.info(`Compressing: ${path.basename(inputPath)}`);

    const source = fs.createReadStream(inputPath);
    const dest   = fs.createWriteStream(outputPath);
    const gzip   = zlib.createGzip({ level: 9 });

    await pipeline(source, gzip, dest);

    const before = getFileSize(inputPath);
    const after  = getFileSize(outputPath);
    const ratio  = before > 0
      ? ((before - after) / before * 100).toFixed(1)
      : "0";

    logger.info(
      `Compressed: ${before} → ${after} bytes (${ratio}% saved)`,
    );

    // Delete original uncompressed file
    deleteFile(inputPath);

    return outputPath;
  }

  // ── Decompress file.gz → file ─────────────────────────────────────────────
  async decompress(inputPath: string): Promise<string> {
    if (!inputPath.endsWith(".gz")) {
      // Already decompressed — nothing to do
      return inputPath;
    }

    const outputPath = inputPath.replace(/\.gz$/, "");

    logger.info(`Decompressing: ${path.basename(inputPath)}`);

    const source = fs.createReadStream(inputPath);
    const dest   = fs.createWriteStream(outputPath);
    const gunzip = zlib.createGunzip();

    await pipeline(source, gunzip, dest);

    logger.info(`Decompressed to: ${outputPath}`);
    return outputPath;
  }

  // ── Compression ratio helper ──────────────────────────────────────────────
  getCompressionRatio(sizeBefore: number, sizeAfter: number): number {
    if (!sizeBefore || sizeBefore <= 0) return 0;
    return parseFloat(
      ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(2),
    );
  }
}

export const compressionService = new CompressionService();