import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── App Users (sistema próprio, não Manus OAuth) ───────────────────────────
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "reseller"]).default("reseller").notNull(),
  plan: mysqlEnum("plan", ["monthly", "annual"]).default("monthly"),
  credits: int("credits").default(0).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpiresAt: timestamp("ban_expires_at"),
  accountExpiresAt: timestamp("account_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 64 }),
});

// ─── Manus OAuth users (mantido para compatibilidade com o template) ─────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Packages ────────────────────────────────────────────────────────────────
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  ownerId: int("owner_id"), // null = admin-owned
  isPaused: boolean("is_paused").default(false).notNull(),
  forceUpdate: boolean("force_update").default(false).notNull(),
  updateMessage: text("update_message"),
  contactLink: varchar("contact_link", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Prefixes ────────────────────────────────────────────────────────────────
export const prefixes = mysqlTable("prefixes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  ownerId: int("owner_id"), // null = admin-owned
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Keys ────────────────────────────────────────────────────────────────────
export const licenseKeys = mysqlTable("license_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  prefix: varchar("prefix", { length: 64 }).notNull(),
  duration: varchar("duration", { length: 32 }).notNull(), // e.g. "1day", "7day", "30day", "3day"
  durationDays: int("duration_days").notNull(),
  packageId: int("package_id").notNull(),
  ownerId: int("owner_id"), // reseller who created it, null = admin
  maxDevices: int("max_devices").default(1).notNull(),
  isActivated: boolean("is_activated").default(false).notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  isUniversal: boolean("is_universal").default(false).notNull(),
  isPaused: boolean("is_paused").default(false).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"),
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Devices (HWID) ──────────────────────────────────────────────────────────
export const devices = mysqlTable("devices", {
  id: int("id").autoincrement().primaryKey(),
  keyId: int("key_id").notNull(),
  hwid: varchar("hwid", { length: 255 }).notNull(),
  isBanned: boolean("is_banned").default(false).notNull(),
  banReason: text("ban_reason"),
  firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Logs ────────────────────────────────────────────────────────────────────
export const logs = mysqlTable("logs", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "login",
    "logout",
    "key_activation",
    "key_validation",
    "key_created",
    "key_banned",
    "key_unbanned",
    "key_paused",
    "key_deleted",
    "key_days_added",
    "user_created",
    "user_banned",
    "user_unbanned",
    "package_created",
    "package_paused",
    "package_update_forced",
    "credits_added",
    "api_error",
    "admin_action",
  ]).notNull(),
  message: text("message").notNull(),
  userId: int("user_id"), // app_user who performed the action
  keyId: int("key_id"),
  packageId: int("package_id"),
  ip: varchar("ip", { length: 64 }),
  metadata: text("metadata"), // JSON string for extra data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Credits Transactions ────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(), // reseller receiving/spending credits
  adminId: int("admin_id"), // admin who added credits (null if spent)
  amount: int("amount").notNull(), // positive = added, negative = spent
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Types ───────────────────────────────────────────────────────────────────
export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;
export type Prefix = typeof prefixes.$inferSelect;
export type InsertPrefix = typeof prefixes.$inferInsert;
export type LicenseKey = typeof licenseKeys.$inferSelect;
export type InsertLicenseKey = typeof licenseKeys.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type InsertLog = typeof logs.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
