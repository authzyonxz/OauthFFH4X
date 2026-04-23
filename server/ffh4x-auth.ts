import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ffh4x-super-secret-key-2024"
);
const JWT_EXPIRY = "24h";

// ─── Password Hashing ─────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: number;
  username: string;
  role: "admin" | "reseller";
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Key Generation ───────────────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomSuffix(length = 15): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export function generateKey(prefix: string, duration: string): string {
  return `${prefix.toUpperCase()}-${duration}-${randomSuffix(15)}`;
}

export function generateCustomKey(customPrefix: string, duration: string): string {
  return `${customPrefix.toUpperCase()}-${duration}-${randomSuffix(15)}`;
}

export function generatePackageToken(): string {
  return `PKG-${randomSuffix(32)}`;
}

// ─── Duration helpers ─────────────────────────────────────────────────────────
export function parseDuration(duration: string): number {
  // e.g. "1day" → 1, "7day" → 7, "30day" → 30, "3day" → 3
  const match = duration.match(/^(\d+)day$/i);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  return parseInt(match[1], 10);
}

export function buildDurationLabel(days: number): string {
  return `${days}day`;
}

export function calcExpiresAt(activatedAt: Date, durationDays: number): Date {
  const d = new Date(activatedAt);
  d.setDate(d.getDate() + durationDays);
  return d;
}

export function getSecondsRemaining(expiresAt: Date): number {
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}
