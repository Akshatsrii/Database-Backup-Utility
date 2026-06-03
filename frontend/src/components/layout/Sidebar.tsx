"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard, Database, RotateCcw,
  Clock, ScrollText, Settings, Shield,
  ChevronRight, Zap, HardDrive, Wifi,
  LogOut, Activity, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav items ──────────────────────────────────────────────────────────────
const NAV = [
  {
    href:   "/dashboard",
    icon:   LayoutDashboard,
    label:  "dashboard",
    exact:  true,
    badge:  null,
  },
  {
    href:   "/dashboard/backups",
    icon:   Database,
    label:  "backups",
    exact:  false,
    badge:  null,
  },
  {
    href:   "/dashboard/restore",
    icon:   RotateCcw,
    label:  "restore",
    exact:  false,
    badge:  null,
  },
  {
    href:   "/dashboard/scheduler",
    icon:   Clock,
    label:  "scheduler",
    exact:  false,
    badge:  null,
  },
  {
    href:   "/dashboard/logs",
    icon:   ScrollText,
    label:  "logs",
    exact:  false,
    badge:  "live",
  },
  {
    href:   "/dashboard/settings",
    icon:   Settings,
    label:  "settings",
    exact:  false,
    badge:  null,
  },
];

// ─── Live clock ──────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour:   "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

// ─── Uptime counter ──────────────────────────────────────────────────────────
function useUptime() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Mini bar ────────────────────────────────────────────────────────────────
function MiniBar({
  value,
  color = "#b8f53a",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div
      className="h-0.5 w-full rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const clock  = useClock();
  const uptime = useUptime();

  // Hover state for nav items
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Username from localStorage
  const [username, setUsername] = useState("admin");
  useEffect(() => {
    const u = localStorage.getItem("bu_user");
    if (u) setUsername(u);
  }, []);

  // Mock system stats — in production connect to /api/health
  const [sysStats] = useState({
    storage:    68,
    uptime:     99.8,
    backups:    42,
    connections: 4,
  });

  const handleLogout = () => {
    localStorage.removeItem("bu_user");
    router.push("/");
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      <aside className="sb-root">

        {/* ── Logo ─────────────────────────────────────────────────── */}
        <div className="sb-logo-wrap">
          <div className="sb-logo-inner">
            <div className="sb-logo-icon">
              <Shield size={14} />
            </div>
            <div>
              <p className="sb-logo-text">[BackupOS]</p>
              <p className="sb-logo-sub">v1.0.0 · production</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="sb-status-pill">
            <span className="sb-status-dot" />
            <span>online</span>
          </div>
        </div>

        {/* ── Quick action ─────────────────────────────────────────── */}
        <div className="sb-quick-wrap">
          <Link href="/dashboard/backups" className="sb-quick-btn">
            <Plus size={11} />
            new backup
          </Link>
          <Link href="/dashboard/logs" className="sb-quick-btn-ghost">
            <Activity size={11} />
            live logs
          </Link>
        </div>

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav className="sb-nav" aria-label="Main navigation">
          <p className="sb-nav-label">navigation</p>

          {NAV.map(({ href, icon: Icon, label, exact, badge }) => {
            const active  = exact ? path === href : path.startsWith(href);
            const hovered = hoveredHref === href && !active;

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("sb-nav-item", active && "sb-nav-item--active")}
                onMouseEnter={() => setHoveredHref(href)}
                onMouseLeave={() => setHoveredHref(null)}
              >
                {/* Left accent line */}
                <span
                  className="sb-nav-accent"
                  style={{ opacity: active ? 1 : 0 }}
                />

                {/* Icon */}
                <span
                  className="sb-nav-icon"
                  style={{
                    background: active
                      ? "rgba(184,245,58,0.12)"
                      : hovered
                      ? "rgba(255,255,255,0.04)"
                      : "transparent",
                    color: active ? "#b8f53a" : "#4a5450",
                  }}
                >
                  <Icon size={13} />
                </span>

                {/* Label */}
                <span
                  className="sb-nav-label-text"
                  style={{
                    color: active
                      ? "#e8edea"
                      : hovered
                      ? "#8a9690"
                      : "#4a5450",
                  }}
                >
                  {label}
                </span>

                {/* Badge or chevron */}
                <span className="sb-nav-right">
                  {badge ? (
                    <span className="sb-badge">{badge}</span>
                  ) : active ? (
                    <ChevronRight size={10} style={{ color: "#b8f53a" }} />
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ── System stats ─────────────────────────────────────────── */}
        <div className="sb-stats">
          <p className="sb-nav-label">system</p>

          {/* Storage */}
          <div className="sb-stat-row">
            <div className="sb-stat-head">
              <div className="flex items-center gap-1.5">
                <HardDrive size={10} style={{ color: "#4a5450" }} />
                <span>storage</span>
              </div>
              <span style={{ color: "#b8f53a" }}>{sysStats.storage}%</span>
            </div>
            <MiniBar value={sysStats.storage} color="#b8f53a" />
          </div>

          {/* Uptime */}
          <div className="sb-stat-row">
            <div className="sb-stat-head">
              <div className="flex items-center gap-1.5">
                <Zap size={10} style={{ color: "#4a5450" }} />
                <span>uptime</span>
              </div>
              <span style={{ color: "#4ade80" }}>
                {sysStats.uptime}%
              </span>
            </div>
            <MiniBar value={sysStats.uptime} color="#4ade80" />
          </div>

          {/* Quick counts */}
          <div className="sb-stat-counts">
            <div className="sb-count-item">
              <Database size={10} style={{ color: "#b8f53a" }} />
              <span style={{ color: "#b8f53a" }}>{sysStats.backups}</span>
              <span>backups</span>
            </div>
            <div
              className="sb-count-divider"
              style={{ background: "#252825" }}
            />
            <div className="sb-count-item">
              <Wifi size={10} style={{ color: "#38bdf8" }} />
              <span style={{ color: "#38bdf8" }}>{sysStats.connections}</span>
              <span>conns</span>
            </div>
          </div>
        </div>

        {/* ── User + clock ─────────────────────────────────────────── */}
        <div className="sb-footer">
          {/* Clock + date */}
          <div className="sb-clock-row">
            <div className="sb-clock">{clock || "00:00:00"}</div>
            <div className="sb-date">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "short",
                day:     "2-digit",
                month:   "short",
              })}
            </div>
          </div>

          {/* Session uptime */}
          <div className="sb-uptime-row">
            <span>session</span>
            <span style={{ color: "#4a5450", fontVariantNumeric: "tabular-nums" }}>
              {uptime}
            </span>
          </div>

          {/* User row */}
          <div className="sb-user-row">
            <div className="sb-user-avatar">
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div className="sb-user-info">
              <p className="sb-user-name">{username}</p>
              <p className="sb-user-role">admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="sb-logout-btn"
              title="logout"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── Scoped CSS ─────────────────────────────────────────────────────────────
// Using dangerouslySetInnerHTML with class-scoped names
// to avoid hydration mismatch (no dynamic values in CSS)
const SIDEBAR_CSS = `
.sb-root {
  position: fixed;
  top: 0; left: 0;
  height: 100%;
  width: 224px;
  display: flex;
  flex-direction: column;
  z-index: 20;
  background: #0d0f0d;
  border-right: 1px solid #1c1f1c;
  overflow: hidden;
}

/* subtle inner glow on left edge */
.sb-root::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(184,245,58,0.2) 30%,
    rgba(184,245,58,0.2) 70%,
    transparent 100%
  );
  pointer-events: none;
}

/* ── Logo ── */
.sb-logo-wrap {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #1c1f1c;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sb-logo-inner { display: flex; align-items: center; gap: 10px; }

.sb-logo-icon {
  width: 28px; height: 28px;
  background: rgba(184,245,58,0.08);
  border: 1px solid rgba(184,245,58,0.2);
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: #b8f53a;
  flex-shrink: 0;
}

.sb-logo-text {
  font-size: 13px;
  font-weight: 700;
  color: #b8f53a;
  letter-spacing: -0.3px;
  line-height: 1;
}

.sb-logo-sub {
  font-size: 9px;
  color: #3d4040;
  margin-top: 2px;
  letter-spacing: 0.04em;
}

.sb-status-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 9px;
  color: #4ade80;
  background: rgba(74,222,128,0.06);
  border: 1px solid rgba(74,222,128,0.15);
  border-radius: 20px;
  padding: 3px 8px;
  letter-spacing: 0.04em;
}

.sb-status-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 5px rgba(74,222,128,0.7);
  animation: sb-pulse 2.4s ease-in-out infinite;
}

@keyframes sb-pulse {
  0%, 100% { box-shadow: 0 0 4px rgba(74,222,128,0.5); opacity: 1; }
  50%       { box-shadow: 0 0 9px rgba(74,222,128,0.9); opacity: 0.7; }
}

/* ── Quick actions ── */
.sb-quick-wrap {
  display: flex;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid #1c1f1c;
}

.sb-quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 5px;
  background: rgba(184,245,58,0.1);
  border: 1px solid rgba(184,245,58,0.2);
  color: #b8f53a;
  text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
  letter-spacing: 0.04em;
}

.sb-quick-btn:hover {
  background: rgba(184,245,58,0.16);
  box-shadow: 0 0 12px rgba(184,245,58,0.1);
}

.sb-quick-btn-ghost {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 600;
  padding: 6px 0;
  border-radius: 5px;
  background: transparent;
  border: 1px solid #252825;
  color: #4a5450;
  text-decoration: none;
  transition: color 0.15s, border-color 0.15s;
  letter-spacing: 0.04em;
}

.sb-quick-btn-ghost:hover {
  color: #8a9690;
  border-color: #3d4040;
}

/* ── Nav ── */
.sb-nav {
  flex: 1;
  padding: 10px 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
}

.sb-nav::-webkit-scrollbar { width: 0; }

.sb-nav-label {
  font-size: 9px;
  color: #2a2e2a;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0 8px;
  margin-bottom: 6px;
  font-weight: 600;
}

.sb-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 7px;
  text-decoration: none;
  transition: background 0.12s;
  border: 1px solid transparent;
}

.sb-nav-item:hover {
  background: rgba(255,255,255,0.03);
}

.sb-nav-item--active {
  background: rgba(184,245,58,0.06) !important;
  border-color: rgba(184,245,58,0.12) !important;
}

.sb-nav-accent {
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 16px;
  border-radius: 0 2px 2px 0;
  background: #b8f53a;
  box-shadow: 0 0 6px rgba(184,245,58,0.6);
  transition: opacity 0.15s;
}

.sb-nav-icon {
  width: 26px; height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.12s, color 0.12s;
}

.sb-nav-label-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  flex: 1;
  transition: color 0.12s;
}

.sb-nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sb-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  background: rgba(74,222,128,0.12);
  border: 1px solid rgba(74,222,128,0.2);
  color: #4ade80;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  animation: sb-badge-pulse 3s ease-in-out infinite;
}

@keyframes sb-badge-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

/* ── Stats ── */
.sb-stats {
  padding: 10px 12px;
  border-top: 1px solid #1c1f1c;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sb-stat-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sb-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  color: #3d4040;
  letter-spacing: 0.06em;
}

.sb-stat-counts {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.sb-count-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #3d4040;
  letter-spacing: 0.04em;
}

.sb-count-divider {
  width: 1px;
  height: 10px;
}

/* ── Footer ── */
.sb-footer {
  padding: 10px 12px;
  border-top: 1px solid #1c1f1c;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.sb-clock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sb-clock {
  font-size: 13px;
  font-weight: 700;
  color: #b8f53a;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.sb-date {
  font-size: 9px;
  color: #3d4040;
  letter-spacing: 0.04em;
}

.sb-uptime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 9px;
  color: #2a2e2a;
  letter-spacing: 0.04em;
}

.sb-user-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  background: #111411;
  border: 1px solid #1c1f1c;
  margin-top: 2px;
}

.sb-user-avatar {
  width: 24px; height: 24px;
  border-radius: 6px;
  background: rgba(184,245,58,0.1);
  border: 1px solid rgba(184,245,58,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 800;
  color: #b8f53a;
  flex-shrink: 0;
  letter-spacing: 0.06em;
}

.sb-user-info { flex: 1; min-width: 0; }

.sb-user-name {
  font-size: 11px;
  font-weight: 600;
  color: #8a9690;
  truncate: true;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-user-role {
  font-size: 9px;
  color: #3d4040;
  letter-spacing: 0.04em;
}

.sb-logout-btn {
  width: 22px; height: 22px;
  border-radius: 5px;
  background: transparent;
  border: 1px solid transparent;
  color: #3d4040;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.sb-logout-btn:hover {
  color: #ff4444;
  border-color: rgba(255,68,68,0.2);
  background: rgba(255,68,68,0.06);
}
`;