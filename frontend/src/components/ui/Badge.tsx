import { cn, statusColors } from "@/lib/utils";
import type { BackupStatus } from "@/types";

/* ── keyframes (injected once at module level via a style tag in the host) ─
   If you have a global CSS file, move these there instead.               ── */
const BADGE_CSS = `
@keyframes badge-spin   { to { transform: rotate(360deg); } }
@keytml badge-pulse  { 0%,100% { opacity:1 } 50% { opacity:.4 } }
@keyframes badge-pulse  { 0%,100% { opacity:1 } 50% { opacity:.4 } }
`;

if (typeof document !== "undefined" && !document.getElementById("badge-css")) {
  const s = document.createElement("style");
  s.id = "badge-css";
  s.textContent = BADGE_CSS;
  document.head.appendChild(s);
}

// ─── Status Badge ──────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status:    BackupStatus;
  className?: string;
  /** "sm" (default) | "md" */
  size?:     "sm" | "md";
}

const LABELS: Record<BackupStatus, string> = {
  pending:   "pending",
  running:   "running",
  completed: "completed",
  failed:    "failed",
};

/* Per-status leading icon */
function StatusIcon({ status }: { status: BackupStatus }) {
  if (status === "running") {
    return (
      <span
        aria-hidden
        style={{
          display:        "inline-block",
          width:          8,
          height:         8,
          borderRadius:   "50%",
          border:         "1.5px solid currentColor",
          borderTopColor: "transparent",
          animation:      "badge-spin 0.7s linear infinite",
          flexShrink:     0,
        }}
      />
    );
  }
  if (status === "pending") {
    return (
      <span
        aria-hidden
        style={{
          display:    "inline-block",
          width:      6,
          height:     6,
          borderRadius: "50%",
          background: "currentColor",
          animation:  "badge-pulse 1.6s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
    );
  }
  const sym: Record<BackupStatus, string> = {
    pending:   "",   // handled above
    running:   "",   // handled above
    completed: "✓",
    failed:    "✗",
  };
  return <span aria-hidden style={{ flexShrink: 0, lineHeight: 1 }}>{sym[status]}</span>;
}

export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const pad = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-medium tracking-wide",
        "text-xs",
        pad,
        statusColors[status],
        className,
      )}
      role="status"
      aria-label={`status: ${LABELS[status]}`}
    >
      <StatusIcon status={status} />
      {LABELS[status]}
    </span>
  );
}

// ─── Text Badge ────────────────────────────────────────────────────────────

interface TextBadgeProps {
  children:   React.ReactNode;
  color?:     "acid" | "blue" | "yellow" | "red" | "green" | "muted";
  className?: string;
  /** "sm" (default) | "md" */
  size?:      "sm" | "md";
  /** renders an × dismiss button */
  onDismiss?: () => void;
  /** small dot prefix */
  dot?:       boolean;
}

const textColorMap = {
  acid:   "text-acid            bg-acid/10            border-acid/20",
  blue:   "text-terminal-blue   bg-terminal-blue/10   border-terminal-blue/20",
  yellow: "text-terminal-yellow bg-terminal-yellow/10 border-terminal-yellow/20",
  red:    "text-terminal-red    bg-terminal-red/10    border-terminal-red/20",
  green:  "text-terminal-green  bg-terminal-green/10  border-terminal-green/20",
  muted:  "text-text-secondary  bg-bg-tertiary        border-bg-border",
};

export function TextBadge({
  children,
  color     = "muted",
  className,
  size      = "sm",
  onDismiss,
  dot,
}: TextBadgeProps) {
  const pad = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border font-medium text-xs",
        pad,
        textColorMap[color],
        className,
      )}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width:        5,
            height:       5,
            borderRadius: "50%",
            background:   "currentColor",
            flexShrink:   0,
          }}
        />
      )}

      {children}

      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="dismiss"
          style={{
            marginLeft:  2,
            lineHeight:  1,
            cursor:      "pointer",
            opacity:     0.6,
            flexShrink:  0,
            background:  "none",
            border:      "none",
            padding:     0,
            color:       "inherit",
            fontSize:    10,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
        >
          ×
        </button>
      )}
    </span>
  );
}