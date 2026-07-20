"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useRef,
  useId,
  useState,
  useCallback,
  RefObject,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open:          boolean;
  onClose:       () => void;
  title:         string;
  children:      React.ReactNode;
  /** Optional sticky footer rendered below the scrollable body */
  footer?:       React.ReactNode;
  /** Preset size — replaces the raw `width` string */
  size?:         ModalSize;
  /** When false, hides the ✕ button and disables backdrop/Escape close */
  closable?:     boolean;
  /** Ref to an element inside the modal that should receive focus on open */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Additional class on the modal panel */
  className?:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZES: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-lg",
  lg:   "max-w-2xl",
  xl:   "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)]",
};

/** All focusable element selectors */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),' +
  '[tabindex]:not([tabindex="-1"])';

// ─── Focus trap ───────────────────────────────────────────────────────────────

function useFocusTrap(
  panelRef:     RefObject<HTMLElement | null>,
  active:       boolean,
  initialFocus: RefObject<HTMLElement | null> | undefined
) {
  // Move focus in on open
  useEffect(() => {
    if (!active) return;

    const prev = document.activeElement as HTMLElement | null;

    const target =
      initialFocus?.current ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;

    target?.focus();

    return () => { prev?.focus(); };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trap Tab / Shift+Tab inside the panel
  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;

      const first = nodes[0];
      const last  = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, panelRef]);
}

// ─── Body scroll lock ─────────────────────────────────────────────────────────

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

// ─── Entry/exit animation ─────────────────────────────────────────────────────

const ANIMATION_MS = 180;

function useModalAnimation(open: boolean) {
  const [rendered, setRendered] = useState(open);
  const [visible,  setVisible]  = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      // One tick delay so CSS transition fires after mount
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), ANIMATION_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  return { rendered, visible };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size      = "md",
  closable  = true,
  initialFocus,
  className = "",
}: ModalProps) {
  const titleId  = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const { rendered, visible } = useModalAnimation(open);

  useScrollLock(rendered);
  useFocusTrap(panelRef, rendered, initialFocus);

  // Keyboard close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closable && e.key === "Escape") onClose();
    },
    [closable, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closable && e.target === e.currentTarget) onClose();
    },
    [closable, onClose]
  );

  if (!rendered || typeof window === "undefined") return null;

  return createPortal(
    <>
      <style>{STYLES}</style>

      {/* Backdrop */}
      <div
        className="modal-backdrop"
        style={{
          background:    "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          opacity: visible ? 1 : 0,
        }}
        aria-hidden
        onClick={handleBackdropClick}
      />

      {/* Scroll container — click outside panel triggers close */}
      <div
        className="modal-scroll-container"
        role="presentation"
        onClick={handleBackdropClick}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          id={`modal-${titleId}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`terminal-card modal-panel ${SIZES[size]} ${className}`}
          style={{
            maxHeight: size === "full" ? "calc(100vh - 2rem)" : "85vh",
            opacity:    visible ? 1 : 0,
            transform:  visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div
            className="modal-header flex-shrink-0"
            style={{ borderColor: "#334155" }}
          >
            {/* Left: prompt glyph + title */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="font-mono font-bold text-sm select-none flex-shrink-0"
                style={{ color: "#6366f1" }}
                aria-hidden
              >
                $
              </span>
              <h2
                id={titleId}
                className="text-sm font-semibold truncate"
                style={{ color: "#ffffff" }}
              >
                {title}
              </h2>
            </div>

            {/* Right: close */}
            {closable && (
              <button
                onClick={onClose}
                className="modal-close-btn flex-shrink-0"
                style={{ color: "#64748b" }}
                aria-label="Close modal"
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* ── Body ───────────────────────────────────────────────────── */}
          <div className="modal-body flex-1 overflow-y-auto">
            {children}
          </div>

          {/* ── Footer (optional) ───────────────────────────────────────── */}
          {footer && (
            <div
              className="modal-footer flex-shrink-0"
              style={{ borderColor: "#334155" }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    transition: opacity ${ANIMATION_MS}ms ease;
    pointer-events: none;
  }

  .modal-scroll-container {
    position: fixed;
    inset: 0;
    z-index: 51;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow-y: auto;
  }

  .modal-panel {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    transition:
      opacity   ${ANIMATION_MS}ms ease,
      transform ${ANIMATION_MS}ms ease;
    outline: none;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom-width: 1px;
    border-bottom-style: solid;
    gap: 0.5rem;
  }

  .modal-body {
    padding: 1rem 1.25rem;
  }

  .modal-footer {
    padding: 0.875rem 1.25rem;
    border-top-width: 1px;
    border-top-style: solid;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: color 150ms ease, background-color 150ms ease;
    cursor: pointer;
  }

  .modal-close-btn:hover {
    background-color: var(--bg-tertiary, rgba(255,255,255,0.06));
    color: #ffffff !important;
  }

  .modal-close-btn:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  /* Scrollbar styling for the body region */
  .modal-body::-webkit-scrollbar       { width: 4px; }
  .modal-body::-webkit-scrollbar-track { background: transparent; }
  .modal-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
`;