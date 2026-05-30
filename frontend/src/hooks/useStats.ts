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
    stats.total_backups > 0
      ? Math.round((stats.successful_backups / stats.total_backups) * 100)
      : 0;

  const isHealthy = successRate >= 80;

  const successTrend: "up" | "down" | "stable" =
    successRate >= 90 ? "up" : successRate < 70 ? "down" : "stable";

  const storageTrend: "up" | "down" | "stable" = "up"; // extend with history if available

  const avgBackupSize =
    stats.successful_backups > 0
      ? Math.round((stats.total_storage_used ?? 0) / stats.successful_backups)
      : 0;

  const storageGrowthRate = stats.storage_growth_rate ?? 0;
  const recentSizeGrowth  = stats.recent_size_growth  ?? 0;

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
  total_backups:      42,
  successful_backups: 39,
  failed_backups:     3,
  pending_backups:    0,
  total_storage_used: 1234567890,
  storage_growth_rate: 15.3,
  recent_size_growth:  29360128,
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
      return res.data.data ?? res.data;
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