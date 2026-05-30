"use client";  // ← YEH HONA CHAHIYE SABSE UPAR

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import StatsCards      from "@/components/dashboard/StatsCard";
import BackupChart     from "@/components/dashboard/BackupChart";
import RecentBackups   from "@/components/dashboard/RecentBackups";
import BackupModal     from "@/components/backup/BackupModal";
import { useStats }    from "@/hooks/useStats";      // ← IMPORT
import { useBackups }  from "@/hooks/useBackups";    // ← IMPORT
import { useQuery }    from "@tanstack/react-query";
import { connectionsApi } from "@/lib/api";
import type { DbConnection } from "@/types";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

export default function DashboardPage() {
  const {
    data:      stats,
    computed,
    isLoading: statsLoading,
    isFetching,
    isUsingMock,
    lastUpdated,
    autoRefresh,
    setAutoRefresh,
    refresh:   refetchStats,
  } = useStats();    // ← CORRECT USAGE

  const {
    data:    backups,
    refresh: refreshBackups,
  } = useBackups();

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });

  const [showBackupModal, setShowBackupModal] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            backup management overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live / Paused toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-1.5 text-xs px-3 py-2
                       rounded border transition-all"
            style={{
              borderColor: autoRefresh ? "rgba(74,222,128,0.3)" : "#252825",
              color:       autoRefresh ? "#4ade80" : "#4a5450",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: autoRefresh ? "#4ade80" : "#4a5450",
                boxShadow:  autoRefresh ? "0 0 4px #4ade80" : "none",
              }}
            />
            {autoRefresh ? "live" : "paused"}
          </button>

          <button
            onClick={() => { refetchStats(); refreshBackups(); }}
            className="btn-ghost flex items-center gap-2 text-xs"
          >
            <RefreshCw size={12} /> refresh
          </button>

          <button
            onClick={() => setShowBackupModal(true)}
            className="btn-acid flex items-center gap-2"
          >
            <Plus size={14} /> new backup
          </button>
        </div>
      </div>

      {/* ── Mock data warning ───────────────────────────────────── */}
      {isUsingMock && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded text-xs"
          style={{
            background: "rgba(255,215,0,0.06)",
            border:     "1px solid rgba(255,215,0,0.2)",
            color:      "#ffd700",
          }}
        >
          ⚠ showing demo data — backend not connected
        </div>
      )}

      {/* ── Health warning ──────────────────────────────────────── */}
      {computed && !computed.isHealthy && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded text-xs"
          style={{
            background: "rgba(255,68,68,0.06)",
            border:     "1px solid rgba(255,68,68,0.2)",
            color:      "#ff4444",
          }}
        >
          ⚠ success rate is {computed.successRate}% — check failed backups
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="terminal-card h-24 animate-pulse"
            />
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* ── Charts ──────────────────────────────────────────────── */}
      {stats && <BackupChart stats={stats} />}

      {/* ── Recent backups ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <SectionLabel>recent_backups</SectionLabel>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs" style={{ color: "#4a5450" }}>
                updated {lastUpdated.toLocaleTimeString("en-GB")}
              </span>
            )}
            
              href="/dashboard/backups"
              className="text-xs"
              style={{ color: "#b8f53a" }}
            >
              view all →
            </a>
          </div>
        </CardHeader>
        <RecentBackups backups={backups} />
      </Card>

      {/* ── Backup modal ────────────────────────────────────────── */}
      <BackupModal
        open={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        connections={connections}
        onSuccess={() => {
          refreshBackups();
          refetchStats();
        }}
      />
    </div>
  );
}