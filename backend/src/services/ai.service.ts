import { backupStore } from "./backup/backup.service";

export interface AiInsight {
  type: "warning" | "success" | "info";
  message: string;
  recommendation: string;
}

export class AiService {
  /**
   * Future-ready LLM hook. Currently uses heuristics that act like an AI
   * to analyze storage growth, failure rates, and scheduling.
   */
  generateInsights(): AiInsight[] {
    const insights: AiInsight[] = [];
    const totalBackups = backupStore.length;

    if (totalBackups === 0) {
      insights.push({
        type: "info",
        message: "No backups found yet.",
        recommendation: "Create your first backup or set up an automated schedule.",
      });
      return insights;
    }

    const failedCount = backupStore.filter((b) => b.status === "failed").length;
    const failRate = failedCount / totalBackups;

    if (failRate > 0.2) {
      insights.push({
        type: "warning",
        message: `High failure rate detected (${(failRate * 100).toFixed(0)}%).`,
        recommendation: "Check connection credentials and ensure the database server has sufficient memory during dump operations.",
      });
    }

    const completed = backupStore.filter((b) => b.status === "completed" && b.sizeAfter);
    if (completed.length >= 2) {
      const sorted = [...completed].sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
      const oldest = sorted[0];
      const newest = sorted[sorted.length - 1];
      
      const sizeGrowth = (newest.sizeAfter || 0) - (oldest.sizeAfter || 0);
      if (sizeGrowth > 1024 * 1024 * 50) { // Growth > 50MB
        insights.push({
          type: "warning",
          message: `Storage growth is accelerating rapidly (+${(sizeGrowth / 1024 / 1024).toFixed(2)} MB since oldest backup).`,
          recommendation: "Switch from Full Backups to Incremental/Differential backups to save storage.",
        });
      } else {
        insights.push({
          type: "success",
          message: "Storage growth is stable and predictable.",
          recommendation: "Current retention policy is optimal. Keep it running.",
        });
      }
    }

    return insights;
  }
}

export const aiService = new AiService();
