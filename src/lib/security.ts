import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const secret = () => {
  const value = process.env.APP_SECRET;
  if (value) return value;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set in production");
  return "dev-secret";
};

export function hashSecret(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function verifySecret(value: string, hash: string): boolean {
  const a = Buffer.from(hashSecret(value), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export function sha256(data: Uint8Array | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function ipHash(ip: string | null): string | null {
  return ip ? hashSecret(`ip:${ip}`).slice(0, 32) : null;
}
