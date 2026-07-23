"use client";

import { useState, useEffect } from "react";
import { formatINR } from "@/lib/format-currency";
import { getUserProfile, saveUserProfile } from "@/lib/finance-store";
import type { Currency, FinancialGoal, UserProfile } from "@/lib/finance-types";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileMobile, setProfileMobile] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [profileOccupation, setProfileOccupation] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileNetWorthTarget, setProfileNetWorthTarget] = useState("");
  const [profileIncome, setProfileIncome] = useState("");
  const [profileCurrency, setProfileCurrency] = useState<Currency>("INR");
  const [profileGoals, setProfileGoals] = useState<FinancialGoal[]>([]);

  useEffect(() => {
    const p = getUserProfile();
    if (p) {
      setProfile(p);
      setProfileName(p.name);
      setProfileEmail(p.email || "");
      setProfileMobile(p.mobile || "");
      setProfileDob(p.dateOfBirth || "");
      setProfileOccupation(p.occupation || "");
      setProfileImage(p.profileImage || "");
      setProfileNetWorthTarget(String(p.netWorthTarget || ""));
      setProfileIncome(String(p.monthlyIncome));
      setProfileCurrency(p.currency);
      setProfileGoals(p.goals);
    }
  }, []);

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
      {/* Personal Profile Card */}
      <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-emerald-500/[0.01] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-card-hover)] border-2 border-[var(--border-card)] flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl text-[var(--text-muted)]">{profileName ? profileName[0].toUpperCase() : "U"}</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <span className="text-white text-[10px] font-medium">Change</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 500000) { alert("Please use an image under 500KB"); return; }
                  const reader = new FileReader();
                  reader.onload = () => setProfileImage(reader.result as string);
                  reader.readAsDataURL(file);
                }} />
              </label>
            </div>
            <div>
              <h2 className="text-[var(--text-heading)] text-lg font-semibold tracking-tight">{profileName || "Your Profile"}</h2>
              <p className="text-[var(--text-muted)] text-[11px] mt-0.5">Update your personal details and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Full Name</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Email</label>
              <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Mobile Number</label>
              <input type="tel" value={profileMobile} onChange={(e) => setProfileMobile(e.target.value)} placeholder="+91 98765 43210"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Date of Birth</label>
              <div className="flex gap-2">
                <select value={profileDob.split("-")[2] || ""} onChange={(e) => { const parts = profileDob.split("-"); setProfileDob(`${parts[0] || "1990"}-${parts[1] || "01"}-${e.target.value.padStart(2, "0")}`); }}
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-2 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/40 transition-all appearance-none">
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}
                </select>
                <select value={profileDob.split("-")[1] || ""} onChange={(e) => { const parts = profileDob.split("-"); setProfileDob(`${parts[0] || "1990"}-${e.target.value}-${parts[2] || "01"}`); }}
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-2 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/40 transition-all appearance-none">
                  <option value="">Month</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
                </select>
                <select value={profileDob.split("-")[0] || ""} onChange={(e) => { const parts = profileDob.split("-"); setProfileDob(`${e.target.value}-${parts[1] || "01"}-${parts[2] || "01"}`); }}
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-2 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-indigo-500/40 transition-all appearance-none">
                  <option value="">Year</option>
                  {Array.from({ length: 80 }, (_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={String(y)}>{y}</option>; })}
                </select>
              </div>
              {profileDob && <p className="text-[var(--text-muted)] text-[9px] mt-1.5">Age: {Math.floor((Date.now() - new Date(profileDob).getTime()) / 31557600000)} years</p>}
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Occupation</label>
              <input type="text" value={profileOccupation} onChange={(e) => setProfileOccupation(e.target.value)} placeholder="e.g. Software Engineer"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Net Worth Goal</label>
              <input type="number" value={profileNetWorthTarget} onChange={(e) => setProfileNetWorthTarget(e.target.value)} placeholder="e.g. 10000000"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-500/40 transition-all tabular-nums" />
              <p className="text-[var(--text-muted)] text-[9px] mt-1.5">Your target net worth to achieve</p>
            </div>
          </div>

          <button onClick={() => {
            const updated = saveUserProfile({
              name: profileName,
              monthlyIncome: parseFloat(profileIncome) || 0,
              currency: profileCurrency,
              goals: profileGoals,
              email: profileEmail,
              mobile: profileMobile,
              dateOfBirth: profileDob,
              occupation: profileOccupation,
              profileImage: profileImage,
              netWorthTarget: parseFloat(profileNetWorthTarget) || undefined,
              onboardingComplete: true,
            });
            setProfile(updated);
            showSaved("personal");
          }} className="bg-indigo-500/[0.1] text-indigo-300 border border-indigo-500/20 px-5 py-2.5 rounded-lg text-[11px] font-semibold hover:bg-indigo-500/[0.18] transition-all">
            {saved === "personal" ? "✓ Profile Saved" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-[var(--text-heading)] text-lg font-semibold tracking-tight">Global Settings</h2>
        <p className="text-[var(--text-muted)] text-[11px] mt-0.5 font-medium">
          Update these values to instantly recalculate all dashboard metrics.
        </p>
      </div>

      {/* Main Settings */}
      <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
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

      {/* My Profile */}
      <div className="relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[var(--text-heading)] text-[0.88rem] font-semibold tracking-[-0.01em]">My Profile</h3>
              <p className="text-[var(--text-muted)] text-[10px] mt-0.5">Update your income to change advisor tier and recommendations</p>
            </div>
            {profile && (
              <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                profile.incomeTier === "high" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                profile.incomeTier === "mid" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {profile.incomeTier} tier
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Name</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-emerald-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Monthly Income</label>
              <input type="number" value={profileIncome} onChange={(e) => setProfileIncome(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-emerald-500/40 transition-all tabular-nums" />
              <p className="text-[var(--text-muted)] text-[9px] mt-1.5">
                {parseFloat(profileIncome) >= 500000 ? "High tier: tax optimization & diversification" :
                 parseFloat(profileIncome) >= 50000 ? "Mid tier: debt reduction & SIP focus" :
                 "Low tier: expense control & basic savings"}
              </p>
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Currency</label>
              <select value={profileCurrency} onChange={(e) => setProfileCurrency(e.target.value as Currency)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-card)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-emerald-500/40 transition-all appearance-none">
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="JPY">¥ JPY (Japanese Yen)</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-[1px] block mb-2">Financial Goals</label>
            <div className="flex flex-wrap gap-2">
              {(["debt_free", "emergency_fund", "retirement", "wealth_building", "home_purchase", "education"] as FinancialGoal[]).map((g) => {
                const labels: Record<string, string> = { debt_free: "🎯 Debt-Free", emergency_fund: "🛡️ Emergency Fund", retirement: "🏖️ Retirement", wealth_building: "📈 Wealth", home_purchase: "🏠 Home", education: "🎓 Education" };
                const isSelected = profileGoals.includes(g);
                return (
                  <button key={g} onClick={() => setProfileGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                    className={`px-3 py-1.5 rounded-lg text-[0.72rem] font-medium border transition-all ${
                      isSelected ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" : "text-[var(--text-muted)] border-[var(--border-card)] hover:text-[var(--text-secondary)]"
                    }`}>
                    {labels[g]}
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => {
            const updated = saveUserProfile({ name: profileName, monthlyIncome: parseFloat(profileIncome) || 0, currency: profileCurrency, goals: profileGoals, onboardingComplete: true });
            setProfile(updated);
            showSaved("profile");
          }} className="bg-emerald-500/[0.1] text-emerald-300 border border-emerald-500/20 px-5 py-2 rounded-lg text-[11px] font-semibold hover:bg-emerald-500/[0.18] transition-all">
            {saved === "profile" ? "✓ Profile Saved" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
