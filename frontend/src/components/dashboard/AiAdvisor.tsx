import { Brain, AlertCircle, CheckCircle, Info } from "lucide-react";

interface Insight {
  type: "warning" | "success" | "info";
  message: string;
  recommendation: string;
}

export default function AiAdvisor({ insights }: { insights?: Insight[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="terminal-card" style={{ marginBottom: 24 }}>
      <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6366f1", fontWeight: 600, fontSize: 13 }}>
          <Brain size={16} />
          AI Backup Advisor
        </div>
        <span style={{ fontSize: 10, color: "#4a6450", letterSpacing: "0.04em" }}>heuristic engine v1.0</span>
      </div>
      
      <div className="p-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {insights.map((insight, i) => {
          const isWarn = insight.type === "warning";
          const isSuccess = insight.type === "success";
          const color = isWarn ? "#ff4444" : isSuccess ? "#10b981" : "#3b82f6";
          const bg = isWarn ? "rgba(255,68,68,0.05)" : isSuccess ? "rgba(16,185,129,0.05)" : "rgba(56,189,248,0.05)";
          
          return (
            <div key={i} style={{ 
              background: bg, 
              border: `1px solid ${color}33`,
              borderRadius: 8,
              padding: 12,
              display: "flex",
              gap: 12,
              alignItems: "flex-start"
            }}>
              <div style={{ color, marginTop: 2 }}>
                {isWarn ? <AlertCircle size={16} /> : isSuccess ? <CheckCircle size={16} /> : <Info size={16} />}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#e8edea", fontWeight: 500 }}>{insight.message}</span>
                <span style={{ fontSize: 11, color: "#8aaa80" }}>💡 {insight.recommendation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
