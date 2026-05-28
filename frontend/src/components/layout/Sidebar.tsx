"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Database,
  RotateCcw,
  Clock,
  ScrollText,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── nav items ───────────────────────────────────────────── */

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Dashboard",  exact: true  },
  { href: "/dashboard/backups",   icon: Database,        label: "Backups",    exact: false },
  { href: "/dashboard/restore",   icon: RotateCcw,       label: "Restore",    exact: false },
  { href: "/dashboard/scheduler", icon: Clock,           label: "Scheduler",  exact: false },
  { href: "/dashboard/logs",      icon: ScrollText,      label: "Logs",       exact: false },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings",   exact: false },
];

/* ── live clock ──────────────────────────────────────────── */

function useClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── pulse keyframe (injected once) ─────────────────────── */

const PULSE_CSS = `
@keyframes sb-pulse {
  0%, 100% { box-shadow: 0 0 4px #4ade80; opacity: 1; }
  50%       { box-shadow: 0 0 8px #4ade80; opacity: 0.6; }
}
`;

/* ── sidebar ─────────────────────────────────────────────── */

export default function Sidebar() {
  const path  = usePathname();
  const clock = useClock();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PULSE_CSS }} />

      <aside
        className="fixed top-0 left-0 h-full w-56 flex flex-col z-20"
        style={{
          background:  "#101210",
          borderRight: "1px solid #252825",
        }}
      >
        {/* ── logo ── */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "#252825" }}>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "#b8f53a" }} />
            <span
              className="font-bold text-sm tracking-tight"
              style={{ color: "#b8f53a" }}
            >
              [BackupOS]
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            v1.0.0 · production
          </p>
        </div>

        {/* ── nav ── */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5"
          aria-label="Main navigation"
        >
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? path === href : path.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-xs tracking-wide transition-all",
                  active
                    ? "font-semibold"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                )}
                style={
                  active
                    ? {
                        background: "rgba(184,245,58,0.08)",
                        color:      "#b8f53a",
                        border:     "1px solid rgba(184,245,58,0.15)",
                      }
                    : {}
                }
              >
                <Icon
                  size={14}
                  style={{
                    flexShrink: 0,
                    /* dim inactive icons slightly */
                    opacity: active ? 1 : 0.6,
                    transition: "opacity 0.15s ease",
                  }}
                />

                <span className="truncate">{label}</span>

                {active && (
                  <span
                    className="ml-auto w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: "#b8f53a" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── system footer ── */}
        <div
          className="px-5 py-4 border-t space-y-1.5"
          style={{ borderColor: "#252825" }}
        >
          {/* status + live clock */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: "#4ade80",
                  animation: "sb-pulse 2.4s ease-in-out infinite",
                }}
              />
              <span className="text-xs" style={{ color: "#4a5450" }}>
                online
              </span>
            </div>

            <span
              className="text-xs tabular-nums"
              style={{ color: "#4a5450", fontVariantNumeric: "tabular-nums" }}
            >
              {clock}
            </span>
          </div>

          {/* date */}
          <p className="text-xs" style={{ color: "#4a5450" }}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day:     "2-digit",
              month:   "short",
              year:    "numeric",
            })}
          </p>
        </div>
      </aside>
    </>
  );
}