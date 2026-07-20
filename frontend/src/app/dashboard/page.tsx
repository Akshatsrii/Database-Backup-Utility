"use client";

import { useState } from "react";
import { Plus, RefreshCw, Activity, Database, Shield, Clock, TrendingUp, AlertTriangle, CheckCircle2, XCircle, ChevronRight, Terminal, Zap, Server } from "lucide-react";
import StatsCards    from "@/components/dashboard/StatsCard";
import BackupChart   from "@/components/dashboard/BackupChart";
import RecentBackups from "@/components/dashboard/RecentBackups";
import AiAdvisor     from "@/components/dashboard/AiAdvisor";
import BackupModal   from "@/components/backup/BackupModal";
import { useStats }  from "@/hooks/useStats";
import { useBackups } from "@/hooks/useBackups";
import { useQuery }  from "@tanstack/react-query";
import { connectionsApi } from "@/lib/api";
import type { DbConnection } from "@/types";

export default function DashboardPage() {
  const {
    data:      stats,
    computed,
    isLoading: statsLoading,
    isUsingMock,
    lastUpdated,
    autoRefresh,
    setAutoRefresh,
    refresh:   refetchStats,
  } = useStats();

  const {
    data:    backups,
    refresh: refreshBackups,
  } = useBackups();

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data ?? []; }
      catch { return []; }
    },
  });

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refreshBackups()]);
    setTimeout(() => setRefreshing(false), 800);
  };

  const now = new Date();
  const uptime = "99.98%";

  return (
    <>
      <div className="db-main">
        {/* Page header */}
        <div className="db-header">
          <div>
            <div className="db-page-title">
              <span className="dollar">$</span> dashboard
            </div>
            <div className="db-page-subtitle">
              backup management overview · {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
            </div>
          </div>

          <div className="db-header-actions">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`db-live-badge ${autoRefresh ? "on" : "off"}`}
              style={{ marginRight: '8px' }}
            >
              <span className="db-live-dot" />
              {autoRefresh ? "live" : "paused"}
            </button>
            <button
              onClick={handleRefresh}
              className="db-btn db-btn-ghost"
            >
              <RefreshCw size={12} className={refreshing ? "db-spin" : ""} />
              refresh
            </button>
            <button
              onClick={() => setShowBackupModal(true)}
              className="db-btn db-btn-primary"
            >
              <Plus size={14} />
              new backup
            </button>
          </div>
        </div>

        {/* Alert banners */}
        {isUsingMock && (
          <div className="db-alert db-alert-warn">
            <AlertTriangle size={13} />
            showing demo data — backend not connected
          </div>
        )}

        {computed && !computed.isHealthy && (
          <div className="db-alert db-alert-danger">
            <XCircle size={13} />
            success rate is {computed.successRate}% — check failed backups
          </div>
        )}

        {/* System status bar */}
        <div className="db-statusbar">
          <div className="db-statusbar-item">
            <div className="db-statusbar-icon green">
              <Shield size={15} />
            </div>
            <div>
              <div className="db-statusbar-val">{uptime}</div>
              <div className="db-statusbar-label">system uptime</div>
            </div>
          </div>

          <div className="db-statusbar-item">
            <div className="db-statusbar-icon teal">
              <CheckCircle2 size={15} />
            </div>
            <div>
              <div className="db-statusbar-val">
                {computed?.successRate ?? "—"}%
              </div>
              <div className="db-statusbar-label">success rate</div>
            </div>
          </div>

          <div className="db-statusbar-item">
            <div className="db-statusbar-icon blue">
              <Server size={15} />
            </div>
            <div>
              <div className="db-statusbar-val">{connections.length}</div>
              <div className="db-statusbar-label">connections</div>
            </div>
          </div>

          <div className="db-statusbar-item">
            <div className="db-statusbar-icon amber">
              <Zap size={15} />
            </div>
            <div>
              <div className="db-statusbar-val">
                {autoRefresh ? "30s" : "off"}
              </div>
              <div className="db-statusbar-label">auto refresh</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "24px" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="db-skeleton" />
            ))}
          </div>
        ) : stats ? (
          <StatsCards stats={stats} />
        ) : null}

        {/* AI Advisor */}
        {stats && stats.aiInsights && stats.aiInsights.length > 0 && (
          <AiAdvisor insights={stats.aiInsights} />
        )}

        {/* Chart */}
        {stats && <BackupChart stats={stats} />}

        {/* Recent backups */}
        <div className="db-card">
          <div className="db-card-header">
            <span className="db-section-label">recent_backups</span>
            <div className="db-card-header-right">
              {lastUpdated && (
                <span className="db-last-updated">
                  updated {lastUpdated.toLocaleTimeString("en-GB")}
                </span>
              )}
              <a href="/dashboard/backups" className="db-view-all">
                view all <ChevronRight size={11} />
              </a>
            </div>
          </div>
          <RecentBackups backups={backups ?? []} />
        </div>
      </div>

      {/* Backup modal */}
      <BackupModal
        open={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        connections={connections}
        onSuccess={() => {
          refreshBackups();
          refetchStats();
        }}
      />
    </>
  );
}
