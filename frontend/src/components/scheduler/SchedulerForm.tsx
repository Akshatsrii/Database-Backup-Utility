"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { schedulesApi } from "@/lib/api";
import type {
  DbConnection,
  CreateScheduleDto,
  ScheduleFrequency,
  BackupType,
} from "@/types";

/* ── types ───────────────────────────────────────────────── */

interface Props {
  open:        boolean;
  onClose:     () => void;
  connections: DbConnection[];
  onSuccess:   () => void;
}

/* ── frequency options ───────────────────────────────────── */

const FREQ_OPTIONS: {
  value: ScheduleFrequency;
  label: string;
  desc:  string;
}[] = [
  { value: "hourly",  label: "hourly",  desc: "every hour"            },
  { value: "daily",   label: "daily",   desc: "every day"             },
  { value: "weekly",  label: "weekly",  desc: "every sunday"          },
  { value: "monthly", label: "monthly", desc: "1st of every month"    },
];

const BACKUP_TYPES: { value: BackupType; desc: string }[] = [
  { value: "full",          desc: "complete snapshot"       },
  { value: "incremental",   desc: "changes since last"      },
  { value: "differential",  desc: "changes since full"      },
];

/* ── next-run preview ────────────────────────────────────── */

function nextRun(freq: ScheduleFrequency, timeStr: string): string {
  const [hh, mm] = timeStr.split(":").map(Number);
  const now  = new Date();
  const next = new Date(now);

  if (freq === "hourly") {
    next.setMinutes(0, 0, 0);
    next.setHours(now.getHours() + 1);
  } else if (freq === "daily") {
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (freq === "weekly") {
    const day = now.getDay(); // 0 = Sun
    const daysUntilSun = day === 0 ? 7 : 7 - day;
    next.setDate(now.getDate() + daysUntilSun);
    next.setHours(hh, mm, 0, 0);
  } else {
    // monthly
    next.setMonth(now.getMonth() + 1, 1);
    next.setHours(hh, mm, 0, 0);
  }

  return next.toLocaleString("en-GB", {
    weekday: "short",
    day:     "2-digit",
    month:   "short",
    hour:    "2-digit",
    minute:  "2-digit",
  });
}

/* ── default form state ──────────────────────────────────── */

const DEFAULT_FORM = (): CreateScheduleDto & { time: string; retention: number } => ({
  connectionId: "",
  frequency:    "daily",
  backupType:   "full",
  time:         "00:00",
  retention:    7,
});

/* ── component ───────────────────────────────────────────── */

export default function SchedulerForm({
  open,
  onClose,
  connections,
  onSuccess,
}: Props) {
  const [form,    setForm]    = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const preview = useMemo(
    () => nextRun(form.frequency, form.time),
    [form.frequency, form.time]
  );

  const handleCreate = async () => {
    if (!form.connectionId) { setError("select a connection"); return; }
    if (form.retention < 1)  { setError("retention must be at least 1 day"); return; }
    setError("");
    setLoading(true);
    try {
      await schedulesApi.create(form);
      onSuccess();
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(DEFAULT_FORM);
    setError("");
    onClose();
  };

  const showTimePicker = form.frequency !== "hourly";

  return (
    <Modal open={open} onClose={handleClose} title="create_schedule">
      <div className="space-y-4">

        {/* error */}
        {error && (
          <p
            className="text-xs px-3 py-2 rounded"
            style={{
              color:      "#ff4444",
              background: "rgba(255,68,68,0.08)",
              border:     "1px solid rgba(255,68,68,0.2)",
            }}
          >
            ✗ {error}
          </p>
        )}

        {/* connection */}
        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#4a5450" }}>connection</label>
          <select
            className="terminal-input"
            value={form.connectionId}
            onChange={(e) => { set("connectionId", e.target.value); setError(""); }}
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

        {/* frequency */}
        <div className="space-y-2">
          <label className="text-xs" style={{ color: "#4a5450" }}>frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {FREQ_OPTIONS.map((f) => {
              const active = form.frequency === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => set("frequency", f.value)}
                  className="text-left p-3 rounded border transition-all"
                  style={{
                    borderColor: active ? "#b8f53a"                  : "#252825",
                    background:  active ? "rgba(184,245,58,0.06)"    : "transparent",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: active ? "#b8f53a" : "#e8edea" }}>
                    {f.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
                    {f.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* time picker — hidden for hourly */}
        {showTimePicker && (
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              run_at{" "}
              <span style={{ color: "#3d4040" }}>(local time)</span>
            </label>
            <input
              type="time"
              className="terminal-input"
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
              style={{ colorScheme: "dark", width: 120 }}
            />
          </div>
        )}

        {/* backup type */}
        <div className="space-y-2">
          <label className="text-xs" style={{ color: "#4a5450" }}>backup_type</label>
          <div className="grid grid-cols-3 gap-2">
            {BACKUP_TYPES.map(({ value, desc }) => {
              const active = form.backupType === value;
              return (
                <button
                  key={value}
                  onClick={() => set("backupType", value)}
                  className="py-2 px-3 rounded text-xs border transition-all text-left"
                  style={{
                    borderColor: active ? "#b8f53a" : "#252825",
                    background:  active ? "rgba(184,245,58,0.08)" : "transparent",
                  }}
                >
                  <p className="font-semibold" style={{ color: active ? "#b8f53a" : "#8a9690" }}>
                    {value}
                  </p>
                  <p className="mt-0.5" style={{ color: "#3d4040" }}>{desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* retention */}
        <div className="space-y-1.5">
          <label className="text-xs" style={{ color: "#4a5450" }}>
            retention_days{" "}
            <span style={{ color: "#3d4040" }}>(backups older than this are auto-deleted)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              className="terminal-input"
              value={form.retention}
              onChange={(e) => set("retention", Number(e.target.value))}
              style={{ width: 80 }}
            />
            <span className="text-xs" style={{ color: "#4a5450" }}>days</span>
          </div>
        </div>

        {/* next-run preview */}
        <div
          className="px-3 py-2.5 rounded text-xs flex items-center justify-between"
          style={{ background: "#1a1d1a", border: "1px solid #252825" }}
        >
          <span style={{ color: "#4a5450" }}>next_run</span>
          <span style={{ color: "#b8f53a" }}>{preview}</span>
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