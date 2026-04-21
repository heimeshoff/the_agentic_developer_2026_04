import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createUser, findUserByEmail, findUserById, type User } from "@/lib/db";
import { isValidCurrency } from "@/lib/currencies";

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
