"use client";

import { useMemo, useState } from "react";
import type { FinancialData } from "@/lib/parse-excel";
import { EditableTable } from "./editable-table";

interface DebtItem {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  type: "gold" | "house" | "personal";
  status: string;
  detail: string;
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const TYPE_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  gold: { icon: "🥇", label: "Gold Loan", color: "text-amber-400", bg: "bg-amber-500/10" },
  house: { icon: "🏠", label: "House Loan", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  personal: { icon: "🤝", label: "Personal", color: "text-rose-400", bg: "bg-rose-500/10" },
};

interface Props {
  data: FinancialData;
  onUpdate: (updater: (d: FinancialData) => FinancialData) => void;
}

export function LoansHub({ data, onUpdate }: Props) {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [filterType, setFilterType] = useState<string>("all");
  const [section, setSection] = useState<"overview" | "gold" | "house" | "settlements">("overview");

  const debts: DebtItem[] = useMemo(() => {
    const items: DebtItem[] = [];
    data.goldLoans.forEach((g) => {
      if (g.status?.toLowerCase() !== "completed") {
        items.push({
          id: g.id,
          name: `${g.vendor} Gold Loan`,
          balance: g.principalAmount,
          monthlyPayment: g.monthlyInterest,
          interestRate: g.roiPct,
          type: "gold",
          status: g.status || "active",
          detail: `${g.goldWeight}g • ${g.location}`,
        });
      }
    });
    data.houseLoans.forEach((h) => {
      if (h.status?.toLowerCase() !== "completed") {
        items.push({
          id: h.id,
          name: `${h.bank} ${h.loanType}`,
          balance: h.loanAmount,
          monthlyPayment: h.emiAmount,
          interestRate: h.interestRate,
          type: "house",
          status: h.status || "active",
          detail: `${h.remainingMonths} months left`,
        });
      }
    });
    data.borrowed.forEach((b) => {
      if (b.status?.toLowerCase() !== "completed") {
        items.push({
          id: b.id,
          name: `${b.personName}`,
          balance: b.amount,
          monthlyPayment: b.monthlyInterest,
          interestRate: b.roi * 12,
          type: "personal",
          status: b.status || "active",
          detail: b.location || "Personal loan",
        });
      }
    });
    return items;
  }, [data]);

  const sorted = useMemo(() => {
    const filtered = filterType === "all" ? debts : debts.filter((d) => d.type === filterType);
    return [...filtered].sort((a, b) =>
      strategy === "avalanche" ? b.interestRate - a.interestRate : a.balance - b.balance
    );
  }, [debts, strategy, filterType]);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMonthly = debts.reduce((s, d) => s + d.monthlyPayment, 0);
  const highestRate = debts.length > 0 ? Math.max(...debts.map((d) => d.interestRate)) : 0;
  const activeCount = debts.length;

  const recommendation = sorted[0] || null;

  const sections = [
    { id: "overview" as const, label: "Priority View", icon: "🎯" },
    { id: "gold" as const, label: "Gold Loans", icon: "🥇" },
    { id: "house" as const, label: "House Loans", icon: "🏠" },
    { id: "settlements" as const, label: "Settlements", icon: "🤝" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white">Loans & Debt</h2>
          <p className="text-[0.78rem] text-slate-500 mt-0.5">All liabilities in one place with payoff recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStrategy("avalanche")}
            className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${strategy === "avalanche" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-500 hover:text-slate-300"}`}
          >
            Avalanche
          </button>
          <button
            onClick={() => setStrategy("snowball")}
            className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${strategy === "snowball" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-500 hover:text-slate-300"}`}
          >
            Snowball
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Total Debt</p>
          <p className="text-[1.1rem] font-bold text-rose-400 tracking-tight mt-0.5">{formatINR(totalDebt)}</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Monthly Outflow</p>
          <p className="text-[1.1rem] font-bold text-amber-400 tracking-tight mt-0.5">{formatINR(totalMonthly)}</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Highest Rate</p>
          <p className="text-[1.1rem] font-bold text-rose-400 tracking-tight mt-0.5">{highestRate.toFixed(1)}% p.a.</p>
        </div>
        <div className="bg-[#12131a] border border-white/[0.06] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-slate-500">Active Loans</p>
          <p className="text-[1.1rem] font-bold text-white tracking-tight mt-0.5">{activeCount}</p>
        </div>
      </div>

      {/* Recommendation Card */}
      {recommendation && (
        <div className="bg-gradient-to-r from-indigo-500/[0.08] to-rose-500/[0.05] border border-indigo-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[0.9rem] font-semibold text-white mb-1">
                Close &quot;{recommendation.name}&quot; first
              </h3>
              <p className="text-[0.78rem] text-slate-400 leading-relaxed">
                {strategy === "avalanche" ? (
                  <>Highest interest rate at <span className="text-rose-400 font-semibold">{recommendation.interestRate.toFixed(1)}% p.a.</span> — you&apos;re paying <span className="text-amber-400 font-semibold">{formatINR(recommendation.monthlyPayment)}/mo</span> in interest alone. Closing this first saves the most money over time.</>
                ) : (
                  <>Smallest balance at <span className="text-emerald-400 font-semibold">{formatINR(recommendation.balance)}</span> — fastest to eliminate completely. Each closed loan frees up cash flow for the next one.</>
                )}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-[0.65rem] px-2.5 py-1 rounded-md font-semibold ${strategy === "avalanche" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"}`}>
                  Strategy: {strategy === "avalanche" ? "Avalanche (save most ₹)" : "Snowball (quick wins)"}
                </span>
                <span className="text-[0.65rem] text-slate-500">
                  {TYPE_META[recommendation.type].icon} {TYPE_META[recommendation.type].label} • {recommendation.detail}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex items-center gap-1 bg-[#12131a] border border-white/[0.06] rounded-xl p-1.5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-medium transition-all ${
              section === s.id ? "bg-white/[0.08] text-white shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-xs">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* === Overview: Prioritized Loan List === */}
      {section === "overview" && (
        <div className="space-y-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2">
            {[{ id: "all", label: "All" }, { id: "gold", label: "🥇 Gold" }, { id: "house", label: "🏠 House" }, { id: "personal", label: "🤝 Personal" }].map((f) => (
              <button key={f.id} onClick={() => setFilterType(f.id)} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${filterType === f.id ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Prioritized list */}
          <div className="bg-[#12131a] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.04]">
              <h3 className="text-[0.85rem] font-semibold text-white tracking-[-0.01em]">
                Payoff Priority ({strategy === "avalanche" ? "Highest Rate First" : "Smallest Balance First"})
              </h3>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-[0.85rem] text-emerald-400 font-medium">Debt free!</p>
                <p className="text-[0.72rem] text-slate-600">No active loans in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {sorted.map((debt, idx) => {
                  const meta = TYPE_META[debt.type];
                  const priority = idx === 0 ? { label: "CLOSE FIRST", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" }
                    : idx === 1 ? { label: "NEXT", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/15" }
                    : { label: `#${idx + 1}`, bg: "bg-white/[0.03]", text: "text-slate-500", border: "border-white/[0.06]" };

                  return (
                    <div key={debt.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.015] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1 w-14">
                          <span className={`text-[0.55rem] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${priority.bg} ${priority.text} border ${priority.border}`}>
                            {priority.label}
                          </span>
                        </div>
                        <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                          <span className="text-[0.8rem]">{meta.icon}</span>
                        </div>
                        <div>
                          <p className="text-[0.82rem] text-slate-200 font-medium">{debt.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[0.65rem] ${meta.color} font-medium`}>{meta.label}</span>
                            <span className="text-[0.5rem] text-slate-600">•</span>
                            <span className="text-[0.65rem] text-slate-500">{debt.detail}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[0.85rem] font-semibold text-white tabular-nums">{formatINR(debt.balance)}</p>
                          <p className="text-[0.65rem] text-slate-500 tabular-nums">{formatINR(debt.monthlyPayment)}/mo</p>
                        </div>
                        <div className="text-right w-14">
                          <p className={`text-[0.8rem] font-bold tabular-nums ${debt.interestRate >= 15 ? "text-rose-400" : debt.interestRate >= 10 ? "text-amber-400" : "text-slate-300"}`}>
                            {debt.interestRate.toFixed(1)}%
                          </p>
                          <p className="text-[0.6rem] text-slate-600">p.a.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sorted.length > 0 && (
              <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
                <span className="text-[0.68rem] text-slate-500">{sorted.length} active loan{sorted.length > 1 ? "s" : ""}</span>
                <span className="text-[0.78rem] font-semibold text-white tabular-nums">Total: {formatINR(sorted.reduce((s, d) => s + d.balance, 0))}</span>
              </div>
            )}
          </div>

          {/* Strategy explanation */}
          <div className="bg-[#12131a] border border-white/[0.06] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border ${strategy === "avalanche" ? "border-indigo-500/20 bg-indigo-500/[0.04]" : "border-white/[0.04]"}`}>
                <p className="text-[0.72rem] font-semibold text-indigo-400 mb-1">⚡ Avalanche Strategy</p>
                <p className="text-[0.65rem] text-slate-500 leading-relaxed">Pay highest interest rate first. Saves the most money over time. Mathematically optimal.</p>
              </div>
              <div className={`p-3 rounded-lg border ${strategy === "snowball" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-white/[0.04]"}`}>
                <p className="text-[0.72rem] font-semibold text-emerald-400 mb-1">🏔️ Snowball Strategy</p>
                <p className="text-[0.65rem] text-slate-500 leading-relaxed">Pay smallest balance first. Quick wins build momentum. Better for motivation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Section: Gold Loans (Editable) === */}
      {section === "gold" && (
        <EditableTable
          title="Gold Loans"
          description="Edit principal, interest rate, or gold weight. Monthly interest recalculates automatically."
          accent="amber"
          columns={[
            { key: "accountName", label: "Account", type: "text" },
            { key: "vendor", label: "Vendor", type: "text" },
            { key: "goldWeight", label: "Gold (g)", type: "number" },
            { key: "principalAmount", label: "Principal (₹)", type: "currency" },
            { key: "roiPct", label: "ROI % p.a.", type: "number" },
            { key: "monthlyInterest", label: "Monthly Int. (₹)", type: "currency" },
            { key: "location", label: "Location", type: "text" },
            { key: "status", label: "Status", type: "status" },
          ]}
          rows={data.goldLoans}
          onUpdate={(updated) => onUpdate((d) => ({ ...d, goldLoans: updated as FinancialData["goldLoans"] }))}
          recalculate={(row) => {
            const r = row as FinancialData["goldLoans"][0];
            return { ...r, monthlyInterest: r.principalAmount * r.roiPct / 12 / 100 };
          }}
        />
      )}

      {/* === Section: House Loans (Editable) === */}
      {section === "house" && (
        <EditableTable
          title="House Loans"
          description="Update EMI, interest rate, or loan amount to see impact on monthly outflows."
          accent="indigo"
          columns={[
            { key: "loanType", label: "Type", type: "text" },
            { key: "bank", label: "Bank", type: "text" },
            { key: "loanAmount", label: "Loan Amount (₹)", type: "currency" },
            { key: "emiAmount", label: "EMI (₹)", type: "currency" },
            { key: "interestRate", label: "Rate %", type: "number" },
            { key: "tenureMonths", label: "Tenure (mo)", type: "number" },
            { key: "remainingMonths", label: "Remaining", type: "number" },
            { key: "status", label: "Status", type: "status" },
          ]}
          rows={data.houseLoans}
          onUpdate={(updated) => onUpdate((d) => ({ ...d, houseLoans: updated as FinancialData["houseLoans"] }))}
        />
      )}

      {/* === Section: Settlements (Borrowed + Lended) === */}
      {section === "settlements" && (
        <div className="space-y-8">
          <EditableTable
            title="Money Borrowed (You Owe)"
            description="People you owe money to — principal + monthly interest."
            accent="rose"
            columns={[
              { key: "personName", label: "Person", type: "text" },
              { key: "amount", label: "Principal (₹)", type: "currency" },
              { key: "roi", label: "Monthly ROI %", type: "number" },
              { key: "monthlyInterest", label: "Monthly Int. (₹)", type: "currency" },
              { key: "location", label: "Location", type: "text" },
              { key: "date", label: "Date", type: "text" },
              { key: "status", label: "Status", type: "status" },
            ]}
            rows={data.borrowed}
            onUpdate={(updated) => onUpdate((d) => ({ ...d, borrowed: updated as FinancialData["borrowed"] }))}
          />
          <EditableTable
            title="Money Lended (Owed to You)"
            description="People who owe you money."
            accent="emerald"
            columns={[
              { key: "personName", label: "Person", type: "text" },
              { key: "amount", label: "Principal (₹)", type: "currency" },
              { key: "roi", label: "Monthly ROI %", type: "number" },
              { key: "monthlyInterest", label: "Monthly Int. (₹)", type: "currency" },
              { key: "location", label: "Location", type: "text" },
              { key: "date", label: "Date", type: "text" },
            ]}
            rows={data.lended}
            onUpdate={(updated) => onUpdate((d) => ({ ...d, lended: updated as FinancialData["lended"] }))}
          />
        </div>
      )}
    </div>
  );
}
