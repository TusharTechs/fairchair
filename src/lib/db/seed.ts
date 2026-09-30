import "server-only";
import { eq } from "drizzle-orm";
import { DEMO_SHOP, DEMO_SHOP_PRODUCT_JSON } from "@/data/demo-shop";
import { DEFAULT_MATCH_SETTINGS, productFromShopifyJson } from "@/lib/matching/extensions";
import { createService } from "@/lib/pricing/templates";
import { hashSecret } from "@/lib/security";
import type { DB } from "./index";
import { shops, studios } from "./schema";

export const DEMO_STUDIO_SLUG = "amara-braids-demo";
export const DEMO_ADMIN_TOKEN = "demo";

function demoServices() {
  const knotless = createService("knotless");
  knotless.portfolio = {
    image: "/demo/previews/ref-knotless-medium-midback.jpg",
    caption: "Medium knotless, mid-back — from the studio's portfolio (AI-generated for the demo)",
  };
  return [knotless, createService("silk-press"), createService("sew-in"), createService("tape-ins")];
}

export async function ensureDemoStudio(db: DB) {
  const existing = await db.select({ id: studios.id }).from(studios).where(eq(studios.slug, DEMO_STUDIO_SLUG));
  if (existing.length) {
    // The demo studio is read-only: keep it in sync with the canonical menu.
    // Re-derive the public demo key's hash too, so rotating APP_SECRET never
    // locks judges out of the demo studio.
    await db
      .update(studios)
      .set({ services: demoServices(), adminTokenHash: hashSecret(DEMO_ADMIN_TOKEN) })
      .where(eq(studios.slug, DEMO_STUDIO_SLUG));
    return;
  }
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
    services: demoServices(),
    adminTokenHash: hashSecret(DEMO_ADMIN_TOKEN),
    isDemo: true,
  });
}

export async function ensureDemoShop(db: DB) {
  const values = {
    name: DEMO_SHOP.name,
    platform: "demo" as const,
    domain: DEMO_SHOP.domain,
    productUrl: `https://${DEMO_SHOP.domain}/products/${DEMO_SHOP_PRODUCT_JSON.handle}`,
    product: productFromShopifyJson(DEMO_SHOP_PRODUCT_JSON),
    settings: DEFAULT_MATCH_SETTINGS,
    adminTokenHash: hashSecret(DEMO_ADMIN_TOKEN),
    isDemo: true,
  };
  const existing = await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, DEMO_SHOP.slug));
  if (existing.length) await db.update(shops).set(values).where(eq(shops.slug, DEMO_SHOP.slug));
  else await db.insert(shops).values({ id: "shop_demo", slug: DEMO_SHOP.slug, ...values });
}
