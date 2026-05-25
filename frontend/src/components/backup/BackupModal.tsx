"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { backupsApi } from "@/lib/api";
import type { DbConnection, CreateBackupDto, BackupType } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  connections: DbConnection[];
  onSuccess: () => void;
}

const STAGES = [
  { key: "connecting",  label: "connecting to database...", pct: 15  },
  { key: "dumping",     label: "dumping database...",        pct: 40  },
  { key: "compressing", label: "compressing backup...",      pct: 65  },
  { key: "encrypting",  label: "encrypting...",              pct: 80  },
  { key: "uploading",   label: "uploading to storage...",    pct: 95  },
  { key: "completed",   label: "completed ✓",                pct: 100 },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BackupModal({
  open,
  onClose,
  connections,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<CreateBackupDto>({
    connectionId: "",
    backupType:   "full",
    storageType:  "local",
    encrypt:      false,
  });
  const [running,  setRunning]  = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [error,    setError]    = useState("");

  const set = (k: keyof CreateBackupDto, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.connectionId) {
      setError("select a connection");
      return;
    }
    setError("");
    setRunning(true);
    setStageIdx(0);

    try {
      for (let i = 0; i < STAGES.length - 1; i++) {
        setStageIdx(i);
        await delay(600 + Math.random() * 400);
      }
      await backupsApi.create(form);
      setStageIdx(STAGES.length - 1);
      await delay(800);
      onSuccess();
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const handleClose = () => {
    if (running) return;
    setStageIdx(-1);
    setError("");
    setForm({
      connectionId: "",
      backupType:   "full",
      storageType:  "local",
      encrypt:      false,
    });
    onClose();
  };

  const currentStage = stageIdx >= 0 ? STAGES[stageIdx] : null;

  return (
    <Modal open={open} onClose={handleClose} title="create_backup">

      {running ? (
        /* ── Progress View ─────────────────────────────────── */
        <div className="space-y-5">
          <p className="text-xs" style={{ color: "#8a9690" }}>
            backup in progress...
          </p>
          <ProgressBar
            percent={currentStage?.pct ?? 0}
            stage={currentStage?.label}
          />
          <div className="space-y-1 mt-2">
            {STAGES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <span
                  style={{
                    color:
                      i < stageIdx
                        ? "#4ade80"
                        : i === stageIdx
                        ? "#b8f53a"
                        : "#4a5450",
                  }}
                >
                  {i < stageIdx ? "✓" : i === stageIdx ? "›" : "○"}
                </span>
                <span
                  style={{
                    color:
                      i < stageIdx
                        ? "#4ade80"
                        : i === stageIdx
                        ? "#e8edea"
                        : "#4a5450",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Form View ─────────────────────────────────────── */
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
                  {c.name} ({c.type} · {c.database})
                </option>
              ))}
            </select>
          </div>

          {/* Backup Type */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              backup_type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["full", "incremental", "differential"] as BackupType[]).map(
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

          {/* Storage */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              storage
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["local", "firebase", "s3"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => set("storageType", s)}
                  className="py-2 px-3 rounded text-xs border transition-all"
                  style={{
                    borderColor:
                      form.storageType === s ? "#38bdf8" : "#252825",
                    color:
                      form.storageType === s ? "#38bdf8" : "#8a9690",
                    background:
                      form.storageType === s
                        ? "rgba(56,189,248,0.08)"
                        : "transparent",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Encrypt Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "#8a9690" }}>
              aes encryption
            </span>
            <button
              onClick={() => set("encrypt", !form.encrypt)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{
                background: form.encrypt
                  ? "rgba(184,245,58,0.3)"
                  : "#252825",
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                style={{
                  left: "2px",
                  transform: form.encrypt
                    ? "translateX(20px)"
                    : "translateX(0)",
                  background: form.encrypt ? "#b8f53a" : "#4a5450",
                }}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="btn-acid w-full mt-2"
          >
            $ create_backup →
          </button>
        </div>
      )}
    </Modal>
  );
}