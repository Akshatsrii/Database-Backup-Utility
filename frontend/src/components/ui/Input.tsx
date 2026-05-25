import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

export function Input({
  label,
  error,
  prefix,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="text-xs tracking-wide"
          style={{ color: "#4a5450" }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm"
            style={{ color: "#b8f53a" }}
          >
            {prefix}
          </span>
        )}
        <input
          className={cn(
            "terminal-input",
            prefix && "pl-9",
            error && "border-red-500 focus:border-red-500",
            className
          )}
          {...props}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: "#ff4444" }}>
          ✗ {error}
        </p>
      )}
    </div>
  );
}