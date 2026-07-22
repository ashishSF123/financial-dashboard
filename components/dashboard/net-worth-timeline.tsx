"use client";

import { useState, useEffect, useCallback } from "react";
import { getNetWorthHistory, recordNetWorth, getPortfolioSummary, getAdditionalLoans, getTotalMonthlyIncome } from "@/lib/finance-store";
import type { NetWorthSnapshot } from "@/lib/finance-types";
import type { FinancialData } from "@/lib/parse-excel";

function formatINR(n: number): string {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}K`;
  return `Rs ${n.toLocaleString("en-IN")}`;
}

interface Props {
  data: FinancialData;
}

export function NetWorthTimeline({ data }: Props) {
  const [history, setHistory] = useState<NetWorthSnapshot[]>([]);

  const computeCurrentNetWorth = useCallback(() => {
    const portfolio = getPortfolioSummary();
    const loans = getAdditionalLoans();
    const investments = portfolio.totalCurrent;
    const realEstate = data.realEstate?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0;
    const assets = investments + realEstate;
    const goldDebt = data.goldLoans.reduce((s, g) => s + g.principalAmount, 0);
    const houseDebt = data.houseLoans.reduce((s, h) => s + h.loanAmount, 0);
    const borrowedDebt = data.borrowed.reduce((s, b) => s + b.amount, 0);
    const additionalDebt = loans.reduce((s, l) => s + l.outstandingBalance, 0);
    const totalDebt = goldDebt + houseDebt + borrowedDebt + additionalDebt;
    const netWorth = assets - totalDebt;
    return { assets, investments, debt: totalDebt, netWorth };
  }, [data]);

  const refresh = useCallback(() => {
    // Record current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const current = computeCurrentNetWorth();
    recordNetWorth({ month: currentMonth, ...current });
    setHistory(getNetWorthHistory());
  }, [computeCurrentNetWorth]);

  useEffect(() => { refresh(); }, [refresh]);

  const latest = history[history.length - 1];
  const prev = history.length >= 2 ? history[history.length - 2] : null;
  const monthlyChange = latest && prev ? latest.netWorth - prev.netWorth : 0;
  const monthlyGrowth = prev && prev.netWorth !== 0 ? (monthlyChange / Math.abs(prev.netWorth)) * 100 : 0;

  // Projection (simple linear)
  const monthlyIncome = getTotalMonthlyIncome();
  const savingsRate = monthlyIncome > 0 ? 0.3 : 0; // assume 30% savings
  const projected6mo = (latest?.netWorth || 0) + (monthlyIncome * savingsRate * 6);
  const projected1yr = (latest?.netWorth || 0) + (monthlyIncome * savingsRate * 12);

  const maxNW = Math.max(...history.map((h) => h.netWorth), 1);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white">Net Worth Timeline</h2>
        <p className="text-[0.78rem] text-slate-500 mt-0.5">Track your total wealth trajectory over time</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Current Net Worth</p>
          <p className={`text-[1.05rem] font-bold tracking-tight mt-0.5 ${(latest?.netWorth || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{formatINR(latest?.netWorth || 0)}</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Monthly Change</p>
          <p className={`text-[1.05rem] font-bold tracking-tight mt-0.5 ${monthlyChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{monthlyChange >= 0 ? "+" : ""}{formatINR(Math.abs(monthlyChange))}</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Total Assets</p>
          <p className="text-[1.05rem] font-bold text-white tracking-tight mt-0.5">{formatINR(latest?.assets || 0)}</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Total Debt</p>
          <p className="text-[1.05rem] font-bold text-rose-400 tracking-tight mt-0.5">{formatINR(latest?.debt || 0)}</p>
        </div>
      </div>

      {/* Visual timeline (bar chart) */}
      {history.length > 0 && (
        <div className="bg-[#12131a] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-[0.85rem] font-semibold text-white mb-4">Net Worth History</h3>
          <div className="flex items-end gap-1 h-32">
            {history.slice(-12).map((h) => {
              const height = maxNW > 0 ? Math.max(4, (Math.abs(h.netWorth) / maxNW) * 100) : 4;
              return (
                <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${h.netWorth >= 0 ? "bg-emerald-500/40" : "bg-rose-500/40"}`}
                    style={{ height: `${height}%` }}
                    title={`${h.month}: ${formatINR(h.netWorth)}`}
                  />
                  <span className="text-[0.5rem] text-slate-600">{h.month.split("-")[1]}</span>
                </div>
              );
            })}
          </div>
          {monthlyGrowth !== 0 && (
            <p className="text-[0.68rem] text-slate-500 mt-3">
              {monthlyGrowth > 0 ? "Growing" : "Declining"} at {Math.abs(monthlyGrowth).toFixed(1)}%/month
            </p>
          )}
        </div>
      )}

      {/* Projections */}
      {monthlyIncome > 0 && (
        <div className="bg-[#12131a] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-[0.85rem] font-semibold text-white mb-3">Projected Net Worth</h3>
          <p className="text-[0.68rem] text-slate-500 mb-3">Based on 30% savings rate of monthly income</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">Now</p>
              <p className="text-[0.9rem] font-bold text-white mt-1">{formatINR(latest?.netWorth || 0)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">6 Months</p>
              <p className="text-[0.9rem] font-bold text-emerald-400 mt-1">{formatINR(projected6mo)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[0.6rem] text-slate-500 uppercase tracking-wider">1 Year</p>
              <p className="text-[0.9rem] font-bold text-emerald-400 mt-1">{formatINR(projected1yr)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
