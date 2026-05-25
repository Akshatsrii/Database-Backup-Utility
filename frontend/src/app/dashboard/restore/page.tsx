"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backupsApi, connectionsApi, restoreApi } from "@/lib/api";
import type { Backup, DbConnection, RestoreJob } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import RestoreModal from "@/components/restore/RestoreModal";
import { fmtDate, formatDuration } from "@/lib/utils";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

export default function RestorePage() {
  const { data: backups = [] } = useQuery<Backup[]>({
    queryKey: ["backups"],
    queryFn: async () => {
      try { return (await backupsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });
  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });
  const { data: jobs = [], refetch } = useQuery<RestoreJob[]>({
    queryKey: ["restore-jobs"],
    queryFn: async () => {
      try { return (await restoreApi.jobs()).data.data ?? []; }
      catch { return []; }
    },
    refetchInterval: 10_000,
  });

  const [selected, setSelected] = useState<Backup | null>(null);
  const completedBackups = backups.filter((b) => b.status === "completed");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
          <span style={{ color: "#b8f53a" }}>$</span> restore_ops
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
          restore a database from a backup file
        </p>
      </div>

      <Card>
        <CardHeader>
          <SectionLabel>select_backup_to_restore</SectionLabel>
          <span className="text-xs" style={{ color: "#4a5450" }}>
            {completedBackups.length} available
          </span>
        </CardHeader>

        {completedBackups.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: "#4a5450" }}>
            no completed backups available
          </p>
        ) : (
          <div className="space-y-2">
            {completedBackups.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-3 rounded border
                           transition-all cursor-pointer"
                style={{
                  borderColor: selected?.id === b.id ? "#b8f53a" : "#252825",
                  background: selected?.id === b.id
                    ? "rgba(184,245,58,0.05)" : "#1a1d1a",
                }}
                onClick={() => setSelected(b)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: selected?.id === b.id ? "#b8f53a" : "#252825"
                    }}
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#e8edea" }}>
                      {b.filename}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
                      {b.connectionName} · {fmtDate(b.startedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(b); }}
                  className="btn-acid text-xs px-4 py-1.5"
                >
                  restore →
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Restore history */}
      <Card>
        <CardHeader>
          <SectionLabel>restore_history</SectionLabel>
        </CardHeader>
        {jobs.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "#4a5450" }}>
            no restore jobs yet
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #252825" }}>
                {["backup", "target", "tables", "started", "duration", "status"].map((h) => (
                  <th key={h}
                    className="text-left pb-2 pr-4 tracking-widest uppercase"
                    style={{ color: "#4a5450" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} style={{ borderBottom: "1px solid #141614" }}>
                  <td className="py-2.5 pr-4" style={{ color: "#e8edea" }}>
                    {j.backupId.slice(0, 8)}…
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: "#8a9690" }}>
                    {j.connectionId.slice(0, 8)}…
                  </td>
                  <td className="py-2.5 pr-4" style={{ color: "#4a5450" }}>
                    {j.tables?.join(", ") || "full"}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums" style={{ color: "#4a5450" }}>
                    {fmtDate(j.startedAt)}
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums" style={{ color: "#4a5450" }}>
                    {j.completedAt
                      ? formatDuration(
                          new Date(j.completedAt).getTime() -
                          new Date(j.startedAt).getTime()
                        )
                      : "—"}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge
                      status={j.status as "completed" | "running" | "failed" | "pending"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <RestoreModal
        open={!!selected}
        onClose={() => setSelected(null)}
        backup={selected}
        connections={connections}
        onSuccess={() => { setSelected(null); refetch(); }}
      />
    </div>
  );
}