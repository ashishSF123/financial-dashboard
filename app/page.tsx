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
import { LoansHub } from "@/components/dashboard/loans-hub";
import { InsuranceHub } from "@/components/dashboard/insurance-hub";
import { BudgetTracker } from "@/components/dashboard/budget-tracker";
import { GoalsTracker } from "@/components/dashboard/goals-tracker";
import { CommandBar } from "@/components/dashboard/command-bar";
import { InsightsFeed } from "@/components/dashboard/insights-feed";
import { DailyExpenseTracker } from "@/components/dashboard/daily-expense-tracker";
import { InvestmentPortfolio } from "@/components/dashboard/investment-portfolio";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { Sidebar } from "@/components/dashboard/sidebar";
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

  return (
    <div className="min-h-screen bg-[#0a0b10] text-slate-200 flex">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onNavigate={setActiveTab} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Command Bar (Cmd+K) */}
        <CommandBar
          data={data}
          metrics={{ grandDebt: m.grandDebt, totalAssets: m.totalAssets, netWorth: m.netWorth, monthlySurplus: m.monthlySurplus, monthlyCredit: m.monthlyCredit, monthlyOutflows: m.monthlyOutflows, totalGoldDebt: m.totalGoldDebt, totalHouseLoan: m.totalHouseLoan, totalBorrowed: m.totalBorrowed, totalLended: m.totalLended }}
          onNavigate={setActiveTab}
        />

        {/* Top Bar */}
        <header className="sticky top-0 z-[50] border-b border-white/[0.04] backdrop-blur-xl bg-[#0a0b10]/90">
          <div className="px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MonthSelector
                months={snapshots.map((s) => ({ month: s.month, label: s.label, isCurrent: s.isCurrent }))}
                selectedMonth={selectedMonth}
                onSelect={setSelectedMonth}
              />
              {isCurrentMonth && (
                <div className="flex items-center gap-1.5 text-[0.65rem] text-slate-500 bg-white/[0.03] border border-white/[0.04] rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live</span>
                </div>
              )}
              {!isCurrentMonth && (
                <div className="flex items-center gap-1.5 text-[0.65rem] text-amber-400/70 bg-amber-500/[0.04] border border-amber-500/10 rounded-full px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Historical</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveStatus !== "idle" && (
                <div className={`flex items-center gap-1.5 text-[0.65rem] px-2.5 py-1 rounded-full transition-opacity duration-300 ${
                  saveStatus === "saving" ? "text-blue-400 bg-blue-500/10 border border-blue-500/15" :
                  saveStatus === "saved" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15" :
                  "text-rose-400 bg-rose-500/10 border border-rose-500/15"
                }`}>
                  {saveStatus === "saving" && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                  {saveStatus === "saved" && <span>Done</span>}
                  {saveStatus === "error" && <span>Failed</span>}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-[1200px] animate-in fade-in duration-200">
        {activeTab === "overview" && (
          <div className="space-y-8">

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

        {activeTab === "loans" && (
          <LoansHub data={data} onUpdate={updateData} />
        )}

        {activeTab === "insurance" && (
          <InsuranceHub />
        )}



        {activeTab === "budget" && (
          <div className="space-y-8">
            <BudgetTracker data={data} />
            <div className="flex items-center gap-4">
              <h2 className="text-white text-base font-semibold">Monthly Expense Allocation</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
            </div>
            <BudgetAlerts selectedMonth={selectedMonth} onNavigate={setActiveTab} />
            <div className="flex items-center gap-4">
              <h2 className="text-white text-base font-semibold">Recurring Expenses</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
            </div>
            <EditableTable
              title="Fixed Monthly Outflows"
              description="Recurring commitments that affect your monthly surplus calculation."
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
          </div>
        )}

        {activeTab === "calendar" && (
          <PaymentCalendar data={data} selectedMonth={selectedMonth} />
        )}

        {activeTab === "goals" && (
          <GoalsTracker data={data} monthlySurplus={monthlySurplus} />
        )}



        {activeTab === "debt-plan" && (
          <DebtPlanner data={data} />
        )}

        {activeTab === "trends" && (
          <TrendsPanel snapshots={snapshots} />
        )}

        {activeTab === "daily-expenses" && (
          <DailyExpenseTracker selectedMonth={selectedMonth} onNavigate={setActiveTab} />
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
        <footer className="mt-12 pt-5 border-t border-white/[0.04] text-center">
          <p className="text-[0.65rem] text-slate-600">
            Personal Finance Dashboard
          </p>
        </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
