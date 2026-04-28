/**
 * Per-currency x per-category amount-range lookup used by the demo-data
 * generator.
 *
 * Each entry describes sensible `{min, max}` bounds (inclusive) for a single
 * category in a single currency. The generator samples a uniform amount in
 * that range (possibly with cents / two decimals applied).
 *
 * Invariant: `min <= max`, both non-negative, both finite. This is enforced
 * at type-authoring time by careful hand-written values; there is no runtime
 * validation here because the module is pure data.
 *
 * Categories come from `src/lib/categories.ts`:
 *   - Expense: "Groceries" | "Utilities" | "Rent" | "Transport" |
 *              "Dining" | "Entertainment" | "Healthcare" | "Other"
 *   - Income:  "Salary" | "Freelance" | "Investment" | "Gift" | "Other"
 *
 * Currencies come from `src/lib/currencies.ts`:
 *   EUR, USD, GBP, HUF, CHF, JPY, CAD, AUD, NOK, SEK, DKK, PLN, CZK
 *
 * Currencies not listed here fall back to `DEFAULT_SCALE` via
 * `getScaleForCurrency`.
 */

import type { ExpenseCategory, IncomeCategory } from "@/lib/categories";
import type { Currency } from "@/lib/currencies";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AmountRange {
  min: number;
  max: number;
}

export type ExpenseScale = Record<ExpenseCategory, AmountRange>;
export type IncomeScale = Record<IncomeCategory, AmountRange>;

export interface CurrencyScale {
  income: IncomeScale;
  expense: ExpenseScale;
}

// ---------------------------------------------------------------------------
// Scale templates
// ---------------------------------------------------------------------------

/**
 * EUR-family scale — "thousands for salary, tens/hundreds for expenses".
 * Reused verbatim by USD / GBP / CHF / CAD / AUD (all broadly comparable
 * in day-to-day cost-of-living terms for a demo dataset).
 */
const EUR_LIKE_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 2000, max: 5000 },
    Freelance: { min: 200, max: 2500 },
    Investment: { min: 50, max: 1500 },
    Gift: { min: 20, max: 500 },
    Other: { min: 20, max: 1000 },
  },
  expense: {
    Rent: { min: 800, max: 2000 },
    Groceries: { min: 30, max: 150 },
    Dining: { min: 10, max: 80 },
    Utilities: { min: 40, max: 200 },
    Transport: { min: 5, max: 30 },
    Entertainment: { min: 10, max: 100 },
    Healthcare: { min: 20, max: 300 },
    Other: { min: 5, max: 200 },
  },
};

/**
 * HUF — hundreds-of-thousands-scale. Roughly EUR * ~390 but hand-tuned so
 * rent / groceries / dining feel locally realistic rather than mathematically
 * derived.
 */
const HUF_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 400_000, max: 900_000 },
    Freelance: { min: 50_000, max: 500_000 },
    Investment: { min: 10_000, max: 300_000 },
    Gift: { min: 5_000, max: 100_000 },
    Other: { min: 5_000, max: 200_000 },
  },
  expense: {
    Rent: { min: 150_000, max: 400_000 },
    Groceries: { min: 5_000, max: 25_000 },
    Dining: { min: 2_000, max: 15_000 },
    Utilities: { min: 10_000, max: 60_000 },
    Transport: { min: 500, max: 5_000 },
    Entertainment: { min: 2_000, max: 25_000 },
    Healthcare: { min: 3_000, max: 80_000 },
    Other: { min: 1_000, max: 50_000 },
  },
};

/**
 * JPY — yen-scale. Similar digit-count to HUF but tuned to Japanese
 * cost-of-living feel (higher rent, slightly lower groceries ratio).
 * JPY typically has zero fractional digits in real use; the generator
 * can floor these if it wants integer amounts.
 */
const JPY_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 250_000, max: 500_000 },
    Freelance: { min: 30_000, max: 300_000 },
    Investment: { min: 5_000, max: 200_000 },
    Gift: { min: 3_000, max: 50_000 },
    Other: { min: 3_000, max: 100_000 },
  },
  expense: {
    Rent: { min: 80_000, max: 200_000 },
    Groceries: { min: 3_000, max: 15_000 },
    Dining: { min: 1_000, max: 8_000 },
    Utilities: { min: 5_000, max: 25_000 },
    Transport: { min: 500, max: 3_000 },
    Entertainment: { min: 1_000, max: 10_000 },
    Healthcare: { min: 2_000, max: 30_000 },
    Other: { min: 500, max: 20_000 },
  },
};

/**
 * Nordic scale — NOK / SEK / DKK. Roughly EUR * ~11 (NOK/SEK) or * ~7.5 (DKK).
 * For a demo dataset we use a unified "nordic" table: tens-of-thousands for
 * salary, hundreds-to-low-thousands for daily expenses.
 */
const NORDIC_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 25_000, max: 55_000 },
    Freelance: { min: 2_500, max: 25_000 },
    Investment: { min: 500, max: 15_000 },
    Gift: { min: 200, max: 5_000 },
    Other: { min: 200, max: 10_000 },
  },
  expense: {
    Rent: { min: 9_000, max: 22_000 },
    Groceries: { min: 350, max: 1_700 },
    Dining: { min: 120, max: 900 },
    Utilities: { min: 450, max: 2_200 },
    Transport: { min: 50, max: 350 },
    Entertainment: { min: 120, max: 1_100 },
    Healthcare: { min: 200, max: 3_200 },
    Other: { min: 50, max: 2_200 },
  },
};

/**
 * PLN — Polish zloty, roughly EUR * ~4.3. Hundreds-to-thousands scale for
 * salary, tens-to-hundreds for daily expenses.
 */
const PLN_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 8_000, max: 20_000 },
    Freelance: { min: 1_000, max: 10_000 },
    Investment: { min: 200, max: 6_000 },
    Gift: { min: 80, max: 2_000 },
    Other: { min: 80, max: 4_000 },
  },
  expense: {
    Rent: { min: 3_000, max: 8_000 },
    Groceries: { min: 120, max: 600 },
    Dining: { min: 40, max: 320 },
    Utilities: { min: 160, max: 800 },
    Transport: { min: 20, max: 120 },
    Entertainment: { min: 40, max: 400 },
    Healthcare: { min: 80, max: 1_200 },
    Other: { min: 20, max: 800 },
  },
};

/**
 * CZK — Czech koruna, roughly EUR * ~25. Tens-of-thousands for salary,
 * hundreds-to-low-thousands for daily expenses.
 */
const CZK_SCALE: CurrencyScale = {
  income: {
    Salary: { min: 45_000, max: 120_000 },
    Freelance: { min: 5_000, max: 60_000 },
    Investment: { min: 1_000, max: 35_000 },
    Gift: { min: 500, max: 12_000 },
    Other: { min: 500, max: 25_000 },
  },
  expense: {
    Rent: { min: 18_000, max: 48_000 },
    Groceries: { min: 700, max: 3_500 },
    Dining: { min: 250, max: 2_000 },
    Utilities: { min: 1_000, max: 5_000 },
    Transport: { min: 120, max: 700 },
    Entertainment: { min: 250, max: 2_500 },
    Healthcare: { min: 500, max: 7_500 },
    Other: { min: 120, max: 5_000 },
  },
};

// ---------------------------------------------------------------------------
// Public lookup table
// ---------------------------------------------------------------------------

/**
 * Per-currency scale table. Keyed by currency code from
 * `SUPPORTED_CURRENCIES`. Every supported currency has an entry.
 */
export const CURRENCY_SCALES: Record<Currency, CurrencyScale> = {
  EUR: EUR_LIKE_SCALE,
  USD: EUR_LIKE_SCALE,
  GBP: EUR_LIKE_SCALE,
  CHF: EUR_LIKE_SCALE,
  CAD: EUR_LIKE_SCALE,
  AUD: EUR_LIKE_SCALE,
  HUF: HUF_SCALE,
  JPY: JPY_SCALE,
  NOK: NORDIC_SCALE,
  SEK: NORDIC_SCALE,
  DKK: NORDIC_SCALE,
  PLN: PLN_SCALE,
  CZK: CZK_SCALE,
};

/**
 * Fallback scale used when a currency code is not present in
 * `CURRENCY_SCALES`. Intentionally identical to the EUR-family table so
 * unknown-but-western currencies degrade gracefully for a demo dataset.
 */
export const DEFAULT_SCALE: CurrencyScale = EUR_LIKE_SCALE;

/**
 * Look up the scale for a currency code.
 *
 * Returns the matching entry from `CURRENCY_SCALES`, or `DEFAULT_SCALE`
 * for unknown codes. Emits a `console.warn` for unknown codes so the
 * demo-data generator surfaces missing coverage during development.
 */
export function getScaleForCurrency(code: string): CurrencyScale {
  const entry = (CURRENCY_SCALES as Record<string, CurrencyScale | undefined>)[code];
  if (entry !== undefined) {
    return entry;
  }
  // eslint-disable-next-line no-console
  console.warn(
    `[demoData/scales] No scale for currency "${code}"; falling back to DEFAULT_SCALE.`,
  );
  return DEFAULT_SCALE;
}
