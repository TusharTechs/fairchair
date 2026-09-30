import { TwoHeads, demoMeasurements } from "@/components/two-heads";
import { DEMO_SHOP_PRODUCT_JSON } from "@/data/demo-shop";
import { money } from "@/lib/format";
import { matchExtensions, productFromShopifyJson } from "@/lib/matching/extensions";
import { ButtonLink, Card, Eyebrow, MeasuredChip, SiteHeader } from "@/components/ui";
import { DEMO_ADMIN_TOKEN, DEMO_STUDIO_SLUG } from "@/lib/db/seed";
import { studioBySlug } from "@/lib/studios";

export const dynamic = "force-dynamic";

const SOURCES = {
  birmingham: "https://www.aol.com/lifestyle/hair-appointment-gone-wrong-alabama-220000154.html",
  starting: "https://thebraidlounge.com/frequently-asked-questions/",
  hours: "https://defendernetwork.com/culture/black-hair-braids-culture/",
  dispute: "https://www.homebusinesshub.us/blog/how-much-to-charge-for-hair-braiding/",
  manual: "https://braidbosspro.app/",
};

export default async function Home() {
  const demo = await studioBySlug(DEMO_STUDIO_SLUG);
  const studio = demo!.studio;

  return (
    <>
      <SiteHeader
        right={
          <>
            <ButtonLink href="#stores" variant="ghost" className="hidden sm:inline-flex">
              For stores
            </ButtonLink>
            <ButtonLink href={`/studio/${DEMO_STUDIO_SLUG}?key=${DEMO_ADMIN_TOKEN}`} variant="ghost" className="hidden sm:inline-flex">
              Stylist view
            </ButtonLink>
            <ButtonLink href="/start" variant="secondary">
              Set up your studio
            </ButtonLink>
          </>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
          <div className="rise">
            <Eyebrow>For braiders &amp; extension stylists</Eyebrow>
            <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl">
              Price the hair,
              <br />
              not the argument.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              FairChair measures a client&apos;s hair from four quick selfies with <strong className="font-semibold text-ink">YouCam Hair AI</strong>, then
              turns your menu into a line-item quote, an appointment as long as the hair actually needs, and a supply list —{" "}
              <em>before</em> anyone books.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/s/${DEMO_STUDIO_SLUG}`} size="lg">
                Get a quote as a client
              </ButtonLink>
              <ButtonLink href="#two-heads" size="lg" variant="secondary">
                See two heads, two quotes
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              <MeasuredChip>Hair Type</MeasuredChip>
              <MeasuredChip>Hair Density</MeasuredChip>
              <MeasuredChip>Hair Length</MeasuredChip>
              <MeasuredChip>Hair Frizziness</MeasuredChip>
              <MeasuredChip>Hair Colour</MeasuredChip>
            </div>
          </div>

          <Card className="rise self-start p-5 sm:p-6 [animation-delay:120ms]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Today, 11:04 pm</p>
            <div className="mt-4 space-y-3 text-[0.95rem]">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-surface">
                hey!! how much for medium knotless, mid-back? 🙏🏾
              </p>
              <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5">starts at $220 but send a pic, depends on your hair</p>
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-surface">[blurry selfie]</p>
              <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5">ok should be around $220 😊</p>
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-danger/40 bg-danger/5 px-4 py-3 text-sm text-ink-2">
              <strong className="text-danger">Saturday:</strong> fuller, longer hair than the selfie showed. Two extra hours. “It&apos;s $50
              more.” Next client waits. Nobody is happy.
            </div>
          </Card>
        </section>

        {/* Problem */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
            <Problem
              n="01"
              title="“Starting at” is a guess"
              body="Braid prices depend on the client's natural length, fullness and texture. Studios say so in their FAQs — then quote from a DM."
              href={SOURCES.starting}
            />
            <Problem
              n="02"
              title="The chair runs over"
              body="Many braided styles take 6 hours or more, some 10–12. A full head booked into a standard slot pushes the whole day."
              href={SOURCES.hours}
            />
            <Problem
              n="03"
              title="The surcharge becomes a fight"
              body="In Nov 2025 a $200 text quote and a $50 day-of add-on escalated to arrests in Birmingham, AL. Existing quote tools still make someone type the hair in."
              href={SOURCES.birmingham}
            />
          </div>
        </section>

        {/* Two heads */}
        <section id="two-heads" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>The whole idea in one screen</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">Same style. Two heads. Two honest quotes.</h2>
            <p className="mt-3 text-lg text-ink-2">
              Both clients ask {studio.name} for medium knotless, mid-back. FairChair measures each head, applies the stylist&apos;s own
              rules, and shows exactly why the numbers differ.
            </p>
          </div>
          <div className="mt-10">
            <TwoHeads studio={studio} serviceId="knotless" options={{ size: "medium", length: "mid-back" }} />
          </div>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <Step
                n="1"
                title="Measure"
                body="The client takes four guided selfies — straight on, turned right, turned left, chin down. YouCam's hair detectors read curl pattern, density, natural length and frizz, plus hair colour for extension services."
              />
              <Step
                n="2"
                title="Price"
                body="Your menu, your hourly rate, your rules. Measured differences become minutes of chair time and a price range — never a surcharge for texture."
              />
              <Step
                n="3"
                title="Agree"
                body="The client sees every line and why, books a slot already sized to the work, and pays a deposit. Both of you keep the same hashed receipt."
              />
            </div>
          </div>
        </section>

        {/* Fair by design */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <Eyebrow>Fair by design</Eyebrow>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">Texture changes time. It never changes the rate.</h2>
            <p className="mt-4 text-lg text-ink-2">
              Coily hair can take longer to stretch and detangle — that&apos;s real work, and FairChair prices it as minutes at your hourly
              rate. A flat “+$25 for 4C” is a texture surcharge. FairChair won&apos;t apply one; it flags it and offers the time-based
              equivalent.
            </p>
          </div>
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-semibold">Rule check</p>
            <div className="mt-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3 text-sm">
              <p className="font-semibold text-warn">“+$25 if hair is 4C” is a texture surcharge</p>
              <p className="mt-1 text-ink-2">At your $40/h rate that&apos;s about 40 minutes. Price it as prep time instead?</p>
            </div>
            <div className="mt-3 rounded-xl border border-measured/30 bg-measured-soft px-4 py-3 text-sm">
              <p className="font-semibold text-measured">Stretch &amp; detangle prep · Coily (4a–4c) · +70 min</p>
              <p className="mt-1 text-ink-2">Shown to every client with the measurement that triggered it.</p>
            </div>
          </Card>
        </section>

        {/* For extension stores */}
        <StoresSection />

        {/* CTA */}
        <section className="border-t border-line bg-ink text-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold">Put an honest quote link in your bio.</h2>
              <p className="mt-2 max-w-xl text-surface/75">
                Set up your menu in three minutes. Clients get a real number; you get the right-length day.
              </p>
              <p className="mt-2 text-sm text-surface/60">Free for stylists during the pilot.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/start" size="lg" variant="inverse">
                Set up your studio
              </ButtonLink>
              <ButtonLink
                href={`/studio/${DEMO_STUDIO_SLUG}?key=${DEMO_ADMIN_TOKEN}`}
                size="lg"
                variant="ghost-inverse"
              >
                Explore the stylist view
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>FairChair measures appearance for pricing and scheduling. It does not assess hair or scalp health.</p>
          <p>Hair analysis by YouCam API (Perfect Corp.).</p>
        </div>
      </footer>
    </>
  );
}

function Problem({ n, title, body, href }: { n: string; title: string; body: string; href: string }) {
  return (
    <div>
      <p className="font-mono text-sm text-accent">{n}</p>
      <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-ink-2">{body}</p>
      <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-muted underline underline-offset-2 hover:text-ink">
        Source
      </a>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg p-5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent font-display font-bold text-surface">{n}</span>
      <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-ink-2">{body}</p>
    </div>
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
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">Opened hair can&apos;t be returned. Match it before checkout.</h2>
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
              <p className="mt-1 font-display text-xl font-bold leading-tight">{v.title}</p>
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
