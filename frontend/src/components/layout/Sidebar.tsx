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

// ─── Nav items ───────────────────────────────────────────────────────────────
const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "dashboard", exact: true,  badge: null   },
  { href: "/dashboard/backups",   icon: Database,        label: "backups",   exact: false, badge: null   },
  { href: "/dashboard/restore",   icon: RotateCcw,       label: "restore",   exact: false, badge: null   },
  { href: "/dashboard/scheduler", icon: Clock,           label: "scheduler", exact: false, badge: null   },
  { href: "/dashboard/logs",      icon: ScrollText,      label: "logs",      exact: false, badge: "live" },
  { href: "/dashboard/settings",  icon: Settings,        label: "settings",  exact: false, badge: null   },
  { href: "/about",               icon: Shield,          label: "about",     exact: true,  badge: null   },
];

// ─── Live clock ──────────────────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }));
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Session uptime ───────────────────────────────────────────────────────────
function useUptime() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1_000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// ─── Mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ value, color = "#6366f1" }: { value: number; color?: string }) {
  return (
    <div className="h-0.5 w-full rounded-full overflow-hidden"
      style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUGFIX: pehle SIDEBAR_CSS const tha aur <style dangerouslySetInnerHTML>
// se inject hota tha — content:"" property hydration mismatch cause
// karta hai (server HTML-encodes quotes, client nahi karta).
// Saari CSS ab globals.css mein move kar di gayi hai (sb-* classes).
// ═══════════════════════════════════════════════════════════════════════════

export default function Sidebar() {
  const path   = usePathname();
  const router = useRouter();
  const clock  = useClock();
  const uptime = useUptime();

  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [username,    setUsername]    = useState("admin");

  useEffect(() => {
    const u = localStorage.getItem("bu_user");
    if (u) setUsername(u);
  }, []);

  const [sysStats] = useState({ storage: 68, uptime: 99.8, backups: 42, connections: 4 });

  const handleLogout = () => {
    localStorage.removeItem("bu_user");
    router.push("/");
  };

  return (
    // NO <style> tag — CSS is in globals.css (sb-* classes)
    <aside className="sb-root">

      {/* ── Logo ── */}
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
        <div className="sb-status-pill">
          <span className="sb-status-dot" />
          <span>online</span>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="sb-quick-wrap">
        <Link href="/dashboard/backups" className="sb-quick-btn">
          <Plus size={11} /> new backup
        </Link>
        <Link href="/dashboard/logs" className="sb-quick-btn-ghost">
          <Activity size={11} /> live logs
        </Link>
      </div>

      {/* ── Nav ── */}
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
              <span className="sb-nav-accent" style={{ opacity: active ? 1 : 0 }} />
              <span className="sb-nav-icon" style={{
                background: active ? "rgba(99,102,241,0.12)" : hovered ? "rgba(255,255,255,0.04)" : "transparent",
                color: active ? "#6366f1" : "#64748b",
              }}>
                <Icon size={13} />
              </span>
              <span className="sb-nav-label-text" style={{
                color: active ? "#ffffff" : hovered ? "#cbd5e1" : "#64748b",
              }}>
                {label}
              </span>
              <span className="sb-nav-right">
                {badge
                  ? <span className="sb-badge">{badge}</span>
                  : active
                  ? <ChevronRight size={10} style={{ color: "#6366f1" }} />
                  : null}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── System stats ── */}
      <div className="sb-stats">
        <p className="sb-nav-label">system</p>
        <div className="sb-stat-row">
          <div className="sb-stat-head">
            <div className="flex items-center gap-1.5">
              <HardDrive size={10} style={{ color: "#64748b" }} />
              <span>storage</span>
            </div>
            <span style={{ color: "#6366f1" }}>{sysStats.storage}%</span>
          </div>
          <MiniBar value={sysStats.storage} color="#6366f1" />
        </div>
        <div className="sb-stat-row">
          <div className="sb-stat-head">
            <div className="flex items-center gap-1.5">
              <Zap size={10} style={{ color: "#64748b" }} />
              <span>uptime</span>
            </div>
            <span style={{ color: "#10b981" }}>{sysStats.uptime}%</span>
          </div>
          <MiniBar value={sysStats.uptime} color="#10b981" />
        </div>
        <div className="sb-stat-counts">
          <div className="sb-count-item">
            <Database size={10} style={{ color: "#6366f1" }} />
            <span style={{ color: "#6366f1" }}>{sysStats.backups}</span>
            <span>backups</span>
          </div>
          <div className="sb-count-divider" style={{ background: "#334155" }} />
          <div className="sb-count-item">
            <Wifi size={10} style={{ color: "#3b82f6" }} />
            <span style={{ color: "#3b82f6" }}>{sysStats.connections}</span>
            <span>conns</span>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="sb-footer">
        <div className="sb-clock-row">
          <div className="sb-clock">{clock || "00:00:00"}</div>
          <div className="sb-date">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short", day: "2-digit", month: "short",
            })}
          </div>
        </div>
        <div className="sb-uptime-row">
          <span>session</span>
          <span style={{ color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
            {uptime}
          </span>
        </div>
        <div className="sb-user-row">
          <div className="sb-user-avatar">
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="sb-user-info">
            <p className="sb-user-name">{username}</p>
            <p className="sb-user-role">admin</p>
          </div>
          <button onClick={handleLogout} className="sb-logout-btn" title="logout">
            <LogOut size={12} />
          </button>
        </div>
      </div>

    </aside>
  );
}