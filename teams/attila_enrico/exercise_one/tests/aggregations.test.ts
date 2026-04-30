import { describe, it, expect } from "vitest";

import {
  inRange,
  bucketByMonth,
  groupByCategory,
  resolvePresetRange,
} from "@/lib/aggregations";
import type { Transaction } from "@/lib/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a `Transaction` with sensible defaults; override only what each test
 * actually needs to assert. No I/O, no faker — pure in-memory fixtures.
 */
function mkTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: overrides.id ?? "tx-1",
    userId: overrides.userId ?? "user-1",
    kind: overrides.kind ?? "expense",
    amount: overrides.amount ?? 10,
    title: overrides.title ?? "Test tx",
    timestamp: overrides.timestamp ?? "2026-04-15T12:00:00.000Z",
    category: overrides.category ?? "Groceries",
    source: overrides.source ?? "user",
    ...(overrides.deletedAt !== undefined ? { deletedAt: overrides.deletedAt } : {}),
  };
}

// ---------------------------------------------------------------------------
// inRange
// ---------------------------------------------------------------------------

describe("inRange", () => {
  it("returns true when both bounds are undefined (always-in)", () => {
    const tx = mkTx({ timestamp: "2020-01-01T00:00:00.000Z" });
    expect(inRange(tx)).toBe(true);
  });

  it("includes the exact lower bound day (inclusive lower)", () => {
    const tx = mkTx({ timestamp: "2026-04-15T00:00:00.000Z" });
    expect(inRange(tx, "2026-04-15", "2026-04-30")).toBe(true);
  });

  it("includes the exact upper bound day (inclusive upper)", () => {
    const tx = mkTx({ timestamp: "2026-04-30T23:59:59.999Z" });
    expect(inRange(tx, "2026-04-01", "2026-04-30")).toBe(true);
  });

  it("matches a timestamp later in the day on the boundary day", () => {
    // from = 2026-04-15; ts at 08:00 on the 15th is still in.
    const tx = mkTx({ timestamp: "2026-04-15T08:00:00Z" });
    expect(inRange(tx, "2026-04-15", "2026-04-30")).toBe(true);
  });

  it("treats only `from` as an open-ended upper bound", () => {
    const txIn = mkTx({ timestamp: "2099-12-31T00:00:00.000Z" });
    const txBefore = mkTx({ timestamp: "2026-04-14T23:59:59.999Z" });
    expect(inRange(txIn, "2026-04-15", undefined)).toBe(true);
    expect(inRange(txBefore, "2026-04-15", undefined)).toBe(false);
  });

  it("treats only `to` as an open-ended lower bound", () => {
    const txIn = mkTx({ timestamp: "1900-01-01T00:00:00.000Z" });
    const txAfter = mkTx({ timestamp: "2026-05-01T00:00:00.000Z" });
    expect(inRange(txIn, undefined, "2026-04-30")).toBe(true);
    expect(inRange(txAfter, undefined, "2026-04-30")).toBe(false);
  });

  it("excludes a day strictly before `from` and strictly after `to`", () => {
    const before = mkTx({ timestamp: "2026-04-14T23:59:59.999Z" });
    const after = mkTx({ timestamp: "2026-05-01T00:00:00.000Z" });
    expect(inRange(before, "2026-04-15", "2026-04-30")).toBe(false);
    expect(inRange(after, "2026-04-15", "2026-04-30")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// bucketByMonth
// ---------------------------------------------------------------------------

describe("bucketByMonth", () => {
  it("returns [] for an empty input array", () => {
    expect(bucketByMonth([])).toEqual([]);
  });

  it("sums incomes and expenses separately within a single month", () => {
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 10, timestamp: "2026-04-02T00:00:00Z" }),
      mkTx({ id: "b", kind: "expense", amount: 25, timestamp: "2026-04-15T00:00:00Z" }),
      mkTx({ id: "c", kind: "income", amount: 1000, timestamp: "2026-04-20T00:00:00Z", category: "Salary" }),
      mkTx({ id: "d", kind: "income", amount: 50, timestamp: "2026-04-28T00:00:00Z", category: "Salary" }),
    ];
    const result = bucketByMonth(txs);
    expect(result).toEqual([
      { month: "2026-04", income: 1050, expense: 35 },
    ]);
  });

  it("sorts multi-month output ascending by `YYYY-MM`", () => {
    // Insertion order intentionally jumbled to confirm the sort.
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 10, timestamp: "2026-06-10T00:00:00Z" }),
      mkTx({ id: "b", kind: "income", amount: 100, timestamp: "2026-01-05T00:00:00Z", category: "Salary" }),
      mkTx({ id: "c", kind: "expense", amount: 20, timestamp: "2026-03-20T00:00:00Z" }),
    ];
    const result = bucketByMonth(txs);
    expect(result.map((b) => b.month)).toEqual(["2026-01", "2026-03", "2026-06"]);
  });

  it("does NOT densify months with no transactions (gaps are omitted)", () => {
    // Jan + April populated, Feb + March intentionally empty.
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 10, timestamp: "2026-01-15T00:00:00Z" }),
      mkTx({ id: "b", kind: "expense", amount: 20, timestamp: "2026-04-15T00:00:00Z" }),
    ];
    const result = bucketByMonth(txs);
    expect(result.map((b) => b.month)).toEqual(["2026-01", "2026-04"]);
  });

  it("shows 0 on the missing kind for income-only and expense-only months", () => {
    const txs: Transaction[] = [
      // March: income only
      mkTx({ id: "a", kind: "income", amount: 500, timestamp: "2026-03-01T00:00:00Z", category: "Salary" }),
      // April: expense only
      mkTx({ id: "b", kind: "expense", amount: 30, timestamp: "2026-04-01T00:00:00Z" }),
    ];
    const result = bucketByMonth(txs);
    expect(result).toEqual([
      { month: "2026-03", income: 500, expense: 0 },
      { month: "2026-04", income: 0, expense: 30 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// groupByCategory
// ---------------------------------------------------------------------------

describe("groupByCategory", () => {
  it("returns [] for an empty input array", () => {
    expect(groupByCategory([], "expense")).toEqual([]);
    expect(groupByCategory([], "income")).toEqual([]);
  });

  it("ignores rows of the other kind when filtering for `expense`", () => {
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 10, category: "Groceries" }),
      mkTx({ id: "b", kind: "income", amount: 9999, category: "Salary" }),
      mkTx({ id: "c", kind: "expense", amount: 5, category: "Groceries" }),
    ];
    expect(groupByCategory(txs, "expense")).toEqual([
      { category: "Groceries", total: 15 },
    ]);
  });

  it("ignores rows of the other kind when filtering for `income`", () => {
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 10, category: "Groceries" }),
      mkTx({ id: "b", kind: "income", amount: 1000, category: "Salary" }),
      mkTx({ id: "c", kind: "income", amount: 200, category: "Occasional sell" }),
    ];
    expect(groupByCategory(txs, "income")).toEqual([
      { category: "Salary", total: 1000 },
      { category: "Occasional sell", total: 200 },
    ]);
  });

  it("sorts results descending by `total`", () => {
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 5, category: "Coffee" }),
      mkTx({ id: "b", kind: "expense", amount: 100, category: "Rent" }),
      mkTx({ id: "c", kind: "expense", amount: 30, category: "Groceries" }),
    ];
    expect(groupByCategory(txs, "expense")).toEqual([
      { category: "Rent", total: 100 },
      { category: "Groceries", total: 30 },
      { category: "Coffee", total: 5 },
    ]);
  });

  it("retains insertion order for ties (stable sort)", () => {
    // Three categories all tied at 50; first-seen wins.
    const txs: Transaction[] = [
      mkTx({ id: "a", kind: "expense", amount: 50, category: "Alpha" }),
      mkTx({ id: "b", kind: "expense", amount: 50, category: "Bravo" }),
      mkTx({ id: "c", kind: "expense", amount: 50, category: "Charlie" }),
    ];
    expect(groupByCategory(txs, "expense").map((c) => c.category)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
  });
});

// ---------------------------------------------------------------------------
// resolvePresetRange
// ---------------------------------------------------------------------------

describe("resolvePresetRange", () => {
  // Pin the clock to April 28, 2026 (month index 3 in JS Date).
  const today = new Date(Date.UTC(2026, 3, 28));

  it("`this-month` resolves to the first→last day of today's month", () => {
    expect(resolvePresetRange("this-month", today)).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    });
  });

  it("`last-3-months` resolves to first day two months back → last day of today's month", () => {
    // Per JSDoc: a 3-calendar-month window inclusive of the current month.
    // today = April → window is Feb 1 .. April 30.
    expect(resolvePresetRange("last-3-months", today)).toEqual({
      from: "2026-02-01",
      to: "2026-04-30",
    });
  });

  it("`this-year` resolves to Jan 1 → Dec 31 of today's year", () => {
    expect(resolvePresetRange("this-year", today)).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("`all` resolves to far-past → far-future sentinels", () => {
    expect(resolvePresetRange("all", today)).toEqual({
      from: "0000-01-01",
      to: "9999-12-31",
    });
  });

  it("`custom` throws — caller is expected to supply from/to directly", () => {
    expect(() => resolvePresetRange("custom", today)).toThrow();
  });

  it("February in a leap year ends on Feb 29 (`this-month`, 2024)", () => {
    const feb15Leap = new Date(Date.UTC(2024, 1, 15));
    expect(resolvePresetRange("this-month", feb15Leap)).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
  });

  it("February in a non-leap year ends on Feb 28 (`this-month`, 2026)", () => {
    const feb15NonLeap = new Date(Date.UTC(2026, 1, 15));
    expect(resolvePresetRange("this-month", feb15NonLeap)).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});
