"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Power } from "lucide-react";
import { connectionsApi, schedulesApi } from "@/lib/api";
import type { DbConnection, Schedule } from "@/types";
import SchedulerForm from "@/components/scheduler/SchedulerForm";
import { TextBadge } from "@/components/ui/Badge";
import { cronLabel, fmtDate } from "@/lib/utils";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

export default function SchedulerPage() {
  const qc = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["schedules"],
    queryFn: async () => {
      try { return (await schedulesApi.list()).data.data ?? []; }
      catch { return []; }
    },
    refetchInterval: 15_000,
  });

  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });

  const [showForm, setShowForm] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["schedules"] });

  const toggleSchedule = async (id: string, enabled: boolean) => {
    try { await schedulesApi.toggle(id, !enabled); refresh(); }
    catch { /**/ }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("delete this schedule?")) return;
    try { await schedulesApi.remove(id); refresh(); }
    catch { /**/ }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> scheduler
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            automated backup schedules
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-acid flex items-center gap-2"
        >
          <Plus size={14} /> new schedule
        </button>
      </div>

      <Card>
        <CardHeader>
          <SectionLabel>active_schedules</SectionLabel>
          <span className="text-xs" style={{ color: "#4a5450" }}>
            {schedules.filter((s) => s.enabled).length} running
          </span>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded animate-pulse"
                style={{ background: "#1a1d1a" }} />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ color: "#4a5450" }}>
            no schedules configured · create one to automate backups
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3.5 rounded border"
                style={{
                  borderColor: s.enabled ? "rgba(184,245,58,0.2)" : "#252825",
                  background: s.enabled ? "rgba(184,245,58,0.03)" : "#1a1d1a",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: s.enabled ? "#4ade80" : "#3d4040",
                      boxShadow: s.enabled ? "0 0 6px #4ade80" : "none",
                    }}
                  />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#e8edea" }}>
                      {s.connectionName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
                      {cronLabel(s.cronExpression)}
                      {s.nextRun && <span> · next: {fmtDate(s.nextRun)}</span>}
                    </p>
                  </div>
                  <TextBadge
                    color={
                      s.backupType === "full" ? "acid" :
                      s.backupType === "incremental" ? "blue" : "yellow"
                    }
                  >
                    {s.backupType}
                  </TextBadge>
                  <TextBadge color="muted">{s.frequency}</TextBadge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSchedule(s.id, s.enabled)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-all"
                    style={{
                      borderColor: s.enabled
                        ? "rgba(255,68,68,0.3)" : "rgba(74,222,128,0.3)",
                      color: s.enabled ? "#ff4444" : "#4ade80",
                    }}
                  >
                    <Power size={11} />
                    {s.enabled ? "pause" : "enable"}
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="p-2 rounded transition-colors"
                    style={{ color: "#4a5450" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SchedulerForm
        open={showForm}
        onClose={() => setShowForm(false)}
        connections={connections}
        onSuccess={refresh}
      />
    </div>
  );
}