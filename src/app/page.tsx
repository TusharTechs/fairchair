import { Chapters, type Chapter } from "@/components/landing/chapters";
import { BeforeAfter } from "@/components/before-after";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/site-footer";
import { demoMeasurements } from "@/components/two-heads";
import { ButtonLink, Card, Eyebrow, MeasuredChip, SiteHeader } from "@/components/ui";
import { demoClient } from "@/data/demo-clients";
import { DEMO_SHOP_PRODUCT_JSON } from "@/data/demo-shop";
import { DEMO_STUDIO_SLUG } from "@/lib/db/seed";
import { duration, money, moneyRange, signedMinutes } from "@/lib/format";
import { DENSITY_GRADES, FRIZZ_GRADES, HAIR_LENGTH_BANDS } from "@/lib/hair/measurements";
import { matchExtensions, productFromShopifyJson } from "@/lib/matching/extensions";
import { quote } from "@/lib/pricing/engine";
import type { Studio } from "@/lib/pricing/types";
import { studioBySlug } from "@/lib/studios";

export const dynamic = "force-dynamic";

const SOURCES = {
  birmingham: "https://www.aol.com/lifestyle/hair-appointment-gone-wrong-alabama-220000154.html",
  starting: "https://thebraidlounge.com/frequently-asked-questions/",
  hours: "https://defendernetwork.com/culture/black-hair-braids-culture/",
};

export default async function Home() {
  const studio = (await studioBySlug(DEMO_STUDIO_SLUG))!.studio;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero studio={studio} />
        <Problem />
        <HowItWorks studio={studio} />
        <TwoHeadsTeaser studio={studio} />
        <FairByDesign />
        <StoresSection />
        <StylistCta />
      </main>
      <SiteFooter />
    </>
  );
}

function Problem() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Eyebrow>The 11 pm DM</Eyebrow>
          <p className="mt-4 font-display text-4xl leading-[1.1] sm:text-5xl">
            Every braider&apos;s FAQ lists what changes the price. <em className="text-accent-ink">Nobody measures it.</em>
          </p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            <Fact n="6–12 h" label="how long many braided styles take" href={SOURCES.hours} />
            <Fact n="“from”" label="how studios price, because length and fullness vary" href={SOURCES.starting} />
            <Fact n="$200 → $250" label="a text quote that became a day-of surcharge — and a police call" href={SOURCES.birmingham} />
          </dl>
        </div>
        <div aria-label="An example conversation" className="rounded-[1.75rem] bg-bg p-5 ring-1 ring-line sm:p-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Tuesday, 11:04 pm</p>
          <div className="mt-4 space-y-2.5 text-[0.95rem]">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-surface">how much for medium knotless, mid-back? 🙏🏾</p>
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5">starts at $220, send a pic — depends on your hair</p>
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-surface">[blurry selfie]</p>
            <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5">ok should be around $220 😊</p>
          </div>
          <p className="mt-5 border-t border-dashed border-line-strong pt-4 text-sm text-ink-2">
            <span className="font-semibold text-danger">Saturday.</span> Fuller, longer hair than the selfie showed. Two extra hours. “It&apos;s $50 more.”
            The next client waits.
          </p>
        </div>
      </div>
    </section>
  );
}

function Fact({ n, label, href }: { n: string; label: string; href: string }) {
  return (
    <div className="border-t border-line-strong pt-3">
      <dt className="font-display text-3xl">{n}</dt>
      <dd className="mt-1 text-sm text-ink-2">
        {label}{" "}
        <a href={href} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-2 hover:text-ink">
          source
        </a>
      </dd>
    </div>
  );
}

function HowItWorks({ studio }: { studio: Studio }) {
  const maya = demoClient("maya")!;
  const service = studio.services.find((s) => s.id === "knotless")!;
  const m = demoMeasurements("maya", service.measures);
  const q = quote(studio, service, { size: "medium", length: "mid-back" }, m);
  const views = [
    ["Straight on", "/demo/generated/curly-collarbone.jpg"],
    ["Turn right", "/demo/generated/curly-collarbone-right.jpg"],
    ["Turn left", "/demo/generated/curly-collarbone-left.jpg"],
    ["Chin down", "/demo/generated/curly-collarbone-down.jpg"],
  ];
  const rows = [
    ["Curl pattern", m.type ? `${m.type.mapping.replace(" to ", "–").toUpperCase()} · ${m.type.term}` : "—"],
    ["Density", m.density ? `${DENSITY_GRADES[m.density.grade].label} · ${m.density.value.toFixed(2)} / 3` : "—"],
    ["Natural length", m.length ? HAIR_LENGTH_BANDS[m.length.index].label : "—"],
    ["Frizz", m.frizz ? FRIZZ_GRADES[m.frizz.grade].label : "—"],
  ];
  const frame = "overflow-hidden rounded-[1.5rem] bg-surface shadow-card ring-1 ring-line";

  const chapters: Chapter[] = [
    {
      n: "01",
      title: "Four quick selfies",
      body: "YouCam's guided camera checks framing, angle and light, and takes each photo itself — straight on, turned right and left, chin down.",
      api: "YouCam JS Camera Kit",
      visual: (
        <div className="grid h-full grid-cols-2 gap-3">
          {views.map(([label, src]) => (
            <figure key={label} className={`${frame} relative`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${maya.name}, ${label.toLowerCase()} (AI-generated demo client)`} className="h-full w-full object-cover" loading="lazy" />
              <figcaption className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2.5 py-1 text-[0.68rem] font-medium">{label}</figcaption>
            </figure>
          ))}
        </div>
      ),
    },
    {
      n: "02",
      title: "Measured, not guessed",
      body: "Each angle feeds a YouCam hair measurement. The same photos always give the same result — so the same hair always gets the same price.",
      api: "YouCam Hair Type · Density · Length · Frizz",
      visual: (
        <div className={`${frame} grid h-full grid-cols-[0.9fr_1.1fr]`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={maya.photo} alt={`${maya.name} (AI-generated demo client)`} className="h-full w-full object-cover" loading="lazy" />
          <dl className="flex flex-col justify-center gap-5 p-6">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-measured">{k}</dt>
                <dd className="mt-0.5 font-display text-xl leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      n: "03",
      title: "Priced by the stylist's own rules",
      body: "Measured differences become minutes of chair time at the stylist's rate. Every line says what caused it.",
      api: "Deterministic pricing · fairness guard",
      visual: (
        <div className={`${frame} flex h-full flex-col justify-center p-6 sm:p-8`}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">{studio.name}</p>
          <p className="font-display text-2xl">Knotless · medium · mid-back</p>
          <ul className="mt-4 divide-y divide-line">
            {q.lines.slice(1).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>{l.label}</span>
                <span className="flex items-center gap-2">
                  {l.because.type === "measurement" ? <MeasuredChip>{l.because.youcam.split(":")[0]}</MeasuredChip> : null}
                  <span className="tabular font-mono text-xs text-ink-2">{signedMinutes(l.minutes)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
            <span className="font-display text-4xl tabular">{moneyRange(q.price, studio.currency)}</span>
            <span className="text-sm text-ink-2">{duration(q.slotMinutes)} reserved</span>
          </div>
        </div>
      ),
    },
    {
      n: "04",
      title: "See the stylist's work on you",
      body: "The client previews the stylist's own portfolio photo on themselves before paying a deposit. Not a stock style — this stylist's braids.",
      api: "YouCam Hairstyle (hair-transfer)",
      visual: (
        <BeforeAfter
          invite={false}
          className="aspect-[4/5] rounded-[1.5rem] shadow-card lg:aspect-auto lg:h-full"
          before={{ src: maya.photo, alt: `${maya.name}, natural curls`, label: "Today" }}
          after={{ src: maya.previews!.knotless, alt: `${maya.name} previewed with knotless braids`, label: "Preview" }}
        />
      ),
    },
    {
      n: "05",
      title: "A slot as long as the hair needs",
      body: "Only start times that fit the whole appointment are offered. Both sides keep the same receipt.",
      api: "Booking · hashed receipt",
      visual: <SlotVisual base={q.lines[0].minutes[0]} slot={q.slotMinutes} name={maya.name} />,
    },
  ];

  return (
    <section id="how" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
          From a selfie to an honest quote, <em className="text-accent-ink">in about a minute.</em>
        </h2>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Chapters chapters={chapters} />
      </div>
    </section>
  );
}

function SlotVisual({ base, slot, name }: { base: number; slot: number; name: string }) {
  const open = 8 * 60;
  const close = 20 * 60;
  const pct = (m: number) => `${((m - open) / (close - open)) * 100}%`;
  const start = 9 * 60;
  const clock = (m: number) => {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h > 12 ? h - 12 : h}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${h >= 12 ? "pm" : "am"}`;
  };
  return (
    <div className="flex h-full flex-col justify-center overflow-hidden rounded-[1.5rem] bg-surface p-6 shadow-card ring-1 ring-line sm:p-8">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Saturday · {name}&apos;s appointment</p>
      <div className="relative mt-4 h-80 rounded-xl border border-line bg-bg">
        {[8, 10, 12, 14, 16, 18].map((h) => (
          <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: pct(h * 60) }}>
            <span className="absolute left-2 top-1 font-mono text-[0.6rem] text-muted">{clock(h * 60)}</span>
          </div>
        ))}
        <div className="absolute left-14 right-3 rounded-lg bg-accent-soft p-3 ring-1 ring-accent/30" style={{ top: pct(start), height: `calc(${pct(open + slot)})` }}>
          <p className="text-sm font-semibold">{name} · knotless, mid-back</p>
          <p className="text-xs text-ink-2">
            {clock(start)} – {clock(start + slot)} · {duration(slot)} reserved from YouCam measurements
          </p>
        </div>
        {/* Where a flat, one-size slot would have ended */}
        <div className="absolute left-14 right-3 border-t-2 border-dashed border-ink/60" style={{ top: pct(start + base) }}>
          <span className="absolute right-2 -top-6 rounded-full bg-ink px-2 py-0.5 text-[0.65rem] font-medium text-surface">
            a flat {duration(base)} slot ends here
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-2">
        <strong className="font-semibold text-ink">+{duration(slot - base)}</strong> the day would have run over without measuring.
      </p>
    </div>
  );
}

function TwoHeadsTeaser({ studio }: { studio: Studio }) {
  const service = studio.services.find((s) => s.id === "knotless")!;
  const heads = ["maya", "nia"].map((id) => {
    const c = demoClient(id)!;
    const m = demoMeasurements(id, service.measures);
    return { c, m, q: quote(studio, service, { size: "medium", length: "mid-back" }, m) };
  });
  return (
    <section className="bg-ink text-surface">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-surface/60">Same style. Two heads.</p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            The curlier head isn&apos;t the one that costs more. <em className="text-gold">The fuller one is.</em>
          </h2>
          <p className="mt-4 max-w-md text-surface/75">
            Both clients asked for medium knotless, mid-back. With real YouCam measurements, fullness and length drive the difference — texture only
            ever adds prep time.
          </p>
          <ButtonLink href="/compare" size="lg" variant="inverse" className="mt-8">
            See every line of both quotes
          </ButtonLink>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {heads.map(({ c, m, q }) => (
            <figure key={c.id}>
              <div className="overflow-hidden rounded-[1.5rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.photo} alt={`${c.name} (AI-generated demo client)`} className="aspect-[4/5] w-full object-cover" loading="lazy" />
              </div>
              <figcaption className="mt-3">
                <p className="font-display text-2xl">{c.name}</p>
                <p className="text-xs text-surface/60">
                  {m.type?.mapping.replace(" to ", "–").toUpperCase()} · {m.density ? DENSITY_GRADES[m.density.grade].label.toLowerCase() : ""} density
                </p>
                <p className="mt-2 font-display text-3xl tabular">{moneyRange(q.price, studio.currency)}</p>
                <p className="text-sm text-surface/70">{duration(q.slotMinutes)} in the chair</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FairByDesign() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div>
        <Eyebrow>Fair by design</Eyebrow>
        <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
          Texture changes <em className="text-accent-ink">time.</em> Never the rate.
        </h2>
        <p className="mt-4 text-lg text-ink-2">
          Coily hair can take longer to stretch and detangle — that&apos;s real work, priced as minutes at the stylist&apos;s rate. A flat “+$25 for 4C” is
          a texture surcharge. FairChair won&apos;t apply one; it flags it and offers the time-based equivalent.
        </p>
      </div>
      <Card className="p-6">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">Rule check</p>
        <div className="mt-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm">
          <p className="font-semibold text-warn">“+$25 if hair is 4C” is a texture surcharge</p>
          <p className="mt-1 text-ink-2">At a $40/h rate that&apos;s about 40 minutes. Price it as prep time instead?</p>
        </div>
        <div className="mt-3 rounded-xl border border-measured/30 bg-measured-soft px-4 py-3 text-sm">
          <p className="font-semibold text-measured">Stretch &amp; detangle prep · Coily (4a–4c) · +70 min</p>
          <p className="mt-1 text-ink-2">Shown to every client with the measurement that triggered it.</p>
        </div>
      </Card>
    </section>
  );
}

function StylistCta() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-4xl leading-tight">
            Put an honest quote link <em className="text-accent-ink">in your bio.</em>
          </h2>
          <p className="mt-2 max-w-xl text-ink-2">Your menu, your rate, your portfolio. Three minutes to set up. Free during the pilot.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/start" size="lg">
            Set up your studio
          </ButtonLink>
          <ButtonLink href="/studio/amara-braids-demo?key=demo" size="lg" variant="secondary">
            Explore the stylist view
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function StoresSection() {
  // A real match, computed by the engine from Nia's recorded YouCam measurements.
  const product = productFromShopifyJson(DEMO_SHOP_PRODUCT_JSON);
  const match = matchExtensions(product, demoMeasurements("nia", ["type", "density", "length"]), 20, undefined, "black");
  const v = match.variant!;
  return (
    <section id="stores" className="scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Eyebrow>For hair-extension & wig stores</Eyebrow>
          <h2 className="mt-3 font-display text-4xl font-normal leading-tight">Opened hair can&apos;t be returned. Match it before checkout.</h2>
          <p className="mt-4 text-lg text-ink-2">
            The same measurements answer every extension shopper&apos;s question — which texture, what length, how many packs. “Find my match” picks
            the right variant of <em>your</em> Shopify product, previews it blended into the shopper&apos;s own hair with YouCam, and sends them to
            your checkout.
          </p>
          <ul className="mt-5 space-y-2 text-ink-2">
            <li>• Texture from curl pattern, packs from density, length with shrinkage allowance</li>
            <li>• Extension try-on that keeps the shopper&apos;s own texture (YouCam hair extension)</li>
            <li>• Paste a product link to connect — no Shopify app, one Custom Liquid block</li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/store-demo" size="lg">
              See it on a store
            </ButtonLink>
            <ButtonLink href="/shops/new" size="lg" variant="secondary">
              Connect your Shopify product
            </ButtonLink>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="flex gap-4 p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo/extensions/coily-long-full-all_length_2.jpg" alt="Extensions previewed on Nia (AI-generated demo client)" className="h-40 w-30 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Nia&apos;s match</p>
              <p className="mt-1 font-display text-xl font-normal leading-tight">{v.title}</p>
              <p className="tabular mt-1 text-sm text-ink-2">
                {match.quantity} packs · {money((v.price * match.quantity) / 100)}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-line border-t border-line px-5">
            {match.reasons.map((r) => (
              <li key={r.what} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span>
                  <span className="text-muted">{r.what}</span> <strong>{r.choice}</strong>
                </span>
                {r.measured ? (
                  <MeasuredChip>{r.because.length > 44 ? `${r.because.slice(0, 44)}…` : r.because}</MeasuredChip>
                ) : (
                  <span className="text-xs text-ink-2">{r.because.split(" (")[0]}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-line bg-surface-2/60 px-5 py-3 font-mono text-[0.7rem] text-muted">→ /cart/{v.id}:{match.quantity} on the store&apos;s own Shopify checkout</p>
        </Card>
      </div>
    </section>
  );
}
