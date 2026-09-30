import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DEFAULT_MATCH_SETTINGS, productFromShopifyJson, type MatchSettings, type Product } from "@/lib/matching/extensions";
import { hashSecret, newId, newToken, verifySecret } from "@/lib/security";

export type Shop = {
  id: string;
  slug: string;
  name: string;
  platform: "shopify" | "demo";
  domain: string;
  productUrl: string;
  product: Product;
  settings: MatchSettings;
  isDemo: boolean;
};

const toShop = (r: typeof schema.shops.$inferSelect): Shop => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  platform: r.platform,
  domain: r.domain,
  productUrl: r.productUrl,
  product: r.product,
  settings: r.settings,
  isDemo: r.isDemo,
});

export async function shopBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.shops).where(eq(schema.shops.slug, slug));
  return row ? { shop: toShop(row), adminTokenHash: row.adminTokenHash } : undefined;
}

export async function authorizeShop(slug: string, token: string | null | undefined) {
  const found = await shopBySlug(slug);
  if (!found || !token || !verifySecret(token, found.adminTokenHash)) return undefined;
  return found.shop;
}

function isPrivateAddress(ip: string) {
  return (
    /^(10\.|127\.|169\.254\.|192\.168\.|0\.)/.test(ip) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip === "::1" ||
    /^f[cd]/i.test(ip) ||
    /^fe80/i.test(ip)
  );
}

/**
 * Reads a product from any Shopify storefront via its public product JSON
 * (https://<store>/products/<handle>.js). No app install needed. Guards against
 * fetching internal addresses (SSRF) and oversized responses.
 */
export async function fetchShopifyProduct(productUrl: string) {
  let url: URL;
  try {
    url = new URL(productUrl.trim());
  } catch {
    throw new Error("Paste the full product link, starting with https://");
  }
  const handle = /\/products\/([a-z0-9][a-z0-9\-_.%]*)/i.exec(url.pathname)?.[1]?.replace(/\.(js|json)$/i, "");
  if (url.protocol !== "https:" || !handle) throw new Error("Use a Shopify product link like https://yourstore.com/products/your-product");
  if (isIP(url.hostname) || url.hostname === "localhost" || url.port) throw new Error("Use your store's public domain.");
  const addresses = await lookup(url.hostname, { all: true }).catch(() => []);
  if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) throw new Error("That store address can't be reached.");

  const res = await fetch(`https://${url.hostname}/products/${handle}.js`, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
  if (!res?.ok) throw new Error("Couldn't read that product. Is it a published Shopify product?");
  const text = await res.text();
  if (text.length > 2_000_000) throw new Error("That product is too large to read.");
  return { domain: url.hostname, product: productFromShopifyJson(JSON.parse(text)) };
}

export async function createShop(input: { name: string; productUrl: string }) {
  const { domain, product } = await fetchShopifyProduct(input.productUrl);
  const db = await getDb();
  const base = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "shop";
  let slug = base;
  for (let i = 2; (await shopBySlug(slug)) && i < 50; i++) slug = `${base}-${i}`;
  const token = newToken();
  await db.insert(schema.shops).values({
    id: newId("shop"),
    slug,
    name: input.name,
    platform: "shopify",
    domain,
    productUrl: input.productUrl,
    product,
    settings: DEFAULT_MATCH_SETTINGS,
    adminTokenHash: hashSecret(token),
  });
  return { slug, token, product };
}
