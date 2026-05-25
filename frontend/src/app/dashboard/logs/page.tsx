"use client";

import LiveLogTerminal from "@/components/logs/LiveLogTerminal";
import { useLiveLogs } from "@/hooks/useLiveLogs";

export default function LogsPage() {
  const { data: initialLogs = [] } = useLiveLogs(300);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-lg font-bold" style={{ color: "#e8edea" }}>
          <span style={{ color: "#b8f53a" }}>$</span> live_logs
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#4a5450" }}>
          real-time backup activity stream via websocket
        </p>
      </div>

      <LiveLogTerminal initialLogs={initialLogs} height={600} />
    </div>
  );
}