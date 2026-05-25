"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import StatsCards from "@/components/dashboard/StatsCard";
import BackupChart from "@/components/dashboard/BackupChart";
import RecentBackups from "@/components/dashboard/RecentBackups";
import BackupModal from "@/components/backup/BackupModal";
import { useStats } from "@/hooks/useStats";
import { useBackups } from "@/hooks/useBackups";
import { useQuery } from "@tanstack/react-query";
import { connectionsApi } from "@/lib/api";
import type { DbConnection } from "@/types";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const { data: backups = [], refresh: refreshBackups } = useBackups();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> dashboard
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            backup management overview
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="terminal-card h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {/* Charts */}
      {stats && <BackupChart stats={stats} />}

      {/* Recent backups */}
      <Card>
        <CardHeader>
          <SectionLabel>recent_backups</SectionLabel>
          <a href="/dashboard/backups" className="text-xs" style={{ color: "#b8f53a" }}>
            view all →
          </a>
        </CardHeader>
        <RecentBackups backups={backups} />
      </Card>

      <BackupModal
        open={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        connections={connections}
        onSuccess={() => { refreshBackups(); refetchStats(); }}
      />
    </div>
  );
}