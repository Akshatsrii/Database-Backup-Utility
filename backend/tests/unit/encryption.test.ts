import crypto from "crypto";
import fs     from "fs";
import path   from "path";
import { logger } from "../config/logger";
import { ENV }    from "../config/env";
import { deleteFile } from "../utils/fileHelper";

const ALGORITHM  = "aes-256-cbc";
const IV_LENGTH  = 16;

export class EncryptionService {
  private key: Buffer;

  constructor() {
    // Key must be exactly 32 bytes for AES-256
    this.key = Buffer.from(ENV.ENCRYPTION_KEY.slice(0, 32).padEnd(32, "0"));
  }

  // Encrypt file → file.enc
  async encryptFile(inputPath: string): Promise<string> {
    const outputPath = `${inputPath}.enc`;
    const iv         = crypto.randomBytes(IV_LENGTH);
    const cipher     = crypto.createCipheriv(ALGORITHM, this.key, iv);

    logger.info(`Encrypting: ${path.basename(inputPath)}`);

    const input  = fs.readFileSync(inputPath);
    const encrypted = Buffer.concat([iv, cipher.update(input), cipher.final()]);

    fs.writeFileSync(outputPath, encrypted);

    // Delete original
    deleteFile(inputPath);

    logger.info(`Encrypted: ${path.basename(outputPath)}`);
    return outputPath;
  }

  // Decrypt file.enc → file
  async decryptFile(inputPath: string): Promise<string> {
    if (!inputPath.endsWith(".enc")) return inputPath;

    const outputPath = inputPath.replace(/\.enc$/, "");

    logger.info(`Decrypting: ${path.basename(inputPath)}`);

    const data      = fs.readFileSync(inputPath);
    const iv        = data.subarray(0, IV_LENGTH);
    const encrypted = data.subarray(IV_LENGTH);
    const decipher  = crypto.createDecipheriv(ALGORITHM, this.key, iv);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    fs.writeFileSync(outputPath, decrypted);

    logger.info(`Decrypted to: ${outputPath}`);
    return outputPath;
  }

  // Encrypt string
  encryptString(text: string): string {
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    const enc    = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${enc.toString("hex")}`;
  }

  // Decrypt string
  decryptString(text: string): string {
    const [ivHex, encHex] = text.split(":");
    const iv       = Buffer.from(ivHex, "hex");
    const enc      = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  }
}

export const encryptionService = new EncryptionService();