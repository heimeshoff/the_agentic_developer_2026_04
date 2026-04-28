import { describe, it, expect } from "vitest";

import {
  generateDemoTransactions,
  DEMO_EXPENSE_CATEGORIES,
} from "@/lib/demoData/generator";
import { createRng } from "@/lib/demoData/rng";
import type { Transaction } from "@/lib/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 365;
const DEFAULT_TARGET = 500;

/** Fixed date used by all deterministic tests. Matches project "today". */
const FIXED_NOW = new Date("2026-04-23T12:00:00.000Z");

/**
 * Convenience: call the generator with a deterministic seed and the fixed
 * `now`. Each call produces a fresh RNG stream so two calls with the same
 * seed should produce identical output.
 */
function generate(overrides: {
  seed?: number;
  currency?: string;
  userId?: string;
  target?: number;
  now?: Date;
} = {}): Transaction[] {
  const {
    seed = 42,
    currency = "EUR",
    userId = "user-1",
    target,
    now = FIXED_NOW,
  } = overrides;
  return generateDemoTransactions({
    userId,
    currency,
    now,
    rng: createRng(seed),
    ...(target === undefined ? {} : { target }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("generateDemoTransactions — count and shape", () => {
  it("produces a plausible row count near the default target (500 +/- 10%)", () => {
    const rows = generate();
    // Generator aims for ~500 with skip-on-guard; allow a generous tolerance
    // to avoid flakiness across seeds while still catching regressions.
    expect(rows.length).toBeGreaterThanOrEqual(450);
    expect(rows.length).toBeLessThanOrEqual(550);
  });

  it("marks every row with source: 'demo'", () => {
    const rows = generate();
    expect(rows.every((t) => t.source === "demo")).toBe(true);
  });

  it("attributes every row to the caller's userId", () => {
    const rows = generate({ userId: "caller-xyz" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((t) => t.userId === "caller-xyz")).toBe(true);
  });

  it("produces only strictly positive amounts", () => {
    const rows = generate();
    expect(rows.every((t) => t.amount > 0)).toBe(true);
  });

  it("emits timestamps within [now - 365d, now]", () => {
    const rows = generate();
    const end = FIXED_NOW.getTime();
    const start = end - WINDOW_DAYS * ONE_DAY_MS;
    for (const tx of rows) {
      const ts = new Date(tx.timestamp).getTime();
      expect(Number.isFinite(ts)).toBe(true);
      expect(ts).toBeGreaterThanOrEqual(start);
      expect(ts).toBeLessThanOrEqual(end);
    }
  });

  it("returns rows already sorted by timestamp ascending", () => {
    const rows = generate();
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].timestamp <= rows[i].timestamp).toBe(true);
    }
  });
});

describe("generateDemoTransactions — balance invariant (critical)", () => {
  it("never drives the running balance below zero when replayed chronologically", () => {
    const rows = generate();
    let runningBalance = 0;
    for (const tx of rows) {
      if (tx.kind === "income") {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      // THE critical assertion: balance stays non-negative at every step.
      expect(runningBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it("holds the invariant across multiple distinct seeds", () => {
    for (const seed of [1, 7, 123, 2026, 99999]) {
      const rows = generate({ seed });
      let runningBalance = 0;
      for (const tx of rows) {
        if (tx.kind === "income") runningBalance += tx.amount;
        else runningBalance -= tx.amount;
        expect(runningBalance).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("generateDemoTransactions — category coverage", () => {
  it("covers every expense category and at least Salary income", () => {
    const rows = generate();
    const expenseCategories = new Set(
      rows.filter((t) => t.kind === "expense").map((t) => t.category),
    );
    const incomeCategories = new Set(
      rows.filter((t) => t.kind === "income").map((t) => t.category),
    );

    for (const category of DEMO_EXPENSE_CATEGORIES) {
      expect(expenseCategories.has(category)).toBe(true);
    }
    // Salary is scheduled monthly, so it must always appear.
    expect(incomeCategories.has("Salary")).toBe(true);
  });
});

describe("generateDemoTransactions — currency scaling", () => {
  it("scales EUR salary into the thousands", () => {
    const rows = generate({ currency: "EUR" });
    const salaries = rows.filter(
      (t) => t.kind === "income" && t.category === "Salary",
    );
    expect(salaries.length).toBeGreaterThan(0);
    for (const s of salaries) {
      // EUR Salary range is 2000..5000 — firmly in the thousands.
      expect(s.amount).toBeGreaterThanOrEqual(1000);
      expect(s.amount).toBeLessThan(10_000);
    }
  });

  it("scales HUF salary into hundreds-of-thousands and keeps integer amounts", () => {
    const rows = generate({ currency: "HUF" });
    const salaries = rows.filter(
      (t) => t.kind === "income" && t.category === "Salary",
    );
    expect(salaries.length).toBeGreaterThan(0);
    for (const s of salaries) {
      // HUF Salary range is 400_000..900_000.
      expect(s.amount).toBeGreaterThanOrEqual(100_000);
      expect(s.amount).toBeLessThan(1_000_000);
      expect(Number.isInteger(s.amount)).toBe(true);
    }
  });
});

describe("generateDemoTransactions — zero-decimal currencies", () => {
  it("produces only integer amounts when currency is HUF", () => {
    const rows = generate({ currency: "HUF" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((t) => Number.isInteger(t.amount))).toBe(true);
  });

  it("produces only integer amounts when currency is JPY", () => {
    const rows = generate({ currency: "JPY" });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((t) => Number.isInteger(t.amount))).toBe(true);
  });
});

describe("generateDemoTransactions — determinism", () => {
  it("produces identical content for two calls with the same seed", () => {
    const a = generate({ seed: 42 });
    const b = generate({ seed: 42 });

    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("produces different arrays for two different seeds", () => {
    const a = generate({ seed: 1 });
    const b = generate({ seed: 2 });
    // Sanity check — not a strict contract, but the probability of identical
    // outputs across two seeds is effectively zero.
    const signatureA = a.map((t) => `${t.timestamp}|${t.amount}|${t.category}`).join("\n");
    const signatureB = b.map((t) => `${t.timestamp}|${t.amount}|${t.category}`).join("\n");
    expect(signatureA).not.toBe(signatureB);
  });
});

describe("generateDemoTransactions — skip ratio / target convergence", () => {
  it("hits the target row count closely under the balance guard (>= 90% of target)", () => {
    // With a realistic starter income + monthly salaries, the balance guard
    // should almost never skip. Soft assertion: we accept at least 90% of
    // the target. This also transitively bounds the skip ratio since the
    // pre-scheduled pool is ~1.15x target.
    const target = DEFAULT_TARGET;
    const rows = generate({ target });
    const ratio = rows.length / target;
    expect(ratio).toBeGreaterThanOrEqual(0.9);
    expect(ratio).toBeLessThanOrEqual(1.1);
  });
});
