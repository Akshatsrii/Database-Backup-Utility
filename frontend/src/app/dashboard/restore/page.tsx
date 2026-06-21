"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RotateCcw, Database, Clock, CheckCircle2,
  XCircle, Loader2, AlertTriangle, FileArchive,
  ChevronRight, RefreshCw, Search, X, Shield,
  HardDrive, Timer,
} from "lucide-react";
import { backupsApi, connectionsApi, restoreApi } from "@/lib/api";
import type { Backup, DbConnection, RestoreJob } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import RestoreModal from "@/components/restore/RestoreModal";
import { fmtDate, formatDuration } from "@/lib/utils";

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={11} color="#4ade80" />,
  running:   <Loader2     size={11} color="#60a5fa" style={{ animation: "rp-spin 1s linear infinite" }} />,
  failed:    <XCircle     size={11} color="#f87171" />,
  pending:   <Clock       size={11} color="#fbbf24" />,
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#4ade80",
  running:   "#60a5fa",
  failed:    "#f87171",
  pending:   "#fbbf24",
};

export default function RestorePage() {
  const { data: backups = [] } = useQuery<Backup[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      try { return (await backupsApi.list()).data ?? []; }
      catch { return []; }
    },
  });

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data ?? []; }
      catch { return []; }
    },
  });

  const { data: jobs = [], refetch, isFetching } = useQuery<RestoreJob[]>({
    queryKey: ["restore-jobs"],
    queryFn: async () => {
      try { return (await restoreApi.jobs()).data ?? []; }
      catch { return []; }
    },
    refetchInterval: 10_000,
  });

  const [selected,  setSelected]  = useState<Backup | null>(null);
  const [search,    setSearch]    = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const completedBackups = backups.filter((b) => b.status === "completed");

  const filteredBackups = completedBackups.filter((b) =>
    !search ||
    b.filename.toLowerCase().includes(search.toLowerCase()) ||
    b.connectionName?.toLowerCase().includes(search.toLowerCase())
  );

  const runningJobs   = jobs.filter((j) => j.status === "running").length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;
  const failedJobs    = jobs.filter((j) => j.status === "failed").length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        @keyframes rp-in   { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes rp-spin  { to { transform: rotate(360deg) } }
        @keyframes rp-pulse { 0%,100%{box-shadow:0 0 4px #b8f53a66}50%{box-shadow:0 0 10px #b8f53abb} }

        .rp-root {
          font-family: 'JetBrains Mono','Courier New',monospace;
          color: #c8d9cc;
          animation: rp-in 0.3s ease;
        }

        /* ── Header ── */
        .rp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 22px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .rp-title {
          font-size: 18px;
          font-weight: 700;
          color: #e8edea;
          display: flex;
          align-items: center;
          gap: 7px;
          line-height: 1;
        }

        .rp-title .dollar { color: #b8f53a; }
        .rp-subtitle { font-size: 10px; color: #3d5040; margin-top: 5px; letter-spacing: .08em; }

        /* ── Stat row ── */
        .rp-statrow {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .rp-stat {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          padding: 7px 13px;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 8px;
        }

        .rp-stat-val { font-weight: 700; font-size: 14px; line-height: 1; }
        .rp-stat-val.acid   { color: #b8f53a; }
        .rp-stat-val.green  { color: #4ade80; }
        .rp-stat-val.blue   { color: #60a5fa; }
        .rp-stat-val.red    { color: #f87171; }
        .rp-stat-label { color: #2e4035; margin-top: 2px; }

        /* ── Section card ── */
        .rp-card {
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .rp-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid #1a2418;
          background: #0a100d;
        }

        .rp-card-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rp-section-label {
          font-size: 10px;
          color: #3d5040;
          letter-spacing: .14em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rp-section-label::before {
          content: '';
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #b8f53a;
        }

        .rp-avail-badge {
          font-size: 10px;
          background: rgba(184,245,58,0.07);
          border: 1px solid rgba(184,245,58,0.18);
          color: #7ab830;
          padding: 2px 9px;
          border-radius: 10px;
        }

        /* ── Search ── */
        .rp-search-wrap {
          position: relative;
          padding: 12px 16px;
          border-bottom: 1px solid #1a2418;
        }

        .rp-search-icon {
          position: absolute;
          left: 28px; top: 50%;
          transform: translateY(-50%);
          color: #3d5040;
          pointer-events: none;
        }

        .rp-search-clear {
          position: absolute;
          right: 28px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: #3d5040; cursor: pointer;
          display: flex; align-items: center;
          transition: color .15s; padding: 2px;
        }

        .rp-search-clear:hover { color: #8aaa80; }

        .rp-input {
          width: 100%;
          background: #080d0a;
          border: 1px solid #1a2418;
          border-radius: 6px;
          padding: 8px 30px 8px 32px;
          color: #b8d8bc;
          font-family: 'JetBrains Mono',monospace;
          font-size: 12px;
          outline: none;
          transition: border-color .2s;
        }

        .rp-input:focus { border-color: rgba(184,245,58,.3); box-shadow: 0 0 0 3px rgba(184,245,58,.04); }
        .rp-input::placeholder { color: #1e2e20; }

        /* ── Backup list ── */
        .rp-backup-list { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }

        .rp-backup-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid #1a2418;
          cursor: pointer;
          transition: border-color .15s, background .15s;
          gap: 12px;
        }

        .rp-backup-row:hover  { border-color: #253523; background: #0e160f; }
        .rp-backup-row.active { border-color: rgba(184,245,58,.4); background: rgba(184,245,58,.04); }

        .rp-backup-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .rp-backup-radio {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #253523;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color .15s;
        }

        .rp-backup-row.active .rp-backup-radio {
          border-color: #b8f53a;
          box-shadow: 0 0 6px rgba(184,245,58,.4);
        }

        .rp-backup-radio-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #b8f53a;
          display: none;
          box-shadow: 0 0 4px #b8f53a;
        }

        .rp-backup-row.active .rp-backup-radio-dot { display: block; }

        .rp-backup-icon {
          width: 32px; height: 32px;
          border-radius: 7px;
          background: #111a14;
          border: 1px solid #1a2418;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color .15s;
        }

        .rp-backup-row.active .rp-backup-icon {
          border-color: rgba(184,245,58,.2);
          background: rgba(184,245,58,.06);
        }

        .rp-backup-name {
          font-size: 12px;
          font-weight: 600;
          color: #d8e8dc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rp-backup-meta {
          font-size: 10px;
          color: #3d5040;
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rp-backup-meta-chip {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rp-restore-btn {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 7px 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all .15s;
          border: none;
          letter-spacing: .04em;
          background: #b8f53a;
          color: #0a1008;
        }

        .rp-restore-btn:hover {
          background: #ccff50;
          box-shadow: 0 3px 12px rgba(184,245,58,.25);
          transform: translateY(-1px);
        }

        .rp-restore-btn:active { transform: scale(.98); }

        /* ── Empty state ── */
        .rp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 40px 24px;
          text-align: center;
        }

        .rp-empty-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(184,245,58,.05);
          border: 1px solid rgba(184,245,58,.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3d5040;
        }

        .rp-empty-title { font-size: 12px; font-weight: 600; color: #3d5040; }
        .rp-empty-sub   { font-size: 10px; color: #1e2e20; letter-spacing: .05em; }

        /* ── History table ── */
        .rp-table-wrap { overflow-x: auto; }

        .rp-table {
          width: 100%;
          font-size: 11px;
          border-collapse: collapse;
        }

        .rp-table th {
          text-align: left;
          padding: 10px 14px;
          font-size: 9px;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: #2e4035;
          background: #0a100d;
          border-bottom: 1px solid #1a2418;
          white-space: nowrap;
        }

        .rp-table td {
          padding: 11px 14px;
          border-bottom: 1px solid #111a14;
          vertical-align: middle;
          white-space: nowrap;
        }

        .rp-table tbody tr:last-child td { border-bottom: none; }
        .rp-table tbody tr:hover td { background: #0a100d; }

        .rp-cell-primary { color: #d8e8dc; font-weight: 500; }
        .rp-cell-muted   { color: #3d5040; }
        .rp-cell-mono    { color: #4a6450; font-variant-numeric: tabular-nums; }

        .rp-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          padding: 3px 9px;
          border-radius: 12px;
          font-weight: 600;
          letter-spacing: .04em;
        }

        .rp-status-chip.completed { background: rgba(74,222,128,.08);  color: #4ade80; border: 1px solid rgba(74,222,128,.2);  }
        .rp-status-chip.running   { background: rgba(96,165,250,.08);  color: #60a5fa; border: 1px solid rgba(96,165,250,.2);  }
        .rp-status-chip.failed    { background: rgba(248,113,113,.08); color: #f87171; border: 1px solid rgba(248,113,113,.2); }
        .rp-status-chip.pending   { background: rgba(251,191,36,.08);  color: #fbbf24; border: 1px solid rgba(251,191,36,.2);  }

        /* ── Buttons ── */
        .rp-btn {
          display: flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono',monospace;
          font-size: 11px; font-weight: 600;
          padding: 7px 12px; border-radius: 6px;
          cursor: pointer; transition: all .15s;
          border: none; letter-spacing: .04em; white-space: nowrap;
        }

        .rp-btn-ghost {
          background: transparent; color: #4a6450;
          border: 1px solid #1a2418;
        }

        .rp-btn-ghost:hover { background: #0c130e; color: #8aaa80; border-color: #253523; }

        .rp-spin { animation: rp-spin .8s linear infinite; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .rp-header { flex-direction: column; align-items: flex-start; }
          .rp-backup-row { flex-direction: column; align-items: flex-start; }
          .rp-restore-btn { width: 100%; justify-content: center; }
          .rp-statrow { gap: 6px; }
        }
      `}</style>

      <div className="rp-root">

        {/* ── Header ── */}
        <div className="rp-header">
          <div>
            <div className="rp-title">
              <span className="dollar">$</span>
              restore_ops
            </div>
            <div className="rp-subtitle">
              restore a database from a completed backup
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="rp-btn rp-btn-ghost"
          >
            <RefreshCw size={12} className={isFetching ? "rp-spin" : ""} />
            refresh
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="rp-statrow">
          <div className="rp-stat">
            <HardDrive size={13} color="#b8f53a" />
            <div>
              <div className="rp-stat-val acid">{completedBackups.length}</div>
              <div className="rp-stat-label">available</div>
            </div>
          </div>

          <div className="rp-stat">
            <CheckCircle2 size={13} color="#4ade80" />
            <div>
              <div className="rp-stat-val green">{completedJobs}</div>
              <div className="rp-stat-label">completed</div>
            </div>
          </div>

          <div className="rp-stat">
            <Loader2 size={13} color="#60a5fa" />
            <div>
              <div className="rp-stat-val blue">{runningJobs}</div>
              <div className="rp-stat-label">running</div>
            </div>
          </div>

          <div className="rp-stat">
            <XCircle size={13} color="#f87171" />
            <div>
              <div className="rp-stat-val red">{failedJobs}</div>
              <div className="rp-stat-label">failed</div>
            </div>
          </div>
        </div>

        {/* ── Select backup card ── */}
        <div className="rp-card">
          <div className="rp-card-header">
            <span className="rp-section-label">select_backup_to_restore</span>
            <div className="rp-card-header-right">
              <span className="rp-avail-badge">
                {completedBackups.length} available
              </span>
            </div>
          </div>

          {/* Search */}
          {completedBackups.length > 0 && (
            <div className="rp-search-wrap">
              <Search size={11} className="rp-search-icon" />
              <input
                type="text"
                placeholder="search by filename or connection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rp-input"
              />
              {search && (
                <button className="rp-search-clear" onClick={() => setSearch("")}>
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {filteredBackups.length === 0 ? (
            <div className="rp-empty">
              <div className="rp-empty-icon">
                <FileArchive size={20} />
              </div>
              <div className="rp-empty-title">
                {search ? "no backups match your search" : "no completed backups available"}
              </div>
              <div className="rp-empty-sub">
                {search
                  ? "try a different search term"
                  : "run a backup first to restore from it"}
              </div>
              {search && (
                <button className="rp-btn rp-btn-ghost" style={{ fontSize: "10px", marginTop: 4 }} onClick={() => setSearch("")}>
                  <X size={10} /> clear search
                </button>
              )}
            </div>
          ) : (
            <div className="rp-backup-list">
              {filteredBackups.map((b) => (
                <div
                  key={b.id}
                  className={`rp-backup-row ${selected?.id === b.id ? "active" : ""}`}
                  onClick={() => setSelected(b)}
                >
                  <div className="rp-backup-row-left">
                    {/* Radio */}
                    <div className="rp-backup-radio">
                      <div className="rp-backup-radio-dot" />
                    </div>

                    {/* Icon */}
                    <div className="rp-backup-icon">
                      <Database size={14} color={selected?.id === b.id ? "#b8f53a" : "#3d5040"} />
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div className="rp-backup-name">{b.filename}</div>
                      <div className="rp-backup-meta">
                        <span className="rp-backup-meta-chip">
                          <Database size={9} color="#2e4035" />
                          {b.connectionName ?? "unknown"}
                        </span>
                        <span className="rp-backup-meta-chip">
                          <Clock size={9} color="#2e4035" />
                          {fmtDate(b.startedAt)}
                        </span>
                        {b.size && (
                          <span className="rp-backup-meta-chip">
                            <HardDrive size={9} color="#2e4035" />
                            {b.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="rp-restore-btn"
                    onClick={(e) => { e.stopPropagation(); setSelected(b); }}
                  >
                    <RotateCcw size={12} />
                    restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Restore history ── */}
        <div className="rp-card">
          <div className="rp-card-header">
            <span className="rp-section-label">restore_history</span>
            <div className="rp-card-header-right">
              {runningJobs > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#60a5fa" }}>
                  <Loader2 size={10} className="rp-spin" />
                  {runningJobs} running
                </span>
              )}
              <span style={{ fontSize: 10, color: "#2e4035" }}>
                auto-refresh 10s
              </span>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="rp-empty">
              <div className="rp-empty-icon">
                <Shield size={20} />
              </div>
              <div className="rp-empty-title">no restore jobs yet</div>
              <div className="rp-empty-sub">restored databases will appear here</div>
            </div>
          ) : (
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    {["backup", "target", "tables", "started", "duration", "status"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id}>
                      <td>
                        <span className="rp-cell-primary">
                          {j.backupId.slice(0, 8)}…
                        </span>
                      </td>
                      <td>
                        <span className="rp-cell-muted">
                          {j.connectionId.slice(0, 8)}…
                        </span>
                      </td>
                      <td>
                        <span className="rp-cell-muted">
                          {j.tables?.join(", ") || (
                            <span style={{ color: "#1e2e20" }}>full</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="rp-cell-mono">{fmtDate(j.startedAt)}</span>
                      </td>
                      <td>
                        <span className="rp-cell-mono">
                          {j.completedAt
                            ? formatDuration(
                                new Date(j.completedAt).getTime() -
                                new Date(j.startedAt).getTime()
                              )
                            : <span style={{ color: "#1e2e20" }}>—</span>}
                        </span>
                      </td>
                      <td>
                        <span className={`rp-status-chip ${j.status}`}>
                          {STATUS_ICON[j.status] ?? null}
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ── Modal ── */}
      <RestoreModal
        open={!!selected}
        onClose={() => setSelected(null)}
        backup={selected}
        connections={connections}
        onSuccess={() => { setSelected(null); refetch(); }}
      />
    </>
  );
}