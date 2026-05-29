import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { logsApi } from "@/lib/api";
import type { LogEntry, LogLevel } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────
const QUERY_KEY      = (limit: number) => ["logs", limit];
const MAX_LOGS       = 500;   // max logs to keep in memory
const WS_URL         = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
const REFETCH_MS     = 30_000; // poll every 30s as fallback

// ─── Types ───────────────────────────────────────────────────────────────────
interface UseLogsOptions {
  limit?:        number;       // initial fetch limit
  autoScroll?:   boolean;      // auto scroll to bottom
  wsEnabled?:    boolean;      // enable websocket
}

interface UseLogsReturn {
  // Data
  logs:            LogEntry[];
  filteredLogs:    LogEntry[];
  totalCount:      number;

  // WebSocket status
  wsConnected:     boolean;
  wsError:         string | null;

  // UI state
  isPaused:        boolean;
  setPaused:       (v: boolean) => void;
  isLoading:       boolean;
  isFetching:      boolean;
  lastUpdated:     Date | null;

  // Filters
  levelFilter:     LogLevel | "all";
  setLevelFilter:  (v: LogLevel | "all") => void;
  searchTerm:      string;
  setSearchTerm:   (v: string) => void;
  clearFilters:    () => void;
  hasActiveFilters:boolean;

  // Stats
  stats: {
    total:   number;
    info:    number;
    warn:    number;
    error:   number;
    success: number;
    debug:   number;
  };

  // Actions
  clearLogs:       () => void;
  refresh:         () => void;
  exportLogs:      () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
export function useLiveLogs({
  limit      = 200,
  autoScroll = true,
  wsEnabled  = true,
}: UseLogsOptions = {}): UseLogsReturn {

  const qc = useQueryClient();

  // ── State ─────────────────────────────────────────────────────────────────
  const [wsConnected,  setWsConnected]  = useState(false);
  const [wsError,      setWsError]      = useState<string | null>(null);
  const [isPaused,     setPaused]       = useState(false);
  const [liveLogs,     setLiveLogs]     = useState<LogEntry[]>([]);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [levelFilter,  setLevelFilter]  = useState<LogLevel | "all">("all");
  const [searchTerm,   setSearchTerm]   = useState("");

  const socketRef    = useRef<Socket | null>(null);
  const pauseRef     = useRef(isPaused);

  // Keep pauseRef in sync — avoid stale closure in socket handler
  useEffect(() => { pauseRef.current = isPaused; }, [isPaused]);

  // ── Initial fetch ─────────────────────────────────────────────────────────
  const query = useQuery<LogEntry[], Error>({
    queryKey: QUERY_KEY(limit),
    queryFn:  async () => {
      try {
        const res  = await logsApi.list(limit);
        const data = res.data.data ?? [];
        setLiveLogs(data);
        setLastUpdated(new Date());
        return data;
      } catch {
        return [];
      }
    },
    refetchInterval: REFETCH_MS,
    staleTime:       10_000,
  });

  // ── WebSocket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wsEnabled) return;

    const socket = io(WS_URL, {
      transports:       ["websocket"],
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setWsConnected(true);
      setWsError(null);
    });

    socket.on("disconnect", (reason) => {
      setWsConnected(false);
      setWsError(`disconnected: ${reason}`);
    });

    socket.on("connect_error", (err) => {
      setWsConnected(false);
      setWsError(err.message);
    });

    // New log entry from backend
    socket.on("log", (entry: LogEntry) => {
      if (pauseRef.current) return;

      setLiveLogs((prev) => {
        const next = [...prev, entry];
        // Keep max logs in memory
        return next.length > MAX_LOGS
          ? next.slice(next.length - MAX_LOGS)
          : next;
      });

      setLastUpdated(new Date());
    });

    // Bulk logs event (on reconnect)
    socket.on("logs:bulk", (entries: LogEntry[]) => {
      if (pauseRef.current) return;
      setLiveLogs((prev) => {
        const combined = [...prev, ...entries];
        return combined.length > MAX_LOGS
          ? combined.slice(combined.length - MAX_LOGS)
          : combined;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [wsEnabled]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:   liveLogs.length,
    info:    liveLogs.filter((l) => l.level === "info").length,
    warn:    liveLogs.filter((l) => l.level === "warn").length,
    error:   liveLogs.filter((l) => l.level === "error").length,
    success: liveLogs.filter((l) => l.level === "success").length,
    debug:   liveLogs.filter((l) => l.level === "debug").length,
  };

  // ── Filtered logs ─────────────────────────────────────────────────────────
  const filteredLogs = liveLogs.filter((l) => {
    const lvlOk  = levelFilter === "all" || l.level === levelFilter;
    const term   = searchTerm.toLowerCase();
    const srchOk = !searchTerm ||
      l.message.toLowerCase().includes(term) ||
      l.level.toLowerCase().includes(term);
    return lvlOk && srchOk;
  });

  // ── Clear logs ────────────────────────────────────────────────────────────
  const clearLogs = useCallback(async () => {
    try {
      await logsApi.list(0);   // hit clear endpoint
      setLiveLogs([]);
      qc.setQueryData(QUERY_KEY(limit), []);
    } catch {
      setLiveLogs([]);
    }
  }, [qc, limit]);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: QUERY_KEY(limit) });
  }, [qc, limit]);

  // ── Export logs as .txt ───────────────────────────────────────────────────
  const exportLogs = useCallback(() => {
    const content = filteredLogs
      .map((l) =>
        `[${new Date(l.timestamp).toLocaleString()}] [${l.level.toUpperCase().padEnd(7)}] ${l.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `backupos-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  // ── Clear filters ─────────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setLevelFilter("all");
    setSearchTerm("");
  }, []);

  const hasActiveFilters =
    levelFilter !== "all" || searchTerm !== "";

  // ── Return ────────────────────────────────────────────────────────────────
  return {
    // Data
    logs:         liveLogs,
    filteredLogs,
    totalCount:   liveLogs.length,

    // WebSocket
    wsConnected,
    wsError,

    // UI
    isPaused,
    setPaused,
    isLoading:    query.isLoading,
    isFetching:   query.isFetching,
    lastUpdated,

    // Filters
    levelFilter,
    setLevelFilter,
    searchTerm,
    setSearchTerm,
    clearFilters,
    hasActiveFilters,

    // Stats
    stats,

    // Actions
    clearLogs,
    refresh,
    exportLogs,
  };
}
