"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Power, RefreshCw, Clock,
  Database, Calendar, Zap, CheckCircle2,
  PauseCircle, AlertTriangle, Timer, Activity,
} from "lucide-react";
import { connectionsApi, schedulesApi } from "@/lib/api";
import type { DbConnection, Schedule } from "@/types";
import SchedulerForm from "@/components/scheduler/SchedulerForm";
import { TextBadge } from "@/components/ui/Badge";
import { cronLabel, fmtDate } from "@/lib/utils";

const TYPE_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  full:        { bg: "rgba(99,102,241,.08)",  color: "#6366f1", border: "rgba(99,102,241,.25)" },
  incremental: { bg: "rgba(96,165,250,.08)",  color: "#60a5fa", border: "rgba(96,165,250,.25)" },
  differential:{ bg: "rgba(251,191,36,.08)",  color: "#fbbf24", border: "rgba(251,191,36,.25)" },
};

export default function SchedulerPage() {
  const qc = useQueryClient();

  const { data: schedules = [], isLoading, isFetching } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      try { return (await schedulesApi.list()).data ?? []; }
      catch { return []; }
    },
    refetchInterval: 15_000,
  });

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data ?? []; }
      catch { return []; }
    },
  });

  const [showForm,    setShowForm]    = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["schedules"] });

  const toggleSchedule = async (id: string, enabled: boolean) => {
    setTogglingId(id);
    try { await schedulesApi.toggle(id, !enabled); refresh(); }
    catch { /**/ }
    finally { setTogglingId(null); }
  };

  const deleteSchedule = async (id: string) => {
    setDeletingId(id);
    try { await schedulesApi.remove(id); refresh(); }
    catch { /**/ }
    finally { setDeletingId(null); setConfirmId(null); }
  };

  const activeCount  = schedules.filter((s) => s.enabled).length;
  const pausedCount  = schedules.filter((s) => !s.enabled).length;
  const totalCount   = schedules.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        @keyframes sp-in    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes sp-spin  { to { transform: rotate(360deg) } }
        @keyframes sp-pulse { 0%,100%{box-shadow:0 0 4px #10b98166}50%{box-shadow:0 0 9px #10b981bb} }
        @keyframes sp-blink { 0%,100%{opacity:1}50%{opacity:0} }

        .sp-root {
          font-family: 'JetBrains Mono','Courier New',monospace;
          color: #c8d9cc;
          animation: sp-in .3s ease;
        }

        /* ── Header ── */
        .sp-header {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
        }

        .sp-title {
          font-size: 18px; font-weight: 700; color: #e8edea;
          display: flex; align-items: center; gap: 7px; line-height: 1;
        }

        .sp-title .dollar { color: #6366f1; }
        .sp-subtitle { font-size: 10px; color: #3d5040; margin-top: 5px; letter-spacing: .08em; }

        .sp-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        /* ── Buttons ── */
        .sp-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono',monospace;
          font-size: 11px; font-weight: 600;
          padding: 8px 13px; border-radius: 6px;
          cursor: pointer; transition: all .15s;
          border: none; letter-spacing: .04em; white-space: nowrap;
        }

        .sp-btn-ghost {
          background: transparent; color: #4a6450; border: 1px solid rgba(255,255,255,0.1);
        }
        .sp-btn-ghost:hover { background: #0f172a; color: #8aaa80; border-color: #253523; }

        .sp-btn-primary { background: #6366f1; color: #0a1008; }
        .sp-btn-primary:hover {
          background: #ccff50;
          box-shadow: 0 4px 16px rgba(99,102,241,.2);
          transform: translateY(-1px);
        }
        .sp-btn-primary:active { transform: scale(.98); }

        .sp-spin { animation: sp-spin .8s linear infinite; }

        /* ── Stat row ── */
        .sp-statrow {
          display: flex; gap: 8px;
          margin-bottom: 20px; flex-wrap: wrap;
        }

        .sp-stat {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
          flex: 1; min-width: 110px;
        }

        .sp-stat-icon {
          width: 30px; height: 30px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sp-stat-icon.acid   { background: rgba(99,102,241,.1); color: #6366f1; }
        .sp-stat-icon.green  { background: rgba(16,185,129,.1);  color: #10b981; }
        .sp-stat-icon.amber  { background: rgba(251,191,36,.1);  color: #fbbf24; }

        .sp-stat-val { font-size: 18px; font-weight: 700; color: #d8e8dc; line-height: 1; }
        .sp-stat-label { font-size: 10px; color: #2e4035; margin-top: 3px; letter-spacing: .05em; }

        /* ── Card ── */
        .sp-card {
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; overflow: hidden;
        }

        .sp-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.1);
          background: #0a100d;
        }

        .sp-card-header-right { display: flex; align-items: center; gap: 10px; }

        .sp-section-label {
          font-size: 10px; color: #3d5040; letter-spacing: .14em;
          text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }

        .sp-section-label::before {
          content: ''; width: 3px; height: 3px;
          border-radius: 50%; background: #6366f1;
        }

        .sp-running-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 10px; color: #10b981;
          background: rgba(16,185,129,.07);
          border: 1px solid rgba(16,185,129,.2);
          padding: 3px 9px; border-radius: 10px;
        }

        .sp-running-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 5px #10b98199;
          animation: sp-pulse 2s ease-in-out infinite;
        }

        /* ── Schedule list ── */
        .sp-list { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }

        .sp-row {
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
          background: #0a100d;
          transition: border-color .15s, background .15s;
          overflow: hidden;
        }

        .sp-row.enabled  { border-color: rgba(99,102,241,.18); background: rgba(99,102,241,.025); }
        .sp-row.disabled { border-color: rgba(255,255,255,0.1); background: #0a100d; }
        .sp-row:hover    { border-color: #253523; }
        .sp-row.enabled:hover { border-color: rgba(99,102,241,.35); }

        .sp-row-main {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 13px 16px; gap: 12px;
        }

        .sp-row-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }

        /* Status dot */
        .sp-status-dot {
          width: 8px; height: 8px; border-radius: 50%;
          flex-shrink: 0; transition: all .2s;
        }

        .sp-status-dot.on  { background: #10b981; box-shadow: 0 0 7px #10b98199; animation: sp-pulse 2s ease-in-out infinite; }
        .sp-status-dot.off { background: #253523; }

        /* Connection icon */
        .sp-conn-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: #111a14; border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .15s;
        }

        .sp-row.enabled .sp-conn-icon {
          background: rgba(99,102,241,.06); border-color: rgba(99,102,241,.15);
        }

        /* Info */
        .sp-row-name {
          font-size: 12px; font-weight: 600; color: #d8e8dc;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .sp-row-meta {
          font-size: 10px; color: #3d5040; margin-top: 3px;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }

        .sp-meta-chip {
          display: flex; align-items: center; gap: 4px; color: #3d5040;
        }

        /* Tags */
        .sp-tags { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

        .sp-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 9px; font-weight: 600; letter-spacing: .06em;
          padding: 3px 8px; border-radius: 10px; white-space: nowrap;
          border: 1px solid;
        }

        /* Actions */
        .sp-row-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .sp-toggle-btn {
          display: flex; align-items: center; gap: 5px;
          font-family: 'JetBrains Mono',monospace;
          font-size: 10px; font-weight: 600;
          padding: 6px 11px; border-radius: 6px;
          cursor: pointer; transition: all .15s; border: 1px solid;
          letter-spacing: .04em; white-space: nowrap;
        }

        .sp-toggle-btn.pause {
          color: #f87171; border-color: rgba(248,113,113,.25); background: transparent;
        }
        .sp-toggle-btn.pause:hover { background: rgba(248,113,113,.06); border-color: rgba(248,113,113,.45); }

        .sp-toggle-btn.enable {
          color: #10b981; border-color: rgba(16,185,129,.25); background: transparent;
        }
        .sp-toggle-btn.enable:hover { background: rgba(16,185,129,.07); border-color: rgba(16,185,129,.45); }

        .sp-del-btn {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
          background: transparent; color: #3d5040;
          cursor: pointer; transition: all .15s;
        }

        .sp-del-btn:hover { background: rgba(248,113,113,.07); border-color: rgba(248,113,113,.3); color: #f87171; }

        /* Confirm strip */
        .sp-confirm-strip {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 16px;
          background: rgba(248,113,113,.06);
          border-top: 1px solid rgba(248,113,113,.15);
          font-size: 10px; color: #f87171; gap: 10px; flex-wrap: wrap;
        }

        .sp-confirm-strip span { display: flex; align-items: center; gap: 6px; }

        .sp-confirm-yes {
          font-family: 'JetBrains Mono',monospace;
          font-size: 10px; font-weight: 700;
          padding: 4px 10px; border-radius: 5px;
          background: rgba(248,113,113,.15); border: 1px solid rgba(248,113,113,.35);
          color: #f87171; cursor: pointer; transition: all .15s;
        }
        .sp-confirm-yes:hover { background: rgba(248,113,113,.25); }

        .sp-confirm-no {
          font-family: 'JetBrains Mono',monospace;
          font-size: 10px; font-weight: 600;
          padding: 4px 10px; border-radius: 5px;
          background: transparent; border: 1px solid rgba(255,255,255,0.1);
          color: #4a6450; cursor: pointer; transition: all .15s;
        }
        .sp-confirm-no:hover { color: #8aaa80; }

        /* ── Skeleton ── */
        .sp-skel {
          height: 66px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
          background: #0f172a;
          animation: sp-skel 1.4s ease-in-out infinite;
        }

        @keyframes sp-skel { 0%,100%{opacity:.5}50%{opacity:1} }

        /* ── Empty ── */
        .sp-empty {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px;
          padding: 48px 24px; text-align: center;
        }

        .sp-empty-icon {
          width: 48px; height: 48px; border-radius: 12px;
          background: rgba(99,102,241,.05); border: 1px solid rgba(99,102,241,.1);
          display: flex; align-items: center; justify-content: center; color: #3d5040;
        }

        .sp-empty-title { font-size: 13px; font-weight: 600; color: #3d5040; }
        .sp-empty-sub   { font-size: 10px; color: #1e2e20; letter-spacing: .05em; }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .sp-header { flex-direction: column; align-items: flex-start; }
          .sp-row-main { flex-wrap: wrap; }
          .sp-tags { flex-wrap: wrap; }
          .sp-statrow > * { min-width: 80px; }
        }
      `}</style>

      <div className="sp-root">

        {/* ── Header ── */}
        <div className="sp-header">
          <div>
            <div className="sp-title">
              <span className="dollar">$</span>
              scheduler
            </div>
            <div className="sp-subtitle">
              automated backup schedules · auto-refresh 15s
            </div>
          </div>

          <div className="sp-header-actions">
            <button
              onClick={refresh}
              className="sp-btn sp-btn-ghost"
            >
              <RefreshCw size={12} className={isFetching ? "sp-spin" : ""} />
              refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="sp-btn sp-btn-primary"
            >
              <Plus size={13} />
              new schedule
            </button>
          </div>
        </div>

        {/* ── Stat row ── */}
        <div className="sp-statrow">
          <div className="sp-stat">
            <div className="sp-stat-icon acid"><Calendar size={15} /></div>
            <div>
              <div className="sp-stat-val">{totalCount}</div>
              <div className="sp-stat-label">total</div>
            </div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-icon green"><Activity size={15} /></div>
            <div>
              <div className="sp-stat-val">{activeCount}</div>
              <div className="sp-stat-label">active</div>
            </div>
          </div>
          <div className="sp-stat">
            <div className="sp-stat-icon amber"><PauseCircle size={15} /></div>
            <div>
              <div className="sp-stat-val">{pausedCount}</div>
              <div className="sp-stat-label">paused</div>
            </div>
          </div>
        </div>

        {/* ── Schedules card ── */}
        <div className="sp-card">
          <div className="sp-card-header">
            <span className="sp-section-label">active_schedules</span>
            <div className="sp-card-header-right">
              {activeCount > 0 && (
                <span className="sp-running-badge">
                  <span className="sp-running-dot" />
                  {activeCount} running
                </span>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="sp-list">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="sp-skel" style={{ animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <div className="sp-empty">
              <div className="sp-empty-icon"><Clock size={22} /></div>
              <div className="sp-empty-title">no schedules configured</div>
              <div className="sp-empty-sub">create one to automate your backups</div>
              <button
                onClick={() => setShowForm(true)}
                className="sp-btn sp-btn-primary"
                style={{ fontSize: "11px", marginTop: 4 }}
              >
                <Plus size={12} /> new schedule
              </button>
            </div>
          ) : (
            <div className="sp-list">
              {schedules.map((s) => {
                const typeStyle = TYPE_COLOR[s.backupType] ?? TYPE_COLOR.full;
                const isConfirm = confirmId === s.id;
                const isToggling = togglingId === s.id;
                const isDeleting = deletingId === s.id;

                return (
                  <div key={s.id} className={`sp-row ${s.enabled ? "enabled" : "disabled"}`}>
                    <div className="sp-row-main">
                      <div className="sp-row-left">
                        {/* Status dot */}
                        <span className={`sp-status-dot ${s.enabled ? "on" : "off"}`} />

                        {/* Icon */}
                        <div className="sp-conn-icon">
                          <Database size={15} color={s.enabled ? "#6366f1" : "#3d5040"} />
                        </div>

                        {/* Info */}
                        <div style={{ minWidth: 0 }}>
                          <div className="sp-row-name">{s.connectionName}</div>
                          <div className="sp-row-meta">
                            <span className="sp-meta-chip">
                              <Clock size={9} />
                              {cronLabel(s.cronExpression)}
                            </span>
                            {s.nextRun && (
                              <span className="sp-meta-chip">
                                <Timer size={9} />
                                next: {fmtDate(s.nextRun)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tags + actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <div className="sp-tags">
                          <span
                            className="sp-tag"
                            style={{
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              borderColor: typeStyle.border,
                            }}
                          >
                            {s.backupType}
                          </span>
                          <span
                            className="sp-tag"
                            style={{
                              background: "#111a14",
                              color: "#3d5040",
                              borderColor: "rgba(255,255,255,0.1)",
                            }}
                          >
                            {s.frequency}
                          </span>
                        </div>

                        <div className="sp-row-actions">
                          <button
                            onClick={() => toggleSchedule(s.id, s.enabled)}
                            className={`sp-toggle-btn ${s.enabled ? "pause" : "enable"}`}
                            disabled={isToggling}
                          >
                            {isToggling ? (
                              <RefreshCw size={10} className="sp-spin" />
                            ) : (
                              <Power size={10} />
                            )}
                            {s.enabled ? "pause" : "enable"}
                          </button>

                          <button
                            onClick={() => setConfirmId(isConfirm ? null : s.id)}
                            className="sp-del-btn"
                            disabled={isDeleting}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline confirm delete strip */}
                    {isConfirm && (
                      <div className="sp-confirm-strip">
                        <span>
                          <AlertTriangle size={11} />
                          delete &quot;{s.connectionName}&quot; schedule permanently?
                        </span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="sp-confirm-no"
                            onClick={() => setConfirmId(null)}
                          >
                            cancel
                          </button>
                          <button
                            className="sp-confirm-yes"
                            onClick={() => deleteSchedule(s.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "deleting…" : "yes, delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <SchedulerForm
        open={showForm}
        onClose={() => setShowForm(false)}
        connections={connections}
        onSuccess={refresh}
      />
    </>
  );
}