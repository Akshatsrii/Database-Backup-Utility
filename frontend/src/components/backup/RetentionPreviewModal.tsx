import { X, Trash2, Archive, AlertTriangle } from "lucide-react";
import type { Backup } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  previews: Backup[];
  loading: boolean;
}

export default function RetentionPreviewModal({ open, onClose, previews, loading }: Props) {
  if (!open) return null;

  return (
    <>
      <style>{`
        .rpm-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          animation: rpm-fadein 0.2s ease;
        }
        .rpm-modal {
          background: #020617;
          border: 1px solid rgba(255,255,255,0.1);
          width: 500px;
          border-radius: 12px;
          display: flex; flex-direction: column;
          
        }
        .rpm-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex; justify-content: space-between; align-items: center;
        }
        .rpm-title { font-size: 14px; font-weight: 600; color: #6366f1; display: flex; align-items: center; gap: 8px;}
        .rpm-body { padding: 20px; max-height: 400px; overflow-y: auto; }
        .rpm-item {
          background: #0f172a; border: 1px solid rgba(255,255,255,0.1); padding: 12px;
          border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between;
        }
        .rpm-name { font-size: 12px; color: #cbd5e1; }
        .rpm-ver { font-size: 10px; color: #94a3b8; margin-top: 4px; }
        .rpm-action { font-size: 11px; display: flex; align-items: center; gap: 4px; color: #fbbf24; }
      `}</style>

      <div className="rpm-overlay" onClick={onClose}>
        <div className="rpm-modal" onClick={e => e.stopPropagation()}>
          <div className="rpm-header">
            <div className="rpm-title">
              <AlertTriangle size={16} />
              Retention Policy Preview
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <X size={16} />
            </button>
          </div>
          <div className="rpm-body">
            <p style={{ fontSize: "11px", color: "#6a8a70", marginBottom: 16 }}>
              The following backups are scheduled to be <strong>Archived</strong> during the next cron run because they exceed the retention limit (older than config limit and not in top 5).
            </p>
            {loading ? (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}>Loading preview...</div>
            ) : previews.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}>No backups scheduled for deletion/archiving.</div>
            ) : (
              previews.map(b => (
                <div key={b.id} className="rpm-item">
                  <div>
                    <div className="rpm-name">{b.filename}</div>
                    <div className="rpm-ver">{b.connectionName} • {b.version || "v1"}</div>
                  </div>
                  <div className="rpm-action">
                    <Archive size={14} />
                    Will be Archived
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
