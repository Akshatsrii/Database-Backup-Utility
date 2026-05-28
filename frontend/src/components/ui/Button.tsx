import { cn } from "@/lib/utils";
import React, { useRef, useCallback, ElementType, ComponentPropsWithoutRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = "acid" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

type ButtonOwnProps<E extends ElementType = "button"> = {
  as?:       E;
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  pill?:     boolean;
  fullWidth?: boolean;
  iconLeft?:  React.ReactNode;
  iconRight?: React.ReactNode;
  children:  React.ReactNode;
};

type ButtonProps<E extends ElementType = "button"> = ButtonOwnProps<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

// ─── Ripple ───────────────────────────────────────────────────────────────────

function createRipple(
  e: React.MouseEvent<HTMLElement>,
  el: HTMLElement
): void {
  const existing = el.querySelector<HTMLSpanElement>(".btn-ripple");
  existing?.remove();

  const rect   = el.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height) * 2;
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement("span");
  ripple.className = "btn-ripple";
  Object.assign(ripple.style, {
    position:     "absolute",
    width:        `${size}px`,
    height:       `${size}px`,
    left:         `${x}px`,
    top:          `${y}px`,
    borderRadius: "50%",
    background:   "currentColor",
    opacity:      "0.15",
    pointerEvents:"none",
    transform:    "scale(0)",
    animation:    "btn-ripple-anim 500ms ease-out forwards",
  });

  el.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button<E extends ElementType = "button">({
  as,
  variant   = "acid",
  size      = "md",
  loading   = false,
  pill      = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  onClick,
  ...props
}: ButtonProps<E>) {
  const Tag = (as ?? "button") as ElementType;
  const ref = useRef<HTMLElement>(null);

  const isDisabled = disabled || loading;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isDisabled && ref.current) createRipple(e, ref.current);
      if (!isDisabled) (onClick as React.MouseEventHandler<HTMLElement>)?.(e);
    },
    [isDisabled, onClick]
  );

  // ── Style maps ──────────────────────────────────────────────────────────────

  const base = cn(
    // layout
    "relative overflow-hidden",
    "inline-flex items-center justify-center gap-2",
    // typography
    "font-mono font-semibold tracking-wide",
    // interaction
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current",
    "select-none",
    // shape
    pill ? "rounded-full" : "rounded",
    // width
    fullWidth && "w-full",
  );

  const variants: Record<Variant, string> = {
    acid:   "btn-acid",
    ghost:  "btn-ghost",
    danger: "btn-danger",
  };

  const sizes: Record<Size, string> = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-xs px-4 py-2   gap-2",
    lg: "text-sm px-6 py-3   gap-2.5",
  };

  const iconSizes: Record<Size, string> = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Keyframe injected once via a style tag */}
      <style>{`
        @keyframes btn-ripple-anim {
          to { transform: scale(1); opacity: 0; }
        }
        @keyframes btn-spinner {
          to { transform: rotate(360deg); }
        }
        @keyframes btn-loading-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      <Tag
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={Tag === "button" ? isDisabled : undefined}
        aria-disabled={isDisabled}
        aria-busy={loading}
        onClick={handleClick}
        style={{
          opacity:        isDisabled ? 0.55 : 1,
          cursor:         isDisabled ? "not-allowed" : "pointer",
          pointerEvents:  isDisabled ? "none" : undefined,
        }}
        {...props}
      >
        {loading ? (
          <>
            {/* Spinner */}
            <span
              className={cn("shrink-0 rounded-full border border-current border-t-transparent", iconSizes[size])}
              style={{ animation: "btn-spinner 650ms linear infinite" }}
              aria-hidden
            />
            {/* Pulsing label */}
            <span style={{ animation: "btn-loading-pulse 1.2s ease-in-out infinite" }}>
              loading…
            </span>
          </>
        ) : (
          <>
            {iconLeft  && <span className={cn("shrink-0 flex items-center", iconSizes[size])} aria-hidden>{iconLeft}</span>}
            {children}
            {iconRight && <span className={cn("shrink-0 flex items-center", iconSizes[size])} aria-hidden>{iconRight}</span>}
          </>
        )}
      </Tag>
    </>
  );
}