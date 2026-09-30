import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HairCard } from "@/components/hair-card";
import { QuoteReceipt } from "@/components/quote-receipt";
import { SupplyList } from "@/components/supplies";
import { ButtonLink, Card, Eyebrow, SiteHeader, SourceBadge } from "@/components/ui";
import { demoClient } from "@/data/demo-clients";
import { getDb, schema } from "@/lib/db";
import { duration } from "@/lib/format";
import { formatInZone } from "@/lib/time";
import { getQuote } from "@/lib/quotes";
import { studioById } from "@/lib/studios";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your quote", robots: { index: false } };

export default async function ReceiptPage(props: PageProps<"/q/[id]">) {
  const { id } = await props.params;
  const q = await getQuote(id);
  if (!q) notFound();
  const studio = await studioById(q.studioId);
  const service = studio?.services.find((s) => s.id === q.serviceId);
  if (!studio || !service) notFound();

  let recordedAt: string | undefined;
  if (q.source === "replay" && q.analysisId) {
    const db = await getDb();
    const [a] = await db.select({ demo: schema.analyses.demoClientId }).from(schema.analyses).where(eq(schema.analyses.id, q.analysisId));
    recordedAt = demoClient(a?.demo)?.recordedAt;
  }

  const start = q.startAt ? new Date(q.startAt) : undefined;

  return (
    <>
      <SiteHeader right={<ButtonLink href={`/s/${studio.slug}`} variant="ghost">New quote</ButtonLink>} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <div className="rise">
          <Eyebrow>{q.status === "booked" ? "Requested" : q.status === "completed" ? "Completed" : "Quote held"}</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">
            {q.clientName ? `${q.clientName}, here's your quote` : "Your quote"}
          </h1>
          {start ? (
            <p className="mt-2 text-lg text-ink-2">
              {formatInZone(start, studio.timezone, { weekday: "long", month: "long", day: "numeric" })} at{" "}
              {formatInZone(start, studio.timezone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })} ·{" "}
              {duration(q.result.slotMinutes)} reserved
            </p>
          ) : (
            <p className="mt-2 text-ink-2">Keep this link. {studio.name} sees the same quote and measurements.</p>
          )}
          <div className="mt-3">
            <SourceBadge source={q.source} recordedAt={recordedAt} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <QuoteReceipt quote={q.result} service={service} currency={studio.currency} studioName={studio.name} receiptHash={q.receiptHash} />
          <Card className="p-5">
            <Eyebrow>What was measured</Eyebrow>
            <div className="mt-3">
              <HairCard measurements={q.measurements} />
            </div>
          </Card>
          {q.result.supplies.length ? (
            <Card className="p-5">
              <Eyebrow>Supply list</Eyebrow>
              <div className="mt-3">
                <SupplyList supplies={q.result.supplies} />
              </div>
            </Card>
          ) : null}
          <Card className="p-5 text-sm text-ink-2">
            <p className="font-semibold text-ink">Why this quote holds</p>
            <p className="mt-1">
              The price comes from {studio.name}&apos;s published rules (version <span className="font-mono">{q.result.rulesHash}</span>) applied
              to the measurements above. If your hair on the day matches these measurements, this is the price. If a stylist changes it,
              they&apos;ll point to what&apos;s different.
            </p>
            <p className="mt-3 font-mono text-[0.7rem] text-muted">
              Receipt {q.receiptHash} · issued {new Date(q.createdAt).toISOString()}
            </p>
          </Card>
        </div>
      </main>
    </>
  );
}
