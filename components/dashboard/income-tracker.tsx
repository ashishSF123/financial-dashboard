"use client";

import { useState, useEffect, useCallback } from "react";
import { INCOME_TYPE_LABELS } from "@/lib/finance-types";
import type { IncomeSource, IncomeType } from "@/lib/finance-types";
import { getIncomeSources, addIncomeSource, deleteIncomeSource, getTotalMonthlyIncome } from "@/lib/finance-store";

function formatINR(n: number): string {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}K`;
  return `Rs ${n.toLocaleString("en-IN")}`;
}

const TYPE_ICONS: Record<string, string> = {
  salary: "💼", freelance: "💻", rental: "🏠", business: "🏢",
  interest: "🏦", dividend: "📈", pension: "👴", other: "💰",
};

export function IncomeTracker() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<IncomeType>("salary");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formFreq, setFormFreq] = useState<IncomeSource["frequency"]>("monthly");

  const refresh = useCallback(() => {
    setSources(getIncomeSources());
    setTotalMonthly(getTotalMonthlyIncome());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = () => {
    if (!formName || !formAmount) return;
    addIncomeSource({ type: formType, name: formName, amount: parseFloat(formAmount) || 0, frequency: formFreq, isActive: true });
    setFormName(""); setFormAmount(""); setShowForm(false);
    refresh();
  };

  const activeIncome = sources.reduce((s, i) => s + (i.frequency === "monthly" ? i.amount : i.frequency === "quarterly" ? i.amount / 3 : i.amount / 12), 0);
  const passiveIncome = sources.filter((s) => s.type !== "salary" && s.type !== "freelance").reduce((sum, i) => sum + (i.frequency === "monthly" ? i.amount : i.frequency === "quarterly" ? i.amount / 3 : i.amount / 12), 0);
  const passivePct = totalMonthly > 0 ? (passiveIncome / totalMonthly) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">Income Sources</h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">Track all income streams — salary, freelance, rental, dividends</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[0.75rem] font-medium hover:bg-emerald-500/30 transition-colors">
          <span className="text-sm">+</span> Add Income
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Total Monthly</p>
          <p className="text-[1.05rem] font-bold text-emerald-400 tracking-tight mt-0.5">{formatINR(totalMonthly)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Annual Income</p>
          <p className="text-[1.05rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{formatINR(totalMonthly * 12)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Passive Income</p>
          <p className="text-[1.05rem] font-bold text-indigo-400 tracking-tight mt-0.5">{formatINR(passiveIncome)}/mo</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Passive Ratio</p>
          <p className="text-[1.05rem] font-bold text-cyan-400 tracking-tight mt-0.5">{passivePct.toFixed(0)}%</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as IncomeType)} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50 appearance-none">
                {Object.entries(INCOME_TYPE_LABELS).map(([v, l]) => (<option key={v} value={v} className="bg-[var(--bg-secondary)]">{l}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Source Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={formType === "salary" ? "e.g. TCS Salary" : "Source name"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Amount (Rs)</label>
              <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 tabular-nums" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Frequency</label>
              <select value={formFreq} onChange={(e) => setFormFreq(e.target.value as IncomeSource["frequency"])} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50 appearance-none">
                <option value="monthly" className="bg-[var(--bg-secondary)]">Monthly</option>
                <option value="quarterly" className="bg-[var(--bg-secondary)]">Quarterly</option>
                <option value="yearly" className="bg-[var(--bg-secondary)]">Yearly</option>
                <option value="one-time" className="bg-[var(--bg-secondary)]">One-time</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-[0.78rem] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-emerald-500 text-[var(--text-heading)] text-[0.78rem] font-semibold hover:bg-emerald-600 transition-colors">Save</button>
          </div>
        </div>
      )}

      {/* Income Sources List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)]">Active Income Streams</h3>
        </div>
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">💼</div>
            <p className="text-[0.85rem] text-[var(--text-secondary)]">No income sources added</p>
            <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">Add your salary, freelance income, rental, dividends, etc.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-card)] transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-[0.8rem]">{TYPE_ICONS[s.type] || "💰"}</span>
                  </div>
                  <div>
                    <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.65rem] text-emerald-400 font-medium">{INCOME_TYPE_LABELS[s.type]}</span>
                      <span className="text-[0.5rem] text-[var(--text-muted)]">-</span>
                      <span className="text-[0.65rem] text-[var(--text-muted)] capitalize">{s.frequency}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[0.85rem] font-semibold text-emerald-400 tabular-nums">{formatINR(s.amount)}</p>
                  <button onClick={() => { deleteIncomeSource(s.id); refresh(); }} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 text-[0.75rem] transition-all p-1">x</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passive income insight */}
      {passivePct > 0 && (
        <div className="bg-indigo-500/[0.04] border border-indigo-500/15 rounded-xl p-4">
          <p className="text-[0.75rem] text-indigo-300 font-medium">Passive Income Progress</p>
          <p className="text-[0.68rem] text-[var(--text-secondary)] mt-1">
            {passivePct >= 100 ? "Congratulations! Your passive income covers all expenses — you've achieved financial independence." :
             passivePct >= 50 ? `Passive income covers ${passivePct.toFixed(0)}% of your total income. You're on the path to financial freedom.` :
             `Passive income is ${passivePct.toFixed(0)}% of total. Growing this to 100% = financial independence. Consider increasing rental/dividend/interest income.`}
          </p>
          <div className="mt-2 h-1.5 bg-[var(--bg-card-hover)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${Math.min(passivePct, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
