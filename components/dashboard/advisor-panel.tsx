"use client";

import { useMemo } from "react";
import type { UserProfile } from "@/lib/finance-types";
import { computeAdvisorSummary, type FinancialSummary } from "@/lib/advisor-engine";

interface Props {
  profile: UserProfile;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  monthlyDebtPayment: number;
  totalInvestments: number;
  emergencyFundMonths: number;
  highestDebtRate: number;
  unusedSubscriptions: number;
  insuranceCoverage: number;
  onNavigate: (tab: string) => void;
}

const PRIORITY_COLORS = {
  high: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400" },
  low: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
};

export function AdvisorPanel({ profile, onNavigate, ...ctx }: Props) {
  const summary: FinancialSummary = useMemo(() => computeAdvisorSummary(profile, ctx), [profile, ctx]);

  const scoreColor = summary.healthScore >= 75 ? "text-emerald-400" : summary.healthScore >= 50 ? "text-amber-400" : "text-rose-400";
  const scoreBarColor = summary.healthScore >= 75 ? "bg-emerald-500" : summary.healthScore >= 50 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="space-y-5">
      {/* Greeting + Health Score */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">{summary.greeting}</h2>
            <p className="text-[0.82rem] text-[var(--text-secondary)] mt-1">{summary.oneLiner}</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${scoreColor}`}>{summary.healthScore}</p>
            <p className="text-[0.6rem] text-[var(--text-muted)] uppercase tracking-wider">Health</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-card)] overflow-hidden">
          <div className={`h-full rounded-full ${scoreBarColor} transition-all duration-700`} style={{ width: `${summary.healthScore}%` }} />
        </div>
      </div>

      {/* Priority Action */}
      <div className="bg-gradient-to-r from-indigo-500/[0.06] to-purple-500/[0.04] border border-indigo-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
            <span className="text-xl">{summary.priorityAction.icon}</span>
          </div>
          <div className="flex-1">
            <p className="text-[0.65rem] uppercase tracking-[0.08em] font-semibold text-indigo-400 mb-1">Priority Action</p>
            <h3 className="text-[0.92rem] font-semibold text-[var(--text-heading)]">{summary.priorityAction.title}</h3>
            <p className="text-[0.78rem] text-[var(--text-secondary)] mt-1 leading-relaxed">{summary.priorityAction.description}</p>
            <span className="inline-block mt-2 text-[0.68rem] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              {summary.priorityAction.impact}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Log Expense", icon: "💸", tab: "daily-expenses" },
          { label: "Check Budget", icon: "📊", tab: "budget" },
          { label: "Record Income", icon: "💵", tab: "income" },
          { label: "Review Loans", icon: "🏦", tab: "loans" },
        ].map((a) => (
          <button key={a.tab} onClick={() => onNavigate(a.tab)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-card)] hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all"
          >
            <span className="text-xl">{a.icon}</span>
            <span className="text-[0.72rem] font-medium text-[var(--text-secondary)]">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Plain English Summary */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📝</span>
          <p className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Your Money in Plain English</p>
        </div>
        <p className="text-[0.82rem] text-[var(--text-secondary)] leading-relaxed">{summary.plainEnglish}</p>
      </div>

      {/* Weekly Tip */}
      <div className="flex items-start gap-3 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-semibold text-amber-400 mb-1">Weekly Money Move</p>
          <p className="text-[0.78rem] text-[var(--text-secondary)] leading-relaxed">{summary.weeklyTip}</p>
        </div>
      </div>

      {/* More Actions */}
      {summary.actions.length > 1 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <p className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-3">Recommended Actions</p>
          <div className="space-y-2.5">
            {summary.actions.slice(1, 4).map((action) => {
              const colors = PRIORITY_COLORS[action.priority];
              return (
                <div key={action.id} className={`flex items-center gap-3 p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <span className="text-lg">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.78rem] font-medium text-[var(--text-heading)] truncate">{action.title}</p>
                    <p className="text-[0.68rem] text-[var(--text-muted)] truncate">{action.impact}</p>
                  </div>
                  <span className={`text-[0.6rem] uppercase font-bold ${colors.text}`}>{action.priority}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
