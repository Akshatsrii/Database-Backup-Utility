import { useQuery } from "@tanstack/react-query";
import { statsApi } from "@/lib/api";
import type { DashboardStats } from "@/types";

const MOCK_STATS: DashboardStats = {
  totalBackups:       42,
  successfulBackups:  39,
  failedBackups:       3,
  totalStorageBytes:  1_234_567_890,
  activeConnections:   4,
  schedulesActive:     2,
  backupsSizeHistory: [
    { date: "19 May", bytes: 200_000_000  },
    { date: "20 May", bytes: 350_000_000  },
    { date: "21 May", bytes: 480_000_000  },
    { date: "22 May", bytes: 620_000_000  },
    { date: "23 May", bytes: 900_000_000  },
    { date: "24 May", bytes: 1_234_567_890 },
  ],
  successRateHistory: [
    { date: "19 May", rate: 100 },
    { date: "20 May", rate: 95  },
    { date: "21 May", rate: 100 },
    { date: "22 May", rate: 90  },
    { date: "23 May", rate: 95  },
    { date: "24 May", rate: 93  },
  ],
};

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      try {
        const res = await statsApi.dashboard();
        return res.data.data ?? MOCK_STATS;
      } catch {
        return MOCK_STATS;
      }
    },
    refetchInterval: 30_000,
  });
}