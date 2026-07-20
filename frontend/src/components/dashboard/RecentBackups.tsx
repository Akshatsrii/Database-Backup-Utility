"use client";

import { Fragment, useState } from "react";
import { StatusBadge, TextBadge } from "@/components/ui/Badge";
import { formatBytes, timeAgo, dbLabels } from "@/lib/utils";
import type { Backup } from "@/types";

const SHIMMER_CSS = `
@keyframes rb-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes rb-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
`;

function StyleOnce() {
  return <style dangerouslySetInnerHTML={{ __html: SHIMMER_CSS }} />;
}

function ShimmerRow() {
  return (
    <tr>
      <td colSpan={6} style={{ padding: "2px 0" }}>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, #6366f122 40%, #6366f155 50%, #6366f122 60%, transparent 100%)",
            backgroundSize: "400px 100%",
            animation: "rb-shimmer 1.6s linear infinite",
          }}
        />
      </td>
    </tr>
  );
}

export default function RecentBackups({ backups }: { backups: Backup[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!backups.length) {
    return (
      <div
        className="flex items-center justify-center h-24 text-xs"
        style={{ color: "#64748b" }}
      >
        no backups yet · run your first backup →
      </div>
    );
  }

  const visible   = backups.slice(0, 8);
  const remaining = backups.length - visible.length;

  return (
    <>
      <StyleOnce />
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #334155" }}>
              {["name", "type", "db", "size", "time", "status"].map((h) => (
                <th
                  key={h}
                  className="text-left pb-2 pr-4 tracking-widest uppercase"
                  style={{ color: "#64748b" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((b) => {
              const isHovered = hoveredId === b.id;
              const isRunning = b.status === "running";
              const isFailed  = b.status === "failed";

              return (
                // BUGFIX: pehle bare <> fragment ke andar <tr key={b.id}>
                // aur <ShimmerRow key={...}> dono the — React table ke
                // andar sibling rows ko <Fragment key> chahiye, bare <>
                // pe key nahi laga sakte. Ab Fragment explicitly import
                // karke key lagaya gaya hai.
                <Fragment key={b.id}>
                  <tr
                    style={{
                      borderBottom: "1px solid #1a1d1a",
                      background:   isHovered ? "#141614" : "transparent",
                      transition:   "background 0.1s ease",
                    }}
                    onMouseEnter={() => setHoveredId(b.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* name */}
                    <td
                      className="py-2.5 pr-4 font-medium"
                      style={{
                        color:    isFailed ? "#ff4444" : "#ffffff",
                        maxWidth: 160,
                      }}
                    >
                      <span
                        className="block truncate"
                        title={b.filename}
                        style={{ cursor: "default" }}
                      >
                        {b.filename}
                      </span>
                      {b.encrypted && (
                        <span style={{ color: "#ffd700", fontSize: 10 }}>
                          🔒 encrypted
                        </span>
                      )}
                    </td>

                    {/* type */}
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

                    {/* db */}
                    <td className="py-2.5 pr-4" style={{ color: "#cbd5e1" }}>
                      {dbLabels[b.dbType]}
                    </td>

                    {/* size */}
                    <td
                      className="py-2.5 pr-4 tabular-nums"
                      style={{ color: "#cbd5e1" }}
                    >
                      {b.sizeAfter ? formatBytes(b.sizeAfter) : "—"}
                    </td>

                    {/* time */}
                    <td
                      className="py-2.5 pr-4 tabular-nums"
                      style={{
                        color:     isRunning ? "#6366f1" : "#64748b",
                        animation: isRunning
                          ? "rb-pulse 1.4s ease-in-out infinite"
                          : undefined,
                      }}
                    >
                      {isRunning ? "running…" : timeAgo(b.startedAt)}
                    </td>

                    {/* status */}
                    <td className="py-2.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>

                  {isRunning && <ShimmerRow />}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        {(remaining > 0 || backups.length > 0) && (
          <div
            className="pt-2 text-xs tabular-nums"
            style={{
              color:         "#64748b",
              borderTop:     "1px solid #1a1d1a",
              marginTop:     4,
              display:       "flex",
              justifyContent:"space-between",
            }}
          >
            <span>{backups.length} total</span>
            {remaining > 0 && (
              <span style={{ color: "#64748b" }}>+{remaining} more</span>
            )}
          </div>
        )}
      </div>
    </>
  );
}