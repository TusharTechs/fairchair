# Devpost Submission Draft

**Project title:** FairChair

**Tagline (≤ 200 chars):** Braid and extension prices are guessed from blurry DMs. FairChair measures the hair first with YouCam Hair AI, then prices it, sizes the appointment and picks the right extensions.

**Thumbnail:** `docs/screenshots/two-heads.png`, cropped to the two receipts and the summary strip ("Same style. Two heads. Two honest quotes.").

**Track:** eCommerce VTO (also uses Skin & Hair analysis APIs).

---

## Inspiration

A braider posts "Knotless, mid-back: from $220." A client DMs a selfie at 11 pm and gets "should be around $220." On Saturday the hair is fuller and longer than the selfie showed, the appointment runs two hours over, and "it's $50 more" turns into an argument at the chair. In November 2025 a dispute exactly like that ($200 agreed by text, $50 more demanded on the day) ended in arrests in Birmingham, Alabama.

The variables that decide the price, the time and the extensions to buy (how long, how full, how coily, how frizzy a client's natural hair is) are listed in every braider's FAQ and on every extension store's size guide. **Nobody measures them.** Quote calculators make someone type them in; extension shoppers guess, and opened hair can't be returned.

YouCam launched exactly those four measurements as APIs in June 2026. None of the ~290 projects in Perfect Corp's previous hackathon galleries used them. Everyone points YouCam's hair APIs at *what hair could look like*. We point them at *what a service will take and what to buy*.

## What it does

**For stylists: an honest quote link for their bio.**
1. **Measure.** The client takes four guided selfies with YouCam's JS Camera Kit (straight on, turned right, turned left, chin down), or uploads them. YouCam reads curl pattern (1 → 4c), density (0–3), natural length and frizz.
2. **Price.** The stylist's own menu and hourly rate turn measured differences into **minutes of chair time** and a price range. Every line shows its cause, e.g. *"Parting and feeding, by hair fullness · +45 min · Hair Density: High Density (2.57/3)"*.
3. **See it.** One tap shows the stylist's *own portfolio photo* on the client (YouCam hair-transfer with a custom reference) before any deposit.
4. **Agree.** Only start times that fit the whole appointment are offered; both sides keep the same hashed receipt.
5. **Learn.** After each appointment the stylist logs the real time; FairChair shows which of their rules consistently runs over.

**For hair-extension stores: "Find my match" on the product page.**
The shopper picks a length and colour family and takes the same selfies. FairChair picks the right **variant of the store's own Shopify product**: texture from curl pattern, pack count from density, and length with a shrinkage allowance for curly and coily hair, each with its reason. YouCam's hair-extension try-on shows added length blended into the shopper's *own* texture, and **Add to cart** opens the store's Shopify checkout with that variant and quantity. Merchants connect by pasting a product link, with no Shopify app (FairChair reads the public product JSON), and embed it with one Custom Liquid block.

**Fair by design.** Coily hair can take longer to stretch and detangle; that's real work, priced as time. A flat "+$25 for 4C" is a texture surcharge; FairChair won't apply one and offers the time-based equivalent.

**The surprise:** with real YouCam results, the curlier client is *not* the more expensive one. For the same medium mid-back knotless, a full-density 3B–3C head is quoted $30 more and booked 45 minutes longer than a medium-density 4B–4C head, because of fullness and length, not texture.

## How we built it

- **YouCam, used for what each API is best at:** hair type, density, length and frizz detection (parallel tasks); hair-transfer v2.1 with the stylist's portfolio photo; hair-ext for extension previews; **JS Camera Kit** in `hairlength`, `hairtype` and `hairdensity` modes for guided capture; File, Credit and Task-delete endpoints. Image generator for our AI-generated demo people and product photo.
- **Engineering:** photos resized and EXIF-stripped on the phone, side views size-matched as the detectors require; uploaded once per view; stateless polling that is safe on serverless; result cache by image hash; credit circuit-breaker and per-device cap; one retry on transient errors; YouCam tasks and inputs deleted after use. Try-on images are never stored.
- **Two pure, tested engines:** pricing (per-line provenance, ranges for open-ended bands, the fairness guard) and matching (Shopify variants, shrinkage, packs). 35 unit tests, including YouCam normalizers checked against both documented and live response shapes.
- **Stack:** Next.js 16, TypeScript, Tailwind v4, Postgres (Neon) with Drizzle, Vercel. axe-core WCAG 2 A/AA: 0 violations on every public page.

## Evidence (our own live measurements)

Before building we ran a go/no-go spike on the live API (`docs/measurements.md`):
- Hair type within one band on **6/6** portraits (5/6 exact), including all three coily heads.
- **8/8** repeat analyses identical: the same photos always produce the same quote.
- Live quote end-to-end on production: **18 s**; **7 units ≈ $0.38** of API per quote.
- Try-on of a stylist's braid photo onto 4 different heads: 4/4; extension try-on: 6/6, keeping the shopper's own curl pattern.
- **A result we acted on:** YouCam's `hair_color` labelled black hair "Blonde" on 2 of 4 portraits, both dark hair on dark skin. Auto-suggesting blonde extensions to those shoppers would be wrong and alienating, so FairChair lets shoppers choose their colour family and tells them which shades to swatch.

## Challenges we ran into

- **The capture protocol.** Hair type and frizz need exactly three same-size views; density needs a chin-down selfie; length works best from a step back. We built guided capture around YouCam's Camera Kit modes, with manual upload as a fallback.
- **Docs vs. reality**, found by testing live: the API returns "4B to 4C" where the docs show "4b to 4c"; the Camera Kit SDK calls `window.ymkAsyncInit` where the docs say `YMKAsyncInit`; `hair_color` is a 7-value enum, not a measured hex.
- **A privacy bug.** Deleting each YouCam task as soon as it finished also deleted its input photo, which other running tasks shared. Clean-up now waits for every task.
- **Serverless limits.** Four full-size photos exceeded Vercel's 4.5 MB request limit; phones now prepare photos at 1280 px (≈1.1 MB for four) with no measurable change in results.

## Accomplishments we're proud of

- A use of YouCam's newest hair APIs no previous project attempted: measurement → price, time and materials.
- Fairness enforced in code, and a colour decision driven by our own evidence rather than convenience.
- Something a store could install this week: paste a link, add one block, and checkout stays in Shopify.

## What we learned

For service businesses and non-returnable products, the most valuable output of beauty AI isn't always an image. A consistent, shared measurement turns a negotiation into an agreement.

## What's next

- Pilot with independent braiders and one extension store; publish day-of price changes, overruns and wrong-hair orders before and after.
- Stripe Connect deposits (business model: a small share of deposits for stylists; $99–299/month for stores).
- Accuracy study on real, consented photos across 1–4c, and per-band confidence shown to clients.
- Booking-platform integrations (Square Appointments, Acuity) and a Shopify theme app block.

## Built with

`youcam-api` · `youcam-camera-kit` · `shopify` · `nextjs` · `react` · `typescript` · `tailwindcss` · `postgresql` · `neon` · `drizzle` · `vercel` · `vitest` · `zod`

## Links

- Live app: https://fairchair.vercel.app
- Two heads, two quotes: https://fairchair.vercel.app/compare
- Store demo: https://fairchair.vercel.app/store-demo
- Stylist demo: https://fairchair.vercel.app/studio/amara-braids-demo?key=demo
- Repository: https://github.com/TusharTechs/fairchair
- Video: _(YouTube URL)_

---

### Submission checklist
- [ ] Video 1–3 min: explains the YouCam APIs used, shows it running, no copyrighted music or third-party logos
- [ ] Repo public (or shared with contact_event@PerfectCorp.com)
- [ ] Deployed URL works without login: /compare, /s/amara-braids-demo, /store-demo, /studio/amara-braids-demo?key=demo
- [ ] Screenshots: two-heads, store match, stylist dashboard, capture screen
- [ ] Unit balance ≥ reserve for judging (Nov 3–20)
