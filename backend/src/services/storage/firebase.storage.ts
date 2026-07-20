import fs   from "fs";
import path from "path";
import { getFirebaseBucket, isFirebaseReady } from "../../config/firebase";
import { logger } from "../../config/logger";

export class FirebaseStorageService {

  // Upload file to Firebase Storage
  async upload(localPath: string, filename: string): Promise<string> {
    if (!isFirebaseReady()) {
      throw new Error("Firebase not configured");
    }

    logger.info(`Uploading to Firebase: ${filename}`);

    const bucket      = getFirebaseBucket();
    const destination = `backups/${filename}`;

    await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType:  "application/octet-stream",
        metadata: {
          uploadedAt: new Date().toISOString(),
          source:     "db-backup-platform",
        },
      },
    });

    // Get signed URL (valid 7 days)
    const [url] = await bucket
      .file(destination)
      .getSignedUrl({
        action:  "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

    logger.info(`Uploaded to Firebase: ${destination}`);
    return url;
  }

  // Download file from Firebase
  async download(filename: string, localPath: string): Promise<void> {
    if (!isFirebaseReady()) {
      throw new Error("Firebase not configured");
    }

    logger.info(`Downloading from Firebase: ${filename}`);

    const bucket      = getFirebaseBucket();
    const destination = `backups/${filename}`;

    await bucket.file(destination).download({ destination: localPath });

    logger.info(`Downloaded from Firebase: ${filename}`);
  }

  // Delete file from Firebase
  async delete(filename: string): Promise<void> {
    if (!isFirebaseReady()) return;

    const bucket      = getFirebaseBucket();
    const destination = `backups/${filename}`;

    try {
      await bucket.file(destination).delete();
      logger.info(`Deleted from Firebase: ${destination}`);
    } catch (err) {
      logger.error(`Failed to delete from Firebase: ${filename}`, { err });
    }
  }

  // List all files in Firebase
  async listFiles(): Promise<string[]> {
    if (!isFirebaseReady()) return [];

    const bucket     = getFirebaseBucket();
    const [files]    = await bucket.getFiles({ prefix: "backups/" });

    return files.map((f: any) => path.basename(f.name));
  }

  // Check if Firebase is available
  isAvailable(): boolean {
    return isFirebaseReady();
  }
}

export const firebaseStorageService = new FirebaseStorageService();