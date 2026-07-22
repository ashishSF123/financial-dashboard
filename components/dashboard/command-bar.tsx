"use client";
import { formatINR } from "@/lib/format-currency";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface Props {
  data: FinancialData;
  metrics: {
    grandDebt: number;
    totalAssets: number;
    netWorth: number;
    monthlySurplus: number;
    monthlyCredit: number;
    monthlyOutflows: number;
    totalGoldDebt: number;
    totalHouseLoan: number;
    totalBorrowed: number;
    totalLended: number;
  };
  onNavigate: (tab: string) => void;
}


interface SearchResult {
  label: string;
  value: string;
  category: string;
  action?: string;
}

export function CommandBar({ data, metrics, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const allResults: SearchResult[] = [
    { label: "Total Debt", value: formatINR(metrics.grandDebt), category: "Metrics" },
    { label: "Net Worth", value: formatINR(metrics.netWorth), category: "Metrics" },
    { label: "Monthly Surplus", value: formatINR(metrics.monthlySurplus), category: "Metrics" },
    { label: "Monthly Income", value: formatINR(metrics.monthlyCredit), category: "Metrics" },
    { label: "Monthly Outflows", value: formatINR(metrics.monthlyOutflows), category: "Metrics" },
    { label: "Gold Loan Debt", value: formatINR(metrics.totalGoldDebt), category: "Metrics" },
    { label: "House Loan Debt", value: formatINR(metrics.totalHouseLoan), category: "Metrics" },
    { label: "Borrowed Total", value: formatINR(metrics.totalBorrowed), category: "Metrics" },
    { label: "Lended Total", value: formatINR(metrics.totalLended), category: "Metrics" },
    { label: "Total Assets", value: formatINR(metrics.totalAssets), category: "Metrics" },
    { label: "Go to Calendar", value: "View payment schedule", category: "Navigate", action: "calendar" },
    { label: "Go to Budget", value: "Budget vs Actual", category: "Navigate", action: "budget" },
    { label: "Go to Goals", value: "Track savings goals", category: "Navigate", action: "goals" },
    { label: "Go to Debt Planner", value: "Debt freedom strategy", category: "Navigate", action: "debt-plan" },
    { label: "Go to Settlements", value: "Who owes whom", category: "Navigate", action: "settlements" },
    { label: "Go to Trends", value: "Historical comparison", category: "Navigate", action: "trends" },
    ...data.goldLoans.map((g) => ({ label: `${g.vendor} Gold Loan`, value: `${formatINR(g.principalAmount)} @ ${g.roiPct}%`, category: "Gold Loans" })),
    ...data.houseLoans.map((h) => ({ label: `${h.bank} ${h.loanType}`, value: `EMI ${formatINR(h.emiAmount)}`, category: "House Loans" })),
    ...data.borrowed.map((b) => ({ label: `Owe ${b.personName}`, value: formatINR(b.amount), category: "Borrowed" })),
    ...data.lended.map((l) => ({ label: `${l.personName} owes you`, value: formatINR(l.amount), category: "Lended" })),
  ];

  const filtered = query.trim()
    ? allResults.filter((r) => r.label.toLowerCase().includes(query.toLowerCase()) || r.category.toLowerCase().includes(query.toLowerCase()))
    : allResults.slice(0, 12);

  const handleSelect = useCallback((result: SearchResult) => {
    if (result.action) {
      onNavigate(result.action);
    }
    setOpen(false);
    setQuery("");
  }, [onNavigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Command palette */}
      <div className="relative w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-card)]">
          <span className="text-[var(--text-muted)] text-sm">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metrics, navigate, or ask..."
            className="flex-1 bg-transparent text-sm text-[var(--text-heading)] outline-none placeholder-[var(--text-muted)]"
          />
          <kbd className="text-[0.6rem] text-[var(--text-muted)] bg-[var(--bg-card-hover)] border border-[var(--border-card)] rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">No results for &ldquo;{query}&rdquo;</p>
          )}
          {(() => {
            let lastCategory = "";
            return filtered.map((result, i) => {
              const showHeader = result.category !== lastCategory;
              lastCategory = result.category;
              return (
                <div key={i}>
                  {showHeader && (
                    <p className="text-[0.6rem] uppercase tracking-[0.08em] text-[var(--text-muted)] font-medium px-4 pt-2 pb-1">{result.category}</p>
                  )}
                  <button
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">{result.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{result.value}</span>
                  </button>
                </div>
              );
            });
          })()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-card)] flex items-center justify-between">
          <span className="text-[0.6rem] text-[var(--text-muted)]">Navigate with ↑↓ · Select with ↵</span>
          <span className="text-[0.6rem] text-[var(--text-muted)]">⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
