"use client";

import { useState } from "react";
import {
  Wifi, WifiOff, Filter, Download,
  Trash2, X, Radio, Terminal,
  AlertTriangle, CheckCircle2, Info, Zap,
} from "lucide-react";
import LiveLogTerminal from "@/components/logs/LiveLogTerminal";
import { useLiveLogs }  from "@/hooks/useLiveLogs";

const LOG_LEVELS = [
  { value: "all",     label: "all levels", dot: "#4a5450" },
  { value: "info",    label: "info",       dot: "#60a5fa" },
  { value: "success", label: "success",    dot: "#10b981" },
  { value: "warn",    label: "warn",       dot: "#fbbf24" },
  { value: "error",   label: "error",      dot: "#f87171" },
];

export default function LogsPage() {
  // BUGFIX: hook ka actual return shape `{ logs, stats, isPaused, ... }` hai,
  // "data" naam ka koi property kabhi nahi tha — isliye initialLogs hamesha
  // [] rehta tha aur header ke counts/pills sab 0 dikhte the.
  const {
    logs:        initialLogs,
    stats,
    wsConnected,
    refresh,
  } = useLiveLogs({ limit: 300 });

  // BUGFIX: yeh page apna khud ka paused/search/levelFilter/autoScroll
  // state rakhta tha aur <LiveLogTerminal> ko prop ke roop mein bhej raha
  // tha — lekin LiveLogTerminal ki Props interface mein yeh fields exist
  // hi nahi karti (sirf `initialLogs` aur `height` leta hai). Matlab:
  //   • Header ke pause/clear/export buttons kuch nahi karte the
  //   • Header ka search/filter terminal ko affect nahi karta tha
  //   • Saath mein LiveLogTerminal apna ALAG socket khud connect karta hai
  //     (useLiveLogs hook bhi apna socket connect karta hai) — matlab
  //     2 WebSocket connections ek saath chal rahe the.
  //
  // Fix: LiveLogTerminal apne andar pause/filter/search/clear/export
  // bilkul sahi se already implement karta hai — usko hi single source
  // of truth rehne do. Yeh page sirf REST snapshot (useLiveLogs hook) se
  // header stats/pills dikhayega — yeh purely informational hai,
  // interactive control LiveLogTerminal ke apne UI mein hi hai.
  const [search, setSearch] = useState("");

  const filteredPreview = search
    ? initialLogs.filter((l) =>
        l.message.toLowerCase().includes(search.toLowerCase())
      )
    : initialLogs;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .lp-root {
          
          color: #c8d9cc;
          animation: lp-in 0.3s ease;
        }

        @keyframes lp-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }

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

        .lp-title .dollar { color: #6366f1; }

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
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          color: #10b981;
        }

        .lp-ws-badge.disconnected {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          color: #f87171;
        }

        .lp-ws-dot { width: 5px; height: 5px; border-radius: 50%; }

        .lp-ws-badge.connected .lp-ws-dot {
          background: #10b981;
          box-shadow: 0 0 5px rgba(16,185,129,0.6);
          animation: lp-pulse 2s ease-in-out infinite;
        }

        .lp-ws-badge.disconnected .lp-ws-dot { background: #f87171; }

        @keyframes lp-pulse {
          0%,100% { box-shadow: 0 0 4px rgba(16,185,129,0.4); }
          50%      { box-shadow: 0 0 9px rgba(16,185,129,0.73); }
        }

        .lp-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .lp-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          
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
          border: 1px solid rgba(255,255,255,0.1);
        }

        .lp-btn-ghost:hover { background: #0f172a; color: #8aaa80; border-color: #253523; }

        .lp-pill-row { display: flex; gap: 7px; margin-bottom: 16px; flex-wrap: wrap; }

        .lp-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          padding: 5px 11px;
          border-radius: 20px;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          
        }

        .lp-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .lp-pill-label { color: #3d5040; }
        .lp-pill-count { color: #8aaa80; font-weight: 600; }

        .lp-filterbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .lp-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 300px; }

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
          padding: 2px;
        }

        .lp-search-clear:hover { color: #8aaa80; }

        .lp-input {
          width: 100%;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
          padding: 8px 30px 8px 32px;
          color: #b8d8bc;
          
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s;
        }

        .lp-input:focus {
          border-color: rgba(99,102,241,0.3);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.04);
        }

        .lp-input::placeholder { color: #1e2e20; }

        .lp-hint {
          font-size: 9px;
          color: #2e4035;
          letter-spacing: 0.04em;
        }

        .lp-statsbar { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }

        .lp-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          padding: 6px 12px;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 7px;
        }

        .lp-stat-val { font-weight: 600; }
        .lp-stat-val.green { color: #10b981; }
        .lp-stat-val.blue  { color: #60a5fa; }
        .lp-stat-val.amber { color: #fbbf24; }
        .lp-stat-val.red   { color: #f87171; }
        .lp-stat-val.acid  { color: #6366f1; }
        .lp-stat-label { color: #2e4035; }

        .lp-terminal-wrap {
          background: #020617;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }

        .lp-term-chrome {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #0f172a;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .lp-term-dots { display: flex; gap: 6px; align-items: center; }

        .lp-term-dot { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.1); }

        .lp-term-dot.green {
          background: #6366f1;
          box-shadow: 0 0 6px rgba(99,102,241,0.53);
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

        .lp-term-meta { display: flex; align-items: center; gap: 10px; font-size: 10px; color: #2e4035; }

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
              <span className={`lp-ws-badge ${wsConnected ? "connected" : "disconnected"}`}>
                <span className="lp-ws-dot" />
                {wsConnected ? "connected" : "disconnected"}
              </span>
            </div>
          </div>

          {/* BUGFIX: yeh buttons ab terminal ke real controls ko reflect
              karte hain — refresh sirf REST snapshot refetch karta hai
              (header stats/pills update karne ke liye). Live pause/clear/
              export terminal ke apne top-bar mein hai, woh hi single
              source of truth hai is data ke liye. */}
          <div className="lp-header-actions">
            <button onClick={refresh} className="lp-btn lp-btn-ghost">
              <Radio size={12} />
              refresh stats
            </button>
          </div>
        </div>

        {/* ── Level pills — informational snapshot, REST data se ── */}
        <div className="lp-pill-row">
          {LOG_LEVELS.map((l) => (
            <span key={l.value} className="lp-pill">
              <span
                className="lp-pill-dot"
                style={{ background: l.dot }}
              />
              <span className="lp-pill-label">{l.label}</span>
              <span className="lp-pill-count">
                {l.value === "all" ? stats.total : (stats as Record<string, number>)[l.value] ?? 0}
              </span>
            </span>
          ))}
          <span className="lp-hint">· snapshot from last refresh, live count is below in terminal</span>
        </div>

        {/* ── Search — sirf header pills ke preview ke liye, terminal ka
            apna independent search box hai jo asli filtering karta hai ── */}
        <div className="lp-filterbar">
          <div className="lp-search-wrap">
            <Filter size={11} className="lp-search-icon" />
            <input
              type="text"
              placeholder="preview filter (snapshot only)..."
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
        </div>

        {/* ── Stats bar ── */}
        <div className="lp-statsbar">
          <div className="lp-stat">
            <Zap size={11} color="#6366f1" />
            <span className="lp-stat-val acid">{filteredPreview.length}</span>
            <span className="lp-stat-label">matching entries</span>
          </div>
          <div className="lp-stat">
            <CheckCircle2 size={11} color="#10b981" />
            <span className="lp-stat-val green">{stats.success}</span>
            <span className="lp-stat-label">success</span>
          </div>
          <div className="lp-stat">
            <Info size={11} color="#60a5fa" />
            <span className="lp-stat-val blue">{stats.info}</span>
            <span className="lp-stat-label">info</span>
          </div>
          <div className="lp-stat">
            <AlertTriangle size={11} color="#fbbf24" />
            <span className="lp-stat-val amber">{stats.warn}</span>
            <span className="lp-stat-label">warnings</span>
          </div>
          <div className="lp-stat">
            <X size={11} color="#f87171" />
            <span className="lp-stat-val red">{stats.error}</span>
            <span className="lp-stat-label">errors</span>
          </div>
        </div>

        {/* ── Terminal — single source of truth for live stream,
            pause, search, level filter, clear, export sab yahi handle
            karta hai apne andar (self-contained, working component) ── */}
        <div className="lp-terminal-wrap">
          <div className="lp-term-chrome">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="lp-term-dots">
                <div className={`lp-term-dot ${wsConnected ? "green" : ""}`} />
                <div className="lp-term-dot" />
                <div className="lp-term-dot" />
              </div>
              <div className="lp-term-title">
                <Terminal size={11} />
                backup-os <em>·</em> live_logs
              </div>
            </div>
            <div className="lp-term-meta">
              <span>300 log buffer</span>
            </div>
          </div>

          <LiveLogTerminal
            initialLogs={initialLogs}
            height={560}
          />
        </div>

      </div>
    </>
  );
}