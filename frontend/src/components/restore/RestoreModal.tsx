"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { restoreApi } from "@/lib/api";
import type { Backup, DbConnection } from "@/types";

/* ── types ───────────────────────────────────────────────── */

interface Props {
  open:        boolean;
  onClose:     () => void;
  backup:      Backup | null;
  connections: DbConnection[];
  onSuccess:   () => void;
}

/* ── stages ──────────────────────────────────────────────── */

const STAGES = [
  { label: "validating backup file...",  pct: 20  },
  { label: "connecting to target db...", pct: 40  },
  { label: "restoring data...",          pct: 75  },
  { label: "verifying integrity...",     pct: 90  },
  { label: "restore complete ✓",         pct: 100 },
];

type View = "form" | "confirm" | "progress" | "done";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ── elapsed timer hook ──────────────────────────────────── */

function useElapsed(running: boolean) {
  const [ms, setMs]    = useState(0);
  const startRef       = useRef<number | null>(null);
  const rafRef         = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startRef.current = performance.now();
      const tick = () => {
        setMs(performance.now() - (startRef.current ?? 0));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (!running) startRef.current = null;
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [running]);

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ── component ───────────────────────────────────────────── */

export default function RestoreModal({
  open,
  onClose,
  backup,
  connections,
  onSuccess,
}: Props) {
  const [targetConnId, setTargetConnId] = useState("");
  const [tables,       setTables]       = useState("");
  const [view,         setView]         = useState<View>("form");
  const [stageIdx,     setStageIdx]     = useState(-1);
  const [stageError,   setStageError]   = useState("");
  const [formError,    setFormError]    = useState("");
  const [confirmed,    setConfirmed]    = useState(false);

  const isRunning = view === "progress";
  const elapsed   = useElapsed(isRunning);

  /* ── validation → show confirm step ── */
  const handleSubmit = () => {
    if (!backup) return;
    if (!targetConnId) { setFormError("select a target connection"); return; }
    setFormError("");
    setView("confirm");
  };

  /* ── actual restore ── */
  const handleRestore = async () => {
    if (!backup) return;
    setView("progress");
    setStageIdx(0);
    setStageError("");

    try {
      for (let i = 0; i < STAGES.length - 1; i++) {
        setStageIdx(i);
        await delay(700 + Math.random() * 500);
      }
      await restoreApi.start({
        backupId:     backup.id,
        connectionId: targetConnId,
        tables: tables ? tables.split(",").map((t) => t.trim()) : [],
      });
      setStageIdx(STAGES.length - 1);
      setView("done");
      await delay(1200);
      onSuccess();
      handleClose();
    } catch (e: unknown) {
      setStageError((e as Error).message ?? "unknown error");
      setView("progress"); // stay on progress, show error inline
    }
  };

  /* ── reset on close ── */
  const handleClose = () => {
    if (isRunning) return;
    setView("form");
    setStageIdx(-1);
    setStageError("");
    setFormError("");
    setTargetConnId("");
    setTables("");
    setConfirmed(false);
  };

  if (!backup) return null;

  const targetConn = connections.find((c) => c.id === targetConnId);
  const cur        = stageIdx >= 0 ? STAGES[stageIdx] : null;

  return (
    <Modal open={open} onClose={handleClose} title="restore_backup">

      {/* ── form ─────────────────────────────────────────── */}
      {view === "form" && (
        <div className="space-y-4">

          {/* source info */}
          <div
            className="px-3 py-2.5 rounded text-xs space-y-1"
            style={{ background: "#1a1d1a", border: "1px solid #252825" }}
          >
            <p style={{ color: "#4a5450" }}>restoring from:</p>
            <p style={{ color: "#6366f1" }}>{backup.filename}</p>
            {backup.sizeAfter && (
              <p style={{ color: "#4a5450" }}>
                {(backup.sizeAfter / 1024 / 1024).toFixed(1)} MB compressed
              </p>
            )}
          </div>

          {formError && (
            <p
              className="text-xs px-3 py-2 rounded"
              style={{
                color:      "#ff4444",
                background: "rgba(255,68,68,0.08)",
                border:     "1px solid rgba(255,68,68,0.2)",
              }}
            >
              ✗ {formError}
            </p>
          )}

          {/* target connection */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              target_connection
            </label>
            <select
              className="terminal-input"
              value={targetConnId}
              onChange={(e) => { setTargetConnId(e.target.value); setFormError(""); }}
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

          {/* selective tables */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>
              selective_tables{" "}
              <span style={{ color: "#3d4040" }}>
                (optional · comma separated · empty = full restore)
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

          {/* overwrite warning */}
          <div
            className="px-3 py-2.5 rounded text-xs"
            style={{
              background: "rgba(255,215,0,0.05)",
              border:     "1px solid rgba(255,215,0,0.15)",
              color:      "#ffd700",
            }}
          >
            ⚠ this will overwrite existing data in the target database
          </div>

          <button onClick={handleSubmit} className="btn-acid w-full">
            $ restore_now →
          </button>
        </div>
      )}

      {/* ── confirm ──────────────────────────────────────── */}
      {view === "confirm" && (
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "#8a9690" }}>
            please review before proceeding:
          </p>

          {/* summary table */}
          <div
            className="rounded text-xs divide-y"
            style={{
              background:  "#1a1d1a",
              border:      "1px solid #252825",

            }}
          >
            {[
              ["source",  backup.filename],
              ["target",  targetConn ? `${targetConn.name} (${targetConn.database})` : targetConnId],
              ["tables",  tables || "all (full restore)"],
              ["mode",    backup.backupType],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 px-3 py-2">
                <span className="w-16 flex-shrink-0" style={{ color: "#4a5450" }}>{k}</span>
                <span style={{ color: "#e8edea" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* confirm checkbox */}
          <label className="flex items-start gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 1, cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ color: "#8a9690" }}>
              I understand this will <span style={{ color: "#ff4444" }}>overwrite existing data</span> in the
              target database and the action cannot be undone
            </span>
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setView("form")}
              className="flex-1 text-xs px-3 py-2 rounded border transition-colors"
              style={{ borderColor: "#252825", color: "#4a5450" }}
            >
              ← back
            </button>
            <button
              onClick={handleRestore}
              disabled={!confirmed}
              className="flex-1 btn-acid"
              style={{ opacity: confirmed ? 1 : 0.4, cursor: confirmed ? "pointer" : "not-allowed" }}
            >
              confirm restore →
            </button>
          </div>
        </div>
      )}

      {/* ── progress ─────────────────────────────────────── */}
      {(view === "progress" || view === "done") && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#8a9690" }}>
              restoring from{" "}
              <span style={{ color: "#6366f1" }}>{backup.filename}</span>
            </p>
            <span className="text-xs tabular-nums" style={{ color: "#4a5450" }}>
              {elapsed}
            </span>
          </div>

          <ProgressBar percent={cur?.pct ?? 0} stage={cur?.label} />

          {/* stage list */}
          <div className="space-y-1.5">
            {STAGES.map((s, i) => {
              const done    = i < stageIdx || view === "done";
              const active  = i === stageIdx && view === "progress";
              const failed  = active && !!stageError;
              const pending = !done && !active;

              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span style={{
                    color: failed  ? "#ff4444"
                         : done   ? "#10b981"
                         : active ? "#6366f1"
                         : "#4a5450",
                    flexShrink: 0,
                    width: 10,
                  }}>
                    {failed ? "✗" : done ? "✓" : active ? "›" : "○"}
                  </span>
                  <span style={{
                    color: failed  ? "#ff4444"
                         : done   ? "#10b981"
                         : active ? "#e8edea"
                         : "#4a5450",
                  }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* inline stage error */}
          {stageError && (
            <div
              className="px-3 py-2.5 rounded text-xs space-y-2"
              style={{
                background: "rgba(255,68,68,0.08)",
                border:     "1px solid rgba(255,68,68,0.2)",
                color:      "#ff4444",
              }}
            >
              <p>✗ restore failed: {stageError}</p>
              <button
                onClick={() => { setView("form"); setStageIdx(-1); setStageError(""); }}
                className="text-xs underline"
                style={{ color: "#8a9690" }}
              >
                ← back to form
              </button>
            </div>
          )}
        </div>
      )}

    </Modal>
  );
}