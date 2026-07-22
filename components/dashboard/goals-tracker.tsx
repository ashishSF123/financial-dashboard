"use client";

import { useState } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface FinancialGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  priority: "high" | "medium" | "low";
  icon: string;
  color: string;
}

interface Props {
  data: FinancialData;
  monthlySurplus: number;
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function monthsUntil(deadline: string): number {
  const d = new Date(deadline);
  const now = new Date();
  return Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()));
}

const defaultGoals: FinancialGoal[] = [
  { id: "g1", name: "Emergency Fund", target: 500000, current: 120000, deadline: "2027-06", priority: "high", icon: "🛡️", color: "#f43f5e" },
  { id: "g2", name: "Daughter's Education", target: 5000000, current: 500000, deadline: "2040-06", priority: "high", icon: "🎓", color: "#8b5cf6" },
  { id: "g3", name: "Gold Loan Closure", target: 6340346, current: 0, deadline: "2027-12", priority: "high", icon: "🏆", color: "#f59e0b" },
  { id: "g4", name: "Family Vacation Fund", target: 200000, current: 35000, deadline: "2027-01", priority: "medium", icon: "✈️", color: "#06b6d4" },
  { id: "g5", name: "New Vehicle", target: 1500000, current: 0, deadline: "2028-06", priority: "low", icon: "🚗", color: "#10b981" },
];

export function GoalsTracker({ data, monthlySurplus }: Props) {
  const [goals, setGoals] = useState<FinancialGoal[]>(defaultGoals);
  const [showAddForm, setShowAddForm] = useState(false);

  const totalTargeted = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);
  const overallProgress = (totalSaved / totalTargeted) * 100;

  const availableSurplus = Math.max(0, monthlySurplus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)] flex items-center gap-2">
            <span className="text-lg">🎯</span> Financial Goals
          </h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] leading-relaxed mt-1">Track progress toward your savings targets</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-all"
        >
          + Add Goal
        </button>
      </div>

      {/* Overall Progress */}
      <div className="bg-gradient-to-br from-indigo-500/[0.06] to-purple-500/[0.03] border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-heading)]">Overall Progress</p>
            <p className="text-[0.68rem] text-[var(--text-muted)] mt-0.5">{goals.length} active goals · {formatINR(totalSaved)} saved of {formatINR(totalTargeted)}</p>
          </div>
          <p className="text-2xl font-bold text-indigo-400">{overallProgress.toFixed(1)}%</p>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${Math.min(100, overallProgress)}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[0.68rem] text-[var(--text-muted)]">
          <span>Available monthly surplus: <span className={monthlySurplus >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatINR(availableSurplus)}</span></span>
          <span>Suggested split: {formatINR(availableSurplus / Math.max(1, goals.filter((g) => g.priority === "high").length))}/goal (high priority)</span>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">New Goal</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const fd = new FormData(form);
            const newGoal: FinancialGoal = {
              id: `g-${Date.now()}`,
              name: fd.get("name") as string || "Untitled Goal",
              target: Number(fd.get("target")) || 100000,
              current: 0,
              deadline: fd.get("deadline") as string || "2028-01",
              priority: "medium",
              icon: "💰",
              color: "#6366f1",
            };
            setGoals((prev) => [...prev, newGoal]);
            setShowAddForm(false);
          }}>
            <div className="grid grid-cols-3 gap-3">
              <input name="name" placeholder="Goal name" className="text-xs bg-[var(--bg-card-hover)] border border-white/[0.1] rounded-lg px-3 py-2 text-[var(--text-heading)] outline-none placeholder-[var(--text-muted)] focus:border-indigo-500/50" />
              <input name="target" type="number" placeholder="Target ₹" className="text-xs bg-[var(--bg-card-hover)] border border-white/[0.1] rounded-lg px-3 py-2 text-[var(--text-heading)] outline-none placeholder-[var(--text-muted)] focus:border-indigo-500/50" />
              <input name="deadline" type="month" className="text-xs bg-[var(--bg-card-hover)] border border-white/[0.1] rounded-lg px-3 py-2 text-[var(--text-heading)] outline-none focus:border-indigo-500/50" />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">Create</button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-xs text-[var(--text-muted)] border border-[var(--border-card)] rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = (goal.current / goal.target) * 100;
          const remaining = goal.target - goal.current;
          const monthsLeft = monthsUntil(goal.deadline);
          const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
          const isOnTrack = monthlyNeeded <= availableSurplus / goals.filter((g) => g.priority === goal.priority).length;
          const status = pct >= 100 ? "complete" : isOnTrack ? "on-track" : "behind";

          return (
            <div key={goal.id} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-5 group relative">
              {/* Delete button */}
              <button
                onClick={() => setGoals((prev) => prev.filter((g) => g.id !== goal.id))}
                className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{goal.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{goal.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ${
                      goal.priority === "high" ? "bg-rose-500/15 text-rose-400" :
                      goal.priority === "medium" ? "bg-amber-500/15 text-amber-400" :
                      "bg-slate-500/15 text-[var(--text-secondary)]"
                    }`}>{goal.priority}</span>
                    <span className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ${
                      status === "complete" ? "bg-emerald-500/15 text-emerald-400" :
                      status === "on-track" ? "bg-blue-500/15 text-blue-400" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>{status === "complete" ? "COMPLETE" : status === "on-track" ? "ON TRACK" : "BEHIND"}</span>
                  </div>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
                    <circle
                      cx="30" cy="30" r="24" fill="none"
                      stroke={goal.color}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${Math.min(100, pct) * 1.508} 151`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--text-heading)]">{Math.round(pct)}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Saved: <span className="text-[var(--text-secondary)]">{formatINR(goal.current)}</span></span>
                    <span>Target: <span className="text-[var(--text-secondary)]">{formatINR(goal.target)}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: goal.color }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Remaining: {formatINR(remaining)}</span>
                    <span>By {goal.deadline}</span>
                  </div>
                </div>
              </div>

              {/* Monthly contribution needed */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-[0.68rem] text-[var(--text-muted)]">Monthly contribution needed</span>
                <span className={`text-xs font-medium ${monthlyNeeded > availableSurplus ? "text-rose-400" : "text-emerald-400"}`}>
                  {formatINR(monthlyNeeded)}/mo
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocation Suggestion */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-3">Suggested Monthly Allocation</h3>
        <p className="text-[0.68rem] text-[var(--text-muted)] mb-4">Based on your surplus of {formatINR(availableSurplus)} and goal priorities</p>
        <div className="space-y-2">
          {goals.sort((a, b) => {
            const p = { high: 0, medium: 1, low: 2 };
            return p[a.priority] - p[b.priority];
          }).map((goal) => {
            const monthsLeft = monthsUntil(goal.deadline);
            const remaining = goal.target - goal.current;
            const needed = monthsLeft > 0 ? remaining / monthsLeft : 0;
            const allocated = Math.min(needed, availableSurplus * (goal.priority === "high" ? 0.5 : goal.priority === "medium" ? 0.3 : 0.2) / Math.max(1, goals.filter((g) => g.priority === goal.priority).length));

            return (
              <div key={goal.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--bg-card)]">
                <span>{goal.icon}</span>
                <span className="text-xs text-[var(--text-secondary)] flex-1">{goal.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (allocated / Math.max(1, availableSurplus)) * 100)}%`, background: goal.color }} />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] w-16 text-right">{formatINR(allocated)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
