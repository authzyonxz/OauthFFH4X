import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  hashPassword, verifyPassword, signJwt, verifyJwt,
  generateKey, generateCustomKey, generatePackageToken,
  parseDuration, buildDurationLabel, calcExpiresAt, getSecondsRemaining,
} from "./ffh4x-auth";
import {
  getAppUserByUsername, getAppUserById, createAppUser, updateAppUser,
  listAppUsers, updateAppUserLastLogin,
  createPackage, getPackageById, listPackages, updatePackage,
  createPrefix, listPrefixes, deletePrefix,
  createLicenseKey, getLicenseKeyByKey, getLicenseKeyById, listLicenseKeys,
  updateLicenseKey, deleteLicenseKey,
  listDevicesForKey, updateDevice,
  createLog, listLogs, countLogs,
  addCredits, spendCredit, listCreditTransactions,
  getDashboardStats,
} from "./db";

// ─── Custom JWT middleware ─────────────────────────────────────────────────────
const ffhAuthProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.cookies?.["ffh4x_token"] || ctx.req.headers["x-ffh4x-token"] as string;
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token não fornecido" });
  const payload = await verifyJwt(token);
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou expirado" });
  const user = await getAppUserById(payload.userId);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não encontrado" });
  if (user.isBanned) throw new TRPCError({ code: "FORBIDDEN", message: "Conta banida" });
  return next({ ctx: { ...ctx, ffhUser: user } });
});

const adminProcedure = ffhAuthProcedure.use(async ({ ctx, next }) => {
  if ((ctx as any).ffhUser.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

const resellerOrAdminProcedure = ffhAuthProcedure;

// ─── Auth Router ──────────────────────────────────────────────────────────────
const authRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers["x-forwarded-for"] as string || ctx.req.socket?.remoteAddress || "unknown";
      const user = await getAppUserByUsername(input.username);
      if (!user) {
        await createLog({ type: "login", message: `Tentativa de login falhou: usuário '${input.username}' não encontrado`, ip });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
      }
      if (user.isBanned) {
        await createLog({ type: "login", message: `Login bloqueado: usuário '${user.username}' está banido`, userId: user.id, ip });
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta banida" });
      }
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) {
        await createLog({ type: "login", message: `Senha incorreta para usuário '${user.username}'`, userId: user.id, ip });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
      }
      await updateAppUserLastLogin(user.id, ip);
      const token = await signJwt({ userId: user.id, username: user.username, role: user.role });
      await createLog({ type: "login", message: `Login bem-sucedido: ${user.username} (${user.role})`, userId: user.id, ip });
      ctx.res.cookie("ffh4x_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 86400000,
        path: "/",
      });
      return { success: true, token, user: { id: user.id, username: user.username, role: user.role, credits: user.credits } };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie("ffh4x_token", { path: "/" });
    return { success: true };
  }),

  me: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.["ffh4x_token"] || ctx.req.headers["x-ffh4x-token"] as string;
    if (!token) return null;
    const payload = await verifyJwt(token);
    if (!payload) return null;
    const user = await getAppUserById(payload.userId);
    if (!user || user.isBanned) return null;
    return { id: user.id, username: user.username, role: user.role, credits: user.credits, plan: user.plan, accountExpiresAt: user.accountExpiresAt };
  }),
});

// ─── Dashboard Router ─────────────────────────────────────────────────────────
const dashboardRouter = router({
  stats: ffhAuthProcedure.query(async ({ ctx }) => {
    const ffhUser = (ctx as any).ffhUser;
    if (ffhUser.role === "admin") {
      const stats = await getDashboardStats();
      const recentLogs = await listLogs(10);
      return { ...stats, recentLogs };
    }
    // Reseller: only their own stats
    const myKeys = await listLicenseKeys(ffhUser.id);
    const myPackages = await listPackages(ffhUser.id);
    const now = new Date();
    const activeKeys = myKeys.filter(k => k.isActivated && k.expiresAt && k.expiresAt > now && !k.isBanned && !k.isPaused).length;
    const expiredKeys = myKeys.filter(k => k.isActivated && k.expiresAt && k.expiresAt <= now).length;
    return {
      totalKeys: myKeys.length,
      activeKeys,
      expiredKeys,
      totalPackages: myPackages.length,
      credits: ffhUser.credits,
      recentLogs: [],
    };
  }),
});

// ─── Users Router (Admin only) ────────────────────────────────────────────────
const usersRouter = router({
  list: adminProcedure.query(async () => {
    const users = await listAppUsers();
    return users.map(u => ({ ...u, passwordHash: undefined }));
  }),

  create: adminProcedure
    .input(z.object({
      username: z.string().min(3).max(64),
      password: z.string().min(4),
      role: z.enum(["admin", "reseller"]).default("reseller"),
      plan: z.enum(["monthly", "annual"]).optional(),
      accountExpiresAt: z.string().optional(),
      credits: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      const existing = await getAppUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Usuário já existe" });
      const passwordHash = await hashPassword(input.password);
      const user = await createAppUser({
        username: input.username,
        passwordHash,
        role: input.role,
        plan: input.plan,
        credits: input.credits,
        accountExpiresAt: input.accountExpiresAt ? new Date(input.accountExpiresAt) : undefined,
      });
      await createLog({ type: "user_created", message: `Usuário '${input.username}' criado por admin`, userId: ffhUser.id });
      return { ...user, passwordHash: undefined };
    }),

  ban: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional(), banExpiresAt: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      await updateAppUser(input.userId, {
        isBanned: true,
        banReason: input.reason,
        banExpiresAt: input.banExpiresAt ? new Date(input.banExpiresAt) : undefined,
      });
      await createLog({ type: "user_banned", message: `Usuário ID ${input.userId} banido. Motivo: ${input.reason || "N/A"}`, userId: ffhUser.id });
      return { success: true };
    }),

  unban: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      await updateAppUser(input.userId, { isBanned: false, banReason: null, banExpiresAt: null });
      await createLog({ type: "user_unbanned", message: `Usuário ID ${input.userId} desbanido`, userId: ffhUser.id });
      return { success: true };
    }),

  changePassword: adminProcedure
    .input(z.object({ userId: z.number(), newPassword: z.string().min(4) }))
    .mutation(async ({ input }) => {
      const passwordHash = await hashPassword(input.newPassword);
      await updateAppUser(input.userId, { passwordHash });
      return { success: true };
    }),

  getKeys: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return listLicenseKeys(input.userId);
    }),

  addCredits: adminProcedure
    .input(z.object({ userId: z.number(), amount: z.number().int().min(1), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      await addCredits(input.userId, ffhUser.id, input.amount, input.reason);
      await createLog({ type: "credits_added", message: `${input.amount} créditos adicionados ao usuário ID ${input.userId}`, userId: ffhUser.id });
      return { success: true };
    }),

  creditHistory: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return listCreditTransactions(input.userId);
    }),
});

// ─── Packages Router ──────────────────────────────────────────────────────────
const packagesRouter = router({
  list: resellerOrAdminProcedure.query(async ({ ctx }) => {
    const ffhUser = (ctx as any).ffhUser;
    if (ffhUser.role === "admin") return listPackages();
    return listPackages(ffhUser.id);
  }),

  create: resellerOrAdminProcedure
    .input(z.object({ name: z.string().min(2).max(128) }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      if (ffhUser.role === "reseller") {
        const existing = await listPackages(ffhUser.id);
        if (existing.length >= 3) throw new TRPCError({ code: "FORBIDDEN", message: "Limite de 3 packages atingido" });
      }
      const token = generatePackageToken();
      const pkg = await createPackage({
        name: input.name,
        token,
        ownerId: ffhUser.role === "admin" ? null : ffhUser.id,
      });
      await createLog({ type: "package_created", message: `Package '${input.name}' criado`, userId: ffhUser.id, packageId: pkg?.id });
      return pkg;
    }),

  update: resellerOrAdminProcedure
    .input(z.object({
      packageId: z.number(),
      isPaused: z.boolean().optional(),
      forceUpdate: z.boolean().optional(),
      updateMessage: z.string().optional(),
      contactLink: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      const pkg = await getPackageById(input.packageId);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package não encontrado" });
      if (ffhUser.role !== "admin" && pkg.ownerId !== ffhUser.id) throw new TRPCError({ code: "FORBIDDEN" });
      const data: any = {};
      if (input.isPaused !== undefined) data.isPaused = input.isPaused;
      if (input.forceUpdate !== undefined) data.forceUpdate = input.forceUpdate;
      if (input.updateMessage !== undefined) data.updateMessage = input.updateMessage;
      if (input.contactLink !== undefined) data.contactLink = input.contactLink;
      await updatePackage(input.packageId, data);
      if (input.isPaused !== undefined) {
        await createLog({ type: "package_paused", message: `Package '${pkg.name}' ${input.isPaused ? "pausado" : "reativado"}`, userId: ffhUser.id, packageId: pkg.id });
      }
      if (input.forceUpdate) {
        await createLog({ type: "package_update_forced", message: `Atualização forçada no package '${pkg.name}'`, userId: ffhUser.id, packageId: pkg.id });
      }
      return { success: true };
    }),
});

// ─── Prefixes Router ──────────────────────────────────────────────────────────
const prefixesRouter = router({
  list: resellerOrAdminProcedure.query(async ({ ctx }) => {
    const ffhUser = (ctx as any).ffhUser;
    if (ffhUser.role === "admin") return listPrefixes();
    return listPrefixes(ffhUser.id);
  }),

  create: resellerOrAdminProcedure
    .input(z.object({ name: z.string().min(2).max(64).regex(/^[A-Z0-9_]+$/i, "Apenas letras, números e _") }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      if (ffhUser.role === "reseller") {
        const existing = await listPrefixes(ffhUser.id);
        if (existing.length >= 3) throw new TRPCError({ code: "FORBIDDEN", message: "Limite de 3 prefixos atingido" });
      }
      const prefix = await createPrefix({
        name: input.name.toUpperCase(),
        ownerId: ffhUser.role === "admin" ? null : ffhUser.id,
      });
      return prefix;
    }),

  delete: resellerOrAdminProcedure
    .input(z.object({ prefixId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      const allPrefixes = await listPrefixes(ffhUser.role === "admin" ? undefined : ffhUser.id);
      const found = allPrefixes.find(p => p.id === input.prefixId);
      if (!found) throw new TRPCError({ code: "NOT_FOUND" });
      await deletePrefix(input.prefixId);
      return { success: true };
    }),
});

// ─── Keys Router ──────────────────────────────────────────────────────────────
const keysRouter = router({
  list: resellerOrAdminProcedure.query(async ({ ctx }) => {
    const ffhUser = (ctx as any).ffhUser;
    const keys = ffhUser.role === "admin" ? await listLicenseKeys() : await listLicenseKeys(ffhUser.id);
    const now = new Date();
    return keys.map(k => ({
      ...k,
      status: !k.isActivated ? "inactive" : k.isBanned ? "banned" : k.isPaused ? "paused" : k.expiresAt && k.expiresAt <= now ? "expired" : "active",
      secondsRemaining: k.expiresAt ? getSecondsRemaining(k.expiresAt) : null,
    }));
  }),

  create: resellerOrAdminProcedure
    .input(z.object({
      prefix: z.string().min(1),
      packageId: z.number(),
      durationDays: z.number().int().min(1),
      maxDevices: z.number().int().min(1).default(1),
      customSuffix: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      if (ffhUser.role === "reseller") {
        if (input.customSuffix) throw new TRPCError({ code: "FORBIDDEN", message: "Revendedores não podem criar keys personalizadas" });
        if (ffhUser.credits <= 0) throw new TRPCError({ code: "FORBIDDEN", message: "Créditos insuficientes" });
      }
      const pkg = await getPackageById(input.packageId);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package não encontrado" });
      if (ffhUser.role !== "admin" && pkg.ownerId !== ffhUser.id) throw new TRPCError({ code: "FORBIDDEN", message: "Package não pertence a você" });
      const duration = buildDurationLabel(input.durationDays);
      const keyStr = input.customSuffix
        ? generateCustomKey(input.customSuffix, duration)
        : generateKey(input.prefix, duration);
      const key = await createLicenseKey({
        key: keyStr,
        prefix: input.prefix.toUpperCase(),
        duration,
        durationDays: input.durationDays,
        packageId: input.packageId,
        ownerId: ffhUser.role === "admin" ? null : ffhUser.id,
        maxDevices: input.maxDevices,
        isCustom: !!input.customSuffix,
      });
      if (ffhUser.role === "reseller") await spendCredit(ffhUser.id);
      await createLog({ type: "key_created", message: `Key criada: ${keyStr}`, userId: ffhUser.id, keyId: key?.id });
      return key;
    }),

  createBulk: resellerOrAdminProcedure
    .input(z.object({
      prefix: z.string().min(1),
      packageId: z.number(),
      durationDays: z.number().int().min(1),
      maxDevices: z.number().int().min(1).default(1),
      count: z.number().int().min(1).max(100).default(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      if (ffhUser.role === "reseller") {
        if (ffhUser.credits < input.count) throw new TRPCError({ code: "FORBIDDEN", message: `Créditos insuficientes para gerar ${input.count} keys` });
      }
      const pkg = await getPackageById(input.packageId);
      if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Package não encontrado" });
      if (ffhUser.role !== "admin" && pkg.ownerId !== ffhUser.id) throw new TRPCError({ code: "FORBIDDEN", message: "Package não pertence a você" });
      
      const duration = buildDurationLabel(input.durationDays);
      const createdKeys = [];
      
      for (let i = 0; i < input.count; i++) {
        const keyStr = generateKey(input.prefix, duration);
        const key = await createLicenseKey({
          key: keyStr,
          prefix: input.prefix.toUpperCase(),
          duration,
          durationDays: input.durationDays,
          packageId: input.packageId,
          ownerId: ffhUser.role === "admin" ? null : ffhUser.id,
          maxDevices: input.maxDevices,
          isCustom: false,
        });
        if (ffhUser.role === "reseller") await spendCredit(ffhUser.id);
        createdKeys.push(keyStr);
      }
      
      await createLog({ 
        type: "key_created", 
        message: `${input.count} keys criadas em massa pelo prefixo ${input.prefix}`, 
        userId: ffhUser.id 
      });
      
      return { keys: createdKeys };
    }),

  action: resellerOrAdminProcedure
    .input(z.object({
      keyId: z.number(),
      action: z.enum(["pause", "unpause", "ban", "unban", "delete", "add_days"]),
      reason: z.string().optional(),
      days: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      const key = await getLicenseKeyById(input.keyId);
      if (!key) throw new TRPCError({ code: "NOT_FOUND", message: "Key não encontrada" });
      if (ffhUser.role !== "admin" && key.ownerId !== ffhUser.id) throw new TRPCError({ code: "FORBIDDEN" });

      switch (input.action) {
        case "pause":
          await updateLicenseKey(input.keyId, { isPaused: true });
          await createLog({ type: "key_paused", message: `Key ${key.key} pausada`, userId: ffhUser.id, keyId: key.id });
          break;
        case "unpause":
          await updateLicenseKey(input.keyId, { isPaused: false });
          await createLog({ type: "key_paused", message: `Key ${key.key} reativada`, userId: ffhUser.id, keyId: key.id });
          break;
        case "ban":
          await updateLicenseKey(input.keyId, { isBanned: true, banReason: input.reason });
          await createLog({ type: "key_banned", message: `Key ${key.key} banida. Motivo: ${input.reason || "N/A"}`, userId: ffhUser.id, keyId: key.id });
          break;
        case "unban":
          await updateLicenseKey(input.keyId, { isBanned: false, banReason: null });
          await createLog({ type: "key_unbanned", message: `Key ${key.key} desbanida`, userId: ffhUser.id, keyId: key.id });
          break;
        case "delete":
          await deleteLicenseKey(input.keyId);
          await createLog({ type: "key_deleted", message: `Key ${key.key} excluída`, userId: ffhUser.id, keyId: key.id });
          break;
        case "add_days":
          if (!input.days) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o número de dias" });
          const newExpires = key.expiresAt
            ? new Date(key.expiresAt.getTime() + input.days * 86400000)
            : null;
          await updateLicenseKey(input.keyId, { expiresAt: newExpires || undefined });
          await createLog({ type: "key_days_added", message: `${input.days} dias adicionados à key ${key.key}`, userId: ffhUser.id, keyId: key.id });
          break;
      }
      return { success: true };
    }),

  getDevices: resellerOrAdminProcedure
    .input(z.object({ keyId: z.number() }))
    .query(async ({ input, ctx }) => {
      const ffhUser = (ctx as any).ffhUser;
      const key = await getLicenseKeyById(input.keyId);
      if (!key) throw new TRPCError({ code: "NOT_FOUND" });
      if (ffhUser.role !== "admin" && key.ownerId !== ffhUser.id) throw new TRPCError({ code: "FORBIDDEN" });
      return listDevicesForKey(input.keyId);
    }),

  banDevice: adminProcedure
    .input(z.object({ deviceId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateDevice(input.deviceId, { isBanned: true, banReason: input.reason });
      return { success: true };
    }),
});

// ─── Credits Router ─────────────────────────────────────────────────────────
const creditsRouter = router({
  history: adminProcedure.query(async () => {
    const db = await (await import('./db')).getDb();
    if (!db) return [];
    const { creditTransactions, appUsers } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const txs = await db.select({
      id: creditTransactions.id,
      userId: creditTransactions.userId,
      amount: creditTransactions.amount,
      reason: creditTransactions.reason,
      createdAt: creditTransactions.createdAt,
      username: appUsers.username,
    }).from(creditTransactions)
      .leftJoin(appUsers, eq(creditTransactions.userId, appUsers.id))
      .orderBy(creditTransactions.id)
      .limit(200);
    return txs;
  }),
});

// ─── Logs Router ──────────────────────────────────────────────────────────────
const logsRouter = router({
  list: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50), offset: z.number().int().min(0).default(0), type: z.string().optional() }))
    .query(async ({ input }) => {
      const [items, total] = await Promise.all([
        listLogs(input.limit, input.offset, input.type),
        countLogs(input.type),
      ]);
      return { items, total };
    }),
});

// ─── Main App Router ──────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  ffhAuth: authRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
  packages: packagesRouter,
  prefixes: prefixesRouter,
  keys: keysRouter,
  logs: logsRouter,
  credits: creditsRouter,
});

export type AppRouter = typeof appRouter;
