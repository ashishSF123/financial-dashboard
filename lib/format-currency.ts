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

// Canonical INR formatter — use this everywhere instead of local copies
export function formatINR(value: number): string {
  if (value === 0) return "₹0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}
