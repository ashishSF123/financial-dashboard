import type { FinancialData } from "./parse-excel";

export interface MonthlySnapshot {
  month: string; // "2026-07", "2026-06", etc.
  label: string; // "Jul 2026", "Jun 2026"
  data: FinancialData;
  isCurrent: boolean;
}

// Generate realistic historical months from the current month's data
export function generateHistoricalSnapshots(currentData: FinancialData): MonthlySnapshot[] {
  const months = [
    { month: "2026-07", label: "Jul 2026", offset: 0 },
    { month: "2026-06", label: "Jun 2026", offset: 1 },
    { month: "2026-05", label: "May 2026", offset: 2 },
    { month: "2026-04", label: "Apr 2026", offset: 3 },
    { month: "2026-03", label: "Mar 2026", offset: 4 },
    { month: "2026-02", label: "Feb 2026", offset: 5 },
  ];

  return months.map(({ month, label, offset }) => ({
    month,
    label,
    isCurrent: offset === 0,
    data: offset === 0 ? currentData : generatePastMonth(currentData, offset),
  }));
}

function generatePastMonth(current: FinancialData, monthsBack: number): FinancialData {
  // Gold loans: principal slightly higher in past (payments reduce it over time)
  const goldLoans = current.goldLoans.map((g) => ({
    ...g,
    principalAmount: Math.round(g.principalAmount * (1 + monthsBack * 0.008)),
    monthlyInterest: Math.round(g.principalAmount * (1 + monthsBack * 0.008) * g.roiPct / 12 / 100),
  }));

  // House loans: remaining months higher in past
  const houseLoans = current.houseLoans.map((h) => ({
    ...h,
    remainingMonths: h.remainingMonths + monthsBack,
  }));

  // Borrowed: in older months, there may have been more borrowers
  // Simulate slight variation in amounts (debts were slightly higher)
  const borrowed = current.borrowed.map((b) => ({
    ...b,
    amount: Math.round(b.amount * (1 + monthsBack * 0.01)),
    monthlyInterest: Math.round(b.amount * (1 + monthsBack * 0.01) * b.roi / 100),
  }));

  // Lended stays mostly same
  const lended = [...current.lended];

  // Expenses vary month to month (±5-15% random variance per category)
  const expenses = current.expenses.map((e) => {
    // Chit funds are fixed, others vary
    if (e.type === "Chit Fund") return { ...e };
    const variance = 1 + (seededRandom(e.id + month(monthsBack)) * 0.3 - 0.15);
    return { ...e, amount: Math.round(e.amount * variance) };
  });

  // Gold rate was lower in the past
  const goldRate = Math.round(current.goldRate22ct * (1 - monthsBack * 0.015));

  return {
    ...current,
    goldLoans,
    houseLoans,
    borrowed,
    lended,
    expenses,
    goldRate22ct: goldRate,
  };
}

// Simple seeded random for deterministic "historical" variation
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(Math.sin(hash)) ;
}

function month(offset: number): string {
  return `m${offset}`;
}
