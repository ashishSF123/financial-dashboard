import type { Currency, NumberFormat } from "./finance-types";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export function formatCurrency(
  amount: number,
  currency: Currency = "INR",
  numberFormat: NumberFormat = "indian"
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (currency === "INR" && numberFormat === "indian") {
    if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${sign}${symbol}${(abs / 100000).toFixed(1)} L`;
    if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}K`;
    return `${sign}${symbol}${Math.round(abs).toLocaleString("en-IN")}`;
  }

  if (abs >= 1000000000) return `${sign}${symbol}${(abs / 1000000000).toFixed(2)}B`;
  if (abs >= 1000000) return `${sign}${symbol}${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}${symbol}${(abs / 1000).toFixed(1)}K`;
  return `${sign}${symbol}${Math.round(abs).toLocaleString("en-US")}`;
}

export function getCurrencySymbol(currency: Currency = "INR"): string {
  return CURRENCY_SYMBOLS[currency];
}
