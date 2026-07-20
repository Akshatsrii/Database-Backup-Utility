"use client";

import {
  Trash2, Download, RotateCcw,
  ChevronUp, ChevronDown, ChevronsUpDown,
  DatabaseBackup,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import {
  formatBytes, formatDuration, fmtDate,
  dbLabels, compressionSaved,
} from "@/lib/utils";
import { backupsApi } from "@/lib/api";
import type { Backup } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  backups:        Backup[];
  onRefresh:      () => void;
  onRestore:      (b: Backup) => void;
  selectedIds:    string[];
  onToggleSelect: (id: string) => void;
  onToggleAll:    () => void;
  allSelected:    boolean;
}

type SortKey = "filename" | "dbType" | "backupType" | "sizeAfter" | "durationMs" | "startedAt" | "status";
type SortDir = "asc" | "desc";

// ─── Column Config ────────────────────────────────────────────────────────────

const COLUMNS: { key: SortKey | null; label: string; align?: "right" }[] = [
  { key: "filename",   label: "filename"      },
  { key: "dbType",     label: "db"            },
  { key: "backupType", label: "type"          },
  { key: null,         label: "size"          },
  { key: null,         label: "saved",  align: "right" },
  { key: "durationMs", label: "duration"      },
  { key: "startedAt",  label: "date"          },
  { key: "status",     label: "status"        },
  { key: null,         label: ""              },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey | null; sortKey: SortKey | null; sortDir: SortDir }) {
  if (!col) return null;
  if (sortKey !== col) return <ChevronsUpDown size={10} style={{ color: "#2e3830", flexShrink: 0 }} />;
  return sortDir === "asc"
    ? <ChevronUp   size={10} style={{ color: "#b8f53a", flexShrink: 0 }} />
    : <ChevronDown size={10} style={{ color: "#b8f53a", flexShrink: 0 }} />;
}

function StatusBadge({ status }: { status: Backup["status"] }) {
  const map: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    completed: { bg: "rgba(74,222,128,0.08)",  color: "#4ade80", border: "rgba(74,222,128,0.2)",  dot: "#4ade80"  },
    running:   { bg: "rgba(184,245,58,0.08)",  color: "#b8f53a", border: "rgba(184,245,58,0.2)",  dot: "#b8f53a"  },
    failed:    { bg: "rgba(255,68,68,0.08)",   color: "#ff4444", border: "rgba(255,68,68,0.2)",   dot: "#ff4444"  },
    pending:   { bg: "rgba(74,84,80,0.2)",     color: "#8a9690", border: "rgba(74,84,80,0.3)",    dot: "#4a5450"  },
  };
  const s = map[status] ?? map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px",
        borderRadius: 5,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 5, height: 5, borderRadius: "50%",
          background: s.dot,
          animation: status === "running" ? "bkt-pulse 1s ease infinite" : "none",
        }}
      />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: Backup["backupType"] }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    full:         { bg: "rgba(184,245,58,0.08)", color: "#b8f53a", border: "rgba(184,245,58,0.2)" },
    incremental:  { bg: "rgba(56,189,248,0.08)", color: "#38bdf8", border: "rgba(56,189,248,0.2)" },
    differential: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  };
  const s = map[type] ?? map.full;
  return (
    <span
      style={{
        padding: "3px 7px",
        borderRadius: 5,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {type}
    </span>
  );
}

function ActionBtn({
  onClick, color, title, label, disabled, children,
}: {
  onClick?: () => void;
  color: string;
  title: string;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={label}
      disabled={disabled}
      style={{
        background: hovered ? `${color}18` : "transparent",
        border: `1px solid ${hovered ? color + "44" : "transparent"}`,
        borderRadius: 6,
        color: disabled ? "#4a5450" : color,
        padding: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        gap: 10,
        background: "#141714",
        border: "1px solid #252825",
        borderRadius: 12,
      }}
    >
      <DatabaseBackup size={28} style={{ color: "#252825" }} />
      <p style={{ fontSize: 12, color: "#4a5450", letterSpacing: "1px" }}>no backups found</p>
      <p style={{ fontSize: 11, color: "#2e332e" }}>create your first backup using the button above</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BackupTable({
  backups,
  onRefresh,
  onRestore,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  allSelected,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey,    setSortKey]    = useState<SortKey | null>(null);
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const cbRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Indeterminate checkbox
  const indeterminate = selectedIds.length > 0 && !allSelected;
  const headerCbRef = useCallback((el: HTMLInputElement | null) => {
    if (el) el.indeterminate = indeterminate;
  }, [indeterminate]);

  // Sorting
  const handleSort = useCallback((key: SortKey | null) => {
    if (!key) return;
    setSortKey((prev) => {
      if (prev === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      else setSortDir("desc");
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

  // Delete
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

  if (!backups.length) return <EmptyState />;

  const th: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    userSelect: "none",
    borderBottom: "1px solid #252825",
    background: "#0f1210",
  };

  const td: React.CSSProperties = {
    padding: "11px 14px",
    fontSize: 11,
    borderBottom: "1px solid #141614",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  };

  return (
    <>
      <style>{`
        @keyframes bkt-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <div
        style={{
          background: "#141714",
          border: "1px solid #252825",
          borderRadius: 12,
          overflow: "hidden",
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
        }}
      >
        {/* Selection bar */}
        {selectedIds.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "#0d0f0d",
              borderBottom: "1px solid #252825",
              fontSize: 11,
              color: "#8a9690",
            }}
          >
            <span style={{ color: "#b8f53a", fontWeight: 700 }}>{selectedIds.length}</span>
            <span>row{selectedIds.length !== 1 ? "s" : ""} selected</span>
          </div>
        )}

        {/* Scrollable table wrapper */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 820,
            }}
          >
            <thead>
              <tr>
                {/* Select-all checkbox */}
                <th style={{ ...th, width: 40, padding: "10px 12px 10px 16px" }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={headerCbRef}
                    onChange={onToggleAll}
                    style={{ cursor: "pointer", accentColor: "#b8f53a" }}
                  />
                </th>

                {COLUMNS.map(({ key, label, align }) => (
                  <th
                    key={label + (key ?? "")}
                    style={{
                      ...th,
                      color: sortKey === key && key ? "#8a9690" : "#4a5450",
                      cursor: key ? "pointer" : "default",
                      textAlign: align ?? "left",
                    }}
                    onClick={() => handleSort(key)}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {label}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sorted.map((b) => {
                const isSelected = selectedIds.includes(b.id);
                const isDeleting = deletingId === b.id;
                const isHovered  = hoveredId === b.id;

                const rowBg = isSelected
                  ? "#111811"
                  : isHovered
                  ? "#161916"
                  : "transparent";

                return (
                  <tr
                    key={b.id}
                    style={{
                      background: rowBg,
                      opacity: isDeleting ? 0.4 : 1,
                      transition: "background 0.1s ease, opacity 0.2s ease",
                    }}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Checkbox */}
                    <td style={{ ...td, padding: "11px 12px 11px 16px", width: 40 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(b.id)}
                        style={{ cursor: "pointer", accentColor: "#b8f53a" }}
                      />
                    </td>

                    {/* Filename */}
                    <td style={{ ...td, maxWidth: 200, color: "#e8edea", fontWeight: 600 }}>
                      <span
                        title={b.filename}
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 190,
                        }}
                      >
                        {b.filename}
                      </span>
                      {b.encrypted && (
                        <span style={{ fontSize: 9, color: "#fbbf24", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          🔒 encrypted
                        </span>
                      )}
                    </td>

                    {/* DB type */}
                    <td style={{ ...td, color: "#8a9690" }}>
                      {dbLabels[b.dbType]}
                    </td>

                    {/* Backup type */}
                    <td style={td}>
                      <TypeBadge type={b.backupType} />
                    </td>

                    {/* Size */}
                    <td style={{ ...td, color: "#8a9690", fontVariantNumeric: "tabular-nums" }}>
                      <span>{b.sizeBefore ? formatBytes(b.sizeBefore) : "—"}</span>
                      <span style={{ color: "#2e332e", margin: "0 4px" }}>→</span>
                      <span>{b.sizeAfter ? formatBytes(b.sizeAfter) : "—"}</span>
                    </td>

                    {/* Saved */}
                    <td style={{ ...td, color: "#4ade80", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                      {b.sizeBefore && b.sizeAfter
                        ? compressionSaved(b.sizeBefore, b.sizeAfter)?.label
                        : <span style={{ color: "#2e332e" }}>—</span>}
                    </td>

                    {/* Duration */}
                    <td style={{ ...td, color: "#4a5450", fontVariantNumeric: "tabular-nums" }}>
                      {b.durationMs ? formatDuration(b.durationMs) : <span style={{ color: "#2e332e" }}>—</span>}
                    </td>

                    {/* Date */}
                    <td style={{ ...td, color: "#4a5450", fontVariantNumeric: "tabular-nums" }}>
                      {fmtDate(b.startedAt)}
                    </td>

                    {/* Status */}
                    <td style={td}>
                      <StatusBadge status={b.status} />
                    </td>

                    {/* Actions */}
                    <td style={{ ...td, width: 96 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          opacity: isHovered ? 1 : 0,
                          pointerEvents: isHovered ? "auto" : "none",
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        {b.status === "completed" && (
                          <>
                            <a
                              href={backupsApi.download(b.id)}
                              title="Download backup"
                              aria-label="Download backup"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                padding: 6,
                                borderRadius: 6,
                                color: "#38bdf8",
                                border: "1px solid transparent",
                                transition: "all 0.15s",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget as HTMLAnchorElement;
                                el.style.background = "rgba(56,189,248,0.1)";
                                el.style.borderColor = "rgba(56,189,248,0.3)";
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget as HTMLAnchorElement;
                                el.style.background = "transparent";
                                el.style.borderColor = "transparent";
                              }}
                            >
                              <Download size={13} />
                            </a>

                            <ActionBtn
                              onClick={() => onRestore(b)}
                              color="#b8f53a"
                              title="Restore backup"
                              label="Restore backup"
                              disabled={isDeleting}
                            >
                              <RotateCcw size={13} />
                            </ActionBtn>
                          </>
                        )}

                        <ActionBtn
                          onClick={() => handleDelete(b.id)}
                          color="#ff4444"
                          title="Delete backup"
                          label="Delete backup"
                          disabled={isDeleting}
                        >
                          {isDeleting
                            ? <span style={{ fontSize: 10, color: "#4a5450" }}>…</span>
                            : <Trash2 size={13} />
                          }
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 16px",
            borderTop: "1px solid #252825",
            fontSize: 10,
            color: "#4a5450",
          }}
        >
          <span>
            {backups.length} backup{backups.length !== 1 ? "s" : ""}
            {selectedIds.length > 0 && (
              <span style={{ color: "#8a9690" }}> · {selectedIds.length} selected</span>
            )}
          </span>
          {sortKey && (
            <span style={{ color: "#2e332e" }}>
              sorted by {sortKey} ({sortDir})
            </span>
          )}
        </div>
      </div>
    </>
  );
}