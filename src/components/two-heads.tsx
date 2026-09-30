import { demoClient } from "@/data/demo-clients";
import { duration, money } from "@/lib/format";
import { FEATURES, featuresFor, mergeMeasurements } from "@/lib/youcam/features";
import { quote } from "@/lib/pricing/engine";
import type { QuoteOptions, Studio } from "@/lib/pricing/types";
import { HairCard } from "./hair-card";
import { QuoteReceipt } from "./quote-receipt";
import { MeasuredChip, SourceBadge } from "./ui";

export function demoMeasurements(id: string, measures: Parameters<typeof featuresFor>[0]) {
  const c = demoClient(id)!;
  return mergeMeasurements(featuresFor(measures).map((f) => FEATURES[f].normalize(c.recorded[f])));
}

export function TwoHeads({
  studio,
  serviceId,
  options,
  left = "maya",
  right = "nia",
}: {
  studio: Studio;
  serviceId: string;
  options: QuoteOptions;
  left?: string;
  right?: string;
}) {
  const service = studio.services.find((s) => s.id === serviceId)!;
  const heads = [left, right].map((id) => {
    const client = demoClient(id)!;
    const m = demoMeasurements(id, service.measures);
    return { client, m, q: quote(studio, service, options, m) };
  });
  const [a, b] = heads;
  const differing = new Set(
    a.q.lines.filter((l, i) => l.minutes.join() !== b.q.lines[i].minutes.join() || l.price.join() !== b.q.lines[i].price.join()).map((l) => l.id),
  );
  const [hi, lo] = a.q.price[0] >= b.q.price[0] ? [a, b] : [b, a];
  const dPrice = hi.q.price[0] - lo.q.price[0];
  const dMin = hi.q.slotMinutes - lo.q.slotMinutes;
  const curlier = (h: typeof a) => h.m.type?.index ?? -1;
  const fullerCostsMore = curlier(lo) > curlier(hi) && (hi.m.density?.grade ?? 0) > (lo.m.density?.grade ?? 0);

  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-2">
        {heads.map(({ client, m, q }) => (
          <div key={client.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={client.photo} alt={`${client.name}, AI-generated demo client`} className="h-28 w-21 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold">{client.name}</p>
                <p className="text-sm text-muted">{client.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SourceBadge source={client.source} recordedAt={client.recordedAt} />
                </div>
                <p className="mt-1 text-[0.7rem] text-muted">AI-generated person · real YouCam measurements</p>
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <HairCard measurements={m} compact />
            </div>
            <QuoteReceipt quote={q} service={service} currency={studio.currency} highlight={differing} />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4 text-[0.95rem] text-ink">
        <p>
          Same style, same menu. <strong>{hi.client.name}</strong>&apos;s quote is <strong className="tabular">{money(dPrice, studio.currency)}</strong> more
          and the chair is booked <strong className="tabular">{duration(dMin)}</strong> longer.{" "}
          {fullerCostsMore ? (
            <>
              {lo.client.name}&apos;s hair is the <em>curlier</em> of the two — the difference comes from fullness and length, not texture.
            </>
          ) : null}{" "}
          Every line of the difference points to a measurement:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {hi.q.lines
            .filter((l) => differing.has(l.id) && l.because.type === "measurement")
            .map((l) => (
              <MeasuredChip key={l.id}>{l.because.type === "measurement" ? l.because.youcam : ""}</MeasuredChip>
            ))}
        </div>
      </div>
    </div>
  );
}
