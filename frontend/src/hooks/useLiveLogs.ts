"use client";

import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { logsApi } from "@/lib/api";
import type { LogEntry, LogLevel } from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────
const QUERY_KEY  = (limit: number) => ["logs", limit];
const MAX_LOGS   = 500;
const WS_URL     = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";
const REFETCH_MS = 30_000;

// ─── Types ───────────────────────────────────────────────────────────────────
interface UseLogsOptions {
  limit?:      number;
  autoScroll?: boolean;
  wsEnabled?:  boolean;
}

interface UseLogsReturn {
  logs:             LogEntry[];
  filteredLogs:     LogEntry[];
  totalCount:       number;
  wsConnected:      boolean;
  wsError:          string | null;
  isPaused:         boolean;
  setPaused:        (v: boolean) => void;
  isLoading:        boolean;
  isFetching:       boolean;
  lastUpdated:      Date | null;
  levelFilter:      LogLevel | "all";
  setLevelFilter:   (v: LogLevel | "all") => void;
  searchTerm:       string;
  setSearchTerm:    (v: string) => void;
  clearFilters:     () => void;
  hasActiveFilters: boolean;
  stats: {
    total:   number;
    info:    number;
    warn:    number;
    error:   number;
    success: number;
    debug:   number;
  };
  clearLogs:  () => Promise<void>;
  refresh:    () => void;
  exportLogs: () => void;
}

// BUGFIX: app mein hook 2 tarah se call hota hai —
//   useLiveLogs(300)              ← plain number
//   useLiveLogs({ limit: 300 })   ← options object
// Dono support karo taaki dono call sites chalte rahein.
function normalizeArgs(arg?: number | UseLogsOptions): UseLogsOptions {
  if (typeof arg === "number") return { limit: arg };
  return arg ?? {};
}

// ═══════════════════════════════════════════════════════════════════════════
export function useLiveLogs(arg?: number | UseLogsOptions): UseLogsReturn {
  const { limit = 200, wsEnabled = true } = normalizeArgs(arg);

  const qc = useQueryClient();

  const [wsConnected, setWsConnected] = useState(false);
  const [wsError,     setWsError]     = useState<string | null>(null);
  const [isPaused,    setPaused]      = useState(false);
  const [liveLogs,    setLiveLogs]    = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [searchTerm,  setSearchTerm]  = useState("");

  const socketRef = useRef<Socket | null>(null);
  const pauseRef  = useRef(isPaused);
  useEffect(() => { pauseRef.current = isPaused; }, [isPaused]);

  // ── Initial fetch + periodic fallback poll ───────────────────────────────
  // BUGFIX: pehle try/catch real errors ko `[]` mein silently chhupa deta
  // tha — agar backend down ho ya 500 de, UI ko "no logs" dikhta tha jabki
  // asal mein fetch fail hui thi. Ab error throw hota hai, query.isError
  // se UI ko sahi pata chalta hai.
  const query = useQuery<LogEntry[], Error>({
    queryKey: QUERY_KEY(limit),
    queryFn: async () => {
      const res = await logsApi.list(limit);
      return res.data ?? [];
    },
    refetchInterval: REFETCH_MS,
    staleTime: 10_000,
  });

  // Fetched logs ko local state mein sync karo
  useEffect(() => {
    if (query.data) setLiveLogs(query.data);
  }, [query.data]);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wsEnabled) return;

    const socket = io(WS_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setWsConnected(true);
      setWsError(null);
    });
    socket.on("disconnect", (reason: string) => {
      setWsConnected(false);
      setWsError(`disconnected: ${reason}`);
    });
    socket.on("connect_error", (err: Error) => {
      setWsConnected(false);
      setWsError(err.message);
    });
    socket.on("log", (entry: LogEntry) => {
      if (pauseRef.current) return;
      setLiveLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
      });
    });
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

  // ── lastUpdated — derived, duplicate setState nahi ───────────────────────
  const lastUpdated = query.state.dataUpdatedAt
    ? new Date(query.state.dataUpdatedAt)
    : null;

  // ── Stats — memoized ──────────────────────────────────────────────────────
  // OPTIMIZE: WebSocket se per-second multiple log lines aa sakti hain —
  // memoization ke bina har ek log pe poora recalculation hota tha.
  const stats = useMemo(() => ({
    total:   liveLogs.length,
    info:    liveLogs.filter((l) => l.level === "info").length,
    warn:    liveLogs.filter((l) => l.level === "warn").length,
    error:   liveLogs.filter((l) => l.level === "error").length,
    success: liveLogs.filter((l) => l.level === "success").length,
    debug:   liveLogs.filter((l) => l.level === "debug").length,
  }), [liveLogs]);

  // ── Filtered logs — memoized ──────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return liveLogs.filter((l) => {
      const levelOk  = levelFilter === "all" || l.level === levelFilter;
      const searchOk = !term ||
        l.message.toLowerCase().includes(term) ||
        l.level.toLowerCase().includes(term);
      return levelOk && searchOk;
    });
  }, [liveLogs, levelFilter, searchTerm]);

  // ── Clear logs ─────────────────────────────────────────────────────────────
  // BUGFIX: pehle `logsApi.list(0)` call hota tha jo sirf 0-limit fetch
  // karta hai — server pe kuch clear nahi hota tha. Ab real
  // `DELETE /api/logs` endpoint (logsApi.clear()) call hoti hai.
  const clearLogs = useCallback(async () => {
    try {
      await logsApi.clear();
    } finally {
      setLiveLogs([]);
      qc.setQueryData(QUERY_KEY(limit), []);
    }
  }, [qc, limit]);

  // ── Refresh ────────────────────────────────────────────────────────────────
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

  // ── Clear filters ──────────────────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setLevelFilter("all");
    setSearchTerm("");
  }, []);

  const hasActiveFilters = levelFilter !== "all" || searchTerm !== "";

  return {
    logs: liveLogs,
    filteredLogs,
    totalCount: liveLogs.length,
    wsConnected,
    wsError,
    isPaused,
    setPaused,
    isLoading:  query.isLoading,
    isFetching: query.isFetching,
    lastUpdated,
    levelFilter,
    setLevelFilter,
    searchTerm,
    setSearchTerm,
    clearFilters,
    hasActiveFilters,
    stats,
    clearLogs,
    refresh,
    exportLogs,
  };
}