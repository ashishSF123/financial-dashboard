"use client";

import { formatINR } from "@/lib/format-currency";

interface FinancialHealthProps {
  grandDebt: number;
  totalAssets: number;
  netWorth: number;
  monthlySurplus: number;
  monthlyCredit: number;
}

export function FinancialHealth({ grandDebt, totalAssets, netWorth, monthlySurplus, monthlyCredit }: FinancialHealthProps) {
  const debtToAsset = totalAssets > 0 ? (grandDebt / totalAssets) * 100 : 0;
  const healthStatus = debtToAsset < 50 ? "HEALTHY" : debtToAsset < 75 ? "MODERATE" : "AT RISK";
  const healthColor = debtToAsset < 50 ? "emerald" : debtToAsset < 75 ? "amber" : "rose";
  const savingsRate = monthlyCredit > 0 ? (monthlySurplus / monthlyCredit) * 100 : 0;

  const styles: Record<string, { badge: string; bar: string; text: string }> = {
    emerald: { badge: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20", bar: "bg-emerald-500", text: "text-emerald-400" },
    amber: { badge: "bg-amber-500/[0.08] text-amber-400 border-amber-500/20", bar: "bg-amber-500", text: "text-amber-400" },
    rose: { badge: "bg-rose-500/[0.08] text-rose-400 border-rose-500/20", bar: "bg-rose-500", text: "text-rose-400" },
  };
  const s = styles[healthColor];

  return (
    <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-7">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-card-hover)] border border-[var(--border-card)] flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <h2 className="text-[var(--text-heading)] text-[0.95rem] font-semibold tracking-[-0.02em]">Financial Health Overview</h2>
          </div>
          <span className={`${s.badge} border text-[0.65rem] font-bold px-3 py-1 rounded-full tracking-[0.06em] uppercase`}>
            ● {healthStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Debt-to-Asset */}
          <div>
            <p className="text-[var(--text-muted)] text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">How Much You Owe vs Own</p>
            <p className={`text-2xl font-bold ${s.text} tracking-tight`}>{debtToAsset.toFixed(1)}%</p>
            <div className="h-1 bg-[var(--bg-card-hover)] rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${Math.min(debtToAsset, 100)}%` }} />
            </div>
            <p className="text-[var(--text-muted)] text-[0.68rem] mt-1.5">Keep this below 50% for good health</p>
          </div>

          {/* Monthly Surplus */}
          <div>
            <p className="text-[var(--text-muted)] text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Money Left After Bills</p>
            <p className={`text-2xl font-bold tracking-tight ${monthlySurplus > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatINR(monthlySurplus)}
            </p>
            <p className="text-[var(--text-muted)] text-[0.68rem] mt-3">
              You save: <span className={monthlySurplus > 0 ? "text-emerald-400/80" : "text-rose-400/80"}>{savingsRate.toFixed(0)}%</span> of your income
            </p>
            <p className="text-[var(--text-muted)] text-[0.68rem]">What you keep after all expenses & EMIs</p>
          </div>

          {/* Net Worth */}
          <div>
            <p className="text-[var(--text-muted)] text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">What You're Worth Today</p>
            <p className={`text-2xl font-bold tracking-tight ${netWorth > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatINR(netWorth)}
            </p>
            <p className="text-[var(--text-muted)] text-[0.68rem] mt-3">Everything you own minus everything you owe</p>
            <p className="text-[var(--text-muted)] text-[0.68rem]">Your assets: {formatINR(totalAssets)}</p>
          </div>

          {/* Total Liabilities */}
          <div>
            <p className="text-[var(--text-muted)] text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Total You Owe</p>
            <p className="text-2xl font-bold text-rose-400 tracking-tight">{formatINR(grandDebt)}</p>
            <div className="h-1 bg-[var(--bg-card-hover)] rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(debtToAsset, 100)}%` }} />
            </div>
            <p className="text-[var(--text-muted)] text-[0.68rem] mt-1.5">
              {((grandDebt / totalAssets) * 100).toFixed(0)}% of total assets
            </p>
          </div>
        </div>

        {/* Emergency Fund Monitor */}
        <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[var(--text-muted)] text-[0.65rem] font-semibold uppercase tracking-[0.08em]">Rainy Day Fund</p>
            {(() => {
              const monthlyExpenses = monthlyCredit - monthlySurplus;
              const requiredFund = monthlyExpenses * 6;
              const currentLiquid = monthlySurplus > 0 ? monthlySurplus * 3 : 0; // rough estimate
              const coverMonths = monthlyExpenses > 0 ? currentLiquid / monthlyExpenses : 0;
              const fundStatus = coverMonths >= 6 ? "FUNDED" : coverMonths >= 3 ? "PARTIAL" : "UNDERFUNDED";
              const fundColor = coverMonths >= 6 ? "emerald" : coverMonths >= 3 ? "amber" : "rose";
              const fc: Record<string, string> = { emerald: "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/20", amber: "bg-amber-500/[0.08] text-amber-400 border-amber-500/20", rose: "bg-rose-500/[0.08] text-rose-400 border-rose-500/20" };
              return (
                <span className={`${fc[fundColor]} border text-[0.6rem] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-[0.04em]`}>
                  {fundStatus}
                </span>
              );
            })()}
          </div>
          {(() => {
            const monthlyExpenses = monthlyCredit - monthlySurplus;
            const requiredFund = monthlyExpenses * 6;
            const currentLiquid = monthlySurplus > 0 ? monthlySurplus * 3 : 0;
            const coverMonths = monthlyExpenses > 0 ? currentLiquid / monthlyExpenses : 0;
            const gap = Math.max(0, requiredFund - currentLiquid);
            const pct = requiredFund > 0 ? Math.min((currentLiquid / requiredFund) * 100, 100) : 0;
            return (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-[0.6rem] text-[var(--text-muted)]">You Need (6 months)</p>
                    <p className="text-[0.85rem] font-bold text-[var(--text-heading)]">{formatINR(requiredFund)}</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] text-[var(--text-muted)]">You're Covered For</p>
                    <p className={`text-[0.85rem] font-bold ${coverMonths >= 6 ? "text-emerald-400" : coverMonths >= 3 ? "text-amber-400" : "text-rose-400"}`}>{coverMonths.toFixed(1)} months</p>
                  </div>
                  <div>
                    <p className="text-[0.6rem] text-[var(--text-muted)]">Still Need to Save</p>
                    <p className={`text-[0.85rem] font-bold ${gap > 0 ? "text-rose-400" : "text-emerald-400"}`}>{gap > 0 ? formatINR(gap) : "Fully funded"}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${coverMonths >= 6 ? "bg-emerald-500" : coverMonths >= 3 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[0.62rem] text-[var(--text-muted)] mt-2">
                  Experts suggest keeping 6 months of living expenses in easy-to-access savings for unexpected events.
                  {gap > 0 && monthlySurplus > 0 ? ` At your current pace, you'll be fully covered in ${Math.ceil(gap / monthlySurplus)} months.` : ""}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
