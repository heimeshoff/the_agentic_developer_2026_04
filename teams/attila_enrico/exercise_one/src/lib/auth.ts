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
