"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { HairCard } from "@/components/hair-card";
import { QuoteReceipt } from "@/components/quote-receipt";
import { SupplyList } from "@/components/supplies";
import { Button, Card, Eyebrow, MeasuredChip, SourceBadge, cx, type ResultSource } from "@/components/ui";
import { CAPTURE_STEPS, PoseIcon } from "@/components/capture-guide";
import { prepareImage, type Prepared } from "@/lib/client/image";
import { VIEWS, type View } from "@/lib/youcam/features";
import { duration } from "@/lib/format";
import { formatInZone, zonedDate, zonedToUtc } from "@/lib/time";
import { HAIR_LENGTH_BANDS, LENGTH_TIERS, type LengthTier, type Measurements } from "@/lib/hair/measurements";
import { quote as computeQuote } from "@/lib/pricing/engine";
import { BUCKET_LABELS, type QuoteOptions, type Service, type Studio } from "@/lib/pricing/types";
import { guidanceFor } from "@/lib/youcam/errors";

type Demo = { id: string; name: string; blurb: string; photo?: string; source: "sample" | "replay"; recordedAt?: string };

type TaskView = { feature: string; label: string; status: "running" | "success" | "error"; errorCode: string | null; cached: boolean };
type AnalysisView = {
  id: string;
  source: ResultSource;
  status: "running" | "done" | "failed";
  tasks: TaskView[];
  measurements: Measurements;
};

type Step = "service" | "photos" | "analysing" | "result" | "book";

export function QuoteFlow({ studio, demos }: { studio: Studio; demos: Demo[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState<string>();
  const [options, setOptions] = useState<QuoteOptions>({});
  const [analysis, setAnalysis] = useState<AnalysisView>();
  const [error, setError] = useState<string>();
  const [quoteId, setQuoteId] = useState<string>();

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
          studio={studio}
          service={service}
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

function PhotoStep(props: {
  studio: Studio;
  service: Service;
  demos: Demo[];
  error?: string;
  onBack: () => void;
  onSubmit: (form: FormData) => void;
}) {
  type Shot = Prepared & { url: string; file: File };
  const [live, setLive] = useState<{ live: boolean; reason: string | null }>();
  const [shots, setShots] = useState<Partial<Record<View, Shot>>>({});
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setLive)
      .catch(() => setLive({ live: false, reason: "unreachable" }));
  }, []);

  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  async function pick(view: View, file: File | undefined) {
    if (!file) return;
    setLocalError(undefined);
    try {
      // Side views must match the front photo's exact size (YouCam requirement).
      const front = shots.front;
      const size = view === "right" || view === "left" ? (front ? { width: front.width, height: front.height } : undefined) : undefined;
      const prepared = await prepareImage(file, { size });
      const url = URL.createObjectURL(prepared.blob);
      urls.current.push(url);
      setShots((s) => {
        const next = { ...s, [view]: { ...prepared, url, file } };
        return next;
      });
      // A new front photo changes the target size: refit existing side views.
      if (view === "front") {
        for (const side of ["right", "left"] as const) {
          const existing = shots[side];
          if (!existing) continue;
          const refit = await prepareImage(existing.file, { size: { width: prepared.width, height: prepared.height } });
          const u = URL.createObjectURL(refit.blob);
          urls.current.push(u);
          setShots((s) => ({ ...s, [side]: { ...refit, url: u, file: existing.file } }));
        }
      }
    } catch (e) {
      setLocalError((e as Error).message);
    }
  }

  function base() {
    const fd = new FormData();
    fd.set("studio", props.studio.slug);
    fd.set("service", props.service.id);
    return fd;
  }

  const sidesMissing = !shots.right || !shots.left;
  const pausedCopy =
    live?.reason === "daily_cap"
      ? "You've used today's live analyses on this device."
      : live?.reason === "not_configured"
        ? "Live analysis isn't connected on this deployment."
        : "Live analysis is paused right now to protect the demo's API budget.";

  return (
    <section className="rise flex flex-col gap-5">
      <div>
        <button type="button" onClick={props.onBack} className="text-sm text-muted hover:text-ink">
          ← Change style
        </button>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight">Four quick selfies. That&apos;s the consult.</h1>
        <p className="mt-2 text-ink-2">
          Wear your hair loose — out of braids, a bun or a wrap. Stand facing a window or a light. Each angle feeds a different YouCam hair measurement.
        </p>
      </div>

      {(props.error || localError) && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-ink">
          {props.error || localError}
        </div>
      )}

      <Card className="p-4 sm:p-5">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CAPTURE_STEPS.map((step, i) => (
            <li key={step.view}>
              <CaptureSlot
                n={i + 1}
                step={step}
                value={shots[step.view]?.url}
                onPick={(f) => pick(step.view, f)}
                onClear={() => setShots((s) => ({ ...s, [step.view]: undefined }))}
              />
            </li>
          ))}
        </ol>
        {shots.front && (sidesMissing || !shots.down) ? (
          <p className="mt-3 text-xs text-muted">
            {sidesMissing ? "Without both side views, curl pattern and frizz aren't measured. " : ""}
            {!shots.down ? "Without the chin-down photo, density isn't measured. " : ""}
            Your quote will show a wider range for anything not measured.
          </p>
        ) : null}

        <label className="mt-4 flex items-start gap-3 text-sm text-ink-2">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I agree to my photos being sent to YouCam (Perfect Corp.) to measure my hair. They&apos;re deleted from YouCam after analysis and
            never stored by FairChair; {props.studio.name} receives the measurements and your quote, not your photos.
          </span>
        </label>

        {live && !live.live ? <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-ink-2">{pausedCopy} Try a demo client below.</p> : null}

        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!shots.front || !consent || busy || !live?.live}
          onClick={() => {
            setBusy(true);
            const fd = base();
            for (const view of VIEWS) {
              const shot = shots[view];
              if (shot) fd.append(view, shot.blob, `${view}.jpg`);
            }
            props.onSubmit(fd);
          }}
        >
          Measure my hair
        </Button>
      </Card>

      <div>
        <p className="text-sm font-semibold">No photos handy? Try a demo client</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {props.demos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                const fd = base();
                fd.set("demo", d.id);
                props.onSubmit(fd);
              }}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left hover:border-line-strong"
            >
              {d.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photo} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover" />
              ) : null}
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold">{d.name}</span>
                <span className="block text-sm text-ink-2">{d.blurb}</span>
                <span className="mt-1.5 block">
                  <SourceBadge source={d.source} recordedAt={d.recordedAt} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaptureSlot(props: {
  n: number;
  step: (typeof CAPTURE_STEPS)[number];
  value?: string;
  onPick: (f?: File) => void;
  onClear: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const { step } = props;
  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[3/4] max-h-64 overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2">
        {props.value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={props.value} alt={`${step.title} photo`} className="h-full w-full object-cover" />
            <button type="button" onClick={props.onClear} className="absolute right-2 top-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-surface">
              Retake
            </button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
            <PoseIcon view={step.view} className="h-12 w-12 text-ink-2" />
            <span className="text-sm font-semibold text-ink">
              {props.n}. {step.title}
            </span>
            <span className="text-[0.7rem] leading-snug text-muted">{step.how}</span>
          </button>
        )}
      </div>
      <p className="mt-1.5 text-[0.7rem] text-muted">
        <span className="font-semibold text-measured">{step.unlocks}</span>
        {step.required ? " · required" : ""}
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        capture="user"
        className="sr-only"
        aria-label={`${step.title} photo`}
        onChange={(e) => {
          props.onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Analysing({ analysis }: { analysis?: AnalysisView }) {
  const tasks = analysis?.tasks ?? [];
  return (
    <section className="rise flex flex-col items-center gap-6 py-6 text-center" aria-live="polite">
      <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="scanline absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-measured/25 to-transparent" />
        <svg viewBox="0 0 64 64" className="absolute inset-0 m-auto h-14 w-14 text-measured" aria-hidden>
          <path d="M8 32h10l6-14 8 28 8-20 6 6h10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h1 className="font-display text-2xl font-extrabold">Measuring your hair</h1>
        <p className="mt-1 text-ink-2">Each measurement is a separate YouCam analysis. This usually takes a few seconds.</p>
      </div>
      <ul className="w-full max-w-sm divide-y divide-line rounded-2xl border border-line bg-surface text-left">
        {(tasks.length ? tasks : [{ feature: "…", label: "Uploading photos", status: "running", errorCode: null, cached: false } as TaskView]).map((t) => (
          <li key={t.feature} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="font-medium">{t.label}</span>
            <span
              className={cx(
                "font-mono text-xs",
                t.status === "success" ? "text-measured" : t.status === "error" ? "text-danger" : "text-muted",
              )}
            >
              {t.status === "success" ? (t.cached ? "✓ reused" : "✓ done") : t.status === "error" ? "couldn't read" : "measuring…"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResultStep(props: {
  studio: Studio;
  service: Service;
  analysis: AnalysisView;
  quote: ReturnType<typeof computeQuote>;
  stretched?: LengthTier;
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
          <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-ink-2">
            {failed.map((f) => f.label).join(", ")} couldn&apos;t be read ({guidanceFor(failed[0].errorCode ?? undefined)}). Your range is
            wider to cover it.
          </p>
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
