"use client";

import { StatusBadge, TextBadge } from "@/components/ui/Badge";
import { formatBytes, timeAgo, dbLabels } from "@/lib/utils";
import type { Backup } from "@/types";

export default function RecentBackups({ backups }: { backups: Backup[] }) {
  if (!backups.length) {
    return (
      <div
        className="flex items-center justify-center h-24 text-xs"
        style={{ color: "#4a5450" }}
      >
        no backups yet · run your first backup →
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid #252825" }}>
            {["name", "type", "db", "size", "time", "status"].map((h) => (
              <th
                key={h}
                className="text-left pb-2 pr-4 tracking-widest uppercase"
                style={{ color: "#4a5450" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {backups.slice(0, 8).map((b) => (
            <tr
              key={b.id}
              style={{ borderBottom: "1px solid #1a1d1a" }}
            >
              <td
                className="py-2.5 pr-4 font-medium"
                style={{ color: "#e8edea", maxWidth: 160 }}
              >
                <span className="block truncate">{b.filename}</span>
              </td>
              <td className="py-2.5 pr-4">
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
              <td className="py-2.5 pr-4" style={{ color: "#8a9690" }}>
                {dbLabels[b.dbType]}
              </td>
              <td
                className="py-2.5 pr-4 tabular-nums"
                style={{ color: "#8a9690" }}
              >
                {b.sizeAfter ? formatBytes(b.sizeAfter) : "—"}
              </td>
              <td
                className="py-2.5 pr-4 tabular-nums"
                style={{ color: "#4a5450" }}
              >
                {timeAgo(b.startedAt)}
              </td>
              <td className="py-2.5">
                <StatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}