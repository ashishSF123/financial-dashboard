"use client";

import { useMemo, useState } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface Props {
  data: FinancialData;
}

interface BudgetCategory {
  name: string;
  budgetLimit: number;
  actual: number;
  color: string;
}

function formatINR(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const defaultBudgets: Record<string, { limit: number; color: string }> = {
  "Chit Fund": { limit: 110000, color: "#8b5cf6" },
  "EMI": { limit: 80000, color: "#6366f1" },
  "Interest Payments": { limit: 75000, color: "#f59e0b" },
  "Household": { limit: 30000, color: "#10b981" },
  "Bills": { limit: 15000, color: "#06b6d4" },
  "Transport": { limit: 8000, color: "#f43f5e" },
  "Other": { limit: 20000, color: "#64748b" },
};

export function BudgetTracker({ data }: Props) {
  const [budgets, setBudgets] = useState(defaultBudgets);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const categories: BudgetCategory[] = useMemo(() => {
    const grouped: Record<string, number> = {};

    // Group expenses by type
    data.expenses.forEach((exp) => {
      const cat = exp.type?.toLowerCase().includes("chit") ? "Chit Fund" :
                  exp.type?.toLowerCase().includes("household") ? "Household" :
                  exp.type?.toLowerCase().includes("bill") ? "Bills" :
                  exp.type?.toLowerCase().includes("transport") ? "Transport" : "Other";
      grouped[cat] = (grouped[cat] || 0) + exp.amount;
    });

    // Add EMI
    const totalEmi = data.houseLoans.reduce((s, h) => s + h.emiAmount, 0);
    if (totalEmi > 0) grouped["EMI"] = totalEmi;

    // Add interest payments
    const totalInterest = data.goldLoans.reduce((s, g) => s + g.monthlyInterest, 0) +
                          data.borrowed.reduce((s, b) => s + b.monthlyInterest, 0);
    if (totalInterest > 0) grouped["Interest Payments"] = totalInterest;

    return Object.entries(budgets).map(([name, config]) => ({
      name,
      budgetLimit: config.limit,
      actual: grouped[name] || 0,
      color: config.color,
    })).filter((c) => c.actual > 0 || c.budgetLimit > 0);
  }, [data, budgets]);

  const totalBudget = categories.reduce((s, c) => s + c.budgetLimit, 0);
  const totalActual = categories.reduce((s, c) => s + c.actual, 0);
  const overBudget = categories.filter((c) => c.actual > c.budgetLimit);
  const saved = Math.max(0, totalBudget - totalActual);

  const handleBudgetChange = (category: string, newLimit: number) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: { ...prev[category], limit: newLimit },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white flex items-center gap-2">
          Monthly Spending Plan
        </h2>
        <p className="text-[0.78rem] text-slate-500 leading-relaxed mt-1">Your planned vs actual spending across all categories</p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-slate-500 mb-1">Monthly Planned</p>
          <p className="text-[1.3rem] font-bold tracking-tight text-white">{formatINR(totalBudget)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-slate-500 mb-1">Actual Spent</p>
          <p className={`text-[1.3rem] font-bold tracking-tight ${totalActual > totalBudget ? "text-rose-400" : "text-white"}`}>{formatINR(totalActual)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-slate-500 mb-1">Net Savings</p>
          <p className={`text-[1.3rem] font-bold tracking-tight ${saved > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {saved > 0 ? formatINR(saved) : `-${formatINR(totalActual - totalBudget)}`}
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-slate-500 mb-1">Overspent Areas</p>
          <p className={`text-[1.3rem] font-bold tracking-tight ${overBudget.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {overBudget.length > 0 ? `${overBudget.length}` : "None"}
          </p>
        </div>
      </div>

      {/* Overall Progress Ring */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-8">
          {/* Circular progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={totalActual > totalBudget ? "#f43f5e" : "#10b981"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, (totalActual / totalBudget) * 100) * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold text-white">{Math.round((totalActual / totalBudget) * 100)}%</p>
              <p className="text-[9px] text-slate-500">used</p>
            </div>
          </div>

          {/* Category breakdown mini bars */}
          <div className="flex-1 space-y-2">
            {categories.slice(0, 5).map((cat) => {
              const pct = Math.min(100, (cat.actual / cat.budgetLimit) * 100);
              return (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-[10px] text-slate-400 w-24 truncate">{cat.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct > 100 ? "#f43f5e" : pct > 80 ? "#f59e0b" : cat.color }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-10 text-right">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const pct = (cat.actual / cat.budgetLimit) * 100;
          const isOver = pct > 100;
          const isWarning = pct > 80 && pct <= 100;

          return (
            <div key={cat.name} className={`bg-white/[0.02] border rounded-xl p-4 ${
              isOver ? "border-rose-500/30" : isWarning ? "border-amber-500/20" : "border-white/[0.06]"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: cat.color }} />
                  <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOver && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">OVER</span>}
                  {isWarning && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">WARNING</span>}
                  {!isOver && !isWarning && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">OK</span>}
                </div>
              </div>

              {/* Amount display */}
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-lg font-bold text-white">{formatINR(cat.actual)}</p>
                <p className="text-xs text-slate-500">/ {formatINR(cat.budgetLimit)}</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, pct)}%`,
                    background: isOver ? "#f43f5e" : isWarning ? "#f59e0b" : cat.color,
                  }}
                />
              </div>

              {/* Edit budget limit */}
              <div className="flex items-center justify-between">
                <p className="text-[0.68rem] text-slate-500">
                  {isOver ? `Over by ${formatINR(cat.actual - cat.budgetLimit)}` : `${formatINR(cat.budgetLimit - cat.actual)} remaining`}
                </p>
                {editingCategory === cat.name ? (
                  <input
                    type="number"
                    autoFocus
                    className="w-20 text-xs bg-white/[0.05] border border-white/[0.1] rounded px-2 py-0.5 text-white outline-none focus:border-indigo-500/50"
                    defaultValue={cat.budgetLimit}
                    onBlur={(e) => {
                      handleBudgetChange(cat.name, Number(e.target.value) || cat.budgetLimit);
                      setEditingCategory(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBudgetChange(cat.name, Number((e.target as HTMLInputElement).value) || cat.budgetLimit);
                        setEditingCategory(null);
                      }
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setEditingCategory(cat.name)}
                    className="text-[10px] text-indigo-400/60 hover:text-indigo-400 transition-colors"
                  >
                    Edit limit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spending Insight */}
      <div className="bg-gradient-to-br from-indigo-500/[0.05] to-purple-500/[0.03] border border-indigo-500/20 rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-white tracking-[-0.01em] mb-3">Spending Insight</h3>
        <div className="space-y-2 text-xs text-slate-400">
          {overBudget.length > 0 && (
            <p className="flex items-center gap-2">
              <span className="text-rose-400">⚠️</span>
              <span>{overBudget.map((c) => c.name).join(", ")} {overBudget.length === 1 ? "is" : "are"} over budget. Consider reducing or reallocating.</span>
            </p>
          )}
          {categories.filter((c) => (c.actual / c.budgetLimit) > 0.8 && (c.actual / c.budgetLimit) <= 1).length > 0 && (
            <p className="flex items-center gap-2">
              <span className="text-amber-400">⏰</span>
              <span>Some categories are nearing their limit — watch spending in the remaining days.</span>
            </p>
          )}
          <p className="flex items-center gap-2">
            <span className="text-indigo-400">💡</span>
            <span>Chit Funds and EMIs are fixed obligations ({formatINR(categories.filter((c) => c.name === "Chit Fund" || c.name === "EMI").reduce((s, c) => s + c.actual, 0))}/mo). Focus on controlling variable expenses.</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Monthly credit: {formatINR(data.monthlyCredit)} · Fixed outflows: {formatINR(totalActual)} · Discretionary: {formatINR(Math.max(0, data.monthlyCredit - totalActual))}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
