"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { formatBytes } from "@/lib/utils";
import type { DashboardStats } from "@/types";

const TOOLTIP_STYLE = {
  background: "#141614",
  border: "1px solid #252825",
  borderRadius: "6px",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "12px",
  color: "#e8edea",
};

const AXIS_STYLE = {
  fill: "#4a5450",
  fontSize: 11,
  fontFamily: "JetBrains Mono, monospace",
};

export default function BackupChart({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Storage Growth Chart */}
      <div className="terminal-card p-5">
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#4a5450" }}
        >
          storage_growth
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={stats.backupsSizeHistory}>
            <defs>
              <linearGradient id="acidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#b8f53a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#b8f53a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#252825" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatBytes(v, 0)}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [formatBytes(v), "size"]}
              labelStyle={{ color: "#8a9690" }}
            />
            <Area
              type="monotone"
              dataKey="bytes"
              stroke="#b8f53a"
              strokeWidth={2}
              fill="url(#acidGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Success Rate Chart */}
      <div className="terminal-card p-5">
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#4a5450" }}
        >
          success_rate_%
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stats.successRateHistory}>
            <CartesianGrid stroke="#252825" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [`${v}%`, "success rate"]}
              labelStyle={{ color: "#8a9690" }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#4ade80"
              strokeWidth={2}
              dot={{ fill: "#4ade80", r: 3 }}
              activeDot={{ r: 5, fill: "#b8f53a" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}