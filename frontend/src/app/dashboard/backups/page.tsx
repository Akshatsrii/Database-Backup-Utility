"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import BackupTable from "@/components/backup/BackupTable";
import BackupModal from "@/components/backup/BackupModal";
import RestoreModal from "@/components/restore/RestoreModal";
import { useBackups } from "@/hooks/useBackups";
import { useQuery } from "@tanstack/react-query";
import { connectionsApi } from "@/lib/api";
import type { Backup, DbConnection } from "@/types";

export default function BackupsPage() {
  const { data: backups = [], refresh, isLoading } = useBackups();
  const { data: connections = [] } = useQuery<DbConnection[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      try { return (await connectionsApi.list()).data.data ?? []; }
      catch { return []; }
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = backups.filter((b) => {
    const srchOk = !search ||
      b.filename.toLowerCase().includes(search.toLowerCase()) ||
      b.connectionName?.toLowerCase().includes(search.toLowerCase());
    const stOk = statusFilter === "all" || b.status === statusFilter;
    return srchOk && stOk;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
            <span style={{ color: "#b8f53a" }}>$</span> backup_history
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
            {backups.length} total backups
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-acid flex items-center gap-2"
        >
          <Plus size={14} /> new backup
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#4a5450" }} />
          <input
            type="text"
            placeholder="search backups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="terminal-input pl-8 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="terminal-input text-xs"
          style={{ width: 140, appearance: "none" }}
        >
          <option value="all">all status</option>
          <option value="completed">completed</option>
          <option value="running">running</option>
          <option value="failed">failed</option>
          <option value="pending">pending</option>
        </select>
      </div>

      {isLoading ? (
        <div className="terminal-card h-48 animate-pulse" />
      ) : (
        <BackupTable
          backups={filtered}
          onRefresh={refresh}
          onRestore={(b) => setRestoreTarget(b)}
        />
      )}

      <BackupModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        connections={connections}
        onSuccess={refresh}
      />
      <RestoreModal
        open={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        backup={restoreTarget}
        connections={connections}
        onSuccess={refresh}
      />
    </div>
  );
}