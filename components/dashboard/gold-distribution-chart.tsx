"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { FinancialData } from "@/lib/parse-excel";

interface GoldDistributionChartProps {
  goldLoans: FinancialData["goldLoans"];
}

const COLORS = ["#6366F1", "#F59E0B", "#10B981", "#F43F5E", "#06B6D4", "#A855F7", "#EC4899"];

export function GoldDistributionChart({ goldLoans }: GoldDistributionChartProps) {
  const byVendor: Record<string, number> = {};
  goldLoans.forEach((g) => {
    const vendor = g.vendor || "Unknown";
    byVendor[vendor] = (byVendor[vendor] || 0) + g.goldWeight;
  });

  const data = Object.entries(byVendor).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[#12131a] border border-white/[0.06] rounded-2xl p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.01] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white text-[0.88rem] font-semibold tracking-[-0.01em]">Gold Distribution by Bank</h3>
          <span className="text-[10px] text-amber-400/60 font-medium">{total.toFixed(1)}g total</span>
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
              contentStyle={{ background: "#1a1b24", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 11, padding: "8px 12px" }}
              labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
              formatter={(value: number) => [`${value}g (${((value / total) * 100).toFixed(1)}%)`, "Weight"]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-3">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] text-slate-400 font-medium">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
