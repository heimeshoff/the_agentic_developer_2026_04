import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

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
    vi.resetModules();
    const mod = await import("@/lib/auth");
    expect(await mod.verifySessionToken(good)).toBeNull();
    process.env.AUTH_SECRET = "a".repeat(48);
    vi.resetModules();
  });

  it("throws at import time when AUTH_SECRET is missing", async () => {
    const saved = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    vi.resetModules();
    await expect(import("@/lib/auth")).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = saved;
    vi.resetModules();
  });
});

// --- Task 6: flows ---
describe("auth — flows", () => {
  let tmpDir: string;
  let tmpPath: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `auth-flow-${randomUUID()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    tmpPath = path.join(tmpDir, "db.json");
    process.env.DB_PATH = tmpPath;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("registers a new user and returns the created user", async () => {
    const { registerUser } = await import("@/lib/auth");
    const result = await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe("a@b.co");
      expect(result.user.currency).toBe("EUR");
    }
  });

  it("rejects register with a short password", async () => {
    const { registerUser } = await import("@/lib/auth");
    const result = await registerUser({ email: "a@b.co", password: "short", currency: "EUR" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeDefined();
  });

  it("rejects register with a duplicate email (case-insensitive) without leaking which field failed", async () => {
    const { registerUser } = await import("@/lib/auth");
    await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    const second = await registerUser({ email: "A@B.CO", password: "anothergood", currency: "USD" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.errors._form?.[0]).toMatch(/unable to register/i);
  });

  it("authenticates a valid user", async () => {
    const { registerUser, authenticateUser } = await import("@/lib/auth");
    await registerUser({ email: "a@b.co", password: "correcthorse", currency: "EUR" });
    const result = await authenticateUser({ email: "a@b.co", password: "correcthorse" });
    expect(result.ok).toBe(true);
  });

  it("returns a single generic error on wrong password or unknown email", async () => {
    const { registerUser, authenticateUser } = await import("@/lib/auth");
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
