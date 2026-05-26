import { backupStore }    from "./backup/backup.service";
import { connectionStore } from "./scheduler.service";
import { scheduleStore }   from "./scheduler.service";
import { format, subDays } from "date-fns";
import type { DashboardStats } from "../types";

export class StatsService {

  getDashboardStats(): DashboardStats {
    const total      = backupStore.length;
    const successful = backupStore.filter((b) => b.status === "completed").length;
    const failed     = backupStore.filter((b) => b.status === "failed").length;

    const totalStorage = backupStore
      .filter((b) => b.sizeAfter)
      .reduce((sum, b) => sum + (b.sizeAfter ?? 0), 0);

    // Last 7 days size history
    const sizeHistory = Array.from({ length: 7 }, (_, i) => {
      const date  = subDays(new Date(), 6 - i);
      const label = format(date, "dd MMM");
      const dayBackups = backupStore.filter((b) => {
        const bDate = new Date(b.startedAt);
        return bDate.toDateString() === date.toDateString();
      });
      const bytes = dayBackups.reduce((s, b) => s + (b.sizeAfter ?? 0), 0);
      return { date: label, bytes };
    });

    // Last 7 days success rate
    const rateHistory = Array.from({ length: 7 }, (_, i) => {
      const date  = subDays(new Date(), 6 - i);
      const label = format(date, "dd MMM");
      const dayBackups = backupStore.filter((b) => {
        const bDate = new Date(b.startedAt);
        return bDate.toDateString() === date.toDateString();
      });
      const rate =
        dayBackups.length === 0
          ? 100
          : Math.round(
              (dayBackups.filter((b) => b.status === "completed").length /
                dayBackups.length) *
                100
            );
      return { date: label, rate };
    });

    return {
      totalBackups:        total,
      successfulBackups:   successful,
      failedBackups:       failed,
      totalStorageBytes:   totalStorage,
      activeConnections:   connectionStore.length,
      schedulesActive:     scheduleStore.filter((s) => s.enabled).length,
      backupsSizeHistory:  sizeHistory,
      successRateHistory:  rateHistory,
    };
  }
}

export const statsService = new StatsService();