"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { logLevelColors } from "@/lib/utils";
import type { LogEntry } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

/* ── inline keyframes ────────────────────────────────────── */
const CSS = `
@keyframes llt-pulse {
  0%,100% { opacity:1; box-shadow:0 0 4px #4ade80; }
  50%      { opacity:.5; box-shadow:0 0 8px #4ade80; }
}
@keyframes llt-blink { 0%,100%{opacity:1} 50%{opacity:0} }
`;

/* ── constants ───────────────────────────────────────────── */

const LEVELS = ["all", "info", "success", "warn", "error", "debug"] as const;

const LEVEL_COLOR: Record<string, string> = {
  info:    "#38bdf8",
  warn:    "#ffd700",
  error:   "#ff4444",
  success: "#4ade80",
  debug:   "#4a5450",
};

/* ── highlight search term inside a string ───────────────── */

function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "rgba(184,245,58,0.25)",
          color: "#b8f53a",
          borderRadius: 2,
          padding: "0 1px",
        }}
      >
        {text.slice(idx, idx + term.length)}
      </mark>
      {text.slice(idx + term.length)}
    </>
  );
}

/* ── props ───────────────────────────────────────────────── */

interface Props {
  initialLogs?: LogEntry[];
  height?: number;
}

/* ── component ───────────────────────────────────────────── */

export default function LiveLogTerminal({
  initialLogs = [],
  height = 480,
}: Props) {
  const [logs,        setLogs]        = useState<LogEntry[]>(initialLogs);
  const [connected,   setConnected]   = useState(false);
  const [filter,      setFilter]      = useState("all");
  const [search,      setSearch]      = useState("");
  const [paused,      setPaused]      = useState(false);
  const [autoScroll,  setAutoScroll]  = useState(true);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const socketRef  = useRef<Socket | null>(null);
  const pausedRef  = useRef(paused);

  /* keep ref in sync so the stable socket listener can read it */
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  /* ── stable socket — only mounts once ── */
  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("log", (entry: LogEntry) => {
      if (!pausedRef.current) {
        setLogs((prev) => [...prev.slice(-499), entry]);
      }
    });

    return () => { socket.disconnect(); };
  }, []); // no [paused] dep — avoids reconnect on every pause toggle

  /* ── auto-scroll ── */
  useEffect(() => {
    if (autoScroll && !paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, paused]);

  /* stop auto-scroll when user manually scrolls up */
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  /* ── filtered + memoised ── */
  const filtered = useMemo(() =>
    logs.filter((l) => {
      const lvlOk  = filter === "all" || l.level === filter;
      const srchOk = !search ||
        l.message.toLowerCase().includes(search.toLowerCase());
      return lvlOk && srchOk;
    }),
  [logs, filter, search]);

  /* ── level counts for filter buttons ── */
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of logs) c[l.level] = (c[l.level] ?? 0) + 1;
    return c;
  }, [logs]);

  /* ── copy single line ── */
  const copyLine = useCallback((log: LogEntry) => {
    const ts  = new Date(log.timestamp).toLocaleTimeString("en-GB", { hour12: false });
    navigator.clipboard.writeText(`[${ts}] ${log.level.toUpperCase()} ${log.message}`);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 1200);
  }, []);

  /* ── scroll to bottom manually ── */
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setAutoScroll(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="terminal-card flex flex-col" style={{ height }}>

        {/* ── top bar ── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0"
          style={{ borderColor: "#252825" }}
        >
          {/* left: dots + title */}
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff4444" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffd700" }} />
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#4ade80" }} />
            </div>
            <span className="text-xs" style={{ color: "#4a5450" }}>live_logs.stream</span>
          </div>

          {/* right: controls */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* connection */}
            <span className="flex items-center gap-1.5 text-xs mr-1">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: connected ? "#4ade80" : "#ff4444",
                  animation: connected ? "llt-pulse 2s ease-in-out infinite" : undefined,
                }}
              />
              <span style={{ color: "#4a5450" }}>
                {connected ? "live" : "disconnected"}
              </span>
            </span>

            {/* search */}
            <input
              type="text"
              placeholder="search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "#1a1d1a",
                border: `1px solid ${search ? "#b8f53a44" : "#252825"}`,
                color: "#e8edea",
                width: 130,
                outline: "none",
                transition: "border-color 0.15s",
              }}
            />

            {/* level filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded"
              style={{
                background:  "#1a1d1a",
                border:      "1px solid #252825",
                color:       filter === "all" ? "#8a9690" : (LEVEL_COLOR[filter] ?? "#e8edea"),
                appearance:  "none",
                cursor:      "pointer",
              }}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}{l !== "all" && counts[l] ? ` (${counts[l]})` : ""}
                </option>
              ))}
            </select>

            {/* pause / resume */}
            <button
              onClick={() => setPaused((p) => !p)}
              className="text-xs px-2 py-1 rounded border transition-colors"
              style={{
                borderColor: paused ? "#b8f53a" : "#252825",
                color:       paused ? "#b8f53a" : "#4a5450",
              }}
            >
              {paused ? "resume" : "pause"}
            </button>

            {/* clear */}
            <button
              onClick={() => setLogs([])}
              className="text-xs px-2 py-1 rounded border transition-colors"
              style={{ borderColor: "#252825", color: "#4a5450" }}
            >
              clear
            </button>
          </div>
        </div>

        {/* ── log lines ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-0.5 relative"
          style={{ background: "#0a0c0a" }}
        >
          {filtered.length === 0 && (
            <p style={{ color: "#3d4040" }}>
              waiting for logs… {connected ? "●" : "○"}
            </p>
          )}

          {filtered.map((log) => (
            <div
              key={log.id}
              className="group flex gap-3 leading-5 rounded px-1 transition-colors"
              style={{ cursor: "default" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#141614"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* timestamp */}
              <span className="tabular-nums flex-shrink-0" style={{ color: "#3d4040" }}>
                {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
              </span>

              {/* level */}
              <span
                className="uppercase font-bold w-7 flex-shrink-0"
                style={{ color: LEVEL_COLOR[log.level] }}
              >
                {log.level.slice(0, 3)}
              </span>

              {/* message */}
              <span className="flex-1 break-all" style={{ color: logLevelColors[log.level] as string }}>
                <Highlighted text={log.message} term={search} />
              </span>

              {/* copy button — visible on hover */}
              <button
                onClick={() => copyLine(log)}
                className="flex-shrink-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: copiedId === log.id ? "#b8f53a" : "#4a5450" }}
                title="Copy line"
              >
                {copiedId === log.id ? "✓" : "⎘"}
              </button>
            </div>
          ))}

          <div ref={bottomRef} />

          {/* scroll-to-bottom fab */}
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-2 left-full text-xs px-2 py-1 rounded border"
              style={{
                background:  "#141614",
                borderColor: "#252825",
                color:       "#8a9690",
                marginRight: 4,
                display:     "block",
              }}
            >
              ↓ bottom
            </button>
          )}
        </div>

        {/* ── footer ── */}
        <div
          className="px-4 py-1.5 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "#1a1d1a" }}
        >
          <span className="text-xs tabular-nums" style={{ color: "#3d4040" }}>
            {filtered.length}
            {filtered.length !== logs.length && (
              <span> / {logs.length} total</span>
            )}
            {" "}lines
          </span>

          <div className="flex items-center gap-3">
            {/* error count shortcut */}
            {counts["error"] > 0 && (
              <button
                onClick={() => setFilter("error")}
                className="text-xs tabular-nums"
                style={{ color: "#ff4444" }}
                title="Filter to errors"
              >
                {counts["error"]} err
              </button>
            )}

            <span
              className="text-xs"
              style={{
                color: paused ? "#ffd700" : "#3d4040",
                animation: paused ? "llt-blink 1s step-end infinite" : undefined,
              }}
            >
              {paused ? "PAUSED" : "LIVE"} ▌
            </span>
          </div>
        </div>
      </div>
    </>
  );
}