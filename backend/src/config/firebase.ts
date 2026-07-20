import admin from "firebase-admin";
import { ENV } from "./env";
import { logger } from "./logger";

let initialized = false;

export function initFirebase(): void {
  if (initialized || !ENV.FIREBASE_PROJECT_ID) {
    if (!ENV.FIREBASE_PROJECT_ID) {
      logger.warn("Firebase not configured — cloud storage disabled");
    }
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   ENV.FIREBASE_PROJECT_ID,
        privateKey:  ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    });
    initialized = true;
    logger.info("Firebase initialized successfully");
  } catch (err) {
    logger.error("Firebase initialization failed", { err });
  }
}

export function getFirebaseBucket(): any {
  if (!initialized) throw new Error("Firebase not initialized");
  return admin.storage().bucket();
}

export function isFirebaseReady(): boolean {
  return initialized;
}