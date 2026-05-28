"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckCircle, XCircle, Loader2, Circle,
  Database, Archive, Lock, Upload,
  Wifi, AlertTriangle, Clock,
} from "lucide-react";
import type { BackupProgress } from "@/types";

// ─── Props ─────────────────────────────────────────────────────────────────
interface Props {
  progress:  BackupProgress;
  elapsed?:  number;        // seconds elapsed — optional
  dbName?:   string;        // optional db name to show
  encrypted?: boolean;      // if false — encrypt stage is skipped
}

// ─── Stage config ───────────────────────────────────────────────────────────
const STAGES: {
  key:   string;
  label: string;
  sub:   string;
  icon:  React.ReactNode;
}[] = [
  {
    key:   "connecting",
    label: "connecting to database",
    sub:   "establishing secure connection",
    icon:  <Wifi size={12} />,
  },
  {
    key:   "dumping",
    label: "dumping database",
    sub:   "exporting all tables and data",
    icon:  <Database size={12} />,
  },
  {
    key:   "compressing",
    label: "compressing backup",
    sub:   "gzip compression — reduces size up to 88%",
    icon:  <Archive size={12} />,
  },
  {
    key:   "encrypting",
    label: "encrypting data",
    sub:   "aes-256-gcm encryption with unique IV",
    icon:  <Lock size={12} />,
  },
  {
    key:   "uploading",
    label: "uploading to storage",
    sub:   "transferring to selected storage target",
    icon:  <Upload size={12} />,
  },
  {
    key:   "completed",
    label: "backup completed",
    sub:   "all operations finished successfully",
    icon:  <CheckCircle size={12} />,
  },
];

// ─── Stage status ───────────────────────────────────────────────────────────
type StageStatus = "done" | "current" | "pending" | "skipped" | "failed";

function getStatus(
  stageKey:    string,
  stageIdx:    number,
  currentIdx:  number,
  isFailed:    boolean,
  encrypted:   boolean
): StageStatus {
  if (stageKey === "encrypting" && !encrypted) return "skipped";
  if (isFailed && stageIdx === currentIdx)      return "failed";
  if (stageIdx < currentIdx)                    return "done";
  if (stageIdx === currentIdx)                  return "current";
  return "pending";
}

// ─── Stage icon ─────────────────────────────────────────────────────────────
function StageIcon({
  status,
  icon,
}: {
  status: StageStatus;
  icon:   React.ReactNode;
}) {
  if (status === "done")
    return <CheckCircle size={14} style={{ color: "#4ade80" }} />;
  if (status === "failed")
    return <XCircle size={14} style={{ color: "#ff4444" }} />;
  if (status === "skipped")
    return <Circle size={14} style={{ color: "#3d4040" }} />;
  if (status === "current")
    return (
      <span style={{ color: "#b8f53a" }}>
        <Loader2 size={14} className="animate-spin" />
      </span>
    );
  return <Circle size={14} style={{ color: "#3d4040" }} />;
}

// ─── Dot pulse ──────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full animate-pulse"
      style={{ background: color, boxShadow: `0 0 4px ${color}` }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function BackupProgressBar({
  progress,
  elapsed,
  dbName,
  encrypted = true,
}: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === progress.stage);
  const isFailed   = progress.stage === "failed";
  const isComplete = progress.stage === "completed";

  // ── Animated percent ─────────────────────────────────────────────────────
  const [displayPct, setDisplayPct] = useState(progress.percent);
  useEffect(() => {
    const diff = progress.percent - displayPct;
    if (Math.abs(diff) < 1) { setDisplayPct(progress.percent); return; }
    const step = diff / 10;
    const t = setInterval(() => {
      setDisplayPct((p) => {
        const next = p + step;
        if (Math.abs(next - progress.percent) < 1) {
          clearInterval(t);
          return progress.percent;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(t);
  }, [progress.percent]);

  // ── Speed estimate ───────────────────────────────────────────────────────
  const estimatedTotal = elapsed && progress.percent > 5
    ? Math.round((elapsed / progress.percent) * 100)
    : null;
  const remaining = estimatedTotal && elapsed
    ? Math.max(0, estimatedTotal - elapsed)
    : null;

  return (
    <div className="space-y-4">

      {/* ── Top info bar ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded text-xs"
        style={{ background: "#1a1d1a", border: "1px solid #252825" }}
      >
        <div className="flex items-center gap-2">
          {isFailed ? (
            <AlertTriangle size={12} style={{ color: "#ff4444" }} />
          ) : isComplete ? (
            <CheckCircle size={12} style={{ color: "#4ade80" }} />
          ) : (
            <PulseDot color="#b8f53a" />
          )}
          <span
            style={{
              color: isFailed
                ? "#ff4444"
                : isComplete
                ? "#4ade80"
                : "#e8edea",
            }}
          >
            {isFailed
              ? "backup failed"
              : isComplete
              ? "backup completed"
              : "backup in progress..."}
          </span>
          {dbName && (
            <span style={{ color: "#4a5450" }}>· {dbName}</span>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 tabular-nums">
          {elapsed !== undefined && (
            <span
              className="flex items-center gap-1"
              style={{ color: "#4a5450" }}
            >
              <Clock size={11} />
              {elapsed}s elapsed
            </span>
          )}
          {remaining !== null && !isComplete && !isFailed && (
            <span style={{ color: "#4a5450" }}>
              ~{remaining}s left
            </span>
          )}
        </div>
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span style={{ color: "#8a9690" }}>
            {STAGES.find((s) => s.key === progress.stage)?.label
              ?? progress.stage}
          </span>
          <span
            className="tabular-nums font-bold"
            style={{
              color: isFailed
                ? "#ff4444"
                : isComplete
                ? "#4ade80"
                : "#b8f53a",
            }}
          >
            {Math.round(displayPct)}%
          </span>
        </div>

        {/* Track */}
        <div
          className="h-2 w-full rounded-full overflow-hidden"
          style={{ background: "#252825" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${displayPct}%`,
              background: isFailed
                ? "#ff4444"
                : isComplete
                ? "#4ade80"
                : "linear-gradient(90deg, #8bbf2a, #b8f53a, #d4f55a)",
              boxShadow: isFailed
                ? "0 0 8px rgba(255,68,68,0.4)"
                : isComplete
                ? "0 0 8px rgba(74,222,128,0.4)"
                : "0 0 10px rgba(184,245,58,0.5)",
              transition: "width 0.4s ease-out",
            }}
          />
        </div>
      </div>

      {/* ── Stage list ───────────────────────────────────────────────────── */}
      <div className="space-y-1">
        {STAGES.filter((s) => s.key !== "failed").map((stage, i) => {
          const status = getStatus(
            stage.key,
            i,
            currentIdx,
            isFailed,
            encrypted
          );
          const isCur = status === "current";

          return (
            <div
              key={stage.key}
              className="flex items-center gap-3 px-3 py-2 rounded
                         transition-all duration-200 text-xs"
              style={{
                background: isCur
                  ? "rgba(184,245,58,0.04)"
                  : "transparent",
                border: isCur
                  ? "1px solid rgba(184,245,58,0.12)"
                  : "1px solid transparent",
              }}
            >
              {/* Stage icon */}
              <span className="flex-shrink-0">
                <StageIcon status={status} icon={stage.icon} />
              </span>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium"
                  style={{
                    color:
                      status === "done"
                        ? "#4ade80"
                        : status === "current"
                        ? "#e8edea"
                        : status === "failed"
                        ? "#ff4444"
                        : status === "skipped"
                        ? "#3d4040"
                        : "#4a5450",
                  }}
                >
                  {stage.label}
                  {status === "skipped" && (
                    <span style={{ color: "#3d4040" }}> — skipped</span>
                  )}
                </p>
                {/* Sub label — only show for current/done/failed */}
                {(status === "current" || status === "done") && (
                  <p style={{ color: "#4a5450", fontSize: 10 }}>
                    {stage.sub}
                  </p>
                )}
              </div>

              {/* Right side indicators */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {status === "current" && (
                  <>
                    <span
                      className="tabular-nums font-bold"
                      style={{ color: "#b8f53a" }}
                    >
                      {Math.round(displayPct)}%
                    </span>
                    <PulseDot color="#b8f53a" />
                  </>
                )}
                {status === "done" && (
                  <span style={{ color: "#4ade80", fontSize: 10 }}>✓</span>
                )}
                {status === "failed" && (
                  <span style={{ color: "#ff4444", fontSize: 10 }}>✗</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Completed banner ─────────────────────────────────────────────── */}
      {isComplete && (
        <div
          className="flex items-center gap-2 px-3 py-3 rounded text-xs"
          style={{
            background: "rgba(74,222,128,0.07)",
            border:     "1px solid rgba(74,222,128,0.2)",
            color:      "#4ade80",
          }}
        >
          <CheckCircle size={13} />
          <div>
            <p className="font-medium">backup completed successfully</p>
            {elapsed && (
              <p style={{ color: "#4a5450", fontSize: 10 }}>
                finished in {elapsed}s
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {isFailed && progress.message && (
        <div
          className="space-y-1 px-3 py-3 rounded text-xs"
          style={{
            background: "rgba(255,68,68,0.07)",
            border:     "1px solid rgba(255,68,68,0.2)",
          }}
        >
          <div
            className="flex items-center gap-2 font-medium"
            style={{ color: "#ff4444" }}
          >
            <XCircle size={13} />
            backup failed
          </div>
          <p style={{ color: "#8a9690" }}>{progress.message}</p>
          <p style={{ color: "#4a5450", fontSize: 10 }}>
            check live logs for full error details
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {!isComplete && !isFailed && (
        <div
          className="flex items-center justify-between text-xs pt-1
                     border-t"
          style={{ borderColor: "#1a1d1a", color: "#3d4040" }}
        >
          <span>do not close this window</span>
          <span>
            stage {Math.min(currentIdx + 1, STAGES.length - 1)} of{" "}
            {STAGES.filter(
              (s) => s.key !== "failed" && (encrypted || s.key !== "encrypting")
            ).length}
          </span>
        </div>
      )}
    </div>
  );
}