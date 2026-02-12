import { NextRequest } from "next/server";
import { createHmac } from "crypto";

const IGDB_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const COOKIE_NAME = "igdb_usage";

function getSecret(): string {
  return process.env.RATE_LIMIT_SECRET || "default-dev-secret";
}

// In-memory IP tracker
interface IpEntry {
  count: number;
  resetAt: number;
}

const ipMap = new Map<string, IpEntry>();

// Periodic cleanup every 10 minutes
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipMap) {
      if (now >= entry.resetAt) {
        ipMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
  // Don't keep the process alive just for cleanup
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("hex");
}

interface CookiePayload {
  count: number;
  resetAt: number;
}

function encodeCookie(payload: CookiePayload): string {
  const json = JSON.stringify(payload);
  const sig = sign(json);
  return `${Buffer.from(json).toString("base64")}.${sig}`;
}

function decodeCookie(value: string): CookiePayload | null {
  try {
    const [b64, sig] = value.split(".");
    if (!b64 || !sig) return null;
    const json = Buffer.from(b64, "base64").toString("utf-8");
    if (sign(json) !== sig) return null;
    const payload = JSON.parse(json);
    if (typeof payload.count !== "number" || typeof payload.resetAt !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getIpEntry(ip: string): IpEntry {
  ensureCleanup();
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (entry && now < entry.resetAt) return entry;
  // Expired or missing — create fresh
  const fresh: IpEntry = { count: 0, resetAt: now + WINDOW_MS };
  ipMap.set(ip, fresh);
  return fresh;
}

export interface IgdbUsage {
  count: number;
  remaining: number;
  exhausted: boolean;
}

export function getIgdbUsage(request: NextRequest): IgdbUsage {
  const now = Date.now();

  // Try cookie first
  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieValue) {
    const payload = decodeCookie(cookieValue);
    if (payload && now < payload.resetAt) {
      const remaining = Math.max(0, IGDB_LIMIT - payload.count);
      return { count: payload.count, remaining, exhausted: remaining <= 0 };
    }
  }

  // Fall back to IP map
  const ip = getClientIp(request);
  const entry = getIpEntry(ip);
  const remaining = Math.max(0, IGDB_LIMIT - entry.count);
  return { count: entry.count, remaining, exhausted: remaining <= 0 };
}

export interface IncrementResult {
  usage: IgdbUsage;
  cookieHeader: string;
}

export function incrementIgdbUsage(request: NextRequest): IncrementResult {
  const now = Date.now();
  const ip = getClientIp(request);

  // Read current count from cookie or IP
  let count = 0;
  let resetAt = now + WINDOW_MS;

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieValue) {
    const payload = decodeCookie(cookieValue);
    if (payload && now < payload.resetAt) {
      count = payload.count;
      resetAt = payload.resetAt;
    }
  } else {
    const entry = getIpEntry(ip);
    count = entry.count;
    resetAt = entry.resetAt;
  }

  count++;

  // Update IP map
  const ipEntry = getIpEntry(ip);
  ipEntry.count = count;
  ipEntry.resetAt = resetAt;

  // Build cookie
  const newPayload: CookiePayload = { count, resetAt };
  const maxAge = Math.ceil((resetAt - now) / 1000);
  const cookieHeader = `${COOKIE_NAME}=${encodeCookie(newPayload)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

  const remaining = Math.max(0, IGDB_LIMIT - count);
  return {
    usage: { count, remaining, exhausted: remaining <= 0 },
    cookieHeader,
  };
}

export const IGDB_USE_LIMIT = IGDB_LIMIT;
