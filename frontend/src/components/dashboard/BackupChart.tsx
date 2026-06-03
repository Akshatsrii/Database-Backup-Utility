"use client";

import {
  AreaChart, Area,
  XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  LineChart, Line,
  CartesianGrid, ReferenceLine,
  TooltipProps,
} from "recharts";
import { formatBytes } from "@/lib/utils";
import type { DashboardStats } from "@/types";

// ─── Shared ───────────────────────────────────────────────────────────────────

const FONT = "'JetBrains Mono','Fira Code',monospace";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "#0f1210",
  border: "1px solid #252825",
  borderRadius: 8,
  fontFamily: FONT,
  fontSize: 12,
  color: "#e8edea",
  padding: "10px 14px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
};

const AXIS_TICK = {
  fill: "#4a5450",
  fontSize: 10,
  fontFamily: FONT,
};

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function StorageTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4a5450", fontSize: 10, marginBottom: 6, letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ color: "#b8f53a", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#4a5450" }}>size</span>
        <span style={{ fontWeight: 700 }}>{formatBytes(val)}</span>
      </p>
    </div>
  );
}

function RateTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  const color = val >= 90 ? "#4ade80" : val >= 70 ? "#fbbf24" : "#ff4444";
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ color: "#4a5450", fontSize: 10, marginBottom: 6, letterSpacing: "0.5px" }}>{label}</p>
      <p style={{ color, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#4a5450" }}>rate</span>
        <span style={{ fontWeight: 700 }}>{val}%</span>
      </p>
    </div>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────

interface CardProps {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

function ChartCard({ title, meta, children }: CardProps) {
  return (
    <div
      style={{
        background: "#141714",
        border: "1px solid #252825",
        borderRadius: 12,
        padding: "18px 16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: FONT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#4a5450",
          }}
        >
          {title}
        </p>
        {meta}
      </div>
      {children}
    </div>
  );
}

// ─── Metric Pill ──────────────────────────────────────────────────────────────

function MetaPill({ value, color }: { value: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        color,
        background: `${color}14`,
        border: `1px solid ${color}30`,
        borderRadius: 5,
        padding: "2px 8px",
        letterSpacing: "0.3px",
      }}
    >
      {value}
    </span>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BackupChart({ stats }: { stats: DashboardStats }) {
  const sizeHistory = stats.backupsSizeHistory ?? [];
  const rateHistory = stats.successRateHistory ?? [];

  const latestSize  = sizeHistory.at(-1)?.bytes ?? null;
  const latestRate  = rateHistory.at(-1)?.rate  ?? null;

  const avgRate = rateHistory.length
    ? Math.round(rateHistory.reduce((s, r) => s + r.rate, 0) / rateHistory.length)
    : null;

  const minRateEntry = rateHistory.length
    ? rateHistory.reduce((a, b) => (a.rate <= b.rate ? a : b))
    : null;

  const rateColor = (r: number) => r >= 90 ? "#4ade80" : r >= 70 ? "#fbbf24" : "#ff4444";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}
    >
      {/* ── Storage Growth ── */}
      <ChartCard
        title="storage_growth"
        meta={
          latestSize != null
            ? <MetaPill value={formatBytes(latestSize)} color="#b8f53a" />
            : null
        }
      >
        <ResponsiveContainer width="100%" height={168}>
          <AreaChart data={sizeHistory} margin={{ top: 6, right: 2, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="acidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#b8f53a" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#b8f53a" stopOpacity={0}    />
              </linearGradient>
              {/* subtle glow on the line */}
              <filter id="lineGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <CartesianGrid stroke="#1e211e" strokeDasharray="4 4" vertical={false} />

            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatBytes(v, 0)}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={56}
            />

            <Tooltip
              content={<StorageTooltip />}
              cursor={{ stroke: "#252825", strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="bytes"
              stroke="#b8f53a"
              strokeWidth={2}
              fill="url(#acidGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#b8f53a", stroke: "#0f1210", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* mini legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#4a5450" }}>
          <span style={{ width: 16, height: 2, background: "#b8f53a", borderRadius: 1, display: "inline-block" }} />
          cumulative backup size over time
        </div>
      </ChartCard>

      {/* ── Success Rate ── */}
      <ChartCard
        title="success_rate_%"
        meta={
          avgRate != null
            ? <MetaPill value={`avg ${avgRate}%`} color={rateColor(avgRate)} />
            : null
        }
      >
        <ResponsiveContainer width="100%" height={168}>
          <LineChart data={rateHistory} margin={{ top: 6, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1e211e" strokeDasharray="4 4" vertical={false} />

            {/* 90% threshold */}
            <ReferenceLine
              y={90}
              stroke="#2e332e"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "90%",
                position: "right",
                fill: "#4a5450",
                fontSize: 9,
                fontFamily: FONT,
              }}
            />

            {/* worst point vertical marker */}
            {minRateEntry && minRateEntry.rate < 90 && (
              <ReferenceLine
                x={minRateEntry.date}
                stroke="#ff4444"
                strokeOpacity={0.25}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}`}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={30}
            />

            <Tooltip
              content={<RateTooltip />}
              cursor={{ stroke: "#252825", strokeWidth: 1 }}
            />

            <Line
              type="monotone"
              dataKey="rate"
              stroke="#4ade80"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const bad = payload.rate < 90;
                return (
                  <circle
                    key={`dot-${cx}`}
                    cx={cx} cy={cy}
                    r={bad ? 3.5 : 2.5}
                    fill={bad ? "#ff4444" : "#4ade80"}
                    stroke={bad ? "rgba(255,68,68,0.3)" : "none"}
                    strokeWidth={bad ? 4 : 0}
                  />
                );
              }}
              activeDot={{ r: 5, fill: "#b8f53a", stroke: "#0f1210", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* mini legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "#4a5450" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 16, height: 2, background: "#4ade80", borderRadius: 1, display: "inline-block" }} />
            success
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff4444", display: "inline-block" }} />
            below 90%
          </span>
        </div>
      </ChartCard>
    </div>
  );
}