"use client";

import { useState } from "react";
import { formatINR } from "./kpi-cards";

interface SettingsPanelProps {
  monthlyCredit: number;
  goldRate: number;
  leases: { name: string; amount: number }[];
  onUpdateCredit: (value: number) => void;
  onUpdateGoldRate: (value: number) => void;
  onUpdateLeases: (leases: { name: string; amount: number }[]) => void;
}

export function SettingsPanel({ monthlyCredit, goldRate, leases, onUpdateCredit, onUpdateGoldRate, onUpdateLeases }: SettingsPanelProps) {
  const [creditVal, setCreditVal] = useState(String(monthlyCredit));
  const [goldRateVal, setGoldRateVal] = useState(String(goldRate));
  const [leaseVals, setLeaseVals] = useState(leases.map((l) => ({ name: l.name, amount: String(l.amount) })));
  const [saved, setSaved] = useState<string | null>(null);

  const showSaved = (field: string) => {
    setSaved(field);
    setTimeout(() => setSaved(null), 2000);
  };

  const applyCredit = () => { onUpdateCredit(parseFloat(creditVal) || 0); showSaved("credit"); };
  const applyGoldRate = () => { onUpdateGoldRate(parseFloat(goldRateVal) || 0); showSaved("gold"); };
  const applyLeases = () => {
    onUpdateLeases(leaseVals.map((l) => ({ name: l.name, amount: parseFloat(l.amount) || 0 })));
    showSaved("leases");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-[var(--text-heading)] text-lg font-semibold tracking-tight">Global Settings</h2>
        <p className="text-[var(--text-muted)] text-[11px] mt-0.5 font-medium">
          Update these values to instantly recalculate all dashboard metrics.
        </p>
      </div>

      {/* Main Settings */}
      <div className="relative overflow-hidden bg-[#12131a] border border-[var(--border-card)] rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.01] to-transparent pointer-events-none" />
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Monthly Credit */}
          <div>
            <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2.5">Monthly Credit Income</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">₹</span>
                <input
                  type="number"
                  value={creditVal}
                  onChange={(e) => setCreditVal(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              <button
                onClick={applyCredit}
                className="bg-indigo-500/[0.1] text-indigo-300 border border-indigo-500/20 px-4 py-2.5 rounded-lg text-[11px] font-semibold hover:bg-indigo-500/[0.18] transition-all"
              >
                {saved === "credit" ? "✓ Saved" : "Apply"}
              </button>
            </div>
            <p className="text-[var(--text-muted)] text-[9px] mt-2 font-medium">Current: {formatINR(monthlyCredit)} (Salary + Rentals)</p>
          </div>

          {/* Gold Rate */}
          <div>
            <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2.5">Gold Rate (22ct / gram)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">₹</span>
                <input
                  type="number"
                  value={goldRateVal}
                  onChange={(e) => setGoldRateVal(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
                />
              </div>
              <button
                onClick={applyGoldRate}
                className="bg-amber-500/[0.1] text-amber-300 border border-amber-500/20 px-4 py-2.5 rounded-lg text-[11px] font-semibold hover:bg-amber-500/[0.18] transition-all"
              >
                {saved === "gold" ? "✓ Saved" : "Apply"}
              </button>
            </div>
            <p className="text-[var(--text-muted)] text-[9px] mt-2 font-medium">Current: ₹{goldRate.toLocaleString("en-IN")}/gram</p>
          </div>
        </div>
      </div>

      {/* Lease Liabilities */}
      <div className="relative overflow-hidden bg-[#12131a] border border-[var(--border-card)] rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.01] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[var(--text-heading)] text-[0.88rem] font-semibold tracking-[-0.01em]">Lease Liabilities</h3>
              <p className="text-[var(--text-muted)] text-[10px] mt-0.5">Zero-interest principal obligations</p>
            </div>
            <span className="text-[10px] text-cyan-400/60 font-semibold">
              Total: {formatINR(leaseVals.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0))}
            </span>
          </div>

          <div className="space-y-2.5">
            {leaseVals.map((lease, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <input
                  type="text"
                  value={lease.name}
                  onChange={(e) => {
                    const updated = [...leaseVals];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setLeaseVals(updated);
                  }}
                  className="w-40 bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-xs text-[var(--text-heading)] outline-none focus:border-cyan-500/30 transition-all"
                  placeholder="Name"
                />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]">₹</span>
                  <input
                    type="number"
                    value={lease.amount}
                    onChange={(e) => {
                      const updated = [...leaseVals];
                      updated[idx] = { ...updated[idx], amount: e.target.value };
                      setLeaseVals(updated);
                    }}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg pl-7 pr-3 py-2 text-xs text-[var(--text-heading)] outline-none focus:border-cyan-500/30 transition-all"
                  />
                </div>
                <button
                  onClick={() => setLeaseVals(leaseVals.filter((_, i) => i !== idx))}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md bg-rose-500/[0.06] border border-rose-500/10 flex items-center justify-center text-rose-400/50 hover:text-rose-400 text-[10px] transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => setLeaseVals([...leaseVals, { name: "", amount: "0" }])}
              className="text-cyan-400/70 text-[11px] font-medium hover:text-cyan-300 transition-colors"
            >
              + Add Lease Entry
            </button>
            <button
              onClick={applyLeases}
              className="bg-cyan-500/[0.1] text-cyan-300 border border-cyan-500/20 px-4 py-2 rounded-lg text-[11px] font-semibold hover:bg-cyan-500/[0.18] transition-all"
            >
              {saved === "leases" ? "✓ Saved" : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-indigo-400 text-[10px]">i</span>
          </div>
          <div>
            <p className="text-[var(--text-secondary)] text-[11px] font-medium leading-relaxed">
              All changes are reflected instantly across the entire dashboard. KPI cards, health indicators, and charts update in real-time when you modify any value here or in the data tables.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
