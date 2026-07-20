"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressVariant = "bar" | "segmented" | "stepped" | "circular";
type ProgressSize    = "xs" | "sm" | "md" | "lg";
type ProgressStatus  = "idle" | "running" | "success" | "error" | "warning";

interface ProgressBarProps {
  percent:       number;
  stage?:        string;
  className?:    string;
  showLabel?:    boolean;
  /** Visual layout variant */
  variant?:      ProgressVariant;
  /** Track thickness preset */
  size?:         ProgressSize;
  /** Shimmer animation while in progress */
  animated?:     boolean;
  /** Diagonal stripe texture on the fill */
  striped?:      boolean;
  /** Bouncing fill for unknown duration — ignores percent */
  indeterminate?: boolean;
  /** Semantic state — only overrides color at success/error/warning */
  status?:       ProgressStatus;
  /** Number of divisions for "segmented" variant */
  segments?:     number;
  /** Number of milestone steps for "stepped" variant */
  steps?:        number[];
  /** For circular variant: diameter in px */
  diameter?:     number;
  /** Accessible label for screen readers */
  "aria-label"?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_H: Record<ProgressSize, string> = {
  xs: "h-0.5",
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

const STATUS_FILL: Partial<Record<ProgressStatus, string>> = {
  success: "#10b981",
  error:   "#f87171",
  warning: "#facc15",
};

const DEFAULT_FILL = "linear-gradient(90deg, #8bbf2a, #6366f1)";
const DEFAULT_GLOW = "0 0 8px rgba(99,102,241,0.4)";

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 500): number {
  const [display, setDisplay] = useState(target);
  const prev    = useRef(target);
  const frameId = useRef<number>(0);
  const startTs = useRef<number>(0);

  useEffect(() => {
    const from = prev.current;
    const to   = target;
    if (from === to) return;

    startTs.current = 0;

    const animate = (ts: number) => {
      if (!startTs.current) startTs.current = ts;
      const elapsed  = ts - startTs.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameId.current = requestAnimationFrame(animate);
      else prev.current = to;
    };

    frameId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId.current);
  }, [target, duration]);

  return display;
}

// ─── Fill style helper ────────────────────────────────────────────────────────

function fillStyle(clamped: number, status: ProgressStatus): React.CSSProperties {
  const override = STATUS_FILL[status];
  return {
    background: override ?? DEFAULT_FILL,
    boxShadow:  clamped > 0 && !override ? DEFAULT_GLOW : "none",
  };
}

// ─── Bar variant ──────────────────────────────────────────────────────────────

function BarTrack({
  clamped, size, animated, striped, indeterminate, status,
}: {
  clamped: number; size: ProgressSize; animated: boolean;
  striped: boolean; indeterminate: boolean; status: ProgressStatus;
}) {
  return (
    <div
      className={cn("w-full rounded-full overflow-hidden", TRACK_H[size])}
      style={{ background: "#334155" }}
    >
      <div
        className={cn(
          "h-full rounded-full",
          !indeterminate && "transition-[width] duration-500",
          indeterminate  && "progress-indeterminate",
          animated && !indeterminate && "progress-shimmer",
          striped && "progress-striped",
        )}
        style={{
          width: indeterminate ? "40%" : `${clamped}%`,
          ...fillStyle(clamped, status),
        }}
      />
    </div>
  );
}

// ─── Segmented variant ────────────────────────────────────────────────────────

function SegmentedTrack({
  clamped, segments, size, status,
}: {
  clamped: number; segments: number; size: ProgressSize; status: ProgressStatus;
}) {
  const filled = Math.round((clamped / 100) * segments);
  const fs = fillStyle(clamped, status);

  return (
    <div className={cn("flex gap-1 w-full", TRACK_H[size])}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-300"
          style={{
            background:  i < filled ? (fs.background as string) : "#334155",
            boxShadow:   i < filled && i === filled - 1 ? fs.boxShadow as string : "none",
            transitionDelay: `${i * 20}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Stepped variant ──────────────────────────────────────────────────────────

function SteppedTrack({
  clamped, steps, size, status,
}: {
  clamped: number; steps: number[]; size: ProgressSize; status: ProgressStatus;
}) {
  const fs = fillStyle(clamped, status);

  return (
    <div className="relative">
      {/* Base bar */}
      <div
        className={cn("w-full rounded-full overflow-hidden", TRACK_H[size])}
        style={{ background: "#334155" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${clamped}%`, ...fs }}
        />
      </div>

      {/* Milestone ticks */}
      {steps.map((step) => {
        const reached = clamped >= step;
        return (
          <div
            key={step}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${step}%` }}
          >
            <div
              className="w-2 h-2 rounded-full border transition-colors duration-300"
              style={{
                background:   reached ? (STATUS_FILL[status] ?? "#6366f1") : "#334155",
                borderColor:  reached ? (STATUS_FILL[status] ?? "#6366f1") : "#64748b",
              }}
            />
            <span
              className="mt-1.5 text-[9px] font-mono"
              style={{ color: reached ? "#6366f1" : "#64748b" }}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Circular variant ─────────────────────────────────────────────────────────

function CircularTrack({
  clamped, diameter, status, indeterminate,
}: {
  clamped: number; diameter: number; status: ProgressStatus; indeterminate: boolean;
}) {
  const stroke = diameter * 0.08;
  const r      = (diameter - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = indeterminate ? circ * 0.3 : (clamped / 100) * circ;
  const gap    = circ - dash;

  const override = STATUS_FILL[status];
  const fillColor = override ?? "#6366f1";

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      className={indeterminate ? "progress-circular-spin" : ""}
      role="img"
      aria-hidden
    >
      {/* Track */}
      <circle
        cx={diameter / 2} cy={diameter / 2} r={r}
        fill="none"
        stroke="#334155"
        strokeWidth={stroke}
      />
      {/* Fill */}
      <circle
        cx={diameter / 2} cy={diameter / 2} r={r}
        fill="none"
        stroke={fillColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        style={{
          transition: indeterminate ? "none" : "stroke-dasharray 500ms ease",
          filter: clamped > 0 && !override
            ? "drop-shadow(0 0 4px rgba(99,102,241,0.5))"
            : "none",
        }}
      />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProgressBar({
  percent,
  stage,
  className,
  showLabel      = true,
  variant        = "bar",
  size           = "md",
  animated       = false,
  striped        = false,
  indeterminate  = false,
  status         = "idle",
  segments       = 10,
  steps          = [],
  diameter       = 64,
  "aria-label":  ariaLabel,
}: ProgressBarProps) {
  const clamped  = Math.min(100, Math.max(0, percent));
  const display  = useCountUp(clamped);
  const isCirc   = variant === "circular";

  return (
    <>
      <style>{STYLES}</style>

      <div
        className={cn(
          isCirc ? "inline-flex flex-col items-center gap-2" : "space-y-1.5",
          className
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? stage ?? "progress"}
        aria-busy={indeterminate || (clamped > 0 && clamped < 100)}
      >
        {/* ── Circular layout ─────────────────────────────────────────── */}
        {isCirc && (
          <div className="relative inline-flex items-center justify-center">
            <CircularTrack
              clamped={clamped}
              diameter={diameter}
              status={status}
              indeterminate={indeterminate}
            />
            {showLabel && !indeterminate && (
              <span
                className="absolute font-mono text-xs font-semibold"
                style={{ color: STATUS_FILL[status] ?? "#6366f1" }}
              >
                {display}%
              </span>
            )}
          </div>
        )}

        {/* ── Circular stage label ─────────────────────────────────────── */}
        {isCirc && showLabel && stage && (
          <span className="text-xs font-mono" style={{ color: "#cbd5e1" }}>
            {stage}
          </span>
        )}

        {/* ── Bar layout label ─────────────────────────────────────────── */}
        {!isCirc && showLabel && (
          <div className="flex justify-between text-xs font-mono" style={{ color: "#cbd5e1" }}>
            <span>{stage ?? "progress"}</span>
            {!indeterminate && (
              <span style={{ color: STATUS_FILL[status] ?? "#6366f1" }}>
                {display}%
              </span>
            )}
          </div>
        )}

        {/* ── Track ────────────────────────────────────────────────────── */}
        {!isCirc && variant === "bar" && (
          <BarTrack
            clamped={clamped} size={size} animated={animated}
            striped={striped} indeterminate={indeterminate} status={status}
          />
        )}

        {!isCirc && variant === "segmented" && (
          <SegmentedTrack
            clamped={clamped} segments={segments} size={size} status={status}
          />
        )}

        {!isCirc && variant === "stepped" && (
          <SteppedTrack
            clamped={clamped} steps={steps} size={size} status={status}
          />
        )}
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes progress-indeterminate {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
  @keyframes progress-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes progress-stripe-scroll {
    0%   { background-position: 0 0; }
    100% { background-position: 20px 0; }
  }
  @keyframes progress-circular-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .progress-indeterminate {
    animation: progress-indeterminate 1.4s ease-in-out infinite;
  }

  .progress-shimmer {
    background-size: 200% auto !important;
    background-image: linear-gradient(
      90deg,
      #8bbf2a 0%,
      #6366f1 40%,
      #d4ff6a 50%,
      #6366f1 60%,
      #8bbf2a 100%
    ) !important;
    animation: progress-shimmer 1.8s linear infinite;
  }

  .progress-striped {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 6px,
      rgba(0,0,0,0.15) 6px,
      rgba(0,0,0,0.15) 12px
    ) !important;
    background-size: 20px 20px;
    animation: progress-stripe-scroll 0.6s linear infinite;
  }

  .progress-circular-spin {
    animation: progress-circular-spin 1s linear infinite;
    transform-origin: center;
  }
`;