import { eq, and, desc, sql, like, or, gte, lte, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  appUsers,
  packages,
  prefixes,
  licenseKeys,
  devices,
  logs,
  creditTransactions,
  InsertUser,
  InsertAppUser,
  InsertPackage,
  InsertPrefix,
  InsertLicenseKey,
  InsertLog,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Manus OAuth Users (template compat) ─────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const f of textFields) {
    if (user[f] !== undefined) { values[f] = user[f] ?? null; updateSet[f] = user[f] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── App Users ────────────────────────────────────────────────────────────────
export async function getAppUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.username, username)).limit(1);
  return result[0];
}

export async function getAppUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result[0];
}

export async function createAppUser(data: InsertAppUser) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(appUsers).values(data);
  return getAppUserByUsername(data.username);
}

export async function updateAppUser(id: number, data: Partial<InsertAppUser>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(appUsers).set(data).where(eq(appUsers.id, id));
}

export async function listAppUsers(role?: "admin" | "reseller") {
  const db = await getDb();
  if (!db) return [];
  if (role) return db.select().from(appUsers).where(eq(appUsers.role, role)).orderBy(desc(appUsers.createdAt));
  return db.select().from(appUsers).orderBy(desc(appUsers.createdAt));
}

export async function updateAppUserLastLogin(id: number, ip: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(appUsers).set({ lastLoginAt: new Date(), lastLoginIp: ip }).where(eq(appUsers.id, id));
}

// ─── Packages ─────────────────────────────────────────────────────────────────
export async function createPackage(data: InsertPackage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(packages).values(data);
  const result = await db.select().from(packages).where(eq(packages.token, data.token!)).limit(1);
  return result[0];
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result[0];
}

export async function getPackageByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.token, token)).limit(1);
  return result[0];
}

export async function listPackages(ownerId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId !== undefined) {
    return db.select().from(packages).where(eq(packages.ownerId, ownerId!)).orderBy(desc(packages.createdAt));
  }
  return db.select().from(packages).orderBy(desc(packages.createdAt));
}

export async function updatePackage(id: number, data: Partial<InsertPackage>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(packages).set(data).where(eq(packages.id, id));
}

// ─── Prefixes ─────────────────────────────────────────────────────────────────
export async function createPrefix(data: InsertPrefix) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(prefixes).values(data);
  const result = await db.select().from(prefixes).where(and(eq(prefixes.name, data.name), ownerId(data.ownerId))).limit(1);
  return result[0];
}

function ownerId(id?: number | null) {
  if (id == null) return isNull(prefixes.ownerId);
  return eq(prefixes.ownerId, id);
}

export async function listPrefixes(ownerId?: number | null) {
  const db = await getDb();
  if (!db) return [];
  if (ownerId !== undefined) {
    return db.select().from(prefixes).where(eq(prefixes.ownerId, ownerId!)).orderBy(desc(prefixes.createdAt));
  }
  return db.select().from(prefixes).orderBy(desc(prefixes.createdAt));
}

export async function deletePrefix(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(prefixes).where(eq(prefixes.id, id));
}

// ─── License Keys ─────────────────────────────────────────────────────────────
export async function createLicenseKey(data: InsertLicenseKey) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(licenseKeys).values(data);
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.key, data.key)).limit(1);
  return result[0];
}

export async function getLicenseKeyByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.key, key)).limit(1);
  return result[0];
}

export async function getLicenseKeyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(licenseKeys).where(eq(licenseKeys.id, id)).limit(1);
  return result[0];
}

export async function listLicenseKeys(ownerId?: number | null, packageId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (ownerId !== undefined) conditions.push(eq(licenseKeys.ownerId, ownerId!));
  if (packageId !== undefined) conditions.push(eq(licenseKeys.packageId, packageId));
  if (conditions.length > 0) {
    return db.select().from(licenseKeys).where(and(...conditions)).orderBy(desc(licenseKeys.createdAt));
  }
  return db.select().from(licenseKeys).orderBy(desc(licenseKeys.createdAt));
}

export async function updateLicenseKey(id: number, data: Partial<InsertLicenseKey>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(licenseKeys).set(data).where(eq(licenseKeys.id, id));
}

export async function deleteLicenseKey(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(licenseKeys).where(eq(licenseKeys.id, id));
}

// ─── Devices ──────────────────────────────────────────────────────────────────
export async function getDeviceByKeyAndHwid(keyId: number, hwid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(and(eq(devices.keyId, keyId), eq(devices.hwid, hwid))).limit(1);
  return result[0];
}

export async function countDevicesForKey(keyId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(devices).where(eq(devices.keyId, keyId));
  return Number(result[0]?.count ?? 0);
}

export async function createDevice(keyId: number, hwid: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(devices).values({ keyId, hwid });
  return getDeviceByKeyAndHwid(keyId, hwid);
}

export async function updateDevice(id: number, data: { isBanned?: boolean; banReason?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(devices).set(data).where(eq(devices.id, id));
}

export async function listDevicesForKey(keyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(devices).where(eq(devices.keyId, keyId));
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
export async function createLog(data: InsertLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(logs).values(data);
}

export async function listLogs(limit = 50, offset = 0, type?: string) {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return db.select().from(logs).where(eq(logs.type, type as any)).orderBy(desc(logs.createdAt)).limit(limit).offset(offset);
  }
  return db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit).offset(offset);
}

export async function countLogs(type?: string) {
  const db = await getDb();
  if (!db) return 0;
  let q;
  if (type) {
    q = db.select({ count: sql<number>`count(*)` }).from(logs).where(eq(logs.type, type as any));
  } else {
    q = db.select({ count: sql<number>`count(*)` }).from(logs);
  }
  const result = await q;
  return Number(result[0]?.count ?? 0);
}

// ─── Credits ──────────────────────────────────────────────────────────────────
export async function addCredits(userId: number, adminId: number, amount: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(creditTransactions).values({ userId, adminId, amount, reason });
  await db.update(appUsers).set({ credits: sql`credits + ${amount}` }).where(eq(appUsers.id, userId));
}

export async function spendCredit(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(creditTransactions).values({ userId, amount: -1, reason: "key_created" });
  await db.update(appUsers).set({ credits: sql`credits - 1` }).where(eq(appUsers.id, userId));
}

export async function listCreditTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)).orderBy(desc(creditTransactions.createdAt));
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalKeys: 0, activeKeys: 0, expiredKeys: 0, activeUsers: 0, totalPackages: 0 };
  const now = new Date();
  const [totalKeysRes, activeKeysRes, expiredKeysRes, activeUsersRes, totalPackagesRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(licenseKeys),
    db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(and(eq(licenseKeys.isActivated, true), gte(licenseKeys.expiresAt, now), eq(licenseKeys.isBanned, false), eq(licenseKeys.isPaused, false))),
    db.select({ count: sql<number>`count(*)` }).from(licenseKeys).where(and(eq(licenseKeys.isActivated, true), lte(licenseKeys.expiresAt, now))),
    db.select({ count: sql<number>`count(*)` }).from(appUsers).where(eq(appUsers.isBanned, false)),
    db.select({ count: sql<number>`count(*)` }).from(packages),
  ]);
  return {
    totalKeys: Number(totalKeysRes[0]?.count ?? 0),
    activeKeys: Number(activeKeysRes[0]?.count ?? 0),
    expiredKeys: Number(expiredKeysRes[0]?.count ?? 0),
    activeUsers: Number(activeUsersRes[0]?.count ?? 0),
    totalPackages: Number(totalPackagesRes[0]?.count ?? 0),
  };
}
