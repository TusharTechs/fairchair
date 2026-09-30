import "server-only";
import { eq } from "drizzle-orm";
import { createService } from "@/lib/pricing/templates";
import { hashSecret } from "@/lib/security";
import type { DB } from "./index";
import { studios } from "./schema";

export const DEMO_STUDIO_SLUG = "amara-braids-demo";
export const DEMO_ADMIN_TOKEN = "demo";

export async function ensureDemoStudio(db: DB) {
  const existing = await db.select({ id: studios.id }).from(studios).where(eq(studios.slug, DEMO_STUDIO_SLUG));
  if (existing.length) return;
  await db.insert(studios).values({
    id: "studio_demo",
    slug: DEMO_STUDIO_SLUG,
    name: "Amara Braids & Co.",
    city: "Atlanta, GA",
    currency: "USD",
    timezone: "America/New_York",
    hourlyRate: 40,
    depositPct: 0.25,
    priceByTime: true,
    services: [
      createService("knotless"),
      createService("silk-press"),
      createService("sew-in"),
      createService("tape-ins"),
    ],
    adminTokenHash: hashSecret(DEMO_ADMIN_TOKEN),
    isDemo: true,
  });
}
