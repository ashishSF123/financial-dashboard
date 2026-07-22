"use client";

import { useState } from "react";
import type { Currency, FinancialGoal } from "@/lib/finance-types";
import { saveUserProfile } from "@/lib/finance-store";
import { getCurrencySymbol } from "@/lib/format-currency";

interface Props {
  onComplete: () => void;
}

const GOALS: { id: FinancialGoal; label: string; icon: string; description: string }[] = [
  { id: "debt_free", label: "Become Debt-Free", icon: "🎯", description: "Pay off all loans and credit cards" },
  { id: "emergency_fund", label: "Emergency Fund", icon: "🛡️", description: "Save 3-6 months of expenses" },
  { id: "retirement", label: "Retirement Planning", icon: "🏖️", description: "Build long-term retirement corpus" },
  { id: "wealth_building", label: "Build Wealth", icon: "📈", description: "Grow investments and net worth" },
  { id: "home_purchase", label: "Buy a Home", icon: "🏠", description: "Save for a house down payment" },
  { id: "education", label: "Education Fund", icon: "🎓", description: "Save for education expenses" },
];

const CURRENCIES: { id: Currency; label: string; symbol: string }[] = [
  { id: "INR", label: "Indian Rupee", symbol: "₹" },
  { id: "USD", label: "US Dollar", symbol: "$" },
  { id: "EUR", label: "Euro", symbol: "€" },
  { id: "GBP", label: "British Pound", symbol: "£" },
  { id: "JPY", label: "Japanese Yen", symbol: "¥" },
];

export function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [currency, setCurrency] = useState<Currency>("INR");
  const [goals, setGoals] = useState<FinancialGoal[]>([]);

  const toggleGoal = (g: FinancialGoal) => {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const handleComplete = () => {
    saveUserProfile({
      name: name || "User",
      monthlyIncome: parseFloat(income) || 0,
      currency,
      numberFormat: currency === "INR" ? "indian" : "international",
      goals,
      onboardingComplete: true,
    });
    onComplete();
  };

  const symbol = getCurrencySymbol(currency);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center gap-2 ${s <= step ? "text-indigo-400" : "text-[var(--text-muted)]"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s < step ? "bg-indigo-500 border-indigo-500 text-white" :
                s === step ? "border-indigo-400 text-indigo-400" :
                "border-[var(--border-card)] text-[var(--text-muted)]"
              }`}>
                {s < step ? "✓" : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 rounded ${s < step ? "bg-indigo-500" : "bg-[var(--border-card)]"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-8 shadow-xl">
          {/* Step 1: About You */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-heading)]">Welcome to Your Financial Advisor</h2>
                <p className="text-[0.85rem] text-[var(--text-secondary)] mt-2">Let&apos;s personalize your experience in 30 seconds</p>
              </div>

              <div>
                <label className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-2 block">Your Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-2 block">Currency</label>
                <div className="grid grid-cols-5 gap-2">
                  {CURRENCIES.map((c) => (
                    <button key={c.id} onClick={() => setCurrency(c.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        currency === c.id ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" : "border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--border-card)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="text-lg font-bold">{c.symbol}</span>
                      <span className="text-[0.6rem]">{c.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)] mb-2 block">Monthly Income ({symbol})</label>
                <input
                  type="number" value={income} onChange={(e) => setIncome(e.target.value)}
                  placeholder={currency === "INR" ? "e.g. 85000" : "e.g. 5000"}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl px-4 py-3 text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/50 tabular-nums"
                />
                <p className="text-[0.7rem] text-[var(--text-muted)] mt-1.5">Total take-home pay from all sources</p>
              </div>

              <button onClick={() => setStep(2)}
                disabled={!name.trim() || !income}
                className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Financial Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-[var(--text-heading)]">What matters most to you?</h2>
                <p className="text-[0.85rem] text-[var(--text-secondary)] mt-2">Select your top financial goals (pick 1-3)</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      goals.includes(g.id) ? "border-indigo-500/50 bg-indigo-500/[0.06]" : "border-[var(--border-card)] hover:border-[var(--border-card)] hover:bg-[var(--bg-card)]"
                    }`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${goals.includes(g.id) ? "text-indigo-300" : "text-[var(--text-primary)]"}`}>{g.label}</p>
                      <p className="text-[0.72rem] text-[var(--text-muted)]">{g.description}</p>
                    </div>
                    {goals.includes(g.id) && (
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-[var(--border-card)] text-[var(--text-secondary)] font-medium text-sm hover:text-[var(--text-heading)] transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={goals.length === 0}
                  className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <span className="text-3xl">🚀</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-heading)]">You&apos;re all set, {name}!</h2>
                <p className="text-[0.85rem] text-[var(--text-secondary)] mt-2 leading-relaxed">
                  Your personal financial advisor is ready. It will analyze your data and give you personalized, actionable advice every day.
                </p>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4 text-left space-y-3">
                <p className="text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Your Profile</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--text-muted)]">Income:</span>
                    <span className="ml-2 text-[var(--text-heading)] font-semibold">{symbol}{parseFloat(income || "0").toLocaleString()}/mo</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Currency:</span>
                    <span className="ml-2 text-[var(--text-heading)] font-semibold">{currency}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {goals.map((g) => {
                    const goal = GOALS.find((x) => x.id === g);
                    return <span key={g} className="text-[0.7rem] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{goal?.icon} {goal?.label}</span>;
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-[var(--border-card)] text-[var(--text-secondary)] font-medium text-sm hover:text-[var(--text-heading)] transition-colors">Back</button>
                <button onClick={handleComplete}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
                >
                  Launch Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button onClick={handleComplete} className="text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Skip for now — I&apos;ll set up later
          </button>
        </div>
      </div>
    </div>
  );
}
