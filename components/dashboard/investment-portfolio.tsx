"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { INVESTMENT_TYPE_LABELS } from "@/lib/finance-types";
import type { InvestmentHolding, InvestmentType } from "@/lib/finance-types";
import type { FinancialData } from "@/lib/parse-excel";
import { EditableTable } from "./editable-table";
import { AIInsightsCard } from "./ai-insights-card";
import { computeInvestmentInsights } from "@/lib/insights-engine";
import {
  getHoldings,
  addHolding,
  deleteHolding,
  getPortfolioSummary,
  seedHoldingsIfEmpty,
} from "@/lib/finance-store";

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const TYPE_ICONS: Record<string, string> = {
  mutual_fund: "📈",
  stock: "📊",
  fd: "🏦",
  rd: "💳",
  ppf: "🏛️",
  epf: "🏛️",
  nps: "🏛️",
  ssy: "👧",
  gold_physical: "🥇",
  gold_sgb: "🪙",
  gold_digital: "✨",
  real_estate: "🏘️",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  mutual_fund: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  stock: { bg: "bg-blue-500/10", text: "text-blue-400" },
  fd: { bg: "bg-amber-500/10", text: "text-amber-400" },
  rd: { bg: "bg-orange-500/10", text: "text-orange-400" },
  ppf: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  epf: { bg: "bg-violet-500/10", text: "text-violet-400" },
  nps: { bg: "bg-purple-500/10", text: "text-purple-400" },
  ssy: { bg: "bg-pink-500/10", text: "text-pink-400" },
  gold_physical: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  gold_sgb: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  gold_digital: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  real_estate: { bg: "bg-teal-500/10", text: "text-teal-400" },
};

const TYPE_FIELDS: Record<string, { showUnits: boolean; showRate: boolean; showMaturity: boolean; unitLabel: string; rateLabel: string; defaultFreq: InvestmentHolding["frequency"] }> = {
  mutual_fund: { showUnits: true, showRate: true, showMaturity: false, unitLabel: "Units", rateLabel: "NAV (₹)", defaultFreq: "Monthly" },
  stock: { showUnits: true, showRate: true, showMaturity: false, unitLabel: "Shares", rateLabel: "Avg Price (₹)", defaultFreq: "One-time" },
  fd: { showUnits: false, showRate: true, showMaturity: true, unitLabel: "", rateLabel: "Interest Rate (%)", defaultFreq: "One-time" },
  rd: { showUnits: false, showRate: true, showMaturity: true, unitLabel: "", rateLabel: "Interest Rate (%)", defaultFreq: "Monthly" },
  ppf: { showUnits: false, showRate: true, showMaturity: true, unitLabel: "", rateLabel: "Interest Rate (%)", defaultFreq: "Yearly" },
  epf: { showUnits: false, showRate: true, showMaturity: false, unitLabel: "", rateLabel: "Interest Rate (%)", defaultFreq: "Monthly" },
  nps: { showUnits: true, showRate: true, showMaturity: false, unitLabel: "Units", rateLabel: "NAV (₹)", defaultFreq: "Monthly" },
  ssy: { showUnits: false, showRate: true, showMaturity: true, unitLabel: "", rateLabel: "Interest Rate (%)", defaultFreq: "Yearly" },
  gold_physical: { showUnits: true, showRate: true, showMaturity: false, unitLabel: "Grams", rateLabel: "Price/gram (₹)", defaultFreq: "One-time" },
  gold_sgb: { showUnits: true, showRate: true, showMaturity: true, unitLabel: "Units (grams)", rateLabel: "Issue Price (₹)", defaultFreq: "One-time" },
  gold_digital: { showUnits: true, showRate: true, showMaturity: false, unitLabel: "Grams", rateLabel: "Price/gram (₹)", defaultFreq: "One-time" },
  real_estate: { showUnits: false, showRate: false, showMaturity: false, unitLabel: "", rateLabel: "", defaultFreq: "One-time" },
};

interface FormState {
  type: InvestmentType;
  name: string;
  provider: string;
  invested: string;
  current: string;
  units: string;
  rate: string;
  startDate: string;
  maturityDate: string;
  frequency: InvestmentHolding["frequency"];
}

const emptyForm = (type: InvestmentType = "mutual_fund"): FormState => ({
  type,
  name: "",
  provider: "",
  invested: "",
  current: "",
  units: "",
  rate: "",
  startDate: "",
  maturityDate: "",
  frequency: TYPE_FIELDS[type]?.defaultFreq || "Monthly",
});

type Section = "investments" | "real-estate" | "mutual-funds";

interface Props {
  data?: FinancialData;
  onUpdate?: (updater: (d: FinancialData) => FinancialData) => void;
}

export function InvestmentPortfolio({ data, onUpdate }: Props) {
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof getPortfolioSummary> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [section, setSection] = useState<Section>("investments");

  const refresh = useCallback(() => {
    const filter = filterType === "all" ? undefined : { type: filterType };
    setHoldings(getHoldings(filter));
    setSummary(getPortfolioSummary());
  }, [filterType]);

  useEffect(() => {
    seedHoldingsIfEmpty();
    refresh();
  }, [refresh]);

  const openFormForType = (type?: InvestmentType) => {
    const t = type || (filterType !== "all" ? filterType as InvestmentType : "mutual_fund");
    setForm(emptyForm(t));
    setShowForm(true);
  };

  const handleAdd = () => {
    if (!form.name || !form.invested) return;
    addHolding({
      type: form.type,
      name: form.name,
      provider: form.provider,
      investedAmount: parseFloat(form.invested) || 0,
      currentValue: parseFloat(form.current) || parseFloat(form.invested) || 0,
      units: form.units ? parseFloat(form.units) : undefined,
      rateOrNav: form.rate ? parseFloat(form.rate) : undefined,
      startDate: form.startDate || undefined,
      maturityDate: form.maturityDate || undefined,
      frequency: form.frequency,
      status: "active",
    });
    setForm(emptyForm(form.type));
    setShowForm(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteHolding(id);
    refresh();
  };

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      if (updates.type && updates.type !== prev.type) {
        next.units = "";
        next.rate = "";
        next.maturityDate = "";
        next.frequency = TYPE_FIELDS[updates.type]?.defaultFreq || "Monthly";
      }
      return next;
    });
  };

  const typeConfig = TYPE_FIELDS[form.type] || TYPE_FIELDS.mutual_fund;

  // Combined metrics
  const realEstateValue = data?.realEstate?.reduce((s, r) => s + (Number(r.amount) || 0), 0) || 0;
  const insuranceCoverage = data?.insurance?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
  const mfLegacyValue = data?.mutualFunds?.reduce((s, m) => s + (Number(m.amount) || 0), 0) || 0;

  const totalNetWorth = (summary?.totalCurrent || 0) + realEstateValue + mfLegacyValue;

  // Combined allocation (investments + real estate + legacy MFs)
  const allocation: { type: string; label: string; value: number; pct: number }[] = [];
  if (summary && summary.totalCurrent > 0) {
    Object.entries(summary.byType).forEach(([type, d]) => {
      allocation.push({ type, label: INVESTMENT_TYPE_LABELS[type as InvestmentType] || type, value: d.current, pct: 0 });
    });
  }
  if (realEstateValue > 0) {
    allocation.push({ type: "real_estate_legacy", label: "Real Estate", value: realEstateValue, pct: 0 });
  }
  if (mfLegacyValue > 0) {
    allocation.push({ type: "mf_legacy", label: "Mutual Funds (Legacy)", value: mfLegacyValue, pct: 0 });
  }
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0);
  allocation.forEach((a) => { a.pct = allocTotal > 0 ? (a.value / allocTotal) * 100 : 0; });
  allocation.sort((a, b) => b.value - a.value);

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: "investments", label: "Investments", icon: "📈" },
    { id: "real-estate", label: "Real Estate", icon: "🏘️" },
    { id: "mutual-funds", label: "Mutual Funds", icon: "💹" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">
            Portfolio & Assets
          </h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">
            Unified view of investments, property, and insurance
          </p>
        </div>
        {section === "investments" && (
          <button
            onClick={() => openFormForType()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[0.75rem] font-medium hover:bg-emerald-500/30 transition-colors"
          >
            <span className="text-sm">+</span> Add Investment
          </button>
        )}
      </div>

      {/* Combined KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Total Invested</p>
          <p className="text-[1.05rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{formatINR(summary?.totalInvested || 0)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Current Value</p>
          <p className="text-[1.05rem] font-bold text-emerald-400 tracking-tight mt-0.5">{formatINR(summary?.totalCurrent || 0)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Net Worth</p>
          <p className="text-[1.05rem] font-bold text-indigo-400 tracking-tight mt-0.5">{formatINR(totalNetWorth)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Returns</p>
          <p className={`text-[1.05rem] font-bold tracking-tight mt-0.5 ${(summary?.gainPct || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {(summary?.gainPct || 0) >= 0 ? "+" : ""}{(summary?.gainPct || 0).toFixed(1)}%
          </p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Insurance</p>
          <p className="text-[1.05rem] font-bold text-cyan-400 tracking-tight mt-0.5">{formatINR(insuranceCoverage)}</p>
        </div>
      </div>

      {/* Combined Asset Allocation */}
      {allocation.length > 0 && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em] mb-4">Asset Allocation</h3>
          <div className="h-3 rounded-full overflow-hidden flex mb-4">
            {allocation.map((a) => {
              const color = TYPE_COLORS[a.type]?.text.replace("text-", "bg-")
                || (a.type === "real_estate_legacy" ? "bg-teal-400" : a.type === "mf_legacy" ? "bg-emerald-400" : "bg-slate-400");
              return (
                <div key={a.type} className={`${color} transition-all`} style={{ width: `${a.pct}%` }} title={`${a.label}: ${a.pct.toFixed(1)}%`} />
              );
            })}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {allocation.map((a) => {
              const tc = TYPE_COLORS[a.type];
              const dotColor = tc?.text.replace("text-", "bg-")
                || (a.type === "real_estate_legacy" ? "bg-teal-400" : a.type === "mf_legacy" ? "bg-emerald-400" : "bg-slate-400");
              return (
                <div key={a.type} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${dotColor}`} />
                  <div>
                    <span className="text-[0.68rem] text-[var(--text-secondary)]">{a.label}</span>
                    <span className="text-[0.62rem] text-[var(--text-muted)] ml-1.5">{a.pct.toFixed(0)}% • {formatINR(a.value)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <AIInsightsCard
        insights={useMemo(() => computeInvestmentInsights(holdings), [holdings])}
        title="Portfolio Intelligence"
      />

      {/* Section Navigation */}
      <div className="flex items-center gap-1 bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl p-1.5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] font-medium transition-all ${
              section === s.id
                ? "bg-[var(--bg-card-hover)] text-[var(--text-heading)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            <span className="text-xs">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* === Section: Investments === */}
      {section === "investments" && (
        <div className="space-y-5">
          {/* Add Form */}
          {showForm && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{TYPE_ICONS[form.type] || "💼"}</span>
                <h3 className="text-[0.9rem] font-semibold text-[var(--text-heading)]">Add {INVESTMENT_TYPE_LABELS[form.type]}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Type</label>
                  <select value={form.type} onChange={(e) => updateForm({ type: e.target.value as InvestmentType })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50 appearance-none">
                    {Object.entries(INVESTMENT_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-[var(--bg-secondary)] text-[var(--text-heading)]">{TYPE_ICONS[val]} {label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Name</label>
                  <input type="text" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} placeholder={form.type === "mutual_fund" ? "e.g. Axis Bluechip Fund" : form.type === "stock" ? "e.g. Reliance Industries" : "Investment name"} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Provider</label>
                  <input type="text" value={form.provider} onChange={(e) => updateForm({ provider: e.target.value })} placeholder="AMC / Broker / Bank" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Invested Amount (₹)</label>
                  <input type="number" value={form.invested} onChange={(e) => updateForm({ invested: e.target.value })} placeholder="0" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 tabular-nums" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Current Value (₹)</label>
                  <input type="number" value={form.current} onChange={(e) => updateForm({ current: e.target.value })} placeholder="Same as invested if blank" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 tabular-nums" />
                </div>
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Frequency</label>
                  <select value={form.frequency} onChange={(e) => updateForm({ frequency: e.target.value as InvestmentHolding["frequency"] })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50 appearance-none">
                    <option value="Monthly" className="bg-[var(--bg-secondary)]">Monthly (SIP)</option>
                    <option value="Quarterly" className="bg-[var(--bg-secondary)]">Quarterly</option>
                    <option value="Yearly" className="bg-[var(--bg-secondary)]">Yearly</option>
                    <option value="One-time" className="bg-[var(--bg-secondary)]">One-time (Lumpsum)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                {typeConfig.showUnits && (
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">{typeConfig.unitLabel}</label>
                    <input type="number" value={form.units} onChange={(e) => updateForm({ units: e.target.value })} placeholder="0" step="0.0001" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 tabular-nums" />
                  </div>
                )}
                {typeConfig.showRate && (
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">{typeConfig.rateLabel}</label>
                    <input type="number" value={form.rate} onChange={(e) => updateForm({ rate: e.target.value })} placeholder="0" step="0.01" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 tabular-nums" />
                  </div>
                )}
                <div>
                  <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Start Date</label>
                  <input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50" />
                </div>
                {typeConfig.showMaturity && (
                  <div>
                    <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Maturity Date</label>
                    <input type="date" value={form.maturityDate} onChange={(e) => updateForm({ maturityDate: e.target.value })} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-emerald-500/50" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-[0.78rem] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
                <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-emerald-500 text-[var(--text-heading)] text-[0.78rem] font-semibold hover:bg-emerald-600 transition-colors">Save {INVESTMENT_TYPE_LABELS[form.type]}</button>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors whitespace-nowrap ${filterType === "all" ? "bg-[var(--bg-card-hover)] text-[var(--text-heading)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>All</button>
            {Object.entries(INVESTMENT_TYPE_LABELS).map(([type, label]) => (
              <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-medium transition-colors whitespace-nowrap ${filterType === type ? "bg-[var(--bg-card-hover)] text-[var(--text-heading)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"}`}>
                {TYPE_ICONS[type]} {label}
              </button>
            ))}
          </div>

          {/* Holdings List */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">
                Holdings {filterType !== "all" && `— ${INVESTMENT_TYPE_LABELS[filterType as InvestmentType] || filterType}`}
              </h3>
              {filterType !== "all" && (
                <button onClick={() => openFormForType(filterType as InvestmentType)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--bg-card-hover)] border border-[var(--border-card)] text-[var(--text-secondary)] text-[0.68rem] font-medium hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-heading)] transition-colors">
                  <span className="text-xs">+</span> Add {INVESTMENT_TYPE_LABELS[filterType as InvestmentType]}
                </button>
              )}
            </div>

            {holdings.length === 0 ? (
              <div className="text-center py-12 px-6">
                <div className="text-3xl mb-3">{filterType !== "all" ? TYPE_ICONS[filterType] || "💼" : "💼"}</div>
                <p className="text-[0.85rem] text-[var(--text-secondary)] mb-1">{filterType !== "all" ? `No ${INVESTMENT_TYPE_LABELS[filterType as InvestmentType]} holdings yet` : "No investments added yet"}</p>
                <p className="text-[0.72rem] text-[var(--text-muted)] mb-4">Add your first investment to start tracking</p>
                <button onClick={() => openFormForType(filterType !== "all" ? filterType as InvestmentType : undefined)} className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[0.75rem] font-medium hover:bg-emerald-500/30 transition-colors">
                  + Add {filterType !== "all" ? INVESTMENT_TYPE_LABELS[filterType as InvestmentType] : "Investment"}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {holdings.map((h) => {
                  const gain = h.currentValue - h.investedAmount;
                  const gainPct = h.investedAmount > 0 ? (gain / h.investedAmount) * 100 : 0;
                  const tc = TYPE_COLORS[h.type];
                  return (
                    <div key={h.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-card)] transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${tc?.bg || "bg-slate-500/10"} flex items-center justify-center shrink-0`}>
                          <span className="text-[0.8rem]">{TYPE_ICONS[h.type] || "💼"}</span>
                        </div>
                        <div>
                          <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{h.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[0.65rem] ${tc?.text || "text-[var(--text-secondary)]"} font-medium`}>{INVESTMENT_TYPE_LABELS[h.type]}</span>
                            {h.provider && (<><span className="text-[0.5rem] text-[var(--text-muted)]">•</span><span className="text-[0.65rem] text-[var(--text-muted)]">{h.provider}</span></>)}
                            {h.frequency && (<><span className="text-[0.5rem] text-[var(--text-muted)]">•</span><span className="text-[0.65rem] text-[var(--text-muted)]">{h.frequency}</span></>)}
                            {h.units && (<><span className="text-[0.5rem] text-[var(--text-muted)]">•</span><span className="text-[0.65rem] text-[var(--text-muted)]">{h.units} units</span></>)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <p className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(h.currentValue)}</p>
                          {h.investedAmount > 0 && (
                            <p className={`text-[0.65rem] font-medium tabular-nums ${gain >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {gain >= 0 ? "+" : ""}{formatINR(Math.abs(gain))} ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
                            </p>
                          )}
                          {h.investedAmount === 0 && <p className="text-[0.65rem] text-[var(--text-muted)]">Inv: ₹0</p>}
                        </div>
                        <button onClick={() => handleDelete(h.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 text-[0.75rem] transition-all p-1" title="Delete">×</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {holdings.length > 0 && (
              <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[0.68rem] text-[var(--text-muted)]">{holdings.length} holding{holdings.length > 1 ? "s" : ""}</span>
                  <button onClick={() => openFormForType(filterType !== "all" ? filterType as InvestmentType : undefined)} className="text-[0.65rem] text-emerald-400/70 hover:text-emerald-300 font-medium transition-colors">+ Add more</button>
                </div>
                <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">Total: {formatINR(holdings.reduce((s, h) => s + h.currentValue, 0))}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Section: Real Estate === */}
      {section === "real-estate" && data && onUpdate && (
        <EditableTable
          title="Real Estate"
          description="Property holdings and their current market values."
          accent="cyan"
          columns={[
            { key: "name", label: "Property", type: "text" },
            { key: "type", label: "Type", type: "text" },
            { key: "amount", label: "Market Value (₹)", type: "currency" },
            { key: "status", label: "Status", type: "status" },
            { key: "place", label: "Location", type: "text" },
          ]}
          rows={data.realEstate}
          onUpdate={(updated) => onUpdate((d) => ({ ...d, realEstate: updated as FinancialData["realEstate"] }))}
        />
      )}

      {/* === Section: Mutual Funds (Legacy) === */}
      {section === "mutual-funds" && data && onUpdate && (
        <EditableTable
          title="Mutual Funds"
          description="SIP and lumpsum investment portfolio from Excel data."
          accent="emerald"
          columns={[
            { key: "name", label: "Fund Name", type: "text" },
            { key: "type", label: "Category", type: "text" },
            { key: "provider", label: "AMC", type: "text" },
            { key: "amount", label: "Invested (₹)", type: "currency" },
            { key: "status", label: "Frequency", type: "text" },
          ]}
          rows={data.mutualFunds}
          onUpdate={(updated) => onUpdate((d) => ({ ...d, mutualFunds: updated as FinancialData["mutualFunds"] }))}
        />
      )}

      {/* Empty state for asset sections without data */}
      {section !== "investments" && (!data || !onUpdate) && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl text-center py-12 px-6">
          <div className="text-3xl mb-3">{sections.find((s) => s.id === section)?.icon}</div>
          <p className="text-[0.85rem] text-[var(--text-secondary)] mb-1">No data loaded</p>
          <p className="text-[0.72rem] text-[var(--text-muted)]">Upload your financial data file to see {section.replace("-", " ")} details</p>
        </div>
      )}
    </div>
  );
}
