"use client";

import { formatINR } from "./kpi-cards";

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
    <div className="relative overflow-hidden bg-[#12131a] border border-white/[0.06] rounded-2xl p-7">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-cyan-500/[0.02] pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <h2 className="text-white text-[0.95rem] font-semibold tracking-[-0.02em]">Financial Health Overview</h2>
          </div>
          <span className={`${s.badge} border text-[0.65rem] font-bold px-3 py-1 rounded-full tracking-[0.06em] uppercase`}>
            ● {healthStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Debt-to-Asset */}
          <div>
            <p className="text-slate-500 text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Debt-to-Asset Ratio</p>
            <p className={`text-2xl font-bold ${s.text} tracking-tight`}>{debtToAsset.toFixed(1)}%</p>
            <div className="h-1 bg-white/[0.04] rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${Math.min(debtToAsset, 100)}%` }} />
            </div>
            <p className="text-slate-600 text-[0.68rem] mt-1.5">Target: below 50%</p>
          </div>

          {/* Monthly Surplus */}
          <div>
            <p className="text-slate-500 text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Monthly Surplus</p>
            <p className={`text-2xl font-bold tracking-tight ${monthlySurplus > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatINR(monthlySurplus)}
            </p>
            <p className="text-slate-600 text-[0.68rem] mt-3">
              Savings rate: <span className={monthlySurplus > 0 ? "text-emerald-400/80" : "text-rose-400/80"}>{savingsRate.toFixed(0)}%</span>
            </p>
            <p className="text-slate-600 text-[0.68rem]">Income minus fixed outflows</p>
          </div>

          {/* Net Worth */}
          <div>
            <p className="text-slate-500 text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Net Worth</p>
            <p className={`text-2xl font-bold tracking-tight ${netWorth > 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {formatINR(netWorth)}
            </p>
            <p className="text-slate-600 text-[0.68rem] mt-3">Assets minus all liabilities</p>
            <p className="text-slate-600 text-[0.68rem]">Total assets: {formatINR(totalAssets)}</p>
          </div>

          {/* Total Liabilities */}
          <div>
            <p className="text-slate-500 text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">Total Liabilities</p>
            <p className="text-2xl font-bold text-rose-400 tracking-tight">{formatINR(grandDebt)}</p>
            <div className="h-1 bg-white/[0.04] rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${Math.min(debtToAsset, 100)}%` }} />
            </div>
            <p className="text-slate-600 text-[0.68rem] mt-1.5">
              {((grandDebt / totalAssets) * 100).toFixed(0)}% of total assets
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
