import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

// AUTH_SECRET needed because lib/transactions.ts imports lib/auth.ts transitively (for FieldErrors type).
// Even though we don't exercise auth here, the module-load guard must pass.
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "a".repeat(48);

let tmpDir: string;
let tmpPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tx-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  tmpPath = path.join(tmpDir, "db.json");
  process.env.DB_PATH = tmpPath;
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("transactions flow", () => {
  it("adds a valid expense for a user", async () => {
    const { addTransactionForUser } = await import("@/lib/transactions");
    const result = await addTransactionForUser("user-1", {
      kind: "expense",
      amount: "42.10",
      title: "Groceries run",
      timestamp: "2026-04-21T10:00",
      category: "Groceries",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects amount <= 0", async () => {
    const { addTransactionForUser } = await import("@/lib/transactions");
    const result = await addTransactionForUser("user-1", {
      kind: "expense",
      amount: "0",
      title: "Nope",
      timestamp: "2026-04-21T10:00",
      category: "Groceries",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBeDefined();
  });

  it("rejects a title longer than 120 chars", async () => {
    const { addTransactionForUser } = await import("@/lib/transactions");
    const result = await addTransactionForUser("user-1", {
      kind: "expense",
      amount: "10",
      title: "x".repeat(121),
      timestamp: "2026-04-21T10:00",
      category: "Groceries",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeDefined();
  });

  it("rejects a category that does not belong to the kind", async () => {
    const { addTransactionForUser } = await import("@/lib/transactions");
    const result = await addTransactionForUser("user-1", {
      kind: "expense",
      amount: "10",
      title: "Ok",
      timestamp: "2026-04-21T10:00",
      category: "Salary",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.category).toBeDefined();
  });

  it("normalizes datetime-local input to an ISO timestamp", async () => {
    const { addTransactionForUser } = await import("@/lib/transactions");
    const result = await addTransactionForUser("user-1", {
      kind: "income",
      amount: "1000",
      title: "Salary",
      timestamp: "2026-04-21T10:00",
      category: "Salary",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.transaction.timestamp).toMatch(/^2026-04-21T/);
  });
});
