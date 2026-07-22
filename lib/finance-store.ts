// Client-side data store using localStorage
// This provides immediate functionality while Snowflake tables are provisioned

import type { DailyExpense, InvestmentHolding, InvestmentTransaction, BudgetLimit } from "./finance-types";

const KEYS = {
  expenses: "pf_daily_expenses",
  holdings: "pf_investment_holdings",
  transactions: "pf_investment_transactions",
  budgets: "pf_budget_limits",
};

function generateId(): string {
  return crypto.randomUUID();
}

function getStore<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// --- Expenses ---

export function getExpenses(filters?: { month?: string; category?: string }): DailyExpense[] {
  let expenses = getStore<DailyExpense>(KEYS.expenses);
  if (filters?.month) {
    expenses = expenses.filter((e) => e.date.startsWith(filters.month!));
  }
  if (filters?.category) {
    expenses = expenses.filter((e) => e.category === filters.category);
  }
  return expenses.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt!.localeCompare(a.createdAt!));
}

export function addExpense(expense: Omit<DailyExpense, "id" | "createdAt">): DailyExpense {
  const newExpense: DailyExpense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const expenses = getStore<DailyExpense>(KEYS.expenses);
  expenses.push(newExpense);
  setStore(KEYS.expenses, expenses);
  return newExpense;
}

export function updateExpense(id: string, updates: Partial<DailyExpense>): DailyExpense | null {
  const expenses = getStore<DailyExpense>(KEYS.expenses);
  const idx = expenses.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  expenses[idx] = { ...expenses[idx], ...updates };
  setStore(KEYS.expenses, expenses);
  return expenses[idx];
}

export function deleteExpense(id: string): boolean {
  const expenses = getStore<DailyExpense>(KEYS.expenses);
  const filtered = expenses.filter((e) => e.id !== id);
  if (filtered.length === expenses.length) return false;
  setStore(KEYS.expenses, filtered);
  return true;
}

// --- Investment Holdings ---

export function getHoldings(filters?: { type?: string; status?: string }): InvestmentHolding[] {
  let holdings = getStore<InvestmentHolding>(KEYS.holdings);
  if (filters?.type) {
    holdings = holdings.filter((h) => h.type === filters.type);
  }
  if (filters?.status) {
    holdings = holdings.filter((h) => h.status === filters.status);
  }
  return holdings.sort((a, b) => b.currentValue - a.currentValue);
}

export function addHolding(holding: Omit<InvestmentHolding, "id" | "createdAt" | "updatedAt">): InvestmentHolding {
  const now = new Date().toISOString();
  const newHolding: InvestmentHolding = {
    ...holding,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const holdings = getStore<InvestmentHolding>(KEYS.holdings);
  holdings.push(newHolding);
  setStore(KEYS.holdings, holdings);
  return newHolding;
}

export function updateHolding(id: string, updates: Partial<InvestmentHolding>): InvestmentHolding | null {
  const holdings = getStore<InvestmentHolding>(KEYS.holdings);
  const idx = holdings.findIndex((h) => h.id === id);
  if (idx === -1) return null;
  holdings[idx] = { ...holdings[idx], ...updates, updatedAt: new Date().toISOString() };
  setStore(KEYS.holdings, holdings);
  return holdings[idx];
}

export function deleteHolding(id: string): boolean {
  const holdings = getStore<InvestmentHolding>(KEYS.holdings);
  const filtered = holdings.filter((h) => h.id !== id);
  if (filtered.length === holdings.length) return false;
  setStore(KEYS.holdings, filtered);
  // Also delete related transactions
  const txns = getStore<InvestmentTransaction>(KEYS.transactions);
  setStore(KEYS.transactions, txns.filter((t) => t.holdingId !== id));
  return true;
}

// --- Investment Transactions ---

export function getTransactions(holdingId?: string): InvestmentTransaction[] {
  let txns = getStore<InvestmentTransaction>(KEYS.transactions);
  if (holdingId) {
    txns = txns.filter((t) => t.holdingId === holdingId);
  }
  return txns.sort((a, b) => b.date.localeCompare(a.date));
}

export function addTransaction(txn: Omit<InvestmentTransaction, "id" | "createdAt">): InvestmentTransaction {
  const newTxn: InvestmentTransaction = {
    ...txn,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const txns = getStore<InvestmentTransaction>(KEYS.transactions);
  txns.push(newTxn);
  setStore(KEYS.transactions, txns);
  return newTxn;
}

// --- Budget Limits ---

export function getBudgetLimits(): BudgetLimit[] {
  return getStore<BudgetLimit>(KEYS.budgets);
}

export function setBudgetLimit(category: string, monthlyLimit: number, alertThreshold = 0.8): BudgetLimit {
  const budgets = getStore<BudgetLimit>(KEYS.budgets);
  const existing = budgets.findIndex((b) => b.category === category);
  const budget: BudgetLimit = {
    id: existing >= 0 ? budgets[existing].id : generateId(),
    category,
    monthlyLimit,
    alertThreshold,
  };
  if (existing >= 0) {
    budgets[existing] = budget;
  } else {
    budgets.push(budget);
  }
  setStore(KEYS.budgets, budgets);
  return budget;
}

// --- Seed Data ---

const SEED_HOLDINGS: Omit<InvestmentHolding, "id" | "createdAt" | "updatedAt">[] = [
  {
    type: "mutual_fund",
    name: "Axis Bluechip Fund",
    provider: "Axis AMC",
    investedAmount: 1000,
    currentValue: 1000,
    units: 25.64,
    rateOrNav: 39.0,
    startDate: "2024-01-15",
    frequency: "Monthly",
    status: "active",
  },
  {
    type: "ppf",
    name: "Post Office PPF",
    provider: "India Post",
    investedAmount: 0,
    currentValue: 0,
    startDate: "2024-06-01",
    frequency: "Yearly",
    status: "active",
  },
  {
    type: "gold_sgb",
    name: "RBI SGB 2024",
    provider: "RBI",
    investedAmount: 0,
    currentValue: 0,
    startDate: "2024-03-01",
    maturityDate: "2032-03-01",
    frequency: "One-time",
    status: "active",
  },
];

export function seedHoldingsIfEmpty(): void {
  if (typeof window === "undefined") return;
  const existing = getStore<InvestmentHolding>(KEYS.holdings);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const seeded = SEED_HOLDINGS.map((h) => ({
    ...h,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }));
  setStore(KEYS.holdings, seeded);
}

// --- Aggregation helpers ---

export function getExpenseSummary(month: string) {
  const expenses = getExpenses({ month });
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayTotal = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekTotal = expenses.filter((e) => e.date >= weekStartStr).reduce((s, e) => s + e.amount, 0);

  const daysInMonth = new Date(parseInt(month.split("-")[0]), parseInt(month.split("-")[1]), 0).getDate();
  const currentDay = new Date().getDate();
  const avgPerDay = currentDay > 0 ? total / currentDay : 0;

  return { total, byCategory, todayTotal, weekTotal, avgPerDay, count: expenses.length, daysInMonth };
}

export function getPortfolioSummary() {
  const holdings = getHoldings({ status: "active" });
  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const byType: Record<string, { invested: number; current: number; count: number }> = {};
  holdings.forEach((h) => {
    if (!byType[h.type]) byType[h.type] = { invested: 0, current: 0, count: 0 };
    byType[h.type].invested += h.investedAmount;
    byType[h.type].current += h.currentValue;
    byType[h.type].count += 1;
  });

  return { totalInvested, totalCurrent, totalGain, gainPct, byType, holdingCount: holdings.length };
}
