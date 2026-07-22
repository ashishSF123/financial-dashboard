// AI Financial Insights Engine
// Rule-based intelligence that analyzes financial data and produces actionable insights

import type { DailyExpense, InvestmentHolding, BudgetLimit, InsurancePolicy, AdditionalLoan } from "./finance-types";

export interface Insight {
  id: string;
  title: string;
  description: string;
  type: "critical" | "warning" | "opportunity" | "info";
  metric?: string;
  section: "expenses" | "investments" | "debt" | "insurance" | "overall";
}

// --- EXPENSE INSIGHTS ---

export function computeExpenseInsights(
  expenses: DailyExpense[],
  budgets: BudgetLimit[],
  month: string
): Insight[] {
  const insights: Insight[] = [];
  if (expenses.length === 0) return insights;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const daysElapsed = Math.min(new Date().getDate(), 30);
  const dailyAvg = total / Math.max(daysElapsed, 1);
  const projectedMonthly = dailyAvg * 30;

  // Spending velocity
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  if (totalBudget > 0 && projectedMonthly > totalBudget) {
    const overBy = Math.round(((projectedMonthly - totalBudget) / totalBudget) * 100);
    insights.push({
      id: "exp-velocity",
      title: "Spending Velocity Alert",
      description: `At current pace, projected monthly spend is ${formatINR(projectedMonthly)} — ${overBy}% above your allocated budget of ${formatINR(totalBudget)}.`,
      type: "warning",
      metric: `${overBy}% over`,
      section: "expenses",
    });
  }

  // Category anomaly detection (compare to average)
  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  const catAvg = total / Object.keys(byCategory).length;
  const topCat = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
  if (topCat && topCat[1] > catAvg * 2.5) {
    insights.push({
      id: "exp-anomaly",
      title: `High ${topCat[0]} Spending`,
      description: `${topCat[0]} accounts for ${formatINR(topCat[1])} (${Math.round((topCat[1] / total) * 100)}% of total) — significantly above average category spend of ${formatINR(catAvg)}.`,
      type: "warning",
      metric: `${Math.round((topCat[1] / total) * 100)}%`,
      section: "expenses",
    });
  }

  // Weekend vs weekday pattern
  const weekendSpend = expenses.filter((e) => { const d = new Date(e.date).getDay(); return d === 0 || d === 6; }).reduce((s, e) => s + e.amount, 0);
  const weekdaySpend = total - weekendSpend;
  const weekendDays = expenses.filter((e) => { const d = new Date(e.date).getDay(); return d === 0 || d === 6; }).length;
  const weekdayDays = expenses.length - weekendDays;
  if (weekendDays > 0 && weekdayDays > 0) {
    const weekendAvgPerTxn = weekendSpend / weekendDays;
    const weekdayAvgPerTxn = weekdaySpend / weekdayDays;
    if (weekendAvgPerTxn > weekdayAvgPerTxn * 1.8) {
      insights.push({
        id: "exp-weekend",
        title: "Weekend Spending Pattern",
        description: `Weekend transactions average ${formatINR(weekendAvgPerTxn)} vs ${formatINR(weekdayAvgPerTxn)} on weekdays — ${((weekendAvgPerTxn / weekdayAvgPerTxn - 1) * 100).toFixed(0)}% higher. Consider setting a weekend spending cap.`,
        type: "info",
        metric: `${((weekendAvgPerTxn / weekdayAvgPerTxn - 1) * 100).toFixed(0)}% higher`,
        section: "expenses",
      });
    }
  }

  // Payment method optimization
  const byMethod: Record<string, number> = {};
  expenses.forEach((e) => { byMethod[e.paymentMethod] = (byMethod[e.paymentMethod] || 0) + e.amount; });
  const upiSpend = byMethod["UPI"] || 0;
  if (upiSpend > total * 0.7 && total > 5000) {
    insights.push({
      id: "exp-payment",
      title: "Payment Optimization",
      description: `${Math.round((upiSpend / total) * 100)}% of spending is via UPI. Using a rewards credit card could earn 1-2% cashback = ${formatINR(Math.round(upiSpend * 0.015))}/month in savings.`,
      type: "opportunity",
      metric: `${formatINR(Math.round(upiSpend * 0.015))}/mo`,
      section: "expenses",
    });
  }

  // Daily average insight
  if (daysElapsed >= 7) {
    insights.push({
      id: "exp-daily",
      title: "Daily Spending Rate",
      description: `Averaging ${formatINR(dailyAvg)}/day across ${expenses.length} transactions. Monthly projection: ${formatINR(projectedMonthly)}.`,
      type: "info",
      metric: `${formatINR(dailyAvg)}/day`,
      section: "expenses",
    });
  }

  return insights;
}

// --- INVESTMENT INSIGHTS ---

export function computeInvestmentInsights(holdings: InvestmentHolding[]): Insight[] {
  const insights: Insight[] = [];
  if (holdings.length === 0) return insights;

  const totalInvested = holdings.reduce((s, h) => s + h.investedAmount, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalGain = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Overall return assessment
  const INFLATION = 6;
  const realReturn = returnPct - INFLATION;
  if (totalInvested > 0) {
    insights.push({
      id: "inv-return",
      title: "Real Return Analysis",
      description: `Portfolio return: ${returnPct.toFixed(1)}% nominal. After ${INFLATION}% inflation, real return is ${realReturn.toFixed(1)}%. ${realReturn < 0 ? "Your money is losing purchasing power." : "Your wealth is growing in real terms."}`,
      type: realReturn < 0 ? "warning" : realReturn > 5 ? "opportunity" : "info",
      metric: `${realReturn.toFixed(1)}% real`,
      section: "investments",
    });
  }

  // Diversification score
  const byType: Record<string, number> = {};
  holdings.forEach((h) => { byType[h.type] = (byType[h.type] || 0) + h.currentValue; });
  const typeCount = Object.keys(byType).length;
  const maxConcentration = Math.max(...Object.values(byType)) / totalCurrent;
  const diversificationScore = Math.min(100, Math.round((typeCount / 5) * 50 + (1 - maxConcentration) * 50));

  insights.push({
    id: "inv-diversify",
    title: "Portfolio Diversification",
    description: `Diversification score: ${diversificationScore}/100. ${typeCount} asset types. ${maxConcentration > 0.6 ? `Concentration risk: ${Math.round(maxConcentration * 100)}% in a single asset class.` : "Well distributed across asset classes."}`,
    type: maxConcentration > 0.7 ? "warning" : diversificationScore > 60 ? "opportunity" : "info",
    metric: `${diversificationScore}/100`,
    section: "investments",
  });

  // Underperforming holdings
  const underperformers = holdings.filter((h) => {
    if (h.investedAmount === 0) return false;
    const ret = ((h.currentValue - h.investedAmount) / h.investedAmount) * 100;
    return ret < 0;
  });
  if (underperformers.length > 0) {
    const worstLoss = underperformers.reduce((worst, h) => {
      const loss = h.investedAmount - h.currentValue;
      return loss > worst.loss ? { name: h.name, loss } : worst;
    }, { name: "", loss: 0 });
    insights.push({
      id: "inv-underperform",
      title: "Underperforming Holdings",
      description: `${underperformers.length} holding${underperformers.length > 1 ? "s" : ""} in negative returns. "${worstLoss.name}" is down ${formatINR(worstLoss.loss)}. Review if fundamentals still hold or consider rebalancing.`,
      type: "warning",
      metric: `${underperformers.length} loss-making`,
      section: "investments",
    });
  }

  // Asset allocation vs ideal (equity 60%, debt 30%, gold 10%)
  const equity = (byType["mutual_fund"] || 0) + (byType["stock"] || 0);
  const debt = (byType["fd"] || 0) + (byType["rd"] || 0) + (byType["ppf"] || 0) + (byType["epf"] || 0) + (byType["nps"] || 0);
  const gold = (byType["gold_physical"] || 0) + (byType["gold_sgb"] || 0) + (byType["gold_digital"] || 0);
  const equityPct = totalCurrent > 0 ? (equity / totalCurrent) * 100 : 0;
  const debtPct = totalCurrent > 0 ? (debt / totalCurrent) * 100 : 0;
  if (totalCurrent > 0) {
    insights.push({
      id: "inv-allocation",
      title: "Asset Allocation Review",
      description: `Current mix: Equity ${equityPct.toFixed(0)}% | Debt ${debtPct.toFixed(0)}% | Others ${(100 - equityPct - debtPct).toFixed(0)}%. Recommended for growth: 60% equity, 30% debt, 10% alternatives. ${equityPct < 40 ? "Consider increasing equity allocation for higher long-term returns." : ""}`,
      type: "info",
      metric: `E:${equityPct.toFixed(0)} D:${debtPct.toFixed(0)}`,
      section: "investments",
    });
  }

  // SIP power insight
  const sipHoldings = holdings.filter((h) => h.frequency === "Monthly");
  if (sipHoldings.length > 0) {
    const monthlySIP = sipHoldings.reduce((s, h) => s + (h.investedAmount / 12), 0); // rough estimate
    const futureValue = monthlySIP * ((Math.pow(1 + 0.12 / 12, 120) - 1) / (0.12 / 12)); // 10yr@12%
    insights.push({
      id: "inv-sip",
      title: "SIP Compounding Power",
      description: `${sipHoldings.length} active SIPs. Continuing these for 10 years at 12% avg return could grow to approximately ${formatINR(futureValue)}. Consistency is key — never stop SIPs in market dips.`,
      type: "opportunity",
      metric: `${formatINR(futureValue)} in 10yr`,
      section: "investments",
    });
  }

  return insights;
}

// --- DEBT INSIGHTS ---

export function computeDebtInsights(
  goldLoans: { principalAmount: number; roiPct: number; monthlyInterest: number; vendor: string }[],
  houseLoans: { loanAmount: number; interestRate: number; emiAmount: number; remainingMonths: number; bank: string }[],
  borrowed: { amount: number; roi: number; monthlyInterest: number }[],
  additionalLoans: AdditionalLoan[],
  monthlyIncome: number
): Insight[] {
  const insights: Insight[] = [];

  const totalDebt = goldLoans.reduce((s, g) => s + g.principalAmount, 0) +
    houseLoans.reduce((s, h) => s + h.loanAmount, 0) +
    borrowed.reduce((s, b) => s + b.amount, 0) +
    additionalLoans.reduce((s, l) => s + l.outstandingBalance, 0);

  const totalMonthlyInterest = goldLoans.reduce((s, g) => s + g.monthlyInterest, 0) +
    borrowed.reduce((s, b) => s + b.monthlyInterest, 0);
  const totalEMI = houseLoans.reduce((s, h) => s + h.emiAmount, 0) +
    additionalLoans.reduce((s, l) => s + l.emiAmount, 0);
  const totalMonthlyOutflow = totalMonthlyInterest + totalEMI;

  if (totalDebt === 0) return insights;

  // Daily interest cost
  const dailyInterest = (totalMonthlyInterest + houseLoans.reduce((s, h) => s + h.loanAmount * h.interestRate / 100 / 365, 0)) ;
  insights.push({
    id: "debt-daily-cost",
    title: "Daily Interest Cost",
    description: `You're paying approximately ${formatINR(Math.round(dailyInterest))} per day in interest across all loans. That's ${formatINR(Math.round(dailyInterest * 365))}/year going to lenders instead of your wealth.`,
    type: "critical",
    metric: `${formatINR(Math.round(dailyInterest))}/day`,
    section: "debt",
  });

  // Debt-to-income ratio
  if (monthlyIncome > 0) {
    const dti = (totalMonthlyOutflow / monthlyIncome) * 100;
    const status = dti > 50 ? "critical" : dti > 35 ? "warning" : "info";
    insights.push({
      id: "debt-dti",
      title: "Debt-to-Income Ratio",
      description: `${dti.toFixed(0)}% of monthly income goes to debt servicing (${formatINR(totalMonthlyOutflow)} of ${formatINR(monthlyIncome)}). ${dti > 50 ? "CRITICAL: Above 50% is financially dangerous." : dti > 35 ? "Elevated — aim to bring below 35%." : "Within healthy range (below 35%)."}`,
      type: status,
      metric: `${dti.toFixed(0)}% DTI`,
      section: "debt",
    });
  }

  // Credit card danger
  const creditCards = additionalLoans.filter((l) => l.type === "credit_card" && l.outstandingBalance > 0);
  if (creditCards.length > 0) {
    const ccTotal = creditCards.reduce((s, c) => s + c.outstandingBalance, 0);
    const ccInterest = ccTotal * 0.36 / 12; // typical 36% p.a.
    insights.push({
      id: "debt-cc-danger",
      title: "Credit Card Outstanding",
      description: `${formatINR(ccTotal)} in credit card debt at ~36% p.a. costs ${formatINR(Math.round(ccInterest))}/month in interest alone. Pay more than minimum due — or convert to lower-rate personal loan.`,
      type: "critical",
      metric: `${formatINR(Math.round(ccInterest))}/mo interest`,
      section: "debt",
    });
  }

  // Highest rate opportunity
  const allRates = [
    ...goldLoans.map((g) => ({ name: g.vendor + " Gold", rate: g.roiPct })),
    ...houseLoans.map((h) => ({ name: h.bank + " Home", rate: h.interestRate })),
    ...additionalLoans.map((l) => ({ name: l.name, rate: l.interestRate })),
  ].sort((a, b) => b.rate - a.rate);
  if (allRates.length >= 2 && allRates[0].rate - allRates[allRates.length - 1].rate > 5) {
    insights.push({
      id: "debt-refinance",
      title: "Refinancing Opportunity",
      description: `Rate spread of ${(allRates[0].rate - allRates[allRates.length - 1].rate).toFixed(1)}% between your loans. "${allRates[0].name}" at ${allRates[0].rate}% may be eligible for refinancing at a lower rate — potential savings of thousands per year.`,
      type: "opportunity",
      metric: `${allRates[0].rate}% spread`,
      section: "debt",
    });
  }

  // Payoff timeline
  if (totalMonthlyOutflow > 0 && totalDebt > 0) {
    const months = Math.ceil(totalDebt / totalMonthlyOutflow);
    const years = (months / 12).toFixed(1);
    insights.push({
      id: "debt-timeline",
      title: "Debt Freedom Timeline",
      description: `At current repayment rate of ${formatINR(totalMonthlyOutflow)}/month, estimated ${years} years to be debt-free (simplified). Extra payments can significantly shorten this.`,
      type: "info",
      metric: `~${years} years`,
      section: "debt",
    });
  }

  return insights;
}

// --- INSURANCE INSIGHTS ---

export function computeInsuranceInsights(
  policies: InsurancePolicy[],
  monthlyIncome: number
): Insight[] {
  const insights: Insight[] = [];

  const activePolicies = policies.filter((p) => p.status === "active");
  const totalCoverage = activePolicies.reduce((s, p) => s + p.sumAssured, 0);
  const totalPremium = activePolicies.reduce((s, p) => s + p.premium, 0);
  const annualIncome = monthlyIncome * 12;

  // Coverage adequacy (life should be 10-15x income)
  const termPolicies = activePolicies.filter((p) => p.type === "term");
  const termCoverage = termPolicies.reduce((s, p) => s + p.sumAssured, 0);
  if (annualIncome > 0) {
    const coverMultiple = termCoverage / annualIncome;
    if (termPolicies.length === 0) {
      insights.push({
        id: "ins-no-term",
        title: "No Life Insurance",
        description: `No term life insurance found. Financial experts recommend 10-15x annual income (${formatINR(annualIncome * 10)} - ${formatINR(annualIncome * 15)}) in life cover to protect dependents.`,
        type: "critical",
        section: "insurance",
      });
    } else if (coverMultiple < 10) {
      insights.push({
        id: "ins-undercover",
        title: "Insufficient Life Cover",
        description: `Term coverage is ${coverMultiple.toFixed(1)}x annual income (${formatINR(termCoverage)}). Recommended: 10-15x = ${formatINR(annualIncome * 10)}. Consider increasing cover by ${formatINR(annualIncome * 10 - termCoverage)}.`,
        type: "warning",
        metric: `${coverMultiple.toFixed(1)}x income`,
        section: "insurance",
      });
    } else {
      insights.push({
        id: "ins-adequate",
        title: "Life Cover Adequate",
        description: `Term coverage at ${coverMultiple.toFixed(1)}x annual income (${formatINR(termCoverage)}). This is within the recommended 10-15x range.`,
        type: "opportunity",
        metric: `${coverMultiple.toFixed(1)}x income`,
        section: "insurance",
      });
    }
  }

  // Health insurance check
  const healthPolicies = activePolicies.filter((p) => p.type === "health");
  if (healthPolicies.length === 0) {
    insights.push({
      id: "ins-no-health",
      title: "No Health Insurance",
      description: "No health insurance policy found. A medical emergency can cost Rs 5-15 lakhs. Health insurance is non-negotiable — get at least Rs 10L family floater cover.",
      type: "critical",
      section: "insurance",
    });
  } else {
    const healthCover = healthPolicies.reduce((s, p) => s + p.sumAssured, 0);
    if (healthCover < 500000) {
      insights.push({
        id: "ins-low-health",
        title: "Low Health Coverage",
        description: `Health cover of ${formatINR(healthCover)} may be insufficient. With medical inflation at 14%, a single hospitalization can exceed this. Consider a super top-up to boost to Rs 25-50L.`,
        type: "warning",
        metric: formatINR(healthCover),
        section: "insurance",
      });
    }
  }

  // Premium-to-income ratio
  if (annualIncome > 0 && totalPremium > 0) {
    const premiumRatio = (totalPremium / annualIncome) * 100;
    insights.push({
      id: "ins-premium-ratio",
      title: "Premium Affordability",
      description: `Spending ${premiumRatio.toFixed(1)}% of annual income on insurance premiums (${formatINR(totalPremium)}/year). ${premiumRatio > 10 ? "Consider if all policies are necessary." : premiumRatio < 3 ? "You may be under-insured." : "Within recommended 5-10% range."}`,
      type: premiumRatio > 15 ? "warning" : "info",
      metric: `${premiumRatio.toFixed(1)}% of income`,
      section: "insurance",
    });
  }

  // Upcoming renewals
  const now = new Date();
  const upcoming = activePolicies.filter((p) => {
    if (!p.nextDueDate) return false;
    const diff = (new Date(p.nextDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  });
  if (upcoming.length > 0) {
    insights.push({
      id: "ins-renewal",
      title: "Renewal Due Soon",
      description: `${upcoming.length} polic${upcoming.length > 1 ? "ies" : "y"} due for renewal within 30 days: ${upcoming.map((p) => p.name).join(", ")}. Lapsing insurance means losing coverage — set a reminder.`,
      type: "warning",
      metric: `${upcoming.length} due`,
      section: "insurance",
    });
  }

  return insights;
}

// --- HELPER ---
function formatINR(n: number): string {
  if (n >= 10000000) return `Rs ${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(1)}K`;
  return `Rs ${n.toLocaleString("en-IN")}`;
}
