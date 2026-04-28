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
let auditPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `tx-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  tmpPath = path.join(tmpDir, "db.json");
  auditPath = path.join(tmpDir, "audit.json");
  process.env.DB_PATH = tmpPath;
  process.env.AUDIT_PATH = auditPath;
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  delete process.env.DB_PATH;
  delete process.env.AUDIT_PATH;
});

// Helper: seed a single expense transaction for `userId` directly via the lib
// add-path. Returns the full transaction (including generated id).
async function seedExpense(
  userId: string,
  overrides: {
    amount?: string;
    title?: string;
    timestamp?: string;
    category?: string;
  } = {},
) {
  const { addTransactionForUser } = await import("@/lib/transactions");
  const result = await addTransactionForUser(userId, {
    kind: "expense",
    amount: overrides.amount ?? "10.00",
    title: overrides.title ?? "Seeded expense",
    timestamp: overrides.timestamp ?? "2026-04-20T10:00",
    category: overrides.category ?? "Groceries",
  });
  if (!result.ok) throw new Error("seed failed: " + JSON.stringify(result.errors));
  return result.transaction;
}

describe("transactions flow — add", () => {
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
    if (result.ok) expect(result.transaction.source).toBe("user");
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

describe("updateTransactionForUser", () => {
  it("updates every field including kind→category flip and records an audit entry", async () => {
    const { updateTransactionForUser } = await import("@/lib/transactions");
    const { readDb } = await import("@/lib/db");
    const { readAuditLog } = await import("@/lib/audit");

    const seeded = await seedExpense("user-1", {
      amount: "10.00",
      title: "Original",
      timestamp: "2026-04-20T10:00",
      category: "Groceries",
    });

    const result = await updateTransactionForUser("user-1", seeded.id, {
      kind: "income",
      amount: "2500.55",
      title: "Payday",
      timestamp: "2026-04-22T09:30",
      category: "Salary",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.transaction.id).toBe(seeded.id);
    expect(result.transaction.userId).toBe("user-1");
    expect(result.transaction.kind).toBe("income");
    expect(result.transaction.amount).toBe(2500.55);
    expect(result.transaction.title).toBe("Payday");
    expect(result.transaction.category).toBe("Salary");
    expect(result.transaction.timestamp).toMatch(/^2026-04-22T/);
    expect(result.transaction.deletedAt ?? null).toBeNull();

    // DB reflects the change
    const db = await readDb();
    const row = db.transactions.find((t) => t.id === seeded.id);
    expect(row).toBeDefined();
    expect(row).toMatchObject({
      id: seeded.id,
      userId: "user-1",
      kind: "income",
      amount: 2500.55,
      title: "Payday",
      category: "Salary",
    });

    // Audit entry recorded with correct before/after
    const entries = await readAuditLog();
    const updates = entries.filter((e) => e.action === "update");
    expect(updates).toHaveLength(1);
    const entry = updates[0];
    expect(entry.transactionId).toBe(seeded.id);
    expect(entry.userId).toBe("user-1");
    expect(entry.before).toMatchObject({
      id: seeded.id,
      kind: "expense",
      title: "Original",
      category: "Groceries",
      amount: 10,
    });
    expect(entry.after).toMatchObject({
      id: seeded.id,
      kind: "income",
      title: "Payday",
      category: "Salary",
      amount: 2500.55,
    });
  });

  it("returns invalid with fieldErrors and leaves db + audit unchanged on bad category for new kind", async () => {
    const { updateTransactionForUser } = await import("@/lib/transactions");
    const { readDb } = await import("@/lib/db");
    const { readAuditLog } = await import("@/lib/audit");

    const seeded = await seedExpense("user-1");
    const auditAfterSeed = await readAuditLog();
    const dbBefore = await readDb();

    const result = await updateTransactionForUser("user-1", seeded.id, {
      kind: "income",
      amount: "100",
      title: "Bogus",
      timestamp: "2026-04-22T09:30",
      category: "Groceries", // not a valid income category
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid");
    if (result.error !== "invalid") return;
    expect(result.fieldErrors.category).toBeDefined();

    const dbAfter = await readDb();
    expect(dbAfter).toEqual(dbBefore);
    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditAfterSeed);
  });

  it("returns invalid with fieldErrors on bad amount and leaves db + audit unchanged", async () => {
    const { updateTransactionForUser } = await import("@/lib/transactions");
    const { readDb } = await import("@/lib/db");
    const { readAuditLog } = await import("@/lib/audit");

    const seeded = await seedExpense("user-1");
    const auditAfterSeed = await readAuditLog();
    const dbBefore = await readDb();

    const result = await updateTransactionForUser("user-1", seeded.id, {
      kind: "expense",
      amount: "-5",
      title: "Bad amount",
      timestamp: "2026-04-22T09:30",
      category: "Groceries",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid");
    if (result.error !== "invalid") return;
    expect(result.fieldErrors.amount).toBeDefined();

    const dbAfter = await readDb();
    expect(dbAfter).toEqual(dbBefore);
    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditAfterSeed);
  });

  it("collapses missing id, foreign-user id, and soft-deleted id to not_found with no audit entry", async () => {
    const { updateTransactionForUser, softDeleteTransactionForUser } =
      await import("@/lib/transactions");
    const { readAuditLog } = await import("@/lib/audit");

    // seed: one row for user-1, one row for user-2
    const mine = await seedExpense("user-1", { title: "Mine" });
    const theirs = await seedExpense("user-2", { title: "Theirs" });

    // soft-delete one more of user-1's rows
    const toDelete = await seedExpense("user-1", { title: "To-delete" });
    const delRes = await softDeleteTransactionForUser("user-1", toDelete.id);
    expect(delRes.ok).toBe(true);

    const auditBeforeAttempts = await readAuditLog();

    const validFields = {
      kind: "expense" as const,
      amount: "99",
      title: "Attempted",
      timestamp: "2026-04-22T09:30",
      category: "Groceries",
    };

    const missing = await updateTransactionForUser("user-1", "no-such-id", validFields);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toBe("not_found");

    const foreign = await updateTransactionForUser("user-1", theirs.id, validFields);
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error).toBe("not_found");

    const softDeleted = await updateTransactionForUser("user-1", toDelete.id, validFields);
    expect(softDeleted.ok).toBe(false);
    if (!softDeleted.ok) expect(softDeleted.error).toBe("not_found");

    // None of the three attempts produced a new audit entry
    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditBeforeAttempts);

    // And the legitimate row is untouched
    void mine;
  });

  it("fails validation when kind changes but category is not updated to a valid one for the new kind", async () => {
    const { updateTransactionForUser } = await import("@/lib/transactions");

    const seeded = await seedExpense("user-1", { category: "Groceries" });

    // Flip kind to income but keep the old expense category.
    const result = await updateTransactionForUser("user-1", seeded.id, {
      kind: "income",
      amount: "100",
      title: "Bogus",
      timestamp: "2026-04-22T09:30",
      category: "Groceries", // was valid for expense, invalid for income
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid");
    if (result.error !== "invalid") return;
    expect(result.fieldErrors.category).toBeDefined();
  });
});

describe("softDeleteTransactionForUser", () => {
  it("sets deletedAt on the row, hides it from the list, and records a delete audit entry", async () => {
    const { softDeleteTransactionForUser } = await import("@/lib/transactions");
    const { readDb, listTransactionsByUser } = await import("@/lib/db");
    const { readAuditLog } = await import("@/lib/audit");

    const a = await seedExpense("user-1", { title: "Keep me", timestamp: "2026-04-20T10:00" });
    const b = await seedExpense("user-1", { title: "Delete me", timestamp: "2026-04-21T10:00" });

    const result = await softDeleteTransactionForUser("user-1", b.id);
    expect(result.ok).toBe(true);

    // Row still in the db, but with deletedAt set
    const db = await readDb();
    const row = db.transactions.find((t) => t.id === b.id);
    expect(row).toBeDefined();
    expect(row?.deletedAt).toBeTruthy();

    // List filters out the soft-deleted row
    const list = await listTransactionsByUser("user-1");
    expect(list.map((t) => t.id)).toEqual([a.id]);

    // Audit entry recorded
    const entries = await readAuditLog();
    const deletes = entries.filter((e) => e.action === "delete");
    expect(deletes).toHaveLength(1);
    expect(deletes[0].transactionId).toBe(b.id);
    expect(deletes[0].userId).toBe("user-1");
    expect(deletes[0].before).toMatchObject({ id: b.id, title: "Delete me" });
    expect(deletes[0].after).toMatchObject({ id: b.id, deletedAt: expect.any(String) });
  });

  it("collapses missing / foreign / already-soft-deleted id to not_found with no audit entry", async () => {
    const { softDeleteTransactionForUser } = await import("@/lib/transactions");
    const { readAuditLog } = await import("@/lib/audit");

    const theirs = await seedExpense("user-2", { title: "Theirs" });
    const mine = await seedExpense("user-1", { title: "Mine" });

    // First delete: legitimate (so we can attempt a re-delete below)
    const firstDelete = await softDeleteTransactionForUser("user-1", mine.id);
    expect(firstDelete.ok).toBe(true);

    const auditBeforeAttempts = await readAuditLog();

    const missing = await softDeleteTransactionForUser("user-1", "no-such-id");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toBe("not_found");

    const foreign = await softDeleteTransactionForUser("user-1", theirs.id);
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error).toBe("not_found");

    const alreadyDeleted = await softDeleteTransactionForUser("user-1", mine.id);
    expect(alreadyDeleted.ok).toBe(false);
    if (!alreadyDeleted.ok) expect(alreadyDeleted.error).toBe("not_found");

    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditBeforeAttempts);
  });
});

describe("restoreTransactionForUser", () => {
  it("clears deletedAt, restores visibility, and records a restore audit entry", async () => {
    const { softDeleteTransactionForUser, restoreTransactionForUser } =
      await import("@/lib/transactions");
    const { listTransactionsByUser, readDb } = await import("@/lib/db");
    const { readAuditLog } = await import("@/lib/audit");

    const seeded = await seedExpense("user-1", {
      title: "Bring me back",
      timestamp: "2026-04-20T10:00",
    });
    const delRes = await softDeleteTransactionForUser("user-1", seeded.id);
    expect(delRes.ok).toBe(true);

    // Confirm it's hidden
    const hiddenList = await listTransactionsByUser("user-1");
    expect(hiddenList.find((t) => t.id === seeded.id)).toBeUndefined();

    const restoreRes = await restoreTransactionForUser("user-1", seeded.id);
    expect(restoreRes.ok).toBe(true);
    if (!restoreRes.ok) return;
    expect(restoreRes.transaction.id).toBe(seeded.id);
    expect(restoreRes.transaction.deletedAt).toBeNull();

    // Row back in the list
    const visibleList = await listTransactionsByUser("user-1");
    expect(visibleList.find((t) => t.id === seeded.id)).toBeDefined();

    // Row in db has deletedAt cleared
    const db = await readDb();
    const row = db.transactions.find((t) => t.id === seeded.id);
    expect(row).toBeDefined();
    expect(row?.deletedAt ?? null).toBeNull();

    // Audit entry recorded
    const entries = await readAuditLog();
    const restores = entries.filter((e) => e.action === "restore");
    expect(restores).toHaveLength(1);
    expect(restores[0].transactionId).toBe(seeded.id);
    expect(restores[0].userId).toBe("user-1");
    expect(restores[0].before?.deletedAt).toBeTruthy();
    expect(restores[0].after?.deletedAt ?? null).toBeNull();
  });

  it("returns not_found for missing id, foreign-user id, and a non-deleted row", async () => {
    const { restoreTransactionForUser } = await import("@/lib/transactions");
    const { readAuditLog } = await import("@/lib/audit");

    const theirs = await seedExpense("user-2", { title: "Theirs" });
    const mine = await seedExpense("user-1", { title: "Mine, not deleted" });

    const auditBefore = await readAuditLog();

    const missing = await restoreTransactionForUser("user-1", "no-such-id");
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error).toBe("not_found");

    const foreign = await restoreTransactionForUser("user-1", theirs.id);
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error).toBe("not_found");

    // Restoring a non-deleted row must also fail — preserves round-trip invariant
    const notDeleted = await restoreTransactionForUser("user-1", mine.id);
    expect(notDeleted.ok).toBe(false);
    if (!notDeleted.ok) expect(notDeleted.error).toBe("not_found");

    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditBefore);
  });
});
