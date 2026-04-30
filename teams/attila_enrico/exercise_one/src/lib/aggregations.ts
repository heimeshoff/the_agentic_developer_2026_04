import type { Transaction } from "@/lib/db";

export type RangePreset =
  | "this-month"
  | "last-3-months"
  | "this-year"
  | "all"
  | "custom";

export interface DateRange {
  from: string;
  to: string;
}

export interface MonthlyBucket {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

/**
 * Returns the `YYYY-MM-DD` (UTC) prefix of a transaction's `timestamp`.
 * `Transaction.timestamp` is an ISO 8601 string (e.g. `"2026-04-23T08:30:00.000Z"`),
 * so a length-10 slice yields a comparable calendar-day key without parsing.
 */
function isoDay(timestamp: string): string {
  return timestamp.slice(0, 10);
}

/**
 * Returns the `YYYY-MM` (UTC) prefix of a transaction's `timestamp`.
 */
function isoMonth(timestamp: string): string {
  return timestamp.slice(0, 7);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatYmd(year: number, month1to12: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${pad2(month1to12)}-${pad2(day)}`;
}

/**
 * Inclusive on both ends. `from`/`to` are ISO `YYYY-MM-DD` strings; either may
 * be undefined to leave that side open. Comparison is lexicographic on the
 * day-prefix, which is correct for ISO 8601 strings.
 */
export function inRange(tx: Transaction, from?: string, to?: string): boolean {
  const day = isoDay(tx.timestamp);
  if (from !== undefined && day < from) return false;
  if (to !== undefined && day > to) return false;
  return true;
}

/**
 * Buckets transactions by `YYYY-MM` (UTC), summing `income` and `expense`
 * separately. Output is sorted ascending by month. Months without any
 * transaction are omitted (no gap densification in v1).
 */
export function bucketByMonth(txs: Transaction[]): MonthlyBucket[] {
  const map = new Map<string, MonthlyBucket>();
  for (const tx of txs) {
    const month = isoMonth(tx.timestamp);
    const bucket = map.get(month) ?? { month, income: 0, expense: 0 };
    if (tx.kind === "income") {
      bucket.income += tx.amount;
    } else {
      bucket.expense += tx.amount;
    }
    map.set(month, bucket);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Sums `amount` per `category` for transactions of the requested `kind`.
 * Output is sorted descending by `total`; ties keep insertion order.
 */
export function groupByCategory(
  txs: Transaction[],
  kind: "expense" | "income",
): CategoryTotal[] {
  const map = new Map<string, number>();
  for (const tx of txs) {
    if (tx.kind !== kind) continue;
    map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
  }
  return Array.from(map, ([category, total]) => ({ category, total })).sort(
    (a, b) => b.total - a.total,
  );
}

/**
 * Resolves a preset to an inclusive `[from, to]` ISO `YYYY-MM-DD` range.
 *
 * `today` is injected (never `new Date()` here) so callers can render
 * deterministically and tests can pin a clock. Boundaries are computed in
 * UTC to match the rest of the module's day/month derivation.
 *
 * - `this-month`: first day of `today`'s month → last day of that month.
 * - `last-3-months`: first day of the month two months before `today` →
 *   last day of `today`'s month (a 3-calendar-month window inclusive of the
 *   current month).
 * - `this-year`: Jan 1 → Dec 31 of `today`'s year.
 * - `all`: `0000-01-01` → `9999-12-31` (lexicographic sentinels matching
 *   the comparison strategy in `inRange`).
 * - `custom`: throws — the caller supplies the dates.
 */
export function resolvePresetRange(
  preset: RangePreset,
  today: Date,
): DateRange {
  if (preset === "all") {
    return { from: "0000-01-01", to: "9999-12-31" };
  }
  if (preset === "custom") {
    throw new Error(
      "resolvePresetRange: 'custom' must not be resolved here; the caller supplies from/to.",
    );
  }
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth(); // 0-based
  if (preset === "this-month") {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return {
      from: formatYmd(year, month + 1, 1),
      to: formatYmd(year, month + 1, lastDay),
    };
  }
  if (preset === "last-3-months") {
    const startMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const startYear = startMonthDate.getUTCFullYear();
    const startMonth = startMonthDate.getUTCMonth(); // 0-based
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return {
      from: formatYmd(startYear, startMonth + 1, 1),
      to: formatYmd(year, month + 1, lastDay),
    };
  }
  // this-year
  return {
    from: formatYmd(year, 1, 1),
    to: formatYmd(year, 12, 31),
  };
}
