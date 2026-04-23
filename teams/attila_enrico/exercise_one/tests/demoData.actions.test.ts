import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

// AUTH_SECRET needed because src/actions/demoData.ts imports @/lib/auth
// transitively, and @/lib/auth throws at module load when the secret is
// missing or short. Matches the top-level bootstrap pattern used in
// tests/transactions.test.ts.
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "a".repeat(48);

// ---- Mock wiring for Next.js server-only primitives ----------------------
//
// The action layer calls three Next primitives that don't work outside a
// request: `cookies()` (next/headers), `redirect()` (next/navigation), and
// `revalidatePath()` (next/cache). We mock all three at module scope so
// vi.mock is hoisted above any import of the action module. The mocks are
// intentionally simple and their behavior is driven per-test via the shared
// `mockState` object below.

const mockState: { sessionToken: string | undefined } = {
  sessionToken: undefined,
};
const revalidatePathMock = vi.fn();

// Sentinel thrown by the mocked redirect(). Tests assert that calling an
// unauthenticated action rejects with this error — mirroring Next's real
// behavior where redirect() throws a NEXT_REDIRECT internally to halt
// execution of the Server Action.
class RedirectError extends Error {
  constructor(public to: string) {
    super(`NEXT_REDIRECT:${to}`);
  }
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "session" && mockState.sessionToken
        ? { value: mockState.sessionToken }
        : undefined,
    set: () => {},
    delete: () => {},
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new RedirectError(to);
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePathMock(...args),
}));

// ---- Per-test temp-file DB/audit plumbing --------------------------------

let tmpDir: string;
let dbPath: string;
let auditPath: string;

beforeEach(async () => {
  tmpDir = path.join(os.tmpdir(), `demo-actions-${randomUUID()}`);
  await fs.mkdir(tmpDir, { recursive: true });
  dbPath = path.join(tmpDir, "db.json");
  auditPath = path.join(tmpDir, "audit.json");
  process.env.DB_PATH = dbPath;
  process.env.AUDIT_PATH = auditPath;
  mockState.sessionToken = undefined;
  revalidatePathMock.mockClear();
});

afterEach(async () => {
  delete process.env.DB_PATH;
  delete process.env.AUDIT_PATH;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

// Helper: create a real user in the temp DB and set the mocked cookie to a
// valid signed session token for that user, so `requireSession()` resolves
// to the real `User` object (including `currency`).
async function loginNewUser(currency = "EUR"): Promise<{ id: string; currency: string }> {
  const { registerUser, signSessionToken } = await import("@/lib/auth");
  const email = `user-${randomUUID()}@example.com`;
  const result = await registerUser({ email, password: "correcthorse", currency });
  if (!result.ok) throw new Error("test setup: registerUser failed");
  mockState.sessionToken = await signSessionToken(result.user.id);
  return { id: result.user.id, currency: result.user.currency };
}

// =========================================================================
// createDemoDataAction
// =========================================================================

describe("createDemoDataAction", () => {
  it("happy path: returns {ok:true, count:~500}, writes demo rows for the caller, and revalidates /app", async () => {
    const user = await loginNewUser("EUR");
    const { createDemoDataAction } = await import("@/actions/demoData");
    const { readDb } = await import("@/lib/db");

    const result = await createDemoDataAction();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Generator targets ~500; balance-positive guard can skip some, allow a band.
    expect(result.count).toBeGreaterThan(400);
    expect(result.count).toBeLessThan(700);

    const db = await readDb();
    const userRows = db.transactions.filter((t) => t.userId === user.id);
    expect(userRows.length).toBe(result.count);
    expect(userRows.every((t) => t.source === "demo")).toBe(true);
    expect(userRows.every((t) => t.userId === user.id)).toBe(true);

    // revalidatePath('/app') called on success.
    expect(revalidatePathMock).toHaveBeenCalledWith("/app");
  });

  it("already exists: a second call returns {ok:false, error:'already_exists'} and does not add any more rows", async () => {
    await loginNewUser("EUR");
    const { createDemoDataAction } = await import("@/actions/demoData");
    const { readDb } = await import("@/lib/db");

    const first = await createDemoDataAction();
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const dbAfterFirst = await readDb();

    const second = await createDemoDataAction();
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error).toBe("already_exists");
    expect(typeof second.message).toBe("string");
    expect(second.message.length).toBeGreaterThan(0);

    const dbAfterSecond = await readDb();
    expect(dbAfterSecond).toEqual(dbAfterFirst);
  });

  it("writes exactly one demo_data_created audit entry with count matching the inserted rows", async () => {
    const user = await loginNewUser("EUR");
    const { createDemoDataAction } = await import("@/actions/demoData");
    const { readAuditLog } = await import("@/lib/audit");

    const result = await createDemoDataAction();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const entries = await readAuditLog();
    const created = entries.filter((e) => e.action === "demo_data_created");
    expect(created).toHaveLength(1);
    const entry = created[0];
    if (entry.action !== "demo_data_created") return;
    expect(entry.userId).toBe(user.id);
    expect(entry.count).toBe(result.count);
  });

  it("not logged in: redirects to /login (requireSession triggers next/navigation.redirect)", async () => {
    // No loginNewUser() call — mockState.sessionToken is undefined.
    const { createDemoDataAction } = await import("@/actions/demoData");
    await expect(createDemoDataAction()).rejects.toThrow(/NEXT_REDIRECT:\/login/);
  });
});

// =========================================================================
// removeDemoDataAction
// =========================================================================

describe("removeDemoDataAction", () => {
  it("happy path: after a successful create, remove returns {ok:true, count:<same>} and clears all demo rows for the caller", async () => {
    const user = await loginNewUser("EUR");
    const { createDemoDataAction, removeDemoDataAction } = await import(
      "@/actions/demoData"
    );
    const { readDb } = await import("@/lib/db");

    const created = await createDemoDataAction();
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Clear revalidatePath call count so we can assert the remove call
    // revalidated in isolation.
    revalidatePathMock.mockClear();

    const removed = await removeDemoDataAction();
    expect(removed.ok).toBe(true);
    expect(removed.count).toBe(created.count);

    const db = await readDb();
    const demoRows = db.transactions.filter(
      (t) => t.userId === user.id && t.source === "demo",
    );
    expect(demoRows).toHaveLength(0);

    expect(revalidatePathMock).toHaveBeenCalledWith("/app");
  });

  it("writes exactly one demo_data_removed audit entry with the correct count", async () => {
    const user = await loginNewUser("EUR");
    const { createDemoDataAction, removeDemoDataAction } = await import(
      "@/actions/demoData"
    );
    const { readAuditLog } = await import("@/lib/audit");

    const created = await createDemoDataAction();
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const removed = await removeDemoDataAction();
    expect(removed.count).toBe(created.count);

    const entries = await readAuditLog();
    const removedEntries = entries.filter(
      (e) => e.action === "demo_data_removed",
    );
    expect(removedEntries).toHaveLength(1);
    const entry = removedEntries[0];
    if (entry.action !== "demo_data_removed") return;
    expect(entry.userId).toBe(user.id);
    expect(entry.count).toBe(created.count);
  });

  it("no demo data: returns {ok:true, count:0} and writes NO audit entry", async () => {
    await loginNewUser("EUR");
    const { removeDemoDataAction } = await import("@/actions/demoData");
    const { readAuditLog } = await import("@/lib/audit");

    const auditBefore = await readAuditLog();

    const result = await removeDemoDataAction();
    expect(result.ok).toBe(true);
    expect(result.count).toBe(0);

    const auditAfter = await readAuditLog();
    expect(auditAfter).toEqual(auditBefore);
    const removedEntries = auditAfter.filter(
      (e) => e.action === "demo_data_removed",
    );
    expect(removedEntries).toHaveLength(0);
  });

  it("not logged in: redirects to /login (requireSession triggers next/navigation.redirect)", async () => {
    // No loginNewUser() call — mockState.sessionToken is undefined.
    const { removeDemoDataAction } = await import("@/actions/demoData");
    await expect(removeDemoDataAction()).rejects.toThrow(/NEXT_REDIRECT:\/login/);
  });
});
