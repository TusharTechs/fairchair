# PROJECT_STATUS

_Last updated: 2026-09-30 (FairChair 2.0 redesign)_

## ▶ Resume here
Live at https://fairchair.vercel.app (repo `fairchair`, Vercel + Neon). Both journeys work end to end on production; guided Camera Kit capture verified on a real phone (density + length measured; type/frizz swap-retry fix awaiting a re-test).

Latest: **FairChair 2.0 redesign**: editorial identity (ringlet mark, Newsreader + Geist, ivory/espresso/cognac), cinematic landing with chapter navigation, draggable before/after everywhere a try-on appears, stepped quote flow with motion transitions, portrait "measuring" screen showing what each YouCam detector decides, portfolio photos + recorded try-ons for all four demo services, receipt with share / calendar (.ics) / saved quotes, photo-free OG share card, footers. QA: `npm run qa` (puppeteer, desktop + phone, 0 console errors), `npm run axe` (WCAG A/AA, 0 violations on 9 pages), 36 unit tests.

Next (owner = you unless noted):
1. Re-test guided capture on the phone (hair type + frizz after the swap-retry fix).
2. 3–5 real stylists/stores try it → one-line quotes for the submission.
3. Record the video (`docs/demo-script.md`, no personal face) and finalise Devpost (`docs/devpost-submission-draft.md`).
4. Share the repo with contact_event@PerfectCorp.com if private.

Commits: author tusharaggarwal274@gmail.com only, no co-author/Claude trailers.
Dev server: `DATABASE_URL= npm run dev` from this folder (never point local dev at the production database).

## Hackathon essentials
- Deadline **Nov 2, 2026, 11:45 am ET**. Judging Nov 3–20. Winners ~Nov 24.
- Needs: working app (public URL, free for judges), repo (shared with contact_event@PerfectCorp.com), 1–3 min video explaining the YouCam APIs used, description, screenshots.
- Criteria (equal): Tech Implementation · Design · Potential Impact ("credible, specific case") · Quality of Idea ("creative, non-obvious use").

## Research completed
- [x] `research/hackathon-requirements.md`: rules, dates, criteria, full API reference
- [x] `research/previous-winners-analysis.md`: 7 winners analysed; ~290-project census; red/blue oceans
- [x] `research/idea-bank.md`: 22 concepts, scored; Baseline selected then **killed** after mechanism-level overlap check
- [x] `research/evidence.md`: verified facts vs assumptions vs hypotheses
- [x] `research/product-thesis.md`: FairChair thesis
- [x] `research/adversarial-review.md`: Round 0 (Baseline) + Round 1 (FairChair)
- [x] `docs/architecture.md`

## Selected concept
**FairChair: honest quotes for textured hair, measured before anyone books.**
A client's two photos → YouCam hair type / density / length / frizz → line-item price range, appointment length sized to the hair, supply list, try-on preview, shared receipt. For independent braiders and extension stylists.
Killer demo: *Same style. Two heads. Two honest quotes*; every difference traced to a YouCam measurement. Fairness guard converts texture surcharges into time.

## Key decisions
- Kill Baseline (lighting/comparability already built 4× last edition; Haut.AI incumbent).
- Price by time & materials, never by texture label.
- Stack: Next.js 16 + TS + Tailwind v4 + Drizzle (PGlite local / Neon prod) + Vercel.
- Replay mode uses **recorded real** YouCam responses only, always labelled.

## API discoveries
- V2 pattern verified (MirrorIQ + docs): upload → task → poll → `task/delete`. Units only charged on success.
- Hair detection outputs: type 9 bands (1→4c), density 0–3 float + 4 grades, length 8 bands, frizz 4 grades. Costs 2/1/2/2 units.
- `hair-transfer` v2.1 accepts a **custom reference image** → stylist portfolio photo can be previewed on the client.
- `hair-ext` needs shoulders visible, jpg ≤1024 px long side, 1 unit.
- Skin analysis `ui_score` is inflated by design; `raw_score` is the true measure (not used in FairChair).

## Implementation status
- [x] Project at `~/Documents/fairchair` (Next.js 16, TS, Tailwind v4, Drizzle + PGlite/Neon)
- [x] Design system + landing page (problem, two-heads demo computed by the real engine, fairness, CTA)
- [x] Pricing engine: deterministic, line-item "because" provenance, open-ended bands → ranges, fairness guard, supplies, shade match (tests)
- [x] Estimate-accuracy module (suggests rule changes from logged actual times only) (tests)
- [x] YouCam layer: upload → task → poll → delete; feature registry + normalizers from documented schemas (tests); credit breaker; per-IP daily cap; result cache by image hash
- [x] API routes: analyses (live/demo), poll, quotes, book, complete, studios (create/patch), status
- [x] Client flow: service → photos + consent → measuring (real task states) → hair card + receipt + supplies → studio-timezone booking → hashed receipt page
- [x] Stylist dashboard: requests, calendar (slots sized by estimate), menu & rules editor with live preview + fairness fix, accuracy, share links
- [x] Onboarding `/start`
- [x] Studio timezone handling (tests)
- [x] Try-on preview (hair-transfer with the stylist's portfolio photo; hair-ext for stores), recorded for every demo client × service
- [x] Recorded real YouCam results for demo clients (Maya / Nia / Tess / Ada)
- [x] Live accuracy spike (**GO**): hair type 5/6 in band, 6/6 within one band incl. all coily; 8/8 deterministic. See `docs/measurements.md`.
- [x] Fixed live-API case bug (`"4B to 4C"`); stretched-length (shrinkage) support in engine
- [x] Guided capture with YouCam JS Camera Kit (verified on a real phone)
- [x] Store widget: Shopify product JSON → variant + pack count → try-on → cart permalink; embeds for both products
- [x] Deployed (Vercel + Neon), demo script, Devpost draft
- [x] FairChair 2.0 redesign + e2e/axe QA scripts

## Blockers
- None. Keep the later-expiring unit batch for judging (Nov 3–20); replay mode + credit breaker protect the budget.

## Risks
1. Hair type/frizz on real phone captures (mirrored side views) → swap-retry shipped, needs a re-test.
2. Coarse length bands → quotes are ranges by design.
3. Unit budget during judging → replay + breaker + per-IP cap.
4. No real-user testimony yet (Impact score).
