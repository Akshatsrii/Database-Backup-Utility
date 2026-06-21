"use client";

import { useState, useEffect } from "react";
import { X, Database, HardDrive, Shield, ChevronRight } from "lucide-react";
import { backupsApi } from "@/lib/api";
import type { DbConnection, CreateBackupDto, BackupType, StorageType } from "@/types";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  connections: DbConnection[];
  onSuccess: () => void;
}

const STAGES = [
  { key: "connecting",  label: "connecting to database...", pct: 15  },
  { key: "dumping",     label: "dumping database...",        pct: 40  },
  { key: "compressing", label: "compressing backup...",      pct: 65  },
  { key: "encrypting",  label: "encrypting...",              pct: 80  },
  { key: "uploading",   label: "uploading to storage...",    pct: 95  },
  { key: "completed",   label: "completed",                  pct: 100 },
];

const BACKUP_TYPES: { value: BackupType; label: string; desc: string }[] = [
  { value: "full",         label: "full",         desc: "entire db snapshot"   },
  { value: "incremental",  label: "incremental",  desc: "changes since last"   },
  { value: "differential", label: "differential", desc: "changes since full"   },
];

const STORAGE_TYPES = [
  { value: "local",    label: "local",    icon: "💾" },
  { value: "firebase", label: "firebase", icon: "🔥" },
] as const satisfies { value: StorageType; label: string; icon: string }[];

const EMPTY: CreateBackupDto = {
  connectionId: "",
  backupType:   "full",
  storageType:  "local",
  encrypt:      false,
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "#1a1d1a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "linear-gradient(90deg, #6fcf20, #b8f53a)",
            borderRadius: 2,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shimmer */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
              animation: "shimmer 1.4s ease infinite",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "#b8f53a",
            fontWeight: 700,
            letterSpacing: "0.5px",
          }}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
}

// ─── Stage List ───────────────────────────────────────────────────────────────

function StageList({ stageIdx }: { stageIdx: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {STAGES.map((s, i) => {
        const done    = i < stageIdx;
        const active  = i === stageIdx;
        const pending = i > stageIdx;

        return (
          <div
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 8,
              background: active ? "rgba(184,245,58,0.06)" : "transparent",
              border: `1px solid ${active ? "rgba(184,245,58,0.15)" : "transparent"}`,
              transition: "all 0.2s",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
                background: done
                  ? "rgba(74,222,128,0.15)"
                  : active
                  ? "rgba(184,245,58,0.15)"
                  : "#1a1d1a",
                color: done ? "#4ade80" : active ? "#b8f53a" : "#4a5450",
                transition: "all 0.25s",
              }}
            >
              {done ? "✓" : active ? "›" : "○"}
            </div>

            <span
              style={{
                fontSize: 12,
                color: done ? "#4ade80" : active ? "#e8edea" : "#4a5450",
                transition: "color 0.25s",
                fontWeight: active ? 600 : 400,
                flex: 1,
              }}
            >
              {s.label}
            </span>

            {active && (
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#b8f53a",
                      animation: `bounce 0.8s ease ${d * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        position: "relative",
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? "rgba(184,245,58,0.25)" : "#252825",
        border: `1px solid ${checked ? "rgba(184,245,58,0.4)" : "#2e332e"}`,
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: checked ? "#b8f53a" : "#4a5450",
          transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          display: "block",
        }}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BackupModal({ open, onClose, connections, onSuccess }: Props) {
  const [form, setForm]       = useState<CreateBackupDto>(EMPTY);
  const [running, setRunning] = useState(false);
  const [stageIdx, setStageIdx] = useState(-1);
  const [error, setError]     = useState("");

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !running) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, running]);

  const set = (k: keyof CreateBackupDto, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.connectionId) { setError("select a connection"); return; }
    setError("");
    setRunning(true);
    setStageIdx(0);

    try {
      for (let i = 0; i < STAGES.length - 1; i++) {
        setStageIdx(i);
        await delay(600 + Math.random() * 400);
      }
      await backupsApi.create(form);
      setStageIdx(STAGES.length - 1);
      await delay(900);
      onSuccess();
      handleClose();
    } catch (e: unknown) {
      setError((e as Error).message);
      setRunning(false);
      setStageIdx(-1);
    }
  };

  const handleClose = () => {
    if (running) return;
    setStageIdx(-1);
    setError("");
    setForm(EMPTY);
    onClose();
  };

  const currentStage = stageIdx >= 0 ? STAGES[stageIdx] : null;
  const selectedConn = connections.find((c) => c.id === form.connectionId);

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7870",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 6,
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0);    opacity: 1; }
          50%       { transform: translateY(-4px); opacity: 0.5; }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={(e) => { if (e.target === e.currentTarget && !running) handleClose(); }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 100,
          backdropFilter: open ? "blur(2px)" : "none",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "opacity 0.2s",
        }}
      >
        {/* Sheet */}
        <div
          style={{
            background: "#141714",
            border: "1px solid #252825",
            borderRadius: "18px 18px 0 0",
            width: "100%",
            maxWidth: 480,
            maxHeight: "92vh",
            overflowY: "auto",
            transform: open ? "translateY(0)" : "translateY(40px)",
            transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
          }}
        >
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2e332e", margin: "12px auto 0" }} />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 18px 14px",
              borderBottom: "1px solid #252825",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "rgba(184,245,58,0.1)",
                  border: "1px solid rgba(184,245,58,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={13} style={{ color: "#b8f53a" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#e8edea", letterSpacing: "0.5px" }}>
                create_backup
              </span>
            </div>

            {!running && (
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#1a1d1a",
                  border: "1px solid #252825",
                  color: "#6b7870",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: 18 }}>
            {running ? (
              /* ── Progress View ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeSlide 0.2s ease" }}>

                {/* Selected connection pill */}
                {selectedConn && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "#1a1d1a",
                      border: "1px solid #252825",
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#b8f53a", animation: "bounce 1s ease infinite" }} />
                    <span style={{ fontSize: 11, color: "#8a9690" }}>
                      {selectedConn.name}
                      <span style={{ color: "#4a5450" }}> · {selectedConn.database}</span>
                    </span>
                  </div>
                )}

                <ProgressBar percent={currentStage?.pct ?? 0} />
                <StageList stageIdx={stageIdx} />
              </div>
            ) : (
              /* ── Form View ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "fadeSlide 0.2s ease" }}>

                {/* Error */}
                {error && (
                  <div
                    style={{
                      fontSize: 11,
                      padding: "10px 12px",
                      borderRadius: 8,
                      color: "#ff4444",
                      background: "rgba(255,68,68,0.08)",
                      border: "1px solid rgba(255,68,68,0.2)",
                    }}
                  >
                    ✗ {error}
                  </div>
                )}

                {/* Connection */}
                <div>
                  <label style={labelStyle}>connection</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={form.connectionId}
                      onChange={(e) => set("connectionId", e.target.value)}
                      style={{
                        background: "#1a1d1a",
                        border: `1px solid ${form.connectionId ? "#b8f53a" : "#252825"}`,
                        borderRadius: 8,
                        color: form.connectionId ? "#e8edea" : "#4a5450",
                        fontFamily: "inherit",
                        fontSize: 12,
                        padding: "10px 36px 10px 12px",
                        width: "100%",
                        outline: "none",
                        appearance: "none",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <option value="">-- select connection --</option>
                      {connections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type} · {c.database})
                        </option>
                      ))}
                    </select>
                    <ChevronRight
                      size={13}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%) rotate(90deg)",
                        color: "#4a5450",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Backup Type */}
                <div>
                  <label style={labelStyle}>backup_type</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {BACKUP_TYPES.map((t) => {
                      const active = form.backupType === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => set("backupType", t.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderRadius: 8,
                            border: `1px solid ${active ? "#b8f53a" : "#252825"}`,
                            background: active ? "rgba(184,245,58,0.06)" : "#1a1d1a",
                            color: active ? "#b8f53a" : "#8a9690",
                            fontFamily: "inherit",
                            fontSize: 12,
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all 0.15s",
                            width: "100%",
                          }}
                        >
                          <span style={{ fontWeight: active ? 700 : 400 }}>{t.label}</span>
                          <span style={{ fontSize: 10, color: active ? "rgba(184,245,58,0.6)" : "#4a5450" }}>
                            {t.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Storage */}
                <div>
                  <label style={labelStyle}>storage</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {STORAGE_TYPES.map((s) => {
                      const active = form.storageType === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => set("storageType", s.value)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 4,
                            padding: "10px 8px",
                            borderRadius: 8,
                            border: `1px solid ${active ? "#38bdf8" : "#252825"}`,
                            background: active ? "rgba(56,189,248,0.06)" : "#1a1d1a",
                            color: active ? "#38bdf8" : "#8a9690",
                            fontFamily: "inherit",
                            fontSize: 11,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{s.icon}</span>
                          <span style={{ fontWeight: active ? 700 : 400 }}>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "#252825" }} />

                {/* Encrypt Toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 12, color: "#8a9690", display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={13} style={{ color: form.encrypt ? "#b8f53a" : "#4a5450" }} />
                      aes-256 encryption
                    </p>
                    <p style={{ fontSize: 10, color: "#4a5450", marginTop: 2 }}>
                      encrypt backup at rest
                    </p>
                  </div>
                  <Toggle checked={form.encrypt} onChange={() => set("encrypt", !form.encrypt)} />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  style={{
                    background: "#b8f53a",
                    color: "#0a0f0a",
                    border: "none",
                    borderRadius: 8,
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "13px",
                    width: "100%",
                    cursor: "pointer",
                    letterSpacing: "0.2px",
                    marginTop: 4,
                    transition: "opacity 0.15s, transform 0.1s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                  onMouseDown={(e)  => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                  onMouseUp={(e)    => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                >
                  $ create_backup →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}