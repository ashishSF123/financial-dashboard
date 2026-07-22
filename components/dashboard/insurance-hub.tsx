"use client";
import { formatINR } from "@/lib/format-currency";

import { useState, useEffect, useCallback, useMemo } from "react";
import { INSURANCE_TYPE_LABELS } from "@/lib/finance-types";
import type { InsurancePolicy, InsuranceType } from "@/lib/finance-types";
import { AIInsightsCard } from "./ai-insights-card";
import { computeInsuranceInsights } from "@/lib/insights-engine";
import {
  getInsurancePolicies,
  addInsurancePolicy,
  deleteInsurancePolicy,
  getInsuranceSummary,
} from "@/lib/finance-store";


const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  health: { icon: "🏥", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  term: { icon: "🛡️", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  vehicle: { icon: "🚗", color: "text-amber-400", bg: "bg-amber-500/10" },
  home: { icon: "🏠", color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

interface FormState {
  type: InsuranceType;
  name: string;
  provider: string;
  policyNumber: string;
  sumAssured: string;
  premium: string;
  premiumFrequency: InsurancePolicy["premiumFrequency"];
  startDate: string;
  endDate: string;
  renewalDate: string;
  lastPaidDate: string;
  nextDueDate: string;
  nomineeName: string;
  coverageDetails: string;
  claimHistory: string;
}

const emptyForm = (type: InsuranceType = "health"): FormState => ({
  type,
  name: "",
  provider: "",
  policyNumber: "",
  sumAssured: "",
  premium: "",
  premiumFrequency: "yearly",
  startDate: "",
  endDate: "",
  renewalDate: "",
  lastPaidDate: "",
  nextDueDate: "",
  nomineeName: "",
  coverageDetails: "",
  claimHistory: "",
});

export function InsuranceHub() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getInsuranceSummary> | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const filter = filterType === "all" ? undefined : { type: filterType };
    setPolicies(getInsurancePolicies(filter));
    setSummary(getInsuranceSummary());
  }, [filterType]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = () => {
    if (!form.name || !form.provider) return;
    addInsurancePolicy({
      type: form.type,
      name: form.name,
      provider: form.provider,
      policyNumber: form.policyNumber,
      sumAssured: parseFloat(form.sumAssured) || 0,
      premium: parseFloat(form.premium) || 0,
      premiumFrequency: form.premiumFrequency,
      startDate: form.startDate,
      endDate: form.endDate,
      renewalDate: form.renewalDate,
      lastPaidDate: form.lastPaidDate,
      nextDueDate: form.nextDueDate,
      nomineeName: form.nomineeName,
      coverageDetails: form.coverageDetails,
      claimHistory: form.claimHistory,
      status: "active",
    });
    setForm(emptyForm(form.type));
    setShowForm(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteInsurancePolicy(id);
    refresh();
  };

  const updateForm = (updates: Partial<FormState>) => setForm((prev) => ({ ...prev, ...updates }));

  const daysUntil = (dateStr: string) => {
    if (!dateStr) return null;
    const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">Insurance</h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">Health, Term Life, Vehicle, and Home insurance policies</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm(filterType !== "all" ? filterType as InsuranceType : "health")); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[0.75rem] font-medium hover:bg-cyan-500/30 transition-colors"
        >
          <span className="text-sm">+</span> Add Policy
        </button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Total Coverage</p>
            <p className="text-[1.05rem] font-bold text-cyan-400 tracking-tight mt-0.5">{formatINR(summary.totalCoverage)}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Annual Premium</p>
            <p className="text-[1.05rem] font-bold text-amber-400 tracking-tight mt-0.5">{formatINR(summary.totalPremium)}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Active Policies</p>
            <p className="text-[1.05rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{summary.policyCount}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
            <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Renewals Due</p>
            <p className={`text-[1.05rem] font-bold tracking-tight mt-0.5 ${summary.upcomingRenewals.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {summary.upcomingRenewals.length > 0 ? `${summary.upcomingRenewals.length} soon` : "✓ Clear"}
            </p>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <AIInsightsCard
        insights={useMemo(() => computeInsuranceInsights(policies, 100000), [policies])}
        title="Insurance Intelligence"
      />

      {/* Add Form */}
      {showForm && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{TYPE_META[form.type]?.icon || "🛡️"}</span>
            <h3 className="text-[0.9rem] font-semibold text-[var(--text-heading)]">Add {INSURANCE_TYPE_LABELS[form.type]}</h3>
          </div>

          {/* Row 1: Type, Name, Provider, Policy # */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Type</label>
              <select value={form.type} onChange={(e) => updateForm({ type: e.target.value as InsuranceType })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50 appearance-none">
                {Object.entries(INSURANCE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val} className="bg-[var(--bg-secondary)]">{TYPE_META[val]?.icon} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Policy Name</label>
              <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="e.g. Star Health Gold" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Provider</label>
              <input type="text" value={form.provider} onChange={(e) => updateForm({ provider: e.target.value })} placeholder="e.g. Star Health" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Policy Number</label>
              <input type="text" value={form.policyNumber} onChange={(e) => updateForm({ policyNumber: e.target.value })} placeholder="POL-XXXXX" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>

          {/* Row 2: Sum Assured, Premium, Frequency, Nominee */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Sum Assured (₹)</label>
              <input type="number" value={form.sumAssured} onChange={(e) => updateForm({ sumAssured: e.target.value })} placeholder="500000" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 tabular-nums" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Premium (₹)</label>
              <input type="number" value={form.premium} onChange={(e) => updateForm({ premium: e.target.value })} placeholder="12000" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50 tabular-nums" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Frequency</label>
              <select value={form.premiumFrequency} onChange={(e) => updateForm({ premiumFrequency: e.target.value as InsurancePolicy["premiumFrequency"] })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50 appearance-none">
                <option value="monthly" className="bg-[var(--bg-secondary)]">Monthly</option>
                <option value="quarterly" className="bg-[var(--bg-secondary)]">Quarterly</option>
                <option value="half-yearly" className="bg-[var(--bg-secondary)]">Half-Yearly</option>
                <option value="yearly" className="bg-[var(--bg-secondary)]">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Nominee</label>
              <input type="text" value={form.nomineeName} onChange={(e) => updateForm({ nomineeName: e.target.value })} placeholder="Nominee name" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => updateForm({ endDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Renewal Date</label>
              <input type="date" value={form.renewalDate} onChange={(e) => updateForm({ renewalDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Last Paid</label>
              <input type="date" value={form.lastPaidDate} onChange={(e) => updateForm({ lastPaidDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Next Due</label>
              <input type="date" value={form.nextDueDate} onChange={(e) => updateForm({ nextDueDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>

          {/* Row 4: Coverage & Claims */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Coverage Details</label>
              <input type="text" value={form.coverageDetails} onChange={(e) => updateForm({ coverageDetails: e.target.value })} placeholder="e.g. Room rent ₹5K/day, ICU covered" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Claim History</label>
              <input type="text" value={form.claimHistory} onChange={(e) => updateForm({ claimHistory: e.target.value })} placeholder="e.g. No claims / Claimed ₹50K in 2024" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-cyan-500/50" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-[0.78rem] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-cyan-500 text-[var(--text-heading)] text-[0.78rem] font-semibold hover:bg-cyan-600 transition-colors">Save Policy</button>
          </div>
        </div>
      )}

      {/* Filter by type */}
      <div className="flex items-center gap-2">
        {[{ id: "all", label: "All", icon: "📋" }, ...Object.entries(INSURANCE_TYPE_LABELS).map(([id, label]) => ({ id, label, icon: TYPE_META[id]?.icon || "🛡️" }))].map((f) => (
          <button key={f.id} onClick={() => setFilterType(f.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors ${filterType === f.id ? "bg-[var(--bg-card-hover)] text-[var(--text-heading)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
            <span className="text-xs">{f.icon}</span> {f.label}
          </button>
        ))}
      </div>

      {/* Policy List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">
            Policies {filterType !== "all" && `— ${INSURANCE_TYPE_LABELS[filterType as InsuranceType]}`}
          </h3>
        </div>

        {policies.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="text-3xl mb-3">🛡️</div>
            <p className="text-[0.85rem] text-[var(--text-secondary)] mb-1">No insurance policies added</p>
            <p className="text-[0.72rem] text-[var(--text-muted)] mb-4">Add your health, term, vehicle, or home insurance</p>
            <button onClick={() => { setForm(emptyForm()); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[0.75rem] font-medium hover:bg-cyan-500/30 transition-colors">
              + Add Policy
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {policies.map((p) => {
              const meta = TYPE_META[p.type];
              const days = daysUntil(p.nextDueDate);
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-card)] transition-colors cursor-pointer group" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${meta?.bg || "bg-slate-500/10"} flex items-center justify-center shrink-0`}>
                        <span className="text-[0.8rem]">{meta?.icon || "🛡️"}</span>
                      </div>
                      <div>
                        <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[0.65rem] ${meta?.color || "text-[var(--text-secondary)]"} font-medium`}>{INSURANCE_TYPE_LABELS[p.type]}</span>
                          <span className="text-[0.5rem] text-[var(--text-muted)]">•</span>
                          <span className="text-[0.65rem] text-[var(--text-muted)]">{p.provider}</span>
                          {p.policyNumber && (<><span className="text-[0.5rem] text-[var(--text-muted)]">•</span><span className="text-[0.65rem] text-[var(--text-muted)] font-mono">{p.policyNumber}</span></>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(p.sumAssured)}</p>
                        <p className="text-[0.65rem] text-[var(--text-muted)] tabular-nums">{formatINR(p.premium)}/{p.premiumFrequency === "yearly" ? "yr" : p.premiumFrequency === "monthly" ? "mo" : p.premiumFrequency === "quarterly" ? "qtr" : "6mo"}</p>
                      </div>
                      {days !== null && (
                        <span className={`text-[0.58rem] font-semibold px-2 py-1 rounded-md ${days <= 7 ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" : days <= 30 ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"}`}>
                          {days <= 0 ? "OVERDUE" : `${days}d left`}
                        </span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 text-[0.75rem] transition-all p-1" title="Delete">×</button>
                    </div>
                  </div>
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 bg-[var(--bg-card)] border-t border-white/[0.03]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[0.7rem]">
                        <div><span className="text-[var(--text-muted)] block mb-0.5">Nominee</span><span className="text-[var(--text-heading)]">{p.nomineeName || "—"}</span></div>
                        <div><span className="text-[var(--text-muted)] block mb-0.5">Start Date</span><span className="text-[var(--text-heading)]">{p.startDate || "—"}</span></div>
                        <div><span className="text-[var(--text-muted)] block mb-0.5">End Date</span><span className="text-[var(--text-heading)]">{p.endDate || "—"}</span></div>
                        <div><span className="text-[var(--text-muted)] block mb-0.5">Renewal</span><span className="text-[var(--text-heading)]">{p.renewalDate || "—"}</span></div>
                        <div><span className="text-[var(--text-muted)] block mb-0.5">Last Paid</span><span className="text-[var(--text-heading)]">{p.lastPaidDate || "—"}</span></div>
                        <div><span className="text-[var(--text-muted)] block mb-0.5">Next Due</span><span className={`${days !== null && days <= 7 ? "text-rose-400" : "text-[var(--text-heading)]"}`}>{p.nextDueDate || "—"}</span></div>
                        <div className="col-span-2"><span className="text-[var(--text-muted)] block mb-0.5">Coverage</span><span className="text-[var(--text-heading)]">{p.coverageDetails || "—"}</span></div>
                        <div className="col-span-2"><span className="text-[var(--text-muted)] block mb-0.5">Claims</span><span className="text-[var(--text-heading)]">{p.claimHistory || "No claims"}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {policies.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
            <span className="text-[0.68rem] text-[var(--text-muted)]">{policies.length} polic{policies.length > 1 ? "ies" : "y"} • Click to expand details</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">Coverage: {formatINR(policies.reduce((s, p) => s + p.sumAssured, 0))}</span>
          </div>
        )}
      </div>
    </div>
  );
}
