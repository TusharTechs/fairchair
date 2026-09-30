"use client";

import { useMemo, useState } from "react";
import { Analysing, PhotoStep, type AnalysisView, type Demo } from "@/components/capture";
import { HairCard } from "@/components/hair-card";
import { Button, Card, Eyebrow, MeasuredChip, SourceBadge, cx, type ResultSource } from "@/components/ui";
import { prepareImage } from "@/lib/client/image";
import { money } from "@/lib/format";
import { cartPermalink, matchExtensions, type MatchSettings, type Product } from "@/lib/matching/extensions";
import { FAMILY_INFO, type ColourFamily } from "@/lib/pricing/shades";
import { guidanceFor } from "@/lib/youcam/errors";

export type ShopView = { slug: string; name: string; domain: string; isDemo: boolean; product: Product; settings: MatchSettings };

const SWATCH: Record<ColourFamily, string> = {
  black: "#141110",
  brown: "#4a2e1b",
  blonde: "#d8bf86",
  auburn: "#8c4b25",
  red: "#7a1f24",
  grey: "#a3a09b",
};

type Step = "intro" | "photos" | "analysing" | "result";

export function MatchFlow({ shop, demos }: { shop: ShopView; demos: Demo[] }) {
  const lengths = useMemo(() => {
    const i = shop.product.optionNames.findIndex((n) => /length|inch/i.test(n));
    const set = new Set<number>();
    for (const v of shop.product.variants) {
      const n = Number(/(\d{1,2})/.exec(v.options[i] ?? "")?.[1]);
      if (n) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
  }, [shop.product]);
  const [step, setStep] = useState<Step>("intro");
  const [desired, setDesired] = useState<number>();
  const [colour, setColour] = useState<ColourFamily>();
  const [analysis, setAnalysis] = useState<AnalysisView>();
  const [error, setError] = useState<string>();
  const [source, setSource] = useState<{ front?: Blob; demo?: string }>({});

  async function start(body: FormData) {
    const front = body.get("front");
    const demo = body.get("demo");
    setSource({ front: front instanceof Blob ? front : undefined, demo: typeof demo === "string" ? demo : undefined });
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
    for (let i = 0; i < 90; i++) {
      const r = await fetch(`/api/analyses/${data.id}`, { cache: "no-store" });
      if (r.ok) {
        const view: AnalysisView = await r.json();
        setAnalysis(view);
        if (view.status !== "running") {
          if (view.status === "failed") {
            setError(guidanceFor(view.tasks.find((t) => t.errorCode)?.errorCode ?? undefined));
            setStep("photos");
          } else setStep("result");
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
      {step === "intro" && (
        <section className="rise flex flex-col gap-5">
          <div>
            <Eyebrow>{shop.name}</Eyebrow>
            <h1 className="mt-2 font-display text-3xl font-normal leading-tight">Find your match</h1>
            <p className="mt-2 text-ink-2">
              Opened hair can&apos;t be returned. Four selfies tell us your texture, fullness and length, so you order the right{" "}
              {shop.product.title.toLowerCase()} the first time.
            </p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">How long do you want it?</legend>
            <div className="flex flex-wrap gap-2">
              {lengths.map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={desired === l}
                  onClick={() => setDesired(l)}
                  className={cx(
                    "h-10 rounded-full border px-4 text-sm font-medium",
                    desired === l ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface hover:bg-surface-2",
                  )}
                >
                  {l}&quot;
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Your hair colour</legend>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FAMILY_INFO) as ColourFamily[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={colour === c}
                  onClick={() => setColour(c)}
                  className={cx(
                    "flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
                    colour === c ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface hover:bg-surface-2",
                  )}
                >
                  <span className="h-4 w-4 rounded-full border border-white/40" style={{ background: SWATCH[c] }} />
                  {FAMILY_INFO[c].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">You choose colour — camera colour isn&apos;t reliable enough to pick a shade for you.</p>
          </fieldset>
          <Button size="lg" className="self-start" disabled={!desired || !colour} onClick={() => setStep("photos")}>
            Continue
          </Button>
        </section>
      )}

      {step === "photos" && (
        <PhotoStep
          fields={{ shop: shop.slug }}
          recipient={shop.name}
          demos={demos}
          error={error}
          backLabel="Change length or colour"
          onBack={() => setStep("intro")}
          onSubmit={start}
        />
      )}

      {step === "analysing" && <Analysing analysis={analysis} />}

      {step === "result" && analysis && desired && colour && (
        <Result shop={shop} analysis={analysis} desired={desired} colour={colour} source={source} onRetake={() => setStep("photos")} />
      )}
    </div>
  );
}

function Result({
  shop,
  analysis,
  desired,
  colour,
  source,
  onRetake,
}: {
  shop: ShopView;
  analysis: AnalysisView;
  desired: number;
  colour: ColourFamily;
  source: { front?: Blob; demo?: string };
  onRetake: () => void;
}) {
  const match = useMemo(() => matchExtensions(shop.product, analysis.measurements, desired, shop.settings, colour), [shop, analysis, desired, colour]);
  const [variantId, setVariantId] = useState(match.variant?.id);
  const variant = [match.variant, ...match.alternatives].find((v) => v?.id === variantId) ?? match.variant;
  const cartUrl = variant ? cartPermalink(shop.domain, variant.id, match.quantity) : undefined;

  return (
    <section className="rise flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-normal leading-tight">Your match</h1>
        <SourceBadge source={analysis.source} />
      </div>

      <Card className="p-5">
        <HairCard measurements={analysis.measurements} />
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span className="text-ink-2">Doesn&apos;t look right?</span>
          <Button variant="secondary" onClick={onRetake}>
            Retake photos
          </Button>
        </div>
      </Card>

      {variant ? (
        <Card className="overflow-hidden">
          <div className="p-5">
            <Eyebrow>{shop.product.title}</Eyebrow>
            <p className="mt-1 font-display text-2xl font-normal">{variant.title}</p>
            <p className="tabular mt-1 text-ink-2">
              {match.quantity} × {money(variant.price / 100)} = <strong className="text-ink">{money((variant.price * match.quantity) / 100)}</strong>
            </p>
            <ul className="mt-4 divide-y divide-line">
              {match.reasons.map((r) => (
                <li key={r.what} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="text-sm text-muted">{r.what}</span> <strong>{r.choice}</strong>
                  </span>
                  {r.measured ? (
                    <MeasuredChip>{r.because}</MeasuredChip>
                  ) : (
                    <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-ink-2">{r.because}</span>
                  )}
                </li>
              ))}
            </ul>
            {match.alternatives.length ? (
              <div className="mt-3">
                <p className="text-xs text-muted">Close alternatives</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[match.variant!, ...match.alternatives].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={v.id === variant.id}
                      onClick={() => setVariantId(v.id)}
                      className={cx(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        v.id === variant.id ? "border-ink bg-ink text-surface" : "border-line-strong bg-surface",
                      )}
                    >
                      {v.options.at(-1)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {match.warnings.length ? (
              <ul className="mt-3 space-y-1 text-xs text-warn">
                {match.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="border-t border-line bg-surface-2/60 p-5">
            {shop.isDemo ? (
              <>
                <Button size="lg" className="w-full" disabled>
                  Add {match.quantity} packs to cart · {money((variant.price * match.quantity) / 100)}
                </Button>
                <p className="mt-2 text-xs text-muted">
                  Demo store. On a real Shopify store this button opens checkout with exactly this variant and quantity:
                </p>
                <p className="mt-1 break-all font-mono text-[0.7rem] text-ink-2">{cartUrl}</p>
              </>
            ) : (
              <a
                href={cartUrl}
                target="_top"
                className="flex h-12 w-full items-center justify-center rounded-full bg-ink text-[0.95rem] font-semibold text-surface hover:bg-ink-2"
              >
                Add {match.quantity} packs to cart · {money((variant.price * match.quantity) / 100)}
              </a>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5 text-sm text-ink-2">No variant of this product fits your hair. {match.warnings.join(" ")}</Card>
      )}

      {source.front || source.demo ? <ExtensionTryOn shop={shop} source={source} template={match.tryOnTemplate} /> : null}
    </section>
  );
}

function ExtensionTryOn({ shop, source, template }: { shop: ShopView; source: { front?: Blob; demo?: string }; template: string }) {
  const [state, setState] = useState<{ kind: "idle" } | { kind: "loading" } | { kind: "done"; image: string; source: ResultSource } | { kind: "error"; message: string }>({
    kind: "idle",
  });
  async function run() {
    setState({ kind: "loading" });
    const fd = new FormData();
    fd.set("shop", shop.slug);
    fd.set("template", template);
    if (source.demo) fd.set("demo", source.demo);
    else if (source.front) fd.append("front", (await prepareImage(source.front, { maxSide: 1024 })).blob, "front.jpg");
    const res = await fetch("/api/tryon-ext", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ kind: "error", message: data?.error?.message ?? "The preview couldn't be made." });
    setState({ kind: "done", image: data.image, source: data.source });
  }
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <Eyebrow>See it blended into your hair</Eyebrow>
        {state.kind === "done" ? <SourceBadge source={state.source} /> : null}
      </div>
      <div className="mt-3 aspect-[3/4] max-h-[28rem] overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface-2">
        {state.kind === "done" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.image} alt="Extensions previewed on you" className="h-full w-full object-cover" />
        ) : (
          <button type="button" disabled={state.kind === "loading"} onClick={run} className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
            <span className="text-sm font-semibold">{state.kind === "loading" ? "Adding length…" : "Preview extensions on me"}</span>
            <span className="text-xs text-muted">YouCam hair extension try-on · keeps your own texture</span>
          </button>
        )}
      </div>
      {state.kind === "done" ? <p className="mt-2 text-xs text-muted">A preview of added length and fullness, not the exact product. Not saved.</p> : null}
      {state.kind === "error" ? <p className="mt-2 text-sm text-danger">{state.message}</p> : null}
    </Card>
  );
}
