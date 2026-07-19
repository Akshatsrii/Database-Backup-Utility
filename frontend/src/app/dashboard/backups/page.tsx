"use client";

import { useState } from "react";
import {
  Plus, Search, RefreshCw, Filter, Download,
  Trash2, CheckSquare, Square, Database, Clock,
  ChevronDown, X, FileArchive, SlidersHorizontal,
} from "lucide-react";
import BackupTable   from "@/components/backup/BackupTable";
import BackupModal   from "@/components/backup/BackupModal";
import RestoreModal  from "@/components/restore/RestoreModal";
import RetentionPreviewModal from "@/components/backup/RetentionPreviewModal";
import { useBackups } from "@/hooks/useBackups";
import { useQuery }  from "@tanstack/react-query";
import { connectionsApi } from "@/lib/api";
import type { Backup, DbConnection } from "@/types";

const STATUS_OPTIONS = [
  { value: "all",       label: "all status",  dot: "#4a5450" },
  { value: "completed", label: "completed",   dot: "#4ade80" },
  { value: "running",   label: "running",     dot: "#60a5fa" },
  { value: "failed",    label: "failed",      dot: "#f87171" },
  { value: "pending",   label: "pending",     dot: "#fbbf24" },
];

export default function BackupsPage() {
  const { data: backups = [], refresh, isLoading } = useBackups();

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data ?? []; }
      catch { return []; }
    },
  });

  const [showCreate,    setShowCreate]    = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [selectedIds,   setSelectedIds]   = useState<string[]>([]);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);

  // Fetch previews
  const { data: previewList = [], isLoading: previewLoading } = useQuery<Backup[]>({
    queryKey: ["cleanup-preview"],
    queryFn: async () => {
      try {
        const res = await fetch("http://localhost:4000/api/backups/preview-cleanup");
        const json = await res.json();
        return json.data || [];
      } catch { return []; }
    },
    enabled: showPreview,
  });

  const filtered = backups.filter((b) => {
    const srchOk =
      !search ||
      b.filename.toLowerCase().includes(search.toLowerCase()) ||
      b.connectionName?.toLowerCase().includes(search.toLowerCase());
    const stOk = statusFilter === "all" || b.status === statusFilter;
    return srchOk && stOk;
  });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () =>
    setSelectedIds((prev) =>
      prev.length === filtered.length ? [] : filtered.map((b) => b.id)
    );

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); };
  const hasActiveFilters = search || statusFilter !== "all";

  const statusCounts = STATUS_OPTIONS.slice(1).reduce((acc, s) => {
    acc[s.value] = backups.filter((b) => b.status === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .bp-root {
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          color: #c8d9cc;
          animation: bp-fadein 0.3s ease;
        }

        @keyframes bp-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

        /* ── Header ── */
        .bp-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bp-title {
          font-size: 18px;
          font-weight: 700;
          color: #e8edea;
          display: flex;
          align-items: center;
          gap: 7px;
          line-height: 1;
        }

        .bp-title .dollar { color: #b8f53a; }

        .bp-subtitle {
          font-size: 10px;
          color: #3d5040;
          margin-top: 5px;
          letter-spacing: 0.08em;
        }

        .bp-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Stat pills ── */
        .bp-stat-row {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .bp-stat-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          padding: 6px 12px;
          border-radius: 20px;
          background: #0c130e;
          border: 1px solid #1a2418;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: 'JetBrains Mono', monospace;
        }

        .bp-stat-pill:hover { border-color: #253523; background: #0e160f; }

        .bp-stat-pill.active {
          border-color: rgba(184,245,58,0.3);
          background: rgba(184,245,58,0.06);
        }

        .bp-stat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .bp-stat-label { color: #3d5040; }
        .bp-stat-count { color: #8aaa80; font-weight: 600; }
        .bp-stat-pill.active .bp-stat-label { color: #8aaa80; }
        .bp-stat-pill.active .bp-stat-count { color: #b8f53a; }

        /* ── Filter bar ── */
        .bp-filterbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .bp-search-wrap {
          position: relative;
          flex: 1;
          min-width: 180px;
          max-width: 320px;
        }

        .bp-search-icon {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          color: #3d5040;
          pointer-events: none;
        }

        .bp-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #3d5040;
          cursor: pointer;
          background: none;
          border: none;
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }

        .bp-search-clear:hover { color: #8aaa80; }

        .bp-input {
          width: 100%;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 7px;
          padding: 9px 32px 9px 32px;
          color: #b8d8bc;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s;
        }

        .bp-input:focus {
          border-color: rgba(184,245,58,0.3);
          box-shadow: 0 0 0 3px rgba(184,245,58,0.05);
        }

        .bp-input::placeholder { color: #1e2e20; }

        .bp-select-wrap { position: relative; }

        .bp-select {
          appearance: none;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 7px;
          padding: 9px 32px 9px 12px;
          color: #6a8a70;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
          width: 150px;
        }

        .bp-select:focus { border-color: rgba(184,245,58,0.3); }

        .bp-select-arrow {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          color: #3d5040;
          pointer-events: none;
        }

        .bp-filter-clear {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          color: #4a6050;
          background: none;
          border: 1px solid #1a2418;
          border-radius: 6px;
          padding: 8px 10px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          transition: color 0.15s, border-color 0.15s;
        }

        .bp-filter-clear:hover { color: #8aaa80; border-color: #253523; }

        /* ── Buttons ── */
        .bp-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .bp-btn-ghost {
          background: transparent;
          color: #4a6450;
          border: 1px solid #1a2418;
        }

        .bp-btn-ghost:hover { background: #0c130e; color: #8aaa80; border-color: #253523; }

        .bp-btn-danger {
          background: transparent;
          color: #e05555;
          border: 1px solid rgba(224,85,85,0.2);
        }

        .bp-btn-danger:hover { background: rgba(224,85,85,0.06); border-color: rgba(224,85,85,0.35); }

        .bp-btn-primary {
          background: #b8f53a;
          color: #0a1008;
        }

        .bp-btn-primary:hover {
          background: #ccff50;
          box-shadow: 0 4px 16px rgba(184,245,58,0.2);
          transform: translateY(-1px);
        }

        .bp-btn-primary:active { transform: scale(0.98); }

        .bp-spin { animation: bpspin 0.8s linear infinite; }
        @keyframes bpspin { to { transform: rotate(360deg); } }

        /* ── Bulk action bar ── */
        .bp-bulk-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(184,245,58,0.05);
          border: 1px solid rgba(184,245,58,0.15);
          border-radius: 8px;
          margin-bottom: 12px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .bp-bulk-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #8aaa70;
        }

        .bp-bulk-count {
          font-size: 13px;
          font-weight: 700;
          color: #b8f53a;
        }

        .bp-bulk-actions { display: flex; gap: 8px; }

        /* ── Empty state ── */
        .bp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 48px 24px;
          background: #0c130e;
          border: 1px solid #1a2418;
          border-radius: 10px;
          text-align: center;
        }

        .bp-empty-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: rgba(184,245,58,0.06);
          border: 1px solid rgba(184,245,58,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a6450;
        }

        .bp-empty-title { font-size: 13px; font-weight: 600; color: #4a6450; }
        .bp-empty-sub { font-size: 10px; color: #2a3828; letter-spacing: 0.05em; }

        /* ── Skeleton ── */
        .bp-skeleton-row {
          height: 48px;
          background: #0c130e;
          border-radius: 6px;
          margin-bottom: 6px;
          border: 1px solid #1a2418;
          animation: sk-pulse 1.4s ease-in-out infinite;
        }

        @keyframes sk-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .bp-skeleton-header {
          height: 36px;
          background: #0a100d;
          border-radius: 6px;
          margin-bottom: 6px;
          border: 1px solid #141e12;
          animation: sk-pulse 1.4s ease-in-out infinite;
        }

        /* ── Results info ── */
        .bp-results-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .bp-results-count {
          font-size: 10px;
          color: #2e4035;
          letter-spacing: 0.06em;
        }

        .bp-results-count em { color: #4a6450; font-style: normal; font-weight: 600; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .bp-header { flex-direction: column; align-items: flex-start; }
          .bp-filterbar { flex-direction: column; align-items: stretch; }
          .bp-search-wrap { max-width: 100%; }
          .bp-select { width: 100%; }
          .bp-stat-row { gap: 6px; }
          .bp-stat-pill { font-size: 9px; padding: 5px 9px; }
        }
      `}</style>

      <div className="bp-root">

        {/* ── Header ── */}
        <div className="bp-header">
          <div>
            <div className="bp-title">
              <span className="dollar">$</span>
              backup_history
            </div>
            <div className="bp-subtitle">
              {backups.length} total · {filtered.length} shown
              {hasActiveFilters && " · filtered"}
            </div>
          </div>

          <div className="bp-header-actions">
            <button onClick={handleRefresh} className="bp-btn bp-btn-ghost">
              <RefreshCw size={12} className={refreshing ? "bp-spin" : ""} />
              refresh
            </button>
            <button onClick={() => setShowPreview(true)} className="bp-btn bp-btn-ghost">
              <Clock size={12} />
              retention preview
            </button>
            <button onClick={() => setShowCreate(true)} className="bp-btn bp-btn-primary">
              <Plus size={14} />
              new backup
            </button>
          </div>
        </div>

        {/* ── Status pills ── */}
        <div className="bp-stat-row">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              className={`bp-stat-pill ${statusFilter === s.value ? "active" : ""}`}
              onClick={() => setStatusFilter(s.value)}
            >
              <span className="bp-stat-dot" style={{ background: s.dot, boxShadow: statusFilter === s.value ? `0 0 5px ${s.dot}88` : "none" }} />
              <span className="bp-stat-label">{s.label}</span>
              {s.value !== "all" && (
                <span className="bp-stat-count">
                  {statusCounts[s.value] ?? 0}
                </span>
              )}
              {s.value === "all" && (
                <span className="bp-stat-count">{backups.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Filter bar ── */}
        <div className="bp-filterbar">
          <div className="bp-search-wrap">
            <Search size={12} className="bp-search-icon" />
            <input
              type="text"
              placeholder="search by filename or connection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bp-input"
            />
            {search && (
              <button className="bp-search-clear" onClick={() => setSearch("")}>
                <X size={11} />
              </button>
            )}
          </div>

          <div className="bp-select-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bp-select"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={11} className="bp-select-arrow" />
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="bp-filter-clear">
              <X size={10} />
              clear
            </button>
          )}
        </div>

        {/* ── Bulk action bar ── */}
        {selectedIds.length > 0 && (
          <div className="bp-bulk-bar">
            <div className="bp-bulk-info">
              <CheckSquare size={13} color="#b8f53a" />
              <span className="bp-bulk-count">{selectedIds.length}</span>
              <span>backup{selectedIds.length > 1 ? "s" : ""} selected</span>
            </div>
            <div className="bp-bulk-actions">
              <button className="bp-btn bp-btn-ghost" style={{ fontSize: "10px", padding: "6px 10px" }}>
                <Download size={11} />
                export
              </button>
              <button className="bp-btn bp-btn-danger" style={{ fontSize: "10px", padding: "6px 10px" }}>
                <Trash2 size={11} />
                delete
              </button>
              <button
                className="bp-btn bp-btn-ghost"
                style={{ fontSize: "10px", padding: "6px 10px" }}
                onClick={() => setSelectedIds([])}
              >
                <X size={11} />
                deselect
              </button>
            </div>
          </div>
        )}

        {/* ── Results info ── */}
        {!isLoading && (
          <div className="bp-results-info">
            <span className="bp-results-count">
              showing <em>{filtered.length}</em> of <em>{backups.length}</em> backups
              {hasActiveFilters && " (filtered)"}
            </span>
            {selectedIds.length === 0 && filtered.length > 0 && (
              <button
                className="bp-btn bp-btn-ghost"
                style={{ fontSize: "10px", padding: "5px 10px" }}
                onClick={toggleAll}
              >
                {allSelected ? <CheckSquare size={10} /> : <Square size={10} />}
                {allSelected ? "deselect all" : "select all"}
              </button>
            )}
          </div>
        )}

        {/* ── Table / Loading / Empty ── */}
        {isLoading ? (
          <div>
            <div className="bp-skeleton-header" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bp-skeleton-row" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bp-empty">
            <div className="bp-empty-icon">
              <FileArchive size={22} />
            </div>
            <div>
              <div className="bp-empty-title">
                {hasActiveFilters ? "no backups match filters" : "no backups found"}
              </div>
              <div className="bp-empty-sub" style={{ marginTop: 4 }}>
                {hasActiveFilters
                  ? "try clearing your search or status filter"
                  : "create your first backup to get started"}
              </div>
            </div>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="bp-btn bp-btn-ghost" style={{ fontSize: "10px" }}>
                <X size={10} /> clear filters
              </button>
            ) : (
              <button onClick={() => setShowCreate(true)} className="bp-btn bp-btn-primary" style={{ fontSize: "11px" }}>
                <Plus size={12} /> new backup
              </button>
            )}
          </div>
        ) : (
          <BackupTable
            backups={filtered}
            onRefresh={refresh}
            onRestore={(b) => setRestoreTarget(b)}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            allSelected={allSelected}
          />
        )}

      </div>

      {/* ── Modals ── */}
      <BackupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        connections={connections}
        onSuccess={refresh}
      />
      <RestoreModal
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        backup={restoreTarget}
        connections={connections}
        onSuccess={refresh}
      />
      <RetentionPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        previews={previewList}
        loading={previewLoading}
      />
    </>
  );
}