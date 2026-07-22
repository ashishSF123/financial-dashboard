import type { UserProfile, IncomeTier, FinancialGoal } from "./finance-types";
import { formatCurrency } from "./format-currency";

export interface AdvisorAction {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: "high" | "medium" | "low";
  category: "debt" | "savings" | "investment" | "expense" | "insurance" | "income";
  icon: string;
}

export interface FinancialSummary {
  greeting: string;
  oneLiner: string;
  healthScore: number;
  plainEnglish: string;
  weeklyTip: string;
  priorityAction: AdvisorAction;
  actions: AdvisorAction[];
}

interface DataContext {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  monthlyDebtPayment: number;
  totalInvestments: number;
  emergencyFundMonths: number;
  savingsRate: number;
  highestDebtRate: number;
  unusedSubscriptions: number;
  insuranceCoverage: number;
}

const WEEKLY_TIPS_BY_TIER: Record<IncomeTier, string[]> = {
  low: [
    "Track every expense today — even ₹10 matters when building habits.",
    "Set up auto-transfer of even 5% of income to savings the day salary arrives.",
    "Review if any subscription can be replaced with a free alternative.",
    "Cook one more meal at home this week — save that eating-out money.",
    "Check if you qualify for any government savings schemes (PPF, SSY).",
  ],
  mid: [
    "Redirect next bonus/increment entirely to debt repayment or investments.",
    "Review your insurance coverage — is it keeping pace with your income growth?",
    "Set up a SIP with the amount you'd normally spend on impulse purchases.",
    "Transfer your emergency fund to a high-yield savings account or liquid fund.",
    "Review tax-saving investments — maximize 80C before the deadline.",
  ],
  high: [
    "Review your asset allocation — are you diversified across geography and asset classes?",
    "Consider tax-loss harvesting on underperforming investments.",
    "Evaluate if your insurance coverage matches your lifestyle (10x annual income).",
    "Look into REITs or fractional real estate for passive income diversification.",
    "Review your estate plan — nominees updated? Will in place?",
  ],
};

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name}`;
}

function computeHealthScore(ctx: DataContext): number {
  let score = 50;
  if (ctx.savingsRate >= 30) score += 15;
  else if (ctx.savingsRate >= 20) score += 10;
  else if (ctx.savingsRate >= 10) score += 5;
  else if (ctx.savingsRate < 0) score -= 15;

  if (ctx.emergencyFundMonths >= 6) score += 15;
  else if (ctx.emergencyFundMonths >= 3) score += 10;
  else if (ctx.emergencyFundMonths >= 1) score += 5;
  else score -= 10;

  const dti = ctx.monthlyIncome > 0 ? (ctx.monthlyDebtPayment / ctx.monthlyIncome) * 100 : 0;
  if (dti === 0) score += 15;
  else if (dti < 30) score += 10;
  else if (dti < 50) score += 0;
  else score -= 15;

  if (ctx.totalInvestments > ctx.monthlyIncome * 12) score += 5;
  return Math.max(0, Math.min(100, score));
}

function generatePlainEnglish(profile: UserProfile, ctx: DataContext): string {
  const fmt = (n: number) => formatCurrency(n, profile.currency, profile.numberFormat);
  const surplus = ctx.monthlyIncome - ctx.monthlyExpenses;
  const savingsRate = ctx.monthlyIncome > 0 ? Math.round((surplus / ctx.monthlyIncome) * 100) : 0;

  let summary = `This month you earned ${fmt(ctx.monthlyIncome)} and spent ${fmt(ctx.monthlyExpenses)}. `;

  if (savingsRate > 0) {
    summary += `Your savings rate is ${savingsRate}%`;
    if (savingsRate >= 30) summary += " (excellent — you're ahead of most people). ";
    else if (savingsRate >= 20) summary += " (good — aim for 30% to accelerate wealth). ";
    else summary += " (let's work on improving this). ";
  } else {
    summary += `You're spending more than you earn — this needs immediate attention. `;
  }

  if (ctx.totalDebt > 0) {
    const debtYears = ctx.monthlyDebtPayment > 0 ? Math.round(ctx.totalDebt / ctx.monthlyDebtPayment / 12) : 99;
    summary += `You have ${fmt(ctx.totalDebt)} in debt`;
    if (ctx.highestDebtRate > 15) {
      summary += ` with some loans at ${ctx.highestDebtRate.toFixed(0)}% interest — prioritize closing these high-rate debts first.`;
    } else {
      summary += ` — at current pace, you'll be debt-free in ~${debtYears} years.`;
    }
  } else {
    summary += "You're debt-free — excellent position to focus on wealth building.";
  }

  return summary;
}

function generateActions(profile: UserProfile, ctx: DataContext): AdvisorAction[] {
  const actions: AdvisorAction[] = [];
  const fmt = (n: number) => formatCurrency(n, profile.currency, profile.numberFormat);

  // High-interest debt
  if (ctx.highestDebtRate > 12 && ctx.totalDebt > 0) {
    const monthlyInterestCost = Math.round(ctx.totalDebt * (ctx.highestDebtRate / 100) / 12);
    actions.push({
      id: "debt-priority",
      title: "Attack High-Interest Debt",
      description: `You're paying ~${fmt(monthlyInterestCost)}/mo in interest on your highest-rate loan (${ctx.highestDebtRate.toFixed(1)}%). Every extra payment here saves you money.`,
      impact: `Save ${fmt(monthlyInterestCost * 3)} over next 3 months`,
      priority: "high",
      category: "debt",
      icon: "🎯",
    });
  }

  // Emergency fund
  if (ctx.emergencyFundMonths < 3) {
    const target = ctx.monthlyExpenses * 3;
    const current = ctx.emergencyFundMonths * ctx.monthlyExpenses;
    actions.push({
      id: "emergency-fund",
      title: "Build Emergency Fund",
      description: `You have ${ctx.emergencyFundMonths.toFixed(1)} months of expenses saved. Aim for 3 months (${fmt(target)}).`,
      impact: `Need ${fmt(target - current)} more`,
      priority: ctx.emergencyFundMonths < 1 ? "high" : "medium",
      category: "savings",
      icon: "🛡️",
    });
  }

  // Savings rate
  if (ctx.savingsRate < 20 && ctx.monthlyIncome > 0) {
    const targetSaving = Math.round(ctx.monthlyIncome * 0.2);
    const currentSaving = Math.round(ctx.monthlyIncome * ctx.savingsRate / 100);
    actions.push({
      id: "savings-rate",
      title: "Increase Savings Rate",
      description: `Currently saving ${ctx.savingsRate.toFixed(0)}% of income. The 20% rule suggests saving ${fmt(targetSaving)}/mo.`,
      impact: `+${fmt(targetSaving - currentSaving)}/mo to invest`,
      priority: ctx.savingsRate < 10 ? "high" : "medium",
      category: "savings",
      icon: "💰",
    });
  }

  // Unused subscriptions
  if (ctx.unusedSubscriptions > 0) {
    actions.push({
      id: "subscriptions",
      title: "Cancel Unused Subscriptions",
      description: `${ctx.unusedSubscriptions} subscription${ctx.unusedSubscriptions > 1 ? "s" : ""} haven't been used in 30+ days.`,
      impact: "Potential monthly savings",
      priority: "low",
      category: "expense",
      icon: "🔄",
    });
  }

  // Investment for high-income
  if (profile.incomeTier === "high" && ctx.totalInvestments < ctx.monthlyIncome * 24) {
    actions.push({
      id: "invest-more",
      title: "Diversify Investments",
      description: "Your investment corpus is below 2 years of income. Consider diversifying across equity, debt, and alternative assets.",
      impact: "Long-term wealth compounding",
      priority: "medium",
      category: "investment",
      icon: "📈",
    });
  }

  // Insurance gap
  if (ctx.insuranceCoverage < ctx.monthlyIncome * 120) {
    actions.push({
      id: "insurance-gap",
      title: "Review Life Insurance",
      description: `Recommended cover: 10x annual income (${fmt(ctx.monthlyIncome * 120)}). Ensure your family is protected.`,
      impact: "Financial security for dependents",
      priority: "medium",
      category: "insurance",
      icon: "🛡️",
    });
  }

  return actions.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

export function computeAdvisorSummary(
  profile: UserProfile,
  ctx: DataContext
): FinancialSummary {
  const healthScore = computeHealthScore(ctx);
  const actions = generateActions(profile, ctx);
  const tips = WEEKLY_TIPS_BY_TIER[profile.incomeTier];
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % tips.length;

  const oneLiner = healthScore >= 75
    ? "Your finances are strong. Keep the momentum going."
    : healthScore >= 50
    ? "You're on the right track. A few adjustments can accelerate your progress."
    : "Let's focus on stabilizing your finances. Small steps lead to big changes.";

  return {
    greeting: getGreeting(profile.name),
    oneLiner,
    healthScore,
    plainEnglish: generatePlainEnglish(profile, ctx),
    weeklyTip: tips[weekIndex],
    priorityAction: actions[0] || { id: "none", title: "All Good!", description: "No urgent actions needed. Keep doing what you're doing.", impact: "Maintain consistency", priority: "low", category: "savings", icon: "✨" },
    actions,
  };
}
