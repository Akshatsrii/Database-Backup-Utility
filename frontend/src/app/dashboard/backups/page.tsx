"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, RefreshCw, Download, Filter,
  Database, CheckCircle, XCircle, Clock, HardDrive,
  Trash2, RotateCcw, Shield, TrendingUp, Activity,
  ChevronDown, X, AlertTriangle, FileArchive
} from "lucide-react";
import BackupTable from "@/components/backup/BackupTable";
import BackupModal from "@/components/backup/BackupModal";
import RestoreModal from "@/components/restore/RestoreModal";
import { useBackups } from "@/hooks/useBackups";
import { useQuery } from "@tanstack/react-query";
import { connectionsApi, backupsApi } from "@/lib/api";
import type { Backup, DbConnection, BackupStatus, BackupType } from "@/types";
import { formatBytes, fmtDate, formatDuration } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────
type SortKey   = "date" | "size" | "duration" | "name";
type SortOrder = "asc" | "desc";

// ─── Mini stat card ────────────────────────────────────────────────────────
function MiniStat({
  label,
  value,
  icon,
  color = "#b8f53a",
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
}) {
  return (
    <div
      className="terminal-card p-4 flex flex-col gap-2"
      style={{ borderColor: "#252825" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase" style={{ color: "#4a5450" }}>
          {label}
        </span>
        <span style={{ color, opacity: 0.75 }}>{icon}</span>
      </div>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: "#4a5450" }}>{sub}</p>}
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { border: "#4ade80", text: "#4ade80", bg: "rgba(74,222,128,0.08)" },
    error:   { border: "#ff4444", text: "#ff4444", bg: "rgba(255,68,68,0.08)"  },
    info:    { border: "#38bdf8", text: "#38bdf8", bg: "rgba(56,189,248,0.08)" },
  };
  const c = colors[type];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3
                 px-4 py-3 rounded-lg text-xs font-mono animate-fade-in"
      style={{
        background:   c.bg,
        border:       `1px solid ${c.border}`,
        color:        c.text,
        maxWidth:     320,
        boxShadow:    "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <span>
        {type === "success" ? "✓" : type === "error" ? "✗" : "●"}
      </span>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} style={{ color: "#4a5450" }}>
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function BackupsPage() {
  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: backups = [], refresh, isLoading } = useBackups();
  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn:  async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });

  // ── Modals ────────────────────────────────────────────────────────────────
  const [showCreate,     setShowCreate]     = useState(false);
  const [restoreTarget,  setRestoreTarget]  = useState<Backup | null>(null);
  const [showFilterPanel,setShowFilterPanel]= useState(false);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<BackupStatus | "all">("all");
  const [typeFilter,   setTypeFilter]   = useState<BackupType | "all">("all");
  const [dbFilter,     setDbFilter]     = useState("all");
  const [storageFilter,setStorageFilter]= useState("all");
  const [sortKey,      setSortKey]      = useState<SortKey>("date");
  const [sortOrder,    setSortOrder]    = useState<SortOrder>("desc");
  const [selectedIds,  setSelectedIds]  = useState<string[]>([]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") =>
    setToast({ message, type });

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalSize    = backups.reduce((s, b) => s + (b.sizeAfter ?? 0), 0);
  const completed    = backups.filter((b) => b.status === "completed").length;
  const failed       = backups.filter((b) => b.status === "failed").length;
  const running      = backups.filter((b) => b.status === "running").length;
  const successRate  = backups.length
    ? Math.round((completed / backups.length) * 100)
    : 100;
  const avgDuration  = backups.filter((b) => b.durationMs).length
    ? Math.round(
        backups.reduce((s, b) => s + (b.durationMs ?? 0), 0) /
          backups.filter((b) => b.durationMs).length
      )
    : 0;

  // ── Filtering + sorting ───────────────────────────────────────────────────
  const filtered = backups
    .filter((b) => {
      const srchOk = !search ||
        b.filename.toLowerCase().includes(search.toLowerCase()) ||
        b.connectionName?.toLowerCase().includes(search.toLowerCase());
      const stOk   = statusFilter === "all"  || b.status      === statusFilter;
      const tOk    = typeFilter   === "all"  || b.backupType  === typeFilter;
      const dbOk   = dbFilter     === "all"  || b.dbType      === dbFilter;
      const strOk  = storageFilter=== "all"  || b.storageType === storageFilter;
      return srchOk && stOk && tOk && dbOk && strOk;
    })
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "date")     diff = new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      if (sortKey === "size")     diff = (a.sizeAfter ?? 0) - (b.sizeAfter ?? 0);
      if (sortKey === "duration") diff = (a.durationMs ?? 0) - (b.durationMs ?? 0);
      if (sortKey === "name")     diff = a.filename.localeCompare(b.filename);
      return sortOrder === "asc" ? diff : -diff;
    });

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected backups?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => backupsApi.remove(id)));
      setSelectedIds([]);
      refresh();
      showToast(`Deleted ${selectedIds.length} backups`, "success");
    } catch {
      showToast("Failed to delete some backups", "error");
    }
  };

  // ── Select all ────────────────────────────────────────────────────────────
  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length;
  const toggleAll   = () =>
    setSelectedIds(allSelected ? [] : filtered.map((b) => b.id));

  // ── Clear filters ─────────────────────────────────────────────────────────
  const hasFilters =
    search || statusFilter !== "all" || typeFilter !== "all" ||
    dbFilter !== "all" || storageFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDbFilter("all");
    setStorageFilter("all");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> backup_history
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            {backups.length} total · {filtered.length} shown ·{" "}
            {running > 0 && (
              <span style={{ color: "#38bdf8" }}>
                {running} running
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => { refresh(); showToast("Refreshed", "info"); }}
            className="btn-ghost flex items-center gap-2 text-xs px-3 py-2"
          >
            <RefreshCw size={12} /> refresh
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilterPanel((p) => !p)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded border transition-all"
            style={{
              borderColor: showFilterPanel ? "#b8f53a" : "#252825",
              color:       showFilterPanel ? "#b8f53a" : "#8a9690",
              background:  showFilterPanel ? "rgba(184,245,58,0.06)" : "transparent",
            }}
          >
            <Filter size={12} />
            filters
            {hasFilters && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#b8f53a" }}
              />
            )}
          </button>

          {/* New backup */}
          <button
            onClick={() => setShowCreate(true)}
            className="btn-acid flex items-center gap-2"
          >
            <Plus size={14} /> new backup
          </button>
        </div>
      </div>

      {/* ── Mini Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MiniStat
          label="total"
          value={backups.length}
          icon={<Database size={14} />}
          color="#b8f53a"
          sub="all time"
        />
        <MiniStat
          label="completed"
          value={completed}
          icon={<CheckCircle size={14} />}
          color="#4ade80"
          sub={`${successRate}% success`}
        />
        <MiniStat
          label="failed"
          value={failed}
          icon={<XCircle size={14} />}
          color={failed > 0 ? "#ff4444" : "#4a5450"}
          sub={failed > 0 ? "needs attention" : "all good"}
        />
        <MiniStat
          label="storage"
          value={formatBytes(totalSize)}
          icon={<HardDrive size={14} />}
          color="#38bdf8"
          sub="compressed"
        />
        <MiniStat
          label="avg duration"
          value={avgDuration ? formatDuration(avgDuration) : "—"}
          icon={<Clock size={14} />}
          color="#ffd700"
          sub="per backup"
        />
      </div>

      {/* ── Filter Panel ───────────────────────────────────────────────────── */}
      {showFilterPanel && (
        <div
          className="terminal-card p-4 space-y-4 animate-fade-in"
          style={{ borderColor: "rgba(184,245,58,0.2)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs tracking-widest uppercase" style={{ color: "#4a5450" }}>
              advanced_filters
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs flex items-center gap-1"
                style={{ color: "#ff4444" }}
              >
                <X size={11} /> clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as BackupStatus | "all")}
                className="terminal-input text-xs"
                style={{ appearance: "none" }}
              >
                <option value="all">all status</option>
                <option value="completed">✓ completed</option>
                <option value="running">◌ running</option>
                <option value="failed">✗ failed</option>
                <option value="pending">● pending</option>
              </select>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>backup type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as BackupType | "all")}
                className="terminal-input text-xs"
                style={{ appearance: "none" }}
              >
                <option value="all">all types</option>
                <option value="full">full</option>
                <option value="incremental">incremental</option>
                <option value="differential">differential</option>
              </select>
            </div>

            {/* DB Type */}
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>database</label>
              <select
                value={dbFilter}
                onChange={(e) => setDbFilter(e.target.value)}
                className="terminal-input text-xs"
                style={{ appearance: "none" }}
              >
                <option value="all">all databases</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            {/* Storage */}
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>storage</label>
              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                className="terminal-input text-xs"
                style={{ appearance: "none" }}
              >
                <option value="all">all storage</option>
                <option value="local">local</option>
                <option value="firebase">firebase</option>
              </select>
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: "#252825" }}>
            <span className="text-xs" style={{ color: "#4a5450" }}>sort_by:</span>
            <div className="flex gap-2">
              {(["date", "size", "duration", "name"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (sortKey === k) setSortOrder((o) => o === "asc" ? "desc" : "asc");
                    else { setSortKey(k); setSortOrder("desc"); }
                  }}
                  className="text-xs px-2.5 py-1 rounded border transition-all flex items-center gap-1"
                  style={{
                    borderColor: sortKey === k ? "#b8f53a" : "#252825",
                    color:       sortKey === k ? "#b8f53a" : "#8a9690",
                    background:  sortKey === k ? "rgba(184,245,58,0.08)" : "transparent",
                  }}
                >
                  {k}
                  {sortKey === k && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#4a5450" }}
          />
          <input
            type="text"
            placeholder="search by filename or connection..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input pl-8 text-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "#4a5450" }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Result count */}
        <span className="text-xs" style={{ color: "#4a5450" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded border"
            style={{ borderColor: "rgba(255,68,68,0.3)", background: "rgba(255,68,68,0.05)" }}
          >
            <span className="text-xs" style={{ color: "#ff4444" }}>
              {selectedIds.length} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 text-xs"
              style={{ color: "#ff4444" }}
            >
              <Trash2 size={11} /> delete
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs"
              style={{ color: "#4a5450" }}
            >
              <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* ── Running backup alert ────────────────────────────────────────────── */}
      {running > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded border text-xs"
          style={{
            borderColor: "rgba(56,189,248,0.3)",
            background:  "rgba(56,189,248,0.05)",
            color:        "#38bdf8",
          }}
        >
          <Activity size={13} className="animate-pulse" />
          <span>
            {running} backup{running > 1 ? "s" : ""} currently running —
            page auto-refreshes every 15s
          </span>
        </div>
      )}

      {/* ── Failed alert ────────────────────────────────────────────────────── */}
      {failed > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded border text-xs"
          style={{
            borderColor: "rgba(255,68,68,0.3)",
            background:  "rgba(255,68,68,0.05)",
            color:        "#ff4444",
          }}
        >
          <AlertTriangle size={13} />
          <span>
            {failed} backup{failed > 1 ? "s" : ""} failed — check{" "}
            <a href="/dashboard/logs" style={{ textDecoration: "underline" }}>
              live logs
            </a>{" "}
            for details
          </span>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 rounded animate-pulse"
              style={{ background: "#141614", animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="terminal-card flex flex-col items-center justify-center py-20 gap-4"
          style={{ color: "#4a5450" }}
        >
          <FileArchive size={36} style={{ opacity: 0.3 }} />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium" style={{ color: "#8a9690" }}>
              {hasFilters ? "no backups match filters" : "no backups yet"}
            </p>
            <p className="text-xs">
              {hasFilters
                ? "try clearing filters or a different search"
                : "create your first backup using the button above"}
            </p>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost text-xs px-4 py-2">
              clear filters
            </button>
          )}
        </div>
      ) : (
        <BackupTable
          backups={filtered}
          onRefresh={refresh}
          onRestore={(b) => setRestoreTarget(b)}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((p) =>
              p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
            )
          }
          onToggleAll={toggleAll}
          allSelected={allSelected}
        />
      )}

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer
        className="mt-6 pt-4 border-t"
        style={{ borderColor: "#1a1d1a" }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center
                        justify-between gap-4">

          {/* Left — summary */}
          <div className="flex items-center gap-6 text-xs" style={{ color: "#4a5450" }}>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#4ade80" }}
              />
              {completed} completed
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#ff4444" }}
              />
              {failed} failed
            </span>
            <span className="flex items-center gap-1.5">
              <HardDrive size={11} />
              {formatBytes(totalSize)} total
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={11} />
              {backups.filter((b) => b.encrypted).length} encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp size={11} />
              {successRate}% success rate
            </span>
          </div>

          {/* Right — last updated */}
          <div className="flex items-center gap-3 text-xs" style={{ color: "#4a5450" }}>
            <span>
              last updated:{" "}
              <span style={{ color: "#8a9690" }}>
                {new Date().toLocaleTimeString("en-GB")}
              </span>
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "#4ade80",
                boxShadow:  "0 0 4px #4ade80",
              }}
            />
            <span style={{ color: "#4ade80" }}>live</span>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="mt-3 flex items-center justify-between text-xs"
          style={{ color: "#3d4040" }}
        >
          <span>BackupOS v1.0.0 · backup_history module</span>
          <span>
            {filtered.length} / {backups.length} backups displayed
          </span>
        </div>
      </footer>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <BackupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        connections={connections}
        onSuccess={() => {
          refresh();
          showToast("Backup started successfully!", "success");
        }}
      />
      <RestoreModal
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        backup={restoreTarget}
        connections={connections}
        onSuccess={() => {
          refresh();
          showToast("Restore completed!", "success");
          setRestoreTarget(null);
        }}
      />

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}