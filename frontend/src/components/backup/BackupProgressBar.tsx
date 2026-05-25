"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BackupProgress } from "@/types";

interface Props {
  progress: BackupProgress;
}

const STAGE_ORDER = [
  "connecting",
  "dumping",
  "compressing",
  "encrypting",
  "uploading",
  "completed",
  "failed",
];

const STAGE_LABELS: Record<string, string> = {
  connecting:  "connecting to database...",
  dumping:     "dumping database...",
  compressing: "compressing backup...",
  encrypting:  "encrypting data...",
  uploading:   "uploading to storage...",
  completed:   "completed ✓",
  failed:      "failed ✗",
};

export function BackupProgressBar({ progress }: Props) {
  const currentIdx = STAGE_ORDER.indexOf(progress.stage);

  return (
    <div className="space-y-4">

      {/* Main Progress Bar */}
      <ProgressBar
        percent={progress.percent}
        stage={STAGE_LABELS[progress.stage]}
      />

      {/* Stage Checklist */}
      <div className="space-y-1.5">
        {STAGE_ORDER.filter((s) => s !== "failed").map((stage, i) => {
          const isDone    = i < currentIdx;
          const isCurrent = stage === progress.stage;

          return (
            <div key={stage} className="flex items-center gap-2 text-xs">
              <span
                style={{
                  color: isDone
                    ? "#4ade80"
                    : isCurrent
                    ? "#b8f53a"
                    : "#3d4040",
                  width: 12,
                }}
              >
                {isDone ? "✓" : isCurrent ? "›" : "○"}
              </span>
              <span
                style={{
                  color: isDone
                    ? "#4ade80"
                    : isCurrent
                    ? "#e8edea"
                    : "#3d4040",
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
              {isCurrent && (
                <span
                  className="ml-auto tabular-nums"
                  style={{ color: "#b8f53a" }}
                >
                  {progress.percent}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {progress.stage === "failed" && progress.message && (
        <div
          className="px-3 py-2 rounded text-xs"
          style={{
            color: "#ff4444",
            background: "rgba(255,68,68,0.08)",
            border: "1px solid rgba(255,68,68,0.2)",
          }}
        >
          ✗ {progress.message}
        </div>
      )}
    </div>
  );
}