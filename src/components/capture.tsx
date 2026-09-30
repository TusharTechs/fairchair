"use client";

import { useEffect, useRef, useState } from "react";
import { CAPTURE_STEPS, PoseIcon } from "@/components/capture-guide";
import { Button, Card, SourceBadge, cx, type ResultSource } from "@/components/ui";
import { captureWithCameraKit } from "@/lib/client/camera-kit";
import { prepareImage, type Prepared } from "@/lib/client/image";
import type { Measurements } from "@/lib/hair/measurements";
import { VIEWS, type View } from "@/lib/youcam/features";

// Shared by the stylist quote flow and the extension-store match flow: guided
// four-selfie capture, consent, live/demo choice, and the measuring screen.

export type Demo = { id: string; name: string; blurb: string; photo?: string; source: "sample" | "replay"; recordedAt?: string };
export type TaskView = { feature: string; label: string; status: "running" | "success" | "error"; errorCode: string | null; cached: boolean };
export type AnalysisView = {
  id: string;
  source: ResultSource;
  status: "running" | "done" | "failed";
  tasks: TaskView[];
  measurements: Measurements;
};

export function PhotoStep(props: {
  /** Form fields identifying who the analysis is for, e.g. { studio, service } or { shop }. */
  fields: Record<string, string>;
  /** Who receives the measurements (shown in the consent text). */
  recipient: string;
  demos: Demo[];
  backLabel?: string;
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

  const [guided, setGuided] = useState<{ step: number; label: string }>();
  const urls = useRef<string[]>([]);

  // YouCam Camera Kit: step back (length) → three angles (type & frizz) → chin down (density).
  async function runGuided() {
    setLocalError(undefined);
    const toFile = (b: Blob, name: string) => new File([b], name, { type: b.type || "image/jpeg" });
    const add = async (view: View, file: File, size?: { width: number; height: number }) => {
      const prepared = await prepareImage(file, { size });
      const url = URL.createObjectURL(prepared.blob);
      urls.current.push(url);
      setShots((s) => ({ ...s, [view]: { ...prepared, url, file } }));
      return prepared;
    };
    try {
      setGuided({ step: 1, label: "Step back so your hair falls over your shoulders" });
      const full = await captureWithCameraKit("hairlength");
      if (full.length) await add("full", toFile(full[full.length - 1].blob, "full.jpg"));

      setGuided({ step: 2, label: "Face the camera, then turn right and left when asked" });
      const angles = await captureWithCameraKit("hairtype");
      if (angles.length >= 3) {
        const front = await add("front", toFile(angles[0].blob, "front.jpg"));
        await add("right", toFile(angles[1].blob, "right.jpg"), front);
        await add("left", toFile(angles[2].blob, "left.jpg"), front);
      }

      setGuided({ step: 3, label: "Lower your chin so your hairline faces the camera" });
      const down = await captureWithCameraKit("hairdensity");
      if (down.length) await add("down", toFile(down[down.length - 1].blob, "down.jpg"));
    } catch (e) {
      const message = (e as Error).message;
      if (message !== "closed") setLocalError(message);
    } finally {
      setGuided(undefined);
    }
  }
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
    for (const [k, v] of Object.entries(props.fields)) fd.set(k, v);
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
          ← {props.backLabel ?? "Change style"}
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-measured/30 bg-measured-soft px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{guided ? `Step ${guided.step} of 3` : "Guided camera by YouCam"}</p>
            <p className="text-xs text-ink-2">
              {guided ? guided.label : "Live checks for framing, angle and light — it takes each photo for you."}
            </p>
          </div>
          <Button variant="secondary" disabled={Boolean(guided)} onClick={runGuided}>
            {guided ? "Camera open…" : "Use guided camera"}
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted">Or add photos yourself:</p>
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
        {shots.full ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-measured">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shots.full.url} alt="Step-back photo" className="h-10 w-8 rounded object-cover" />
            Step-back photo for length ✓
          </p>
        ) : null}
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
            never stored by FairChair; {props.recipient} receives the measurements, not your photos.
          </span>
        </label>

        {live && !live.live ? <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-ink-2">{pausedCopy} Try a demo client below.</p> : null}

        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!shots.front || !consent || busy || !live?.live}
          onClick={() => {
            const total = VIEWS.reduce((sum, v) => sum + (shots[v]?.blob.size ?? 0), 0);
            if (total > 4_000_000) {
              setLocalError("Those photos are unusually large. Retake them with your phone's standard camera (not RAW or ProRAW).");
              return;
            }
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

// Shown while each YouCam measurement runs: what it will decide.
const DECIDES: Record<string, string> = {
  "hair-type": "Decides prep time and which texture blends",
  "hair-density": "Decides parting time and how many packs",
  "hair-length": "Decides the length tier and what to order",
  "hair-frizz": "Decides smoothing time",
  "hair-color": "Suggests a colour family",
};

export function Analysing({ analysis }: { analysis?: AnalysisView }) {
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
            <span className="min-w-0">
              <span className="block font-medium">{t.label}</span>
              {DECIDES[t.feature] ? <span className="block text-xs text-muted">{DECIDES[t.feature]}</span> : null}
            </span>
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

