import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { HairCard } from "@/components/hair-card";
import { QuoteReceipt, optionSummary } from "@/components/quote-receipt";
import { SiteFooter } from "@/components/site-footer";
import { SupplyList } from "@/components/supplies";
import { ButtonLink, Card, Eyebrow, SiteHeader, SourceBadge } from "@/components/ui";
import { demoClient } from "@/data/demo-clients";
import { getDb, schema } from "@/lib/db";
import { duration, durationRange, moneyRange } from "@/lib/format";
import { getQuote } from "@/lib/quotes";
import { studioById } from "@/lib/studios";
import { formatInZone } from "@/lib/time";
import { ReceiptActions, SavedQuotes } from "./receipt-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/q/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const q = await getQuote(id);
  const studio = q ? await studioById(q.studioId) : undefined;
  const service = studio?.services.find((s) => s.id === q?.serviceId);
  const title = q && studio && service ? `${service.name} at ${studio.name} · ${moneyRange(q.result.price, studio.currency)}` : "Your quote";
  return { title, description: "A quote measured by YouCam Hair AI and priced by the stylist's own rules.", robots: { index: false } };
}

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
  const price = moneyRange(q.result.price, studio.currency);
  const status = q.status === "booked" ? "Appointment requested" : q.status === "completed" ? "Completed" : "Quote held";

  return (
    <>
      <SiteHeader
        right={
          <ButtonLink href={`/s/${studio.slug}`} variant="secondary">
            New quote
          </ButtonLink>
        }
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <section className="rise overflow-hidden rounded-[1.75rem] bg-ink text-surface">
          <div className="p-6 sm:p-8">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-surface/60">
              {status} · {studio.name}
            </p>
            <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              {q.clientName ? `${q.clientName}, your` : "Your"} {service.name.toLowerCase()}
              <span className="block text-surface/70">{optionSummary(service, q.options)}</span>
            </h1>
            <p className="mt-5 font-display text-6xl leading-none tabular">{price}</p>
            <p className="mt-2 text-surface/75">{durationRange(q.result.minutes)} in the chair</p>
            {start ? (
              <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10">
                {formatInZone(start, studio.timezone, { weekday: "long", month: "long", day: "numeric" })} ·{" "}
                {formatInZone(start, studio.timezone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })} · {duration(q.result.slotMinutes)} reserved
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.03] px-6 py-4 sm:px-8">
            <SourceBadge source={q.source} recordedAt={recordedAt} />
            <ReceiptActions
                dark
                id={q.id}
                studio={studio.name}
                service={service.name}
                priceLabel={price}
                start={start?.toISOString()}
                slotMinutes={q.result.slotMinutes}
              />
          </div>
        </section>

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
            <p className="font-display text-xl text-ink">Why this quote holds</p>
            <p className="mt-1">
              The price comes from {studio.name}&apos;s published rules (version <span className="font-mono">{q.result.rulesHash}</span>) applied to
              the measurements above. If your hair on the day matches them, this is the price. If a stylist changes it, they&apos;ll point to what&apos;s
              different.
            </p>
            <p className="mt-3 font-mono text-[0.7rem] text-muted">
              Receipt {q.receiptHash} · issued {new Date(q.createdAt).toISOString()}
            </p>
          </Card>
          <SavedQuotes currentId={q.id} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
