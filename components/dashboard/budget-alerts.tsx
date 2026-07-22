"use client";
import { formatINR } from "@/lib/format-currency";

import { useState, useEffect, useCallback } from "react";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/finance-types";
import type { BudgetLimit } from "@/lib/finance-types";
import {
  getBudgetLimits,
  setBudgetLimit,
  getExpenseSummary,
  getExpenses,
} from "@/lib/finance-store";


interface Props {
  selectedMonth: string;
  onNavigate?: (tab: string) => void;
}

export function BudgetAlerts({ selectedMonth, onNavigate }: Props) {
  const [budgets, setBudgets] = useState<BudgetLimit[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getExpenseSummary> | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Record<string, { desc: string; amount: number; date: string }[]>>({});

  const refresh = useCallback(() => {
    setBudgets(getBudgetLimits());
    setSummary(getExpenseSummary(selectedMonth));
    // Get recent expenses grouped by category
    const expenses = getExpenses({ month: selectedMonth });
    const grouped: Record<string, { desc: string; amount: number; date: string }[]> = {};
    expenses.forEach((e) => {
      if (!grouped[e.category]) grouped[e.category] = [];
      if (grouped[e.category].length < 3) {
        grouped[e.category].push({ desc: e.description || e.category, amount: e.amount, date: e.date });
      }
    });
    setRecentExpenses(grouped);
  }, [selectedMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSetLimit = (category: string) => {
    const limit = parseFloat(editLimit);
    if (!limit || limit <= 0) return;
    setBudgetLimit(category, limit);
    setEditingCategory(null);
    setEditLimit("");
    refresh();
  };

  // Categories with spending, sorted by usage
  const categoryData = EXPENSE_CATEGORIES.map((cat) => {
    const spent = summary?.byCategory[cat] || 0;
    const budget = budgets.find((b) => b.category === cat);
    const limit = budget?.monthlyLimit || 0;
    const pct = limit > 0 ? spent / limit : 0;
    const isOver = limit > 0 && spent > limit;
    const isWarning = limit > 0 && pct >= (budget?.alertThreshold || 0.8);
    return { category: cat, spent, limit, pct, isOver, isWarning, budget };
  }).sort((a, b) => b.spent - a.spent);

  const alertCount = categoryData.filter((c) => c.isOver || c.isWarning).length;
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = summary?.total || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">
            Monthly Expense Allocation
          </h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">
            Define spending caps per category and monitor cash outflow utilization
          </p>
        </div>
        {onNavigate && (
          <button onClick={() => onNavigate("daily-expenses")} className="text-[0.7rem] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            View transactions →
          </button>
        )}
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)]">Monthly Expense Summary</h3>
            {alertCount > 0 && (
              <span className="text-[0.6rem] font-semibold px-2 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20">
                {alertCount} breach{alertCount > 1 ? "es" : ""}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[1.3rem] font-bold text-[var(--text-heading)] tabular-nums">{formatINR(totalSpent)}</span>
            <span className="text-[0.75rem] text-[var(--text-muted)]">of {formatINR(totalBudget)} allocated</span>
          </div>
          <div className="h-2 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent > totalBudget ? "bg-rose-400" :
                totalSpent / totalBudget > 0.8 ? "bg-amber-400" :
                "bg-emerald-400"
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[0.68rem] text-[var(--text-muted)] mt-2">
            {totalBudget > totalSpent
              ? `Surplus capacity: ${formatINR(totalBudget - totalSpent)} unspent`
              : `Overspend: ${formatINR(totalSpent - totalBudget)} beyond allocation`
            }
          </p>
        </div>
      )}

      {/* Category Budget Cards */}
      <div className="space-y-2">
        {categoryData.map(({ category, spent, limit, pct, isOver, isWarning, budget }) => {
          const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS["Other"];
          const isEditing = editingCategory === category;

          return (
            <div
              key={category}
              className={`bg-[var(--bg-secondary)] border rounded-xl px-4 py-3 transition-colors ${
                isOver ? "border-rose-500/30" :
                isWarning ? "border-amber-500/20" :
                "border-[var(--border-card)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                    <span className="text-[0.7rem]">{CATEGORY_ICONS[category] || "📌"}</span>
                  </div>
                  <div>
                    <p className="text-[0.8rem] text-[var(--text-primary)] font-medium">{category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.65rem] text-[var(--text-muted)] tabular-nums">
                        Disbursed: {formatINR(spent)}
                      </span>
                      {limit > 0 && (
                        <>
                          <span className="text-[0.5rem] text-[var(--text-muted)]">•</span>
                          <span className="text-[0.65rem] text-[var(--text-muted)] tabular-nums">
                            Cap: {formatINR(limit)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {limit > 0 && (
                    <div className="text-right">
                      <span className={`text-[0.75rem] font-semibold tabular-nums ${
                        isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-[var(--text-secondary)]"
                      }`}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        placeholder="₹"
                        className="w-20 bg-[var(--bg-card-hover)] border border-white/[0.1] rounded px-2 py-1 text-[0.75rem] text-[var(--text-heading)] tabular-nums focus:outline-none focus:border-indigo-500/50"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSetLimit(category)}
                      />
                      <button
                        onClick={() => handleSetLimit(category)}
                        className="text-[0.65rem] text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => { setEditingCategory(null); setEditLimit(""); }}
                        className="text-[0.65rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingCategory(category); setEditLimit(limit > 0 ? String(limit) : ""); }}
                      className="text-[0.65rem] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      {limit > 0 ? "Revise cap" : "Set cap"}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {limit > 0 && (
                <div className="mt-2 h-1 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? "bg-rose-400" : isWarning ? "bg-amber-400" : colors.dot
                    }`}
                    style={{ width: `${Math.min(pct * 100, 100)}%` }}
                  />
                </div>
              )}

              {/* Alert message */}
              {isOver && (
                <p className="text-[0.62rem] text-rose-400 mt-1.5 font-medium">
                  ⚠️ Expense breach — overspent by {formatINR(spent - limit)}
                </p>
              )}
              {isWarning && !isOver && (
                <p className="text-[0.62rem] text-amber-400 mt-1.5 font-medium">
                  ⚡ Nearing threshold — {Math.round((1 - pct) * 100)}% headroom remaining
                </p>
              )}

              {/* Recent transactions for this category (expandable) */}
              {spent > 0 && (
                <button
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  className="text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] mt-1.5 transition-colors"
                >
                  {expandedCategory === category ? "▴ Hide transactions" : `▾ ${recentExpenses[category]?.length || 0} recent transactions`}
                </button>
              )}
              {expandedCategory === category && recentExpenses[category] && (
                <div className="mt-2 space-y-1 pl-11">
                  {recentExpenses[category].map((exp, i) => (
                    <div key={i} className="flex items-center justify-between text-[0.65rem]">
                      <span className="text-[var(--text-secondary)] truncate max-w-[60%]">{exp.desc}</span>
                      <span className="text-[var(--text-heading)] tabular-nums">{formatINR(exp.amount)}</span>
                    </div>
                  ))}
                  {onNavigate && (
                    <button onClick={() => onNavigate("daily-expenses")} className="text-[0.6rem] text-indigo-400 hover:text-indigo-300 mt-1">
                      See all →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
