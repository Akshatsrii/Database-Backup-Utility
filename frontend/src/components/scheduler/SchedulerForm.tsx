"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { schedulesApi } from "@/lib/api";
import type {
  DbConnection,
  CreateScheduleDto,
  ScheduleFrequency,
  BackupType,
} from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  connections: DbConnection[];
  onSuccess: () => void;
}

const FREQ_OPTIONS: {
  value: ScheduleFrequency;
  label: string;
  desc: string;
}[] = [
  { value: "hourly",  label: "hourly",  desc: "every hour"            },
  { value: "daily",   label: "daily",   desc: "every day at midnight" },
  { value: "weekly",  label: "weekly",  desc: "every sunday"          },
  { value: "monthly", label: "monthly", desc: "1st of every month"    },
];

export default function SchedulerForm({
  open,
  onClose,
  connections,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<CreateScheduleDto>({
    connectionId: "",
    frequency:    "daily",
    backupType:   "full",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k: keyof CreateScheduleDto, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = async () => {
    if (!form.connectionId) {
      setError("select a connection");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await schedulesApi.create(form);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="create_schedule">
      <div className="space-y-4">

        {error && (
          <p
            className="text-xs px-3 py-2 rounded"
            style={{
              color: "#ff4444",
              background: "rgba(255,68,68,0.08)",
              border: "1px solid rgba(255,68,68,0.2)",
            }}
          >
            ✗ {error}
          </p>
        )}

        {/* Connection */}
        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#4a5450" }}>
            connection
          </label>
          <select
            className="terminal-input"
            value={form.connectionId}
            onChange={(e) => set("connectionId", e.target.value)}
            style={{ appearance: "none" }}
          >
            <option value="">-- select connection --</option>
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <label className="text-xs" style={{ color: "#4a5450" }}>
            frequency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FREQ_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => set("frequency", f.value)}
                className="text-left p-3 rounded border transition-all"
                style={{
                  borderColor:
                    form.frequency === f.value ? "#b8f53a" : "#252825",
                  background:
                    form.frequency === f.value
                      ? "rgba(184,245,58,0.06)"
                      : "transparent",
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{
                    color:
                      form.frequency === f.value ? "#b8f53a" : "#e8edea",
                  }}
                >
                  {f.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
                  {f.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Backup Type */}
        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#4a5450" }}>
            backup_type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["full","incremental","differential"] as BackupType[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => set("backupType", t)}
                  className="py-2 px-3 rounded text-xs border transition-all"
                  style={{
                    borderColor:
                      form.backupType === t ? "#b8f53a" : "#252825",
                    color:
                      form.backupType === t ? "#b8f53a" : "#8a9690",
                    background:
                      form.backupType === t
                        ? "rgba(184,245,58,0.08)"
                        : "transparent",
                  }}
                >
                  {t}
                </button>
              )
            )}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn-acid w-full"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "creating..." : "$ schedule_backup →"}
        </button>
      </div>
    </Modal>
  );
}