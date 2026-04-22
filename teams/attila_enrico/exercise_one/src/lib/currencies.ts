export const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "GBP", "HUF", "CHF", "JPY", "CAD",
  "AUD", "NOK", "SEK", "DKK", "PLN", "CZK",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export function isValidCurrency(code: string): code is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
