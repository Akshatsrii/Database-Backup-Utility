"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const NAV = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Dashboard"  },
  { href: "/dashboard/backups",   icon: Database,        label: "Backups"    },
  { href: "/dashboard/restore",   icon: RotateCcw,       label: "Restore"    },
  { href: "/dashboard/scheduler", icon: Clock,           label: "Scheduler"  },
  { href: "/dashboard/logs",      icon: ScrollText,      label: "Logs"       },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings"   },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="fixed top-0 left-0 h-full w-56 flex flex-col z-20"
      style={{
        background: "#101210",
        borderRight: "1px solid #252825",
      }}
    >
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
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
                      color: "#b8f53a",
                      border: "1px solid rgba(184,245,58,0.15)",
                    }
                  : {}
              }
            >
              <Icon size={14} />
              {label}
              {active && (
                <span className="ml-auto w-1 h-1 rounded-full" style={{ background: "#b8f53a" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom system info */}
      <div className="px-5 py-4 border-t space-y-1" style={{ borderColor: "#252825" }}>
        <div className="flex items-center gap-1.5">
          <span className="status-dot" style={{ background: "#4ade80", boxShadow: "0 0 4px #4ade80" }} />
          <span className="text-xs" style={{ color: "#4a5450" }}>system online</span>
        </div>
        <p className="text-xs" style={{ color: "#4a5450" }}>
          {new Date().toLocaleDateString("en-GB")}
        </p>
      </div>
    </aside>
  );
}