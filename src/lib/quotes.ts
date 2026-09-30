import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { AnalysisSource } from "@/lib/db/schema";
import type { Measurements } from "@/lib/hair/measurements";
import { quote as computeQuote } from "@/lib/pricing/engine";
import type { QuoteOptions, Studio } from "@/lib/pricing/types";
import { newId, sha256 } from "@/lib/security";

export async function createQuote(opts: {
  studio: Studio;
  serviceId: string;
  options: QuoteOptions;
  analysisId: string;
  clientName: string;
}) {
  const db = await getDb();
  const [analysis] = await db.select().from(schema.analyses).where(eq(schema.analyses.id, opts.analysisId));
  if (!analysis || analysis.studioId !== opts.studio.id) throw new Error("Analysis not found");
  if (analysis.status === "running") throw new Error("Analysis still running");

  const service = opts.studio.services.find((s) => s.id === opts.serviceId);
  if (!service) throw new Error("Service not found");

  // Authoritative server-side computation from the stored measurements.
  const result = computeQuote(opts.studio, service, opts.options, analysis.measurements);
  const id = newId("q");
  const createdAt = new Date();
  const receiptHash = sha256(
    JSON.stringify({
      id,
      studio: opts.studio.id,
      service: service.id,
      options: opts.options,
      measurements: analysis.measurements,
      source: analysis.source,
      price: result.price,
      minutes: result.minutes,
      rules: result.rulesHash,
      at: createdAt.toISOString(),
    }),
  );
  await db.insert(schema.quotes).values({
    id,
    studioId: opts.studio.id,
    serviceId: service.id,
    analysisId: analysis.id,
    clientName: opts.clientName.slice(0, 60),
    options: opts.options,
    measurements: analysis.measurements,
    result,
    source: analysis.source,
    receiptHash,
    createdAt,
  });
  return id;
}

export async function getQuote(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.quotes).where(eq(schema.quotes.id, id));
  return row;
}

export async function listQuotes(studioId: string) {
  const db = await getDb();
  return db.select().from(schema.quotes).where(eq(schema.quotes.studioId, studioId)).orderBy(desc(schema.quotes.createdAt)).limit(100);
}

export async function bookQuote(id: string, startAt: Date) {
  const db = await getDb();
  await db.update(schema.quotes).set({ status: "booked", startAt }).where(eq(schema.quotes.id, id));
}

export async function completeQuote(studioId: string, id: string, actualMinutes: number) {
  const db = await getDb();
  await db
    .update(schema.quotes)
    .set({ status: "completed", actualMinutes })
    .where(and(eq(schema.quotes.id, id), eq(schema.quotes.studioId, studioId)));
}

export type QuoteRow = typeof schema.quotes.$inferSelect;
export type { AnalysisSource, Measurements };
