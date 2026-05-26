import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT:                    parseInt(process.env.PORT || "4000"),
  NODE_ENV:                process.env.NODE_ENV || "development",
  ENCRYPTION_KEY:          process.env.ENCRYPTION_KEY || "12345678901234567890123456789012",
  BACKUP_RETENTION_DAYS:   parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),

  // Firebase
  FIREBASE_PROJECT_ID:     process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_PRIVATE_KEY:    process.env.FIREBASE_PRIVATE_KEY || "",
  FIREBASE_CLIENT_EMAIL:   process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "",

  // Slack
  SLACK_WEBHOOK_URL:       process.env.SLACK_WEBHOOK_URL || "",
} as const;