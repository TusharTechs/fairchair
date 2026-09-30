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

const PORTFOLIO: Record<string, { image: string; caption: string }> = {
  knotless: { image: "/demo/previews/ref-knotless-medium-midback.jpg", caption: "Medium knotless, mid-back" },
  "silk-press": { image: "/demo/previews/ref-silk-press.jpg", caption: "Silk press, past the shoulders" },
  "sew-in": { image: "/demo/previews/ref-sew-in.jpg", caption: "Body-wave sew-in with leave-out" },
  "tape-ins": { image: "/demo/previews/ref-tape-ins.jpg", caption: "Straight tape-ins, lower chest" },
};

function demoServices() {
  return (["knotless", "silk-press", "sew-in", "tape-ins"] as const).map((t) => {
    const s = createService(t);
    const p = PORTFOLIO[t];
    return { ...s, portfolio: { image: p.image, caption: `${p.caption} — from the studio's portfolio (AI-generated for the demo)` } };
  });
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
