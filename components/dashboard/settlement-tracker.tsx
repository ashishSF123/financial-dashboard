"use client";

import { useMemo } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface Props {
  data: FinancialData;
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function monthsSince(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  return Math.max(0, (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
}

export function SettlementTracker({ data }: Props) {
  const analysis = useMemo(() => {
    // People you owe (borrowed)
    const borrowedPeople = data.borrowed.map((b) => {
      const months = monthsSince(b.date);
      const interestAccrued = b.monthlyInterest * months;
      const totalOwed = b.amount + interestAccrued;
      return { ...b, months, interestAccrued, totalOwed, direction: "owe" as const };
    });

    // People who owe you (lended)
    const lendedPeople = data.lended.map((l) => {
      const months = monthsSince(l.date);
      const interestAccrued = l.monthlyInterest * months;
      const totalOwed = l.amount + interestAccrued;
      return { ...l, months, interestAccrued, totalOwed, direction: "owed" as const };
    });

    const totalYouOwe = borrowedPeople.reduce((s, b) => s + b.totalOwed, 0);
    const totalOwedToYou = lendedPeople.reduce((s, l) => s + l.totalOwed, 0);
    const netPosition = totalOwedToYou - totalYouOwe;

    // Group lended by person
    const lendedByPerson = new Map<string, typeof lendedPeople>();
    lendedPeople.forEach((l) => {
      const existing = lendedByPerson.get(l.personName) || [];
      existing.push(l);
      lendedByPerson.set(l.personName, existing);
    });

    return { borrowedPeople, lendedPeople, lendedByPerson, totalYouOwe, totalOwedToYou, netPosition };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-white flex items-center gap-2">
          <span className="text-lg">🤝</span> Settlement Tracker
        </h2>
        <p className="text-[0.78rem] text-slate-500 leading-relaxed mt-1">Track who owes whom with real-time interest accrual</p>
      </div>

      {/* Net Position Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-500/[0.05] border border-rose-500/20 rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-rose-400/70 mb-1">You Owe (with Interest)</p>
          <p className="text-[1.3rem] font-bold tracking-tight text-rose-400">{formatINR(analysis.totalYouOwe)}</p>
          <p className="text-[0.68rem] text-slate-500 mt-1">{analysis.borrowedPeople.length} creditors</p>
        </div>
        <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-4">
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-emerald-400/70 mb-1">Owed To You (with Interest)</p>
          <p className="text-[1.3rem] font-bold tracking-tight text-emerald-400">{formatINR(analysis.totalOwedToYou)}</p>
          <p className="text-[0.68rem] text-slate-500 mt-1">{analysis.lendedByPerson.size} debtors</p>
        </div>
        <div className={`border rounded-xl p-4 ${analysis.netPosition >= 0 ? "bg-emerald-500/[0.05] border-emerald-500/20" : "bg-rose-500/[0.05] border-rose-500/20"}`}>
          <p className="text-[0.65rem] uppercase tracking-[0.08em] font-medium text-slate-400 mb-1">Net Position</p>
          <p className={`text-[1.3rem] font-bold tracking-tight ${analysis.netPosition >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {analysis.netPosition >= 0 ? "+" : ""}{formatINR(Math.abs(analysis.netPosition))}
          </p>
          <p className="text-[0.68rem] text-slate-500 mt-1">{analysis.netPosition >= 0 ? "Net positive" : "Net negative"}</p>
        </div>
      </div>

      {/* People You Owe */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <h3 className="text-[0.88rem] font-semibold text-white tracking-[-0.01em]">People You Owe</h3>
        </div>
        <div className="space-y-3">
          {analysis.borrowedPeople.map((person) => (
            <div key={person.id} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-rose-400">{person.personName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{person.personName}</p>
                    <p className="text-[0.68rem] text-slate-500">{person.location} · Since {person.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-rose-400">{formatINR(person.totalOwed)}</p>
                  <p className="text-[0.68rem] text-slate-500">Total owed now</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 bg-white/[0.02] rounded-lg p-2">
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase">Principal</p>
                  <p className="text-xs font-medium text-slate-300">{formatINR(person.amount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase">ROI</p>
                  <p className="text-xs font-medium text-slate-300">{person.roi}%/mo</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase">Months</p>
                  <p className="text-xs font-medium text-slate-300">{person.months}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-500 uppercase">Int. Accrued</p>
                  <p className="text-xs font-medium text-amber-400">{formatINR(person.interestAccrued)}</p>
                </div>
              </div>
              {/* Progress bar showing interest vs principal */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                  <span>Principal</span>
                  <span>Interest ({((person.interestAccrued / person.totalOwed) * 100).toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden flex">
                  <div className="bg-rose-500/60 rounded-l-full" style={{ width: `${(person.amount / person.totalOwed) * 100}%` }} />
                  <div className="bg-amber-500/60 rounded-r-full" style={{ width: `${(person.interestAccrued / person.totalOwed) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* People Who Owe You */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h3 className="text-[0.88rem] font-semibold text-white tracking-[-0.01em]">People Who Owe You</h3>
        </div>
        <div className="space-y-3">
          {Array.from(analysis.lendedByPerson.entries()).map(([personName, entries]) => {
            const totalPrincipal = entries.reduce((s, e) => s + e.amount, 0);
            const totalInterest = entries.reduce((s, e) => s + e.interestAccrued, 0);
            const total = totalPrincipal + totalInterest;

            return (
              <div key={personName} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-400">{personName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{personName}</p>
                      <p className="text-[0.68rem] text-slate-500">{entries.length} transaction{entries.length > 1 ? "s" : ""} · {entries[0]?.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-emerald-400">{formatINR(total)}</p>
                    <p className="text-[0.68rem] text-slate-500">Total receivable</p>
                  </div>
                </div>
                {/* Breakdown per transaction */}
                <div className="space-y-1.5">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-xs bg-white/[0.02] rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{entry.date}</span>
                        <span className="text-slate-300">{formatINR(entry.amount)}</span>
                        <span className="text-slate-600">@</span>
                        <span className="text-slate-400">{entry.roi}%/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400/80 text-[10px]">+{formatINR(entry.interestAccrued)} int</span>
                        <span className="text-emerald-400 font-medium">{formatINR(entry.totalOwed)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interest Income Summary */}
      <div className="bg-gradient-to-br from-emerald-500/[0.05] to-cyan-500/[0.03] border border-emerald-500/20 rounded-2xl p-6">
        <h3 className="text-[0.88rem] font-semibold text-white tracking-[-0.01em] mb-3">Monthly Interest Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[0.65rem] text-slate-500 uppercase tracking-[0.08em] font-medium mb-0.5">Interest You Pay</p>
            <p className="text-lg font-bold text-rose-400">-{formatINR(data.borrowed.reduce((s, b) => s + b.monthlyInterest, 0))}/mo</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-slate-500 uppercase tracking-[0.08em] font-medium mb-0.5">Interest You Earn</p>
            <p className="text-lg font-bold text-emerald-400">+{formatINR(data.lended.reduce((s, l) => s + l.monthlyInterest, 0))}/mo</p>
          </div>
          <div>
            <p className="text-[0.65rem] text-slate-500 uppercase tracking-[0.08em] font-medium mb-0.5">Net Interest</p>
            {(() => {
              const net = data.lended.reduce((s, l) => s + l.monthlyInterest, 0) - data.borrowed.reduce((s, b) => s + b.monthlyInterest, 0);
              return <p className={`text-lg font-bold ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{net >= 0 ? "+" : ""}{formatINR(Math.abs(net))}/mo</p>;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
