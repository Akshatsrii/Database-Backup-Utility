import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { backupsApi } from "@/lib/api";
import type { Backup } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────
const QUERY_KEY        = ["backups"];
const REFETCH_INTERVAL = 15_000;   // 15s normal
const FAST_INTERVAL    = 3_000;    // 3s when backup is running

// ─── Types ──────────────────────────────────────────────────────────────────
interface UseBackupsReturn {
  data:              Backup[];
  filteredData:      Backup[];
  isLoading:         boolean;
  isFetching:        boolean;
  isError:           boolean;
  error:             Error | null;
  lastUpdated:       Date | null;
  stats: {
    total:         number;
    completed:     number;
    failed:        number;
    running:       number;
    pending:       number;
    totalBytes:    number;
    successRate:   number;
    hasRunning:    boolean;
  };
  refresh:           () => void;
  deleteBackup:      (id: string) => Promise<void>;
  deleteMany:        (ids: string[]) => Promise<void>;
  isDeleting:        boolean;
  searchTerm:        string;
  setSearchTerm:     (v: string) => void;
  statusFilter:      string;
  setStatusFilter:   (v: string) => void;
  typeFilter:        string;
  setTypeFilter:     (v: string) => void;
  clearFilters:      () => void;
  hasActiveFilters:  boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
export function useBackups(): UseBackupsReturn {
  const qc = useQueryClient();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);

  // ── Main query ────────────────────────────────────────────────────────────
  const query = useQuery<Backup[], Error>({
    queryKey: QUERY_KEY,
    queryFn:  async () => {
      const res  = await backupsApi.list();
      const data = res.data.data ?? [];
      setLastUpdated(new Date());
      return data;
    },
    // ✅ Fixed: TanStack Query v5 passes a Query object, not data directly
    refetchInterval: (query) => {
      const backups = query.state.data;
      const hasRunning = Array.isArray(backups) && backups.some(
        (b) => b.status === "running" || b.status === "pending"
      );
      return hasRunning ? FAST_INTERVAL : REFETCH_INTERVAL;
    },
    retry:     2,
    staleTime: 5_000,
  });

  const backups = query.data ?? [];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:       backups.length,
    completed:   backups.filter((b) => b.status === "completed").length,
    failed:      backups.filter((b) => b.status === "failed").length,
    running:     backups.filter((b) => b.status === "running").length,
    pending:     backups.filter((b) => b.status === "pending").length,
    totalBytes:  backups.reduce((s, b) => s + (b.sizeAfter ?? 0), 0),
    successRate: backups.length
      ? Math.round(
          (backups.filter((b) => b.status === "completed").length /
            backups.length) * 100
        )
      : 100,
    hasRunning: backups.some(
      (b) => b.status === "running" || b.status === "pending"
    ),
  };

  // ── Auto-refresh when a backup is running ─────────────────────────────────
  useEffect(() => {
    if (!stats.hasRunning) return;
    const interval = setInterval(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    }, FAST_INTERVAL);
    return () => clearInterval(interval);
  }, [stats.hasRunning, qc]);

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filteredData = backups.filter((b) => {
    const term   = searchTerm.toLowerCase();
    const srchOk = !searchTerm ||
      b.filename?.toLowerCase().includes(term)        ||
      b.connectionName?.toLowerCase().includes(term)  ||
      b.dbType?.toLowerCase().includes(term)          ||
      b.backupType?.toLowerCase().includes(term);
    const stOk = statusFilter === "all" || b.status     === statusFilter;
    const tyOk = typeFilter   === "all" || b.backupType === typeFilter;
    return srchOk && stOk && tyOk;
  });

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  // ── Delete single ─────────────────────────────────────────────────────────
  const deleteBackup = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      qc.setQueryData<Backup[]>(QUERY_KEY, (old) =>
        old ? old.filter((b) => b.id !== id) : []
      );
      await backupsApi.remove(id);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [qc]);

  // ── Delete many ───────────────────────────────────────────────────────────
  const deleteMany = useCallback(async (ids: string[]) => {
    setIsDeleting(true);
    try {
      qc.setQueryData<Backup[]>(QUERY_KEY, (old) =>
        old ? old.filter((b) => !ids.includes(b.id)) : []
      );
      await Promise.all(ids.map((id) => backupsApi.remove(id)));
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [qc]);

  // ── Clear filters ─────────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  }, []);

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== "all" || typeFilter !== "all";

  return {
    data:         backups,
    filteredData,
    isLoading:    query.isLoading,
    isFetching:   query.isFetching,
    isError:      query.isError,
    error:        query.error,
    lastUpdated,
    stats,
    refresh,
    deleteBackup,
    deleteMany,
    isDeleting,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    clearFilters,
    hasActiveFilters,
  };
}