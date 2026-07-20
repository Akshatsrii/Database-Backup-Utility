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
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .db-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #020617;
          
          color: #c8d9cc;
        }

        /* Background grid */
        .db-page::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .db-content {
          flex: 1;
          position: relative;
          z-index: 1;
          padding: 0 0 0 0;
        }

        /* ── Top Navbar ── */
        .db-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(8,13,10,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .db-navbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .db-logo {
          font-size: 15px;
          font-weight: 700;
          color: #6366f1;
          letter-spacing: -0.3px;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .db-logo-icon {
          width: 26px; height: 26px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .db-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .db-nav-link {
          font-size: 11px;
          color: #64748b;
          padding: 5px 10px;
          border-radius: 5px;
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
          letter-spacing: 0.04em;
        }

        .db-nav-link:hover { color: #cbd5e1; background: rgba(99,102,241,0.05); }
        .db-nav-link.active { color: #6366f1; background: rgba(99,102,241,0.08); }

        .db-navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .db-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid;
          cursor: pointer;
          transition: all 0.2s;
          
        }

        .db-live-badge.on {
          color: #10b981;
          border-color: rgba(16,185,129,0.3);
          background: rgba(16,185,129,0.06);
        }

        .db-live-badge.off {
          color: #64748b;
          border-color: rgba(255,255,255,0.1);
          background: transparent;
        }

        .db-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }

        .db-live-badge.on .db-live-dot {
          background: #10b981;
          box-shadow: 0 0 6px #10b98199;
          animation: live-pulse 2s ease-in-out infinite;
        }

        .db-live-badge.off .db-live-dot { background: #64748b; }

        @keyframes live-pulse {
          0%, 100% { box-shadow: 0 0 4px #10b98166; }
          50% { box-shadow: 0 0 10px #10b981bb; }
        }

        .db-user-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          color: #94a3b8;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 4px 12px 4px 6px;
        }

        .db-user-avatar {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #6366f1;
        }

        /* ── Main area ── */
        .db-main {
          padding: 24px 24px 32px;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Page header ── */
        .db-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .db-page-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-page-title .dollar { color: #6366f1; }

        .db-page-subtitle {
          font-size: 10px;
          color: #64748b;
          margin-top: 5px;
          letter-spacing: 0.08em;
        }

        .db-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Buttons ── */
        .db-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          
          font-size: 11px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          letter-spacing: 0.04em;
        }

        .db-btn-ghost {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .db-btn-ghost:hover {
          background: #0f172a;
          color: #cbd5e1;
          border-color: #253523;
        }

        .db-btn-primary {
          background: #6366f1;
          color: #020617;
        }

        .db-btn-primary:hover {
          background: #ccff50;
          box-shadow: 0 4px 16px rgba(99,102,241,0.2);
          transform: translateY(-1px);
        }

        .db-btn-primary:active { transform: scale(0.98); }

        .db-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Alert banners ── */
        .db-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 7px;
          font-size: 11px;
          margin-bottom: 16px;
          letter-spacing: 0.03em;
        }

        .db-alert-warn {
          background: rgba(255,215,0,0.05);
          border: 1px solid rgba(255,215,0,0.18);
          color: #d4a800;
        }

        .db-alert-danger {
          background: rgba(255,68,68,0.05);
          border: 1px solid rgba(255,68,68,0.18);
          color: #e05555;
        }

        /* ── Section label ── */
        .db-section-label {
          font-size: 10px;
          color: #64748b;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .db-section-label::before {
          content: '';
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #6366f1;
        }

        /* ── Stats skeleton ── */
        .db-skeleton {
          height: 88px;
          border-radius: 8px;
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }

        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* ── System status bar ── */
        .db-statusbar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }

        .db-statusbar-item {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: border-color 0.2s;
        }

        .db-statusbar-item:hover { border-color: #253523; }

        .db-statusbar-icon {
          width: 30px; height: 30px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .db-statusbar-icon.green { background: rgba(99,102,241,0.1); color: #6366f1; }
        .db-statusbar-icon.teal  { background: rgba(16,185,129,0.1); color: #10b981; }
        .db-statusbar-icon.blue  { background: rgba(96,165,250,0.1); color: #60a5fa; }
        .db-statusbar-icon.amber { background: rgba(251,191,36,0.1); color: #fbbf24; }

        .db-statusbar-val {
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
          line-height: 1;
        }

        .db-statusbar-label {
          font-size: 10px;
          color: #64748b;
          margin-top: 3px;
          letter-spacing: 0.06em;
        }

        /* ── Recent backups card ── */
        .db-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .db-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .db-card-header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .db-last-updated {
          font-size: 10px;
          color: #475569;
          letter-spacing: 0.04em;
        }

        .db-view-all {
          font-size: 11px;
          color: #6366f1;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: opacity 0.15s;
        }

        .db-view-all:hover { opacity: 0.75; }

        /* ── Footer ── */
        .db-footer {
          position: relative;
          z-index: 1;
          background: #020617;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 0 24px;
        }

        .db-footer-top {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 32px;
          padding: 28px 0 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .db-footer-brand { }

        .db-footer-logo {
          font-size: 16px;
          font-weight: 700;
          color: #6366f1;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .db-footer-tagline {
          font-size: 10px;
          color: #475569;
          line-height: 1.7;
          max-width: 200px;
          letter-spacing: 0.04em;
        }

        .db-footer-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          font-size: 10px;
          color: #10b981;
        }

        .db-footer-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b98166;
          animation: live-pulse 2s ease-in-out infinite;
        }

        .db-footer-col-title {
          font-size: 10px;
          color: #94a3b8;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 14px;
          font-weight: 600;
        }

        .db-footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .db-footer-links a {
          font-size: 11px;
          color: #475569;
          text-decoration: none;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .db-footer-links a:hover { color: #cbd5e1; }

        .db-footer-links a::before {
          content: '›';
          color: #1e293b;
          font-size: 13px;
        }

        /* System stats in footer */
        .db-footer-sys {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .db-footer-sys-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .db-footer-sys-key { color: #475569; letter-spacing: 0.04em; }

        .db-footer-sys-val {
          font-size: 10px;
          font-weight: 600;
        }

        .db-footer-sys-val.green { color: #10b981; }
        .db-footer-sys-val.amber { color: #fbbf24; }
        .db-footer-sys-val.acid  { color: #6366f1; }

        .db-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          flex-wrap: wrap;
          gap: 10px;
        }

        .db-footer-copy {
          font-size: 10px;
          color: #1e293b;
          letter-spacing: 0.04em;
        }

        .db-footer-copy span { color: #475569; }

        .db-footer-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .db-footer-meta-item {
          font-size: 10px;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 5px;
          letter-spacing: 0.04em;
        }

        .db-footer-meta-item.ok { color: #334155; }
        .db-footer-meta-item.ok::before {
          content: '●';
          color: #10b981;
          font-size: 7px;
        }

        .db-footer-divider {
          color: rgba(255,255,255,0.1);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .db-footer-top { grid-template-columns: 1fr 1fr; gap: 20px; }
          .db-statusbar { grid-template-columns: repeat(2, 1fr); }
          .db-nav-links { display: none; }
        }

        @media (max-width: 600px) {
          .db-footer-top { grid-template-columns: 1fr; gap: 16px; }
          .db-main { padding: 16px 16px 24px; }
          .db-navbar { padding: 0 16px; }
          .db-footer { padding: 0 16px; }
          .db-header { flex-direction: column; align-items: flex-start; }
          .db-statusbar { grid-template-columns: repeat(2, 1fr); }
          .db-page-title { font-size: 15px; }
          .db-footer-bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="db-page">

        {/* ── Navbar ── */}
        <nav className="db-navbar">
          <div className="db-navbar-left">
            <a href="/dashboard" className="db-logo">
              <div className="db-logo-icon">
                <Database size={13} color="#6366f1" />
              </div>
              [BackupOS]
            </a>
            <div className="db-nav-links">
              <a href="/dashboard" className="db-nav-link active">dashboard</a>
              <a href="/dashboard/backups" className="db-nav-link">backups</a>
              <a href="/dashboard/connections" className="db-nav-link">connections</a>
              <a href="/dashboard/schedules" className="db-nav-link">schedules</a>
              <a href="/dashboard/logs" className="db-nav-link">logs</a>
            </div>
          </div>

          <div className="db-navbar-right">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`db-live-badge ${autoRefresh ? "on" : "off"}`}
            >
              <span className="db-live-dot" />
              {autoRefresh ? "live" : "paused"}
            </button>

            <div className="db-user-chip">
              <div className="db-user-avatar">
                {typeof window !== "undefined"
                  ? (localStorage.getItem("bu_user") || "U").slice(0, 2).toUpperCase()
                  : "U"}
              </div>
              {typeof window !== "undefined"
                ? localStorage.getItem("bu_user") || "user"
                : "user"}
            </div>
          </div>
        </nav>

        {/* ── Main content ── */}
        <div className="db-content">
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
              <RecentBackups backups={backups} />
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="db-footer">
          <div className="db-footer-top">

            {/* Brand col */}
            <div className="db-footer-brand">
              <div className="db-footer-logo">
                <Database size={15} color="#6366f1" />
                [BackupOS]
              </div>
              <div className="db-footer-tagline">
                automated database backup & recovery platform for modern infrastructure.
              </div>
              <div className="db-footer-status">
                <span className="db-footer-status-dot" />
                all systems operational
              </div>
            </div>

            {/* Navigation col */}
            <div>
              <div className="db-footer-col-title">navigation</div>
              <ul className="db-footer-links">
                <li><a href="/dashboard">dashboard</a></li>
                <li><a href="/dashboard/backups">backups</a></li>
                <li><a href="/dashboard/connections">connections</a></li>
                <li><a href="/dashboard/schedules">schedules</a></li>
                <li><a href="/dashboard/logs">activity logs</a></li>
              </ul>
            </div>

            {/* Resources col */}
            <div>
              <div className="db-footer-col-title">resources</div>
              <ul className="db-footer-links">
                <li><a href="/docs">documentation</a></li>
                <li><a href="/docs/api">api reference</a></li>
                <li><a href="/docs/cli">cli guide</a></li>
                <li><a href="/changelog">changelog</a></li>
                <li><a href="/support">support</a></li>
              </ul>
            </div>

            {/* System health col */}
            <div>
              <div className="db-footer-col-title">system health</div>
              <div className="db-footer-sys">
                <div className="db-footer-sys-row">
                  <span className="db-footer-sys-key">api status</span>
                  <span className="db-footer-sys-val green">operational</span>
                </div>
                <div className="db-footer-sys-row">
                  <span className="db-footer-sys-key">backup engine</span>
                  <span className="db-footer-sys-val green">running</span>
                </div>
                <div className="db-footer-sys-row">
                  <span className="db-footer-sys-key">scheduler</span>
                  <span className="db-footer-sys-val green">active</span>
                </div>
                <div className="db-footer-sys-row">
                  <span className="db-footer-sys-key">storage</span>
                  <span className="db-footer-sys-val amber">72% used</span>
                </div>
                <div className="db-footer-sys-row">
                  <span className="db-footer-sys-key">version</span>
                  <span className="db-footer-sys-val acid">v2.4.1</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer bottom bar */}
          <div className="db-footer-bottom">
            <div className="db-footer-copy">
              © {now.getFullYear()} <span>BackupOS</span> · built on backup-os.onrender.com
            </div>
            <div className="db-footer-meta">
              <span className="db-footer-meta-item ok">api</span>
              <span className="db-footer-divider">·</span>
              <span className="db-footer-meta-item ok">storage</span>
              <span className="db-footer-divider">·</span>
              <span className="db-footer-meta-item ok">scheduler</span>
              <span className="db-footer-divider">·</span>
              <span className="db-footer-meta-item" style={{ color: "#475569" }}>
                <Terminal size={10} style={{ marginRight: 4 }} />
                backup-room
              </span>
            </div>
          </div>
        </footer>

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