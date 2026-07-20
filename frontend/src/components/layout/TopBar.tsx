"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Terminal, Search, ChevronRight, Check, AlertTriangle, X, Info, Database, Layers, Command } from "lucide-react";

/* ── types ───────────────────────────────────────────────── */

type NotifType = "ok" | "warn" | "err" | "info";

interface Notification {
  id: string;
  type: NotifType;
  msg: string;
  time: string;
}

interface StatusPill {
  label: string;
  value: string;
  status: "ok" | "warn" | "err";
}

interface CmdItem {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  group: "navigate" | "actions";
  path?: string;
}

interface TopBarProps {
  notifications?: Notification[];
  onBellClick?: () => void;
  onNavigate?: (path: string) => void;
}

/* ── route config ────────────────────────────────────────── */

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":           "dashboard",
  "/dashboard/backups":   "backup_history",
  "/dashboard/restore":   "restore_ops",
  "/dashboard/scheduler": "scheduler",
  "/dashboard/logs":      "live_logs",
  "/dashboard/settings":  "settings",
};

const NAV_ITEMS: CmdItem[] = [
  { icon: <Layers size={12} />,   label: "dashboard",      shortcut: "G D", group: "navigate", path: "/dashboard" },
  { icon: <Database size={12} />, label: "backup_history", shortcut: "G B", group: "navigate", path: "/dashboard/backups" },
  { icon: <ChevronRight size={12} />, label: "restore_ops", shortcut: "G R", group: "navigate", path: "/dashboard/restore" },
  { icon: <Terminal size={12} />, label: "scheduler",      shortcut: "G S", group: "navigate", path: "/dashboard/scheduler" },
  { icon: <Terminal size={12} />, label: "live_logs",      shortcut: "G L", group: "navigate", path: "/dashboard/logs" },
  { icon: <Command size={12} />,  label: "settings",       shortcut: "G .", group: "navigate", path: "/dashboard/settings" },
];

const ACTION_ITEMS: CmdItem[] = [
  { icon: <Check size={12} />,    label: "trigger backup now",    group: "actions" },
  { icon: <X size={12} />,        label: "abort running job",     group: "actions" },
  { icon: <Database size={12} />, label: "purge old snapshots",   group: "actions" },
  { icon: <Search size={12} />,   label: "export job log as csv", group: "actions" },
  { icon: <Terminal size={12} />, label: "reload agent daemon",   group: "actions" },
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "ok",   msg: "backup job #1094 completed · 4.2 GB · 0 errors", time: "2 min ago" },
  { id: "2", type: "warn", msg: "storage threshold at 68% — consider pruning snapshots",  time: "17 min ago" },
  { id: "3", type: "err",  msg: "job #1093 failed on /mnt/vol2 · connection reset",        time: "1 hr ago" },
  { id: "4", type: "info", msg: "scheduler updated: daily at 02:00 · next run in 8 h",    time: "3 hr ago" },
];

/* ── helpers ─────────────────────────────────────────────── */

function resolveTitle(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  const match = Object.keys(PAGE_TITLES)
    .filter((k) => k !== "/dashboard" && path.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : "dashboard";
}

function buildSegments(path: string): { label: string; full: string }[] {
  const parts = path.replace(/^\//, "").split("/");
  return parts.map((part, i) => ({
    label: part,
    full:  "/" + parts.slice(0, i + 1).join("/"),
  }));
}

function useStorageJitter(base = 68, range = 8, interval = 4000) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal(Math.floor(base + Math.random() * range)), interval);
    return () => clearInterval(id);
  }, [base, range, interval]);
  return val;
}

function useQueueJitter(max = 6, interval = 4000) {
  const [val, setVal] = useState(3);
  useEffect(() => {
    const id = setInterval(() => setVal(Math.floor(Math.random() * max)), interval);
    return () => clearInterval(id);
  }, [max, interval]);
  return val;
}

function useClock() {
  const [time, setTime] = useState({ time: "", date: "" });
  useEffect(() => {
    const fmt = () => ({
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
        .replace(" ", "-").toUpperCase(),
    });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── sub-components ──────────────────────────────────────── */

const DOT_COLORS = { ok: "#6366f1", warn: "#f0a033", err: "#ff4d4d" } as const;

function PulseDot({ status }: { status: "ok" | "warn" | "err" }) {
  return (
    <span
      style={{
        display:     "inline-block",
        width:        5,
        height:       5,
        borderRadius: "50%",
        flexShrink:   0,
        background:   DOT_COLORS[status],
        animation:    status === "err"
          ? "pulse-err 0.8s ease-in-out infinite"
          : status === "warn"
          ? "pulse-warn 1.5s ease-in-out infinite"
          : "pulse-ok 2s ease-in-out infinite",
      }}
    />
  );
}

function StatusPillEl({ label, value, status }: StatusPill) {
  return (
    <div
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:          5,
        fontSize:     10,
        fontFamily:   inherit",
        color:        "#cbd5e1",
        padding:      "3px 8px",
        borderRadius: 3,
        border:       "1px solid #1e293b",
        background:   "rgba(255,255,255,0.02)",
        letterSpacing: "0.04em",
        cursor:       "default",
        whiteSpace:   "nowrap",
      }}
    >
      <PulseDot status={status} />
      <span>{label}</span>
      <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const NOTIF_ICON: Record<NotifType, React.ReactNode> = {
  ok:   <Check   size={11} />,
  warn: <AlertTriangle size={11} />,
  err:  <X       size={11} />,
  info: <Info    size={11} />,
};

const NOTIF_COLORS: Record<NotifType, { bg: string; color: string }> = {
  ok:   { bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
  warn: { bg: "rgba(240,160,51,0.12)", color: "#f0a033" },
  err:  { bg: "rgba(255,77,77,0.12)",  color: "#ff4d4d" },
  info: { bg: "rgba(61,232,196,0.10)", color: "#3de8c4" },
};

function NotifItem({ notif }: { notif: Notification }) {
  const c = NOTIF_COLORS[notif.type];
  return (
    <li
      style={{
        display:      "flex",
        gap:           10,
        padding:       "10px 14px",
        borderBottom:  "1px solid #1e293b",
        listStyle:     "none",
      }}
    >
      <div
        style={{
          width:        24,
          height:       24,
          borderRadius:  3,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          flexShrink:   0,
          marginTop:    1,
          background:   c.bg,
          color:        c.color,
        }}
      >
        {NOTIF_ICON[notif.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "#f1f5f9", lineHeight: 1.5, wordBreak: "break-word" }}>
          {notif.msg}
        </div>
        <div style={{ fontSize: 9, color: "#64748b", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {notif.time}
        </div>
      </div>
    </li>
  );
}

/* ── command palette ─────────────────────────────────────── */

function CommandPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const q = query.toLowerCase().trim();
  const pages = NAV_ITEMS.filter((p) => !q || p.label.includes(q));
  const cmds  = ACTION_ITEMS.filter((c) => !q || c.label.includes(q));

  const handleSelect = useCallback((item: CmdItem) => {
    if (item.path && onNavigate) onNavigate(item.path);
    onClose();
  }, [onClose, onNavigate]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:       "fixed",
        inset:           0,
        background:     "rgba(0,0,0,0.7)",
        zIndex:          200,
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "center",
        paddingTop:      80,
      }}
    >
      <div
        style={{
          width:        480,
          background:   "#0f172a",
          border:       "1px solid #1e293b",
          borderRadius:  6,
          overflow:     "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* input */}
        <div
          style={{
            display:     "flex",
            alignItems:  "center",
            gap:          10,
            padding:      "12px 14px",
            borderBottom: "1px solid #1e293b",
          }}
        >
          <span style={{ color: "#6366f1", fontSize: 13, fontFamily: "inherit" }}>›_</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            placeholder="search pages, commands, logs…"
            style={{
              flex:       1,
              background: "transparent",
              border:     "none",
              outline:    "none",
              fontFamily: "inherit",
              fontSize:    13,
              color:      "#f1f5f9",
              caretColor: "#6366f1",
            }}
          />
          <span style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap" }}>esc to close</span>
        </div>

        {/* results */}
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {pages.length > 0 && (
            <>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", padding: "8px 14px 4px" }}>
                navigate
              </div>
              {pages.map((p) => (
                <CmdRow key={p.label} item={p} onSelect={() => handleSelect(p)} />
              ))}
            </>
          )}
          {cmds.length > 0 && (
            <>
              <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", padding: "8px 14px 4px" }}>
                actions
              </div>
              {cmds.map((c) => (
                <CmdRow key={c.label} item={c} onSelect={() => handleSelect(c)} />
              ))}
            </>
          )}
          {pages.length === 0 && cmds.length === 0 && (
            <div style={{ padding: "20px 14px", fontSize: 11, color: "#64748b", textAlign: "center" }}>
              no results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CmdRow({ item, onSelect }: { item: CmdItem; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="option"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(); }}
      style={{
        display:    "flex",
        alignItems: "center",
        gap:         10,
        padding:    "8px 14px",
        cursor:     "pointer",
        background:  hovered ? "rgba(99,102,241,0.06)" : "transparent",
        transition: "background 0.1s",
      }}
    >
      <span style={{ color: "#94a3b8", width: 14, display: "flex", justifyContent: "center" }}>{item.icon}</span>
      <span style={{ fontSize: 12, color: "#f1f5f9", flex: 1 }}>{item.label}</span>
      {item.shortcut && (
        <span style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.06em" }}>{item.shortcut}</span>
      )}
    </div>
  );
}

/* ── main TopBar ─────────────────────────────────────────── */

export default function TopBar({
  notifications = DEFAULT_NOTIFICATIONS,
  onBellClick,
  onNavigate,
}: TopBarProps) {
  const path      = usePathname();
  const clock     = useClock();
  const title     = resolveTitle(path);
  const segments  = buildSegments(path);
  const storage   = useStorageJitter();
  const queue     = useQueueJitter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cmdOpen,    setCmdOpen]    = useState(false);
  const [notifs,     setNotifs]     = useState<Notification[]>(notifications);
  const unread = notifs.length;

  /* sync browser tab title */
  useEffect(() => { document.title = `${title} · BackupOS`; }, [title]);

  /* global Ctrl+K */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const storageStatus: "ok" | "warn" | "err" = storage > 85 ? "err" : storage > 70 ? "warn" : "ok";
  const queueStatus:   "ok" | "warn" | "err" = queue  >  3  ? "err" : queue  >  0  ? "warn" : "ok";

  return (
    <>
      {/* keyframe injection */}
      <style>{`
        @keyframes pulse-ok   { 0%,100%{opacity:1}50%{opacity:.5} }
        @keyframes pulse-warn { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes pulse-err  { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes cur-blink  { 0%,100%{opacity:1}50%{opacity:0}  }
      `}</style>

      {/* ── TOPBAR ── */}
      <header
        style={{
          position:      "fixed",
          top:            0,
          right:          0,
          left:           224,
          height:         48,
          zIndex:         10,
          display:       "flex",
          alignItems:    "stretch",
          background:    "rgba(13,15,13,0.9)",
          borderBottom:  "1px solid #1e293b",
          backdropFilter: "blur(8px)",
          fontFamily:    inherit",
          overflow:      "hidden",
        }}
      >
        {/* scanline overlay */}
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            inset:       0,
            background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 3px)",
            pointerEvents: "none",
            zIndex:      0,
          }}
        />

        {/* ── LEFT: breadcrumb + status ── */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", flex: 1, paddingLeft: 16, gap: 0 }}>

          {/* breadcrumb */}
          <nav aria-label="Page location" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, letterSpacing: "0.03em" }}>
            <span style={{ color: "#6366f1", marginRight: 4, fontSize: 12, animation: "cur-blink 1.2s step-end infinite" }} aria-hidden="true">›</span>
            <span style={{ color: "#64748b" }}>~/</span>
            {segments.map((seg, i) => {
              const isLast = i === segments.length - 1;
              return (
                <span key={seg.full} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {!isLast ? (
                    <>
                      <span style={{ color: "#64748b" }}>{seg.label}</span>
                      <span style={{ color: "#334155" }}>/</span>
                    </>
                  ) : (
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>{title}</span>
                  )}
                </span>
              );
            })}
          </nav>

          {/* divider */}
          <div aria-hidden="true" style={{ width: 1, background: "#1e293b", margin: "10px 14px", flexShrink: 0 }} />

          {/* status pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }} aria-label="System status">
            <StatusPillEl label="agent"   value="running"        status="ok" />
            <StatusPillEl label="storage" value={`${storage}%`} status={storageStatus} />
            <StatusPillEl label="queue"   value={String(queue)}  status={queueStatus} />
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 0, paddingRight: 14 }}>

          {/* cmd trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            aria-label="Open command palette"
            aria-expanded={cmdOpen}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:         7,
              padding:    "5px 11px",
              marginRight: 4,
              borderRadius: 4,
              border:     "1px solid #1e293b",
              background: "rgba(255,255,255,0.02)",
              cursor:     "pointer",
              fontSize:    11,
              fontFamily: "inherit",
              color:      "#94a3b8",
            }}
          >
            <Search size={11} />
            <span>search</span>
            <span style={{ display: "flex", gap: 2, alignItems: "center" }} aria-hidden="true">
              {["ctrl", "K"].map((k) => (
                <span key={k} style={{ fontSize: 9, padding: "1px 4px", borderRadius: 2, background: "#1e293b", color: "#64748b", border: "1px solid #334155", lineHeight: 1.5 }}>{k}</span>
              ))}
            </span>
          </button>

          {/* bell */}
          <button
            onClick={() => {
              setDrawerOpen((v) => !v);
              onBellClick?.();
            }}
            aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
            aria-expanded={drawerOpen}
            style={{
              position:       "relative",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:           32,
              height:          32,
              borderRadius:    4,
              border:         drawerOpen ? "1px solid #4f46e5" : "1px solid transparent",
              background:     drawerOpen ? "rgba(99,102,241,0.1)" : "transparent",
              cursor:         "pointer",
              color:          drawerOpen ? "#6366f1" : unread > 0 ? "#f1f5f9" : "#94a3b8",
              transition:     "all 0.2s",
            }}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position:       "absolute",
                  top:            -3,
                  right:          -3,
                  minWidth:        14,
                  height:          14,
                  padding:        "0 3px",
                  borderRadius:    999,
                  background:     "#ff4444",
                  color:          "#fff",
                  fontSize:        8,
                  fontFamily:     inherit",
                  fontWeight:      700,
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  lineHeight:      1,
                  pointerEvents:  "none",
                }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* divider */}
          <div aria-hidden="true" style={{ width: 1, background: "#1e293b", margin: "10px 14px 10px 10px", flexShrink: 0 }} />

          {/* clock */}
          <div
            role="timer"
            style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "flex-end",
              gap:             1,
              justifyContent: "center",
              minWidth:        80,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.1em", fontVariantNumeric: "tabular-nums" }}>
              {clock.time}
            </span>
            <span style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {clock.date}
            </span>
          </div>
        </div>

        {/* ── NOTIFICATION DRAWER ── */}
        {drawerOpen && (
          <div
            role="dialog"
            aria-label="Notifications"
            style={{
              position:   "absolute",
              top:         48,
              right:       0,
              width:       320,
              background: "#0f172a",
              border:     "1px solid #1e293b",
              borderTop:  "none",
              zIndex:      100,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid #1e293b" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                notifications
              </span>
              <button
                onClick={() => { setNotifs([]); setDrawerOpen(false); }}
                style={{
                  fontSize:   9,
                  color:      "#64748b",
                  cursor:     "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  padding:    "2px 6px",
                  borderRadius: 2,
                  border:     "1px solid transparent",
                  background: "transparent",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
              >
                clear all
              </button>
            </div>
            <ul style={{ maxHeight: 280, overflowY: "auto", margin: 0, padding: 0 }}>
              {notifs.length === 0 ? (
                <li style={{ padding: "20px 14px", fontSize: 11, color: "#64748b", textAlign: "center", listStyle: "none" }}>
                  no notifications
                </li>
              ) : (
                notifs.map((n) => <NotifItem key={n.id} notif={n} />)
              )}
            </ul>
          </div>
        )}
      </header>

      {/* ── COMMAND PALETTE ── */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={onNavigate} />
    </>
  );
}