// Types and constants for the expense & investment modules

export interface DailyExpense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
  paymentMethod: "Cash" | "UPI" | "Card" | "Bank Transfer";
  createdAt?: string;
}

export interface InvestmentHolding {
  id: string;
  type: InvestmentType;
  name: string;
  provider: string;
  investedAmount: number;
  currentValue: number;
  units?: number;
  rateOrNav?: number;
  startDate?: string;
  maturityDate?: string;
  frequency?: "Monthly" | "Quarterly" | "Yearly" | "One-time";
  status: "active" | "matured" | "sold" | "closed";
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestmentTransaction {
  id: string;
  holdingId: string;
  type: "buy" | "sell" | "sip" | "dividend" | "interest" | "contribution";
  date: string;
  amount: number;
  units?: number;
  navOrPrice?: number;
  notes?: string;
  createdAt?: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number; // 0-1, e.g. 0.8 = alert at 80%
}

export type InvestmentType =
  | "mutual_fund"
  | "stock"
  | "fd"
  | "rd"
  | "ppf"
  | "epf"
  | "nps"
  | "ssy"
  | "gold_physical"
  | "gold_sgb"
  | "gold_digital"
  | "real_estate";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport & Fuel",
  "Shopping",
  "Bills & Utilities",
  "Health & Medical",
  "Education",
  "Entertainment",
  "Personal Care",
  "Household",
  "Gifts & Donations",
  "Travel",
  "EMI & Loan Payments",
  "Subscriptions",
  "Other",
] as const;

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer"] as const;

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  mutual_fund: "Mutual Fund",
  stock: "Stock",
  fd: "Fixed Deposit",
  rd: "Recurring Deposit",
  ppf: "PPF",
  epf: "EPF",
  nps: "NPS",
  ssy: "SSY",
  gold_physical: "Gold (Physical)",
  gold_sgb: "Sovereign Gold Bond",
  gold_digital: "Gold (Digital)",
  real_estate: "Real Estate",
};

// --- Income Sources ---

export type IncomeType = "salary" | "freelance" | "rental" | "business" | "interest" | "dividend" | "pension" | "other";

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  salary: "Salary",
  freelance: "Freelance / Side Income",
  rental: "Rental Income",
  business: "Business Income",
  interest: "Interest (FD/Savings)",
  dividend: "Dividends",
  pension: "Pension",
  other: "Other Income",
};

export interface IncomeSource {
  id: string;
  type: IncomeType;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly" | "one-time";
  isActive: boolean;
  startDate?: string;
  notes?: string;
  createdAt?: string;
}

// --- Subscriptions ---

export interface Subscription {
  id: string;
  name: string;
  provider: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "yearly";
  category: "streaming" | "music" | "fitness" | "cloud" | "news" | "productivity" | "gaming" | "other";
  lastUsedDate?: string;
  nextBillingDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
}

export const SUBSCRIPTION_CATEGORIES: Record<string, string> = {
  streaming: "Streaming / OTT",
  music: "Music",
  fitness: "Health & Fitness",
  cloud: "Cloud / Storage",
  news: "News / Reading",
  productivity: "Productivity / Tools",
  gaming: "Gaming",
  other: "Other",
};

// --- Net Worth Snapshot ---

export interface NetWorthSnapshot {
  month: string;
  assets: number;
  investments: number;
  debt: number;
  netWorth: number;
  recordedAt: string;
}

// --- Additional Loans ---

export type AdditionalLoanType =
  | "credit_card"
  | "personal_loan"
  | "vehicle_loan"
  | "chit_fund"
  | "mortgage"
  | "education_loan"
  | "business_loan"
  | "consumer_loan"
  | "peer_lending"
  | "custom";

export const LOAN_TYPE_LABELS: Record<AdditionalLoanType, string> = {
  credit_card: "Credit Card Due",
  personal_loan: "Personal Loan",
  vehicle_loan: "Vehicle / Auto Loan",
  chit_fund: "Chit Fund Payment",
  mortgage: "Mortgage / LAP",
  education_loan: "Education Loan",
  business_loan: "Business Loan",
  consumer_loan: "Consumer / EMI Purchase",
  peer_lending: "Peer / App Loan",
  custom: "Other Loan",
};

export interface AdditionalLoan {
  id: string;
  type: AdditionalLoanType;
  name: string;
  provider: string;
  outstandingBalance: number;
  creditLimit?: number; // for credit cards
  emiAmount: number;
  interestRate: number;
  minimumDue?: number; // for credit cards
  tenureMonths?: number;
  remainingMonths?: number;
  startDate?: string;
  dueDate?: string;
  status: "active" | "closed" | "overdue";
  createdAt?: string;
  updatedAt?: string;
}

// --- Insurance ---

export type InsuranceType = "health" | "term" | "vehicle" | "home";

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  health: "Health Insurance",
  term: "Term Life Insurance",
  vehicle: "Vehicle Insurance",
  home: "Home Insurance",
};

export interface InsurancePolicy {
  id: string;
  type: InsuranceType;
  name: string;
  provider: string;
  policyNumber: string;
  sumAssured: number;
  premium: number;
  premiumFrequency: "monthly" | "quarterly" | "half-yearly" | "yearly";
  startDate: string;
  endDate: string;
  renewalDate: string;
  lastPaidDate: string;
  nextDueDate: string;
  nomineeName: string;
  coverageDetails: string;
  claimHistory: string;
  status: "active" | "lapsed" | "expired" | "claimed";
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORY_ICONS: Record<string, string> = {
  "Food & Dining": "🍽️",
  "Groceries": "🛒",
  "Transport & Fuel": "⛽",
  "Shopping": "🛍️",
  "Bills & Utilities": "💡",
  "Health & Medical": "🏥",
  "Education": "📚",
  "Entertainment": "🎬",
  "Personal Care": "💅",
  "Household": "🏠",
  "Gifts & Donations": "🎁",
  "Travel": "✈️",
  "EMI & Loan Payments": "🏦",
  "Subscriptions": "📱",
  "Other": "📌",
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Food & Dining": { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  "Groceries": { bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-400" },
  "Transport & Fuel": { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  "Shopping": { bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  "Bills & Utilities": { bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-400" },
  "Health & Medical": { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
  "Education": { bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  "Entertainment": { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
  "Personal Care": { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", dot: "bg-fuchsia-400" },
  "Household": { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400" },
  "Gifts & Donations": { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
  "Travel": { bg: "bg-sky-500/10", text: "text-sky-400", dot: "bg-sky-400" },
  "EMI & Loan Payments": { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  "Subscriptions": { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  "Other": { bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400" },
};
