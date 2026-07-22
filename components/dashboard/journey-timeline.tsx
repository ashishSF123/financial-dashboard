"use client";

import { useState, useEffect, useMemo } from "react";
import type { UserProfile, JourneyMilestone } from "@/lib/finance-types";
import { getMilestones, addMilestone, getNetWorthHistory } from "@/lib/finance-store";
import { formatCurrency } from "@/lib/format-currency";

interface Props {
  profile: UserProfile;
  currentNetWorth: number;
  totalDebt: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export function JourneyTimeline({ profile, currentNetWorth, totalDebt, monthlyIncome, monthlyExpenses }: Props) {
  const [milestones, setMilestones] = useState<JourneyMilestone[]>([]);

  useEffect(() => {
    setMilestones(getMilestones());
  }, []);

  const fmt = (n: number) => formatCurrency(n, profile.currency, profile.numberFormat);

  // Auto-detect milestones
  useEffect(() => {
    const existing = getMilestones();
    const existingIds = new Set(existing.map((m) => m.title));

    if (totalDebt === 0 && !existingIds.has("Debt Free!")) {
      addMilestone({ title: "Debt Free!", description: "Congratulations — you have zero debt!", type: "debt", icon: "🎉" });
    }

    const surplus = monthlyIncome - monthlyExpenses;
    const emergencyMonths = surplus > 0 ? (currentNetWorth / monthlyExpenses) : 0;
    if (emergencyMonths >= 3 && !existingIds.has("3-Month Emergency Fund")) {
      addMilestone({ title: "3-Month Emergency Fund", description: "You have 3+ months of expenses saved.", type: "savings", icon: "🛡️" });
    }
    if (emergencyMonths >= 6 && !existingIds.has("6-Month Emergency Fund")) {
      addMilestone({ title: "6-Month Emergency Fund", description: "You have 6+ months of expenses saved.", type: "savings", icon: "💪" });
    }

    setMilestones(getMilestones());
  }, [totalDebt, currentNetWorth, monthlyIncome, monthlyExpenses]);

  // Net worth history for sparkline
  const netWorthHistory = useMemo(() => {
    const history = getNetWorthHistory();
    return history.slice(-6).map((h) => h.netWorth);
  }, []);

  // Projection: months to debt-free
  const monthsToDebtFree = useMemo(() => {
    if (totalDebt <= 0) return 0;
    const surplus = monthlyIncome - monthlyExpenses;
    if (surplus <= 0) return Infinity;
    return Math.ceil(totalDebt / surplus);
  }, [totalDebt, monthlyIncome, monthlyExpenses]);

  const projectedFreedomDate = useMemo(() => {
    if (monthsToDebtFree === 0) return "You're debt-free!";
    if (monthsToDebtFree === Infinity) return "Focus on reducing expenses first";
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToDebtFree);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [monthsToDebtFree]);

  // Mini sparkline as CSS bars
  const maxNW = Math.max(...netWorthHistory, 1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">My Financial Journey</h2>
        <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">Your progress, milestones, and projected path to financial freedom</p>
      </div>

      {/* Current Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1">Net Worth</p>
          <p className={`text-xl font-bold ${currentNetWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmt(currentNetWorth)}</p>
          {/* Mini sparkline */}
          {netWorthHistory.length > 1 && (
            <div className="flex items-end gap-0.5 h-6 mt-2">
              {netWorthHistory.map((v, i) => (
                <div key={i} className={`flex-1 rounded-sm transition-all ${v >= 0 ? "bg-emerald-500/40" : "bg-rose-500/40"}`}
                  style={{ height: `${Math.max(10, (Math.abs(v) / maxNW) * 100)}%` }} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1">Debt Freedom</p>
          <p className="text-xl font-bold text-indigo-400">{projectedFreedomDate}</p>
          {monthsToDebtFree > 0 && monthsToDebtFree < Infinity && (
            <p className="text-[0.7rem] text-[var(--text-muted)] mt-1">{monthsToDebtFree} months at current pace</p>
          )}
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1">Milestones Achieved</p>
          <p className="text-xl font-bold text-amber-400">{milestones.length}</p>
          <p className="text-[0.7rem] text-[var(--text-muted)] mt-1">Keep going — each one counts</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] mb-4">Milestones</h3>
        {milestones.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">🌱</div>
            <p className="text-[0.85rem] text-[var(--text-secondary)]">Your journey is just beginning</p>
            <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">Milestones will appear as you make progress — keep tracking your finances!</p>
          </div>
        ) : (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/50 via-amber-500/30 to-emerald-500/50" />
            {milestones.slice().reverse().map((m) => (
              <div key={m.id} className="relative flex items-start gap-4 py-3">
                <div className="absolute left-[-16px] w-4 h-4 rounded-full bg-[var(--bg-primary)] border-2 border-indigo-500/50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{m.icon}</span>
                    <p className="text-[0.82rem] font-medium text-[var(--text-heading)]">{m.title}</p>
                  </div>
                  <p className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">{m.description}</p>
                  <p className="text-[0.6rem] text-[var(--text-muted)] mt-1">
                    {new Date(m.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Goals Progress */}
      {profile.goals.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
          <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] mb-4">Your Goals</h3>
          <div className="space-y-3">
            {profile.goals.map((goal) => {
              const GOAL_META: Record<string, { label: string; icon: string }> = {
                debt_free: { label: "Become Debt-Free", icon: "🎯" },
                emergency_fund: { label: "Emergency Fund", icon: "🛡️" },
                retirement: { label: "Retirement Planning", icon: "🏖️" },
                wealth_building: { label: "Build Wealth", icon: "📈" },
                home_purchase: { label: "Buy a Home", icon: "🏠" },
                education: { label: "Education Fund", icon: "🎓" },
                travel: { label: "Travel Fund", icon: "✈️" },
              };
              const meta = GOAL_META[goal] || { label: goal, icon: "🎯" };
              const isAchieved = goal === "debt_free" && totalDebt === 0;

              return (
                <div key={goal} className={`flex items-center gap-3 p-3 rounded-xl border ${isAchieved ? "border-emerald-500/30 bg-emerald-500/[0.04]" : "border-[var(--border-card)]"}`}>
                  <span className="text-lg">{meta.icon}</span>
                  <p className={`text-[0.82rem] font-medium flex-1 ${isAchieved ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>{meta.label}</p>
                  {isAchieved && <span className="text-[0.65rem] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACHIEVED</span>}
                  {!isAchieved && <span className="text-[0.65rem] px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)]">In Progress</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
