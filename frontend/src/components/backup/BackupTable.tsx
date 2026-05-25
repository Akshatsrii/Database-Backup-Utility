"use client";

import { Trash2, Download, RotateCcw } from "lucide-react";
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
}

export default function BackupTable({
  backups,
  onRefresh,
  onRestore,
}: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm("delete this backup?")) return;
    try {
      await backupsApi.remove(id);
      onRefresh();
    } catch { /**/ }
  };

  if (!backups.length) {
    return (
      <div
        className="terminal-card flex flex-col items-center
                   justify-center py-16 gap-3"
        style={{ color: "#4a5450" }}
      >
        <p className="text-xs tracking-widest">no backups found</p>
        <p className="text-xs">
          create your first backup using the button above
        </p>
      </div>
    );
  }

  return (
    <div className="terminal-card overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid #252825" }}>
            {[
              "filename",
              "db",
              "type",
              "size (raw→gz)",
              "saved",
              "duration",
              "date",
              "status",
              "actions",
            ].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 tracking-widest
                           uppercase whitespace-nowrap"
                style={{ color: "#4a5450" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {backups.map((b) => (
            <tr
              key={b.id}
              className="group transition-colors"
              style={{ borderBottom: "1px solid #141614" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#141614")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Filename */}
              <td
                className="px-4 py-3 font-medium"
                style={{ color: "#e8edea", maxWidth: 180 }}
              >
                <span className="block truncate" title={b.filename}>
                  {b.filename}
                </span>
                {b.encrypted && (
                  <span
                    className="text-xs"
                    style={{ color: "#ffd700" }}
                  >
                    🔒 encrypted
                  </span>
                )}
              </td>

              {/* DB Type */}
              <td className="px-4 py-3" style={{ color: "#8a9690" }}>
                {dbLabels[b.dbType]}
              </td>

              {/* Backup Type */}
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

              {/* Size */}
              <td
                className="px-4 py-3 tabular-nums"
                style={{ color: "#8a9690" }}
              >
                {b.sizeBefore ? formatBytes(b.sizeBefore) : "—"}
                <span style={{ color: "#4a5450" }}> → </span>
                {b.sizeAfter ? formatBytes(b.sizeAfter) : "—"}
              </td>

              {/* Compression Saved */}
              <td
                className="px-4 py-3 tabular-nums"
                style={{ color: "#4ade80" }}
              >
                {b.sizeBefore && b.sizeAfter
                  ? compressionSaved(b.sizeBefore, b.sizeAfter)
                  : "—"}
              </td>

              {/* Duration */}
              <td
                className="px-4 py-3 tabular-nums"
                style={{ color: "#4a5450" }}
              >
                {b.durationMs ? formatDuration(b.durationMs) : "—"}
              </td>

              {/* Date */}
              <td
                className="px-4 py-3 tabular-nums whitespace-nowrap"
                style={{ color: "#4a5450" }}
              >
                {fmtDate(b.startedAt)}
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <StatusBadge status={b.status} />
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div
                  className="flex items-center gap-2 opacity-0
                             group-hover:opacity-100 transition-opacity"
                >
                  {b.status === "completed" && (
                    <>
                      
                        href={backupsApi.download(b.id)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: "#38bdf8" }}
                        title="download"
                      >
                        <Download size={13} />
                      </a>
                      <button
                        onClick={() => onRestore(b)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: "#b8f53a" }}
                        title="restore"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: "#ff4444" }}
                    title="delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}