import { cn } from "@/lib/utils";
import React, { useId, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Labels & help
  label?:    string;
  hint?:     string;
  error?:    string;
  success?:  string;

  // Adornments
  prefix?:    string;                // text prefix  e.g. "$"
  suffix?:    string;                // text suffix  e.g. "USD"
  iconLeft?:  React.ReactNode;       // icon node left of input
  iconRight?: React.ReactNode;       // icon node right of input

  // Behaviours
  loading?:   boolean;               // shows spinner on the right
  clearable?: boolean;               // shows ✕ when value is present

  // Layout
  fullWidth?: boolean;
}

interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "prefix"> {
  multiline:  true;
  label?:     string;
  hint?:      string;
  error?:     string;
  success?:   string;
  prefix?:    string;
  suffix?:    string;
  iconLeft?:  React.ReactNode;
  loading?:   boolean;
  fullWidth?: boolean;
  clearable?: never; // not applicable to textarea
}

type Props = InputProps | TextareaProps;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Small spinner matching the terminal aesthetic */
function Spinner() {
  return (
    <span
      className="w-3 h-3 rounded-full border border-current border-t-transparent shrink-0"
      style={{
        animation: "input-spin 650ms linear infinite",
        color: "#64748b",
      }}
      aria-hidden
    />
  );
}

/** Invisible ✕ clear button */
function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full
                 opacity-50 hover:opacity-100 transition-opacity focus:outline-none
                 focus-visible:ring-1 focus-visible:ring-current"
      aria-label="Clear input"
      tabIndex={0}
    >
      {/* ✕ drawn as SVG so it has no font dependency */}
      <svg viewBox="0 0 10 10" className="w-full h-full" stroke="currentColor" strokeWidth={1.8}>
        <line x1="2" y1="2" x2="8" y2="8" />
        <line x1="8" y1="2" x2="2" y2="8" />
      </svg>
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Input(props: Props) {
  const generatedId = useId();

  if ("multiline" in props && props.multiline) {
    // ── Textarea branch ──────────────────────────────────────────────────────
    const {
      label, hint, error, success,
      prefix, suffix, iconLeft,
      loading, fullWidth,
      className, id, disabled,
      ...rest
    } = props;

    const inputId   = id ?? generatedId;
    const messageId = `${inputId}-msg`;
    const status    = error ? "error" : success ? "success" : "idle";

    return (
      <>
        <style>{KEYFRAMES}</style>
        <div className={cn("space-y-1.5", fullWidth && "w-full")}>
          {label && (
            <Label htmlFor={inputId} required={rest.required}>
              {label}
            </Label>
          )}

          <div className="relative">
            <LeftAdornment prefix={prefix} icon={iconLeft} />

            <textarea
              id={inputId}
              disabled={disabled || loading}
              aria-invalid={status === "error"}
              aria-describedby={hint || error || success ? messageId : undefined}
              className={cn(
                "terminal-input w-full resize-y min-h-[96px]",
                prefix && "pl-9",
                suffix && "pr-9",
                status === "error"   && "border-red-500 focus:border-red-500",
                (disabled || loading) && "opacity-55 cursor-not-allowed",
                className,
              )}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />

            <RightAdornment suffix={suffix} loading={loading} />
          </div>

          <StatusLine id={messageId} error={error} success={success} hint={hint} />
        </div>
      </>
    );
  }

  // ── Input branch ────────────────────────────────────────────────────────────
  const {
    label, hint, error, success,
    prefix, suffix, iconLeft, iconRight,
    loading, clearable, fullWidth,
    className, id, disabled,
    value, defaultValue, onChange,
    ...rest
  } = props as InputProps;

  const inputId   = id ?? generatedId;
  const messageId = `${inputId}-msg`;
  const inputRef  = useRef<HTMLInputElement>(null);
  const status    = error ? "error" : success ? "success" : "idle";

  // Controlled-or-uncontrolled value tracking for clearable
  const isControlled = value !== undefined;
  const [internalVal, setInternalVal] = useState(defaultValue ?? "");
  const currentVal = isControlled ? value : internalVal;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalVal(e.target.value);
      onChange?.(e);
    },
    [isControlled, onChange]
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalVal("");
    // Fire a synthetic change event so form libs pick it up
    const nativeInput = inputRef.current;
    if (nativeInput) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, "value"
      )?.set;
      nativeInputValueSetter?.call(nativeInput, "");
      nativeInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    inputRef.current?.focus();
  }, [isControlled]);

  const showClear =
    clearable &&
    !loading &&
    !disabled &&
    typeof currentVal === "string" &&
    currentVal.length > 0;

  // Dynamic right padding: suffix | icon | loading | clear (additive)
  const rightSlots =
    (suffix    ? 1 : 0) +
    (iconRight ? 1 : 0) +
    (loading   ? 1 : 0) +
    (showClear ? 1 : 0);

  const rightPadding =
    rightSlots === 0 ? "" :
    rightSlots === 1 ? "pr-9" :
    rightSlots === 2 ? "pr-16" : "pr-24";

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className={cn("space-y-1.5", fullWidth && "w-full")}>
        {label && (
          <Label htmlFor={inputId} required={rest.required}>
            {label}
          </Label>
        )}

        <div className="relative">
          <LeftAdornment prefix={prefix} icon={iconLeft} />

          <input
            ref={inputRef}
            id={inputId}
            disabled={disabled || loading}
            aria-invalid={status === "error"}
            aria-describedby={hint || error || success ? messageId : undefined}
            value={isControlled ? value : internalVal}
            onChange={handleChange}
            className={cn(
              "terminal-input",
              prefix && "pl-9",
              rightPadding,
              status === "error"    && "border-red-500 focus:border-red-500",
              status === "success"  && "border-green-600 focus:border-green-600",
              (disabled || loading) && "opacity-55 cursor-not-allowed",
              className,
            )}
            {...rest}
          />

          {/* Right adornment row */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showClear  && <ClearButton onClick={handleClear} />}
            {loading    && <Spinner />}
            {iconRight  && !loading && (
              <span className="w-4 h-4 shrink-0 flex items-center opacity-60" aria-hidden>
                {iconRight}
              </span>
            )}
            {suffix && !loading && (
              <span
                className="font-mono font-bold text-sm shrink-0"
                style={{ color: "#6366f1" }}
                aria-hidden
              >
                {suffix}
              </span>
            )}
          </div>
        </div>

        <StatusLine id={messageId} error={error} success={success} hint={hint} />
      </div>
    </>
  );
}

// ─── Sub-pieces ───────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs tracking-wide font-mono flex items-center gap-1"
      style={{ color: "#64748b" }}
    >
      {children}
      {required && (
        <span style={{ color: "#6366f1" }} aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

function LeftAdornment({
  prefix,
  icon,
}: {
  prefix?: string;
  icon?: React.ReactNode;
}) {
  if (!prefix && !icon) return null;

  return (
    <span
      className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
      aria-hidden
    >
      {icon && (
        <span className="w-4 h-4 shrink-0 flex items-center opacity-60">
          {icon}
        </span>
      )}
      {prefix && (
        <span
          className="font-mono font-bold text-sm shrink-0"
          style={{ color: "#6366f1" }}
        >
          {prefix}
        </span>
      )}
    </span>
  );
}

function RightAdornment({
  suffix,
  loading,
}: {
  suffix?: string;
  loading?: boolean;
}) {
  if (!suffix && !loading) return null;

  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
      {loading && <Spinner />}
      {suffix && !loading && (
        <span
          className="font-mono font-bold text-sm"
          style={{ color: "#6366f1" }}
          aria-hidden
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function StatusLine({
  id,
  error,
  success,
  hint,
}: {
  id:       string;
  error?:   string;
  success?: string;
  hint?:    string;
}) {
  if (!error && !success && !hint) return null;

  const text  = error ?? success ?? hint;
  const icon  = error ? "✗" : success ? "✓" : "·";
  const color = error ? "#ff4444" : success ? "#10b981" : "#64748b";

  return (
    <p
      id={id}
      className="text-xs font-mono flex items-center gap-1"
      style={{ color }}
      role={error ? "alert" : undefined}
      aria-live={error ? "polite" : undefined}
    >
      <span aria-hidden>{icon}</span>
      {text}
    </p>
  );
}

// ─── Keyframes (injected once) ─────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes input-spin {
    to { transform: rotate(360deg); }
  }
`;