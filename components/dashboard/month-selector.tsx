"use client";

import { useState, useRef, useEffect } from "react";

interface MonthSelectorProps {
  months: { month: string; label: string; isCurrent: boolean }[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}

export function MonthSelector({ months, selectedMonth, onSelect }: MonthSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = months.find((m) => m.month === selectedMonth);
  const selectedIdx = months.findIndex((m) => m.month === selectedMonth);

  const goNext = () => {
    if (selectedIdx > 0) onSelect(months[selectedIdx - 1].month);
  };
  const goPrev = () => {
    if (selectedIdx < months.length - 1) onSelect(months[selectedIdx + 1].month);
  };

  return (
    <div className="relative flex items-center gap-1 z-[100]" ref={ref}>
      {/* Previous month button */}
      <button
        onClick={goPrev}
        disabled={selectedIdx >= months.length - 1}
        className="w-7 h-7 rounded-lg bg-[var(--bg-input)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px]"
        title="Previous month"
      >
        ◂
      </button>

      {/* Month selector dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2.5 bg-[var(--bg-input)] border border-[var(--border-card)] hover:border-white/[0.12] rounded-lg px-4 py-1.5 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[var(--text-heading)] text-xs font-semibold tracking-tight">{current?.label || "Select"}</span>
          </div>
          {current?.isCurrent && (
            <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Live
            </span>
          )}
          <svg className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-[#14151e] border border-[var(--border-card)] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-[200]">
            <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
              <p className="text-[9px] font-bold uppercase tracking-[1.5px] text-[var(--text-muted)]">Select Period</p>
            </div>
            <div className="py-1 max-h-[240px] overflow-y-auto">
              {months.map((m) => (
                <button
                  key={m.month}
                  onClick={() => { onSelect(m.month); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                    m.month === selectedMonth
                      ? "bg-indigo-500/[0.08] text-[var(--text-heading)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${m.month === selectedMonth ? "bg-indigo-400" : "bg-slate-700"}`} />
                    <span className="font-medium">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.isCurrent && (
                      <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Current</span>
                    )}
                    {m.month === selectedMonth && (
                      <span className="text-indigo-400 text-[10px]">●</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
              <p className="text-[9px] text-[var(--text-muted)] font-medium">
                Historical data is generated from current snapshot with realistic variations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Next month button */}
      <button
        onClick={goNext}
        disabled={selectedIdx <= 0}
        className="w-7 h-7 rounded-lg bg-[var(--bg-input)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px]"
        title="Next month"
      >
        ▸
      </button>
    </div>
  );
}
