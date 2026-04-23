/**
 * Demo-data generator — pure function that produces ~500 realistic,
 * currency-scaled `Transaction` rows spread over the last 12 months for a
 * single user.
 *
 * Algorithm (Decision 2 of `.features/demo-data/03-plan.md`):
 *   1. Window is `[now - 365d, now]`.
 *   2. Emit 1–2 salary-scale "starter" incomes at day 0 so early expenses
 *      don't starve the running balance.
 *   3. For each of 12 monthly cycles: schedule one salary near the 25th
 *      (jitter ±3d) plus 0–2 of {Freelance, Gift, Investment} at weighted
 *      probabilities.
 *   4. Schedule expense candidates on a per-category cadence (weekly / 2×wk
 *      / 3×wk / monthly / sparse). Each candidate's timestamp is jittered
 *      inside its cadence window.
 *   5. Sort candidates by timestamp ascending. Walk the list accumulating
 *      `runningBalance`. Always accept income. For each expense, if accepting
 *      would drive the balance below zero, SKIP it (do not shrink — shrinking
 *      distorts the distribution).
 *   6. Return the accepted list sorted by timestamp ascending.
 *
 * Balance-positive invariant: the returned list, replayed in chronological
 * order, never drives the running balance below zero. This is a hard
 * guarantee: tests assert `runningBalance >= 0` at every step.
 *
 * Caveat: the balance-positive constraint only governs the generated demo
 * data. If a user's real (non-demo) rows already drive balance negative,
 * this generator is not responsible for them — callers compose accordingly.
 *
 * Purity: no I/O, no auth, no Next imports. Given a seeded `rng`, the output
 * is deterministic — relied on by `tests/demoData.generator.test.ts`.
 */

import type { Transaction } from "@/lib/db";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type ExpenseCategory,
  type IncomeCategory,
} from "@/lib/categories";

import { createRng, type Rng } from "./rng";
import { getScaleForCurrency, type AmountRange, type CurrencyScale } from "./scales";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type GenerateDemoTransactionsInput = {
  /** The user the generated rows are attributed to. */
  userId: string;
  /** The user's currency code; passed through `getScaleForCurrency`. */
  currency: string;
  /** End of the 12-month window. Defaults to `new Date()`. */
  now?: Date;
  /** RNG source. Defaults to a non-deterministic `createRng()`. */
  rng?: Rng;
  /** Approximate target row count. Defaults to 500. */
  target?: number;
};

const DEFAULT_TARGET = 500;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 365;
const MONTHS_IN_WINDOW = 12;

/**
 * Currencies with no minor unit — amounts are rounded to whole integers.
 * Matches ISO-4217 exponent 0 for the currencies we support.
 */
const ZERO_DECIMAL_CURRENCIES = new Set(["HUF", "JPY"]);

export function generateDemoTransactions(
  input: GenerateDemoTransactionsInput,
): Transaction[] {
  const {
    userId,
    currency,
    now = new Date(),
    rng = createRng(),
    target = DEFAULT_TARGET,
  } = input;

  const scale = getScaleForCurrency(currency);
  const amountRounder = buildAmountRounder(currency);
  const windowEnd = now.getTime();
  const windowStart = windowEnd - WINDOW_DAYS * ONE_DAY_MS;

  const candidates: Transaction[] = [];

  // Step 2 — seed starter income on day 0.
  scheduleStarterIncome(candidates, {
    userId,
    windowStart,
    rng,
    scale,
    amountRounder,
  });

  // Step 3 — per-month salary + 0–2 supplemental incomes.
  for (let monthIndex = 0; monthIndex < MONTHS_IN_WINDOW; monthIndex++) {
    scheduleMonthlyIncomes(candidates, {
      userId,
      monthIndex,
      windowStart,
      windowEnd,
      rng,
      scale,
      amountRounder,
    });
  }

  // Step 4 — expense candidates on per-category cadences. The count is
  // approximately `target * 1.5` to give the balance-guard room to skip
  // infeasible candidates without starving the final count.
  scheduleExpenseCandidates(candidates, {
    userId,
    windowStart,
    windowEnd,
    rng,
    scale,
    amountRounder,
    target,
  });

  // Step 5 — sort chronologically, then walk with a balance guard.
  candidates.sort(byTimestampAsc);

  // Safety cap: the pre-scheduled pool is already bounded (~580 candidates
  // for default target=500), but we cap at 3× target to honour the plan's
  // "max-attempts" guardrail against pathological future schedule tweaks.
  const maxAttempts = target * 3;
  const accepted: Transaction[] = [];
  let runningBalance = 0;
  let attempts = 0;
  for (const tx of candidates) {
    if (accepted.length >= target) break;
    if (attempts >= maxAttempts) break;
    attempts++;
    if (tx.kind === "income") {
      runningBalance += tx.amount;
      accepted.push(tx);
      continue;
    }
    // Expense — skip if it would break the non-negative invariant.
    if (runningBalance - tx.amount < 0) continue;
    runningBalance -= tx.amount;
    accepted.push(tx);
  }

  // Already sorted by timestamp because candidates were sorted and we pushed
  // in order.
  return accepted;
}

// ---------------------------------------------------------------------------
// Scheduling helpers
// ---------------------------------------------------------------------------

interface IncomeContext {
  userId: string;
  windowStart: number;
  rng: Rng;
  scale: CurrencyScale;
  amountRounder: (n: number) => number;
}

interface MonthlyIncomeContext extends IncomeContext {
  monthIndex: number;
  windowEnd: number;
}

interface ExpenseContext {
  userId: string;
  windowStart: number;
  windowEnd: number;
  rng: Rng;
  scale: CurrencyScale;
  amountRounder: (n: number) => number;
  target: number;
}

/**
 * Emit 1–2 salary-scale incomes at the very start of the window. Ensures the
 * running balance has enough cushion to absorb the first few weeks of
 * expenses without the guard skipping nearly everything.
 */
function scheduleStarterIncome(
  out: Transaction[],
  ctx: IncomeContext,
): void {
  const { userId, windowStart, rng, scale, amountRounder } = ctx;
  const count = rng.nextInt(1, 2);
  for (let i = 0; i < count; i++) {
    // Stagger starter incomes within the first day to keep timestamps unique.
    const ts = windowStart + i * 60 * 1000;
    out.push(
      makeIncomeTransaction({
        userId,
        category: "Salary",
        timestamp: new Date(ts).toISOString(),
        scale,
        rng,
        amountRounder,
        titleOverride: "Starter balance",
      }),
    );
  }
}

/**
 * Emit one salary + 0–2 supplemental incomes (Freelance / Gift / Investment)
 * inside the given month.
 */
function scheduleMonthlyIncomes(
  out: Transaction[],
  ctx: MonthlyIncomeContext,
): void {
  const { userId, monthIndex, windowStart, windowEnd, rng, scale, amountRounder } = ctx;
  const monthAnchor = windowStart + monthIndex * 30 * ONE_DAY_MS;
  // Salary around day ~25 of the month, ±3d jitter.
  const salaryDayOffset = 25 + rng.nextInt(-3, 3);
  const salaryTs = clamp(
    monthAnchor + salaryDayOffset * ONE_DAY_MS + rng.nextInt(0, ONE_DAY_MS - 1),
    windowStart,
    windowEnd,
  );
  out.push(
    makeIncomeTransaction({
      userId,
      category: "Salary",
      timestamp: new Date(salaryTs).toISOString(),
      scale,
      rng,
      amountRounder,
    }),
  );

  // Supplemental incomes — weighted probabilities per plan.
  const supplementalCandidates: Array<{
    category: IncomeCategory;
    probability: number;
  }> = [
    { category: "Freelance", probability: 0.45 },
    { category: "Gift", probability: 0.25 },
    { category: "Investment", probability: 0.3 },
  ];

  let emittedSupplemental = 0;
  for (const { category, probability } of supplementalCandidates) {
    if (emittedSupplemental >= 2) break;
    if (!rng.chance(probability)) continue;
    const dayInMonth = rng.nextInt(0, 29);
    const ts = clamp(
      monthAnchor + dayInMonth * ONE_DAY_MS + rng.nextInt(0, ONE_DAY_MS - 1),
      windowStart,
      windowEnd,
    );
    out.push(
      makeIncomeTransaction({
        userId,
        category,
        timestamp: new Date(ts).toISOString(),
        scale,
        rng,
        amountRounder,
      }),
    );
    emittedSupplemental++;
  }
}

/**
 * Schedule expense candidates on a per-category cadence. We deliberately
 * generate slightly more than `target` to give the balance-guard room to
 * skip infeasible rows without starving the final accepted count.
 */
function scheduleExpenseCandidates(
  out: Transaction[],
  ctx: ExpenseContext,
): void {
  const { userId, windowStart, windowEnd, rng, scale, amountRounder } = ctx;

  // (category, cadence-in-days). The generator walks the window in steps of
  // `cadenceDays` and emits one candidate per step with a timestamp jittered
  // inside the step. Totals across categories over a 365d window:
  //   Groceries 73 (5d) + Dining 146 (2.5d) + Transport 183 (2d) +
  //   Entertainment 52 (7d) + Utilities 12 (30d) + Rent 12 (30d) +
  //   Healthcare ~12 (30d) + Other ~52 (7d)  ≈ 542 base expenses.
  // Combined with ~14–38 incomes (2 starter + 12 salary + up to 24 extras)
  // this gives the balance-guard room to skip infeasible rows without
  // starving the final accepted count against a 500 target.
  const cadences: Array<{ category: ExpenseCategory; cadenceDays: number }> = [
    { category: "Groceries", cadenceDays: 5 },
    { category: "Dining", cadenceDays: 2.5 },
    { category: "Transport", cadenceDays: 2 },
    { category: "Entertainment", cadenceDays: 7 },
    { category: "Utilities", cadenceDays: 30 },
    { category: "Rent", cadenceDays: 30 },
    { category: "Healthcare", cadenceDays: 30 },
    { category: "Other", cadenceDays: 7 },
  ];

  for (const { category, cadenceDays } of cadences) {
    scheduleOnCadence(out, {
      userId,
      category,
      cadenceDays,
      windowStart,
      windowEnd,
      rng,
      scale,
      amountRounder,
    });
  }
}

interface CadenceContext {
  userId: string;
  category: ExpenseCategory;
  cadenceDays: number;
  windowStart: number;
  windowEnd: number;
  rng: Rng;
  scale: CurrencyScale;
  amountRounder: (n: number) => number;
}

/**
 * Walk the window in steps of `cadenceDays` and emit one candidate per step,
 * with a timestamp jittered uniformly inside the step.
 */
function scheduleOnCadence(out: Transaction[], ctx: CadenceContext): void {
  const { userId, category, cadenceDays, windowStart, windowEnd, rng, scale, amountRounder } = ctx;
  const stepMs = cadenceDays * ONE_DAY_MS;
  let stepStart = windowStart;
  while (stepStart < windowEnd) {
    const stepEnd = Math.min(stepStart + stepMs, windowEnd);
    const ts = clamp(
      stepStart + Math.floor(rng.nextFloat(0, stepEnd - stepStart)),
      windowStart,
      windowEnd,
    );
    out.push(
      makeExpenseTransaction({
        userId,
        category,
        timestamp: new Date(ts).toISOString(),
        scale,
        rng,
        amountRounder,
      }),
    );
    stepStart += stepMs;
  }
}

// ---------------------------------------------------------------------------
// Transaction construction
// ---------------------------------------------------------------------------

// RNG-backed id generator so that a seeded `rng` produces deterministic ids.
// nanoid() uses a non-seeded CSPRNG, which would break the determinism guarantee.
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
function makeId(rng: Rng): string {
  let id = "";
  for (let i = 0; i < 12; i++) {
    id += ID_ALPHABET[rng.nextInt(0, ID_ALPHABET.length - 1)];
  }
  return id;
}

interface IncomeFactoryInput {
  userId: string;
  category: IncomeCategory;
  timestamp: string;
  scale: CurrencyScale;
  rng: Rng;
  amountRounder: (n: number) => number;
  titleOverride?: string;
}

function makeIncomeTransaction(input: IncomeFactoryInput): Transaction {
  const { userId, category, timestamp, scale, rng, amountRounder, titleOverride } = input;
  const range = scale.income[category];
  const amount = amountRounder(sampleInRange(rng, range));
  return {
    id: makeId(rng),
    userId,
    kind: "income",
    amount,
    title: titleOverride ?? pickTitle(rng, INCOME_TITLES[category]),
    timestamp,
    category,
    source: "demo",
    deletedAt: null,
  };
}

interface ExpenseFactoryInput {
  userId: string;
  category: ExpenseCategory;
  timestamp: string;
  scale: CurrencyScale;
  rng: Rng;
  amountRounder: (n: number) => number;
}

function makeExpenseTransaction(input: ExpenseFactoryInput): Transaction {
  const { userId, category, timestamp, scale, rng, amountRounder } = input;
  const range = scale.expense[category];
  const amount = amountRounder(sampleInRange(rng, range));
  return {
    id: makeId(rng),
    userId,
    kind: "expense",
    amount,
    title: pickTitle(rng, EXPENSE_TITLES[category]),
    timestamp,
    category,
    source: "demo",
    deletedAt: null,
  };
}

function sampleInRange(rng: Rng, range: AmountRange): number {
  const { min, max } = range;
  if (min >= max) return min;
  return rng.nextFloat(min, max);
}

// ---------------------------------------------------------------------------
// Title variety
// ---------------------------------------------------------------------------

const EXPENSE_TITLES: Record<ExpenseCategory, readonly string[]> = {
  Groceries: [
    "Supermarket run",
    "Weekly groceries",
    "Local market",
    "Corner store",
    "Bulk shopping",
  ],
  Dining: [
    "Lunch with friends",
    "Coffee shop",
    "Takeaway dinner",
    "Brunch",
    "Restaurant bill",
    "Pizza night",
  ],
  Transport: [
    "Bus ticket",
    "Taxi ride",
    "Metro pass",
    "Train ticket",
    "Fuel",
    "Parking fee",
  ],
  Entertainment: [
    "Movie ticket",
    "Concert tickets",
    "Streaming subscription",
    "Video game",
    "Book purchase",
    "Museum entry",
  ],
  Utilities: [
    "Electricity bill",
    "Internet bill",
    "Water bill",
    "Gas bill",
    "Phone bill",
  ],
  Rent: ["Monthly rent"],
  Healthcare: [
    "Pharmacy",
    "Doctor visit",
    "Dentist appointment",
    "Prescription refill",
    "Health insurance copay",
  ],
  Other: [
    "Household supplies",
    "Gift purchase",
    "Clothing",
    "Repair service",
    "Subscription",
    "Miscellaneous",
  ],
};

const INCOME_TITLES: Record<IncomeCategory, readonly string[]> = {
  Salary: ["Monthly salary", "Payroll deposit"],
  Freelance: [
    "Freelance project",
    "Consulting fee",
    "Side gig payment",
    "Contract work",
  ],
  Investment: [
    "Dividend payment",
    "Interest earned",
    "Investment return",
    "Capital gains",
  ],
  Gift: ["Birthday gift", "Holiday gift", "Gift from family"],
  Other: ["Refund", "Reimbursement", "Occasional sale", "Cashback"],
};

function pickTitle(rng: Rng, titles: readonly string[]): string {
  return rng.pick(titles);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Build a rounder that snaps amounts to the currency's minor-unit precision.
 * Zero-decimal currencies (HUF, JPY) get integer amounts; everything else
 * gets two decimals. This keeps generated data visually realistic.
 */
function buildAmountRounder(currency: string): (n: number) => number {
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return (n) => Math.max(0.01, Math.round(n));
  }
  return (n) => {
    const rounded = Math.round(n * 100) / 100;
    // TransactionSchema requires amount > 0; guard against rounding to zero.
    return rounded <= 0 ? 0.01 : rounded;
  };
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function byTimestampAsc(a: Transaction, b: Transaction): number {
  if (a.timestamp < b.timestamp) return -1;
  if (a.timestamp > b.timestamp) return 1;
  return 0;
}

// Re-export category tuples so downstream tests can reason about coverage
// without re-importing from `@/lib/categories`. These are intentionally only
// the ones the generator actively uses.
export const DEMO_EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
export const DEMO_INCOME_CATEGORIES = INCOME_CATEGORIES;
