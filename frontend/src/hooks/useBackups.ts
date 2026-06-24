import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { backupsApi } from "@/lib/api";
import type { Backup } from "@/types";

// ─── Constants ─────────────────────────────────────────────────────────────
const QUERY_KEY        = ["backups"];
const REFETCH_INTERVAL = 15_000;   // 15s normal
const FAST_INTERVAL    = 3_000;    // 3s when a backup is running

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
    total:       number;
    completed:   number;
    failed:      number;
    running:     number;
    pending:     number;
    totalBytes:  number;
    successRate: number;
    hasRunning:  boolean;
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

  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [isDeleting,   setIsDeleting]   = useState(false);

  // ── Main query ───────────────────────────────────────────────────────────
  // api.ts ka request() hamesha { success, data } envelope deta hai —
  // `res.data` se hi array milta hai, dusra `.data` mat lagao.
  const query = useQuery<Backup[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await backupsApi.list();
      return res.data ?? [];
    },
    // BUGFIX: yeh ek hi dynamic refetchInterval ab fast/slow polling
    // handle karta hai. Pehle ek alag setInterval+invalidateQueries
    // useEffect bhi chal raha tha saath mein — jisse running backup ke
    // time double polling ho rahi thi. Woh effect hata diya gaya hai.
    refetchInterval: (query) => {
      const backups = query.state.data as Backup[] | undefined;
      const hasRunning = Array.isArray(backups) && backups.some(
        (b) => b.status === "running" || b.status === "pending"
      );
      return hasRunning ? FAST_INTERVAL : REFETCH_INTERVAL;
    },
    retry: 2,
    staleTime: 5_000,
  });

  const backups = query.data ?? [];

  // ── lastUpdated — query metadata se derive, alag setState nahi ──────────
  // BUGFIX: pehle queryFn ke andar setLastUpdated() call hota tha — har
  // fetch attempt pe fire hota tha, cache-served data pe bhi. Ab query ke
  // apne `dataUpdatedAt` se hamesha sahi value milti hai.
  const lastUpdated = query.dataUpdatedAt
    ? new Date(query.dataUpdatedAt)
    : null;

  // ── Stats — memoized ─────────────────────────────────────────────────────
  // OPTIMIZE: pehle har render pe 6 alag .filter()/.reduce() chalte the —
  // searchTerm typing jaisi unrelated state change pe bhi. useMemo se ab
  // sirf `backups` badalne par hi recalculate hoga.
  const stats = useMemo(() => {
    const completed = backups.filter((b) => b.status === "completed").length;
    const failed    = backups.filter((b) => b.status === "failed").length;
    const running   = backups.filter((b) => b.status === "running").length;
    const pending   = backups.filter((b) => b.status === "pending").length;

    return {
      total: backups.length,
      completed,
      failed,
      running,
      pending,
      totalBytes: backups.reduce((s, b) => s + (b.sizeAfter ?? 0), 0),
      successRate: backups.length
        ? Math.round((completed / backups.length) * 100)
        : 100,
      hasRunning: running > 0 || pending > 0,
    };
  }, [backups]);

  // ── Filtered data — memoized ─────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return backups.filter((b) => {
      const searchOk = !term ||
        b.filename?.toLowerCase().includes(term)        ||
        b.connectionName?.toLowerCase().includes(term)  ||
        b.dbType?.toLowerCase().includes(term)           ||
        b.backupType?.toLowerCase().includes(term);
      const statusOk = statusFilter === "all" || b.status     === statusFilter;
      const typeOk   = typeFilter   === "all" || b.backupType === typeFilter;
      return searchOk && statusOk && typeOk;
    });
  }, [backups, searchTerm, statusFilter, typeFilter]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  }, [qc]);

  // ── Delete single — optimistic, real rollback on failure ────────────────
  const deleteBackup = useCallback(async (id: string) => {
    setIsDeleting(true);
    const previous = qc.getQueryData<Backup[]>(QUERY_KEY);

    qc.setQueryData<Backup[]>(QUERY_KEY, (old) =>
      old ? old.filter((b) => b.id !== id) : []
    );

    try {
      await backupsApi.remove(id);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      // BUGFIX: pehle yahan sirf invalidateQueries hota tha — list khaali
      // flash hoti thi jab tak refetch complete na ho. Ab snapshot se
      // exact previous state restore hoti hai instantly.
      qc.setQueryData(QUERY_KEY, previous);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [qc]);

  // ── Delete many — same rollback pattern ──────────────────────────────────
  const deleteMany = useCallback(async (ids: string[]) => {
    setIsDeleting(true);
    const previous = qc.getQueryData<Backup[]>(QUERY_KEY);

    qc.setQueryData<Backup[]>(QUERY_KEY, (old) =>
      old ? old.filter((b) => !ids.includes(b.id)) : []
    );

    try {
      await Promise.all(ids.map((id) => backupsApi.remove(id)));
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    } catch (err) {
      qc.setQueryData(QUERY_KEY, previous);
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
    data: backups,
    filteredData,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    isError:    query.isError,
    error:      query.error,
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