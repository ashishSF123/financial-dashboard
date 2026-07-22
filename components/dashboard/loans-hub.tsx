"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { FinancialData } from "@/lib/parse-excel";
import type { AdditionalLoan, AdditionalLoanType } from "@/lib/finance-types";
import { LOAN_TYPE_LABELS } from "@/lib/finance-types";
import { EditableTable } from "./editable-table";
import { AIInsightsCard } from "./ai-insights-card";
import { computeDebtInsights } from "@/lib/insights-engine";
import { getAdditionalLoans, addAdditionalLoan, deleteAdditionalLoan } from "@/lib/finance-store";

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
  credit_card: { icon: "💳", label: "Credit Card", color: "text-purple-400", bg: "bg-purple-500/10" },
  personal_loan: { icon: "💰", label: "Personal Loan", color: "text-pink-400", bg: "bg-pink-500/10" },
  vehicle_loan: { icon: "🚗", label: "Vehicle Loan", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  chit_fund: { icon: "🤲", label: "Chit Fund", color: "text-violet-400", bg: "bg-violet-500/10" },
  mortgage: { icon: "🏦", label: "Mortgage", color: "text-sky-400", bg: "bg-sky-500/10" },
  education_loan: { icon: "🎓", label: "Education Loan", color: "text-teal-400", bg: "bg-teal-500/10" },
  business_loan: { icon: "🏢", label: "Business Loan", color: "text-orange-400", bg: "bg-orange-500/10" },
  consumer_loan: { icon: "🛒", label: "Consumer EMI", color: "text-lime-400", bg: "bg-lime-500/10" },
  peer_lending: { icon: "📱", label: "App Loan", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  custom: { icon: "📋", label: "Other", color: "text-[var(--text-secondary)]", bg: "bg-slate-500/10" },
};

interface Props {
  data: FinancialData;
  onUpdate: (updater: (d: FinancialData) => FinancialData) => void;
}

export function LoansHub({ data, onUpdate }: Props) {
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [filterType, setFilterType] = useState<string>("all");
  const [section, setSection] = useState<"overview" | "gold" | "house" | "settlements" | "other-loans">("overview");
  const [additionalLoans, setAdditionalLoans] = useState<AdditionalLoan[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<AdditionalLoanType>("credit_card");
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("");
  const [formBalance, setFormBalance] = useState("");
  const [formEmi, setFormEmi] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formTenure, setFormTenure] = useState("");

  const refreshLoans = useCallback(() => {
    setAdditionalLoans(getAdditionalLoans());
  }, []);

  useEffect(() => { refreshLoans(); }, [refreshLoans]);

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
    // Additional loans (credit card, personal loan, vehicle loan)
    additionalLoans.forEach((l) => {
      if (l.status !== "closed") {
        items.push({
          id: l.id,
          name: l.name,
          balance: l.outstandingBalance,
          monthlyPayment: l.emiAmount,
          interestRate: l.interestRate,
          type: l.type,
          status: l.status,
          detail: l.provider + (l.remainingMonths ? ` \u2022 ${l.remainingMonths} months left` : ""),
        });
      }
    });
    return items;
  }, [data, additionalLoans]);

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
    { id: "other-loans" as const, label: "All Other Loans", icon: "💳" },
    { id: "settlements" as const, label: "Settlements", icon: "🤝" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">Loans & Debt</h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">All liabilities in one place with payoff recommendations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStrategy("avalanche")}
            className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${strategy === "avalanche" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
          >
            Avalanche
          </button>
          <button
            onClick={() => setStrategy("snowball")}
            className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${strategy === "snowball" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}
          >
            Snowball
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#12131a] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Total Debt</p>
          <p className="text-[1.1rem] font-bold text-rose-400 tracking-tight mt-0.5">{formatINR(totalDebt)}</p>
        </div>
        <div className="bg-[#12131a] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Monthly Outflow</p>
          <p className="text-[1.1rem] font-bold text-amber-400 tracking-tight mt-0.5">{formatINR(totalMonthly)}</p>
        </div>
        <div className="bg-[#12131a] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Highest Rate</p>
          <p className="text-[1.1rem] font-bold text-rose-400 tracking-tight mt-0.5">{highestRate.toFixed(1)}% p.a.</p>
        </div>
        <div className="bg-[#12131a] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Active Loans</p>
          <p className="text-[1.1rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{activeCount}</p>
        </div>
      </div>

      {/* AI Insights */}
      <AIInsightsCard
        insights={useMemo(() => computeDebtInsights(
          data.goldLoans.filter((g) => g.status?.toLowerCase() !== "completed"),
          data.houseLoans.filter((h) => h.status?.toLowerCase() !== "completed"),
          data.borrowed.filter((b) => b.status?.toLowerCase() !== "completed"),
          additionalLoans.filter((l) => l.status !== "closed"),
          data.monthlyCredit || 0
        ), [data, additionalLoans])}
        title="Debt Intelligence"
      />

      {/* Recommendation Card */}
      {recommendation && (
        <div className="bg-gradient-to-r from-indigo-500/[0.08] to-rose-500/[0.05] border border-indigo-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div className="flex-1">
              <h3 className="text-[0.9rem] font-semibold text-[var(--text-heading)] mb-1">
                Close &quot;{recommendation.name}&quot; first
              </h3>
              <p className="text-[0.78rem] text-[var(--text-secondary)] leading-relaxed">
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
                <span className="text-[0.65rem] text-[var(--text-muted)]">
                  {TYPE_META[recommendation.type].icon} {TYPE_META[recommendation.type].label} • {recommendation.detail}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex items-center gap-1 bg-[#12131a] border border-[var(--border-card)] rounded-xl p-1.5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-medium transition-all ${
              section === s.id ? "bg-white/[0.08] text-[var(--text-heading)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
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
          <div className="flex items-center gap-2 flex-wrap">
            {[{ id: "all", label: "All" }, { id: "gold", label: "Gold" }, { id: "house", label: "House" }, { id: "personal", label: "Borrowed" }, { id: "credit_card", label: "Credit Card" }, { id: "personal_loan", label: "Personal" }, { id: "vehicle_loan", label: "Vehicle" }, { id: "chit_fund", label: "Chit Fund" }, { id: "mortgage", label: "Mortgage" }, { id: "education_loan", label: "Education" }, { id: "business_loan", label: "Business" }, { id: "consumer_loan", label: "Consumer" }, { id: "peer_lending", label: "App Loan" }].map((f) => (
              <button key={f.id} onClick={() => setFilterType(f.id)} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${filterType === f.id ? "bg-white/[0.08] text-[var(--text-heading)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Prioritized list */}
          <div className="bg-[#12131a] border border-[var(--border-card)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
              <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">
                Payoff Priority ({strategy === "avalanche" ? "Highest Rate First" : "Smallest Balance First"})
              </h3>
            </div>

            {sorted.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">🎉</div>
                <p className="text-[0.85rem] text-emerald-400 font-medium">Debt free!</p>
                <p className="text-[0.72rem] text-[var(--text-muted)]">No active loans in this category</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {sorted.map((debt, idx) => {
                  const meta = TYPE_META[debt.type];
                  const priority = idx === 0 ? { label: "CLOSE FIRST", bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" }
                    : idx === 1 ? { label: "NEXT", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/15" }
                    : { label: `#${idx + 1}`, bg: "bg-[var(--bg-input)]", text: "text-[var(--text-muted)]", border: "border-[var(--border-card)]" };

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
                          <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{debt.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[0.65rem] ${meta.color} font-medium`}>{meta.label}</span>
                            <span className="text-[0.5rem] text-[var(--text-muted)]">•</span>
                            <span className="text-[0.65rem] text-[var(--text-muted)]">{debt.detail}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(debt.balance)}</p>
                          <p className="text-[0.65rem] text-[var(--text-muted)] tabular-nums">{formatINR(debt.monthlyPayment)}/mo</p>
                        </div>
                        <div className="text-right w-14">
                          <p className={`text-[0.8rem] font-bold tabular-nums ${debt.interestRate >= 15 ? "text-rose-400" : debt.interestRate >= 10 ? "text-amber-400" : "text-[var(--text-secondary)]"}`}>
                            {debt.interestRate.toFixed(1)}%
                          </p>
                          <p className="text-[0.6rem] text-[var(--text-muted)]">p.a.</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sorted.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-white/[0.01] flex items-center justify-between">
                <span className="text-[0.68rem] text-[var(--text-muted)]">{sorted.length} active loan{sorted.length > 1 ? "s" : ""}</span>
                <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">Total: {formatINR(sorted.reduce((s, d) => s + d.balance, 0))}</span>
              </div>
            )}
          </div>

          {/* Strategy explanation */}
          <div className="bg-[#12131a] border border-[var(--border-card)] rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-lg border ${strategy === "avalanche" ? "border-indigo-500/20 bg-indigo-500/[0.04]" : "border-[var(--border-subtle)]"}`}>
                <p className="text-[0.72rem] font-semibold text-indigo-400 mb-1">⚡ Avalanche Strategy</p>
                <p className="text-[0.65rem] text-[var(--text-muted)] leading-relaxed">Pay highest interest rate first. Saves the most money over time. Mathematically optimal.</p>
              </div>
              <div className={`p-3 rounded-lg border ${strategy === "snowball" ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-[var(--border-subtle)]"}`}>
                <p className="text-[0.72rem] font-semibold text-emerald-400 mb-1">🏔️ Snowball Strategy</p>
                <p className="text-[0.65rem] text-[var(--text-muted)] leading-relaxed">Pay smallest balance first. Quick wins build momentum. Better for motivation.</p>
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
      {/* === Section: All Other Loans (Credit Card, Personal, Vehicle, Chit Fund, Mortgage, etc.) === */}
      {section === "other-loans" && (
        <div className="space-y-5">
          {/* Add form */}
          {showAddForm ? (
            <div className="bg-[#12131a] border border-[var(--border-card)] rounded-2xl p-5">
              <h3 className="text-[0.9rem] font-semibold text-[var(--text-heading)] mb-4">Add {LOAN_TYPE_LABELS[formType]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Loan Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as AdditionalLoanType)} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-indigo-500/50 appearance-none">
                    {Object.entries(LOAN_TYPE_LABELS).map(([v, l]) => (<option key={v} value={v} className="bg-[#1a1b23]">{l}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Name</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={formType === "credit_card" ? "e.g. HDFC Regalia" : formType === "chit_fund" ? "e.g. Mahila Chit 25L" : formType === "mortgage" ? "e.g. SBI LAP" : formType === "education_loan" ? "e.g. MBA Loan" : "Loan name"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Provider / Bank</label>
                  <input type="text" value={formProvider} onChange={(e) => setFormProvider(e.target.value)} placeholder={formType === "chit_fund" ? "e.g. Margadarsi / Local group" : formType === "peer_lending" ? "e.g. KreditBee / MoneyTap" : "Bank / Financier"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Outstanding (Rs)</label>
                  <input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} placeholder="0" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">{formType === "credit_card" ? "Monthly Payment" : formType === "chit_fund" ? "Monthly Installment" : "EMI"} (Rs)</label>
                  <input type="number" value={formEmi} onChange={(e) => setFormEmi(e.target.value)} placeholder="0" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Interest Rate (% p.a.)</label>
                  <input type="number" value={formRate} onChange={(e) => setFormRate(e.target.value)} placeholder={formType === "credit_card" ? "36" : formType === "chit_fund" ? "0" : "12"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums" />
                </div>
                {formType === "credit_card" && (
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Credit Limit (Rs)</label>
                    <input type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} placeholder="200000" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums" />
                  </div>
                )}
                {formType !== "credit_card" && (
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">{formType === "chit_fund" ? "Total Months" : "Tenure (months)"}</label>
                    <input type="number" value={formTenure} onChange={(e) => setFormTenure(e.target.value)} placeholder={formType === "chit_fund" ? "25" : "36"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddForm(false)} className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-[0.78rem] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
                <button onClick={() => {
                  if (!formName || !formBalance) return;
                  addAdditionalLoan({
                    type: formType,
                    name: formName,
                    provider: formProvider,
                    outstandingBalance: parseFloat(formBalance) || 0,
                    emiAmount: parseFloat(formEmi) || 0,
                    interestRate: parseFloat(formRate) || 0,
                    creditLimit: formLimit ? parseFloat(formLimit) : undefined,
                    tenureMonths: formTenure ? parseInt(formTenure) : undefined,
                    status: "active",
                  });
                  setFormName(""); setFormProvider(""); setFormBalance(""); setFormEmi(""); setFormRate(""); setFormLimit(""); setFormTenure("");
                  setShowAddForm(false);
                  refreshLoans();
                }} className="px-5 py-2 rounded-lg bg-indigo-500 text-[var(--text-heading)] text-[0.78rem] font-semibold hover:bg-indigo-600 transition-colors">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button onClick={() => { setFormType("credit_card"); setShowAddForm(true); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[0.75rem] font-medium hover:bg-indigo-500/30 transition-colors">
                <span className="text-sm">+</span> Add Loan
              </button>
            </div>
          )}

          {/* Grouped by type */}
          <div className="bg-[#12131a] border border-[var(--border-card)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)]">All Loans & Dues</h3>
              <span className="text-[0.65rem] text-[var(--text-muted)]">{additionalLoans.length} entries</span>
            </div>
            {additionalLoans.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-3xl mb-3">💳</div>
                <p className="text-[0.85rem] text-[var(--text-secondary)]">No additional loans added</p>
                <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">Add credit cards, chit funds, vehicle loans, education loans, and more</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {additionalLoans.map((l) => {
                  const meta = TYPE_META[l.type] || TYPE_META.custom;
                  return (
                    <div key={l.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.015] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                          <span className="text-[0.8rem]">{meta.icon}</span>
                        </div>
                        <div>
                          <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{l.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[0.65rem] ${meta.color} font-medium`}>{meta.label}</span>
                            {l.provider && (<><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className="text-[0.65rem] text-[var(--text-muted)]">{l.provider}</span></>)}
                            {l.interestRate > 0 && (<><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className="text-[0.65rem] text-[var(--text-muted)]">{l.interestRate}% p.a.</span></>)}
                            {l.tenureMonths && (<><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className="text-[0.65rem] text-[var(--text-muted)]">{l.tenureMonths} months</span></>)}
                            {l.creditLimit && (<><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className="text-[0.65rem] text-[var(--text-muted)]">Limit: {formatINR(l.creditLimit)}</span></>)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(l.outstandingBalance)}</p>
                          {l.emiAmount > 0 && <p className="text-[0.65rem] text-[var(--text-muted)] tabular-nums">{formatINR(l.emiAmount)}/mo</p>}
                        </div>
                        <button onClick={() => { deleteAdditionalLoan(l.id); refreshLoans(); }} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 text-[0.75rem] transition-all p-1" title="Delete">x</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {additionalLoans.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-white/[0.01] flex items-center justify-between">
                <span className="text-[0.68rem] text-[var(--text-muted)]">{additionalLoans.length} loan{additionalLoans.length > 1 ? "s" : ""}</span>
                <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">Total: {formatINR(additionalLoans.reduce((s, l) => s + l.outstandingBalance, 0))}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
