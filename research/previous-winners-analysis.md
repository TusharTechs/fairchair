# Previous Winners — Analysed Like a Judge

_Researched 2026-09-30. Source: winner Devpost pages + full census of the previous edition's gallery (~236 of 238 projects), plus the Perfect Corp Silicon Valley (May 2026) and DeveloperWeek 2026 sponsor-track galleries. Project URLs are `https://devpost.com/software/<slug>`._

---

## 0. The one-paragraph answer

Every winner of the last YouCam hackathon took the thing everyone does with the API and **pointed it at a different subject, user, or question**. None of them displayed YouCam output to a shopper and stopped. Each turned the output into **a measurement, a verdict, or an artifact that did not exist before** (a pass/fail audit, a coverage board, an integrity receipt, a spoken description, a production billing system), for **a user the other 230 teams ignored** (blind shoppers, merchandisers, compliance teams, Shopify merchants). They also showed their work: numbers, units spent, pass rates, stated limitations.

MirrorIQ did the thing everyone does (shopper → try-on → score) for the user everyone targets.

---

## 1. The inversion pattern

| # | Normal use of YouCam | What most teams built | Winner's inversion | Why it differentiated |
|---|---|---|---|---|
| Aloud (1st) | Skin analysis shows a visual report to a sighted shopper | Skin dashboard → routine recommender (~28 entries) | **Skin AI as a non-visual sensor** for a blind shopper; screen off; "verify my look" compares post-makeup to bare-skin baseline | The output modality (audio) and user (8.5M blind/low-vision Americans) were both unexpected; tied to ADA/EAA legal exposure = retailer buyer |
| ShadeSpan (2nd) | Shopper tries a garment on *themselves* | "See it on you" (~15) + skin-tone→outfit recommenders (~50) | **Garment tried on a fixed panel of 6 people** across Fitzpatrick I–VI; graded on the *worst* tone | Subject flipped from shopper to catalog; output flipped from image to pass/fail audit; one killer stat (14.3% pass) |
| CASTING | Same | Same | **"Who does our catalogue never show?"** 8-person frozen panel, coverage board, ΔE2000 contrast, exportable PDP images | Brand-side representation audit; 4 YouCam APIs; measured the panel itself instead of trusting file names |
| KeepMe | Generative try-on alters the shopper's image; nobody checks | Honest-VTO confidence scores (~20) | **An integrity layer *around* VTO**: identity contract, drift detection in protected regions, repair, signed receipt, verified deletion | Treated YouCam output as something to be *audited*; consent made enforceable by software |
| ConfidFit | VTO demo on a toy catalog | Generic VTO shops | **A real Shopify app** with billing, caps, retention scrub, webhooks, App Store listing | The differentiation was *shipping*: production ops nobody else did |
| InclusiFit (SV 2nd) | VTO for fashion shoppers | Stylists | **Adaptive fashion for disabled people**, 13 endpoints | Underserved user |
| Food for Beautiful Skin (SV 1st) | Skin simulation shows "future you" | Future-self gimmicks | **Groceries → skin simulation → reorder** | New input (food) into the skin model |

### The deeper pattern (what to copy)
1. **Change the subject of the API call.** The API's "user" is not the end customer (catalog, panel, integrity check).
2. **Change the output from an image to a decision/measurement.** Pass/fail, coverage gap, drift detected, spoken description.
3. **Name a buyer with money and a forcing function.** Legal exposure (ADA/EAA), merchandising QA, returns, trust.
4. **Show a number.** 14.3% of garments pass. 10/10 captures in 30s. 16 units per run.
5. **Disclose limitations.** Every winner states what their tool can't do; judges read this as rigor.
6. **Use multiple YouCam APIs where it's natural**, not decoratively.

### What NOT to copy (these inversions are now "taken")
- Blind/low-vision beauty assistant (Aloud).
- Skin-tone representation audit of garments / catalog coverage boards (ShadeSpan, CASTING; plus `tonegrid`, `onedress`). A third one would read as derivative.
- VTO integrity/consent receipts (KeepMe; plus `mirrorkey`, `drapeproof`, `mirrorproof`).
- "A Shopify VTO app but production-grade" (ConfidFit).
- Adaptive clothing (InclusiFit, `aequidrape`, `accesswear`).

The judges (Perfect Corp product people) saw these a month ago. **Adjacent-but-different** is fine; **same inversion, new coat of paint** is fatal.

---

## 2. Per-project analysis

### Aloud — 1st place
- **Problem:** Beauty e-commerce is visual (swatches, photos, ingredient panels); blind shoppers can't evaluate independently.
- **Target user:** ~8.5M blind/low-vision Americans; buyer = compliance-exposed retailer.
- **Existing alternatives:** Not named explicitly; implied Be My Eyes / Seeing AI / sighted help. Cited litigation (Sephora 2017, Fenty 2019, Ulta 2019), 5,114 ADA digital suits in 2025, EU Accessibility Act (June 2025).
- **Normal expectation of YouCam:** A visual skin report.
- **What it did differently:** Screen-off. Voice agent (WebRTC realtime), barcode scan → ingredient/allergen speech, sound-guided selfie capture, "Verify Your Look" (post-makeup vs bare baseline).
- **Why YouCam was meaningful:** Skin Analysis + Skin Tone (→ ITA) are the only source of truth for face statements; general vision models are forbidden from speaking about the face.
- **Technically difficult:** Voice agent loop, sound-guided capture, lighting-adaptive confidence thresholds, CI claim-linter blocking medical language, native shells.
- **Demo:** "The first beauty AI a blind shopper can use alone, screen off."
- **Memorable:** Screen off. Safety must be engineered because the user can't verify output.
- **Commercial:** Accessibility compliance layer for beauty retailers.
- **Evidence:** 10/10 non-visual captures < 30s on real iPhones; litigation stats.
- **Assumptions:** Retailers will embed; blind users trust AI-only descriptions.
- **Weaknesses:** N=10, no blind-user study, no business model, broad scope, unverified "first."
- **Lesson:** An underserved user + a hard forcing function (law) + engineered honesty.
- **Do NOT copy:** Blind beauty assistant; voice-first skin.

### ShadeSpan — 2nd place
- **Problem:** Catalog shows garments on one model; colors wash out on other skin tones; ~23% of apparel returns cite style/color (their cite).
- **Target user:** Merchandising team, pre-launch.
- **Alternatives:** Single-model photography; average-based QA.
- **Different:** Try-on every garment on 6 people (Fitzpatrick I–VI); WCAG contrast + CIEDE2000; worst-case grading with "washout veto."
- **YouCam:** Apparel VTO load-bearing (`/s2s/v2.0/task/cloth`); skin analysis marginal.
- **Difficulty:** Medium; color science.
- **Demo:** "Only 14.3% (2/14) of garments pass on all six tones."
- **Memorable:** "The average hides exactly the customer the tool exists to protect."
- **Commercial:** SaaS audit, PIM/Shopify hook; cost ≈168 units for 14 garments.
- **Evidence:** Pass rate, unit cost.
- **Weaknesses:** Returns link asserted not proven; tiny sample; API sometimes returned original clothing.
- **Lesson:** One number + one sentence of insight beats a feature list.
- **Do NOT copy:** Skin-tone garment audits.

### CASTING — 3rd–5th
- **Problem:** Brand shoots 2 models; customers are everyone else.
- **Target user:** Merchandisers / catalog managers.
- **Different:** One product photo → 8-person frozen panel in parallel; coverage board; ΔL*/ΔE2000; export PDP ZIP + report.
- **YouCam:** Clothes VTO + Skin Analysis + Fitzpatrick + Facial Color Tones (4 APIs, all load-bearing).
- **Difficulty:** Medium-high; NDJSON streaming, credit circuit-breaker, precomputed fallback.
- **Memorable:** "File names are intentions; measurements are results."
- **Weaknesses:** Overlaps ShadeSpan; no pricing; synthetic panel.
- **Lesson:** Measure your own inputs; credit circuit-breakers; honest demo fallback.

### KeepMe — 3rd–5th
- **Problem:** Generative try-on silently alters face/glasses/hair/body/background.
- **Target user:** Shoppers (consent), buyer = retailer.
- **Different:** Identity contract → drift detection (OpenCV/MediaPipe) → repair → signed JWS receipt or verified deletion.
- **YouCam:** Clothes v3 (the audited object), Skin Analysis as consistency signal.
- **Difficulty:** Highest; big production stack with testing and a11y checks.
- **Memorable:** "Consent should be specific enough for software to enforce."
- **Weaknesses:** Uncalibrated thresholds; no quantitative evidence; over-engineering risk.
- **Lesson:** Treating AI output as untrusted and verifying it is itself a product.

### ConfidFit — 3rd–5th
- **Problem:** Online fashion guesswork.
- **Target user:** Shopify fashion merchants.
- **Different:** Actually shipped: App Store listing, billing, caps, retention scrub, webhooks, consent.
- **YouCam:** cloth-v3 only.
- **Memorable:** "Most of the work is entitlement, billing honesty, webhooks, abuse controls…"
- **Weaknesses:** One API, private repo, no conversion data, generic idea.
- **Lesson:** Production credibility is a differentiator on its own, but it won the lowest tier.

### InclusiFit — 2nd, Silicon Valley Hackathon: Perfect Corp × Startup World Cup (May 2026)
- **Problem:** 1.3B people with disabilities; adaptive needs ignored by e-commerce (cites "62% of disabled shoppers cannot find comfortable clothes," RIDC 2024; "$47.3B unmet adaptive demand," Coresight).
- **Target user:** Five explicit disability profiles (short limbs, limited dexterity, AFO/brace users, hair loss, visual impairment).
- **Different:** Disability-aware filter taxonomy (closure type, AFO compatibility) + VTO + voice/screen-reader access + caregiver mode.
- **YouCam:** **13 endpoints** (cloth v3, shoes, skin-analysis v2.1 HD, makeup-vto, hairstyle, hair color, earring/ring/bracelet/watch/necklace 2d-vto, bag, hat, text-to-image, face-attr-analysis). Profile-aware orchestration (runs only the APIs relevant to the user's condition) cut waits 60–70%.
- **Technical notes:** Found doc errors (`ref_file_url` not `cloth_file_url`; shoes need `gender`). Sequential calls took 7–21 minutes before optimization.
- **Weaknesses:** Vendor stats (e.g., "94% higher conversion"); speculative ARR roadmap; no privacy story for disability data; revenue model unclear.
- **Lesson:** Breadth of API use + an extremely specific underserved user + a taxonomy that doesn't exist elsewhere. Judges rewarded API thoroughness.

### Food for Beautiful Skin — 1st, same event
- **Problem:** Diet affects skin, but the feedback loop is weeks long; people can't see the connection.
- **Different:** Fridge photo → food inventory → "Skinfo" per food → weighted impact score → **YouCam Skin Simulation API** renders the user's face with improved wrinkles/radiance/redness/texture/acne → Instacart reorder.
- **YouCam:** File upload + **skin simulation** task (5 parameters driven by a computed score) + polling.
- **Evidence:** None. Food-to-skin mapping unverified.
- **Lesson:** A new *input* into the skin model (food) made an old output (simulated skin) feel new. But it's a smaller event; the main hackathon's winners were far more rigorous.
- **Important API discovery:** YouCam offers a **Skin Simulation** API that *generates* an "improved skin" image from a real face. This means YouCam's own stack can manufacture a convincing "after" photo — directly relevant to any product concerned with before/after integrity.

---

## 3. Census of the previous edition (~236 projects)

| Cluster | ~Count | Winners | Verdict |
|---|---|---|---|
| Skin-tone / color-season / skin-aware outfit recommenders | ~50 | 0 | **RED OCEAN** |
| Skin analysis → routine/product recommender | ~28 | 0 | **RED OCEAN** |
| AI stylist / occasion "decision engine" (MirrorIQ here) | ~20 | 0 | **RED OCEAN** |
| Fit / returns / "honest VTO" confidence | ~20 | 0 | **RED OCEAN** |
| Generic "see it on you" VTO | ~15 | 0 | **RED OCEAN** |
| Browser extension / screenshot → try-on | ~12 | 0 | Crowded |
| Skin tracking / efficacy proof (consumer) | ~11 | 0 | Crowded |
| Social / gaming / fun | ~11 | 0 | Crowded, low-value |
| Context (weather/travel/event) | ~10 | DevWeek FitCast | Crowded |
| Wardrobe | ~9 | DevWeek CLOSET | Crowded |
| Makeup looks / creator | ~9 | 0 | Moderate |
| AI model photoshoot for brands | ~6 | 0 | Getting crowded |
| Niche craft verticals | ~10 | 0 | Empty, but no wins |
| Health/medical-ish | ~8 | 0 | Empty; claims risk |
| **Accessibility** | ~5 (+3 elsewhere) | **Aloud, InclusiFit** | Empty, winner-dense, but the obvious slots are taken |
| **Brand-side representation audit** | 4 | **ShadeSpan, CASTING** | Now taken |
| **Trust / consent / integrity** | ~4 | **KeepMe** | Now taken |
| **Production merchant infra** | ~4 | **ConfidFit** | Taken for VTO-on-Shopify |

**Name collisions to avoid:** Mirror*, Drape*, Undertone, Glow*, Skin*, *Fit, Hue*, Aura*, Palette*.

### Angles seen nowhere in ~290 projects across three events
- The API used as a **measurement instrument for something other than a person's appearance** (lighting, camera, content, claims).
- **Regulatory/claims compliance** in beauty marketing (FTC substantiation, UK ASA filter rulings).
- **Professional workflows** (estheticians, oncology nurses, clinical-trial sites, beauty-counter staff, salons) as the buyer.
- **Caregiver/eldercare** (one SV entry).

---

## 4. MirrorIQ post-mortem

| Criterion | MirrorIQ | Why |
|---|---|---|
| Quality of Idea (non-obvious) | Weak | Shopper → VTO → score is the most obvious use of apparel VTO; ~35 near-identical entries |
| Potential Impact | Weak | No specific user, no evidence, no buyer |
| Tech | Solid | Correct async + presigned upload, but one API family, mock 10-item catalog |
| Design | Good | Polished, accessible |
| Name | Collided | 10+ "Mirror*" projects |

**Conclusion:** The engineering and polish were not the problem. The *idea selection* was. This time the idea must pass a judge's 5-second test *before* we build.
