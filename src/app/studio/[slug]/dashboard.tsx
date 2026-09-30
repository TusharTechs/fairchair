"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { HairCard } from "@/components/hair-card";
import { optionSummary, QuoteReceipt } from "@/components/quote-receipt";
import { Button, Card, Eyebrow, MeasuredChip, SourceBadge, cx, type ResultSource } from "@/components/ui";
import { DEMO_CLIENTS } from "@/data/demo-clients";
import { duration, durationRange, money, moneyRange } from "@/lib/format";
import { DENSITY_GRADES, type Measurements } from "@/lib/hair/measurements";
import { accuracySummary, applySuggestion, suggestions, type Suggestion } from "@/lib/pricing/accuracy";
import { quote as computeQuote } from "@/lib/pricing/engine";
import { applyFairnessFix, findTextureSurcharges } from "@/lib/pricing/fairness";
import { BUCKETS, BUCKET_LABELS, type Quote, type QuoteOptions, type Service, type Studio } from "@/lib/pricing/types";
import { prepareImage } from "@/lib/client/image";
import { formatInZone, zonedDate } from "@/lib/time";
import { FEATURES, featuresFor, mergeMeasurements } from "@/lib/youcam/features";

type QuoteItem = {
  id: string;
  clientName: string;
  serviceId: string;
  options: QuoteOptions;
  measurements: Measurements;
  result: Quote;
  source: ResultSource;
  status: "quoted" | "booked" | "completed";
  startAt: string | null;
  actualMinutes: number | null;
  createdAt: string;
  receiptHash: string;
};

type Tab = "requests" | "calendar" | "menu" | "accuracy" | "share";

export function Dashboard({ studio, token, isDemo, quotes }: { studio: Studio; token: string; isDemo: boolean; quotes: QuoteItem[] }) {
  const [tab, setTab] = useState<Tab>("requests");
  const [services, setServices] = useState<Service[]>(studio.services);
  const dirty = JSON.stringify(services) !== JSON.stringify(studio.services);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "requests", label: "Requests", count: quotes.filter((q) => q.status !== "completed").length },
    { id: "calendar", label: "Calendar" },
    { id: "menu", label: "Menu & rules" },
    { id: "accuracy", label: "Accuracy" },
    { id: "share", label: "Share" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{studio.city || "Your studio"}</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-normal">{studio.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {money(studio.hourlyRate, studio.currency)}/hour · {Math.round(studio.depositPct * 100)}% deposit · measured time priced at your rate
          </p>
        </div>
        {isDemo ? (
          <p className="max-w-sm rounded-xl bg-warn-soft px-4 py-2.5 text-xs text-ink-2">
            This is the shared demo studio. Edit anything to preview it — saving is off. <a className="underline" href="/start">Create your own studio</a> to keep changes.
          </p>
        ) : null}
      </div>

      <div role="tablist" className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              "relative -mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium",
              tab === t.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.count ? <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[0.7rem] text-surface">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "requests" && <Requests studio={studio} services={services} quotes={quotes} token={token} isDemo={isDemo} />}
      {tab === "calendar" && <Calendar studio={studio} services={services} quotes={quotes} />}
      {tab === "menu" && (
        <Menu studio={studio} services={services} setServices={setServices} token={token} isDemo={isDemo} dirty={dirty} />
      )}
      {tab === "accuracy" && (
        <Accuracy
          services={services}
          quotes={quotes}
          onApply={(s) => {
            setServices((all) => all.map((sv) => (sv.id === s.serviceId ? applySuggestion(sv, s) : sv)));
            setTab("menu");
          }}
        />
      )}
      {tab === "share" && <Share studio={studio} token={token} isDemo={isDemo} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Requests({ studio, services, quotes, token, isDemo }: { studio: Studio; services: Service[]; quotes: QuoteItem[]; token: string; isDemo: boolean }) {
  const [open, setOpen] = useState<string | undefined>(quotes[0]?.id);
  if (!quotes.length) {
    return (
      <Empty
        title="No quote requests yet"
        body="Share your client link. Every request arrives here with the client's measured hair, the quote they saw, and a slot already sized to the work."
        action={{ href: `/s/${studio.slug}`, label: "Try the client link" }}
      />
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <ul className="flex flex-col gap-2">
        {quotes.map((q) => {
          const service = services.find((s) => s.id === q.serviceId);
          return (
            <li key={q.id}>
              <button
                onClick={() => setOpen(q.id)}
                className={cx(
                  "w-full rounded-2xl border bg-surface p-4 text-left transition-colors",
                  open === q.id ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-normal">{q.clientName || "Client"}</p>
                    <p className="truncate text-sm text-ink-2">
                      {service?.name} · {service ? optionSummary(service, q.options) : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular font-display text-lg font-normal">{moneyRange(q.result.price, studio.currency)}</p>
                    <p className="tabular text-xs text-muted">{duration(q.result.slotMinutes)} slot</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <StatusPill status={q.status} />
                  {q.startAt ? (
                    <span className="text-muted">{formatInZone(new Date(q.startAt), studio.timezone, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  ) : null}
                  {q.source !== "live" ? <span className="text-warn">{q.source === "sample" ? "sample data" : "recorded"}</span> : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {open
        ? (() => {
            const q = quotes.find((x) => x.id === open)!;
            const service = services.find((s) => s.id === q.serviceId);
            if (!service) return null;
            return <RequestDetail key={q.id} q={q} service={service} studio={studio} token={token} isDemo={isDemo} />;
          })()
        : null}
    </div>
  );
}

function StatusPill({ status }: { status: QuoteItem["status"] }) {
  const map = {
    quoted: "bg-surface-2 text-ink-2",
    booked: "bg-accent-soft text-accent-ink",
    completed: "bg-measured-soft text-measured",
  } as const;
  return <span className={cx("rounded-full px-2 py-0.5 font-semibold capitalize", map[status])}>{status === "quoted" ? "quote held" : status}</span>;
}

function RequestDetail({ q, service, studio, token, isDemo }: { q: QuoteItem; service: Service; studio: Studio; token: string; isDemo: boolean }) {
  const router = useRouter();
  const [actual, setActual] = useState(String(q.actualMinutes ?? q.result.slotMinutes));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Measured hair</Eyebrow>
          <SourceBadge source={q.source} />
        </div>
        <div className="mt-3">
          <HairCard measurements={q.measurements} />
        </div>
      </Card>
      <QuoteReceipt quote={q.result} service={service} currency={studio.currency} receiptHash={q.receiptHash} />
      <Card className="p-5">
        <p className="text-sm font-semibold">After the appointment</p>
        <p className="mt-1 text-sm text-ink-2">Log how long it really took. FairChair compares it with the estimate and tells you which rule to adjust.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`actual-${q.id}`}>
            Actual minutes
          </label>
          <input
            id={`actual-${q.id}`}
            type="number"
            min={15}
            step={5}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="h-10 w-28 rounded-xl border border-line-strong bg-bg px-3 font-mono"
          />
          <span className="text-sm text-muted">minutes ({duration(Number(actual) || 0)})</span>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setMsg(undefined);
              const res = await fetch(`/api/quotes/${q.id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actualMinutes: Number(actual), token }),
              });
              setBusy(false);
              if (res.ok) {
                setMsg("Logged.");
                router.refresh();
              } else setMsg("Couldn't save that.");
            }}
          >
            {q.status === "completed" ? "Update" : "Mark done"}
          </Button>
          {msg ? <span className="text-sm text-muted">{msg}</span> : null}
        </div>
        {isDemo ? <p className="mt-2 text-xs text-muted">Logging times works in the demo so you can see the Accuracy tab respond.</p> : null}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Calendar({ studio, services, quotes }: { studio: Studio; services: Service[]; quotes: QuoteItem[] }) {
  const booked = quotes.filter((q) => q.startAt);
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => {
    const t = zonedDate(new Date(), studio.timezone);
    const base = new Date(Date.UTC(t.year, t.month - 1, t.day, 12));
    const monday = new Date(base.getTime() - ((base.getUTCDay() + 6) % 7) * 86_400_000 + weekOffset * 7 * 86_400_000);
    return Array.from({ length: 6 }, (_, i) => new Date(monday.getTime() + i * 86_400_000));
  }, [studio.timezone, weekOffset]);
  const open = 8 * 60;
  const close = 20 * 60;
  const pxPerMin = 0.9;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-semibold">
          Week of {formatInZone(days[0], "UTC", { month: "long", day: "numeric" })}
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            ←
          </Button>
          <Button variant="ghost" onClick={() => setWeekOffset(0)}>
            This week
          </Button>
          <Button variant="ghost" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            →
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[3.5rem_repeat(6,minmax(0,1fr))]">
          <div />
          {days.map((d) => (
            <div key={d.toISOString()} className="border-l border-line px-2 py-2 text-center text-xs font-semibold text-muted">
              {formatInZone(d, "UTC", { weekday: "short", day: "numeric" })}
            </div>
          ))}
          <div className="relative" style={{ height: (close - open) * pxPerMin }}>
            {Array.from({ length: (close - open) / 60 + 1 }, (_, i) => (
              <span key={i} className="absolute right-2 -translate-y-1/2 font-mono text-[0.65rem] text-muted" style={{ top: i * 60 * pxPerMin }}>
                {formatInZone(new Date(Date.UTC(2000, 0, 1, 8 + i)), "UTC", { hour: "numeric" })}
              </span>
            ))}
          </div>
          {days.map((d) => {
            const ymd = d.toISOString().slice(0, 10);
            const todays = booked.filter((q) => {
              const z = zonedDate(new Date(q.startAt!), studio.timezone);
              return `${z.year}-${String(z.month).padStart(2, "0")}-${String(z.day).padStart(2, "0")}` === ymd;
            });
            return (
              <div
                key={ymd}
                className="relative border-l border-line"
                style={{
                  height: (close - open) * pxPerMin,
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${60 * pxPerMin}px)`,
                }}
              >
                {todays.map((q) => {
                  const start = new Date(q.startAt!);
                  const hm = formatInZone(start, studio.timezone, { hour: "numeric", minute: "2-digit", hourCycle: "h23" }).split(":").map(Number);
                  const top = (hm[0] * 60 + hm[1] - open) * pxPerMin;
                  const service = services.find((s) => s.id === q.serviceId);
                  return (
                    <div
                      key={q.id}
                      className="absolute inset-x-1 overflow-hidden rounded-lg border border-accent/40 bg-accent-soft p-2 text-xs"
                      style={{ top, height: q.result.slotMinutes * pxPerMin }}
                    >
                      <p className="font-semibold">{q.clientName || "Client"}</p>
                      <p className="text-ink-2">{service?.name}</p>
                      <p className="mt-1 font-mono text-[0.65rem] text-muted">{duration(q.result.slotMinutes)} · sized from measurements</p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {!booked.length ? <p className="border-t border-line px-4 py-3 text-sm text-muted">No bookings yet. Booked quotes appear here with their measured length.</p> : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------

const demoHeads = DEMO_CLIENTS.map((c) => ({
  id: c.id,
  name: c.name,
  m: (measures: Service["measures"]) => mergeMeasurements(featuresFor(measures).map((f) => FEATURES[f].normalize(c.recorded[f]))),
}));

function Menu({
  studio,
  services,
  setServices,
  token,
  isDemo,
  dirty,
}: {
  studio: Studio;
  services: Service[];
  setServices: (fn: (s: Service[]) => Service[]) => void;
  token: string;
  isDemo: boolean;
  dirty: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const update = (id: string, fn: (s: Service) => Service) => setServices((all) => all.map((s) => (s.id === id ? fn(s) : s)));

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-14 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <p className="text-sm text-ink-2">
          Adjustments are <strong>minutes</strong>. FairChair prices them at {money(studio.hourlyRate, studio.currency)}/hour and shows each one to the
          client with the measurement behind it.
        </p>
        <div className="flex items-center gap-2">
          {msg ? <span className="text-sm text-muted">{msg}</span> : null}
          <Button
            disabled={!dirty || busy || isDemo}
            onClick={async () => {
              setBusy(true);
              const res = await fetch(`/api/studios/${studio.slug}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, patch: { services } }),
              });
              setBusy(false);
              setMsg(res.ok ? "Saved" : "Couldn't save");
              if (res.ok) router.refresh();
            }}
          >
            {isDemo ? "Saving off in demo" : "Save changes"}
          </Button>
        </div>
      </div>

      {services.map((service) => (
        <ServiceEditor
          key={service.id}
          studio={studio}
          service={service}
          token={token}
          isDemo={isDemo}
          onChange={(fn) => update(service.id, fn)}
        />
      ))}
    </div>
  );
}

function ServiceEditor({
  studio,
  service,
  token,
  isDemo,
  onChange,
}: {
  studio: Studio;
  service: Service;
  token: string;
  isDemo: boolean;
  onChange: (fn: (s: Service) => Service) => void;
}) {
  const issues = findTextureSurcharges(studio, service);
  const [head, setHead] = useState(demoHeads[1]?.id);
  const firstKey = Object.keys(service.basePrice)[0];
  const [size, length] = firstKey.split("|");
  const previewOptions: QuoteOptions = { ...(size ? { size } : {}), ...(length ? { length } : {}) };
  const preview = useMemo(() => {
    const h = demoHeads.find((d) => d.id === head);
    if (!h) return undefined;
    try {
      return computeQuote({ ...studio, services: [service] }, service, previewOptions, h.m(service.measures));
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, head, studio]);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-normal">{service.name}</h2>
          <p className="text-sm text-ink-2">{service.blurb}</p>
        </div>
        {preview ? (
          <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
            <span className="text-muted">Preview on</span>
            <select value={head} onChange={(e) => setHead(e.target.value)} className="rounded-lg border border-line-strong bg-surface px-2 py-1">
              {demoHeads.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="tabular font-semibold">
              {moneyRange(preview.price, studio.currency)} · {durationRange(preview.minutes)}
            </span>
          </div>
        ) : null}
      </div>

      {issues.map((issue) => (
        <div key={issue.adjustmentId} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm">
          <p className="text-ink">{issue.message}</p>
          <Button variant="secondary" onClick={() => onChange((s) => applyFairnessFix(s, issue))}>
            Convert to prep time
          </Button>
        </div>
      ))}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-2 pr-3 font-medium">Measured adjustment</th>
              {["", "", "", ""].map((_, i) => (
                <th key={i} className="px-1 py-2 font-medium" />
              ))}
            </tr>
          </thead>
          <tbody>
            {service.adjustments.map((adj) => (
              <tr key={adj.id} className="border-t border-line align-top">
                <td className="py-3 pr-3">
                  <input
                    value={adj.label}
                    onChange={(e) =>
                      onChange((s) => ({ ...s, adjustments: s.adjustments.map((a) => (a.id === adj.id ? { ...a, label: e.target.value } : a)) }))
                    }
                    className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 font-medium hover:border-line focus:border-line-strong"
                    aria-label="Adjustment label"
                  />
                  <div className="mt-1 pl-1">
                    <MeasuredChip>{FEATURES[featuresFor([adj.basis])[0]].label}</MeasuredChip>
                  </div>
                </td>
                {BUCKETS[adj.basis].map((bucket) => (
                  <td key={bucket} className="px-1 py-3">
                    <label className="block text-[0.65rem] text-muted">{BUCKET_LABELS[adj.basis][bucket]}</label>
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="number"
                        step={5}
                        value={adj.minutes[bucket] ?? 0}
                        onChange={(e) =>
                          onChange((s) => ({
                            ...s,
                            adjustments: s.adjustments.map((a) =>
                              a.id === adj.id ? { ...a, minutes: { ...a.minutes, [bucket]: Number(e.target.value) || 0 } } : a,
                            ),
                          }))
                        }
                        className="h-9 w-16 rounded-lg border border-line-strong bg-bg px-2 font-mono text-sm"
                        aria-label={`${adj.label}: ${BUCKET_LABELS[adj.basis][bucket]} minutes`}
                      />
                      <span className="text-xs text-muted">m</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PortfolioEditor studio={studio} service={service} token={token} isDemo={isDemo} onChange={onChange} />

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Base prices and times</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.keys(service.basePrice).map((key) => {
            const [s, l] = key.split("|");
            const label = [service.axes.find((a) => a.id === "size")?.choices.find((c) => c.id === s)?.label, service.axes.find((a) => a.id === "length")?.choices.find((c) => c.id === l)?.label]
              .filter(Boolean)
              .join(" · ") || "Base";
            return (
              <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span className="text-ink-2">{label}</span>
                <span className="flex items-center gap-1">
                  <input
                    type="number"
                    value={service.basePrice[key]}
                    onChange={(e) => onChange((sv) => ({ ...sv, basePrice: { ...sv.basePrice, [key]: Number(e.target.value) || 0 } }))}
                    className="h-8 w-20 rounded-lg border border-line-strong bg-bg px-2 font-mono"
                    aria-label={`${label} price`}
                  />
                  <input
                    type="number"
                    step={15}
                    value={service.baseMinutes[key]}
                    onChange={(e) => onChange((sv) => ({ ...sv, baseMinutes: { ...sv.baseMinutes, [key]: Number(e.target.value) || 0 } }))}
                    className="h-8 w-20 rounded-lg border border-line-strong bg-bg px-2 font-mono"
                    aria-label={`${label} minutes`}
                  />
                  <span className="text-xs text-muted">min</span>
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </Card>
  );
}

function PortfolioEditor({
  studio,
  service,
  token,
  isDemo,
  onChange,
}: {
  studio: Studio;
  service: Service;
  token: string;
  isDemo: boolean;
  onChange: (fn: (s: Service) => Service) => void;
}) {
  const [file, setFile] = useState<{ blob: Blob; url: string }>();
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>();
  const current = service.portfolio;

  return (
    <div className="mt-5 rounded-xl border border-line bg-bg p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="h-28 w-21 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
          {file || current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file?.url ?? current!.image} alt={current?.caption ?? "New portfolio photo"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-[0.65rem] text-muted">No photo yet</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Try-on photo</p>
          <p className="text-sm text-ink-2">
            A photo of <em>your</em> finished {service.name.toLowerCase()}. Clients preview this exact style on themselves before paying a deposit
            (YouCam hair try-on).
          </p>
          {current ? <p className="mt-1 text-xs text-muted">Current: {current.caption}</p> : null}
          {isDemo ? (
            <p className="mt-2 text-xs text-muted">Uploading is off in the demo studio.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
                aria-label={`Try-on photo for ${service.name}`}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setMsg(undefined);
                  try {
                    const prepared = await prepareImage(f, { maxSide: 1024 });
                    setFile({ blob: prepared.blob, url: URL.createObjectURL(prepared.blob) });
                  } catch (err) {
                    setMsg((err as Error).message);
                  }
                }}
                className="text-sm file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`e.g. Medium knotless, mid-back`}
                aria-label="Caption"
                className="h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm"
              />
              <label className="flex items-start gap-2 text-xs text-ink-2">
                <input type="checkbox" className="mt-0.5 accent-[var(--accent)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                This is my work and I have the pictured person&apos;s permission to use the photo.
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={!file || !consent || busy}
                  onClick={async () => {
                    if (!file) return;
                    setBusy(true);
                    const fd = new FormData();
                    fd.set("token", token);
                    fd.set("service", service.id);
                    fd.set("caption", caption);
                    fd.set("consent", "yes");
                    fd.append("image", file.blob, "portfolio.jpg");
                    const res = await fetch(`/api/studios/${studio.slug}/portfolio`, { method: "POST", body: fd });
                    const data = await res.json().catch(() => ({}));
                    setBusy(false);
                    if (!res.ok) return setMsg(data?.error?.message ?? "Upload failed.");
                    onChange((s) => ({ ...s, portfolio: { image: data.image, caption: data.caption }, preview: "hair-transfer" }));
                    setFile(undefined);
                    setMsg("Saved — clients can now preview this style.");
                  }}
                >
                  {busy ? "Uploading…" : "Save try-on photo"}
                </Button>
                {msg ? <span className="text-xs text-muted">{msg}</span> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Accuracy({ services, quotes, onApply }: { services: Service[]; quotes: QuoteItem[]; onApply: (s: Suggestion) => void }) {
  const completed = quotes
    .filter((q) => q.status === "completed" && q.actualMinutes)
    .map((q) => ({ serviceId: q.serviceId, measurements: q.measurements, result: q.result, actualMinutes: q.actualMinutes! }));
  const summary = accuracySummary(completed);
  const list = suggestions(services, completed);

  if (!summary) {
    return (
      <Empty
        title="Your estimates get sharper with every appointment"
        body="After each appointment, open the request and log how long it really took. Once the same kind of head runs over or under twice, FairChair shows which rule to change — using only your own logged times."
      />
    );
  }
  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
      <Card className="p-5">
        <Eyebrow>From your logged times</Eyebrow>
        <p className="mt-3 font-display text-4xl font-normal tabular">{summary.n}</p>
        <p className="text-sm text-muted">appointments logged</p>
        <p className="mt-4 font-display text-2xl font-normal tabular">
          {summary.meanDelta >= 0 ? "+" : "−"}
          {Math.abs(Math.round(summary.meanDelta))} min
        </p>
        <p className="text-sm text-muted">average vs. estimate</p>
        <p className="mt-4 font-display text-2xl font-normal tabular">{Math.round(summary.withinSlot * 100)}%</p>
        <p className="text-sm text-muted">finished inside the reserved slot</p>
      </Card>
      <div className="flex flex-col gap-3">
        {list.length ? (
          list.map((s) => {
            const service = services.find((x) => x.id === s.serviceId)!;
            const adj = service.adjustments.find((a) => a.id === s.adjustmentId)!;
            return (
              <Card key={`${s.serviceId}-${s.adjustmentId}-${s.bucket}`} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">
                    {service.name}: {s.bucketLabel.toLowerCase()} heads run {s.meanDelta > 0 ? "over" : "under"} by {Math.abs(Math.round(s.meanDelta))} min
                  </p>
                  <p className="mt-1 text-sm text-ink-2">
                    Based on {s.n} logged appointments. Change “{adj.label}” for {s.bucketLabel.toLowerCase()} by {s.proposedDelta > 0 ? "+" : ""}
                    {s.proposedDelta} min?
                  </p>
                </div>
                <Button variant="secondary" onClick={() => onApply(s)}>
                  Apply to menu
                </Button>
              </Card>
            );
          })
        ) : (
          <Card className="p-5 text-sm text-ink-2">
            No consistent misses yet. Suggestions appear when the same kind of head (for example {DENSITY_GRADES[3].label.toLowerCase()} hair) runs over or under by
            15+ minutes at least twice.
          </Card>
        )}
      </div>
    </div>
  );
}

function Share({ studio, token, isDemo }: { studio: Studio; token: string; isDemo: boolean }) {
  const [copied, setCopied] = useState<string>();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const client = `${origin}/s/${studio.slug}`;
  const admin = `${origin}/studio/${studio.slug}?key=${token}`;
  const embed = `<div data-fairchair="${studio.slug}"></div>\n<script src="${origin}/embed.js" async></script>`;
  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(undefined), 1500);
  };
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-5">
        <Eyebrow>Client quote link</Eyebrow>
        <p className="mt-2 text-sm text-ink-2">Put this in your Instagram/TikTok bio, booking page, or DM auto-reply.</p>
        <p className="mt-3 break-all rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm">{client}</p>
        <Button className="mt-3" variant="secondary" onClick={() => copy("client", client)}>
          {copied === "client" ? "Copied" : "Copy link"}
        </Button>
      </Card>
      <Card className="p-5 md:col-span-2">
        <Eyebrow>Embed on your website</Eyebrow>
        <p className="mt-2 text-sm text-ink-2">
          Paste this where you want the quote flow on your own site or booking page (Squarespace, Wix, WordPress, a Shopify page). It resizes
          itself and can use the camera.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs">{embed}</pre>
        <Button className="mt-3" variant="secondary" onClick={() => copy("embed", embed)}>
          {copied === "embed" ? "Copied" : "Copy embed code"}
        </Button>
      </Card>
      <Card className="p-5">
        <Eyebrow>Your private studio link</Eyebrow>
        <p className="mt-2 text-sm text-ink-2">
          {isDemo ? "The demo studio's key is public so anyone can explore it." : "Anyone with this link can manage your studio. Keep it private."}
        </p>
        <p className="mt-3 break-all rounded-xl bg-surface-2 px-3 py-2 font-mono text-sm">{admin}</p>
        <Button className="mt-3" variant="secondary" onClick={() => copy("admin", admin)}>
          {copied === "admin" ? "Copied" : "Copy link"}
        </Button>
      </Card>
    </div>
  );
}

function Empty({ title, body, action }: { title: string; body: string; action?: { href: string; label: string } }) {
  return (
    <Card className="flex flex-col items-start gap-3 p-8">
      <h2 className="font-display text-2xl font-normal">{title}</h2>
      <p className="max-w-xl text-ink-2">{body}</p>
      {action ? (
        <a href={action.href} className="text-sm font-semibold text-accent-ink underline underline-offset-2">
          {action.label} →
        </a>
      ) : null}
    </Card>
  );
}
