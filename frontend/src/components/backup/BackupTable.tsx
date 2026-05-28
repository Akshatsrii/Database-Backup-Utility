"use client";

import { Trash2, Download, RotateCcw, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useState, useCallback } from "react";
import { StatusBadge, TextBadge } from "@/components/ui/Badge";
import {
  formatBytes,
  formatDuration,
  fmtDate,
  dbLabels,
  compressionSaved,
} from "@/lib/utils";
import { backupsApi } from "@/lib/api";
import type { Backup } from "@/types";

interface Props {
  backups: Backup[];
  onRefresh: () => void;
  onRestore: (b: Backup) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
}

type SortKey = "filename" | "dbType" | "backupType" | "sizeAfter" | "durationMs" | "startedAt" | "status";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: "filename",    label: "filename"      },
  { key: "dbType",      label: "db"            },
  { key: "backupType",  label: "type"          },
  { key: null,          label: "size (raw→gz)" },
  { key: null,          label: "saved"         },
  { key: "durationMs",  label: "duration"      },
  { key: "startedAt",   label: "date"          },
  { key: "status",      label: "status"        },
  { key: null,          label: "actions"       },
];

function SortIcon({ col, sortKey, sortDir }: { col: SortKey | null; sortKey: SortKey | null; sortDir: SortDir }) {
  if (!col) return null;
  if (sortKey !== col) return <ChevronsUpDown size={10} style={{ color: "#2e3830", flexShrink: 0 }} />;
  return sortDir === "asc"
    ? <ChevronUp  size={10} style={{ color: "#b8f53a", flexShrink: 0 }} />
    : <ChevronDown size={10} style={{ color: "#b8f53a", flexShrink: 0 }} />;
}

export default function BackupTable({
  backups,
  onRefresh,
  onRestore,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  allSelected,
}: Props) {
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [sortKey,    setSortKey]      = useState<SortKey | null>(null);
  const [sortDir,    setSortDir]      = useState<SortDir>("desc");
  const [hoveredId,  setHoveredId]    = useState<string | null>(null);

  /* ── sorting ── */
  const handleSort = useCallback((key: SortKey | null) => {
    if (!key) return;
    setSortKey(prev => {
      if (prev === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
      else { setSortDir("desc"); }
      return key;
    });
  }, []);

  const sorted = [...backups].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    const cmp = typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? cmp : -cmp;
  });

  /* ── delete with loading state ── */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this backup?")) return;
    setDeletingId(id);
    try {
      await backupsApi.remove(id);
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  /* ── empty state ── */
  if (!backups.length) {
    return (
      <div
        className="terminal-card flex flex-col items-center justify-center py-16 gap-3"
        style={{ color: "#4a5450" }}
      >
        <p className="text-xs tracking-widest">no backups found</p>
        <p className="text-xs">
          create your first backup using the button above
        </p>
      </div>
    );
  }

  const indeterminate = selectedIds.length > 0 && !allSelected;

  return (
    <div className="terminal-card overflow-x-auto">
      {/* selection summary bar */}
      {selectedIds.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2 text-xs"
          style={{
            background: "#0d0f0d",
            borderBottom: "1px solid #252825",
            color: "#8a9690",
          }}
        >
          <span style={{ color: "#b8f53a" }}>{selectedIds.length}</span>
          <span>row{selectedIds.length > 1 ? "s" : ""} selected</span>
        </div>
      )}

      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #252825" }}>
            {/* checkbox */}
            <th className="px-4 py-3" style={{ width: 36 }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = indeterminate; }}
                onChange={onToggleAll}
                style={{ cursor: "pointer" }}
              />
            </th>

            {COLUMNS.map(({ key, label }) => (
              <th
                key={label}
                className="text-left px-4 py-3 tracking-widest uppercase whitespace-nowrap"
                style={{
                  color: sortKey === key && key ? "#8a9690" : "#4a5450",
                  cursor: key ? "pointer" : "default",
                  userSelect: "none",
                }}
                onClick={() => handleSort(key)}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((b) => {
            const isSelected  = selectedIds.includes(b.id);
            const isDeleting  = deletingId === b.id;
            const isHovered   = hoveredId === b.id;

            return (
              <tr
                key={b.id}
                className="group transition-colors"
                style={{
                  borderBottom: "1px solid #141614",
                  background: isSelected
                    ? "#111811"
                    : isHovered
                    ? "#141614"
                    : "transparent",
                  opacity: isDeleting ? 0.4 : 1,
                  transition: "background 0.12s ease, opacity 0.2s ease",
                }}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* checkbox */}
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(b.id)}
                    style={{ cursor: "pointer" }}
                  />
                </td>

                {/* filename */}
                <td
                  className="px-4 py-3 font-medium"
                  style={{ color: "#e8edea", maxWidth: 180 }}
                >
                  <span className="block truncate" title={b.filename}>
                    {b.filename}
                  </span>
                  {b.encrypted && (
                    <span className="text-xs" style={{ color: "#ffd700" }}>
                      🔒 encrypted
                    </span>
                  )}
                </td>

                {/* db */}
                <td className="px-4 py-3" style={{ color: "#8a9690" }}>
                  {dbLabels[b.dbType]}
                </td>

                {/* type badge */}
                <td className="px-4 py-3">
                  <TextBadge
                    color={
                      b.backupType === "full"
                        ? "acid"
                        : b.backupType === "incremental"
                        ? "blue"
                        : "yellow"
                    }
                  >
                    {b.backupType}
                  </TextBadge>
                </td>

                {/* size */}
                <td className="px-4 py-3 tabular-nums" style={{ color: "#8a9690" }}>
                  {b.sizeBefore ? formatBytes(b.sizeBefore) : "—"}
                  <span style={{ color: "#4a5450" }}> → </span>
                  {b.sizeAfter  ? formatBytes(b.sizeAfter)  : "—"}
                </td>

                {/* saved */}
                <td className="px-4 py-3 tabular-nums" style={{ color: "#4ade80" }}>
                  {b.sizeBefore && b.sizeAfter
                    ? compressionSaved(b.sizeBefore, b.sizeAfter)
                    : "—"}
                </td>

                {/* duration */}
                <td className="px-4 py-3 tabular-nums" style={{ color: "#4a5450" }}>
                  {b.durationMs ? formatDuration(b.durationMs) : "—"}
                </td>

                {/* date */}
                <td className="px-4 py-3 tabular-nums whitespace-nowrap" style={{ color: "#4a5450" }}>
                  {fmtDate(b.startedAt)}
                </td>

                {/* status */}
                <td className="px-4 py-3">
                  <StatusBadge status={b.status} />
                </td>

                {/* actions */}
                <td className="px-4 py-3">
                  <div
                    className="flex items-center gap-1"
                    style={{
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.15s ease",
                      pointerEvents: isHovered ? "auto" : "none",
                    }}
                  >
                    {b.status === "completed" && (
                      <>
                        <a
                          href={backupsApi.download(b.id)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "#38bdf8" }}
                          title="Download backup"
                          aria-label="Download backup"
                        >
                          <Download size={13} />
                        </a>

                        <button
                          onClick={() => onRestore(b)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "#b8f53a" }}
                          title="Restore backup"
                          aria-label="Restore backup"
                          disabled={isDeleting}
                        >
                          <RotateCcw size={13} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: isDeleting ? "#4a5450" : "#ff4444", cursor: isDeleting ? "not-allowed" : "pointer" }}
                      title="Delete backup"
                      aria-label="Delete backup"
                      disabled={isDeleting}
                    >
                      {isDeleting
                        ? <span style={{ fontSize: 10 }}>…</span>
                        : <Trash2 size={13} />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* footer row count */}
      <div
        className="px-4 py-2 text-xs"
        style={{
          borderTop: "1px solid #252825",
          color: "#4a5450",
        }}
      >
        {backups.length} backup{backups.length !== 1 ? "s" : ""}
        {selectedIds.length > 0 && (
          <span style={{ color: "#8a9690" }}> · {selectedIds.length} selected</span>
        )}
      </div>
    </div>
  );
}+