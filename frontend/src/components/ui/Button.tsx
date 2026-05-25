import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "acid" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "acid",
  size = "md",
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-mono font-semibold rounded transition-all tracking-wide";

  const variants = {
    acid:   "btn-acid",
    ghost:  "btn-ghost",
    danger: "btn-danger",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-xs px-4 py-2",
    lg: "text-sm px-6 py-3",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      style={{ opacity: loading || disabled ? 0.6 : 1 }}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="w-3 h-3 border border-current border-t-transparent
                       rounded-full animate-spin"
          />
          loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}