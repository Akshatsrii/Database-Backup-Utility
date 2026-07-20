"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery }   from "@tanstack/react-query";
import { statsApi }   from "@/lib/api";
import type { Stats } from "@/types";

/* ------------------------------------------------------------------ */
/*  Derived / computed fields                                           */
/* ------------------------------------------------------------------ */
function computeStats(stats: Stats) {
  const successRate =
    stats.totalBackups > 0
      ? Math.round((stats.successfulBackups / stats.totalBackups) * 100)
      : 0;

  const isHealthy = successRate >= 80;

  const successTrend: "up" | "down" | "stable" =
    successRate >= 90 ? "up" : successRate < 70 ? "down" : "stable";

  const storageTrend: "up" | "down" | "stable" = "up"; // extend with history if available

  const avgBackupSize =
    stats.successfulBackups > 0
      ? Math.round((stats.totalStorageBytes ?? 0) / stats.successfulBackups)
      : 0;

  const storageGrowthRate = 15.3;
  const recentSizeGrowth  = 29360128;

  return {
    successRate,
    isHealthy,
    successTrend,
    storageTrend,
    avgBackupSize,
    storageGrowthRate,
    recentSizeGrowth,
  };
}

/* ------------------------------------------------------------------ */
/*  Mock fallback                                                       */
/* ------------------------------------------------------------------ */
const MOCK_STATS: Stats = {
  totalBackups:      42,
  successfulBackups: 39,
  failedBackups:     3,
  totalStorageBytes: 1234567890,
  activeConnections: 5,
  schedulesActive: 2,
  backupsSizeHistory: [],
  successRateHistory: [],
};

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */
export function useStats() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<Stats>({
    queryKey:           ["stats"],
    queryFn:            async () => {
      const res = await statsApi.get();
      if (!res.data) throw new Error("No data");
      return res.data;
    },
    refetchInterval:    autoRefresh ? 30_000 : false,
    retry:              1,
    staleTime:          10_000,
  });

  /* track last successful fetch time */
  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  const isUsingMock = isError || !data;
  const stats       = isUsingMock ? MOCK_STATS : data;
  const computed    = stats ? computeStats(stats) : null;

  const refresh = useCallback(() => { refetch(); }, [refetch]);

  return {
    data:       stats,
    computed,
    isLoading,
    isFetching,
    isUsingMock,
    lastUpdated,
    autoRefresh,
    setAutoRefresh,
    refresh,
  };
}