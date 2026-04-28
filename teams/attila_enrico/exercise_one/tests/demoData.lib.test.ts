import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

// `src/lib/demoData/index.ts` imports `@/lib/db` and `@/lib/audit` only —
// neither transitively pulls `@/lib/auth`, so no AUTH_SECRET bootstrap is
// required here. See task notes: the lib is deliberately auth-free.

let tmpDir: string;
let dbPath: string;
let auditPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `demo-lib-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  dbPath = path.join(tmpDir, "db.json");
  auditPath = path.join(tmpDir, "audit.json");
  process.env.DB_PATH = dbPath;
  process.env.AUDIT_PATH = auditPath;
});

afterEach(async () => {
  delete process.env.DB_PATH;
  delete process.env.AUDIT_PATH;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// Both `getDbPath()` and `getAuditPath()` re-read `process.env` on every call,
// so dynamic-import inside each test is sufficient for isolation.
async function importDemoLib() {
  return await import("@/lib/demoData");
}
async function importDb() {
  return await import("@/lib/db");
}
async function importAudit() {
  return await import("@/lib/audit");
}
async function importRng() {
  return await import("@/lib/demoData/rng");
}

const FIXED_NOW = new Date("2026-04-23T12:00:00.000Z");

describe("demoData lib — createDemoDataForUser", () => {
  it("writes ~500 rows for the target user with source='demo' and matching userId, persisted on disk", async () => {
    const { createDemoDataForUser } = await importDemoLib();
    const { readDb } = await importDb();

    const result = await createDemoDataForUser("user-1", "EUR");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The generator targets ~500 rows; it can produce slightly fewer because
    // the balance-positive walk may skip candidates. Allow a generous band.
    expect(result.count).toBeGreaterThan(400);
    expect(result.count).toBeLessThan(700);

    // DB on disk reflects the insert, and every row is demo + owned by user-1.
    const db = await readDb();
    const userRows = db.transactions.filter((t) => t.userId === "user-1");
    expect(userRows.length).toBe(result.count);
    expect(userRows.every((t) => t.source === "demo")).toBe(true);
    expect(userRows.every((t) => t.userId === "user-1")).toBe(true);

    // No rows for other users were introduced.
    const otherRows = db.transactions.filter((t) => t.userId !== "user-1");
    expect(otherRows).toHaveLength(0);
  });

  it("writes exactly one demo_data_created audit entry with count matching inserted rows", async () => {
    const { createDemoDataForUser } = await importDemoLib();
    const { readAuditLog } = await importAudit();

    const result = await createDemoDataForUser("user-1", "EUR");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const entries = await readAuditLog();
    const created = entries.filter((e) => e.action === "demo_data_created");
    expect(created).toHaveLength(1);
    const entry = created[0];
    if (entry.action !== "demo_data_created") return;
    expect(entry.userId).toBe("user-1");
    expect(entry.count).toBe(result.count);
  });

  it("a second create call for the same user returns already_exists, adds no rows, writes no new audit entry", async () => {
    const { createDemoDataForUser } = await importDemoLib();
    const { readDb } = await importDb();
    const { readAuditLog } = await importAudit();

    const first = await createDemoDataForUser("user-1", "EUR");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const dbAfterFirst = await readDb();
    const auditAfterFirst = await readAuditLog();

    const second = await createDemoDataForUser("user-1", "EUR");
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.reason).toBe("already_exists");

    const dbAfterSecond = await readDb();
    const auditAfterSecond = await readAuditLog();

    // No new rows inserted.
    expect(dbAfterSecond.transactions.length).toBe(dbAfterFirst.transactions.length);
    expect(dbAfterSecond).toEqual(dbAfterFirst);

    // No additional audit entry.
    expect(auditAfterSecond).toEqual(auditAfterFirst);
    const createdEntries = auditAfterSecond.filter(
      (e) => e.action === "demo_data_created",
    );
    expect(createdEntries).toHaveLength(1);
  });

  it("accepts opts passthrough (seeded rng, fixed now, custom target) and honors target", async () => {
    const { createDemoDataForUser } = await importDemoLib();
    const { readDb } = await importDb();
    const { createRng } = await importRng();

    const result = await createDemoDataForUser("user-1", "EUR", {
      now: FIXED_NOW,
      rng: createRng(42),
      target: 50,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // The generator may skip a few rows to preserve the balance-positive
    // invariant, but a target of 50 should land well below the default ~500
    // cap — confirm it's in a small band, not the default.
    expect(result.count).toBeLessThan(100);
    expect(result.count).toBeGreaterThan(0);

    const db = await readDb();
    const userRows = db.transactions.filter(
      (t) => t.userId === "user-1" && t.source === "demo",
    );
    expect(userRows.length).toBe(result.count);
  });
});

describe("demoData lib — hasDemoDataForUser", () => {
  it("returns false when the user has no transactions", async () => {
    const { hasDemoDataForUser } = await importDemoLib();
    expect(await hasDemoDataForUser("user-1")).toBe(false);
  });

  it("returns false when the user has only non-demo transactions", async () => {
    const { hasDemoDataForUser } = await importDemoLib();
    const { addTransaction } = await importDb();
    await addTransaction({
      id: "t1",
      userId: "user-1",
      kind: "expense",
      amount: 10,
      title: "Own row",
      timestamp: "2026-04-20T00:00:00.000Z",
      category: "Groceries",
      source: "user",
    });
    expect(await hasDemoDataForUser("user-1")).toBe(false);
  });

  it("returns true after createDemoDataForUser has succeeded for that user", async () => {
    const { hasDemoDataForUser, createDemoDataForUser } = await importDemoLib();
    expect(await hasDemoDataForUser("user-1")).toBe(false);
    const result = await createDemoDataForUser("user-1", "EUR");
    expect(result.ok).toBe(true);
    expect(await hasDemoDataForUser("user-1")).toBe(true);
    // Unrelated user still has no demo data.
    expect(await hasDemoDataForUser("user-2")).toBe(false);
  });
});

describe("demoData lib — removeDemoDataForUser", () => {
  it("removes all and only the caller's source='demo' rows; preserves non-demo rows and other users' demo rows", async () => {
    const { createDemoDataForUser, removeDemoDataForUser } = await importDemoLib();
    const { readDb, addTransaction } = await importDb();

    // Seed non-demo row for user-1 that MUST survive.
    await addTransaction({
      id: "keep-me",
      userId: "user-1",
      kind: "expense",
      amount: 99,
      title: "My own expense",
      timestamp: "2026-04-20T00:00:00.000Z",
      category: "Groceries",
      source: "user",
    });

    // Seed demo data for both user-1 and user-2.
    const u1 = await createDemoDataForUser("user-1", "EUR");
    expect(u1.ok).toBe(true);
    if (!u1.ok) return;

    const u2 = await createDemoDataForUser("user-2", "USD");
    expect(u2.ok).toBe(true);
    if (!u2.ok) return;

    const removal = await removeDemoDataForUser("user-1");
    expect(removal.count).toBe(u1.count);

    const db = await readDb();

    // user-1 demo rows: all gone.
    const u1Demo = db.transactions.filter(
      (t) => t.userId === "user-1" && t.source === "demo",
    );
    expect(u1Demo).toHaveLength(0);

    // user-1 non-demo row: still there.
    const u1Kept = db.transactions.filter(
      (t) => t.userId === "user-1" && t.source === "user",
    );
    expect(u1Kept).toHaveLength(1);
    expect(u1Kept[0].id).toBe("keep-me");

    // user-2 demo rows: untouched.
    const u2Demo = db.transactions.filter(
      (t) => t.userId === "user-2" && t.source === "demo",
    );
    expect(u2Demo.length).toBe(u2.count);
  });

  it("writes exactly one demo_data_removed audit entry with count equal to removed count", async () => {
    const { createDemoDataForUser, removeDemoDataForUser } = await importDemoLib();
    const { readAuditLog } = await importAudit();

    const created = await createDemoDataForUser("user-1", "EUR");
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const removal = await removeDemoDataForUser("user-1");
    expect(removal.count).toBe(created.count);

    const entries = await readAuditLog();
    const removedEntries = entries.filter(
      (e) => e.action === "demo_data_removed",
    );
    expect(removedEntries).toHaveLength(1);
    const entry = removedEntries[0];
    if (entry.action !== "demo_data_removed") return;
    expect(entry.userId).toBe("user-1");
    expect(entry.count).toBe(created.count);
  });

  it("on a user with no demo rows, returns {count: 0} and writes no audit entry", async () => {
    const { removeDemoDataForUser } = await importDemoLib();
    const { readAuditLog } = await importAudit();
    const { addTransaction } = await importDb();

    // User has a non-demo row but no demo rows.
    await addTransaction({
      id: "only-user-row",
      userId: "user-1",
      kind: "income",
      amount: 1000,
      title: "Payday",
      timestamp: "2026-04-20T00:00:00.000Z",
      category: "Salary",
      source: "user",
    });

    const auditBefore = await readAuditLog();
    const result = await removeDemoDataForUser("user-1");
    expect(result).toEqual({ count: 0 });

    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditBefore);
    const removedEntries = auditAfter.filter(
      (e) => e.action === "demo_data_removed",
    );
    expect(removedEntries).toHaveLength(0);
  });

  it("create → remove → create sequence: the second create succeeds because remove cleared the marker", async () => {
    const { createDemoDataForUser, removeDemoDataForUser, hasDemoDataForUser } =
      await importDemoLib();

    const first = await createDemoDataForUser("user-1", "EUR");
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(await hasDemoDataForUser("user-1")).toBe(true);

    const removal = await removeDemoDataForUser("user-1");
    expect(removal.count).toBe(first.count);
    expect(await hasDemoDataForUser("user-1")).toBe(false);

    const second = await createDemoDataForUser("user-1", "EUR");
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.count).toBeGreaterThan(0);
    expect(await hasDemoDataForUser("user-1")).toBe(true);
  });
});
