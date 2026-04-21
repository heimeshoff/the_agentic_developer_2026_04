# Personal Finance App — Walking Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Tier-1 Next.js personal-finance app: register, login, currency picked at signup, add a transaction, see your transactions in a list. No charts, no filters (deferred).

**Architecture:** Next.js 15 App Router + TypeScript. Pure logic in `src/lib/` (testable with Vitest). Thin Server Action wrappers in `src/actions/` handle cookies + redirect + revalidate. Data persists to a single JSON file (`data/db.json`) via an atomic-rename writer with an in-module async mutex. Session is a signed JWT (jose, HS256) in an `httpOnly` cookie. Passwords hashed with bcryptjs.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 3, Zod, bcryptjs, jose, nanoid, Vitest.

**Working directory:** All `npm` / `node` / `git` commands in this plan are run from `teams/attila_enrico/exercise_one/` unless stated otherwise. `git` commands run from the repo root so the commit happens on the team branch.

**Spec reference:** `teams/attila_enrico/exercise_one/docs/superpowers/specs/2026-04-21-personal-finance-skeleton-design.md`

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `teams/attila_enrico/exercise_one/package.json`
- Create: `teams/attila_enrico/exercise_one/tsconfig.json`
- Create: `teams/attila_enrico/exercise_one/next.config.js`
- Create: `teams/attila_enrico/exercise_one/tailwind.config.ts`
- Create: `teams/attila_enrico/exercise_one/postcss.config.mjs`
- Create: `teams/attila_enrico/exercise_one/vitest.config.ts`
- Create: `teams/attila_enrico/exercise_one/.gitignore`
- Create: `teams/attila_enrico/exercise_one/.env.local`
- Create: `teams/attila_enrico/exercise_one/src/app/layout.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/page.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/globals.css`

- [ ] **Step 1.1: Verify Node version ≥ 18.18**

Run (from repo root): `node --version`
Expected: `v18.18.x` or higher. If lower, install a newer Node before proceeding.

- [ ] **Step 1.2: Create `package.json`**

File: `teams/attila_enrico/exercise_one/package.json`

```json
{
  "name": "attila-enrico-exercise-one",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "bcryptjs": "^2.4.3",
    "jose": "^5.9.0",
    "zod": "^3.23.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.12.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 1.3: Create `tsconfig.json`**

File: `teams/attila_enrico/exercise_one/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowJs": false,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "incremental": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
    "plugins": [{ "name": "next" }],
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1.4: Create `next.config.js`**

File: `teams/attila_enrico/exercise_one/next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};
module.exports = nextConfig;
```

- [ ] **Step 1.5: Create Tailwind + PostCSS configs**

File: `teams/attila_enrico/exercise_one/tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fafafa",
        surface: "#ffffff",
        text: "#111111",
        muted: "#6b7280",
        border: "#eeeeee",
        expense: "#c43a3a",
        income: "#2a8a5f",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```

File: `teams/attila_enrico/exercise_one/postcss.config.mjs`

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 1.6: Create `vitest.config.ts`**

File: `teams/attila_enrico/exercise_one/vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
});
```

- [ ] **Step 1.7: Create `.gitignore`**

File: `teams/attila_enrico/exercise_one/.gitignore`

```
node_modules/
.next/
data/
.env.local
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 1.8: Create `.env.local`**

Generate a 48-char random secret. From `teams/attila_enrico/exercise_one/` run:

```bash
node -e "console.log('AUTH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" > .env.local
```

Verify the file exists and begins with `AUTH_SECRET=`. Do not commit this file (it's in `.gitignore`).

- [ ] **Step 1.9: Create minimal `globals.css`**

File: `teams/attila_enrico/exercise_one/src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { height: 100%; }
body { @apply bg-bg text-text font-sans antialiased; }
```

- [ ] **Step 1.10: Create minimal `layout.tsx`**

File: `teams/attila_enrico/exercise_one/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Finance",
  description: "Personal finance — walking skeleton",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 1.11: Create placeholder `page.tsx`**

File: `teams/attila_enrico/exercise_one/src/app/page.tsx`

```tsx
export default function HomePage() {
  return <main className="p-8">Hello, Finance.</main>;
}
```

- [ ] **Step 1.12: Install dependencies + boot the dev server**

From `teams/attila_enrico/exercise_one/`:

```bash
npm install
npm run dev
```

Open http://localhost:3000 — expected: the text "Hello, Finance." on an off-white page in Inter. Stop the dev server (Ctrl+C).

- [ ] **Step 1.13: Commit**

From repo root:

```bash
git add teams/attila_enrico/exercise_one
git commit -m "feat(attila_enrico/exercise_one): scaffold next.js + tailwind + vitest"
```

---

## Task 2: Categories module (TDD)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/lib/categories.ts`
- Create: `teams/attila_enrico/exercise_one/tests/categories.test.ts`

- [ ] **Step 2.1: Write the failing test**

File: `teams/attila_enrico/exercise_one/tests/categories.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoriesForKind,
  isValidCategory,
} from "@/lib/categories";

describe("categories", () => {
  it("exposes the expected expense and income lists", () => {
    expect(EXPENSE_CATEGORIES).toEqual([
      "Groceries", "Utilities", "Rent", "Transport",
      "Dining", "Entertainment", "Healthcare", "Other",
    ]);
    expect(INCOME_CATEGORIES).toEqual([
      "Salary", "Freelance", "Investment", "Gift", "Other",
    ]);
  });

  it("returns the right list for a kind", () => {
    expect(getCategoriesForKind("expense")).toEqual(EXPENSE_CATEGORIES);
    expect(getCategoriesForKind("income")).toEqual(INCOME_CATEGORIES);
  });

  it("accepts a category that belongs to the kind", () => {
    expect(isValidCategory("expense", "Groceries")).toBe(true);
    expect(isValidCategory("income", "Salary")).toBe(true);
  });

  it("rejects a category that belongs to the other kind", () => {
    expect(isValidCategory("expense", "Salary")).toBe(false);
    expect(isValidCategory("income", "Groceries")).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(isValidCategory("expense", "Bitcoin")).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run the test to confirm it fails**

From `teams/attila_enrico/exercise_one/`: `npm test -- tests/categories.test.ts`
Expected: FAIL — `Cannot find module '@/lib/categories'`.

- [ ] **Step 2.3: Implement the module**

File: `teams/attila_enrico/exercise_one/src/lib/categories.ts`

```ts
export type TransactionKind = "expense" | "income";

export const EXPENSE_CATEGORIES = [
  "Groceries", "Utilities", "Rent", "Transport",
  "Dining", "Entertainment", "Healthcare", "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Gift", "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export function getCategoriesForKind(kind: TransactionKind): readonly string[] {
  return kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function isValidCategory(kind: TransactionKind, category: string): boolean {
  return (getCategoriesForKind(kind) as readonly string[]).includes(category);
}
```

- [ ] **Step 2.4: Run tests — expect pass**

`npm test -- tests/categories.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 2.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/categories.ts teams/attila_enrico/exercise_one/tests/categories.test.ts
git commit -m "feat(lib): add categories module with per-kind validation"
```

---

## Task 3: Currencies module (TDD)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/lib/currencies.ts`
- Create: `teams/attila_enrico/exercise_one/tests/currencies.test.ts`

- [ ] **Step 3.1: Write the failing test**

File: `teams/attila_enrico/exercise_one/tests/currencies.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SUPPORTED_CURRENCIES, isValidCurrency, formatAmount } from "@/lib/currencies";

describe("currencies", () => {
  it("exposes a popular-first ordered allowlist", () => {
    expect(SUPPORTED_CURRENCIES.slice(0, 4)).toEqual(["EUR", "USD", "GBP", "HUF"]);
    expect(SUPPORTED_CURRENCIES).toContain("CHF");
  });

  it("accepts an allowlisted currency", () => {
    expect(isValidCurrency("EUR")).toBe(true);
  });

  it("rejects an unknown currency", () => {
    expect(isValidCurrency("XYZ")).toBe(false);
  });

  it("formats an amount using Intl.NumberFormat with the currency symbol", () => {
    expect(formatAmount(42.1, "EUR")).toMatch(/42\.10/);
    expect(formatAmount(42.1, "USD")).toMatch(/\$42\.10/);
  });
});
```

- [ ] **Step 3.2: Run test, expect FAIL**

`npm test -- tests/currencies.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3.3: Implement the module**

File: `teams/attila_enrico/exercise_one/src/lib/currencies.ts`

```ts
export const SUPPORTED_CURRENCIES = [
  "EUR", "USD", "GBP", "HUF", "CHF", "JPY", "CAD",
  "AUD", "NOK", "SEK", "DKK", "PLN", "CZK",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export function isValidCurrency(code: string): code is Currency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}

export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

- [ ] **Step 3.4: Run tests — expect PASS**

`npm test -- tests/currencies.test.ts`
Expected: all 4 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/currencies.ts teams/attila_enrico/exercise_one/tests/currencies.test.ts
git commit -m "feat(lib): add currencies allowlist and Intl-based formatter"
```

---

## Task 4: DB layer with atomic writes (TDD)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/lib/db.ts`
- Create: `teams/attila_enrico/exercise_one/tests/db.test.ts`

**Design notes:** The DB path is read via `getDbPath()` on every call so tests can set `process.env.DB_PATH` to a tmp file before each test. The writer serializes concurrent calls via an in-module promise chain and uses write-tmp + rename for atomicity.

- [ ] **Step 4.1: Write the failing test**

File: `teams/attila_enrico/exercise_one/tests/db.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

let tmpPath: string;

beforeEach(() => {
  tmpPath = path.join(os.tmpdir(), `db-${randomUUID()}.json`);
  process.env.DB_PATH = tmpPath;
});

afterEach(async () => {
  await fs.rm(tmpPath, { force: true });
});

async function freshModule() {
  // Re-import to pick up the new DB_PATH for clean state between tests.
  return await import(`@/lib/db?cb=${randomUUID()}`);
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
    });
    await addTransaction({
      id: "t2", userId: "u1", kind: "income",
      amount: 100, title: "B", timestamp: "2026-04-21T00:00:00.000Z", category: "Salary",
    });
    const list = await listTransactionsByUser("u1");
    expect(list.map((t: { id: string }) => t.id)).toEqual(["t2", "t1"]);
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
```

- [ ] **Step 4.2: Run test, expect FAIL**

`npm test -- tests/db.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4.3: Implement `lib/db.ts`**

File: `teams/attila_enrico/exercise_one/src/lib/db.ts`

```ts
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
```

- [ ] **Step 4.4: Run tests — expect PASS**

`npm test -- tests/db.test.ts`
Expected: all 6 tests PASS.

- [ ] **Step 4.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/db.ts teams/attila_enrico/exercise_one/tests/db.test.ts
git commit -m "feat(lib): add JSON db with atomic writes and zod-validated schema"
```

---

## Task 5: Auth crypto primitives (TDD)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/lib/auth.ts`
- Create: `teams/attila_enrico/exercise_one/tests/auth.test.ts`

**Design note:** `lib/auth.ts` is split into two sections — pure crypto + flow functions (this task + Task 6) which are unit tested, and cookie helpers (Task 7) which are manually verified through the UI. All three sections live in the same file per the spec layout. This task only adds the crypto primitives.

- [ ] **Step 5.1: Write the failing test**

File: `teams/attila_enrico/exercise_one/tests/auth.test.ts`

```ts
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "a".repeat(48);
});

describe("auth — crypto primitives", () => {
  it("hashes a password and verifies it", async () => {
    const { hashPassword, verifyPassword } = await import("@/lib/auth");
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toEqual("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("signs and verifies a session token", async () => {
    const { signSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await signSessionToken("user-123");
    const payload = await verifySessionToken(token);
    expect(payload?.sub).toBe("user-123");
  });

  it("rejects a tampered token", async () => {
    const { signSessionToken, verifySessionToken } = await import("@/lib/auth");
    const token = await signSessionToken("user-123");
    const tampered = token.slice(0, -2) + (token.endsWith("A") ? "B" : "A");
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { signSessionToken } = await import("@/lib/auth");
    const good = await signSessionToken("u1");
    process.env.AUTH_SECRET = "b".repeat(48);
    const mod = await import(`@/lib/auth?v=${Date.now()}`);
    expect(await mod.verifySessionToken(good)).toBeNull();
    process.env.AUTH_SECRET = "a".repeat(48);
  });

  it("throws at import time when AUTH_SECRET is missing", async () => {
    const saved = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    await expect(import(`@/lib/auth?missing=${Date.now()}`)).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = saved;
  });
});
```

- [ ] **Step 5.2: Run test — expect FAIL**

`npm test -- tests/auth.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5.3: Implement the crypto primitives**

File: `teams/attila_enrico/exercise_one/src/lib/auth.ts`

```ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const SECRET = process.env.AUTH_SECRET;
if (!SECRET || SECRET.length < 32) {
  throw new Error("AUTH_SECRET must be set and at least 32 characters long");
}
const SECRET_BYTES = new TextEncoder().encode(SECRET);

const BCRYPT_COST = 10;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(SECRET_BYTES);
}

export type SessionPayload = { sub: string };

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_BYTES, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5.4: Run tests — expect PASS**

`npm test -- tests/auth.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 5.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/auth.ts teams/attila_enrico/exercise_one/tests/auth.test.ts
git commit -m "feat(lib): add bcrypt + jose-based auth crypto primitives"
```

---

## Task 6: Auth flow logic (TDD)

**Files:**
- Modify: `teams/attila_enrico/exercise_one/src/lib/auth.ts` (append)
- Modify: `teams/attila_enrico/exercise_one/tests/auth.test.ts` (append)

**Design note:** `registerUser` and `authenticateUser` are pure-ish flow functions — they use `lib/db.ts` (which honours `DB_PATH`) but do not touch cookies or `redirect()`. This keeps them testable and reusable.

- [ ] **Step 6.1: Append failing flow tests**

Append to `teams/attila_enrico/exercise_one/tests/auth.test.ts`:

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

describe("auth — flows", () => {
  let tmpPath: string;

  beforeEach(() => {
    tmpPath = path.join(os.tmpdir(), `db-auth-${randomUUID()}.json`);
    process.env.DB_PATH = tmpPath;
  });

  afterEach(async () => {
    await fs.rm(tmpPath, { force: true });
  });

  async function fresh() {
    return await import(`@/lib/auth?flow=${randomUUID()}`);
  }

  it("registers a new user and returns the created user", async () => {
    const { registerUser } = await fresh();
    const result = await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("a@b.co");
      expect(result.user.currency).toBe("EUR");
    }
  });

  it("rejects register with a short password", async () => {
    const { registerUser } = await fresh();
    const result = await registerUser({ email: "a@b.co", password: "short", currency: "EUR" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeDefined();
  });

  it("rejects register with a duplicate email (case-insensitive) without leaking which field failed", async () => {
    const { registerUser } = await fresh();
    await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    const second = await registerUser({ email: "A@B.CO", password: "anothergood", currency: "USD" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.errors._form?.[0]).toMatch(/unable to register/i);
  });

  it("authenticates a valid user", async () => {
    const { registerUser, authenticateUser } = await fresh();
    await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    const result = await authenticateUser({ email: "a@b.co", password: "correcthorse" });
    expect(result.ok).toBe(true);
  });

  it("returns a single generic error on wrong password or unknown email", async () => {
    const { registerUser, authenticateUser } = await fresh();
    await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    const wrong = await authenticateUser({ email: "a@b.co", password: "wrong-password" });
    const unknown = await authenticateUser({ email: "nobody@x.co", password: "anything-goes" });
    expect(wrong.ok).toBe(false);
    expect(unknown.ok).toBe(false);
    if (!wrong.ok && !unknown.ok) {
      expect(wrong.errors._form?.[0]).toBe("Invalid email or password");
      expect(unknown.errors._form?.[0]).toBe("Invalid email or password");
    }
  });
});
```

Also add this import at the top of the test file (next to the existing ones):

```ts
import { beforeEach, afterEach } from "vitest";
```

(If already present, skip.)

- [ ] **Step 6.2: Run tests — expect FAIL**

`npm test -- tests/auth.test.ts`
Expected: FAIL — `registerUser` / `authenticateUser` not exported.

- [ ] **Step 6.3: Implement the flows**

Append to `teams/attila_enrico/exercise_one/src/lib/auth.ts`:

```ts
import { z } from "zod";
import { createUser, findUserByEmail, type User } from "@/lib/db";
import { isValidCurrency } from "@/lib/currencies";

const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  currency: z.string().refine(isValidCurrency, "Unsupported currency"),
});

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type FieldErrors = { _form?: string[]; [field: string]: string[] | undefined };
export type Result<T> =
  | { ok: true; user: T }
  | { ok: false; errors: FieldErrors };

export async function registerUser(input: {
  email: string; password: string; currency: string;
}): Promise<Result<User>> {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] ?? "_form") as string;
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return { ok: false, errors: { _form: ["Unable to register with the provided details"] } };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createUser({
    email: parsed.data.email,
    passwordHash,
    currency: parsed.data.currency,
  });
  return { ok: true, user };
}

export async function authenticateUser(input: {
  email: string; password: string;
}): Promise<Result<User>> {
  const GENERIC = { ok: false as const, errors: { _form: ["Invalid email or password"] } };
  const parsed = LoginSchema.safeParse(input);
  if (!parsed.success) return GENERIC;
  const user = await findUserByEmail(parsed.data.email);
  if (!user) return GENERIC;
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return GENERIC;
  return { ok: true, user };
}
```

- [ ] **Step 6.4: Run tests — expect PASS**

`npm test -- tests/auth.test.ts`
Expected: all 10 auth tests PASS (5 from Task 5 + 5 from Task 6).

- [ ] **Step 6.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/auth.ts teams/attila_enrico/exercise_one/tests/auth.test.ts
git commit -m "feat(lib): add registerUser / authenticateUser flows with zod validation"
```

---

## Task 7: Session cookie helpers (manual verification)

**Files:**
- Modify: `teams/attila_enrico/exercise_one/src/lib/auth.ts` (append)

**Design note:** These helpers use `next/headers` and `next/navigation`, which are only available inside a Next.js request context. They are not unit-tested; they are verified indirectly once the register/login pages are wired up in Tasks 12–14.

- [ ] **Step 7.1: Extend the top-of-file `@/lib/db` import in `lib/auth.ts`**

In `teams/attila_enrico/exercise_one/src/lib/auth.ts`, update the existing import added in Task 6:

```ts
import { createUser, findUserByEmail, findUserById, type User } from "@/lib/db";
```

(Adds `findUserById` to the existing list.)

- [ ] **Step 7.2: Append session cookie helpers to `lib/auth.ts`**

Append to `teams/attila_enrico/exercise_one/src/lib/auth.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "session";

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ user: User } | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const user = await findUserById(payload.sub);
  return user ? { user } : null;
}

export async function requireSession(): Promise<{ user: User }> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
```

- [ ] **Step 7.3: Re-run all tests to confirm nothing regressed**

`npm test`
Expected: every test suite still PASSes. (The new imports aren't exercised by tests, but syntax errors would surface.)

- [ ] **Step 7.4: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/auth.ts
git commit -m "feat(lib): add cookie-based session helpers"
```

---

## Task 8: Transaction flow logic (TDD)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/lib/transactions.ts`
- Create: `teams/attila_enrico/exercise_one/tests/transactions.test.ts`

**Design note:** Extending the spec slightly — the pure flow lives in `lib/transactions.ts` so it's unit-testable; the Server Action (Task 10) wraps it with `requireSession` + `revalidatePath`.

- [ ] **Step 8.1: Write the failing test**

File: `teams/attila_enrico/exercise_one/tests/transactions.test.ts`

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

let tmpPath: string;

beforeEach(() => {
  tmpPath = path.join(os.tmpdir(), `db-tx-${randomUUID()}.json`);
  process.env.DB_PATH = tmpPath;
});

afterEach(async () => {
  await fs.rm(tmpPath, { force: true });
});

async function fresh() {
  return await import(`@/lib/transactions?v=${randomUUID()}`);
}

describe("transactions flow", () => {
  it("adds a valid expense for a user", async () => {
    const { addTransactionForUser } = await fresh();
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
    const { addTransactionForUser } = await fresh();
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
    const { addTransactionForUser } = await fresh();
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
    const { addTransactionForUser } = await fresh();
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
    const { addTransactionForUser } = await fresh();
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
```

- [ ] **Step 8.2: Run test — expect FAIL**

`npm test -- tests/transactions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 8.3: Implement the flow**

File: `teams/attila_enrico/exercise_one/src/lib/transactions.ts`

```ts
import { z } from "zod";
import { nanoid } from "nanoid";
import { addTransaction, type Transaction } from "@/lib/db";
import { isValidCategory } from "@/lib/categories";
import type { FieldErrors } from "@/lib/auth";

const InputSchema = z
  .object({
    kind: z.enum(["expense", "income"]),
    amount: z
      .string()
      .trim()
      .refine((v) => v.length > 0, "Amount is required")
      .transform((v) => Number(v))
      .refine((n) => Number.isFinite(n) && n > 0, "Amount must be a positive number"),
    title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
    timestamp: z
      .string()
      .trim()
      .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date")
      .transform((v) => new Date(v).toISOString()),
    category: z.string().trim().min(1, "Category is required"),
  })
  .superRefine((data, ctx) => {
    if (!isValidCategory(data.kind, data.category)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["category"],
        message: "Category does not belong to this kind",
      });
    }
  });

export type AddResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; errors: FieldErrors };

export async function addTransactionForUser(
  userId: string,
  raw: { kind: string; amount: string; title: string; timestamp: string; category: string },
): Promise<AddResult> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = (issue.path[0] ?? "_form") as string;
      (errors[key] ??= []).push(issue.message);
    }
    return { ok: false, errors };
  }
  const tx: Transaction = {
    id: nanoid(),
    userId,
    kind: parsed.data.kind,
    amount: Math.round(parsed.data.amount * 100) / 100,
    title: parsed.data.title,
    timestamp: parsed.data.timestamp,
    category: parsed.data.category,
  };
  await addTransaction(tx);
  return { ok: true, transaction: tx };
}
```

- [ ] **Step 8.4: Run tests — expect PASS**

`npm test -- tests/transactions.test.ts`
Expected: all 5 tests PASS.

- [ ] **Step 8.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/lib/transactions.ts teams/attila_enrico/exercise_one/tests/transactions.test.ts
git commit -m "feat(lib): add addTransactionForUser flow with zod validation"
```

---

## Task 9: Auth server actions

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/actions/auth.ts`

**Design note:** Actions are thin wrappers around the flows; they parse `FormData`, call into `lib/auth.ts`, then on success set the cookie + `redirect`. They are verified manually via the UI in Tasks 12–13.

- [ ] **Step 9.1: Create the actions file**

File: `teams/attila_enrico/exercise_one/src/actions/auth.ts`

```ts
"use server";

import { redirect } from "next/navigation";
import {
  authenticateUser,
  clearSession,
  createSession,
  registerUser,
  type FieldErrors,
} from "@/lib/auth";

export type FormState = { ok: boolean; errors?: FieldErrors };

export async function registerAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const result = await registerUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    currency: String(formData.get("currency") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  await createSession(result.user.id);
  redirect("/app");
}

export async function loginAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const result = await authenticateUser({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  await createSession(result.user.id);
  redirect("/app");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
```

- [ ] **Step 9.2: Type-check**

From `teams/attila_enrico/exercise_one/`: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/actions/auth.ts
git commit -m "feat(actions): wire register/login/logout server actions"
```

---

## Task 10: Transaction server action

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/actions/transactions.ts`

- [ ] **Step 10.1: Create the action**

File: `teams/attila_enrico/exercise_one/src/actions/transactions.ts`

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { addTransactionForUser } from "@/lib/transactions";
import type { FormState } from "@/actions/auth";

export async function addTransactionAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireSession();
  const result = await addTransactionForUser(user.id, {
    kind: String(formData.get("kind") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    title: String(formData.get("title") ?? ""),
    timestamp: String(formData.get("timestamp") ?? ""),
    category: String(formData.get("category") ?? ""),
  });
  if (!result.ok) return { ok: false, errors: result.errors };
  revalidatePath("/app");
  return { ok: true };
}
```

- [ ] **Step 10.2: Type-check**

`npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10.3: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/actions/transactions.ts
git commit -m "feat(actions): add server action for creating transactions"
```

---

## Task 11: Root layout + shared form components

**Files:**
- Modify: `teams/attila_enrico/exercise_one/src/app/page.tsx` (will be rewritten in Task 15)
- Create: `teams/attila_enrico/exercise_one/src/components/Field.tsx`
- Create: `teams/attila_enrico/exercise_one/src/components/FormError.tsx`
- Create: `teams/attila_enrico/exercise_one/src/components/SubmitButton.tsx`

- [ ] **Step 11.1: Create `Field.tsx`**

File: `teams/attila_enrico/exercise_one/src/components/Field.tsx`

```tsx
import type { ReactNode } from "react";

export function Field({
  label, name, type = "text", required, defaultValue, step, children, errors,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  step?: string;
  children?: ReactNode;
  errors?: string[];
}) {
  const id = `field-${name}`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm text-muted">{label}</label>
      {children ?? (
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          step={step}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-text outline-none focus:border-text"
        />
      )}
      {errors?.map((e, i) => (
        <p key={i} className="text-xs text-expense">{e}</p>
      ))}
    </div>
  );
}
```

- [ ] **Step 11.2: Create `FormError.tsx`**

File: `teams/attila_enrico/exercise_one/src/components/FormError.tsx`

```tsx
export function FormError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <div className="rounded border border-expense/30 bg-expense/5 px-3 py-2 text-sm text-expense">
      {messages.join(" ")}
    </div>
  );
}
```

- [ ] **Step 11.3: Create `SubmitButton.tsx`**

File: `teams/attila_enrico/exercise_one/src/components/SubmitButton.tsx`

```tsx
"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded bg-text px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  );
}
```

- [ ] **Step 11.4: Type-check**

`npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 11.5: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/components
git commit -m "feat(ui): add shared form primitives (Field, FormError, SubmitButton)"
```

---

## Task 12: Register page

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/app/register/page.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/register/RegisterForm.tsx`

- [ ] **Step 12.1: Create the client form**

File: `teams/attila_enrico/exercise_one/src/app/register/RegisterForm.tsx`

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/actions/auth";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = { ok: false };

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initial);
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormError messages={errors._form} />
      <Field label="Email" name="email" type="email" required errors={errors.email} />
      <Field label="Password" name="password" type="password" required errors={errors.password} />
      <Field label="Currency" name="currency" errors={errors.currency}>
        <select
          id="field-currency"
          name="currency"
          defaultValue="EUR"
          className="w-full rounded border border-border bg-surface px-3 py-2"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <SubmitButton>Create account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="underline">Log in</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 12.2: Create the page**

File: `teams/attila_enrico/exercise_one/src/app/register/page.tsx`

```tsx
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 12.3: Manually verify register works**

From `teams/attila_enrico/exercise_one/`: `npm run dev`.

- Visit http://localhost:3000/register.
- Try an invalid password (length < 8) — expect an inline error under the password field.
- Register a valid account — expect a redirect to `/app` (which will 404 until Task 14; just confirm the URL bar changes and no server error is thrown). Open `data/db.json` and confirm your user is there with a bcrypt-hashed password.
- Stop the dev server.

- [ ] **Step 12.4: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/app/register
git commit -m "feat(ui): add register page with server action"
```

---

## Task 13: Login page

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/app/login/page.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/login/LoginForm.tsx`

- [ ] **Step 13.1: Create the client form**

File: `teams/attila_enrico/exercise_one/src/app/login/LoginForm.tsx`

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/actions/auth";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";

const initial: FormState = { ok: false };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      <FormError messages={errors._form} />
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      <SubmitButton>Log in</SubmitButton>
      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="underline">Register →</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 13.2: Create the page**

File: `teams/attila_enrico/exercise_one/src/app/login/page.tsx`

```tsx
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-6 rounded-lg border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">Log in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 13.3: Manually verify login**

`npm run dev`.

- Visit http://localhost:3000/login.
- Log in with the account created in Task 12 — expect redirect to `/app`.
- Log in with a wrong password — expect the single error "Invalid email or password" above the form, no field-level highlight.
- Log in with an unknown email — expect the same generic error.
- Stop the dev server.

- [ ] **Step 13.4: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/app/login
git commit -m "feat(ui): add login page with server action"
```

---

## Task 14: `/app` dashboard (list + add form)

**Files:**
- Create: `teams/attila_enrico/exercise_one/src/app/app/layout.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/app/page.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/app/AddTransactionForm.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/app/LogoutButton.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/app/formatDate.ts`

- [ ] **Step 14.1: Create the segment layout (guards session + renders chrome)**

File: `teams/attila_enrico/exercise_one/src/app/app/layout.tsx`

```tsx
import { requireSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Finance</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
```

- [ ] **Step 14.2: Create `LogoutButton`**

File: `teams/attila_enrico/exercise_one/src/app/app/LogoutButton.tsx`

```tsx
import { logoutAction } from "@/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded border border-border bg-surface px-3 py-1 text-xs hover:bg-bg"
      >
        Log out
      </button>
    </form>
  );
}
```

- [ ] **Step 14.3: Create `formatDate.ts`**

File: `teams/attila_enrico/exercise_one/src/app/app/formatDate.ts`

```ts
export function formatDate(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}
```

- [ ] **Step 14.4: Create `AddTransactionForm.tsx` (Client Component with kind/category reactivity)**

File: `teams/attila_enrico/exercise_one/src/app/app/AddTransactionForm.tsx`

```tsx
"use client";

import { useActionState, useMemo, useState } from "react";
import { addTransactionAction } from "@/actions/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionKind } from "@/lib/categories";
import { Field } from "@/components/Field";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/actions/auth";

const initial: FormState = { ok: false };

function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTransactionForm() {
  const [kind, setKind] = useState<TransactionKind>("expense");
  const categories = useMemo(
    () => (kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES),
    [kind],
  );
  const [state, formAction] = useActionState(addTransactionAction, initial);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex gap-2">
        {(["expense", "income"] as TransactionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={
              "flex-1 rounded px-3 py-1 text-sm " +
              (k === kind
                ? "bg-text text-surface"
                : "border border-border bg-surface text-muted hover:text-text")
            }
          >
            {k === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>
      <input type="hidden" name="kind" value={kind} />

      <FormError messages={errors._form} />

      <Field label="Title" name="title" required errors={errors.title} />
      <Field label="Amount" name="amount" type="number" step="0.01" required errors={errors.amount} />
      <Field label="When" name="timestamp" type="datetime-local" required defaultValue={nowLocalInput()} errors={errors.timestamp} />
      <Field label="Category" name="category" errors={errors.category}>
        <select
          id="field-category"
          name="category"
          className="w-full rounded border border-border bg-surface px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>

      <SubmitButton>Add transaction</SubmitButton>
      {state.ok ? <p className="text-center text-xs text-income">Added ✓</p> : null}
    </form>
  );
}
```

- [ ] **Step 14.5: Create the dashboard page**

File: `teams/attila_enrico/exercise_one/src/app/app/page.tsx`

```tsx
import { requireSession } from "@/lib/auth";
import { listTransactionsByUser } from "@/lib/db";
import { formatAmount } from "@/lib/currencies";
import { AddTransactionForm } from "./AddTransactionForm";
import { formatDate } from "./formatDate";

export default async function DashboardPage() {
  const { user } = await requireSession();
  const transactions = await listTransactionsByUser(user.id);
  const balance = transactions.reduce(
    (sum, t) => sum + (t.kind === "income" ? t.amount : -t.amount),
    0,
  );

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
      <aside className="md:sticky md:top-6 md:self-start">
        <AddTransactionForm />
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-muted">Balance</p>
          <p className={"mt-1 text-3xl font-semibold " + (balance < 0 ? "text-expense" : "text-text")}>
            {formatAmount(balance, user.currency)}
          </p>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-muted">No transactions yet — add your first one.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-muted">
                    {t.category} · {formatDate(t.timestamp)}
                  </p>
                </div>
                <p className={"shrink-0 font-medium " + (t.kind === "expense" ? "text-expense" : "text-income")}>
                  {t.kind === "expense" ? "−" : "+"}
                  {formatAmount(t.amount, user.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 14.6: Manually verify the dashboard**

`npm run dev`.

- Log in with the account from earlier. Expect a two-column layout on desktop, single column on mobile.
- Add an expense ("Groceries", €42.10, category Groceries) → expect the list to show the new item and balance to go to −42.10.
- Toggle to Income → the category dropdown switches to income categories.
- Add an income (Salary 1000, category Salary) → balance becomes 957.90.
- Submit an expense with an empty title → inline error appears under Title.
- Click Log out → expect redirect to `/login`, then visit `/app` → expect redirect back to `/login`.
- Stop the dev server.

- [ ] **Step 14.7: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/app/app
git commit -m "feat(ui): add /app dashboard with balance, list, and add-transaction form"
```

---

## Task 15: Root redirect, error boundary, final smoke

**Files:**
- Modify: `teams/attila_enrico/exercise_one/src/app/page.tsx`
- Create: `teams/attila_enrico/exercise_one/src/app/error.tsx`

- [ ] **Step 15.1: Replace the placeholder home page with a session-aware redirect**

File: `teams/attila_enrico/exercise_one/src/app/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  redirect(session ? "/app" : "/login");
}
```

- [ ] **Step 15.2: Add a global `error.tsx` boundary**

File: `teams/attila_enrico/exercise_one/src/app/error.tsx`

```tsx
"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm items-center p-6">
      <div className="w-full space-y-4 rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted">Try again — if it keeps failing, check the dev console.</p>
        <button onClick={() => reset()} className="rounded bg-text px-4 py-2 text-sm text-surface">
          Retry
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 15.3: Full-app smoke test**

`npm run dev`.

Run through this flow end-to-end:
1. Visit http://localhost:3000/ → redirects to `/login` (or `/app` if a session cookie is present).
2. Go to `/register`, create a fresh account (e.g. `demo@demo.co` / `demo12345` / USD).
3. Land on `/app`. Add one expense and one income across the Expense/Income toggle.
4. Confirm the balance matches. Confirm the date renders as "Today".
5. Log out. Visit `/app` directly → redirects to `/login`.
6. Log back in → same transactions still there.
7. Inspect `data/db.json` → confirm the users array has exactly the users you created and the transactions array contains your entries; no plaintext passwords.
8. Stop the dev server.

- [ ] **Step 15.4: Run the full test suite one more time**

`npm test`
Expected: every test PASSes. Roughly 25+ test cases across `categories`, `currencies`, `db`, `auth`, `transactions`.

- [ ] **Step 15.5: Type-check the whole tree**

`npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 15.6: Commit**

```bash
git add teams/attila_enrico/exercise_one/src/app/page.tsx teams/attila_enrico/exercise_one/src/app/error.tsx
git commit -m "feat(ui): add root redirect and global error boundary"
```

---

## Done check

After completing all 15 tasks the following must be true:
- `npm test` passes with tests covering categories, currencies, db, auth (primitives + flows), and transactions.
- `npx tsc --noEmit` is clean.
- `npm run dev` lets a new user register, log in, add expenses and incomes, see a running balance, log out, and log back in.
- `data/db.json` persists users (with bcrypt hashes) and transactions; no plaintext passwords.
- `.env.local` contains a non-empty `AUTH_SECRET`; it is gitignored.
- UI renders in monochrome with Inter + the token palette from the spec.
- No charts, filters, edits, or deletes — deferred by design to a Tier-2 plan.
