"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from "@/lib/finance-types";
import type { DailyExpense } from "@/lib/finance-types";
import {
  getExpenses,
  addExpense,
  deleteExpense,
  getExpenseSummary,
  getBudgetLimits,
} from "@/lib/finance-store";
import { computeExpenseInsights } from "@/lib/insights-engine";
import { AIInsightsCard } from "./ai-insights-card";

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface Props {
  selectedMonth: string;
  onNavigate?: (tab: string) => void;
}

export function DailyExpenseTracker({ selectedMonth, onNavigate }: Props) {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof getExpenseSummary> | null>(null);
  const [budgets, setBudgets] = useState<ReturnType<typeof getBudgetLimits>>([]);

  // Form state
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [formPayMethod, setFormPayMethod] = useState<DailyExpense["paymentMethod"]>("UPI");

  const refresh = useCallback(() => {
    setExpenses(getExpenses({ month: selectedMonth }));
    setSummary(getExpenseSummary(selectedMonth));
    setBudgets(getBudgetLimits());
  }, [selectedMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;
    addExpense({
      date: formDate,
      amount,
      category: formCategory,
      description: formDescription,
      paymentMethod: formPayMethod,
    });
    setFormAmount("");
    setFormDescription("");
    setShowForm(false);
    refresh();
  };

  // Live budget check for the selected category in the form
  const activeBudget = budgets.find((b) => b.category === formCategory);
  const categorySpent = summary?.byCategory[formCategory] || 0;
  const formAmount_num = parseFloat(formAmount) || 0;
  const afterExpense = categorySpent + formAmount_num;
  const budgetRemaining = activeBudget ? activeBudget.monthlyLimit - categorySpent : null;
  const wouldExceed = activeBudget && afterExpense > activeBudget.monthlyLimit;
  const wouldWarn = activeBudget && afterExpense >= activeBudget.monthlyLimit * (activeBudget.alertThreshold || 0.8) && !wouldExceed;

  const handleDelete = (id: string) => {
    deleteExpense(id);
    refresh();
  };

  const topCategories = summary
    ? Object.entries(summary.byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white">
            Daily Expenses
          </h2>
          <p className="text-[0.78rem] text-slate-500 mt-0.5">
            Track every rupee — category-focused insights
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[0.75rem] font-medium hover:bg-indigo-500/30 transition-colors"
        >
          <span className="text-sm">+</span> Add Expense
        </button>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <div className="bg-[#12131a] border border-white/[0.08] rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5 block">Amount</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="₹ 0"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[0.85rem] text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 tabular-nums"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5 block">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[0.85rem] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#1a1b23] text-white">{CATEGORY_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5 block">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[0.85rem] text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500 mb-1.5 block">Payment</label>
              <select
                value={formPayMethod}
                onChange={(e) => setFormPayMethod(e.target.value as DailyExpense["paymentMethod"])}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[0.85rem] text-white focus:outline-none focus:border-indigo-500/50 appearance-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m} className="bg-[#1a1b23] text-white">{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Description (e.g., Swiggy dinner, Petrol HP pump)"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[0.85rem] text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-5 py-2 rounded-lg bg-indigo-500 text-white text-[0.78rem] font-semibold hover:bg-indigo-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-lg text-slate-400 text-[0.78rem] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Live budget indicator for selected category */}
          {activeBudget && (
            <div className={`mt-3 px-3 py-2.5 rounded-lg border ${wouldExceed ? "bg-rose-500/[0.06] border-rose-500/20" : wouldWarn ? "bg-amber-500/[0.05] border-amber-500/15" : "bg-white/[0.02] border-white/[0.06]"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[0.68rem] text-slate-400">
                  {CATEGORY_ICONS[formCategory]} <span className="font-medium">{formCategory}</span> monthly allocation
                </span>
                <span className={`text-[0.68rem] font-semibold tabular-nums ${wouldExceed ? "text-rose-400" : wouldWarn ? "text-amber-400" : "text-slate-300"}`}>
                  {formatINR(categorySpent)}{formAmount_num > 0 ? ` + ${formatINR(formAmount_num)}` : ""} / {formatINR(activeBudget.monthlyLimit)}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${wouldExceed ? "bg-rose-400" : wouldWarn ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${Math.min((afterExpense / activeBudget.monthlyLimit) * 100, 100)}%` }}
                />
              </div>
              {wouldExceed && (
                <p className="text-[0.62rem] text-rose-400 mt-1.5 font-medium">
                  ⚠️ This expense breaches your monthly cap by {formatINR(afterExpense - activeBudget.monthlyLimit)}
                </p>
              )}
              {wouldWarn && (
                <p className="text-[0.62rem] text-amber-400 mt-1.5 font-medium">
                  ⚡ After this, only {formatINR(activeBudget.monthlyLimit - afterExpense)} headroom remains
                </p>
              )}
              {!wouldExceed && !wouldWarn && budgetRemaining !== null && (
                <p className="text-[0.62rem] text-slate-500 mt-1.5">
                  Available capacity: {formatINR(budgetRemaining - formAmount_num)} after this disbursement
                </p>
              )}
            </div>
          )}
          {!activeBudget && formAmount_num > 0 && onNavigate && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
              <span className="text-[0.65rem] text-slate-500">No monthly cap set for {formCategory}</span>
              <button onClick={() => onNavigate("budget")} className="text-[0.65rem] text-indigo-400 hover:text-indigo-300 font-medium">
                Set allocation →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Today</p>
            <p className="text-[1.1rem] font-bold text-white tracking-tight mt-0.5">{formatINR(summary.todayTotal)}</p>
          </div>
          <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">This Week</p>
            <p className="text-[1.1rem] font-bold text-amber-400 tracking-tight mt-0.5">{formatINR(summary.weekTotal)}</p>
          </div>
          <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">This Month</p>
            <p className="text-[1.1rem] font-bold text-indigo-400 tracking-tight mt-0.5">{formatINR(summary.total)}</p>
          </div>
          <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Avg/Day</p>
            <p className="text-[1.1rem] font-bold text-emerald-400 tracking-tight mt-0.5">{formatINR(summary.avgPerDay)}</p>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <AIInsightsCard
        insights={useMemo(() => computeExpenseInsights(expenses, budgets, selectedMonth), [expenses, budgets, selectedMonth])}
        title="Spending Intelligence"
      />

      {/* Category Budget Cards */}
      {topCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[0.85rem] font-semibold text-white">Expense Utilization</h3>
            {onNavigate && (
              <button onClick={() => onNavigate("budget")} className="text-[0.65rem] text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Manage allocations →
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topCategories.map(([cat, spent]) => {
            const budget = budgets.find((b) => b.category === cat);
            const limit = budget?.monthlyLimit || 0;
            const pct = limit > 0 ? Math.min(spent / limit, 1) : 0;
            const isOver = limit > 0 && spent > limit;
            const isWarning = limit > 0 && pct >= (budget?.alertThreshold || 0.8);
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];

            return (
              <div key={cat} className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[cat] || "📌"}</span>
                    <span className="text-[0.72rem] font-medium text-slate-300">{cat}</span>
                  </div>
                  {limit > 0 && (
                    <span className={`text-[0.58rem] font-semibold ${isOver ? "text-rose-400" : isWarning ? "text-amber-400" : "text-slate-500"}`}>
                      {Math.round(pct * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[0.95rem] font-bold text-white tabular-nums">{formatINR(spent)}</span>
                  {limit > 0 && <span className="text-[0.65rem] text-slate-500">/ {formatINR(limit)}</span>}
                </div>
                {limit > 0 && (
                  <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-rose-400" : isWarning ? "bg-amber-400" : colors.dot.replace("bg-", "bg-")}`}
                      style={{ width: `${Math.min(pct * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}
      <div className="bg-[#12131a] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
          <h3 className="text-[0.85rem] font-semibold text-white tracking-[-0.01em]">
            Recent Transactions
          </h3>
          <span className="text-[0.68rem] text-slate-500">{expenses.length} entries</span>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-[0.85rem] text-slate-400 mb-1">No expenses recorded yet</p>
            <p className="text-[0.72rem] text-slate-600">Click "+ Add Expense" to start tracking</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {expenses.slice(0, 20).map((exp) => {
              const colors = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS["Other"];
              return (
                <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.015] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                      <span className="text-[0.7rem]">{CATEGORY_ICONS[exp.category] || "📌"}</span>
                    </div>
                    <div>
                      <p className="text-[0.8rem] text-slate-200 font-medium">
                        {exp.description || exp.category}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.65rem] text-slate-500">{formatDate(exp.date)}</span>
                        <span className="text-[0.5rem] text-slate-600">•</span>
                        <span className={`text-[0.65rem] ${colors.text} font-medium`}>{exp.category}</span>
                        <span className="text-[0.5rem] text-slate-600">•</span>
                        <span className="text-[0.65rem] text-slate-500">{exp.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.85rem] font-semibold text-white tabular-nums">{formatINR(exp.amount)}</span>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 text-[0.7rem] transition-all p-1"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expenses.length > 20 && (
          <div className="px-5 py-3 border-t border-white/[0.04] text-center">
            <span className="text-[0.68rem] text-slate-500">Showing 20 of {expenses.length} transactions</span>
          </div>
        )}
      </div>
    </div>
  );
}
