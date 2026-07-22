import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export interface GoldLoan {
  id: string;
  accountName: string;
  vendor: string;
  goldWeight: number;
  principalAmount: number;
  roiPct: number;
  monthlyInterest: number;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

export interface HouseLoan {
  id: string;
  loanType: string;
  bank: string;
  loanAmount: number;
  emiAmount: number;
  interestRate: number;
  tenureMonths: number;
  remainingMonths: number;
  status: string;
}

export interface BorrowedEntry {
  id: string;
  personName: string;
  amount: number;
  location: string;
  date: string;
  roi: number;
  monthlyInterest: number;
  status: string;
}

export interface LendedEntry {
  id: string;
  personName: string;
  amount: number;
  location: string;
  date: string;
  roi: number;
  monthlyInterest: number;
}

export interface Expense {
  id: string;
  name: string;
  type: string;
  provider: string;
  amount: number;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  provider: string;
  amount: number;
  status: string;
}

export interface WealthItem {
  id: string;
  name: string;
  type: string;
  provider: string;
  amount: number;
  status: string;
  place: string;
}

export interface FinancialData {
  goldLoans: GoldLoan[];
  houseLoans: HouseLoan[];
  borrowed: BorrowedEntry[];
  lended: LendedEntry[];
  expenses: Expense[];
  assets: Asset[];
  realEstate: WealthItem[];
  insurance: WealthItem[];
  mutualFunds: WealthItem[];
  leases: { name: string; amount: number }[];
  monthlyCredit: number;
  goldRate22ct: number;
}

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function parseExcelData(): FinancialData {
  const possiblePaths = [
    path.join(process.cwd(), "..", "Self_finance_data.xlsx"),
    path.join(process.cwd(), "Self_finance_data.xlsx"),
    "/Users/ashishbunny01/.snowflake/cortex/playground/workspace/Self_finance_data.xlsx",
  ];
  
  let excelPath = "";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) { excelPath = p; break; }
  }
  if (!excelPath) {
    return getDefaultData();
  }

  const buffer = fs.readFileSync(excelPath);
  const workbook = XLSX.read(buffer, { type: "buffer" });

  // Gold Loans (investments sheet, header at row 7)
  const goldLoans: GoldLoan[] = [];
  const invSheet = workbook.Sheets["investments"];
  if (invSheet) {
    const invData = XLSX.utils.sheet_to_json(invSheet, { range: 6, header: 1 }) as unknown[][];
    for (let i = 1; i < Math.min(8, invData.length); i++) {
      const row = invData[i];
      if (!row || !row[1]) continue;
      const principal = toNum(row[7]);
      if (principal <= 0) continue;
      const roi = toNum(row[8]);
      goldLoans.push({
        id: `gl-${i}`,
        accountName: toStr(row[1]),
        vendor: toStr(row[4]),
        goldWeight: toNum(row[6]),
        principalAmount: principal,
        roiPct: roi,
        monthlyInterest: toNum(row[10]) || (principal * roi / 12 / 100),
        startDate: toStr(row[11]),
        endDate: toStr(row[12]),
        location: toStr(row[14]),
        status: principal > 0 ? "In progress" : "Completed",
      });
    }
  }

  // House Loans
  const houseLoans: HouseLoan[] = [];
  const hlSheet = workbook.Sheets["House_Loan_Details"];
  if (hlSheet) {
    const hlData = XLSX.utils.sheet_to_json(hlSheet, { header: 1 }) as unknown[][];
    const now = new Date();
    for (let i = 1; i < hlData.length; i++) {
      const row = hlData[i];
      if (!row || !row[2]) continue;
      const tenure = toNum(row[9]);
      const startDate = row[10];
      let remaining = toNum(row[12]);
      if (!remaining && startDate && tenure) {
        const sd = new Date(startDate as string);
        const elapsed = (now.getFullYear() - sd.getFullYear()) * 12 + (now.getMonth() - sd.getMonth());
        remaining = Math.max(0, tenure - elapsed);
      }
      houseLoans.push({
        id: `hl-${i}`,
        loanType: toStr(row[3]),
        bank: toStr(row[4]),
        loanAmount: toNum(row[5]),
        emiAmount: toNum(row[7]),
        interestRate: toNum(row[8]),
        tenureMonths: tenure,
        remainingMonths: remaining,
        status: toStr(row[15]) || "Active",
      });
    }
  }

  // Borrowed (investments sheet, header at row 19)
  const borrowed: BorrowedEntry[] = [];
  if (invSheet) {
    const borData = XLSX.utils.sheet_to_json(invSheet, { range: 18, header: 1 }) as unknown[][];
    for (let i = 1; i < Math.min(8, borData.length); i++) {
      const row = borData[i];
      if (!row || !row[1]) continue;
      if (toStr(row[1]).toLowerCase().includes("total")) continue;
      const amt = toNum(row[2]);
      const roi = toNum(row[5]);
      const status = toStr(row[7]) || "In progress";
      if (status.toLowerCase().includes("completed")) continue;
      borrowed.push({
        id: `bor-${i}`,
        personName: toStr(row[1]),
        amount: amt,
        location: toStr(row[3]),
        date: toStr(row[4]),
        roi: roi,
        monthlyInterest: toNum(row[6]) || (amt * roi / 100),
        status,
      });
    }
  }

  // Lended (investments sheet, header at row 33)
  const lended: LendedEntry[] = [];
  if (invSheet) {
    const lenData = XLSX.utils.sheet_to_json(invSheet, { range: 32, header: 1 }) as unknown[][];
    for (let i = 1; i < Math.min(6, lenData.length); i++) {
      const row = lenData[i];
      if (!row || !row[1]) continue;
      if (toStr(row[1]).toLowerCase().includes("vijayendra")) continue;
      const amt = toNum(row[2]);
      const roi = toNum(row[5]);
      lended.push({
        id: `len-${i}`,
        personName: toStr(row[1]),
        amount: amt,
        location: toStr(row[3]),
        date: toStr(row[4]),
        roi: roi,
        monthlyInterest: toNum(row[6]) || (amt * roi / 100),
      });
    }
  }

  // Monthly Expenses
  const expenses: Expense[] = [];
  const expSheet = workbook.Sheets["Monthly_EXP_Details"];
  if (expSheet) {
    const expData = XLSX.utils.sheet_to_json(expSheet, { header: 1 }) as unknown[][];
    for (let i = 1; i < expData.length; i++) {
      const row = expData[i];
      if (!row || !row[1]) continue;
      if (toStr(row[0]) === "Sr.No") continue;
      let expType = toStr(row[2]);
      if (expType.toLowerCase().includes("twenty")) expType = "Chit Fund";
      expenses.push({
        id: `exp-${i}`,
        name: toStr(row[1]),
        type: expType,
        provider: toStr(row[3]),
        amount: toNum(row[4]),
      });
    }
  }
  // Add Margadarsi chit fund entries
  expenses.push({ id: "exp-marg1", name: "Margadarsi Chit Fund (13K)", type: "Chit Fund", provider: "Margadarsi", amount: 13000 });
  expenses.push({ id: "exp-marg2", name: "Margadarsi Chit Fund (17.5K)", type: "Chit Fund", provider: "Margadarsi", amount: 17500 });

  // Assets
  const assets: Asset[] = [];
  const assSheet = workbook.Sheets["assets"];
  if (assSheet) {
    const assData = XLSX.utils.sheet_to_json(assSheet, { header: 1 }) as unknown[][];
    for (let i = 1; i < assData.length; i++) {
      const row = assData[i];
      if (!row || !row[1]) continue;
      assets.push({
        id: `ast-${i}`,
        name: toStr(row[1]),
        type: toStr(row[2]),
        provider: toStr(row[3]),
        amount: toNum(row[4]),
        status: toStr(row[6]),
      });
    }
  }

  // Wealth - Real Estate
  const realEstate: WealthItem[] = [];
  const reSheet = workbook.Sheets["Wealth_RealEstate"];
  if (reSheet) {
    const reData = XLSX.utils.sheet_to_json(reSheet, { range: 1, header: 1 }) as unknown[][];
    for (let i = 1; i < reData.length; i++) {
      const row = reData[i];
      if (!row || !row[0]) continue;
      realEstate.push({
        id: `re-${i}`,
        name: toStr(row[0]),
        type: toStr(row[1]),
        provider: toStr(row[2]),
        amount: toNum(row[3]),
        status: toStr(row[4]),
        place: toStr(row[5]),
      });
    }
  }
  if (realEstate.length === 0) {
    realEstate.push(
      { id: "re-1", name: "Multistorey Building", type: "House", provider: "Self", amount: 20000000, status: "Monthly EMI", place: "Bangalore" },
      { id: "re-2", name: "Gandikota Township", type: "7 Cents Land", provider: "Self", amount: 2450000, status: "Completed", place: "Jammalamadugu" },
    );
  }

  // Wealth - Insurance
  const insurance: WealthItem[] = [];
  const insSheet = workbook.Sheets["Wealth_Insurance"];
  if (insSheet) {
    const insData = XLSX.utils.sheet_to_json(insSheet, { range: 1, header: 1 }) as unknown[][];
    for (let i = 1; i < insData.length; i++) {
      const row = insData[i];
      if (!row || !row[0]) continue;
      insurance.push({
        id: `ins-${i}`,
        name: toStr(row[0]),
        type: toStr(row[1]),
        provider: toStr(row[2]),
        amount: toNum(row[3]),
        status: toStr(row[4]),
        place: toStr(row[5]),
      });
    }
  }
  if (insurance.length === 0) {
    insurance.push(
      { id: "ins-1", name: "SBI Smart Scholar Plan - Dhanvika", type: "ULIP", provider: "SBI", amount: 500000, status: "Yearly payment", place: "SBI Life" },
      { id: "ins-2", name: "SBI Life - eShield Next", type: "Term Insurance", provider: "SBI", amount: 10000000, status: "Yearly payment", place: "SBI Kadapa" },
    );
  }

  // Wealth - Mutual Funds
  const mutualFunds: WealthItem[] = [];
  const mfSheet = workbook.Sheets["Wealth_MutualFunds"];
  if (mfSheet) {
    const mfData = XLSX.utils.sheet_to_json(mfSheet, { range: 1, header: 1 }) as unknown[][];
    for (let i = 1; i < mfData.length; i++) {
      const row = mfData[i];
      if (!row || !row[0]) continue;
      mutualFunds.push({
        id: `mf-${i}`,
        name: toStr(row[0]),
        type: toStr(row[1]),
        provider: toStr(row[2]),
        amount: toNum(row[3]),
        status: toStr(row[4]),
        place: toStr(row[5]),
      });
    }
  }
  if (mutualFunds.length === 0) {
    mutualFunds.push(
      { id: "mf-1", name: "SBI Contra Fund Growth", type: "Equity", provider: "SBI", amount: 1000, status: "Monthly payment", place: "Phonepe" },
      { id: "mf-2", name: "Nippon India Small Cap Fund", type: "Equity", provider: "Nippon", amount: 1000, status: "Monthly payment", place: "Phonepe" },
    );
  }

  return {
    goldLoans,
    houseLoans,
    borrowed,
    lended,
    expenses,
    assets,
    realEstate,
    insurance,
    mutualFunds,
    leases: [
      { name: "Pugal", amount: 700000 },
      { name: "Nirmala", amount: 700000 },
      { name: "Sheeba", amount: 1920000 },
    ],
    monthlyCredit: 215000,
    goldRate22ct: 13000,
  };
}

function getDefaultData(): FinancialData {
  return {
    goldLoans: [
      { id: "gl-1", accountName: "SBI Gold Loan 1", vendor: "SBI", goldWeight: 150, principalAmount: 2500000, roiPct: 12, monthlyInterest: 25000, startDate: "2024-01", endDate: "2025-12", location: "Kadapa", status: "In progress" },
      { id: "gl-2", accountName: "Muthoot Gold Loan", vendor: "Muthoot", goldWeight: 120, principalAmount: 2000000, roiPct: 14, monthlyInterest: 23333, startDate: "2024-03", endDate: "2025-06", location: "Kadapa", status: "In progress" },
      { id: "gl-3", accountName: "Manappuram Gold", vendor: "Manappuram", goldWeight: 80, principalAmount: 1840346, roiPct: 15, monthlyInterest: 23004, startDate: "2024-06", endDate: "2025-12", location: "Bangalore", status: "In progress" },
    ],
    houseLoans: [
      { id: "hl-1", loanType: "Home Loan", bank: "SBI", loanAmount: 5000000, emiAmount: 42000, interestRate: 8.5, tenureMonths: 240, remainingMonths: 180, status: "Active" },
      { id: "hl-2", loanType: "Home Loan", bank: "HDFC", loanAmount: 5031820, emiAmount: 36799, interestRate: 8.75, tenureMonths: 300, remainingMonths: 260, status: "Active" },
    ],
    borrowed: [
      { id: "bor-1", personName: "Vanthatipalli Shankar", amount: 1000000, location: "Kadapa", date: "2023-06", roi: 1.5, monthlyInterest: 15000, status: "In progress" },
      { id: "bor-2", personName: "Gangadhar", amount: 250000, location: "Kadapa", date: "2024-01", roi: 1.5, monthlyInterest: 3750, status: "In progress" },
      { id: "bor-3", personName: "Pranay", amount: 200000, location: "Hyderabad", roi: 2, date: "2024-03", monthlyInterest: 4000, status: "In progress" },
    ],
    lended: [
      { id: "len-1", personName: "Ramesh", amount: 200000, location: "Kadapa", date: "2023-01", roi: 3, monthlyInterest: 6000 },
      { id: "len-2", personName: "Ramesh", amount: 170000, location: "Kadapa", date: "2023-06", roi: 3, monthlyInterest: 5100 },
      { id: "len-3", personName: "Ramesh", amount: 200000, location: "Kadapa", date: "2024-01", roi: 3, monthlyInterest: 6000 },
      { id: "len-4", personName: "Ramesh", amount: 200000, location: "Kadapa", date: "2024-06", roi: 3, monthlyInterest: 6000 },
    ],
    expenses: [
      { id: "exp-1", name: "Pallavi Chit Fund (30.7K)", type: "Chit Fund", provider: "Pallavi", amount: 30720 },
      { id: "exp-2", name: "Pallavi Chit Fund (41.2K)", type: "Chit Fund", provider: "Pallavi", amount: 41200 },
      { id: "exp-3", name: "Margadarsi Chit Fund (13K)", type: "Chit Fund", provider: "Margadarsi", amount: 13000 },
      { id: "exp-4", name: "Margadarsi Chit Fund (17.5K)", type: "Chit Fund", provider: "Margadarsi", amount: 17500 },
      { id: "exp-5", name: "House Maintenance", type: "Household", provider: "Self", amount: 15000 },
      { id: "exp-6", name: "Groceries", type: "Household", provider: "Self", amount: 12000 },
      { id: "exp-7", name: "Utilities & Bills", type: "Bills", provider: "Various", amount: 8000 },
      { id: "exp-8", name: "Transportation", type: "Transport", provider: "Self", amount: 5000 },
    ],
    assets: [
      { id: "ast-1", name: "Multistorey Building", type: "Real Estate", provider: "Self", amount: 20000000, status: "Active" },
      { id: "ast-2", name: "Gandikota Township Land", type: "Real Estate", provider: "Self", amount: 2450000, status: "Completed" },
      { id: "ast-3", name: "SBI Smart Scholar", type: "ULIP", provider: "SBI", amount: 500000, status: "Active" },
    ],
    realEstate: [
      { id: "re-1", name: "Multistorey Building", type: "House", provider: "Self", amount: 20000000, status: "Monthly EMI", place: "Bangalore" },
      { id: "re-2", name: "Gandikota Township", type: "7 Cents Land", provider: "Self", amount: 2450000, status: "Completed", place: "Jammalamadugu" },
    ],
    insurance: [
      { id: "ins-1", name: "SBI Smart Scholar Plan - Dhanvika", type: "ULIP", provider: "SBI", amount: 500000, status: "Yearly payment", place: "SBI Life" },
      { id: "ins-2", name: "SBI Life - eShield Next", type: "Term Insurance", provider: "SBI", amount: 10000000, status: "Yearly payment", place: "SBI Kadapa" },
    ],
    mutualFunds: [
      { id: "mf-1", name: "SBI Contra Fund Growth", type: "Equity", provider: "SBI", amount: 1000, status: "Monthly payment", place: "Phonepe" },
      { id: "mf-2", name: "Nippon India Small Cap Fund", type: "Equity", provider: "Nippon", amount: 1000, status: "Monthly payment", place: "Phonepe" },
    ],
    leases: [
      { name: "Pugal", amount: 700000 },
      { name: "Nirmala", amount: 700000 },
      { name: "Sheeba", amount: 1920000 },
    ],
    monthlyCredit: 215000,
    goldRate22ct: 13000,
  };
}
