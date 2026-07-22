"use client";
import { formatINR } from "@/lib/format-currency";

import { useState, useEffect, useCallback } from "react";
import { SUBSCRIPTION_CATEGORIES } from "@/lib/finance-types";
import type { Subscription } from "@/lib/finance-types";
import { getSubscriptions, addSubscription, deleteSubscription, updateSubscription } from "@/lib/finance-store";


function daysSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

const CAT_ICONS: Record<string, string> = {
  streaming: "🎬", music: "🎵", fitness: "🏋️", cloud: "☁️",
  news: "📰", productivity: "⚡", gaming: "🎮", other: "📱",
};

export function SubscriptionManager() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formFreq, setFormFreq] = useState<Subscription["frequency"]>("monthly");
  const [formCategory, setFormCategory] = useState<Subscription["category"]>("streaming");

  const refresh = useCallback(() => { setSubs(getSubscriptions()); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = () => {
    if (!formName || !formAmount) return;
    addSubscription({ name: formName, provider: formProvider, amount: parseFloat(formAmount) || 0, frequency: formFreq, category: formCategory, isActive: true });
    setFormName(""); setFormProvider(""); setFormAmount(""); setShowForm(false);
    refresh();
  };

  const activeSubs = subs.filter((s) => s.isActive);
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + (s.frequency === "monthly" ? s.amount : s.frequency === "quarterly" ? s.amount / 3 : s.amount / 12), 0);
  const annualTotal = monthlyTotal * 12;
  const unusedSubs = activeSubs.filter((s) => { const d = daysSince(s.lastUsedDate); return d !== null && d > 30; });
  const potentialSavings = unusedSubs.reduce((sum, s) => sum + (s.frequency === "monthly" ? s.amount : s.frequency === "quarterly" ? s.amount / 3 : s.amount / 12), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">Subscriptions</h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">Track recurring payments and find hidden money leaks</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[0.75rem] font-medium hover:bg-violet-500/30 transition-colors">
          <span className="text-sm">+</span> Add Subscription
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Monthly Cost</p>
          <p className="text-[1.05rem] font-bold text-violet-400 tracking-tight mt-0.5">{formatINR(monthlyTotal)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Annual Burn</p>
          <p className="text-[1.05rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{formatINR(annualTotal)}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Active</p>
          <p className="text-[1.05rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{activeSubs.length}</p>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-rose-500/80">Potential Savings</p>
          <p className={`text-[1.05rem] font-bold tracking-tight mt-0.5 ${potentialSavings > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {potentialSavings > 0 ? formatINR(potentialSavings) + "/mo" : "None"}
          </p>
        </div>
      </div>

      {/* Unused alert */}
      {unusedSubs.length > 0 && (
        <div className="bg-rose-500/[0.04] border border-rose-500/15 rounded-xl p-4">
          <p className="text-[0.75rem] text-rose-300 font-medium">Unused Subscriptions Detected</p>
          <p className="text-[0.68rem] text-[var(--text-secondary)] mt-1">
            {unusedSubs.length} subscription{unusedSubs.length > 1 ? "s" : ""} not used in 30+ days: {unusedSubs.map((s) => s.name).join(", ")}. Canceling saves {formatINR(potentialSavings * 12)}/year.
          </p>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Netflix" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Provider</label>
              <input type="text" value={formProvider} onChange={(e) => setFormProvider(e.target.value)} placeholder="Company" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Amount (Rs)</label>
              <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="649" className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500/50 tabular-nums" />
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Billing</label>
              <select value={formFreq} onChange={(e) => setFormFreq(e.target.value as Subscription["frequency"])} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-violet-500/50 appearance-none">
                <option value="monthly" className="bg-[var(--bg-secondary)]">Monthly</option>
                <option value="quarterly" className="bg-[var(--bg-secondary)]">Quarterly</option>
                <option value="yearly" className="bg-[var(--bg-secondary)]">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-1.5 block">Category</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as Subscription["category"])} className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded-lg px-3 py-2 text-[0.85rem] text-[var(--text-heading)] focus:outline-none focus:border-violet-500/50 appearance-none">
                {Object.entries(SUBSCRIPTION_CATEGORIES).map(([v, l]) => (<option key={v} value={v} className="bg-[var(--bg-secondary)]">{l}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-[var(--text-secondary)] text-[0.78rem] hover:text-[var(--text-heading)] transition-colors">Cancel</button>
            <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-violet-500 text-[var(--text-heading)] text-[0.78rem] font-semibold hover:bg-violet-600 transition-colors">Save</button>
          </div>
        </div>
      )}

      {/* Subscription List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)]">Active Subscriptions</h3>
        </div>
        {activeSubs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">📱</div>
            <p className="text-[0.85rem] text-[var(--text-secondary)]">No subscriptions tracked</p>
            <p className="text-[0.72rem] text-[var(--text-muted)] mt-1">Add Netflix, Spotify, Gym, Cloud storage, etc.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {activeSubs.map((s) => {
              const days = daysSince(s.lastUsedDate);
              const isUnused = days !== null && days > 30;
              return (
                <div key={s.id} className={`flex items-center justify-between px-5 py-3.5 hover:bg-[var(--bg-card)] transition-colors group ${isUnused ? "bg-rose-500/[0.02]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${isUnused ? "bg-rose-500/10" : "bg-violet-500/10"} flex items-center justify-center shrink-0`}>
                      <span className="text-[0.8rem]">{CAT_ICONS[s.category] || "📱"}</span>
                    </div>
                    <div>
                      <p className="text-[0.82rem] text-[var(--text-primary)] font-medium">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.65rem] text-violet-400 font-medium">{SUBSCRIPTION_CATEGORIES[s.category]}</span>
                        {s.provider && (<><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className="text-[0.65rem] text-[var(--text-muted)]">{s.provider}</span></>)}
                        {days !== null && (
                          <><span className="text-[0.5rem] text-[var(--text-muted)]">-</span><span className={`text-[0.65rem] ${isUnused ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"}`}>Used {days}d ago{isUnused ? " (unused)" : ""}</span></>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(s.amount)}</p>
                      <p className="text-[0.6rem] text-[var(--text-muted)] capitalize">{s.frequency}</p>
                    </div>
                    {isUnused && <span className="text-[0.55rem] font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">CANCEL?</span>}
                    <button onClick={() => { deleteSubscription(s.id); refresh(); }} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-400 text-[0.75rem] transition-all p-1">x</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeSubs.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
            <span className="text-[0.68rem] text-[var(--text-muted)]">{activeSubs.length} active</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(monthlyTotal)}/month</span>
          </div>
        )}
      </div>
    </div>
  );
}
