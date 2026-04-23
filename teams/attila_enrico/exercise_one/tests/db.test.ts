import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

let tmpDir: string;
let tmpPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `db-test-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  tmpPath = path.join(tmpDir, "db.json");
  process.env.DB_PATH = tmpPath;
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function freshModule() {
  // getDbPath() re-reads process.env.DB_PATH on every call,
  // so a plain import is sufficient for per-test isolation.
  return await import("@/lib/db");
}

describe("db", () => {
  it("bootstraps an empty DB when the file is missing", async () => {
    const { readDb } = await freshModule();
    const db = await readDb();
    expect(db).toEqual({ users: [], transactions: [] });
  });

  it("round-trips a write and a read", async () => {
    const { readDb, writeDb } = await freshModule();
    await writeDb({
      users: [{ id: "u1", email: "a@b.co", passwordHash: "x", currency: "EUR", createdAt: "2026-04-21T00:00:00.000Z" }],
      transactions: [],
    });
    const db = await readDb();
    expect(db.users).toHaveLength(1);
    expect(db.users[0].email).toBe("a@b.co");
  });

  it("writes atomically (no .tmp file left behind)", async () => {
    const { writeDb } = await freshModule();
    await writeDb({ users: [], transactions: [] });
    const dir = path.dirname(tmpPath);
    const entries = await fs.readdir(dir);
    expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
    expect(entries.some((e) => e === path.basename(tmpPath))).toBe(true);
  });

  it("appends transactions and lists them most recent first", async () => {
    const { addTransaction, listTransactionsByUser } = await freshModule();
    await addTransaction({
      id: "t1", userId: "u1", kind: "expense",
      amount: 10, title: "A", timestamp: "2026-04-20T00:00:00.000Z", category: "Groceries",
      source: "user",
    });
    await addTransaction({
      id: "t2", userId: "u1", kind: "income",
      amount: 100, title: "B", timestamp: "2026-04-21T00:00:00.000Z", category: "Salary",
      source: "user",
    });
    const list = await listTransactionsByUser("u1");
    expect(list.map((t: { id: string }) => t.id)).toEqual(["t2", "t1"]);
  });

  it("backfills `source: \"user\"` on a legacy on-disk row that omits the field", async () => {
    // Simulate a pre-schema-extension db.json: a transaction row without `source`.
    // Zod's `.default(\"user\")` on TransactionSchema should populate it during parse.
    await fs.mkdir(path.dirname(tmpPath), { recursive: true });
    const legacyDb = {
      users: [],
      transactions: [
        {
          id: "legacy-1",
          userId: "u1",
          kind: "expense",
          amount: 10,
          title: "Legacy row",
          timestamp: "2026-04-20T00:00:00.000Z",
          category: "Groceries",
        },
      ],
    };
    await fs.writeFile(tmpPath, JSON.stringify(legacyDb, null, 2), "utf8");
    const { readDb } = await freshModule();
    const db = await readDb();
    expect(db.transactions).toHaveLength(1);
    expect(db.transactions[0].source).toBe("user");
  });

  it("looks up a user by lowercased email", async () => {
    const { createUser, findUserByEmail } = await freshModule();
    await createUser({ email: "Foo@Bar.co", passwordHash: "h", currency: "USD" });
    expect(await findUserByEmail("foo@bar.co")).toMatchObject({ email: "foo@bar.co", currency: "USD" });
    expect(await findUserByEmail("nobody@nowhere.co")).toBeNull();
  });

  it("looks up a user by id", async () => {
    const { createUser, findUserById } = await freshModule();
    const created = await createUser({ email: "a@b.co", passwordHash: "h", currency: "EUR" });
    expect(await findUserById(created.id)).toMatchObject({ id: created.id, email: "a@b.co" });
    expect(await findUserById("not-a-real-id")).toBeNull();
  });

  it("throws a loud error on corrupt JSON", async () => {
    await fs.mkdir(path.dirname(tmpPath), { recursive: true });
    await fs.writeFile(tmpPath, "{not json", "utf8");
    const { readDb } = await freshModule();
    await expect(readDb()).rejects.toThrow(/db\.json/);
  });
});
