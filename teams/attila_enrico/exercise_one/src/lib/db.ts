import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { nanoid } from "nanoid";

const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  kind: z.enum(["expense", "income"]),
  amount: z.number().positive(),
  title: z.string().min(1).max(120),
  timestamp: z.string(),
  category: z.string(),
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  currency: z.string(),
  createdAt: z.string(),
});

const DBSchema = z.object({
  users: z.array(UserSchema),
  transactions: z.array(TransactionSchema),
});

export type DB = z.infer<typeof DBSchema>;
export type User = z.infer<typeof UserSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;

function getDbPath(): string {
  return process.env.DB_PATH ?? path.join(process.cwd(), "data", "db.json");
}

// Single in-process mutex — serializes overlapping Server Action calls.
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

export async function readDb(): Promise<DB> {
  const p = getDbPath();
  try {
    const raw = await fs.readFile(p, "utf8");
    try {
      return DBSchema.parse(JSON.parse(raw));
    } catch (err) {
      throw new Error(`Corrupt or invalid ${p}: ${(err as Error).message}`);
    }
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { users: [], transactions: [] };
    }
    throw err;
  }
}

export async function writeDb(next: DB): Promise<void> {
  await withLock(async () => {
    const p = getDbPath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
    await fs.rename(tmp, p);
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await readDb();
  const lower = email.toLowerCase();
  return db.users.find((u) => u.email === lower) ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await readDb();
  return db.users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: { email: string; passwordHash: string; currency: string }): Promise<User> {
  return withLock(async () => {
    const db = await readDb();
    const user: User = {
      id: nanoid(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      currency: input.currency,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    const p = getDbPath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, p);
    return user;
  });
}

export async function listTransactionsByUser(userId: string): Promise<Transaction[]> {
  const db = await readDb();
  return db.transactions
    .filter((t) => t.userId === userId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function addTransaction(tx: Transaction): Promise<Transaction> {
  return withLock(async () => {
    const db = await readDb();
    db.transactions.push(tx);
    const p = getDbPath();
    await fs.mkdir(path.dirname(p), { recursive: true });
    const tmp = `${p}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, p);
    return tx;
  });
}
