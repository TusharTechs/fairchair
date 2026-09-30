# Adversarial Review

Each round: attack as a skeptical first-round judge, then record the fix. Serious issues must be fixed before the next milestone.

---

## Round 0 — Baseline (killed)
| Attack | Verdict |
|---|---|
| "Is this actually new?" | **No.** Same Light, TOLERANCE, Glowdays, Assay all built lighting/comparability gating in the previous edition. |
| "Could an incumbent do this?" | Haut.AI already does (LIQA + Substantiate, Aug 2026). |
| Outcome | Killed before any code. |

---

## Round 1 — FairChair thesis (2026-09-30)

| # | Judge's attack | Severity | Response / Fix |
|---|---|---|---|
| 1 | "Is this just a price calculator with a photo upload? Braid Boss Pro exists." | **High** | The difference is *who supplies the inputs*: in every existing tool a human types length/density; here they're measured and shown to both sides. **Fix:** the UI must visibly trace every price/time line to a YouCam measurement ("because density = High (2.7/3)"). The written submission leads with this contrast. |
| 2 | "Couldn't GPT-4o-vision guess hair length and curl type?" | High | (a) YouCam's detectors use a fixed professional taxonomy (1→4c, 4 density grades) that maps 1:1 to how stylists price; (b) a price must be reproducible: the same photo must always give the same quote. **Fix:** measure determinism (M.2) and show it in the submission; never use a general LLM to read the hair. |
| 3 | "Braid price depends on the style the client *wants*, not their natural hair." | High | True for the base price. Natural hair drives *time and prep* (detangle, stretch, feeding, parting a full head), which is exactly what surcharges and overruns are about. For extension installs, density/length directly drive pack count. **Fix:** quote = base (chosen style) + measured adjustments; say so plainly. Lead the demo with a service where natural hair clearly matters. |
| 4 | "Coarse bands (8 length buckets) can't produce an accurate quote." | Medium | Stylists already price in 3–4 tiers; we output ranges, not false precision. **Fix:** show a range, and the band→tier mapping in stylist settings. |
| 5 | "Does YouCam's hair type model even work on 4c hair? If it fails, your product encodes bias." | **Critical** | Unknown until tested. **Fix:** Phase 3 starts with an accuracy spike on consented/synthetic 3c–4c images before any polish; results published in `docs/measurements.md`; confidence + "not right? tell your stylist" override in UI. If accuracy is poor on 4a–4c, re-scope to services where density/length dominate and disclose. |
| 6 | "Pricing by hair texture is discriminatory." | High (reputational) | Agreed, which is why FairChair converts texture into *time*, discloses it, and flags label-based surcharges. This becomes a differentiator, not a liability. |
| 7 | "Where's the eCommerce / retail value the hackathon asks for?" | Medium | Clients buy a service (the quote is the checkout), plus a supply list for extension/braiding hair (product purchase). **Fix:** supply list with pack counts is a first-class screen; mention the extension-brand expansion. |
| 8 | "Is this a real business? Solo stylists won't pay." | Medium | They already pay $20–30/mo for booking and manual calculators. **Fix:** cite Braid Boss Pro pricing; show a pricing page; show the per-quote unit cost. |
| 9 | "Only 4 cheap detection calls; is the integration thorough?" | Medium | Use 5–7 endpoints purposefully (4 diagnostics + hair colour hex for extensions + extension/hairstyle VTO + capture quality), with correct async handling, caching, webhooks, credit circuit-breaker, task deletion. **Fix:** architecture doc + README table "each API → what it decides." |
| 10 | "Would a judge understand it from the Devpost card?" | High | **Fix:** title + tagline carry the whole idea: "FairChair — honest braid & extension quotes, measured from a selfie by YouCam Hair AI." Thumbnail = two heads, two quotes. |
| 11 | "Privacy: photos of clients' heads." | Medium | Photos go to YouCam via presigned upload; we call `task/delete` after results; we store measurements, not photos, unless the client opts in to receipt photos (auto-expire). Consent screen before capture (also required by YouCam ToS §3.4). |
| 12 | "Name sounds like furniture." | Low | Test alternatives before submission; the tagline carries meaning. |

**Open critical item:** #5 (accuracy on tightly coiled hair). Blocks the Phase 3 go/no-go. Requires the user's YouCam API key.
