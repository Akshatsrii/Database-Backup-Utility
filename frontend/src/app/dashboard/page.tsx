"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wifi, WifiOff, CheckCircle, XCircle } from "lucide-react";
import { connectionsApi } from "@/lib/api";
import type { DbConnection, CreateConnectionDto, DbType } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { TextBadge } from "@/components/ui/Badge";
import { dbLabels } from "@/lib/utils";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";

const DEFAULT_PORTS: Record<DbType, number> = {
  mysql: 3306, postgresql: 5432, mongodb: 27017, sqlite: 0,
};

const EMPTY: CreateConnectionDto = {
  name: "", type: "postgresql", host: "localhost", port: 5432,
  username: "", password: "", database: "",
};

export default function SettingsPage() {
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CreateConnectionDto>(EMPTY);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["connections"] });

  const set = (k: keyof CreateConnectionDto, v: string | number) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "type") next.port = DEFAULT_PORTS[v as DbType];
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.host || !form.username || !form.database) {
      setError("fill all required fields"); return;
    }
    setError("");
    setSaving(true);
    try {
      await connectionsApi.create(form);
      refresh();
      setShowAdd(false);
      setForm(EMPTY);
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
      setTestResults((p) => ({ ...p, [id]: res.data.data?.success ?? false }));
    } catch {
      setTestResults((p) => ({ ...p, [id]: false }));
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("remove this connection?")) return;
    try { await connectionsApi.remove(id); refresh(); }
    catch { /**/ }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> settings
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>database connections</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-acid flex items-center gap-2">
          <Plus size={14} /> add connection
        </button>
      </div>

      <Card>
        <CardHeader>
          <SectionLabel>db_connections</SectionLabel>
          <span className="text-xs" style={{ color: "#4a5450" }}>{connections.length} configured</span>
        </CardHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 rounded animate-pulse" style={{ background: "#1a1d1a" }} />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="text-center py-12 text-xs space-y-2" style={{ color: "#4a5450" }}>
            <WifiOff size={24} className="mx-auto mb-2" />
            <p>no connections configured</p>
            <p>add a database connection to start taking backups</p>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3.5 rounded border"
                style={{ borderColor: "#252825", background: "#1a1d1a" }}
              >
                <div className="flex items-center gap-4">
                  {testResults[c.id] === true
                    ? <CheckCircle size={14} style={{ color: "#4ade80" }} />
                    : testResults[c.id] === false
                    ? <XCircle size={14} style={{ color: "#ff4444" }} />
                    : <Wifi size={14} style={{ color: "#4a5450" }} />
                  }
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#e8edea" }}>{c.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
                      {c.username}@{c.host}:{c.port}/{c.database}
                    </p>
                  </div>
                  <TextBadge color="acid">{dbLabels[c.type]}</TextBadge>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(c.id)}
                    disabled={testing === c.id}
                    className="btn-ghost text-xs px-3 py-1.5"
                  >
                    {testing === c.id ? "testing..." : "test"}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded transition-colors"
                    style={{ color: "#4a5450" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add connection modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setForm(EMPTY); setError(""); }} title="add_connection">
        <div className="space-y-4">
          {error && (
            <p className="text-xs px-3 py-2 rounded" style={{ color: "#ff4444", background: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)" }}>
              ✗ {error}
            </p>
          )}

          {/* DB type selector */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: "#4a5450" }}>db_type</label>
            <div className="grid grid-cols-4 gap-2">
              {(["postgresql", "mysql", "mongodb", "sqlite"] as DbType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => set("type", t)}
                  className="py-2 px-2 rounded text-xs border transition-all"
                  style={{
                    borderColor: form.type === t ? "#b8f53a" : "#252825",
                    color: form.type === t ? "#b8f53a" : "#8a9690",
                    background: form.type === t ? "rgba(184,245,58,0.08)" : "transparent",
                  }}
                >
                  {dbLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          {[
            { key: "name",     label: "connection_name", placeholder: "my-production-db" },
            { key: "host",     label: "host",            placeholder: "localhost" },
            { key: "username", label: "username",        placeholder: "postgres" },
            { key: "password", label: "password",        placeholder: "••••••••", type: "password" },
            { key: "database", label: "database",        placeholder: "mydb" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>{label}</label>
              <input
                type={type ?? "text"}
                className="terminal-input"
                placeholder={placeholder}
                value={form[key as keyof CreateConnectionDto] as string}
                onChange={(e) => set(key as keyof CreateConnectionDto, e.target.value)}
              />
            </div>
          ))}

          {/* Port */}
          {form.type !== "sqlite" && (
            <div className="space-y-1.5">
              <label className="text-xs" style={{ color: "#4a5450" }}>port</label>
              <input
                type="number"
                className="terminal-input"
                value={form.port}
                onChange={(e) => set("port", Number(e.target.value))}
              />
            </div>
          )}

          <button onClick={handleSave} disabled={saving} className="btn-acid w-full">
            {saving ? "saving..." : "$ save_connection →"}
          </button>
        </div>
      </Modal>
    </div>
  );
}