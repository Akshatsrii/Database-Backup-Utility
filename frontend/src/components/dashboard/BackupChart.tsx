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
  ReferenceLine,
  TooltipProps,
} from "recharts";
import { formatBytes } from "@/lib/utils";
import type { DashboardStats } from "@/types";

/* ── shared constants ─────────────────────────────────────── */

const TOOLTIP_STYLE = {
  background: "#141614",
  border: "1px solid #252825",
  borderRadius: "6px",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "12px",
  color: "#e8edea",
  padding: "8px 12px",
};

const AXIS_STYLE = {
  fill: "#4a5450",
  fontSize: 11,
  fontFamily: "JetBrains Mono, monospace",
};

/* ── custom tooltip: storage ──────────────────────────────── */

function StorageTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4a5450", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#b8f53a" }}>
        <span style={{ color: "#8a9690" }}>size </span>
        {formatBytes(val)}
      </p>
    </div>
  );
}

/* ── custom tooltip: success rate ────────────────────────── */

function RateTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  const color = val >= 90 ? "#4ade80" : val >= 70 ? "#ffd700" : "#ff4444";
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4a5450", marginBottom: 4 }}>{label}</p>
      <p style={{ color }}>
        <span style={{ color: "#8a9690" }}>rate </span>
        {val}%
      </p>
    </div>
  );
}

/* ── chart card wrapper ───────────────────────────────────── */

interface CardProps {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

function ChartCard({ title, meta, children }: CardProps) {
  return (
    <div className="terminal-card p-5" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p className="text-xs tracking-widest uppercase" style={{ color: "#4a5450" }}>
          {title}
        </p>
        {meta}
      </div>
      {children}
    </div>
  );
}

/* ── main export ──────────────────────────────────────────── */

export default function BackupChart({ stats }: { stats: DashboardStats }) {
  /* derive summary values for meta badges */
  const sizeHistory    = stats.backupsSizeHistory ?? [];
  const rateHistory    = stats.successRateHistory ?? [];

  const latestSize     = sizeHistory.at(-1)?.bytes ?? null;
  const latestRate     = rateHistory.at(-1)?.rate  ?? null;

  const avgRate        = rateHistory.length
    ? Math.round(rateHistory.reduce((s, r) => s + r.rate, 0) / rateHistory.length)
    : null;

  /* find min-rate point for annotation */
  const minRateEntry   = rateHistory.length
    ? rateHistory.reduce((a, b) => (a.rate <= b.rate ? a : b))
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Storage Growth ── */}
      <ChartCard
        title="storage_growth"
        meta={
          latestSize != null ? (
            <span className="text-xs tabular-nums" style={{ color: "#b8f53a" }}>
              {formatBytes(latestSize)}
            </span>
          ) : null
        }
      >
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={sizeHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="acidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#b8f53a" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#b8f53a" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#252825" strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatBytes(v, 0)}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={58}
            />

            <Tooltip content={<StorageTooltip />} cursor={{ stroke: "#252825", strokeWidth: 1 }} />

            <Area
              type="monotone"
              dataKey="bytes"
              stroke="#b8f53a"
              strokeWidth={2}
              fill="url(#acidGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#b8f53a", strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Success Rate ── */}
      <ChartCard
        title="success_rate_%"
        meta={
          avgRate != null ? (
            <span
              className="text-xs tabular-nums"
              style={{ color: avgRate >= 90 ? "#4ade80" : avgRate >= 70 ? "#ffd700" : "#ff4444" }}
            >
              avg {avgRate}%
            </span>
          ) : null
        }
      >
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={rateHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#252825" strokeDasharray="3 3" vertical={false} />

            {/* 90% threshold reference */}
            <ReferenceLine
              y={90}
              stroke="#4a5450"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "90%",
                position: "right",
                fill: "#4a5450",
                fontSize: 10,
                fontFamily: "JetBrains Mono, monospace",
              }}
            />

            {/* annotate the worst point */}
            {minRateEntry && minRateEntry.rate < 90 && (
              <ReferenceLine
                x={minRateEntry.date}
                stroke="#ff4444"
                strokeOpacity={0.3}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            <XAxis
              dataKey="date"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={35}
            />

            <Tooltip content={<RateTooltip />} cursor={{ stroke: "#252825", strokeWidth: 1 }} />

            <Line
              type="monotone"
              dataKey="rate"
              stroke="#4ade80"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.rate < 90) {
                  return (
                    <circle
                      key={`dot-${cx}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#ff4444"
                      stroke="none"
                    />
                  );
                }
                return (
                  <circle
                    key={`dot-${cx}`}
                    cx={cx}
                    cy={cy}
                    r={2}
                    fill="#4ade80"
                    stroke="none"
                  />
                );
              }}
              activeDot={{ r: 5, fill: "#b8f53a", strokeWidth: 0 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
}