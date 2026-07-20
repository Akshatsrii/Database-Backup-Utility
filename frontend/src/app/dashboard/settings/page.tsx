"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, WifiOff, CheckCircle, XCircle, Wifi, X } from "lucide-react";
import { connectionsApi } from "@/lib/api";
import type { DbConnection, CreateConnectionDto, DbType } from "@/types";
import { dbLabels } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PORTS: Record<DbType, number> = {
  mysql: 3306,
  postgresql: 5432,
  mongodb: 27017,
  sqlite: 0,
};

const DB_ICONS: Record<DbType, string> = {
  postgresql: "🐘",
  mysql: "🐬",
  mongodb: "🍃",
  sqlite: "💾",
};

const EMPTY: CreateConnectionDto = {
  name: "",
  type: "postgresql",
  host: "localhost",
  port: 5432,
  username: "",
  password: "",
  database: "",
};

const DB_TYPES: DbType[] = ["postgresql", "mysql", "mongodb", "sqlite"];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
}

function Toast({ toast }: { toast: ToastState }) {
  const dotColor =
    toast.type === "success"
      ? "#10b981"
      : toast.type === "error"
      ? "#ff4444"
      : "#6366f1";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${toast.visible ? "0" : "80px"})`,
        background: "#141714",
        border: "1px solid #252825",
        borderRadius: 10,
        padding: "10px 16px",
        fontSize: 12,
        color: "#e8edea",
        display: "flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
        zIndex: 200,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        fontFamily: "inherit",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {toast.message}
    </div>
  );
}

// ─── Status Dot ───────────────────────────────────────────────────────────────

function StatusDot({ state }: { state: "unknown" | "ok" | "err" | "testing" }) {
  const colors = {
    unknown: "#4a5450",
    ok: "#10b981",
    err: "#ff4444",
    testing: "#6366f1",
  };

  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[state],
        flexShrink: 0,
        boxShadow: state === "ok" ? "0 0 6px rgba(16,185,129,0.4)" : "none",
        animation: state === "testing" ? "pulse 0.8s ease infinite" : "none",
      }}
    />
  );
}

// ─── Connection Item ──────────────────────────────────────────────────────────

function ConnectionItem({
  conn,
  testResult,
  isTesting,
  onTest,
  onDelete,
}: {
  conn: DbConnection;
  testResult?: boolean;
  isTesting: boolean;
  onTest: () => void;
  onDelete: () => void;
}) {
  const dotState = isTesting
    ? "testing"
    : testResult === true
    ? "ok"
    : testResult === false
    ? "err"
    : "unknown";

  const borderColor =
    testResult === true
      ? "rgba(16,185,129,0.2)"
      : testResult === false
      ? "rgba(255,68,68,0.2)"
      : "#252825";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px",
        borderRadius: 8,
        border: `1px solid ${borderColor}`,
        background: "#1a1d1a",
        gap: 12,
        transition: "border-color 0.15s",
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        <StatusDot state={dotState} />

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "#252825",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {DB_ICONS[conn.type]}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#e8edea",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {conn.name}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#4a5450",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {conn.username}@{conn.host}:{conn.port}/{conn.database}
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            padding: "3px 7px",
            borderRadius: 4,
            background: "rgba(99,102,241,0.08)",
            color: "#6366f1",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          {conn.type}
        </span>

        <button
          onClick={onTest}
          disabled={isTesting}
          style={{
            background: "transparent",
            color: isTesting ? "#4a5450" : "#6b7870",
            border: "1px solid #2e332e",
            borderRadius: 8,
            fontFamily: "inherit",
            fontSize: 11,
            padding: "6px 12px",
            cursor: isTesting ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            letterSpacing: "0.2px",
          }}
          onMouseEnter={(e) => {
            if (!isTesting) {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1";
              (e.currentTarget as HTMLButtonElement).style.color = "#6366f1";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2e332e";
            (e.currentTarget as HTMLButtonElement).style.color = "#6b7870";
          }}
        >
          {isTesting ? "..." : "test"}
        </button>

        <button
          onClick={onDelete}
          aria-label="Delete connection"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 8,
            color: "#4a5450",
            padding: 7,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "#ff4444";
            btn.style.borderColor = "rgba(255,68,68,0.25)";
            btn.style.background = "rgba(255,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.color = "#4a5450";
            btn.style.borderColor = "transparent";
            btn.style.background = "transparent";
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Sheet Modal ───────────────────────────────────────────────────────

function BottomSheet({
  open,
  onClose,
  form,
  setForm,
  onSave,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  form: CreateConnectionDto;
  setForm: React.Dispatch<React.SetStateAction<CreateConnectionDto>>;
  onSave: () => void;
  saving: boolean;
  error: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const set = (k: keyof CreateConnectionDto, v: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "type") next.port = DEFAULT_PORTS[v as DbType];
      return next;
    });
  };

  const inputStyle: React.CSSProperties = {
    background: "#1a1d1a",
    border: "1px solid #252825",
    borderRadius: 8,
    color: "#e8edea",
    fontFamily: "inherit",
    fontSize: 12,
    padding: "10px 12px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

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
    <div
      onClick={handleOverlayClick}
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
      <div
        ref={sheetRef}
        style={{
          background: "#141714",
          border: "1px solid #252825",
          borderRadius: "18px 18px 0 0",
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          transform: open ? "translateY(0)" : "translateY(40px)",
          transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e8edea", letterSpacing: "0.5px" }}>
            add_connection
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#1a1d1a",
              border: "1px solid #252825",
              color: "#6b7870",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>

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
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ✗ {error}
            </div>
          )}

          {/* DB Type */}
          <div>
            <label style={labelStyle}>db_type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              {DB_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 8,
                    border: `1px solid ${form.type === t ? "#6366f1" : "#252825"}`,
                    background: form.type === t ? "rgba(99,102,241,0.08)" : "transparent",
                    color: form.type === t ? "#6366f1" : "#6b7870",
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                    letterSpacing: "0.4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {DB_ICONS[t]} {dbLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#252825" }} />

          {/* Name */}
          <div>
            <label style={labelStyle}>connection_name</label>
            <input
              style={inputStyle}
              placeholder="my-production-db"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#252825";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Host + Port */}
          <div style={{ display: "grid", gridTemplateColumns: form.type === "sqlite" ? "1fr" : "1fr 100px", gap: 10 }}>
            <div>
              <label style={labelStyle}>host</label>
              <input
                style={inputStyle}
                placeholder="localhost"
                value={form.host}
                onChange={(e) => set("host", e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#252825";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            {form.type !== "sqlite" && (
              <div>
                <label style={labelStyle}>port</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.port}
                  onChange={(e) => set("port", Number(e.target.value))}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6366f1";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#252825";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Database */}
          <div>
            <label style={labelStyle}>database</label>
            <input
              style={inputStyle}
              placeholder="mydb"
              value={form.database}
              onChange={(e) => set("database", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#252825";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Username */}
          <div>
            <label style={labelStyle}>username</label>
            <input
              style={inputStyle}
              placeholder="postgres"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#252825";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>password</label>
            <input
              type="password"
              style={inputStyle}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(99,102,241,0.08)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#252825";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              background: saving ? "rgba(99,102,241,0.5)" : "#6366f1",
              color: "#0a0f0a",
              border: "none",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              padding: "13px",
              width: "100%",
              cursor: saving ? "not-allowed" : "pointer",
              letterSpacing: "0.2px",
              transition: "opacity 0.15s, transform 0.1s",
              marginTop: 4,
            }}
          >
            {saving ? "saving..." : "$ save_connection →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try {
        return (await connectionsApi.list()).data ?? [];
      } catch {
        return [];
      }
    },
  });

  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState<CreateConnectionDto>(EMPTY);
  const [testing, setTesting]         = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [toast, setToast]             = useState<ToastState>({ message: "", type: "success", visible: false });

  const refresh = () => qc.invalidateQueries({ queryKey: ["connections"] });

  // Toast helper
  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  };

  const handleSave = async () => {
    if (!form.name || !form.host || !form.username || !form.database) {
      setError("fill all required fields");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await connectionsApi.create(form);
      refresh();
      setShowAdd(false);
      setForm(EMPTY);
      showToast("connection saved");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const res = await connectionsApi.test(id);
      const ok = res.data?.success ?? false;
      setTestResults((p) => ({ ...p, [id]: ok }));
      showToast(ok ? "connection successful" : "connection failed", ok ? "success" : "error");
    } catch {
      setTestResults((p) => ({ ...p, [id]: false }));
      showToast("connection failed", "error");
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("remove this connection?")) return;
    try {
      await connectionsApi.remove(id);
      refresh();
      showToast("connection removed");
    } catch {
      showToast("failed to remove", "error");
    }
  };

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .settings-page { animation: fadeIn 0.25s ease; }
      `}</style>

      <div
        className="settings-page"
        style={{
          padding: "20px 16px 40px",
          maxWidth: 480,
          margin: "0 auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "#e8edea", letterSpacing: "-0.3px" }}>
              <span style={{ color: "#6366f1" }}>$</span> settings
            </h1>
            <p style={{ fontSize: 11, color: "#4a5450", marginTop: 3, letterSpacing: "0.3px" }}>
              database connections
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: "#6366f1",
              color: "#0a0f0a",
              border: "none",
              borderRadius: 8,
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 700,
              padding: "9px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              letterSpacing: "0.2px",
              whiteSpace: "nowrap",
            }}
          >
            <Plus size={13} strokeWidth={3} />
            add connection
          </button>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#141714",
            border: "1px solid #252825",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #252825",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#6366f1",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
              }}
            >
              db_connections
            </span>
            <span style={{ fontSize: 11, color: "#4a5450" }}>
              {connections.length} configured
            </span>
          </div>

          {/* Content */}
          {isLoading ? (
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 62,
                    borderRadius: 8,
                    background: "#1a1d1a",
                    animation: "pulse 1.4s ease infinite",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          ) : connections.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <WifiOff size={28} style={{ color: "#252825", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 12, color: "#4a5450", lineHeight: 1.6 }}>
                no connections configured
                <br />
                add a database connection to start taking backups
              </p>
            </div>
          ) : (
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {connections.map((c) => (
                <ConnectionItem
                  key={c.id}
                  conn={c}
                  testResult={testResults[c.id]}
                  isTesting={testing === c.id}
                  onTest={() => handleTest(c.id)}
                  onDelete={() => handleDelete(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(EMPTY); setError(""); }}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        saving={saving}
        error={error}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </>
  );
}