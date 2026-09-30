import "server-only";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createService } from "@/lib/pricing/templates";
import type { Service, ServiceTemplateId, Studio } from "@/lib/pricing/types";
import { hashSecret, newId, newToken, verifySecret } from "@/lib/security";

type Row = typeof schema.studios.$inferSelect;

export function toStudio(row: Row): Studio & { isDemo: boolean } {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city,
    currency: row.currency as Studio["currency"],
    timezone: row.timezone,
    hourlyRate: row.hourlyRate,
    depositPct: row.depositPct,
    priceByTime: row.priceByTime,
    services: row.services,
    isDemo: row.isDemo,
  };
}

export async function studioBySlug(slug: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.studios).where(eq(schema.studios.slug, slug));
  return row ? { studio: toStudio(row), adminTokenHash: row.adminTokenHash } : undefined;
}

export async function studioById(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.studios).where(eq(schema.studios.id, id));
  return row ? toStudio(row) : undefined;
}

export async function authorizeStudio(slug: string, token: string | null | undefined) {
  const found = await studioBySlug(slug);
  if (!found || !token || !verifySecret(token, found.adminTokenHash)) return undefined;
  return found.studio;
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "studio"
  );
}

export async function createStudio(input: {
  name: string;
  city: string;
  hourlyRate: number;
  depositPct: number;
  timezone: string;
  templates: ServiceTemplateId[];
}) {
  const db = await getDb();
  let slug = slugify(input.name);
  for (let i = 2; (await studioBySlug(slug)) && i < 50; i++) slug = `${slugify(input.name)}-${i}`;
  const token = newToken();
  const id = newId("studio");
  await db.insert(schema.studios).values({
    id,
    slug,
    name: input.name,
    city: input.city,
    hourlyRate: input.hourlyRate,
    depositPct: input.depositPct,
    timezone: input.timezone,
    priceByTime: true,
    services: input.templates.map((t) => createService(t)),
    adminTokenHash: hashSecret(token),
  });
  return { slug, token };
}

export async function updateStudio(
  id: string,
  patch: Partial<Pick<Studio, "name" | "city" | "hourlyRate" | "depositPct" | "priceByTime">> & { services?: Service[] },
) {
  const db = await getDb();
  await db.update(schema.studios).set(patch).where(eq(schema.studios.id, id));
}
