"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DebtChart } from "@/components/dashboard/debt-chart";
import { EditableTable } from "@/components/dashboard/editable-table";
import { FinancialHealth } from "@/components/dashboard/financial-health";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { GoldDistributionChart } from "@/components/dashboard/gold-distribution-chart";
import { ExpenseBreakdownChart } from "@/components/dashboard/expense-breakdown-chart";
import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { TrendsPanel } from "@/components/dashboard/trends-panel";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { PaymentCalendar } from "@/components/dashboard/payment-calendar";
import { DebtPlanner } from "@/components/dashboard/debt-planner";
import { SettlementTracker } from "@/components/dashboard/settlement-tracker";
import { BudgetTracker } from "@/components/dashboard/budget-tracker";
import { GoalsTracker } from "@/components/dashboard/goals-tracker";
import { CommandBar } from "@/components/dashboard/command-bar";
import { InsightsFeed } from "@/components/dashboard/insights-feed";
import { DailyExpenseTracker } from "@/components/dashboard/daily-expense-tracker";
import { InvestmentPortfolio } from "@/components/dashboard/investment-portfolio";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import type { FinancialData } from "@/lib/parse-excel";

interface MonthlySnapshot {
  month: string;
  label: string;
  data: FinancialData;
  isCurrent: boolean;
}

export default function DashboardPage() {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-07");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d: MonthlySnapshot[]) => {
        setSnapshots(d);
        if (d.length > 0) setSelectedMonth(d[0].month);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentSnapshot = useMemo(() => snapshots.find((s) => s.month === selectedMonth), [snapshots, selectedMonth]);
  const previousSnapshot = useMemo(() => {
    const idx = snapshots.findIndex((s) => s.month === selectedMonth);
    return idx >= 0 && idx < snapshots.length - 1 ? snapshots[idx + 1] : null;
  }, [snapshots, selectedMonth]);

  const data = currentSnapshot?.data || null;

  const saveToDb = useCallback((snapshot: MonthlySnapshot) => {
    setSaveStatus("saving");
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fetch("/api/data/save", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    })
      .then((r) => {
        if (r.ok) {
          setSaveStatus("saved");
          fadeTimer.current = setTimeout(() => setSaveStatus("idle"), 2500);
        } else {
          setSaveStatus("error");
        }
      })
      .catch(() => setSaveStatus("error"));
  }, []);

  const updateData = useCallback((updater: (prev: FinancialData) => FinancialData) => {
    setSnapshots((prev) => {
      const updated = prev.map((s) =>
        s.month === selectedMonth ? { ...s, data: updater(s.data) } : s
      );
      // Debounced save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const target = updated.find((s) => s.month === selectedMonth);
      if (target) {
        saveTimer.current = setTimeout(() => saveToDb(target), 800);
      }
      return updated;
    });
  }, [selectedMonth, saveToDb]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading financial data...</p>
          <p className="text-slate-600 text-xs mt-1">Parsing Excel workbook</p>
        </div>
      </div>
    );
  }

  if (!data || snapshots.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center">
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-rose-400 text-xl">!</span>
          </div>
          <p className="text-rose-300 font-medium">Failed to load financial data</p>
          <p className="text-slate-500 text-sm mt-2">Ensure Self_finance_data.xlsx exists in the workspace directory.</p>
        </div>
      </div>
    );
  }

  // Previous month data for comparison
  const prevData = previousSnapshot?.data || null;

  // Calculate derived metrics
  // Calculate metrics for current month
  const calcMetrics = (d: FinancialData) => {
    const totalGoldDebt = d.goldLoans.reduce((s, g) => s + g.principalAmount, 0);
    const totalHouseLoan = d.houseLoans.reduce((s, h) => s + h.loanAmount, 0);
    const totalBorrowed = d.borrowed.reduce((s, b) => s + b.amount, 0);
    const totalLended = d.lended.reduce((s, l) => s + l.amount, 0);
    const totalLease = d.leases.reduce((s, l) => s + l.amount, 0);
    const grandDebt = totalGoldDebt + totalHouseLoan + totalBorrowed + totalLease;
    const monthlyGoldInterest = d.goldLoans.reduce((s, g) => s + g.monthlyInterest, 0);
    const monthlyHouseEmi = d.houseLoans.reduce((s, h) => s + h.emiAmount, 0);
    const monthlyBorrowedInterest = d.borrowed.reduce((s, b) => s + b.monthlyInterest, 0);
    const monthlyLendedInterest = d.lended.reduce((s, l) => s + l.monthlyInterest, 0);
    const monthlyExpenses = d.expenses.reduce((s, e) => s + e.amount, 0);
    const totalGoldWeight = d.goldLoans.reduce((s, g) => s + g.goldWeight, 0);
    const goldMarketValue = totalGoldWeight * d.goldRate22ct;
    const totalAssets = d.assets.reduce((s, a) => s + a.amount, 0) + 8000000;
    const netWorth = totalAssets - grandDebt;
    const monthlyCredit = d.monthlyCredit;
    const monthlyOutflows = monthlyHouseEmi + monthlyGoldInterest + monthlyBorrowedInterest + monthlyExpenses;
    const monthlySurplus = monthlyCredit - monthlyOutflows;
    return { totalGoldDebt, totalHouseLoan, totalBorrowed, totalLended, totalLease, grandDebt, monthlyGoldInterest, monthlyHouseEmi, monthlyBorrowedInterest, monthlyLendedInterest, monthlyExpenses, totalGoldWeight, goldMarketValue, totalAssets, netWorth, monthlyCredit, monthlyOutflows, monthlySurplus };
  };

  const m = calcMetrics(data);
  const pm = prevData ? calcMetrics(prevData) : null;

  const { totalGoldDebt, totalHouseLoan, totalBorrowed, totalLended, totalLease, grandDebt, monthlyGoldInterest, monthlyHouseEmi, monthlyBorrowedInterest, monthlyLendedInterest, monthlyExpenses, goldMarketValue, totalAssets, netWorth, monthlyCredit, monthlySurplus } = m;
  const isCurrentMonth = currentSnapshot?.isCurrent || false;

  const tabs = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "daily-expenses", label: "Daily Expenses", icon: "💸" },
    { id: "portfolio", label: "Portfolio & Assets", icon: "💼" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "budget", label: "Budget", icon: "📊" },
    { id: "goals", label: "Goals", icon: "🎯" },
    { id: "gold-loans", label: "Gold Loans", icon: "◆" },
    { id: "house-loans", label: "House Loans", icon: "⌂" },
    { id: "settlements", label: "Settlements", icon: "🤝" },
    { id: "expenses", label: "Recurring", icon: "◎" },

    { id: "debt-plan", label: "Debt Plan", icon: "🏆" },
    { id: "trends", label: "Trends", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200">
      {/* Command Bar (Cmd+K) */}
      <CommandBar
        data={data}
        metrics={{ grandDebt: m.grandDebt, totalAssets: m.totalAssets, netWorth: m.netWorth, monthlySurplus: m.monthlySurplus, monthlyCredit: m.monthlyCredit, monthlyOutflows: m.monthlyOutflows, totalGoldDebt: m.totalGoldDebt, totalHouseLoan: m.totalHouseLoan, totalBorrowed: m.totalBorrowed, totalLended: m.totalLended }}
        onNavigate={setActiveTab}
      />

      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-500/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-[50] border-b border-white/[0.04] backdrop-blur-xl bg-[#0a0b10]/80">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img src="/profile.jpg" alt="Ashish" className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30" />
            <div>
              <h1 className="text-[1.05rem] font-semibold text-white tracking-[-0.02em]">Ashish Financial Dashboard</h1>
              <p className="text-[0.68rem] text-slate-500 font-medium tracking-wide mt-0.5">Personal Finance Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector
              months={snapshots.map((s) => ({ month: s.month, label: s.label, isCurrent: s.isCurrent }))}
              selectedMonth={selectedMonth}
              onSelect={setSelectedMonth}
            />
            {isCurrentMonth && (
              <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Editable</span>
              </div>
            )}
            {!isCurrentMonth && (
              <div className="hidden md:flex items-center gap-2 text-[10px] text-amber-400/70 bg-amber-500/[0.05] border border-amber-500/15 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Historical View</span>
              </div>
            )}
            {saveStatus !== "idle" && (
              <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full transition-opacity duration-300 ${
                saveStatus === "saving" ? "text-blue-400 bg-blue-500/10 border border-blue-500/20" :
                saveStatus === "saved" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" :
                "text-rose-400 bg-rose-500/10 border border-rose-500/20"
              }`}>
                {saveStatus === "saving" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                {saveStatus === "saved" && <span>✓</span>}
                {saveStatus === "error" && <span>!</span>}
                <span>{saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save failed"}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-[30] border-b border-white/[0.04] backdrop-blur-lg bg-[#0a0b10]/60">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="flex gap-0.5 overflow-x-auto py-2.5 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-4 py-2 text-[0.75rem] font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white/[0.06] text-white border border-white/[0.08] shadow-sm"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                }`}
              >
                <span className={`text-[0.7rem] transition-colors ${activeTab === tab.id ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"}`}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 px-6 md:px-10 py-8 max-w-[1440px] mx-auto">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Motivational banner */}
            <div className="text-center py-2">
              <p className="text-[10px] font-bold uppercase tracking-[6px] bg-gradient-to-r from-rose-400 via-amber-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                Imagine · Believe · Achieve
              </p>
            </div>

            <FinancialHealth
              grandDebt={grandDebt}
              totalAssets={totalAssets}
              netWorth={netWorth}
              monthlySurplus={monthlySurplus}
              monthlyCredit={monthlyCredit}
            />

            <KpiCards
              grandDebt={grandDebt}
              totalGoldDebt={totalGoldDebt}
              totalHouseLoan={totalHouseLoan}
              totalBorrowed={totalBorrowed}
              totalLended={totalLended}
              totalLease={totalLease}
              monthlyGoldInterest={monthlyGoldInterest}
              monthlyHouseEmi={monthlyHouseEmi}
              monthlyBorrowedInterest={monthlyBorrowedInterest}
              monthlyLendedInterest={monthlyLendedInterest}
              monthlyExpenses={monthlyExpenses}
              monthlyCredit={monthlyCredit}
              netWorth={netWorth}
              goldMarketValue={goldMarketValue}
              monthlySurplus={monthlySurplus}
              prevMetrics={pm}
            />

            {/* Section separator */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex gap-1.5">
                <span className="w-1 h-1 rounded-full bg-indigo-500/40" />
                <span className="w-1 h-1 rounded-full bg-indigo-500/60" />
                <span className="w-1 h-1 rounded-full bg-indigo-500/40" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>

            {/* Charts section header */}
            <div className="flex items-center gap-4">
              <h2 className="text-white text-base font-semibold">Financial Analysis</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DebtChart
                goldDebt={totalGoldDebt}
                houseLoan={totalHouseLoan}
                borrowed={totalBorrowed}
                lease={totalLease}
              />
              <CashFlowChart
                credit={monthlyCredit}
                houseEmi={monthlyHouseEmi}
                goldInterest={monthlyGoldInterest}
                borrowedInterest={monthlyBorrowedInterest}
                expenses={monthlyExpenses}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoldDistributionChart goldLoans={data.goldLoans} />
              <ExpenseBreakdownChart expenses={data.expenses} />
            </div>

            {/* Smart Insights */}
            <InsightsFeed
              data={data}
              metrics={{ grandDebt: m.grandDebt, totalAssets: m.totalAssets, netWorth: m.netWorth, monthlySurplus: m.monthlySurplus, monthlyCredit: m.monthlyCredit, totalGoldDebt: m.totalGoldDebt, totalHouseLoan: m.totalHouseLoan, totalBorrowed: m.totalBorrowed, monthlyGoldInterest: m.monthlyGoldInterest, monthlyHouseEmi: m.monthlyHouseEmi, monthlyBorrowedInterest: m.monthlyBorrowedInterest }}
              prevMetrics={pm ? { grandDebt: pm.grandDebt, netWorth: pm.netWorth, monthlySurplus: pm.monthlySurplus } : null}
            />
          </div>
        )}

        {activeTab === "gold-loans" && (
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
            onUpdate={(updated) => updateData((d) => ({ ...d, goldLoans: updated as FinancialData["goldLoans"] }))}
            recalculate={(row) => {
              const r = row as FinancialData["goldLoans"][0];
              return { ...r, monthlyInterest: r.principalAmount * r.roiPct / 12 / 100 };
            }}
          />
        )}

        {activeTab === "house-loans" && (
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
            onUpdate={(updated) => updateData((d) => ({ ...d, houseLoans: updated as FinancialData["houseLoans"] }))}
          />
        )}



        {activeTab === "expenses" && (
          <EditableTable
            title="Monthly Expenses"
            description="Edit or add recurring monthly expenses. Changes reflect immediately in the surplus calculation."
            accent="purple"
            columns={[
              { key: "name", label: "Expense Name", type: "text" },
              { key: "type", label: "Category", type: "text" },
              { key: "provider", label: "Provider", type: "text" },
              { key: "amount", label: "Amount (₹)", type: "currency" },
            ]}
            rows={data.expenses}
            onUpdate={(updated) => updateData((d) => ({ ...d, expenses: updated as FinancialData["expenses"] }))}
          />
        )}



        {activeTab === "calendar" && (
          <PaymentCalendar data={data} selectedMonth={selectedMonth} />
        )}

        {activeTab === "budget" && (
          <div className="space-y-8">
            <BudgetTracker data={data} />
            <div className="flex items-center gap-4">
              <h2 className="text-white text-base font-semibold">Daily Expense Budgets</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
            </div>
            <BudgetAlerts selectedMonth={selectedMonth} />
          </div>
        )}

        {activeTab === "goals" && (
          <GoalsTracker data={data} monthlySurplus={monthlySurplus} />
        )}

        {activeTab === "settlements" && (
          <SettlementTracker data={data} />
        )}

        {activeTab === "debt-plan" && (
          <DebtPlanner data={data} />
        )}

        {activeTab === "trends" && (
          <TrendsPanel snapshots={snapshots} />
        )}

        {activeTab === "daily-expenses" && (
          <DailyExpenseTracker selectedMonth={selectedMonth} />
        )}

        {activeTab === "portfolio" && (
          <InvestmentPortfolio data={data} onUpdate={updateData} />
        )}

        {activeTab === "settings" && (
          <SettingsPanel
            monthlyCredit={data.monthlyCredit}
            goldRate={data.goldRate22ct}
            leases={data.leases}
            onUpdateCredit={(v) => updateData((d) => ({ ...d, monthlyCredit: v }))}
            onUpdateGoldRate={(v) => updateData((d) => ({ ...d, goldRate22ct: v }))}
            onUpdateLeases={(v) => updateData((d) => ({ ...d, leases: v }))}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-[11px] text-slate-600">
            Ashish Financial Dashboard — Built with <span className="text-indigo-400/60">Next.js</span> on Snowflake App Runtime
          </p>
        </footer>
      </main>
    </div>
  );
}
