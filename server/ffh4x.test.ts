import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  generateKey,
  generateCustomKey,
  generatePackageToken,
  buildDurationLabel,
  calcExpiresAt,
  getSecondsRemaining,
} from "./ffh4x-auth";

// ─── Password Hashing ─────────────────────────────────────────────────────────
describe("hashPassword / verifyPassword", () => {
  it("hashes password and verifies correctly", async () => {
    const hash = await hashPassword("RUAN00");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("RUAN00");
    const valid = await verifyPassword("RUAN00", hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("RUAN00");
    const invalid = await verifyPassword("wrongpass", hash);
    expect(invalid).toBe(false);
  });
});

// ─── JWT ──────────────────────────────────────────────────────────────────────
describe("signJwt / verifyJwt", () => {
  it("signs and verifies a JWT payload", async () => {
    const payload = { userId: 1, username: "RUAN", role: "admin" as const };
    const token = await signJwt(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // valid JWT structure

    const decoded = await verifyJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(1);
    expect(decoded?.username).toBe("RUAN");
    expect(decoded?.role).toBe("admin");
  });

  it("returns null for invalid token", async () => {
    const result = await verifyJwt("invalid.token.here");
    expect(result).toBeNull();
  });
});

// ─── Key Generation ───────────────────────────────────────────────────────────
describe("generateKey", () => {
  it("generates key in correct format PREFIX-DURATION-XXXXXXXXXXXXXXX", () => {
    const key = generateKey("FFH4X", "30day");
    expect(key).toMatch(/^FFH4X-30day-[A-Za-z0-9]{15}$/);
  });

  it("generates key with 1day duration", () => {
    const key = generateKey("TEST", "1day");
    expect(key).toMatch(/^TEST-1day-[A-Za-z0-9]{15}$/);
  });

  it("generates key with 7day duration", () => {
    const key = generateKey("MYAPP", "7day");
    expect(key).toMatch(/^MYAPP-7day-[A-Za-z0-9]{15}$/);
  });

  it("generates unique keys each time", () => {
    const key1 = generateKey("FFH4X", "30day");
    const key2 = generateKey("FFH4X", "30day");
    expect(key1).not.toBe(key2);
  });

  it("suffix has exactly 15 characters", () => {
    const key = generateKey("FFH4X", "30day");
    const parts = key.split("-");
    // FFH4X-30day-XXXXXXXXXXXXXXX → last part is 15 chars
    expect(parts[parts.length - 1].length).toBe(15);
  });
});

describe("generateCustomKey", () => {
  it("generates custom key with correct format", () => {
    const key = generateCustomKey("HAPPYBIRTHDAY", "3day");
    expect(key).toMatch(/^HAPPYBIRTHDAY-3day-[A-Za-z0-9]{15}$/);
  });
});

// ─── Package Token ────────────────────────────────────────────────────────────
describe("generatePackageToken", () => {
  it("generates a non-empty package token", () => {
    const token = generatePackageToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
  });

  it("generates unique tokens", () => {
    const t1 = generatePackageToken();
    const t2 = generatePackageToken();
    expect(t1).not.toBe(t2);
  });
});

// ─── Duration Helpers ─────────────────────────────────────────────────────────
describe("buildDurationLabel", () => {
  it("returns 1day for 1 day", () => {
    expect(buildDurationLabel(1)).toBe("1day");
  });

  it("returns 7day for 7 days", () => {
    expect(buildDurationLabel(7)).toBe("7day");
  });

  it("returns 30day for 30 days", () => {
    expect(buildDurationLabel(30)).toBe("30day");
  });

  it("returns custom label for other durations", () => {
    expect(buildDurationLabel(3)).toBe("3day");
    expect(buildDurationLabel(14)).toBe("14day");
    expect(buildDurationLabel(90)).toBe("90day");
  });
});

// ─── Expiry Calculation ───────────────────────────────────────────────────────
describe("calcExpiresAt", () => {
  it("calculates expiry correctly for 1 day", () => {
    const now = new Date();
    const expires = calcExpiresAt(now, 1);
    const diff = expires.getTime() - now.getTime();
    expect(diff).toBeCloseTo(86400000, -3); // ~1 day in ms
  });

  it("calculates expiry correctly for 30 days", () => {
    const now = new Date();
    const expires = calcExpiresAt(now, 30);
    const diff = expires.getTime() - now.getTime();
    expect(diff).toBeCloseTo(30 * 86400000, -3);
  });
});

describe("getSecondsRemaining", () => {
  it("returns positive seconds for future date", () => {
    const future = new Date(Date.now() + 3600000); // 1 hour from now
    const secs = getSecondsRemaining(future);
    expect(secs).toBeGreaterThan(3500);
    expect(secs).toBeLessThanOrEqual(3600);
  });

  it("returns 0 for past date", () => {
    const past = new Date(Date.now() - 1000);
    const secs = getSecondsRemaining(past);
    expect(secs).toBe(0);
  });
});
