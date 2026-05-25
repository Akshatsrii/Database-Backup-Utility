import { cn, statusColors } from "@/lib/utils";
import type { BackupStatus } from "@/types";

interface BadgeProps {
  status: BackupStatus;
  className?: string;
}

const LABELS: Record<BackupStatus, string> = {
  pending:   "● pending",
  running:   "◌ running",
  completed: "✓ completed",
  failed:    "✗ failed",
};

export function StatusBadge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium tracking-wide",
        statusColors[status],
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}

interface TextBadgeProps {
  children: React.ReactNode;
  color?: "acid" | "blue" | "yellow" | "red" | "green" | "muted";
  className?: string;
}

const textColorMap = {
  acid:   "text-acid   bg-acid/10   border-acid/20",
  blue:   "text-terminal-blue   bg-terminal-blue/10   border-terminal-blue/20",
  yellow: "text-terminal-yellow bg-terminal-yellow/10 border-terminal-yellow/20",
  red:    "text-terminal-red    bg-terminal-red/10    border-terminal-red/20",
  green:  "text-terminal-green  bg-terminal-green/10  border-terminal-green/20",
  muted:  "text-text-secondary  bg-bg-tertiary        border-bg-border",
};

export function TextBadge({ children, color = "muted", className }: TextBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium",
        textColorMap[color],
        className
      )}
    >
      {children}
    </span>
  );
}