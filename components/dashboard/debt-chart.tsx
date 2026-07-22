"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatINR } from "./kpi-cards";

interface DebtChartProps {
  goldDebt: number;
  houseLoan: number;
  borrowed: number;
  lease: number;
}

export function DebtChart({ goldDebt, houseLoan, borrowed, lease }: DebtChartProps) {
  const data = [
    { name: "Gold Loan", value: goldDebt, color: "#F59E0B" },
    { name: "House Loan", value: houseLoan, color: "#6366F1" },
    { name: "Borrowed", value: borrowed, color: "#F43F5E" },
    { name: "Lease", value: lease, color: "#06B6D4" },
  ];

  return (
    <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[var(--text-heading)] text-[0.88rem] font-semibold tracking-[-0.01em]">Debt Breakdown</h3>
          <span className="text-[10px] text-[var(--text-muted)] font-medium">By category</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
            <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} width={40} />
            <Tooltip
              contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-card)", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
              labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
              formatter={(value: number) => [formatINR(value), "Amount"]}
              cursor={{ fill: "rgba(255,255,255,0.02)" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
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
