"use client";
import { formatINR } from "@/lib/format-currency";

import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { FinancialData } from "@/lib/parse-excel";

interface MonthlySnapshot {
  month: string;
  label: string;
  data: FinancialData;
  isCurrent: boolean;
}

interface TrendsPanelProps {
  snapshots: MonthlySnapshot[];
}

function calcMetrics(d: FinancialData) {
  const totalGoldDebt = d.goldLoans.reduce((s, g) => s + g.principalAmount, 0);
  const totalHouseLoan = d.houseLoans.reduce((s, h) => s + h.loanAmount, 0);
  const totalBorrowed = d.borrowed.reduce((s, b) => s + b.amount, 0);
  const totalLease = d.leases.reduce((s, l) => s + l.amount, 0);
  const grandDebt = totalGoldDebt + totalHouseLoan + totalBorrowed + totalLease;
  const monthlyGoldInterest = d.goldLoans.reduce((s, g) => s + g.monthlyInterest, 0);
  const monthlyHouseEmi = d.houseLoans.reduce((s, h) => s + h.emiAmount, 0);
  const monthlyBorrowedInterest = d.borrowed.reduce((s, b) => s + b.monthlyInterest, 0);
  const monthlyExpenses = d.expenses.reduce((s, e) => s + e.amount, 0);
  const totalGoldWeight = d.goldLoans.reduce((s, g) => s + g.goldWeight, 0);
  const goldMarketValue = totalGoldWeight * d.goldRate22ct;
  const totalAssets = d.assets.reduce((s, a) => s + a.amount, 0) + 8000000;
  const netWorth = totalAssets - grandDebt;
  const monthlyCredit = d.monthlyCredit;
  const monthlyOutflows = monthlyHouseEmi + monthlyGoldInterest + monthlyBorrowedInterest + monthlyExpenses;
  const monthlySurplus = monthlyCredit - monthlyOutflows;
  return { totalGoldDebt, totalHouseLoan, totalBorrowed, totalLease, grandDebt, monthlyExpenses, goldMarketValue, totalAssets, netWorth, monthlyCredit, monthlyOutflows, monthlySurplus };
}


function pctChange(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0) return { value: "—", positive: true };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { value: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, positive: pct >= 0 };
}

export function TrendsPanel({ snapshots }: TrendsPanelProps) {
  const timeSeriesData = useMemo(() => {
    return [...snapshots].reverse().map((s) => {
      const m = calcMetrics(s.data);
      return {
        month: s.label.replace(" 2026", "").replace(" 20", "'"),
        fullLabel: s.label,
        ...m,
      };
    });
  }, [snapshots]);

  const oldest = timeSeriesData[0];
  const newest = timeSeriesData[timeSeriesData.length - 1];

  if (!oldest || !newest) return null;

  const progressCards = [
    {
      label: "Net Worth",
      current: newest.netWorth,
      previous: oldest.netWorth,
      color: "emerald",
      invertPositive: false,
    },
    {
      label: "Total Debt",
      current: newest.grandDebt,
      previous: oldest.grandDebt,
      color: "rose",
      invertPositive: true,
    },
    {
      label: "Total Assets",
      current: newest.totalAssets,
      previous: oldest.totalAssets,
      color: "indigo",
      invertPositive: false,
    },
    {
      label: "Monthly Surplus",
      current: newest.monthlySurplus,
      previous: oldest.monthlySurplus,
      color: "cyan",
      invertPositive: false,
    },
  ];

  const comparisonMetrics = [
    { key: "netWorth", label: "Net Worth" },
    { key: "grandDebt", label: "Total Debt" },
    { key: "totalAssets", label: "Total Assets" },
    { key: "totalGoldDebt", label: "Gold Debt" },
    { key: "totalHouseLoan", label: "House Loan" },
    { key: "totalBorrowed", label: "Borrowed" },
    { key: "monthlyExpenses", label: "Monthly Expenses" },
    { key: "monthlySurplus", label: "Monthly Surplus" },
    { key: "goldMarketValue", label: "Gold Market Value" },
  ];

  const tooltipStyle = {
    contentStyle: { backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-card)", borderRadius: "12px", fontSize: "11px" },
    labelStyle: { color: "#94a3b8", fontWeight: 600 },
  };

  return (
    <div className="space-y-8">
      {/* Progress Summary Cards */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--text-muted)] mb-4">
          6-Month Progress — {oldest.fullLabel} to {newest.fullLabel}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {progressCards.map((card) => {
            const change = pctChange(card.current, card.previous);
            const isGood = card.invertPositive ? !change.positive : change.positive;
            return (
              <div key={card.label} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5">
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-[var(--text-muted)] mb-2">{card.label}</p>
                <p className="text-xl font-semibold text-[var(--text-heading)]">₹{formatINR(card.current)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
                    {isGood ? "▲" : "▼"} {change.value}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">from ₹{formatINR(card.previous)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth & Assets Line Chart */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5">
          <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-1">Net Worth & Assets</h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Wealth growth over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickFormatter={(v) => `₹${formatINR(v)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${formatINR(v)}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="totalAssets" name="Assets" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Debt Breakdown Stacked Area */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5">
          <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-1">Debt Composition</h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Breakdown of liabilities over time</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickFormatter={(v) => `₹${formatINR(v)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${formatINR(v)}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Area type="monotone" dataKey="totalHouseLoan" name="House Loan" stackId="1" stroke="#f472b6" fill="#f472b6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="totalGoldDebt" name="Gold Debt" stackId="1" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} />
              <Area type="monotone" dataKey="totalBorrowed" name="Borrowed" stackId="1" stroke="#fb923c" fill="#fb923c" fillOpacity={0.3} />
              <Area type="monotone" dataKey="totalLease" name="Lease" stackId="1" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Cash Flow Bar Chart */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-1">Monthly Cash Flow</h3>
          <p className="text-[10px] text-[var(--text-muted)] mb-4">Income vs outflows — tracking your monthly surplus/deficit</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickFormatter={(v) => `₹${formatINR(v)}`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${formatINR(v)}`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="monthlyCredit" name="Income" fill="#34d399" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              <Bar dataKey="monthlyOutflows" name="Outflows" fill="#f87171" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
              <Bar dataKey="monthlySurplus" name="Surplus" fill="#60a5fa" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month-over-Month Comparison Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 overflow-x-auto">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-1">Month-over-Month Comparison</h3>
        <p className="text-[10px] text-[var(--text-muted)] mb-4">All key metrics across each month with overall change</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--border-card)]">
              <th className="text-left py-2 pr-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Metric</th>
              {timeSeriesData.map((d) => (
                <th key={d.month} className="text-right py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{d.month}</th>
              ))}
              <th className="text-right py-2 pl-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Change</th>
            </tr>
          </thead>
          <tbody>
            {comparisonMetrics.map((metric) => {
              const values = timeSeriesData.map((d) => (d as Record<string, number>)[metric.key] as number);
              const first = values[0];
              const last = values[values.length - 1];
              const change = pctChange(last, first);
              const isDebt = ["grandDebt", "totalGoldDebt", "totalHouseLoan", "totalBorrowed", "monthlyExpenses"].includes(metric.key);
              const isGood = isDebt ? !change.positive : change.positive;
              return (
                <tr key={metric.key} className="border-b border-white/[0.03] hover:bg-[var(--bg-card)] transition-colors">
                  <td className="py-2.5 pr-4 text-[var(--text-secondary)] font-medium">{metric.label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="text-right py-2.5 px-2 text-[var(--text-secondary)] tabular-nums">₹{formatINR(v)}</td>
                  ))}
                  <td className={`text-right py-2.5 pl-4 font-semibold ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
                    {isGood ? "▲" : "▼"} {change.value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
