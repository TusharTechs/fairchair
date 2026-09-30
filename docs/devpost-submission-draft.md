# Devpost Submission Draft

**Project title:** FairChair

**Tagline (≤ 200 chars):** Honest braid and extension quotes, measured before anyone books. YouCam Hair AI reads curl pattern, density, length and frizz from four selfies; FairChair turns that into a price and the right-length appointment.

**Thumbnail:** `docs/screenshots/two-heads.png` cropped to the two receipts + summary strip ("Same style. Two heads. Two honest quotes.").

---

## Inspiration

A braider posts "Knotless, mid-back: from $220." A client DMs a selfie at 11 pm and gets "should be around $220." On Saturday the hair is fuller and longer than the selfie showed, the appointment runs two hours over, and "it's $50 more" turns into an argument at the chair. In November 2025 a dispute exactly like that — $200 agreed by text, $50 more demanded on the day — ended in arrests in Birmingham, Alabama.

The variables that decide the price and the time — how long, how full, how coily and how frizzy a client's natural hair is — are written in every braider's FAQ. **Nobody measures them.** Existing quote tools (e.g. braid pricing calculators) still make a human type them in, and booking apps collect photos without reading them.

We noticed that YouCam launched exactly those four measurements as APIs in June 2026 — hair type, density, length and frizziness detection — and that none of the ~290 projects in Perfect Corp's previous hackathon galleries used them. Everyone points YouCam's hair APIs at *what hair could look like*. We point them at *what a service will take*.

## What it does

FairChair is a quote link a stylist puts in their bio.

1. **Measure.** The client picks a style and takes four guided selfies (straight on, turned right, turned left, chin down — the angles YouCam's detectors require). YouCam reads curl pattern (1 → 4c), density (0–3), natural length and frizz, plus hair colour for extension services.
2. **Price.** The stylist's own menu and hourly rate turn measured differences into **minutes of chair time** and a price range. Every line on the quote shows the measurement that caused it — e.g. *"Parting and feeding, by hair fullness · +45 min · Hair Density: High Density (2.57/3)"*.
3. **See it.** One tap shows the stylist's *own portfolio photo* on the client — YouCam hair-transfer with a custom reference — before any deposit is paid. The preview isn't stored.
4. **Agree.** The client books a slot already sized to the work (only start times that fit are offered) and both sides keep the same hashed receipt.
5. **Learn.** After the appointment the stylist logs the real time; FairChair shows which of *their* rules consistently runs over.

**Fair by design.** Coily hair can take longer to stretch and detangle — that's real work, priced as time at the stylist's rate. A flat "+$25 for 4C" is a texture surcharge; FairChair won't apply one and offers the time-based equivalent.

**The surprise in the demo:** with real YouCam results, the curlier client is *not* the more expensive one. For the same medium mid-back knotless, a full-density 3B–3C head is quoted $30 more and booked 45 minutes longer than a medium-density 4B–4C head — because of fullness and length, not texture.

For extension services, the same measurements produce a **supply list**: packs by density, texture to match, how much longer to order for curly textures, and the closest industry shade number from the measured hair colour — the questions extension brands currently answer with human "colour match" teams.

## How we built it

- **Next.js 16 + TypeScript** on Vercel, **Postgres (Neon)** via Drizzle, Tailwind v4. Embedded PGlite for zero-setup local development.
- **YouCam integration (server-side only):** presigned upload once per view (`POST /s2s/v2.0/file`), four detectors started in parallel (`hair-type-detection`, `hair-density-detection`, `hair-length-detection`, `hair-frizziness-detection`, plus `skin-tone-analysis` for hair colour), stateless polling safe for serverless, result cache keyed by image hash (the same photos never spend units twice), a credit circuit-breaker on `/s2s/v1.0/client/credit`, a per-device daily cap, one automatic retry on transient engine errors, and `task/delete` of every task and its input photos once the analysis completes.
- **Pricing engine:** pure, deterministic functions with per-line provenance, range handling for open-ended bands ("above chest or longer"), the fairness guard, supplies and shade matching — covered by unit tests alongside the YouCam response normalizers.
- **Privacy:** consent before capture; photos are resized and EXIF-stripped on the phone, deleted from YouCam after analysis, and never stored by FairChair. Stylists receive measurements, not photos.
- **Honest demo data:** demo clients are AI-generated portraits whose results are **recorded live YouCam responses**, always labelled; live results carry a "Live YouCam result" badge.

## Evidence (our own live measurements)

Before building the product we ran a go/no-go spike against the live API (`docs/measurements.md`):
- Hair type within one band on **6/6** synthetic portraits (5/6 exactly in the intended band), including all three coily heads — the risk that would have killed the idea.
- **8/8** repeat analyses returned identical results: the same photos always produce the same quote.
- End-to-end quote through FairChair: **14 s**; **7 units ≈ $0.38** of API per quote.
- Try-on of a stylist's knotless-braid portfolio photo onto 4 different heads (3B curls, 4C afro, short 4C, stretched 4A): all succeeded in ~9 s each (2 units); live through FairChair's API in 14.6 s.
- Findings that changed the product: hair length measures how hair *hangs* (a big 4C afro reads "short hair" — shrinkage), so coily clients can add a *reported* stretched length, labelled as reported.

## Challenges we ran into

- **The capture protocol.** Hair type and frizz require exactly three same-size views (front, right, left); density needs a chin-down selfie. We redesigned capture around four guided selfies and cover-fit side views to the front photo's size on the phone.
- **A privacy bug found only in live testing.** Deleting each YouCam task as soon as it finished also deleted its input photo — which other still-running tasks shared — so they failed with `unknown_internal_error`. Clean-up now waits until every task in an analysis is done.
- **Docs vs reality.** The live API returns "4B to 4C" where the docs show "4b to 4c"; our normalizer would have silently dropped hair type. Caught by the spike, fixed and tested.
- **Shrinkage.** Measuring length honestly for coily hair required separating *measured* from *reported*.

## Accomplishments we're proud of

- A use of YouCam's newest hair APIs that nobody in the previous galleries attempted: measurement → price, time and materials.
- Fairness that is enforced in code, not promised in copy.
- Every number a client sees is traceable to either the stylist's menu or a YouCam measurement.

## What we learned

The most valuable output of a beauty AI API isn't always an image. For service businesses, a *consistent, shared measurement* is what turns a negotiation into an agreement.

## What's next

- Pilot with independent braiders in one city; publish before/after rates of day-of price changes and overruns.
- Stripe Connect deposits (business model: a small share of deposits, so API cost scales with real bookings).
- **"Order the right hair"** — a Shopify app for extension and wig brands using the same engine (packs, texture, length, shade), where opened hair is non-returnable and colour matching is done by hand today.
- Integrations with booking platforms; validation of density and length accuracy on real, consented photos across 1–4c.

## Built with

`youcam-api` · `nextjs` · `react` · `typescript` · `tailwindcss` · `postgresql` · `neon` · `drizzle` · `vercel` · `vitest` · `zod`

## Links

- Live app: _(Vercel URL)_
- Two-heads demo: _(URL)/compare_
- Stylist demo: _(URL)/studio/amara-braids-demo?key=demo_
- Repository: _(GitHub URL)_
- Video: _(YouTube URL)_

---

### Submission checklist
- [ ] Video 1–3 min, explains YouCam APIs used, shows it running, no copyrighted music/logos
- [ ] Repo public (or shared with contact_event@PerfectCorp.com)
- [ ] Deployed URL works without login; demo studio + /compare
- [ ] Screenshots: two-heads, client receipt, stylist dashboard, capture screen
- [ ] Unit balance ≥ reserve for judging (batch B, 1,000 units, expires 2026-12-28)
