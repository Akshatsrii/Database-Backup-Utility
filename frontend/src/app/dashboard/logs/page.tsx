"use client";

import { useState } from "react";
import {
  Activity, Wifi, WifiOff, Filter, Download,
  Trash2, X, ChevronDown, Radio, Terminal,
  AlertTriangle, CheckCircle2, Info, Zap,
} from "lucide-react";
import LiveLogTerminal from "@/components/logs/LiveLogTerminal";
import { useLiveLogs }  from "@/hooks/useLiveLogs";

const LOG_LEVELS = [
  { value: "all",     label: "all levels",  dot: "#4a5450",  count: null },
  { value: "info",    label: "info",         dot: "#60a5fa",  icon: Info          },
  { value: "success", label: "success",      dot: "#4ade80",  icon: CheckCircle2  },
  { value: "warn",    label: "warn",         dot: "#fbbf24",  icon: AlertTriangle },
  { value: "error",   label: "error",        dot: "#f87171",  icon: X             },
];

export default function LogsPage() {
  const { data: initialLogs = [] } = useLiveLogs(300);

  const [levelFilter,  setLevelFilter]  = useState("all");
  const [paused,       setPaused]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [autoScroll,   setAutoScroll]   = useState(true);

  // Derive counts from initialLogs
  const levelCounts = LOG_LEVELS.slice(1).reduce((acc, l) => {
    acc[l.value] = initialLogs.filter((lg: any) =>
      (lg.level ?? lg.type ?? "").toLowerCase() === l.value
    ).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .lp-root {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          color: #c8d9cc;
          animation: lp-in 0.3s ease;
        }

        @keyframes lp-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .lp-title {
          font-size: 18px;
          font-weight: 700;
          color: #e8edea;
          display: flex;
          align-items: center;
          gap: 7px;
          line-height: 1;
        }

        .lp-title .dollar { color: #b8f53a; }

        .lp-subtitle {
          font-size: 10px;
          color: #3d5040;
          margin-top: 5px;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lp-ws-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 10px;
          letter-spacing: 0.06em;
        }

        .lp-ws-badge.connected {
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.2);
          color: #4ade80;
        }

        .lp-ws-badge.paused {
          background: rgba(251,191,36,0.08);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fbbf24;
        }

        .lp-ws-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
        }

        .lp-ws-badge.connected .lp-ws-dot {
          background: #4ade80;
          box-shadow: 0 0 5px #4ade8099;
          animation: lp-pulse 2s ease-in-out infinite;
        }

        .lp-ws-badge.paused .lp-ws-dot { background: #fbbf24; }

        @keyframes lp-pulse {
          0%,100% { box-shadow: 0 0 4px #4ade8066; }
          50%      { box-shadow: 0 0 9px #4ade80bb; }
        }

        .lp-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Buttons ── */
        .lp-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .lp-btn-ghost {
          background: transparent;
          color: #4a6450;
          border: 1px solid #1a2418;
        }

        .lp-btn-ghost:hover { background: #0c130e; color: #8aaa80; border-color: #253523; }

        .lp-btn-pause {
          background: transparent;
          color: #fbbf24;
          border: 1px solid rgba(251,191,36,0.25);
        }

        .lp-btn-pause:hover { background: rgba(251,191,36,0.06); }

        .lp-btn-resume {
          background: rgba(74,222,128,0.08);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,0.25);
        }

        .lp-btn-resume:hover { background: rgba(74,222,128,0.14); }

        .lp-btn-danger {
          background: transparent;
          color: #e05555;
          border: 1px solid rgba(224,85,85,0.2);
        }

        .lp-btn-danger:hover { background: rgba(224,85,85,0.06); border-color: rgba(224,85,85,0.35); }

        /* ── Level pills ── */
        .lp-pill-row {
          display: flex;
          gap: 7px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .lp-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          padding: 5px 11px;
          border-radius: 20px;
          background: #0c130e;
          border: 1px solid #1a2418;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'JetBrains Mono', monospace;
        }

        .lp-pill:hover { border-color: #253523; background: #0e160f; }

        .lp-pill.active {
          border-color: rgba(184,245,58,0.3);
          background: rgba(184,245,58,0.05);
        }

        .lp-pill-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .lp-pill-label { color: #3d5040; }
        .lp-pill-count { color: #8aaa80; font-weight: 600; }
        .lp-pill.active .lp-pill-label { color: #8aaa80; }
        .lp-pill.active .lp-pill-count { color: #b8f53a; }

        /* ── Filter bar ── */
        .lp-filterbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .lp-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 300px;
        }

        .lp-search-icon {
          position: absolute;
          left: 11px; top: 50%;
          transform: translateY(-50%);
          color: #3d5040;
          pointer-events: none;
        }

        .lp-search-clear {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #3d5040;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.15s;
          padding: 2px;
        }

        .lp-search-clear:hover { color: #8aaa80; }

        .lp-input {
          width: 100%;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 7px;
          padding: 8px 30px 8px 32px;
          color: #b8d8bc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s;
        }

        .lp-input:focus {
          border-color: rgba(184,245,58,0.3);
          box-shadow: 0 0 0 3px rgba(184,245,58,0.04);
        }

        .lp-input::placeholder { color: #1e2e20; }

        /* ── Auto-scroll toggle ── */
        .lp-toggle-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: #3d5040;
        }

        .lp-toggle {
          width: 32px; height: 17px;
          border-radius: 10px;
          background: #1a2418;
          border: 1px solid #253523;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .lp-toggle.on { background: rgba(184,245,58,0.2); border-color: rgba(184,245,58,0.4); }

        .lp-toggle-thumb {
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #3d5040;
          position: absolute;
          top: 2px; left: 2px;
          transition: all 0.2s;
        }

        .lp-toggle.on .lp-toggle-thumb {
          background: #b8f53a;
          left: 17px;
          box-shadow: 0 0 6px #b8f53a88;
        }

        /* ── Stats bar ── */
        .lp-statsbar {
          display: flex;
          gap: 6px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .lp-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          padding: 6px 12px;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 7px;
        }

        .lp-stat-val { font-weight: 600; }
        .lp-stat-val.green  { color: #4ade80; }
        .lp-stat-val.blue   { color: #60a5fa; }
        .lp-stat-val.amber  { color: #fbbf24; }
        .lp-stat-val.red    { color: #f87171; }
        .lp-stat-val.acid   { color: #b8f53a; }
        .lp-stat-label { color: #2e4035; }

        /* ── Terminal wrapper ── */
        .lp-terminal-wrap {
          background: #080d0a;
          border: 1px solid #1a2418;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        /* Terminal top chrome */
        .lp-term-chrome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #0c130e;
          border-bottom: 1px solid #1a2418;
        }

        .lp-term-dots { display: flex; gap: 6px; align-items: center; }

        .lp-term-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          background: #1a2418;
        }

        .lp-term-dot.green {
          background: #b8f53a;
          box-shadow: 0 0 6px #b8f53a88;
          animation: lp-pulse 2.5s ease-in-out infinite;
        }

        .lp-term-title {
          font-size: 10px;
          color: #3d5040;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lp-term-title em { color: #4a6450; font-style: normal; }

        .lp-term-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          color: #2e4035;
        }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .lp-header { flex-direction: column; align-items: flex-start; }
          .lp-filterbar { flex-direction: column; align-items: stretch; }
          .lp-search-wrap { max-width: 100%; }
          .lp-statsbar { gap: 5px; }
          .lp-stat { font-size: 9px; padding: 5px 9px; }
          .lp-pill { font-size: 9px; padding: 4px 9px; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Header ── */}
        <div className="lp-header">
          <div>
            <div className="lp-title">
              <span className="dollar">$</span>
              live_logs
            </div>
            <div className="lp-subtitle">
              real-time backup activity stream via websocket
              <span className={`lp-ws-badge ${paused ? "paused" : "connected"}`}>
                <span className="lp-ws-dot" />
                {paused ? "paused" : "connected"}
              </span>
            </div>
          </div>

          <div className="lp-header-actions">
            <button
              onClick={() => setPaused((p) => !p)}
              className={`lp-btn ${paused ? "lp-btn-resume" : "lp-btn-pause"}`}
            >
              {paused ? <Radio size={12} /> : <WifiOff size={12} />}
              {paused ? "resume" : "pause"}
            </button>

            <button className="lp-btn lp-btn-ghost">
              <Download size={12} />
              export
            </button>

            <button className="lp-btn lp-btn-danger">
              <Trash2 size={12} />
              clear
            </button>
          </div>
        </div>

        {/* ── Level pills ── */}
        <div className="lp-pill-row">
          {LOG_LEVELS.map((l) => (
            <button
              key={l.value}
              className={`lp-pill ${levelFilter === l.value ? "active" : ""}`}
              onClick={() => setLevelFilter(l.value)}
            >
              <span
                className="lp-pill-dot"
                style={{
                  background: l.dot,
                  boxShadow: levelFilter === l.value ? `0 0 5px ${l.dot}88` : "none",
                }}
              />
              <span className="lp-pill-label">{l.label}</span>
              <span className="lp-pill-count">
                {l.value === "all"
                  ? initialLogs.length
                  : levelCounts[l.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div className="lp-filterbar">
          <div className="lp-search-wrap">
            <Filter size={11} className="lp-search-icon" />
            <input
              type="text"
              placeholder="filter logs by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lp-input"
            />
            {search && (
              <button className="lp-search-clear" onClick={() => setSearch("")}>
                <X size={11} />
              </button>
            )}
          </div>

          {/* Auto-scroll toggle */}
          <div className="lp-toggle-row">
            <div
              className={`lp-toggle ${autoScroll ? "on" : ""}`}
              onClick={() => setAutoScroll((v) => !v)}
            >
              <div className="lp-toggle-thumb" />
            </div>
            auto-scroll
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="lp-statsbar">
          <div className="lp-stat">
            <Zap size={11} color="#b8f53a" />
            <span className="lp-stat-val acid">{initialLogs.length}</span>
            <span className="lp-stat-label">total entries</span>
          </div>
          <div className="lp-stat">
            <CheckCircle2 size={11} color="#4ade80" />
            <span className="lp-stat-val green">{levelCounts["success"] ?? 0}</span>
            <span className="lp-stat-label">success</span>
          </div>
          <div className="lp-stat">
            <Info size={11} color="#60a5fa" />
            <span className="lp-stat-val blue">{levelCounts["info"] ?? 0}</span>
            <span className="lp-stat-label">info</span>
          </div>
          <div className="lp-stat">
            <AlertTriangle size={11} color="#fbbf24" />
            <span className="lp-stat-val amber">{levelCounts["warn"] ?? 0}</span>
            <span className="lp-stat-label">warnings</span>
          </div>
          <div className="lp-stat">
            <X size={11} color="#f87171" />
            <span className="lp-stat-val red">{levelCounts["error"] ?? 0}</span>
            <span className="lp-stat-label">errors</span>
          </div>
        </div>

        {/* ── Terminal with chrome ── */}
        <div className="lp-terminal-wrap">
          {/* Chrome bar */}
          <div className="lp-term-chrome">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="lp-term-dots">
                <div className={`lp-term-dot ${!paused ? "green" : ""}`} />
                <div className="lp-term-dot" />
                <div className="lp-term-dot" />
              </div>
              <div className="lp-term-title">
                <Terminal size={11} />
                backup-os <em>·</em> live_logs
              </div>
            </div>
            <div className="lp-term-meta">
              {paused && (
                <span style={{ color: "#fbbf24", fontSize: 10 }}>⏸ stream paused</span>
              )}
              <span>300 log buffer</span>
            </div>
          </div>

          {/* Actual terminal component */}
          <LiveLogTerminal
            initialLogs={initialLogs}
            height={560}
            paused={paused}
            levelFilter={levelFilter}
            search={search}
            autoScroll={autoScroll}
          />
        </div>

      </div>
    </>
  );
}