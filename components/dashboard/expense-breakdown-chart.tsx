"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@/lib/format-currency";
import type { FinancialData } from "@/lib/parse-excel";

interface ExpenseBreakdownChartProps {
  expenses: FinancialData["expenses"];
}

const COLORS = ["#6366F1", "#F59E0B", "#10B981", "#F43F5E", "#06B6D4", "#A855F7", "#EC4899", "#84CC16"];

export function ExpenseBreakdownChart({ expenses }: ExpenseBreakdownChartProps) {
  const byType: Record<string, number> = {};
  expenses.forEach((e) => {
    const type = e.type || "Other";
    byType[type] = (byType[type] || 0) + e.amount;
  });

  const data = Object.entries(byType)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.01] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[var(--text-heading)] text-[0.88rem] font-semibold tracking-[-0.01em]">Monthly Expense Breakdown</h3>
          <span className="text-[10px] text-purple-400/60 font-medium">{formatINR(total)}/mo</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              stroke="none"
              paddingAngle={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-card)", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
              labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
              formatter={(value: number) => [formatINR(value), "Amount"]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
