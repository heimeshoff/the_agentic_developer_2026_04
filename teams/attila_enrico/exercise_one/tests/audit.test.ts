import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import type { Transaction } from "@/lib/db";
import type { AuditEntry } from "@/lib/audit";

let tmpDir: string;
let tmpPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `audit-test-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  tmpPath = path.join(tmpDir, "audit.json");
  process.env.AUDIT_PATH = tmpPath;
});

afterEach(async () => {
  delete process.env.AUDIT_PATH;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// getAuditPath() re-reads process.env.AUDIT_PATH on every call, so a plain
// import is sufficient for per-test isolation.
async function freshModule() {
  return await import("@/lib/audit");
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    userId: "user-1",
    kind: "expense",
    amount: 42,
    title: "Coffee",
    timestamp: "2026-04-22T10:00:00.000Z",
    category: "Groceries",
    source: "user",
    ...overrides,
  };
}

// AuditEntry is a discriminated union; the transaction-scoped variants
// (create/update/delete/restore) share the same shape, so narrow the helper
// to that subset for the round-trip / validation tests below.
type TxAuditEntry = Extract<
  AuditEntry,
  { action: "create" | "update" | "delete" | "restore" }
>;

function makeEntry(overrides: Partial<TxAuditEntry> = {}): TxAuditEntry {
  return {
    id: "audit-1",
    transactionId: "tx-1",
    userId: "user-1",
    action: "create",
    at: "2026-04-22T10:00:00.000Z",
    before: null,
    after: makeTx(),
    ...overrides,
  };
}

describe("audit — readAuditLog", () => {
  it("returns [] when the audit file does not exist", async () => {
    const { readAuditLog } = await freshModule();
    const entries = await readAuditLog();
    expect(entries).toEqual([]);
  });

  it("throws a loud error when the audit file is corrupt JSON", async () => {
    await fs.mkdir(path.dirname(tmpPath), { recursive: true });
    await fs.writeFile(tmpPath, "{not json", "utf8");
    const { readAuditLog } = await freshModule();
    await expect(readAuditLog()).rejects.toThrow(/audit\.json/);
  });

  it("parses the persisted file into typed AuditEntry[] matching what was appended", async () => {
    const { appendAuditEntry, readAuditLog } = await freshModule();
    const entry = makeEntry();
    await appendAuditEntry(entry);
    const roundTripped = await readAuditLog();
    expect(roundTripped).toHaveLength(1);
    expect(roundTripped[0]).toEqual(entry);
  });
});

describe("audit — appendAuditEntry", () => {
  it("creates the audit file on first call and persists the entry", async () => {
    const { appendAuditEntry } = await freshModule();
    await expect(fs.access(tmpPath)).rejects.toThrow();
    const entry = makeEntry();
    await appendAuditEntry(entry);
    const raw = await fs.readFile(tmpPath, "utf8");
    const parsed = JSON.parse(raw);
    expect(parsed).toEqual([entry]);
  });

  it("accumulates multiple appends in append-only order", async () => {
    const { appendAuditEntry, readAuditLog } = await freshModule();
    const first = makeEntry({ id: "audit-1", action: "create", before: null, after: makeTx() });
    const second = makeEntry({
      id: "audit-2",
      action: "update",
      at: "2026-04-22T11:00:00.000Z",
      before: makeTx(),
      after: makeTx({ amount: 99 }),
    });
    const third = makeEntry({
      id: "audit-3",
      action: "delete",
      at: "2026-04-22T12:00:00.000Z",
      before: makeTx(),
      after: null,
    });
    await appendAuditEntry(first);
    await appendAuditEntry(second);
    await appendAuditEntry(third);
    const entries = await readAuditLog();
    expect(entries.map((e) => e.id)).toEqual(["audit-1", "audit-2", "audit-3"]);
    expect(entries).toEqual([first, second, third]);
  });

  it("writes atomically (no .tmp file left behind)", async () => {
    const { appendAuditEntry } = await freshModule();
    await appendAuditEntry(makeEntry());
    const entries = await fs.readdir(tmpDir);
    expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
    expect(entries).toContain(path.basename(tmpPath));
  });

  it("rejects before touching the file when required fields are missing", async () => {
    const { appendAuditEntry } = await freshModule();
    const invalid = { transactionId: "tx-1", userId: "user-1", action: "create", before: null, after: makeTx() };
    await expect(appendAuditEntry(invalid as unknown as AuditEntry)).rejects.toThrow();
    await expect(fs.access(tmpPath)).rejects.toThrow();
  });

  it("rejects before touching the file when action is not a valid enum value", async () => {
    const { appendAuditEntry } = await freshModule();
    const invalid = makeEntry({ action: "frobnicate" as unknown as "create" });
    await expect(appendAuditEntry(invalid)).rejects.toThrow();
    await expect(fs.access(tmpPath)).rejects.toThrow();
  });

  it("rejects before touching the file when `before` does not match TransactionSchema", async () => {
    const { appendAuditEntry } = await freshModule();
    const badTx = { id: "tx-1", userId: "user-1", kind: "expense", amount: -1, title: "Bad", timestamp: "t", category: "c" };
    const invalid = makeEntry({ before: badTx as unknown as Transaction, after: null });
    await expect(appendAuditEntry(invalid)).rejects.toThrow();
    await expect(fs.access(tmpPath)).rejects.toThrow();
  });

  it("rejects before touching the file when `after` does not match TransactionSchema", async () => {
    const { appendAuditEntry } = await freshModule();
    const badTx = { id: "tx-1", userId: "user-1", kind: "expense", amount: 10, title: "", timestamp: "t", category: "c" };
    const invalid = makeEntry({ before: null, after: badTx as unknown as Transaction });
    await expect(appendAuditEntry(invalid)).rejects.toThrow();
    await expect(fs.access(tmpPath)).rejects.toThrow();
  });
});

describe("audit — createAuditEntry", () => {
  it("fills in `id` and `at` when not provided and returns a fully-valid AuditEntry", async () => {
    const { createAuditEntry, AuditEntrySchema } = await freshModule();
    const before = Date.now();
    const entry = createAuditEntry({
      transactionId: "tx-1",
      userId: "user-1",
      action: "create",
      before: null,
      after: makeTx(),
    });
    const after = Date.now();

    expect(typeof entry.id).toBe("string");
    expect(entry.id.length).toBeGreaterThan(0);
    expect(typeof entry.at).toBe("string");
    const atMs = Date.parse(entry.at);
    expect(Number.isNaN(atMs)).toBe(false);
    expect(atMs).toBeGreaterThanOrEqual(before);
    expect(atMs).toBeLessThanOrEqual(after);

    // Round-trip through the schema to confirm full validity.
    expect(() => AuditEntrySchema.parse(entry)).not.toThrow();
  });

  it("respects caller-provided `id` and `at`", async () => {
    const { createAuditEntry } = await freshModule();
    const entry = createAuditEntry({
      id: "custom-id",
      at: "2026-01-01T00:00:00.000Z",
      transactionId: "tx-1",
      userId: "user-1",
      action: "update",
      before: makeTx(),
      after: makeTx({ amount: 2 }),
    });
    expect(entry.id).toBe("custom-id");
    expect(entry.at).toBe("2026-01-01T00:00:00.000Z");
  });

  it("throws when the partial produces an invalid entry (e.g. bad `after`)", async () => {
    const { createAuditEntry } = await freshModule();
    const badTx = { id: "tx-1", userId: "user-1", kind: "expense", amount: 0, title: "x", timestamp: "t", category: "c" };
    expect(() =>
      createAuditEntry({
        transactionId: "tx-1",
        userId: "user-1",
        action: "create",
        before: null,
        after: badTx as unknown as Transaction,
      }),
    ).toThrow();
  });
});

describe("audit — AuditEntrySchema", () => {
  it("accepts a well-formed entry", async () => {
    const { AuditEntrySchema } = await freshModule();
    expect(() => AuditEntrySchema.parse(makeEntry())).not.toThrow();
  });

  it("rejects an unknown `action` string", async () => {
    const { AuditEntrySchema } = await freshModule();
    const bad = { ...makeEntry(), action: "purge" };
    expect(() => AuditEntrySchema.parse(bad)).toThrow();
  });

  it("rejects missing required fields", async () => {
    const { AuditEntrySchema } = await freshModule();
    const { id: _id, ...missingId } = makeEntry();
    expect(() => AuditEntrySchema.parse(missingId)).toThrow();
  });

  it("rejects when `before` is not null and not a valid Transaction", async () => {
    const { AuditEntrySchema } = await freshModule();
    const bad = { ...makeEntry(), before: { id: "x" } };
    expect(() => AuditEntrySchema.parse(bad)).toThrow();
  });

  it("rejects when `after` is not null and not a valid Transaction", async () => {
    const { AuditEntrySchema } = await freshModule();
    const bad = { ...makeEntry(), after: { id: "x", userId: "u", kind: "expense", amount: 1 } };
    expect(() => AuditEntrySchema.parse(bad)).toThrow();
  });
});

describe("audit — demo-data variants", () => {
  it("round-trips a `demo_data_created` entry built via its factory", async () => {
    const { createDemoDataCreatedAuditEntry, appendAuditEntry, readAuditLog } =
      await freshModule();
    const entry = createDemoDataCreatedAuditEntry({
      userId: "user-1",
      count: 42,
    });
    expect(entry.action).toBe("demo_data_created");
    if (entry.action !== "demo_data_created") return;
    expect(entry.count).toBe(42);
    await appendAuditEntry(entry);
    const entries = await readAuditLog();
    expect(entries).toEqual([entry]);
  });

  it("round-trips a `demo_data_removed` entry built via its factory", async () => {
    const { createDemoDataRemovedAuditEntry, appendAuditEntry, readAuditLog } =
      await freshModule();
    const entry = createDemoDataRemovedAuditEntry({
      userId: "user-1",
      count: 42,
    });
    expect(entry.action).toBe("demo_data_removed");
    if (entry.action !== "demo_data_removed") return;
    expect(entry.count).toBe(42);
    await appendAuditEntry(entry);
    const entries = await readAuditLog();
    expect(entries).toEqual([entry]);
  });
});
