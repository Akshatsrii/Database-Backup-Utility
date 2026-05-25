"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { restoreApi } from "@/lib/api";
import type { Backup, DbConnection } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  backup: Backup | null;
  connections: DbConnection[];
  onSuccess: () => void;
}

const STAGES = [
  { label: "validating backup file...",  pct: 20  },
  { label: "connecting to target db...", pct: 40  },
  { label: "restoring data...",          pct: 75  },
  { label: "verifying integrity...",     pct: 90  },
  { label: "restore complete ✓",         pct: 100 },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function RestoreModal({
  open,
  onClose,
  backup,
  connections,
  onSuccess,
}: Props) {
  const [targetConnId, setTargetConnId] = useState("");
  const [tables,       setTables]       = useState("");
  const [running,      setRunning]      = useState(false);
  const [stageIdx,     setStageIdx]     = useState(-1);
  const [error,        setError]        = useState("");

  const handleRestore = async () => {
    if (!backup) return;
    if (!targetConnId) {
      setError("select target connection");
      return;
    }
    setError("");
    setRunning(true);

    try {
      for (let i = 0; i < STAGES.length - 1; i++) {
        setStageIdx(i);
        await delay(700 + Math.random() * 500);
      }
      await restoreApi.start({
        backupId:     backup.id,
        connectionId: targetConnId,
        tables: tables
          ? tables.split(",").map((t) => t.trim())
          : [],
      });
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
    setTargetConnId("");
    setTables("");
    onClose();
  };

  const cur = stageIdx >= 0 ? STAGES[stageIdx] : null;

  return (
    <Modal open={open} onClose={handleClose} title="restore_backup">
      {!backup ? null : running ? (

        /* ── Progress View ───────────────────────────────── */
        <div className="space-y-5">
          <p className="text-xs" style={{ color: "#8a9690" }}>
            restoring from {backup.filename}
          </p>
          <ProgressBar percent={cur?.pct ?? 0} stage={cur?.label} />
          <div className="space-y-1">
            {STAGES.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
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

        /* ── Form View ───────────────────────────────────── */
        <div className="space-y-4">

          {/* Backup info */}
          <div
            className="px-3 py-2.5 rounded text-xs space-y-1"
            style={{
              background: "#1a1d1a",
              border: "1px solid #252825",
            }}
          >
            <p style={{ color: "#4a5450" }}>restoring from:</p>
            <p style={{ color: "#b8f53a" }}>{backup.filename}</p>
          </div>

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

          {/* Target connection */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              target_connection
            </label>
            <select
              className="terminal-input"
              value={targetConnId}
              onChange={(e) => setTargetConnId(e.target.value)}
              style={{ appearance: "none" }}
            >
              <option value="">-- select target --</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type} · {c.database})
                </option>
              ))}
            </select>
          </div>

          {/* Selective tables */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              selective_tables{" "}
              <span style={{ color: "#3d4040" }}>
                (optional — comma separated, empty = full restore)
              </span>
            </label>
            <input
              className="terminal-input"
              type="text"
              placeholder="users, orders, products"
              value={tables}
              onChange={(e) => setTables(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div
            className="px-3 py-2.5 rounded text-xs"
            style={{
              background: "rgba(255,215,0,0.05)",
              border: "1px solid rgba(255,215,0,0.15)",
              color: "#ffd700",
            }}
          >
            ⚠ this will overwrite existing data in the target database
          </div>

          <button
            onClick={handleRestore}
            className="btn-acid w-full"
          >
            $ restore_now →
          </button>
        </div>
      )}
    </Modal>
  );
}