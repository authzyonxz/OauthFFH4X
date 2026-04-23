import { Router, Request, Response } from "express";
import {
  getLicenseKeyByKey, getPackageByToken, getPackageById,
  getDeviceByKeyAndHwid, countDevicesForKey, createDevice,
  updateLicenseKey, createLog,
  getAppUserByUsername,
  updateAppUserLastLogin,
} from "./db";
import {
  verifyPassword, signJwt, calcExpiresAt, getSecondsRemaining,
} from "./ffh4x-auth";

const router = Router();

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string, max = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > max) return false;
  return true;
}

function getIp(req: Request): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function apiResponse(res: Response, status: number, data: object) {
  return res.status(status).json(data);
}

// ─── POST /v1/login ───────────────────────────────────────────────────────────
router.post("/v1/login", async (req: Request, res: Response) => {
  const ip = getIp(req);
  if (!rateLimit(ip, 10, 60000)) {
    return apiResponse(res, 429, { status: "error", message: "Muitas tentativas. Aguarde.", expires_in: 0, device: "unknown" });
  }
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return apiResponse(res, 400, { status: "error", message: "Usuário e senha são obrigatórios", expires_in: 0, device: "unknown" });
    }
    const user = await getAppUserByUsername(username);
    if (!user) {
      await createLog({ type: "login", message: `API login falhou: usuário '${username}' não encontrado`, ip });
      return apiResponse(res, 401, { status: "error", message: "Credenciais inválidas", expires_in: 0, device: "unauthorized" });
    }
    if (user.isBanned) {
      return apiResponse(res, 403, { status: "banned", message: `Conta banida: ${user.banReason || "sem motivo"}`, expires_in: 0, device: "banned" });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      await createLog({ type: "login", message: `API login falhou: senha incorreta para '${username}'`, userId: user.id, ip });
      return apiResponse(res, 401, { status: "error", message: "Credenciais inválidas", expires_in: 0, device: "unauthorized" });
    }
    await updateAppUserLastLogin(user.id, ip);
    const token = await signJwt({ userId: user.id, username: user.username, role: user.role });
    await createLog({ type: "login", message: `API login: ${user.username}`, userId: user.id, ip });
    return apiResponse(res, 200, {
      status: "success",
      message: "Login realizado com sucesso",
      token,
      expires_in: 86400,
      device: "authorized",
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    await createLog({ type: "api_error", message: `Erro em /v1/login: ${String(err)}`, ip });
    return apiResponse(res, 500, { status: "error", message: "Erro interno do servidor", expires_in: 0, device: "unknown" });
  }
});

// ─── POST /v1/validate_key ────────────────────────────────────────────────────
router.post("/v1/validate_key", async (req: Request, res: Response) => {
  const ip = getIp(req);
  if (!rateLimit(ip, 60, 60000)) {
    return apiResponse(res, 429, { status: "error", message: "Rate limit excedido", expires_in: 0, device: "unknown" });
  }
  try {
    const { key: keyStr, hwid, package_token } = req.body || {};
    if (!keyStr || !hwid) {
      return apiResponse(res, 400, { status: "error", message: "key e hwid são obrigatórios", expires_in: 0, device: "unknown" });
    }

    const key = await getLicenseKeyByKey(keyStr);
    if (!key) {
      await createLog({ type: "key_validation", message: `Key inválida: ${keyStr}`, ip, metadata: JSON.stringify({ hwid }) });
      return apiResponse(res, 404, { status: "invalid", message: "Key inválida", expires_in: 0, device: "unauthorized" });
    }

    // Check package if provided
    if (package_token) {
      const pkg = await getPackageByToken(package_token);
      if (!pkg || pkg.id !== key.packageId) {
        return apiResponse(res, 403, { status: "invalid", message: "Key não pertence a este package", expires_in: 0, device: "unauthorized" });
      }
      if (pkg.isPaused) {
        return apiResponse(res, 403, { status: "paused", message: "Sistema pausado", expires_in: 0, device: "unauthorized" });
      }
      if (pkg.forceUpdate) {
        return apiResponse(res, 426, { status: "update_required", message: pkg.updateMessage || "Nova atualização disponível", expires_in: 0, device: "unauthorized" });
      }
    }

    if (key.isBanned) {
      return apiResponse(res, 403, { status: "banned", message: `Key banida: ${key.banReason || "sem motivo"}`, expires_in: 0, device: "banned" });
    }
    if (key.isPaused) {
      return apiResponse(res, 403, { status: "paused", message: "Key pausada", expires_in: 0, device: "unauthorized" });
    }

    // First activation
    if (!key.isActivated) {
      const now = new Date();
      const expiresAt = calcExpiresAt(now, key.durationDays);
      await updateLicenseKey(key.id, { isActivated: true, activatedAt: now, expiresAt });
      const device = await createDevice(key.id, hwid);
      await createLog({ type: "key_activation", message: `Key ativada: ${keyStr} | HWID: ${hwid}`, keyId: key.id, ip, metadata: JSON.stringify({ hwid }) });
      return apiResponse(res, 200, {
        status: "success",
        message: "Key ativada com sucesso",
        expires_in: getSecondsRemaining(expiresAt),
        device: "authorized",
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });
    }

    // Already activated — check expiry
    const now = new Date();
    if (key.expiresAt && key.expiresAt <= now) {
      return apiResponse(res, 403, { status: "expired", message: "Key expirada", expires_in: 0, device: "unauthorized" });
    }

    // Check HWID
    let device = await getDeviceByKeyAndHwid(key.id, hwid);
    if (!device) {
      const deviceCount = await countDevicesForKey(key.id);
      if (deviceCount >= key.maxDevices) {
        await createLog({ type: "key_validation", message: `Key ${keyStr}: dispositivo não autorizado (limite atingido)`, keyId: key.id, ip, metadata: JSON.stringify({ hwid }) });
        return apiResponse(res, 403, { status: "device_limit", message: "Limite de dispositivos atingido", expires_in: 0, device: "unauthorized" });
      }
      device = await createDevice(key.id, hwid);
    }

    if (device?.isBanned) {
      return apiResponse(res, 403, { status: "banned", message: `Dispositivo banido: ${device.banReason || "sem motivo"}`, expires_in: 0, device: "banned" });
    }

    await createLog({ type: "key_validation", message: `Key validada: ${keyStr} | HWID: ${hwid}`, keyId: key.id, ip, metadata: JSON.stringify({ hwid }) });
    return apiResponse(res, 200, {
      status: "success",
      message: "Key válida",
      expires_in: key.expiresAt ? getSecondsRemaining(key.expiresAt) : 0,
      device: "authorized",
      activated_at: key.activatedAt?.toISOString(),
      expires_at: key.expiresAt?.toISOString(),
    });
  } catch (err) {
    await createLog({ type: "api_error", message: `Erro em /v1/validate_key: ${String(err)}`, ip });
    return apiResponse(res, 500, { status: "error", message: "Erro interno do servidor", expires_in: 0, device: "unknown" });
  }
});

// ─── GET /v1/package_status ───────────────────────────────────────────────────
router.get("/v1/package_status", async (req: Request, res: Response) => {
  const ip = getIp(req);
  try {
    const token = (req.query.token || req.headers["x-package-token"]) as string;
    if (!token) {
      return apiResponse(res, 400, { status: "error", message: "Token do package é obrigatório", expires_in: 0, device: "unknown" });
    }
    const pkg = await getPackageByToken(token);
    if (!pkg) {
      return apiResponse(res, 404, { status: "error", message: "Package não encontrado", expires_in: 0, device: "unknown" });
    }
    if (pkg.isPaused) {
      return apiResponse(res, 200, {
        status: "paused",
        message: "Sistema pausado",
        expires_in: 0,
        device: "unknown",
        contact: pkg.contactLink,
      });
    }
    if (pkg.forceUpdate) {
      return apiResponse(res, 200, {
        status: "update_required",
        message: pkg.updateMessage || "Nova atualização disponível",
        expires_in: 0,
        device: "unknown",
        contact: pkg.contactLink,
      });
    }
    return apiResponse(res, 200, {
      status: "online",
      message: "Sistema online",
      expires_in: 0,
      device: "unknown",
      package_name: pkg.name,
      contact: pkg.contactLink,
    });
  } catch (err) {
    await createLog({ type: "api_error", message: `Erro em /v1/package_status: ${String(err)}`, ip });
    return apiResponse(res, 500, { status: "error", message: "Erro interno do servidor", expires_in: 0, device: "unknown" });
  }
});

// ─── GET /v1/message ──────────────────────────────────────────────────────────
router.get("/v1/message", async (req: Request, res: Response) => {
  try {
    const token = (req.query.token || req.headers["x-package-token"]) as string;
    if (!token) {
      return apiResponse(res, 200, {
        status: "success",
        message: "AUTH FFH4X – Sistema de autenticação ativo",
        expires_in: 0,
        device: "unknown",
      });
    }
    const pkg = await getPackageByToken(token);
    if (!pkg) {
      return apiResponse(res, 200, { status: "success", message: "AUTH FFH4X", expires_in: 0, device: "unknown" });
    }
    return apiResponse(res, 200, {
      status: "success",
      message: pkg.isPaused ? "Sistema pausado" : pkg.forceUpdate ? (pkg.updateMessage || "Nova atualização disponível") : `${pkg.name} – Sistema online`,
      expires_in: 0,
      device: "unknown",
      contact: pkg.contactLink,
    });
  } catch {
    return apiResponse(res, 500, { status: "error", message: "Erro interno", expires_in: 0, device: "unknown" });
  }
});

export function registerApiV1(app: import("express").Application) {
  app.use("/api", router);
}
