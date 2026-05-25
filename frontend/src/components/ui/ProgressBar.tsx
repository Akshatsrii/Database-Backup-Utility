"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  stage?: string;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  percent,
  stage,
  className,
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div
          className="flex justify-between text-xs"
          style={{ color: "#8a9690" }}
        >
          <span>{stage ?? "progress"}</span>
          <span style={{ color: "#b8f53a" }}>{clamped}%</span>
        </div>
      )}

      {/* Track */}
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: "#252825" }}
      >
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background:
              clamped === 100
                ? "#4ade80"
                : "linear-gradient(90deg, #8bbf2a, #b8f53a)",
            boxShadow:
              clamped > 0 ? "0 0 8px rgba(184,245,58,0.4)" : "none",
          }}
        />
      </div>
    </div>
  );
}