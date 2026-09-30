# Judging Scorecard (self-assessed, strict)

Scored as a Perfect Corp judge would, against the official wording. Updated 2026-10-01.

| Criterion (official wording) | Start of day 3 | Now | Evidence | What still stands between us and 10 |
|---|---|---|---|---|
| **Technological Implementation** — "How thoroughly and skillfully does the project integrate at least one YouCam API?" | 7.5 | **9.5** | 4 hair detectors (parallel, cached, retried), hair-transfer with custom reference, hair-ext, **JS Camera Kit** (3 modes), File/Credit/Task-delete; skin-tone tested and excluded on evidence; image generator for demo assets. Found and handled 3 doc/API mismatches, a shared-input deletion bug, and Vercel's body limit. 35 tests. | Real-device Camera Kit capture not yet verified (needs a phone). |
| **Design** — "Does the project deliver a complete, coherent product experience?" | 7.5 | **9** | Two complete journeys (client quote → try-on → booking → receipt; shopper match → try-on → cart) plus stylist dashboard, portfolio upload, store onboarding, embeds. Guided capture, measurement-by-measurement waiting screen, every number explained. axe WCAG A/AA: 0 violations on 8 pages; no overflow at 375 px. | Real-device pass on iOS/Android; the demo video. |
| **Potential Impact** — "Does the project make a credible, specific case for solving a real problem?" | 7 | **8.5** | Named users and buyers (independent braiders; extension stores), sourced pain (pricing disputes, 6–12 h styles, non-returnable hair), a real integration path (Shopify cart permalinks, embeds), unit economics ($0.26–0.38 per analysis), fairness built in. | **Voices of real users**: 3–5 stylists or a store trying it and saying so; accuracy on real, consented photos. |
| **Quality of Idea** — "Is this a creative, non-obvious use of at least one YouCam API?" | 8.5 | **9.5** | Hair diagnostics → price, time and materials (nobody in ~290 prior projects); stylist's own work as try-on reference; texture priced as time; evidence-driven exclusion of hair colour; the counter-intuitive two-heads result. | Nothing structural; the video must land the "fuller, not curlier" moment. |

## Remaining actions (owner)
1. **Phone test** of guided capture with four real selfies (you) → validates Camera Kit + density on real photos; record for the video.
2. **3–5 real stylists** try `/start` + their own link and give one sentence of feedback (you: DM braiders you know or local Instagram braiders) → quotes for the submission.
3. Optional: **Shopify development store** (free via Shopify Partners) with a fictional extension product → proves the cart hand-off end to end on a real Shopify checkout.
4. Record the video from `docs/demo-script.md`; finalise Devpost text from `docs/devpost-submission-draft.md`.
