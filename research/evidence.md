# Evidence Register

_Maintained from 2026-09-30. Every claim used in the product, Devpost text, or demo must appear here with its category. Nothing in the "Assumptions" or "Hypotheses" sections may be presented as fact._

Categories:
- **[F] Verified fact**: primary or reputable secondary source, link included.
- **[V] Vendor claim**: from a company selling something; cite as "X says".
- **[A] Reasonable assumption**: our inference; say "we estimate/expect".
- **[M] Our own measurement**: produced by us with the live YouCam API; method recorded.
- **[H] Future hypothesis**: to be validated after the hackathon.

---

## 1. The problem: pricing and time depend on hair nobody measures

| # | Claim | Cat | Source |
|---|---|---|---|
| 1.1 | Braid salons list "hair length and volume" as the first price factor; knotless/micro braids take 4–6 hours; hidden charges include wash/blow-dry and extension hair. | F | https://www.braidingpalace.com/blogs/understanding-braid-pricing-what-to-expect-before-your-appointment |
| 1.2 | "Prices listed are starting prices" varying by braid length and size; short-hair surcharge; $25 late fee. | F | https://thebraidlounge.com/frequently-asked-questions/ |
| 1.3 | Many braided styles take six or more hours, some 10–12 hours. | F | https://defendernetwork.com/culture/black-hair-braids-culture/ |
| 1.4 | Most common pricing dispute: client expects base price but arrives with hip-length, thick hair "that takes 3 extra hours." | F (trade blog) | https://www.homebusinesshub.us/blog/how-much-to-charge-for-hair-braiding/ |
| 1.5 | Nov 2025, Birmingham AL: a client agreed $200 by text; the braider demanded $50 more at the appointment; the dispute escalated to arrests. | F (news) | https://www.aol.com/lifestyle/hair-appointment-gone-wrong-alabama-220000154.html |
| 1.6 | Braid prices rose from ~$120 (2014) to $300–500 now. | F (press) | https://dallasweekly.com/2025/03/braiding-culture-costs-black-women/ |
| 1.7 | Braider sites ask clients to "send me a picture and I can message you a price"; coaching blogs warn DMs aren't for consultations. | F | https://dite.ca/how-to-handle-client-dms-as-a-hairstylist/ |
| 1.8 | Braid Boss Pro ($19.99/mo) is a *manual* calculator: stylist enters "base price + variations + add-ons + length + density." | F | https://braidbosspro.app/ |
| 1.9 | StyleSeat Forms supports a photo upload question; no automated analysis or quote. | F | https://www.styleseat.com/blog/styleseat-forms/ |
| 1.10 | No-show rates: ~15–25% without deposits, ~3–5% with deposits. | V | schedulingkit.com / zenoti.com benchmarks |
| 1.11 | Extension installs: Bellami's guide maps hair thickness to pack count (fine 2–3, medium 4–5, thick 6–7 packs of Classic tape-ins). | F (brand guidance) | https://www.bellamihair.com (pack guide) |
| 1.12 | Mayvenn: every bundle is 100 g; 2 bundles + closure up to 14", 3 bundles at 16"+; curly textures wear 2–4" shorter ("22 inches of deep wave wears as ~16 inches"). | F (brand guidance) | https://shop.mayvenn.com/pages/hair-bundles-guide |
| 1.13 | Opened extension hair generally cannot be returned ("We take matters of hygiene and public safety seriously and do not allow opened items to be returned"). | F | https://www.luxyhair.com/pages/return-policy |
| 1.14 | Colour-mismatch complaints appear across extension brands' reviews (Luxy 4.5★ with 9% 1★; Irresistible Me 3.6★; Bellami 3.7★ over 13.6k reviews). | F | Trustpilot pages for each brand |
| 1.15 | Salon redo/refund policy: redo first, refunds "last resort"; best prevention is consultation with pictures. | F | https://www.probeautycentral.saloncentric.com/what-you-need-to-know-about-handling-refunds-and-redos |

## 2. Market

| # | Claim | Cat | Source |
|---|---|---|---|
| 2.1 | US hair salons: $63.4B industry (2026), ~1.08M enterprises; average 1.3 employees. | F | https://www.ibisworld.com/united-states/industry/hair-salons/4410/ |
| 2.2 | ~555,800 US hairdressers/cosmetologists (2022), 46% self-employed; 8% projected growth. | F | https://www.bls.gov/ooh/personal-care-and-service/barbers-hairstylists-and-cosmetologists.htm |
| 2.3 | StyleSeat: 20M users / 3.5M professionals; Booksy: 50M clients. | V | company sites |
| 2.4 | Black hair care industry estimates range $2.5B–$3.2B+ (definitions vary). | F (ranges) | Defender Network; market reports |
| 2.5 | Global wigs & extensions market estimates range $5B–$15.5B (2025) depending on definitions. | F (ranges) | GM Insights, IMARC, Research & Markets |
| 2.6 | Salon software market ~$1–2B (2025), ~10–16% CAGR. | F (ranges) | market reports |

## 3. Why YouCam specifically

| # | Claim | Cat | Source |
|---|---|---|---|
| 3.1 | Perfect Corp launched an 11-API hair suite on 2026-06-16: 7 try-ons (colour, hairstyle, **extension**, bangs, volume, wavy, beard) + 4 diagnostics (**type**, **length**, **frizz**, **density**). | F | https://www.businesswire.com/news/home/20260616828286/en/ |
| 3.2 | Hair type detection maps to 9 bands from "1 to 2a" to "4b to 4c"; density returns a 0–3 float + 4 grades; length returns 8 bands; frizz returns 4 grades. | F | docs.perfectcorp.com OpenAPI bundles (hair_*_detection) |
| 3.3 | Hair type model trained on 70,000+ images, 10 curl patterns. | V | https://www.makeupar.com/business/products/hair-type-analysis |
| 3.4 | None of ~289 projects across the last two Perfect Corp hackathon galleries used hair type/density/length/frizz detection or extension VTO; the closest (GlamCode OS) used hair colour/cut/beard VTO for booking, with no analysis and no quoting. | F (our census) | `previous-winners-analysis.md` |

## 4. Fairness context

| # | Claim | Cat | Source |
|---|---|---|---|
| 4.1 | "Texture surcharges" (e.g. extra for 4C) are publicly debated as unfair; the CROWN Act movement addresses hair-texture discrimination in employment/schools. | F (context) / A (applicability to pricing) | https://www.thecrownact.com/ ; search-snippet accounts of 4C surcharge posts (primary tweet not verified) |

## 5. Reasonable assumptions (say "we estimate")
- A.1 A mis-sized appointment (e.g. 6h service booked into 4h) costs a stylist the next client's slot or unpaid overtime; at $40–60/hour effective rate, 2 extra hours ≈ $80–120 per occurrence.
- A.2 Pre-agreed, measured quotes reduce day-of price disputes because the variables that drive surcharges are recorded before booking.
- A.3 Independent textured-hair stylists will pay in the range of existing tools ($20–30/month; Braid Boss Pro is $19.99).
- A.4 Coarse hair bands (length 8 bands, density 4 grades) are sufficient because stylists already price in 3–4 tiers.

## 6. Our own measurements (to be produced with the live API)
- M.1 Per-call latency and unit cost for each hair endpoint.
- M.2 Consistency: same photo run twice → identical outputs? (determinism check)
- M.3 Stability across two photos of the same head (front vs slight angle; different rooms).
- M.4 Behaviour on 4a–4c hair, on hair in protective styles, and on hair with head coverings.
- M.5 Quote spread: same style across N demo clients → price/time range explained by measured variables.
_All M-items will be logged in `docs/measurements.md` with date, inputs (synthetic or consented), and raw outputs._

## 7. Hypotheses for after the hackathon
- H.1 Stylists using measured quotes see fewer day-of price changes and fewer overruns.
- H.2 Clients shown a line-item quote with measured reasons book at a higher rate than those told "starting at."
- H.3 Deposits sized to measured duration reduce no-shows further than flat deposits.
- H.4 Supply lists (packs/texture/length) reduce wrong-hair purchases for extension installs.
