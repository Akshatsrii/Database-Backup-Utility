import { cn } from "@/lib/utils";
import React, { ElementType, ComponentPropsWithoutRef } from "react";

// ─── Polymorphic helper ────────────────────────────────────────────────────────

type AsProp<E extends ElementType> = { as?: E };

type PolymorphicProps<E extends ElementType, Own = object> = Own &
  AsProp<E> &
  Omit<ComponentPropsWithoutRef<E>, keyof Own | "as">;

// ─── Card ─────────────────────────────────────────────────────────────────────

type CardVariant = "default" | "raised" | "inset" | "ghost";

type CardOwnProps = {
  children:   React.ReactNode;
  className?: string;
  style?:     React.CSSProperties;
  variant?:   CardVariant;
  /** Dims slightly and lifts on hover — purely visual */
  hoverable?: boolean;
  /** Makes the card keyboard-focusable and cursor-pointer */
  clickable?: boolean;
};

type CardProps<E extends ElementType = "div"> = PolymorphicProps<E, CardOwnProps>;

const cardVariants: Record<CardVariant, string> = {
  default: "terminal-card",
  raised:  "terminal-card shadow-lg translate-y-0 hover:-translate-y-px",
  inset:   "terminal-card shadow-inner",
  ghost:   "border border-dashed bg-transparent",
};

export function Card<E extends ElementType = "div">({
  as,
  variant   = "default",
  hoverable = false,
  clickable = false,
  children,
  className,
  style,
  ...props
}: CardProps<E>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "p-5",
        cardVariants[variant],
        hoverable && "transition-all duration-200 hover:brightness-110",
        clickable && [
          "cursor-pointer",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2",
          "active:scale-[0.99]",
        ],
        className
      )}
      style={style}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                (e.currentTarget as HTMLElement).click();
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </Tag>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

type CardHeaderOwnProps = {
  children:  React.ReactNode;
  className?: string;
  /** Optional decorative node rendered to the far left (icon, avatar, dot…) */
  icon?:      React.ReactNode;
  /** Optional node pinned to the far right (overrides children slot split) */
  action?:    React.ReactNode;
};

type CardHeaderProps<E extends ElementType = "div"> = PolymorphicProps<E, CardHeaderOwnProps>;

export function CardHeader<E extends ElementType = "div">({
  as,
  icon,
  action,
  children,
  className,
  ...props
}: CardHeaderProps<E>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "flex items-center gap-3 mb-4 pb-3 border-b",
        className
      )}
      style={{ borderColor: "#334155" }}
      {...props}
    >
      {icon && (
        <span className="shrink-0 flex items-center opacity-60" aria-hidden>
          {icon}
        </span>
      )}

      {/* Main content fills space */}
      <div className="flex-1 flex items-center justify-between min-w-0">
        {children}
      </div>

      {action && (
        <div className="shrink-0 flex items-center" aria-label="card action">
          {action}
        </div>
      )}
    </Tag>
  );
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

type CardTitleOwnProps = {
  children:   React.ReactNode;
  className?: string;
  /** Render a small supplementary line below the title */
  subtitle?:  React.ReactNode;
};

type CardTitleProps<E extends ElementType = "h3"> = PolymorphicProps<E, CardTitleOwnProps>;

export function CardTitle<E extends ElementType = "h3">({
  as,
  subtitle,
  children,
  className,
  ...props
}: CardTitleProps<E>) {
  const Tag = (as ?? "h3") as ElementType;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <Tag
        className={cn(
          "font-mono font-semibold text-sm tracking-wide truncate",
          className
        )}
        {...props}
      >
        {children}
      </Tag>
      {subtitle && (
        <p
          className="font-mono text-xs truncate"
          style={{ color: "#64748b" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── CardBody ─────────────────────────────────────────────────────────────────

type CardBodyOwnProps = {
  children:   React.ReactNode;
  className?: string;
  /** Remove default top padding (useful when CardHeader provides spacing) */
  flush?:     boolean;
};

type CardBodyProps<E extends ElementType = "div"> = PolymorphicProps<E, CardBodyOwnProps>;

export function CardBody<E extends ElementType = "div">({
  as,
  flush = false,
  children,
  className,
  ...props
}: CardBodyProps<E>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(!flush && "pt-1", "font-mono text-sm leading-relaxed", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

type CardFooterOwnProps = {
  children:   React.ReactNode;
  className?: string;
};

type CardFooterProps<E extends ElementType = "div"> = PolymorphicProps<E, CardFooterOwnProps>;

export function CardFooter<E extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: CardFooterProps<E>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      className={cn(
        "flex items-center justify-between gap-3",
        "mt-4 pt-3 border-t",
        className
      )}
      style={{ borderColor: "#334155" }}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ─── CardBadge ────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type CardBadgeOwnProps = {
  children:   React.ReactNode;
  className?: string;
  variant?:   BadgeVariant;
  /** Renders a pulsing dot before the label */
  pulse?:     boolean;
};

const badgeColors: Record<BadgeVariant, React.CSSProperties> = {
  default: { color: "#64748b", borderColor: "#334155" },
  success: { color: "#10b981", borderColor: "#14532d" },
  warning: { color: "#facc15", borderColor: "#713f12" },
  danger:  { color: "#f87171", borderColor: "#7f1d1d" },
  info:    { color: "#60a5fa", borderColor: "#1e3a5f" },
};

export function CardBadge({
  variant  = "default",
  pulse    = false,
  children,
  className,
}: CardBadgeOwnProps) {
  const colors = badgeColors[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "font-mono text-[10px] font-semibold uppercase tracking-widest",
        "px-2 py-0.5 rounded border",
        className
      )}
      style={colors}
    >
      {pulse && (
        <span
          className="relative flex w-1.5 h-1.5 shrink-0"
          aria-hidden
        >
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: colors.color as string }}
          />
          <span
            className="relative rounded-full w-full h-full"
            style={{ backgroundColor: colors.color as string }}
          />
        </span>
      )}
      {children}
    </span>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

interface SectionLabelProps {
  children:    React.ReactNode;
  /** Renders a small accent dot before the label */
  dot?:        boolean;
  className?:  string;
}

export function SectionLabel({ children, dot = false, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs tracking-widest uppercase font-mono",
        className
      )}
      style={{ color: "#64748b" }}
    >
      {dot && (
        <span
          className="w-1 h-1 rounded-full shrink-0"
          style={{ backgroundColor: "#64748b" }}
          aria-hidden
        />
      )}
      {children}
    </p>
  );
}