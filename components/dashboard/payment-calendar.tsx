"use client";
import { formatINR } from "@/lib/format-currency";

import { useMemo, useState } from "react";
import type { FinancialData } from "@/lib/parse-excel";

interface PaymentItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: "emi" | "interest" | "chit" | "insurance" | "bill";
  status: "upcoming" | "due" | "overdue" | "paid";
}

interface Props {
  data: FinancialData;
  selectedMonth: string;
}

const categoryConfig: Record<string, { bg: string; text: string; dot: string; label: string; icon: string }> = {
  emi: { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400", label: "EMI", icon: "🏠" },
  interest: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Interest", icon: "💰" },
  chit: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400", label: "Chit Fund", icon: "🤝" },
  insurance: { bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400", label: "Insurance", icon: "🛡️" },
  bill: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400", label: "Bills", icon: "📋" },
};


export function PaymentCalendar({ data, selectedMonth }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const now = new Date();
  const [year, month] = selectedMonth.split("-").map(Number);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const today = isCurrentMonth ? now.getDate() : -1;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

  const payments: PaymentItem[] = useMemo(() => {
    const items: PaymentItem[] = [];

    data.houseLoans.forEach((loan, i) => {
      if (loan.status?.toLowerCase() === "active" || !loan.status?.toLowerCase().includes("completed")) {
        items.push({
          id: `emi-${i}`,
          name: `${loan.bank} ${loan.loanType} EMI`,
          amount: loan.emiAmount,
          dueDay: 5,
          category: "emi",
          status: getStatus(5, today, isCurrentMonth),
        });
      }
    });

    data.goldLoans.forEach((loan, i) => {
      if (loan.status?.toLowerCase() !== "completed") {
        items.push({
          id: `gl-int-${i}`,
          name: `${loan.vendor} Gold Interest`,
          amount: loan.monthlyInterest,
          dueDay: 1,
          category: "interest",
          status: getStatus(1, today, isCurrentMonth),
        });
      }
    });

    data.borrowed.forEach((entry, i) => {
      if (entry.status?.toLowerCase() !== "completed") {
        items.push({
          id: `bor-int-${i}`,
          name: `${entry.personName} Interest`,
          amount: entry.monthlyInterest,
          dueDay: 10,
          category: "interest",
          status: getStatus(10, today, isCurrentMonth),
        });
      }
    });

    data.expenses.filter((e) => e.type?.toLowerCase().includes("chit")).forEach((exp, i) => {
      items.push({
        id: `chit-${i}`,
        name: exp.name,
        amount: exp.amount,
        dueDay: 15,
        category: "chit",
        status: getStatus(15, today, isCurrentMonth),
      });
    });

    data.insurance.forEach((ins, i) => {
      if (month === 1 || month === 7) {
        items.push({
          id: `ins-${i}`,
          name: ins.name,
          amount: ins.amount,
          dueDay: 20,
          category: "insurance",
          status: getStatus(20, today, isCurrentMonth),
        });
      }
    });

    const nonChitExpenses = data.expenses.filter((e) => !e.type?.toLowerCase().includes("chit"));
    if (nonChitExpenses.length > 0) {
      const total = nonChitExpenses.reduce((s, e) => s + e.amount, 0);
      items.push({
        id: "bills-total",
        name: "Monthly Bills & Expenses",
        amount: total,
        dueDay: 28,
        category: "bill",
        status: getStatus(28, today, isCurrentMonth),
      });
    }

    return items.sort((a, b) => a.dueDay - b.dueDay);
  }, [data, today, isCurrentMonth, month]);

  const totalDueThisMonth = payments.reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "overdue");
  const upcoming = payments.filter((p) => p.status === "upcoming" || p.status === "due");
  const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);

  const dueThisWeek = payments.filter((p) => {
    if (!isCurrentMonth) return false;
    return p.dueDay >= today && p.dueDay <= today + 7;
  });
  const weekTotal = dueThisWeek.reduce((s, p) => s + p.amount, 0);

  const getPaymentsForDay = (day: number) => payments.filter((p) => p.dueDay === day);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const filteredPayments = selectedDay ? getPaymentsForDay(selectedDay) : payments;

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-[var(--text-heading)]">
            Payment Calendar
          </h2>
          <p className="text-[0.78rem] text-[var(--text-muted)] mt-0.5">
            {monthName} {year} — {payments.length} scheduled payments
          </p>
        </div>
        {/* Category legend inline */}
        <div className="hidden md:flex items-center gap-4">
          {Object.entries(categoryConfig).map(([cat, c]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
              <span className="text-[0.65rem] text-[var(--text-muted)] font-medium">{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Strip — compact horizontal row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-[var(--text-muted)]">Total Due</p>
              <p className="text-[1.1rem] font-bold text-[var(--text-heading)] tracking-tight mt-0.5">{formatINR(totalDueThisMonth)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <span className="text-xs">📊</span>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-amber-500/80">This Week</p>
              <p className="text-[1.1rem] font-bold text-amber-400 tracking-tight mt-0.5">{formatINR(weekTotal)}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <span className="text-xs">⏰</span>
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.6rem] uppercase tracking-[0.08em] font-semibold text-rose-500/80">Overdue</p>
              <p className={`text-[1.1rem] font-bold tracking-tight mt-0.5 ${overdue.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {overdue.length > 0 ? formatINR(overdueTotal) : "✓ Clear"}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overdue.length > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"}`}>
              <span className="text-xs">{overdue.length > 0 ? "⚠️" : "✅"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid — compact standard size */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl p-4 max-w-md mx-auto">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[0.55rem] font-semibold text-[var(--text-muted)] tracking-[0.08em] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-[2px]">
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="h-9" />;
            const dayPayments = getPaymentsForDay(day);
            const hasOverdue = dayPayments.some((p) => p.status === "overdue");
            const hasDue = dayPayments.some((p) => p.status === "due");
            const isToday = day === today;
            const isSelected = day === selectedDay;
            const hasPayments = dayPayments.length > 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative h-9 rounded-lg flex flex-col items-center justify-center transition-all duration-150 ${
                  isToday
                    ? "bg-indigo-500/20 ring-1.5 ring-indigo-500/50 text-[var(--text-heading)] font-bold"
                    : isSelected
                    ? "bg-[var(--bg-card-hover)] ring-1 ring-white/20 text-[var(--text-heading)]"
                    : hasPayments
                    ? "bg-white/[0.025] hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] cursor-pointer"
                    : "text-[var(--text-muted)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-card)]"
                }`}
              >
                <span className={`text-[0.7rem] leading-none ${isToday ? "font-bold" : hasPayments ? "font-medium" : ""}`}>{day}</span>
                {hasPayments && (
                  <div className="flex items-center gap-[2px] mt-0.5">
                    {dayPayments.slice(0, 3).map((p, i) => (
                      <span
                        key={i}
                        className={`w-[4px] h-[4px] rounded-full ${
                          hasOverdue ? "bg-rose-400" : hasDue ? "bg-amber-400" : categoryConfig[p.category]?.dot || "bg-slate-400"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Today indicator */}
        {isCurrentMonth && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[0.63rem] text-[var(--text-muted)]">Today is {monthName} {today}</span>
          </div>
        )}
      </div>

      {/* Payment List */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-card)] rounded-2xl overflow-hidden">
        {/* List Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">
            {selectedDay ? `Due on ${monthName} ${selectedDay}` : "All Payments"}
          </h3>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[0.68rem] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Show all →
            </button>
          )}
        </div>

        {/* Payment Items */}
        <div className="divide-y divide-[var(--border-subtle)]">
          {filteredPayments.map((p) => {
            const cat = categoryConfig[p.category];
            return (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--bg-card)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                    <span className="text-[0.7rem]">{cat.icon}</span>
                  </div>
                  <div>
                    <p className="text-[0.8rem] text-[var(--text-primary)] font-medium">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.65rem] text-[var(--text-muted)]">Due {p.dueDay}th</span>
                      <span className="text-[0.5rem] text-[var(--text-muted)]">•</span>
                      <span className={`text-[0.65rem] ${cat.text} font-medium`}>{cat.label}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.85rem] font-semibold text-[var(--text-heading)] tabular-nums">{formatINR(p.amount)}</span>
                  <span className={`text-[0.58rem] font-semibold px-2 py-[3px] rounded-md uppercase tracking-[0.04em] ${
                    p.status === "overdue" ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" :
                    p.status === "paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                    p.status === "due" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
                    "bg-slate-500/10 text-[var(--text-secondary)] border border-slate-500/15"
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            );
          })}
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)] text-[0.8rem]">No payments scheduled for this day</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredPayments.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] flex items-center justify-between">
            <span className="text-[0.68rem] text-[var(--text-muted)]">{filteredPayments.length} payment{filteredPayments.length > 1 ? "s" : ""}</span>
            <span className="text-[0.78rem] font-semibold text-[var(--text-heading)] tabular-nums">
              Total: {formatINR(filteredPayments.reduce((s, p) => s + p.amount, 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function getStatus(dueDay: number, today: number, isCurrentMonth: boolean): PaymentItem["status"] {
  if (!isCurrentMonth) return "upcoming";
  if (today > dueDay) return "overdue";
  if (today === dueDay) return "due";
  if (dueDay - today <= 3) return "due";
  return "upcoming";
}
