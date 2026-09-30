import Link from "next/link";
import { Mark } from "./brand";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "Experience",
    links: [
      ["Get a quote", "/s/amara-braids-demo"],
      ["Same style, two heads", "/compare"],
      ["Store demo", "/store-demo"],
    ],
  },
  {
    title: "For business",
    links: [
      ["Set up your studio", "/start"],
      ["Stylist dashboard", "/studio/amara-braids-demo?key=demo"],
      ["Connect a Shopify store", "/shops/new"],
    ],
  },
  {
    title: "About",
    links: [
      ["How it works", "/#how"],
      ["Source code", "https://github.com/TusharTechs/fairchair"],
      ["YouCam API", "https://yce.perfectcorp.com/ai-api"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <Mark className="h-8 w-8" />
            <span className="font-display text-2xl">FairChair</span>
          </div>
          <p className="mt-3 max-w-xs font-display text-lg italic text-ink-2">Hair, measured before it&apos;s priced.</p>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted">
            Hair analysis, guided capture and try-on by the YouCam API (Perfect Corp.). FairChair measures appearance for pricing and matching; it
            does not assess hair or scalp health.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted">{c.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          Built for the YouCam API Skin AI &amp; eCommerce VTO Hackathon · MIT licensed · Demo people and products are AI-generated.
        </p>
      </div>
    </footer>
  );
}
