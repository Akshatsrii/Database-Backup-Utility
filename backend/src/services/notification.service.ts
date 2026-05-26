import axios  from "axios";
import { ENV }    from "../config/env";
import { logger } from "../config/logger";
import type { Backup } from "../types";

export class NotificationService {

  async sendSlackNotification(backup: Backup): Promise<void> {
    if (!ENV.SLACK_WEBHOOK_URL) return;

    const isSuccess = backup.status === "completed";

    const payload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: isSuccess
              ? "✅ Backup Completed"
              : "❌ Backup Failed",
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Database:*\n${backup.connectionName}` },
            { type: "mrkdwn", text: `*Type:*\n${backup.backupType}` },
            { type: "mrkdwn", text: `*Status:*\n${backup.status}` },
            { type: "mrkdwn", text: `*Storage:*\n${backup.storageType}` },
            ...(backup.durationMs
              ? [{ type: "mrkdwn", text: `*Duration:*\n${backup.durationMs}ms` }]
              : []),
            ...(backup.errorMessage
              ? [{ type: "mrkdwn", text: `*Error:*\n${backup.errorMessage}` }]
              : []),
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `BackupOS · ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    try {
      await axios.post(ENV.SLACK_WEBHOOK_URL, payload);
      logger.info(`Slack notification sent for backup: ${backup.id}`);
    } catch (err) {
      logger.error("Failed to send Slack notification", { err });
    }
  }
}

export const notificationService = new NotificationService();