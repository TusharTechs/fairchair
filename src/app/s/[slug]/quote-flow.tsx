"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { HairCard } from "@/components/hair-card";
import { QuoteReceipt } from "@/components/quote-receipt";
import { SupplyList } from "@/components/supplies";
import { Button, Card, Eyebrow, MeasuredChip, SourceBadge, cx, type ResultSource } from "@/components/ui";
import { Analysing, PhotoStep, type AnalysisView, type Demo } from "@/components/capture";
import { duration } from "@/lib/format";
import { formatInZone, zonedDate, zonedToUtc } from "@/lib/time";
import { HAIR_LENGTH_BANDS, LENGTH_TIERS, type LengthTier } from "@/lib/hair/measurements";
import { quote as computeQuote } from "@/lib/pricing/engine";
import { BUCKET_LABELS, type QuoteOptions, type Service, type Studio } from "@/lib/pricing/types";
import { guidanceFor } from "@/lib/youcam/errors";


type Step = "service" | "photos" | "analysing" | "result" | "book";

export function QuoteFlow({ studio, demos }: { studio: Studio; demos: Demo[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string>();
  const [options, setOptions] = useState<QuoteOptions>({});
  const [analysis, setAnalysis] = useState<AnalysisView>();
  const [error, setError] = useState<string>();
  const [quoteId, setQuoteId] = useState<string>();
  // What the try-on needs: the front photo (kept in memory only) or the demo id.
  const [tryOnSource, setTryOnSource] = useState<{ front?: Blob; demo?: string }>({});

  const service = studio.services.find((s) => s.id === serviceId);
  const optionsComplete = service ? service.axes.every((a) => options[a.id]) : false;

  const preview = useMemo(() => {
    if (!service || !analysis || analysis.status === "running" || !optionsComplete) return undefined;
    try {
      return computeQuote(studio, service, options, analysis.measurements);
    } catch {
      return undefined;
    }
  }, [studio, service, options, analysis, optionsComplete]);

  async function start(body: FormData) {
    const front = body.get("front");
    const demo = body.get("demo");
    setTryOnSource({ front: front instanceof Blob ? front : undefined, demo: typeof demo === "string" ? demo : undefined });
    setError(undefined);
    setStep("analysing");
    setAnalysis(undefined);
    const res = await fetch("/api/analyses", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error?.message ?? "We couldn't start the analysis.");
      setStep("photos");
      return;
    }
    poll(data.id);
  }

  async function poll(id: string) {
    for (let i = 0; i < 90; i++) {
      const res = await fetch(`/api/analyses/${id}`, { cache: "no-store" });
      if (res.ok) {
        const view: AnalysisView = await res.json();
        setAnalysis(view);
        if (view.status !== "running") {
          if (view.status === "failed") {
            const code = view.tasks.find((t) => t.errorCode)?.errorCode ?? undefined;
            setError(guidanceFor(code));
            setStep("photos");
          } else {
            setStep("result");
          }
          return;
        }
      }
      await new Promise((r) => setTimeout(r, i < 5 ? 1500 : 2500));
    }
    setError("This is taking longer than usual. Please try again.");
    setStep("photos");
  }

  return (
    <div className="flex flex-col gap-6">
      <Progress step={step} />

      {step === "service" && (
        <ServiceStep
          studio={studio}
          serviceId={serviceId}
          options={options}
          onService={(id) => {
            setServiceId(id);
            setOptions({});
          }}
          onOption={(axis, value) => setOptions((o) => ({ ...o, [axis]: value }))}
          canContinue={Boolean(service && optionsComplete)}
          onContinue={() => setStep("photos")}
        />
      )}

      {step === "photos" && service && (
        <PhotoStep
          fields={{ studio: studio.slug, service: service.id }}
          recipient={studio.name}
          demos={demos}
          error={error}
          onBack={() => setStep("service")}
          onSubmit={start}
        />
      )}

      {step === "analysing" && <Analysing analysis={analysis} />}

      {step === "result" && service && analysis && preview && (
        <ResultStep
          studio={studio}
          service={service}
          analysis={analysis}
          quote={preview}
          stretched={options.stretched}
          tryOnSource={tryOnSource}
          onStretched={(tier) => setOptions((o) => ({ ...o, stretched: tier }))}
          onRetake={() => {
            setAnalysis(undefined);
            setStep("photos");
          }}
          onHold={async (clientName) => {
            const res = await fetch("/api/quotes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ studio: studio.slug, service: service.id, analysisId: analysis.id, options, clientName }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error?.message ?? "Couldn't save the quote.");
            setQuoteId(data.id);
            setStep("book");
          }}
        />
      )}

      {step === "book" && preview && quoteId && (
        <BookStep
          slotMinutes={preview.slotMinutes}
          deposit={preview.deposit}
          timezone={studio.timezone}
          currency={studio.currency}
          onBook={async (startAt) => {
            const res = await fetch(`/api/quotes/${quoteId}/book`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ startAt: startAt.toISOString() }),
            });
            if (!res.ok) throw new Error("That slot couldn't be booked.");
            router.push(`/q/${quoteId}`);
          }}
          onSkip={() => router.push(`/q/${quoteId}`)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const STEPS: { id: Step; label: string }[] = [
  { id: "service", label: "Style" },
  { id: "photos", label: "Photos" },
  { id: "analysing", label: "Measure" },
  { id: "result", label: "Quote" },
  { id: "book", label: "Book" },
];

function Progress({ step }: { step: Step }) {
  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 flex-col gap-1.5" aria-current={i === at ? "step" : undefined}>
          <span className={cx("h-1 rounded-full", i <= at ? "bg-accent" : "bg-line")} />
          <span className={cx("text-[0.7rem] font-medium", i === at ? "text-ink" : "text-muted")}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

function ServiceStep(props: {
  studio: Studio;
  serviceId?: string;
  options: QuoteOptions;
  onService: (id: string) => void;
  onOption: (axis: "size" | "length", value: string) => void;
  canContinue: boolean;
  onContinue: () => void;
}) {
  const service = props.studio.services.find((s) => s.id === props.serviceId);
  return (
    <section className="rise flex flex-col gap-5">
      <div>
        <Eyebrow>{props.studio.name}</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">What are you booking?</h1>
        <p className="mt-2 text-ink-2">You&apos;ll get a real price and time for your hair — not a “starting at”.</p>
      </div>
      <div className="grid gap-3">
        {props.studio.services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => props.onService(s.id)}
            aria-pressed={s.id === props.serviceId}
            className={cx(
              "rounded-2xl border bg-surface p-4 text-left transition-colors",
              s.id === props.serviceId ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
            )}
          >
            <p className="font-display text-lg font-bold">{s.name}</p>
            <p className="text-sm text-ink-2">{s.blurb}</p>
          </button>
        ))}
      </div>

      {service?.axes.map((axis) => (
        <fieldset key={axis.id} className="rise">
          <legend className="mb-2 text-sm font-semibold">{axis.label}</legend>
          <div className="flex flex-wrap gap-2">
            {axis.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => props.onOption(axis.id, c.id)}
                aria-pressed={props.options[axis.id] === c.id}
                className={cx(
                  "h-10 rounded-full border px-4 text-sm font-medium transition-colors",
                  props.options[axis.id] === c.id ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface hover:bg-surface-2",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <Button size="lg" disabled={!props.canContinue} onClick={props.onContinue} className="self-start">
        Continue
      </Button>
    </section>
  );
}

function ResultStep(props: {
  studio: Studio;
  service: Service;
  analysis: AnalysisView;
  quote: ReturnType<typeof computeQuote>;
  stretched?: LengthTier;
  tryOnSource: { front?: Blob; demo?: string };
  onStretched: (tier: LengthTier | undefined) => void;
  onRetake: () => void;
  onHold: (clientName: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const failed = props.analysis.tasks.filter((t) => t.status === "error");
  const m = props.analysis.measurements;
  const shrinks = (m.type?.family === "curly" || m.type?.family === "coily") && m.length && props.service.measures.includes("length");

  return (
    <section className="rise flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold leading-tight">Your hair, measured</h1>
        <SourceBadge source={props.analysis.source} />
      </div>

      <Card className="p-5">
        <HairCard measurements={props.analysis.measurements} />
        {failed.length ? (
          <div className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-ink-2">
            <p>
              {failed.map((f) => f.label).join(", ")} couldn&apos;t be read ({guidanceFor(failed[0].errorCode ?? undefined)}). Your range is
              wider to cover it.
            </p>
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer">What YouCam reported</summary>
              <ul className="mt-1 space-y-0.5 font-mono">
                {failed.map((f) => (
                  <li key={f.feature}>
                    {f.label}: {f.errorCode}
                    {f.errorMessage ? ` — ${f.errorMessage}` : ""}
                    {f.attempts && f.attempts > 1 ? ` (after ${f.attempts} attempts)` : ""}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <span className="text-ink-2">Doesn&apos;t look right?</span>
          <Button variant="secondary" onClick={props.onRetake}>
            Retake photos
          </Button>
        </div>
      </Card>

      {shrinks ? (
        <Card className="p-5">
          <p className="font-semibold">Curly and coily hair shrinks.</p>
          <p className="mt-1 text-sm text-ink-2">
            YouCam measured how your hair hangs: <strong>{HAIR_LENGTH_BANDS[m.length!.index].label.toLowerCase()}</strong>. If it&apos;s longer when
            stretched, tell your stylist here — it&apos;s shown on your quote as something you reported, not measured.
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Stretched length">
            {([undefined, ...LENGTH_TIERS] as (LengthTier | undefined)[]).map((tier) => (
              <button
                key={tier ?? "measured"}
                type="button"
                role="radio"
                aria-checked={props.stretched === tier}
                onClick={() => props.onStretched(tier)}
                className={cx(
                  "h-9 rounded-full border px-3.5 text-sm font-medium",
                  props.stretched === tier ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface hover:bg-surface-2",
                )}
              >
                {tier ? BUCKET_LABELS.length[tier] : "Same as measured"}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      <QuoteReceipt quote={props.quote} service={props.service} currency={props.studio.currency} studioName={props.studio.name} />

      {props.service.portfolio && (props.tryOnSource.front || props.tryOnSource.demo) ? (
        <TryOn studio={props.studio} service={props.service} source={props.tryOnSource} />
      ) : null}

      {props.quote.supplies.length ? (
        <Card className="p-5">
          <Eyebrow>Supply list</Eyebrow>
          <div className="mt-3">
            <SupplyList supplies={props.quote.supplies} />
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <label className="text-sm font-semibold" htmlFor="client-name">
          Your first name
        </label>
        <input
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="given-name"
          className="mt-2 h-11 w-full rounded-xl border border-line-strong bg-bg px-3 text-[0.95rem] outline-none focus:border-ink"
          placeholder="So your stylist knows who's coming"
        />
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={busy || name.trim().length < 1}
          onClick={async () => {
            setBusy(true);
            setError(undefined);
            try {
              await props.onHold(name.trim());
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          }}
        >
          Hold this quote &amp; pick a time
        </Button>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted">
          <MeasuredChip>Measured</MeasuredChip> lines come from YouCam. Everything else is {props.studio.name}&apos;s own menu.
        </p>
      </Card>
    </section>
  );
}

function TryOn({ studio, service, source }: { studio: Studio; service: Service; source: { front?: Blob; demo?: string } }) {
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "loading" } | { kind: "done"; image: string; source: ResultSource } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const portfolio = service.portfolio!;

  async function run() {
    setState({ kind: "loading" });
    const fd = new FormData();
    fd.set("studio", studio.slug);
    fd.set("service", service.id);
    if (source.demo) fd.set("demo", source.demo);
    else if (source.front) fd.append("front", source.front, "front.jpg");
    const res = await fetch("/api/tryon", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ kind: "error", message: data?.error?.message ?? "The preview couldn't be made." });
    setState({ kind: "done", image: data.image, source: data.source });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>See it on you</Eyebrow>
        {state.kind === "done" ? <SourceBadge source={state.source} /> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portfolio.image} alt={portfolio.caption} className="aspect-[3/4] w-full rounded-xl object-cover" />
          <figcaption className="mt-1.5 text-[0.7rem] leading-snug text-muted">{portfolio.caption}</figcaption>
        </figure>
        <figure>
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2">
            {state.kind === "done" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.image} alt="Your try-on preview" className="h-full w-full object-cover" />
            ) : state.kind === "loading" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
                <div className="scanline absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-measured/25 to-transparent" />
                <span className="text-sm font-semibold">Styling your preview…</span>
                <span className="text-xs text-muted">YouCam hair try-on · about 10 seconds</span>
              </div>
            ) : (
              <button type="button" onClick={run} className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
                <span className="text-sm font-semibold">This style, on you</span>
                <span className="text-xs text-muted">Uses your front photo</span>
              </button>
            )}
          </div>
          <figcaption className="mt-1.5 text-[0.7rem] leading-snug text-muted">
            {state.kind === "done" ? "A preview of the style, not a promise of the exact result. Not saved." : "Your preview appears here"}
          </figcaption>
        </figure>
      </div>
      {state.kind === "error" ? <p className="mt-3 text-sm text-danger">{state.message}</p> : null}
      {state.kind === "idle" || state.kind === "error" ? (
        <Button variant="secondary" className="mt-3" onClick={run}>
          Preview {service.name.toLowerCase()} on me
        </Button>
      ) : null}
    </Card>
  );
}

function BookStep(props: {
  slotMinutes: number;
  deposit: number;
  currency: string;
  timezone: string;
  onBook: (startAt: Date) => Promise<void>;
  onSkip: () => void;
}) {
  // Next six studio days (closed Sundays), computed in the studio's timezone.
  const days = useMemo(() => {
    const today = zonedDate(new Date(), props.timezone);
    const out: { year: number; month: number; day: number; noon: Date }[] = [];
    for (let i = 1; out.length < 6; i++) {
      const noon = new Date(Date.UTC(today.year, today.month - 1, today.day + i, 12));
      if (noon.getUTCDay() !== 0) {
        out.push({ year: noon.getUTCFullYear(), month: noon.getUTCMonth() + 1, day: noon.getUTCDate(), noon });
      }
    }
    return out;
  }, [props.timezone]);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  // Studio day 8:00–20:00; only offer starts where the whole sized slot fits.
  const starts = useMemo(() => {
    const list: number[] = [];
    for (let m = 8 * 60; m + props.slotMinutes <= 20 * 60; m += 30) list.push(m);
    return list;
  }, [props.slotMinutes]);

  const fmt = (m: number) => formatInZone(new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)), "UTC", { hour: "numeric", minute: "2-digit" });
  const zoneName = formatInZone(new Date(), props.timezone, { timeZoneName: "short" }).split(" ").pop();

  return (
    <section className="rise flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight">Pick a start time</h1>
        <p className="mt-2 text-ink-2">
          Only times that fit your full <strong>{duration(props.slotMinutes)}</strong> appointment are shown. Times are studio time ({zoneName}).
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((d, i) => (
          <button
            key={d.noon.toISOString()}
            type="button"
            onClick={() => {
              setDay(i);
              setTime(undefined);
            }}
            aria-pressed={i === day}
            className={cx(
              "flex min-w-16 flex-col items-center rounded-2xl border px-3 py-2 text-sm",
              i === day ? "border-ink bg-ink text-surface" : "border-line bg-surface",
            )}
          >
            <span className="text-xs opacity-75">{formatInZone(d.noon, "UTC", { weekday: "short" })}</span>
            <span className="font-display text-lg font-bold">{d.day}</span>
          </button>
        ))}
      </div>
      {starts.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {starts.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTime(m)}
              aria-pressed={time === m}
              className={cx(
                "h-11 rounded-xl border text-sm font-medium",
                time === m ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface hover:bg-surface-2",
              )}
            >
              {fmt(m)}
              <span className="block text-[0.65rem] opacity-70">→ {fmt(m + props.slotMinutes)}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm">This appointment is longer than one studio day. Your stylist will contact you to split it.</p>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        size="lg"
        disabled={time === undefined || busy}
        onClick={async () => {
          if (time === undefined) return;
          setBusy(true);
          setError(undefined);
          const d = days[day];
          const start = zonedToUtc(d.year, d.month, d.day, time, props.timezone);
          try {
            await props.onBook(start);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        Request this time · {props.currency === "USD" ? "$" : ""}
        {props.deposit} deposit
      </Button>
      <p className="text-xs text-muted">Deposits are collected by the studio&apos;s payment provider. In this demo no payment is taken.</p>
      <button type="button" onClick={props.onSkip} className="self-start text-sm text-muted underline underline-offset-2 hover:text-ink">
        Just save my quote
      </button>
    </section>
  );
}
