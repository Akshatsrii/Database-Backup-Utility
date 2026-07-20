"use client";

import { useEffect, useRef, useState } from "react";
import {
  Database,
  CheckCircle,
  XCircle,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { DashboardStats } from "@/types";

/* ── animated counter ───────────────────────────────────── */

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from  = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * ease));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return display;
}

/* ── trend indicator ────────────────────────────────────── */

type Trend = "up" | "down" | "flat";

function TrendIcon({ trend, accent }: { trend: Trend; accent: string }) {
  if (trend === "up")   return <TrendingUp   size={11} style={{ color: accent }} />;
  if (trend === "down") return <TrendingDown size={11} style={{ color: "#ff4444" }} />;
  return <Minus size={11} style={{ color: "#64748b" }} />;
}

/* ── stat card ──────────────────────────────────────────── */

interface StatsCardProps {
  label:   string;
  value:   string | number;
  icon:    React.ReactNode;
  sub?:    string;
  accent?: string;
  trend?:  Trend;
  /** if true, animate numeric value with countUp */
  animate?: boolean;
}

function StatCard({
  label,
  value,
  icon,
  sub,
  accent = "#6366f1",
  trend,
  animate = false,
}: StatsCardProps) {
  const [hovered, setHovered] = useState(false);

  // only animate if value is numeric
  const numericTarget = animate && typeof value === "number" ? value : null;
  const counted = useCountUp(numericTarget ?? 0, 700);
  const displayed = numericTarget !== null ? counted : value;

  return (
    <div
      className="terminal-card p-4 flex flex-col gap-3"
      style={{
        borderColor: hovered ? accent + "55" : "#334155",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? `0 0 0 1px ${accent}22` : "none",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* header row */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: "#64748b" }}
        >
          {label}
        </span>
        <span
          style={{
            color: accent,
            opacity: hovered ? 1 : 0.7,
            transition: "opacity 0.2s ease",
          }}
        >
          {icon}
        </span>
      </div>

      {/* value row */}
      <div>
        <div className="flex items-end gap-2">
          <p
            className="text-2xl font-bold tabular-nums leading-none"
            style={{ color: accent }}
          >
            {displayed}
          </p>
          {trend && (
            <span className="mb-0.5">
              <TrendIcon trend={trend} accent={accent} />
            </span>
          )}
        </div>

        {sub && (
          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── main export ────────────────────────────────────────── */

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  const successRate = Math.round(
    (stats.successfulBackups / (stats.totalBackups || 1)) * 100
  );

  const failTrend: Trend =
    stats.failedBackups === 0 ? "flat"
    : stats.failedBackups > 3 ? "down"
    : "flat";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatCard
        label="total backups"
        value={stats.totalBackups}
        icon={<Database size={15} />}
        sub="all time"
        animate
      />

      <StatCard
        label="successful"
        value={stats.successfulBackups}
        icon={<CheckCircle size={15} />}
        sub={`${successRate}% success rate`}
        accent="#10b981"
        trend={successRate >= 90 ? "up" : successRate >= 70 ? "flat" : "down"}
        animate
      />

      <StatCard
        label="storage used"
        value={formatBytes(stats.totalStorageBytes)}
        icon={<HardDrive size={15} />}
        sub="compressed"
        accent="#3b82f6"
      />

      <StatCard
        label="compression savings"
        value={formatBytes(stats.compressionSavingsBytes || 0)}
        icon={<TrendingDown size={15} />}
        sub="space saved"
        accent="#6366f1"
      />

      <StatCard
        label="average size"
        value={formatBytes(stats.averageBackupSizeBytes || 0)}
        icon={<Minus size={15} />}
        sub="per backup"
        accent="#fbbf24"
      />

      <StatCard
        label="largest backup"
        value={formatBytes(stats.largestBackupSizeBytes || 0)}
        icon={<TrendingUp size={15} />}
        sub="max size"
        accent="#e05555"
      />

      <StatCard
        label="connections"
        value={stats.activeConnections}
        icon={<Wifi size={15} />}
        sub={stats.activeConnections === 1 ? "1 active" : `${stats.activeConnections} active`}
        accent="#6366f1"
        animate
      />

      <StatCard
        label="schedules"
        value={stats.schedulesActive}
        icon={<Clock size={15} />}
        sub={stats.schedulesActive === 0 ? "none running" : "running"}
        accent="#ffd700"
        animate
      />
    </div>
  );
}