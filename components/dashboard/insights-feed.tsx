"use client";

import { useMemo } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface Props {
  data: FinancialData;
  metrics: {
    grandDebt: number;
    totalAssets: number;
    netWorth: number;
    monthlySurplus: number;
    monthlyCredit: number;
    totalGoldDebt: number;
    totalHouseLoan: number;
    totalBorrowed: number;
    monthlyGoldInterest: number;
    monthlyHouseEmi: number;
    monthlyBorrowedInterest: number;
  };
  prevMetrics?: {
    grandDebt: number;
    netWorth: number;
    monthlySurplus: number;
  } | null;
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

interface Insight {
  icon: string;
  text: string;
  type: "warning" | "success" | "info" | "tip";
}

export function InsightsFeed({ data, metrics, prevMetrics }: Props) {
  const insights: Insight[] = useMemo(() => {
    const items: Insight[] = [];

    // Find highest interest loan
    const highestGold = [...data.goldLoans].sort((a, b) => b.roiPct - a.roiPct)[0];
    if (highestGold) {
      items.push({
        icon: "⚠️",
        text: `${highestGold.vendor} Gold Loan has ${highestGold.roiPct}% p.a. — your costliest debt. Prioritize closing this first.`,
        type: "warning",
      });
    }

    // Monthly surplus check
    if (metrics.monthlySurplus < 0) {
      items.push({
        icon: "🚨",
        text: `Monthly deficit of ${formatINR(Math.abs(metrics.monthlySurplus))}. Outflows exceed income — needs immediate attention.`,
        type: "warning",
      });
    }

    // EMI due alert
    const totalEmi = metrics.monthlyHouseEmi + metrics.monthlyGoldInterest + metrics.monthlyBorrowedInterest;
    const now = new Date();
    if (now.getDate() <= 5) {
      items.push({
        icon: "📅",
        text: `${formatINR(totalEmi)} in EMIs and interest due within the next few days.`,
        type: "info",
      });
    }

    // Debt reduction progress
    if (prevMetrics && prevMetrics.grandDebt > metrics.grandDebt) {
      const reduced = prevMetrics.grandDebt - metrics.grandDebt;
      items.push({
        icon: "🎯",
        text: `Debt reduced by ${formatINR(reduced)} this month — great progress!`,
        type: "success",
      });
    }

    // Net worth trend
    if (prevMetrics && metrics.netWorth > prevMetrics.netWorth) {
      items.push({
        icon: "📈",
        text: `Net worth grew by ${formatINR(metrics.netWorth - prevMetrics.netWorth)} vs last month.`,
        type: "success",
      });
    }

    // Gold loan interest tip
    if (data.goldLoans.length > 0) {
      const totalGoldInterest = data.goldLoans.reduce((s, g) => s + g.monthlyInterest, 0);
      items.push({
        icon: "💡",
        text: `Paying ${formatINR(totalGoldInterest)}/mo in gold loan interest alone. Closing one loan saves ${formatINR(data.goldLoans[0]?.monthlyInterest || 0)}/mo.`,
        type: "tip",
      });
    }

    // Debt-to-income ratio
    const dti = (metrics.grandDebt / (metrics.monthlyCredit * 12)) * 100;
    if (dti > 500) {
      items.push({
        icon: "📊",
        text: `Debt-to-annual-income ratio is ${dti.toFixed(0)}%. Aim to bring this below 300% for financial stability.`,
        type: "info",
      });
    }

    // Lended income opportunity
    const lendedIncome = data.lended.reduce((s, l) => s + l.monthlyInterest, 0);
    if (lendedIncome > 0) {
      items.push({
        icon: "💰",
        text: `Earning ${formatINR(lendedIncome)}/mo from lended funds. Reinvesting this can compound to ${formatINR(lendedIncome * 12 * 5)} in 5 years.`,
        type: "tip",
      });
    }

    // House loan comparison
    if (data.houseLoans.length > 1) {
      const rates = data.houseLoans.map((h) => h.interestRate);
      const diff = Math.max(...rates) - Math.min(...rates);
      if (diff > 0.5) {
        items.push({
          icon: "🏠",
          text: `Interest rate gap of ${diff.toFixed(1)}% between house loans. Consider refinancing the higher-rate loan.`,
          type: "tip",
        });
      }
    }

    return items;
  }, [data, metrics, prevMetrics]);

  const typeStyles = {
    warning: "border-rose-500/20 bg-rose-500/[0.03]",
    success: "border-emerald-500/20 bg-emerald-500/[0.03]",
    info: "border-blue-500/20 bg-blue-500/[0.03]",
    tip: "border-amber-500/20 bg-amber-500/[0.03]",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">Smart Insights</h3>
        <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400">{insights.length} insights</span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${typeStyles[insight.type]}`}>
            <span className="text-sm mt-0.5 flex-shrink-0">{insight.icon}</span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
