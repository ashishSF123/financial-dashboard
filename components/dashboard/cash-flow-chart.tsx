"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatINR } from "./kpi-cards";

interface CashFlowChartProps {
  credit: number;
  houseEmi: number;
  goldInterest: number;
  borrowedInterest: number;
  expenses: number;
}

export function CashFlowChart({ credit, houseEmi, goldInterest, borrowedInterest, expenses }: CashFlowChartProps) {
  const net = credit - houseEmi - goldInterest - borrowedInterest - expenses;
  const data = [
    { name: "Income", value: credit, color: "#10B981" },
    { name: "House EMI", value: -houseEmi, color: "#F43F5E" },
    { name: "Gold Int.", value: -goldInterest, color: "#F59E0B" },
    { name: "Borrowed", value: -borrowedInterest, color: "#A855F7" },
    { name: "Expenses", value: -expenses, color: "#F97316" },
    { name: "Net", value: net, color: net >= 0 ? "#10B981" : "#F43F5E" },
  ];

  return (
    <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.01] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[var(--text-heading)] text-[0.88rem] font-semibold tracking-[-0.01em]">Monthly Cash Flow</h3>
          <span className={`text-[10px] font-semibold ${net >= 0 ? "text-emerald-400/70" : "text-rose-400/70"}`}>
            Net: {formatINR(net)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
            <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 9, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} width={40} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-card)", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
              labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
              formatter={(value: number) => [formatINR(Math.abs(value)), value >= 0 ? "Inflow" : "Outflow"]}
              cursor={{ fill: "rgba(255,255,255,0.02)" }}
            />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
