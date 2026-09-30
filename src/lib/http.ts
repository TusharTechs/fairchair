import "server-only";
import { NextResponse } from "next/server";
import { ipHash } from "@/lib/security";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function problem(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error: { code, message, ...extra } }, status);
}

export function clientIpHash(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  return ipHash(fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip"));
}
