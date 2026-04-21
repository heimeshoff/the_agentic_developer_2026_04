import { describe, it, expect, beforeAll, vi } from "vitest";

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
