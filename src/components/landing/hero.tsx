import { BeforeAfter } from "@/components/before-after";
import { demoMeasurements } from "@/components/two-heads";
import { ButtonLink } from "@/components/ui";
import { demoClient } from "@/data/demo-clients";
import { durationRange, moneyRange } from "@/lib/format";
import { DENSITY_GRADES, HAIR_LENGTH_BANDS } from "@/lib/hair/measurements";
import { quote } from "@/lib/pricing/engine";
import type { Studio } from "@/lib/pricing/types";

// Hero: one real (AI-generated) client, her natural hair and the stylist's
// braids previewed on her, with the YouCam measurements that priced it.
export function Hero({ studio }: { studio: Studio }) {
  const client = demoClient("nia")!;
  const service = studio.services.find((s) => s.id === "knotless")!;
  const m = demoMeasurements("nia", service.measures);
  const q = quote(studio, service, { size: "medium", length: "mid-back" }, m);

  const callouts = [
    { label: "Curl pattern", value: m.type ? m.type.mapping.replace(" to ", "–").toUpperCase() : "—", className: "left-3 top-[30%] sm:-left-6", delay: "0.5s" },
    { label: "Density", value: m.density ? `${DENSITY_GRADES[m.density.grade].label} · ${m.density.value.toFixed(2)}` : "—", className: "right-3 top-[48%] sm:-right-8", delay: "0.8s" },
    { label: "Natural length", value: m.length ? HAIR_LENGTH_BANDS[m.length.index].label : "—", className: "left-3 top-[66%] sm:-left-10", delay: "1.1s" },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Phones: headline → portrait → details. Desktop: text left, portrait right. */}
      <div className="mx-auto grid max-w-6xl gap-x-16 gap-y-8 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-16 lg:[grid-template-areas:'head_img''body_img']">
        <div className="rise lg:self-end lg:[grid-area:head]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">For braiders, stylists &amp; the people in their chair</p>
          <h1 className="mt-4 font-display text-[2.9rem] leading-[0.98] tracking-[-0.025em] sm:text-7xl lg:mt-5">
            Price the hair,
            <br />
            <em className="text-accent-ink">not the argument.</em>
          </h1>
        </div>
        <div className="rise lg:self-start lg:[grid-area:body] [animation-delay:80ms]">
          <p className="max-w-lg text-lg leading-relaxed text-ink-2">
            Four quick selfies. YouCam Hair AI measures curl pattern, fullness and length — and FairChair turns that into an honest price, an
            appointment that fits, and a preview of the stylist&apos;s own work on you. Before anyone books.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/s/amara-braids-demo" size="lg">
              Get my honest quote
            </ButtonLink>
            <ButtonLink href="/compare" size="lg" variant="secondary">
              See two heads, two quotes
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-muted">Try it with your own selfies or a demo client · no sign-up</p>
        </div>

        <div className="rise row-start-2 lg:row-start-auto lg:[grid-area:img] [animation-delay:120ms]">
          <div className="relative mx-auto max-w-[26rem]">
            <BeforeAfter
              className="aspect-[4/5] rounded-[1.75rem] shadow-card"
              before={{ src: client.photo, alt: `${client.name}, natural 4C hair (AI-generated demo client)`, label: "Today" }}
              after={{ src: client.previews!.knotless, alt: `${client.name} previewed with medium knotless braids`, label: "Her braids" }}
            />

            {/* Measurement callouts overhang the frame, so they sit outside its clipping. */}
              {callouts.map((c) => (
                <span
                  key={c.label}
                  className={`pointer-events-none absolute z-10 hidden rounded-xl bg-surface/92 px-3 py-2 shadow-card ring-1 ring-black/5 backdrop-blur-sm motion-safe:animate-[fade-up_600ms_var(--ease-out)_both] sm:block ${c.className}`}
                  style={{ animationDelay: c.delay }}
                >
                  <span className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-measured">
                    <span className="h-1.5 w-1.5 rounded-full bg-measured" /> {c.label}
                  </span>
                  <span className="mt-0.5 block font-display text-lg leading-tight">{c.value}</span>
                </span>
              ))}

            {/* The ticket: what those measurements cost at this studio */}
            <div className="relative z-10 -mt-10 ml-auto mr-2 w-[15.5rem] rounded-2xl bg-ink p-4 text-surface shadow-card sm:-mr-10 motion-safe:animate-[fade-up_700ms_var(--ease-out)_1.4s_both]">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-surface/60">{studio.name} · knotless, mid-back</p>
              <p className="mt-1 font-display text-3xl tabular">{moneyRange(q.price, studio.currency)}</p>
              <p className="text-sm text-surface/75">{durationRange(q.minutes)} in the chair</p>
              <p className="mt-2 border-t border-white/10 pt-2 text-[0.7rem] leading-snug text-surface/60">
                Measured by YouCam · priced by the stylist&apos;s own rules
              </p>
            </div>
            <p className="mt-3 text-center text-[0.7rem] text-muted sm:text-left">Drag to compare · AI-generated demo client · recorded YouCam results</p>
          </div>
        </div>
      </div>
    </section>
  );
}
