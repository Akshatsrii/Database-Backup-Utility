"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { logLevelColors } from "@/lib/utils";
import type { LogEntry } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

interface Props {
  initialLogs?: LogEntry[];
  height?: number;
}

export default function LiveLogTerminal({
  initialLogs = [],
  height = 480,
}: Props) {
  const [logs,      setLogs]      = useState<LogEntry[]>(initialLogs);
  const [connected, setConnected] = useState(false);
  const [filter,    setFilter]    = useState("all");
  const [search,    setSearch]    = useState("");
  const [paused,    setPaused]    = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect",    () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("log", (entry: LogEntry) => {
      if (!paused) {
        setLogs((prev) => [...prev.slice(-499), entry]);
      }
    });

    return () => { socket.disconnect(); };
  }, [paused]);

  // Auto scroll to bottom
  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, paused]);

  const filtered = logs.filter((l) => {
    const lvlOk  = filter === "all" || l.level === filter;
    const srchOk = !search ||
      l.message.toLowerCase().includes(search.toLowerCase());
    return lvlOk && srchOk;
  });

  const levelDot: Record<string, string> = {
    info:    "#38bdf8",
    warn:    "#ffd700",
    error:   "#ff4444",
    success: "#4ade80",
    debug:   "#4a5450",
  };

  return (
    <div
      className="terminal-card flex flex-col"
      style={{ height }}
    >
      {/* Terminal Top Bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5
                   border-b flex-shrink-0"
        style={{ borderColor: "#252825" }}
      >
        <div className="flex items-center gap-3">
          {/* macOS dots */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#ff4444" }} />
            <span className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#ffd700" }} />
            <span className="w-2.5 h-2.5 rounded-full"
              style={{ background: "#4ade80" }} />
          </div>
          <span className="text-xs" style={{ color: "#4a5450" }}>
            live_logs.stream
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: connected ? "#4ade80" : "#ff4444",
                boxShadow: connected ? "0 0 4px #4ade80" : "none",
              }}
            />
            <span style={{ color: "#4a5450" }}>
              {connected ? "live" : "disconnected"}
            </span>
          </span>

          {/* Search */}
          <input
            type="text"
            placeholder="search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "#1a1d1a",
              border: "1px solid #252825",
              color: "#e8edea",
              width: 140,
              outline: "none",
            }}
          />

          {/* Level filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "#1a1d1a",
              border: "1px solid #252825",
              color: "#e8edea",
              appearance: "none",
            }}
          >
            {["all", "info", "success", "warn", "error", "debug"].map(
              (l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              )
            )}
          </select>

          {/* Pause */}
          <button
            onClick={() => setPaused((p) => !p)}
            className="text-xs px-2 py-1 rounded border transition-colors"
            style={{
              borderColor: paused ? "#b8f53a" : "#252825",
              color: paused ? "#b8f53a" : "#4a5450",
            }}
          >
            {paused ? "resume" : "pause"}
          </button>

          {/* Clear */}
          <button
            onClick={() => setLogs([])}
            className="text-xs px-2 py-1 rounded border transition-colors"
            style={{ borderColor: "#252825", color: "#4a5450" }}
          >
            clear
          </button>
        </div>
      </div>

      {/* Log Lines */}
      <div
        className="flex-1 overflow-y-auto p-4 font-mono
                   text-xs space-y-0.5"
        style={{ background: "#0a0c0a" }}
      >
        {filtered.length === 0 && (
          <p style={{ color: "#3d4040" }}>
            waiting for logs... {connected ? "●" : "○"}
          </p>
        )}
        {filtered.map((log) => (
          <div
            key={log.id}
            className="flex gap-3 leading-5 hover:bg-bg-tertiary
                       rounded px-1"
          >
            <span
              className="tabular-nums flex-shrink-0"
              style={{ color: "#3d4040" }}
            >
              {new Date(log.timestamp).toLocaleTimeString("en-GB", {
                hour12: false,
              })}
            </span>
            <span
              className="uppercase font-bold w-7 flex-shrink-0"
              style={{ color: levelDot[log.level] }}
            >
              {log.level.slice(0, 3)}
            </span>
            <span style={{ color: logLevelColors[log.level] as string }}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div
        className="px-4 py-1.5 border-t flex items-center
                   justify-between flex-shrink-0"
        style={{ borderColor: "#1a1d1a" }}
      >
        <span className="text-xs" style={{ color: "#3d4040" }}>
          {filtered.length} lines
        </span>
        <span className="text-xs" style={{ color: "#3d4040" }}>
          {paused ? "PAUSED" : "LIVE"} ▌
        </span>
      </div>
    </div>
  );
}