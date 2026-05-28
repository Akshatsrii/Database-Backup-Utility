"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Terminal } from "lucide-react";

/* ── route config ────────────────────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":           "dashboard",
  "/dashboard/backups":   "backup_history",
  "/dashboard/restore":   "restore_ops",
  "/dashboard/scheduler": "scheduler",
  "/dashboard/logs":      "live_logs",
  "/dashboard/settings":  "settings",
};

/* resolve title with partial-match fallback (handles sub-routes) */
function resolveTitle(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => k !== "/dashboard" && path.startsWith(k))
    .sort((a, b) => b.length - a.length)[0]; // most-specific match
  return match ? PAGE_TITLES[match] : "dashboard";
}

/* build breadcrumb segments from pathname */
function buildSegments(path: string): { label: string; full: string }[] {
  const parts = path.replace(/^\//, "").split("/");
  return parts.map((part, i) => ({
    label: part,
    full:  "/" + parts.slice(0, i + 1).join("/"),
  }));
}

/* ── live clock ──────────────────────────────────────────── */

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, 10_000); // minute-resolution is fine for topbar; 10s keeps it snappy
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── topbar ──────────────────────────────────────────────── */

interface TopBarProps {
  /** pass unread count from notification state */
  unreadCount?: number;
  onBellClick?: () => void;
}

export default function TopBar({ unreadCount = 0, onBellClick }: TopBarProps) {
  const path     = usePathname();
  const clock    = useClock();
  const title    = resolveTitle(path);
  const segments = buildSegments(path);

  /* sync browser tab title */
  useEffect(() => {
    document.title = `${title} · BackupOS`;
  }, [title]);

  return (
    <header
      className="fixed top-0 right-0 z-10 flex items-center justify-between px-6 h-12"
      style={{
        left:           "224px",
        background:     "rgba(13,15,13,0.8)",
        borderBottom:   "1px solid #252825",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* ── breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8a9690" }}>
        <Terminal size={12} style={{ color: "#b8f53a", flexShrink: 0 }} />

        <span style={{ color: "#4a5450" }}>~/</span>

        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={seg.full} className="flex items-center gap-1.5">
              {!isLast ? (
                <>
                  <span style={{ color: "#4a5450" }}>{seg.label}</span>
                  <span style={{ color: "#2e3830" }}>/</span>
                </>
              ) : (
                <span style={{ color: "#b8f53a" }}>{title}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* ── right side ── */}
      <div className="flex items-center gap-4">
        {/* live clock */}
        <span className="text-xs tabular-nums" style={{ color: "#4a5450" }}>
          {clock}
        </span>

        {/* bell with unread badge */}
        <button
          onClick={onBellClick}
          className="relative p-1 rounded transition-colors"
          style={{ color: unreadCount > 0 ? "#e8edea" : "#8a9690" }}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "Notifications"
          }
        >
          <Bell size={14} />

          {unreadCount > 0 && (
            <span
              className="absolute flex items-center justify-center"
              style={{
                top:          -3,
                right:        -3,
                minWidth:     14,
                height:       14,
                padding:      "0 3px",
                borderRadius: 999,
                background:   "#ff4444",
                color:        "#fff",
                fontSize:     9,
                fontFamily:   "JetBrains Mono, monospace",
                fontWeight:   700,
                lineHeight:   1,
                pointerEvents: "none",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}