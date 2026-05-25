"use client";

import {
  Database,
  CheckCircle,
  XCircle,
  HardDrive,
  Wifi,
  Clock,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: string;
}

function StatCard({
  label,
  value,
  icon,
  sub,
  accent = "#b8f53a",
}: StatsCardProps) {
  return (
    <div
      className="terminal-card p-4 flex flex-col gap-3"
      style={{ borderColor: "#252825" }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: "#4a5450" }}
        >
          {label}
        </span>
        <span style={{ color: accent, opacity: 0.7 }}>{icon}</span>
      </div>
      <div>
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: accent }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard
        label="total backups"
        value={stats.totalBackups}
        icon={<Database size={15} />}
        sub="all time"
      />
      <StatCard
        label="successful"
        value={stats.successfulBackups}
        icon={<CheckCircle size={15} />}
        sub={`${Math.round(
          (stats.successfulBackups / (stats.totalBackups || 1)) * 100
        )}% success rate`}
        accent="#4ade80"
      />
      <StatCard
        label="failed"
        value={stats.failedBackups}
        icon={<XCircle size={15} />}
        sub="needs attention"
        accent={stats.failedBackups > 0 ? "#ff4444" : "#4a5450"}
      />
      <StatCard
        label="storage used"
        value={formatBytes(stats.totalStorageBytes)}
        icon={<HardDrive size={15} />}
        sub="compressed"
        accent="#38bdf8"
      />
      <StatCard
        label="connections"
        value={stats.activeConnections}
        icon={<Wifi size={15} />}
        sub="active"
        accent="#b8f53a"
      />
      <StatCard
        label="schedules"
        value={stats.schedulesActive}
        icon={<Clock size={15} />}
        sub="running"
        accent="#ffd700"
      />
    </div>
  );
}