"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { FinancialData } from "@/lib/parse-excel";

interface Props {
  data: FinancialData;
}

interface DebtItem {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number; // annual %
  type: "gold" | "house" | "personal";
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const typeColors = { gold: "#f59e0b", house: "#6366f1", personal: "#f43f5e" };

export function DebtPlanner({ data }: Props) {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraPayment, setExtraPayment] = useState(10000);

  const debts: DebtItem[] = useMemo(() => {
    const items: DebtItem[] = [];
    data.goldLoans.forEach((g) => {
      if (g.status?.toLowerCase() !== "completed") {
        items.push({ id: g.id, name: `${g.vendor} Gold Loan`, balance: g.principalAmount, monthlyPayment: g.monthlyInterest, interestRate: g.roiPct, type: "gold" });
      }
    });
    data.houseLoans.forEach((h) => {
      if (h.status?.toLowerCase() !== "completed") {
        items.push({ id: h.id, name: `${h.bank} ${h.loanType}`, balance: h.loanAmount, monthlyPayment: h.emiAmount, interestRate: h.interestRate, type: "house" });
      }
    });
    data.borrowed.forEach((b) => {
      if (b.status?.toLowerCase() !== "completed") {
        items.push({ id: b.id, name: `${b.personName}`, balance: b.amount, monthlyPayment: b.monthlyInterest, interestRate: b.roi * 12, type: "personal" });
      }
    });
    return items;
  }, [data]);

  // Simulate payoff
  const simulation = useMemo(() => {
    const sorted = [...debts].sort((a, b) =>
      strategy === "avalanche" ? b.interestRate - a.interestRate : a.balance - b.balance
    );

    let remaining = sorted.map((d) => ({ ...d, bal: d.balance }));
    let month = 0;
    let totalInterestPaid = 0;
    const timeline: { month: number; totalDebt: number }[] = [];
    const payoffOrder: { name: string; month: number; saved: number }[] = [];

    while (remaining.length > 0 && month < 360) {
      month++;
      let extraLeft = extraPayment;

      // Pay interest on all
      remaining.forEach((d) => {
        const monthlyRate = d.interestRate / 12 / 100;
        const interest = d.bal * monthlyRate;
        totalInterestPaid += interest;
        // For gold loans and personal: interest-only, principal stays unless extra paid
        // For house loans: EMI covers both
        if (d.type === "house") {
          const principalPart = d.monthlyPayment - interest;
          d.bal = Math.max(0, d.bal - principalPart);
        }
      });

      // Apply extra payment to target (first in sorted list)
      for (const d of remaining) {
        if (extraLeft <= 0) break;
        const apply = Math.min(extraLeft, d.bal);
        d.bal -= apply;
        extraLeft -= apply;
        if (d.bal <= 0) {
          payoffOrder.push({ name: d.name, month, saved: 0 });
        }
      }

      remaining = remaining.filter((d) => d.bal > 0);
      timeline.push({ month, totalDebt: remaining.reduce((s, d) => s + d.bal, 0) });
    }

    return { timeline, totalInterestPaid, payoffOrder, totalMonths: month };
  }, [debts, strategy, extraPayment]);

  // Without extra payment baseline
  const baselineMonths = useMemo(() => {
    const sorted = [...debts];
    let remaining = sorted.map((d) => ({ ...d, bal: d.balance }));
    let month = 0;
    let totalInterest = 0;
    while (remaining.length > 0 && month < 360) {
      month++;
      remaining.forEach((d) => {
        const monthlyRate = d.interestRate / 12 / 100;
        const interest = d.bal * monthlyRate;
        totalInterest += interest;
        if (d.type === "house") {
          const principalPart = d.monthlyPayment - interest;
          d.bal = Math.max(0, d.bal - principalPart);
        }
      });
      remaining = remaining.filter((d) => d.bal > 0);
    }
    return { months: month, interest: totalInterest };
  }, [debts]);

  const interestSaved = baselineMonths.interest - simulation.totalInterestPaid;
  const monthsSaved = baselineMonths.months - simulation.totalMonths;

  // Chart data (sample every 3 months)
  const chartData = simulation.timeline.filter((_, i) => i % 3 === 0 || i === simulation.timeline.length - 1).slice(0, 40);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)] flex items-center gap-2">
            <span className="text-lg">🎯</span> Debt Freedom Planner
          </h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] leading-relaxed mt-1">Choose a strategy and see when you become debt-free</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStrategy("avalanche")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              strategy === "avalanche" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-card)]"
            }`}
          >
            Avalanche (High Interest First)
          </button>
          <button
            onClick={() => setStrategy("snowball")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              strategy === "snowball" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border-card)]"
            }`}
          >
            Snowball (Smallest Balance First)
          </button>
        </div>
      </div>

      {/* Extra Payment Input */}
      <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[var(--text-secondary)]">Extra monthly payment toward debt</p>
          <p className="text-lg font-bold text-[var(--text-heading)]">{formatINR(extraPayment)}/mo</p>
        </div>
        <input
          type="range"
          min={0}
          max={100000}
          step={5000}
          value={extraPayment}
          onChange={(e) => setExtraPayment(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none bg-[var(--bg-card-hover)] accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
          <span>₹0</span>
          <span>₹25K</span>
          <span>₹50K</span>
          <span>₹75K</span>
          <span>₹1L</span>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-[var(--text-muted)] mb-1">Total Debt</p>
          <p className="text-lg font-bold text-[var(--text-heading)]">{formatINR(totalDebt)}</p>
        </div>
        <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-[var(--text-muted)] mb-1">Debt-Free In</p>
          <p className="text-lg font-bold text-emerald-400">
            {simulation.totalMonths >= 360 ? "30+ yrs" : `${Math.floor(simulation.totalMonths / 12)}y ${simulation.totalMonths % 12}m`}
          </p>
          {monthsSaved > 0 && <p className="text-[0.68rem] text-emerald-500 mt-0.5">{monthsSaved} months faster</p>}
        </div>
        <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-[var(--text-muted)] mb-1">Interest Saved</p>
          <p className="text-lg font-bold text-amber-400">{formatINR(Math.max(0, interestSaved))}</p>
          <p className="text-[0.68rem] text-[var(--text-muted)] mt-0.5">vs no extra payment</p>
        </div>
        <div className="bg-[var(--bg-input)] border border-[var(--border-card)] rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-[var(--text-muted)] mb-1">Strategy</p>
          <p className="text-lg font-bold text-indigo-400 capitalize">{strategy}</p>
          <p className="text-[0.68rem] text-[var(--text-muted)] mt-0.5">{strategy === "avalanche" ? "Saves most interest" : "Quick wins first"}</p>
        </div>
      </div>

      {/* Payoff Timeline Chart */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-4">Debt Reduction Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `M${v}`} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINR(v)} />
              <Tooltip
                contentStyle={{ background: "var(--bg-secondary)", border: "1px solid var(--border-card)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [formatINR(value), "Total Debt"]}
                labelFormatter={(v) => `Month ${v}`}
              />
              <Bar dataKey="totalDebt" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`rgba(99, 102, 241, ${0.8 - (i / chartData.length) * 0.6})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debt Priority List */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-4">
          Payment Priority ({strategy === "avalanche" ? "Highest Rate First" : "Smallest Balance First"})
        </h3>
        <div className="space-y-3">
          {[...debts]
            .sort((a, b) => strategy === "avalanche" ? b.interestRate - a.interestRate : a.balance - b.balance)
            .map((debt, i) => (
              <div key={debt.id} className="flex items-center gap-4 py-3 px-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-card-hover)] border border-white/[0.1]">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: typeColors[debt.type] }} />
                    <p className="text-[0.82rem] text-[var(--text-primary)] truncate">{debt.name}</p>
                  </div>
                  <p className="text-[0.68rem] text-[var(--text-muted)] mt-0.5">{debt.interestRate}% p.a. · {formatINR(debt.monthlyPayment)}/mo</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.82rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(debt.balance)}</p>
                  <p className="text-[0.68rem] text-[var(--text-muted)]">{debt.type}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Payoff Milestones */}
      {simulation.payoffOrder.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6">
          <h3 className="text-[0.88rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-4">Payoff Milestones</h3>
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 to-transparent" />
            {simulation.payoffOrder.map((po, i) => (
              <div key={i} className="relative flex items-center gap-3 py-2">
                <div className="absolute left-[-16px] w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div>
                  <p className="text-[0.82rem] text-[var(--text-secondary)]">{po.name} <span className="text-emerald-400">paid off</span></p>
                  <p className="text-[0.68rem] text-[var(--text-muted)]">Month {po.month} ({Math.floor(po.month / 12)}y {po.month % 12}m)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
