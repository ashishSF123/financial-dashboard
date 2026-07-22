"use client";

export function formatINR(value: number): string {
  if (value === 0) return "₹0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

interface KpiCardProps {
  label: string;
  value: string;
  color: string;
  subtitle?: string;
  change?: number; // percentage change from previous month
}

function KpiCard({ label, value, color, subtitle, change }: KpiCardProps) {
  const colorConfig: Record<string, { text: string; glow: string; border: string; accent: string }> = {
    rose: { text: "text-rose-400", glow: "shadow-rose-500/5", border: "border-rose-500/10", accent: "bg-rose-500" },
    amber: { text: "text-amber-400", glow: "shadow-amber-500/5", border: "border-amber-500/10", accent: "bg-amber-500" },
    emerald: { text: "text-emerald-400", glow: "shadow-emerald-500/5", border: "border-emerald-500/10", accent: "bg-emerald-500" },
    cyan: { text: "text-cyan-400", glow: "shadow-cyan-500/5", border: "border-cyan-500/10", accent: "bg-cyan-500" },
    indigo: { text: "text-indigo-400", glow: "shadow-indigo-500/5", border: "border-indigo-500/10", accent: "bg-indigo-500" },
    purple: { text: "text-purple-400", glow: "shadow-purple-500/5", border: "border-purple-500/10", accent: "bg-purple-500" },
  };

  const c = colorConfig[color] || colorConfig.indigo;

  return (
    <div className={`relative overflow-hidden bg-[#12131a] border ${c.border} rounded-xl p-4 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 ${c.glow} hover:shadow-lg group`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${c.accent} opacity-40`} />
      <p className="text-slate-500 text-[0.65rem] font-semibold uppercase tracking-[0.08em] mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-[1.2rem] font-bold tracking-tight ${c.text}`}>{value}</p>
        {change !== undefined && change !== 0 && (
          <span className={`text-[0.62rem] font-bold ${change > 0 ? "text-rose-400/70" : "text-emerald-400/70"}`}>
            {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-slate-600 text-[0.68rem] mt-1.5 font-medium">{subtitle}</p>}
    </div>
  );
}

interface PrevMetrics {
  grandDebt: number;
  totalGoldDebt: number;
  totalHouseLoan: number;
  totalBorrowed: number;
  totalLended: number;
  totalLease: number;
  monthlyGoldInterest: number;
  monthlyHouseEmi: number;
  monthlyBorrowedInterest: number;
  monthlyLendedInterest: number;
  monthlyExpenses: number;
  monthlyCredit: number;
  netWorth: number;
  goldMarketValue: number;
  monthlySurplus: number;
}

interface KpiCardsProps {
  grandDebt: number;
  totalGoldDebt: number;
  totalHouseLoan: number;
  totalBorrowed: number;
  totalLended: number;
  totalLease: number;
  monthlyGoldInterest: number;
  monthlyHouseEmi: number;
  monthlyBorrowedInterest: number;
  monthlyLendedInterest: number;
  monthlyExpenses: number;
  monthlyCredit: number;
  netWorth: number;
  goldMarketValue: number;
  monthlySurplus: number;
  prevMetrics?: PrevMetrics | null;
}

function pctChange(current: number, previous: number | undefined): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[1.5px]">{children}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  );
}

export function KpiCards(props: KpiCardsProps) {
  const p = props.prevMetrics;

  return (
    <div className="space-y-7">
      <div>
        <SectionLabel>Total Debt Overview</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Grand Total Debt" value={formatINR(props.grandDebt)} color="rose" change={pctChange(props.grandDebt, p?.grandDebt)} />
          <KpiCard label="House Loan" value={formatINR(props.totalHouseLoan)} color="amber" subtitle="Principal outstanding" change={pctChange(props.totalHouseLoan, p?.totalHouseLoan)} />
          <KpiCard label="Gold Loan Debt" value={formatINR(props.totalGoldDebt)} color="amber" subtitle="All packets combined" change={pctChange(props.totalGoldDebt, p?.totalGoldDebt)} />
          <KpiCard label="Lease Liabilities" value={formatINR(props.totalLease)} color="cyan" subtitle="Zero interest" />
        </div>
      </div>

      <div>
        <SectionLabel>Monthly Outflows</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="House EMI" value={formatINR(props.monthlyHouseEmi)} color="rose" subtitle="Fixed obligation" />
          <KpiCard label="Gold Interest" value={formatINR(props.monthlyGoldInterest)} color="amber" subtitle="All packets" change={pctChange(props.monthlyGoldInterest, p?.monthlyGoldInterest)} />
          <KpiCard label="Borrowed Interest" value={formatINR(props.monthlyBorrowedInterest)} color="purple" subtitle="Personal loans" change={pctChange(props.monthlyBorrowedInterest, p?.monthlyBorrowedInterest)} />
          <KpiCard label="Total Expenses" value={formatINR(props.monthlyExpenses)} color="amber" subtitle="Chit funds + bills" change={pctChange(props.monthlyExpenses, p?.monthlyExpenses)} />
        </div>
      </div>

      <div>
        <SectionLabel>Lending vs Borrowing</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Total Lended" value={formatINR(props.totalLended)} color="emerald" subtitle="Outstanding receivables" />
          <KpiCard label="Lended Interest/mo" value={formatINR(props.monthlyLendedInterest)} color="emerald" subtitle="Income stream" />
          <KpiCard label="Total Borrowed" value={formatINR(props.totalBorrowed)} color="rose" subtitle="Personal liabilities" change={pctChange(props.totalBorrowed, p?.totalBorrowed)} />
          <KpiCard label="Borrowed Interest/mo" value={formatINR(props.monthlyBorrowedInterest)} color="rose" subtitle="Cost of debt" />
        </div>
      </div>

      <div>
        <SectionLabel>Income & Net Position</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Monthly Credit" value={formatINR(props.monthlyCredit)} color="emerald" subtitle="Salary + Rentals" />
          <KpiCard label="Monthly Surplus" value={formatINR(props.monthlySurplus)} color={props.monthlySurplus > 0 ? "emerald" : "rose"} subtitle="After all outflows" change={pctChange(props.monthlySurplus, p?.monthlySurplus)} />
          <KpiCard label="Gold Market Value" value={formatINR(props.goldMarketValue)} color="amber" subtitle="22ct live rate" change={pctChange(props.goldMarketValue, p?.goldMarketValue)} />
          <KpiCard label="Net Worth" value={formatINR(props.netWorth)} color={props.netWorth > 0 ? "emerald" : "rose"} subtitle="Assets − Liabilities" change={pctChange(props.netWorth, p?.netWorth)} />
        </div>
      </div>
    </div>
  );
}
