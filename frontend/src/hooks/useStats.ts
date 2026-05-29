const {
  data:      stats,
  computed,
  isLoading,
  isFetching,
  isUsingMock,
  lastUpdated,
  autoRefresh,
  setAutoRefresh,
  refresh,
} = useStats();

// Computed stats directly
computed?.successRate       // 92
computed?.isHealthy         // true
computed?.successTrend      // "up" | "down" | "stable"
computed?.storageTrend      // "up"
computed?.avgBackupSize     // 29360128 (bytes)
computed?.storageGrowthRate // 15.3 (%)
computed?.recentSizeGrowth  // bytes added today

// Mock indicator
isUsingMock  // true jab backend nahi chal raha