"use client";

import { usePathname } from "next/navigation";
import { Bell, Terminal } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":           "dashboard",
  "/dashboard/backups":   "backup_history",
  "/dashboard/restore":   "restore_ops",
  "/dashboard/scheduler": "scheduler",
  "/dashboard/logs":      "live_logs",
  "/dashboard/settings":  "settings",
};

export default function TopBar() {
  const path = usePathname();
  const title = PAGE_TITLES[path] ?? "dashboard";

  return (
    <header
      className="fixed top-0 right-0 z-10 flex items-center justify-between px-6 h-12"
      style={{
        left: "224px",
        background: "rgba(13,15,13,0.8)",
        borderBottom: "1px solid #252825",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 text-xs"
        style={{ color: "#8a9690" }}
      >
        <Terminal size={12} style={{ color: "#b8f53a" }} />
        <span style={{ color: "#4a5450" }}>~/</span>
        <span style={{ color: "#b8f53a" }}>{title}</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <span
          className="text-xs tabular-nums"
          style={{ color: "#4a5450" }}
        >
          {new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <button
          className="relative p-1 rounded hover:bg-bg-tertiary transition-colors"
          style={{ color: "#8a9690" }}
        >
          <Bell size={14} />
        </button>
      </div>
    </header>
  );
}