# PROJECT_STATUS

_Last updated: 2026-09-30 (end of day 1)_

## ▶ Resume here (day 2)
1. Check `spike/results-straight-fine-shoulder+wavy-long+kinky-chest-stretched.json` (density retry with a better chin-down view) and add it to `docs/measurements.md`.
2. **Four-selfie capture** (spike finding): front → turn right → turn left → chin down. Update `src/app/api/analyses/route.ts` (named fields), `src/lib/analysis/service.ts` (`photosFor` by view; type/frizz need exactly [front,right,left], same size; density uses chin-down), and the PhotoStep UI in `src/app/s/[slug]/quote-flow.tsx`. Consider YouCam JS Camera Kit for guided capture.
3. Stretched-length prompt in the result step for curly/coily hair (engine support + test done: `options.stretched`).
4. Replace `sample` demo clients in `src/data/demo-clients.ts` with **recorded real YouCam results** from the spike (AI-generated portraits in `public/demo/generated/`), `source: "replay"`, `recordedAt: "2026-09-30"`. Show the real portraits instead of illustrations.
5. Run the full flow once live end-to-end (`npm run dev`, real photos).
6. Try-on preview (hair-transfer with a stylist portfolio photo).
7. Then: deploy (Vercel + Neon), demo script, Devpost draft, adversarial review round 2.

Run: `npm run dev` · tests: `npm test` · key/balance check (0 units): `npm run youcam:check` · spike: `npm run spike`

## Current objective
Phase 2: UX prototype of **FairChair** with replay data, while the live-API accuracy spike (Phase 3 gate) waits on a YouCam API key.

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
- [ ] Try-on preview step (hair-transfer with stylist portfolio photo / hair-ext) — after live validation
- [ ] Record real YouCam results for demo clients (replace `sample` data) — needs key
- [x] Live accuracy spike (**GO**): hair type 5/6 in band, 6/6 within one band incl. all coily; 8/8 deterministic. See `docs/measurements.md`.
- [x] Fixed live-API case bug (`"4B to 4C"`); stretched-length (shrinkage) support in engine
- [ ] Live accuracy spike on 3c–4c hair (**go/no-go**)
- [ ] Deploy, judge mode, demo script, Devpost draft

## Blockers
- None. API key is in `.env` (git-ignored). Balance after spike ≈ 1,880 units: batch A expires **2026-11-15** (spent first), batch B (1,000) expires 2026-12-28 → keep batch B for judging (Nov 3–20).
- Demo images: need consented photos (team/friends) or licensed/synthetic images of 3c–4c hair.

## Risks
1. YouCam hair type accuracy on tightly coiled hair (critical, untested).
2. `hair-transfer` quality on braided reference styles (untested).
3. Coarse length bands → quotes must be ranges.
4. Unit budget during judging → replay + breaker.

## Next actions
1. Scaffold Next.js app; pricing engine with tests; replay fixtures shape.
2. Build client quote flow + stylist views with replay data.
3. When key arrives: accuracy spike → record in `docs/measurements.md` → go/no-go.
