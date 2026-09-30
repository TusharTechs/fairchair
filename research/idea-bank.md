# Idea Bank — 22 Concepts, Scored

_2026-09-30. Inputs: `hackathon-requirements.md`, `previous-winners-analysis.md`, `evidence.md`. Crowding counts refer to the ~290-project census across three Perfect Corp events._

Legend for API costs: SD skin analysis 9–16 units, HD 12–22, VTO 1–2, face-attr 10, skin-tone 20, fitzpatrick 10, lighting/enhance 2, skin-simulation 4–6. Budget: 1,000 units (+ up to 1,000 via social-share bonus).

---

## 1. Baseline — before/after evidence that survives a regulator
- **Pitch:** A placebo arm for before/after photos: Baseline proves whether a skincare "after" shows the product, or just better lighting.
- **Target user:** Claims/regulatory lead or founder at a DTC skincare or beauty-device brand (and the agencies/CROs serving them).
- **Problem:** Brands sell with before/after photos and "92% saw brighter skin" claims. Regulators now attack the *method*: NAD rejected SolaWave's photos because they "were not taken in a uniform manner… no reliable 'baseline'." Lighting alone measurably changes perceived severity.
- **Why it matters:** A challenged claim means pulled ads, relabeled packaging, and legal fees; a defensible claim is a sales asset. Consumer perception studies start ≈ $15k and take 4–16 weeks.
- **Alternatives:** CROs (Citruslabs ≈ $15k+), VISIA devices ($7–20k), Haut.AI enterprise study software, phone photos + hope.
- **Why insufficient:** CROs are expensive and slow; devices need clinics; nothing tells a brand, *before it publishes*, whether its before/after pair is even comparable, or how much "improvement" capture conditions alone can produce.
- **YouCam involvement:** Skin Analysis (raw_score per concern) is the measurement instrument; Face Analyzer `face_quality` (lighting, angle, frontal, area) is the comparability sensor; **Photo Lighting, Photo Enhance, Makeup VTO `skin_smooth`, Skin Simulation** generate *counterfactuals* ("what would the before look like with only a better lamp / phone beauty mode / filter?"); Fitzpatrick / Skin Tone stratify results by skin tone.
- **Why essential:** The product *is* running YouCam's measurement on YouCam-generated counterfactuals. Remove YouCam and there is no instrument and no counterfactual generator.
- **Workflow:** Upload before/after (or run a guided capture study) → comparability gate → YouCam measurement → counterfactual "placebo arm" → verdict + defensible claim wording → tamper-evident evidence dossier.
- **Killer feature:** *Counterfactual Placebo Arm*: "11 of your 14 points of 'improvement' reappear when we only relight your BEFORE photo."
- **Differentiator:** First tool that treats capture conditions as a confounder and measures it with the same instrument.
- **Judge memory:** "The one that proved the lamp did the work."
- **Commercial model:** Per-audit ($49–149), per-study SaaS ($1.5–5k/study vs $15k CRO floor), agency seats; later a public "Baseline-verified" badge for PDPs.
- **Customers:** Indie/DTC skincare brands, beauty-device makers (LED masks, microcurrent), Amazon/TikTok Shop sellers, claims agencies, CROs (as a pre-screen).
- **Tech difficulty:** Medium-high (async orchestration of 4–6 YouCam features, image forensics, stats, hash-chained dossier).
- **Demo difficulty:** Low: one before/after pair produces the reveal in ~60 s (cached for judges).
- **API cost:** ~60–90 units per full audit → must choose 4 concerns (SD tier 9 units) and cache.
- **Production potential:** High; clear buyer, regulatory tailwind.
- **Biggest risk:** Judges may lump it with consumer "skin progress tracker" projects (~11 entries). Must make brand-side + regulator + counterfactual visible in the first line.
- **Competitors:** Haut.AI (enterprise clinical-study software), CROs, VISIA/Canfield.
- **Our difference:** Self-serve, pre-publication, counterfactual-based, runs on a phone; answers "is this photo pair evidence at all?" before anyone pays for a study.

## 2. ShadeRecipe — mix-your-own cross-brand foundation recipes
- **Pitch:** When no single shade matches you, ShadeRecipe tells you which two to mix and in what ratio.
- **User:** Shoppers at MST 6–10 and very fair/neutral undertones (56% of MST 6–10 struggle to match; 79% of MST 6–7 mix).
- **Problem:** Shade finders return one SKU; mixing is trial-and-error.
- **Alternatives:** Brand shade finders, Findation, Sephora Color IQ.
- **YouCam:** skin-tone-analysis hex + Makeup VTO foundation to preview mixes.
- **Essential?** Partially: colour math could come from any camera/colorimeter.
- **Killer feature:** "70% shade 330 + 30% shade 350" preview on your face.
- **Commercial:** Retailer widget (sells 2 SKUs instead of 1).
- **Risk:** Colour under uncontrolled lighting; crowded shade-matching category; consumer-skin cluster.
- **Difficulty:** Medium. **Demo:** Medium.

## 3. SwatchPanel — every shade, on every skin, without a shoot
- **Pitch:** Indie beauty brands get on-skin swatches for every SKU across a consented diverse panel via makeup VTO.
- **User:** Shopify beauty brands (swatch photography $48–220/image; extra models ~$900 each).
- **YouCam:** makeup-vto (1 unit) with product hex/texture on a fixed panel; skin-tone for panel metadata.
- **Risk:** Looks like CASTING/ShadeSpan applied to makeup; ASA "production techniques" rules (rendered swatches may exaggerate) → ironically Baseline's territory. AI-model-photoshoot cluster (~6).
- **Commercial:** Per-SKU pricing. **Difficulty:** Low-medium.

## 4. BrowMap — permanent-makeup pre-visualisation and signed client approval
- **Pitch:** Microblading artists show clients their exact new brows before the needle, and get a signed approval.
- **User:** PMU artists/studios (removal costs $350–2,000; client disputes).
- **YouCam:** Face Analyzer (eyebrow shape, face shape, ratios), makeup-vto eyebrows, skin-tone (pigment undertone guidance).
- **Essential?** Yes for visualization; mapping logic is ours.
- **Killer:** Golden-ratio brow map overlay → VTO → signed consent PDF.
- **Commercial:** $29–99/month per artist; PMU academies.
- **Risk:** Can't predict healed colour/fade; niche; moderate "wow".
- **Difficulty:** Medium.

## 5. Before You Lose It — capture yourself before chemotherapy
- **Pitch:** A 3-minute capture before chemo records your natural hair colour, brows and face so wigs and brow templates can match *you* later.
- **User:** Patients starting chemotherapy; wig retailers and cancer centers (LGFB served 1M+).
- **YouCam:** skin-tone (hair/brow colour hex), face-attr (brow shape/thickness, face shape), hair-type/density/length detection, hair-color & hairstyle VTO for wig matching, makeup-vto eyebrows for daily brow template.
- **Killer:** Months later, "draw my brows back" template generated from the pre-chemo baseline.
- **Commercial:** Wig retailers (medical wigs $1.5–5k), cancer-center support programs.
- **Risk:** Health-adjacent; emotional demo could feel exploitative; payer weak; needs long time to show value.
- **Difficulty:** Medium. **Demo:** Emotional but slow.

## 6. ClinicLens — standardized progress photos for med-spas on a tablet
- **Pitch:** Replace $7–20k imaging booths with a guided tablet capture + YouCam scoring.
- **User:** Aestheticians/med-spas.
- **Risk:** Crowded (VISIA, Canfield, Haut.AI, ScanSkin); workflow-only differentiation. Consumer-tracking cluster adjacency.
- **Commercial:** Per seat. **Difficulty:** Medium.

## 7. CoverMatch — vitiligo camouflage shade matching
- **User:** Vitiligo patients (45.6% use camouflage; many can't find a shade).
- **YouCam:** skin-tone of unaffected skin; foundation/concealer VTO.
- **Risk:** API measures global tone, not patch-specific; accuracy on deep skin; similar to `confidentskin`.
- **Commercial:** Camouflage brands. **Difficulty:** Medium-high.

## 8. FilterDelta — retouch/filter compliance for beauty ads
- **Pitch:** Compare raw vs posted influencer images and flag skin changes beyond a threshold (ASA/Norway rules).
- **YouCam:** Skin analysis on both.
- **Risk:** Needs the raw file (rarely available); small market; subsumed by Baseline's audit.
- **Difficulty:** Low.

## 9. ReturnReason — turn "wrong shade" returns into exchanges
- **Pitch:** A shopper returning foundation snaps a selfie; we measure their skin tone and swap them to the right shade instead of refunding.
- **User:** Beauty e-commerce CX teams (45% of cosmetics returns are preference, chiefly shade; opened cosmetics are non-restockable).
- **YouCam:** skin-tone-analysis, makeup-vto foundation to preview the replacement.
- **Killer:** Refund → exchange conversion.
- **Risk:** Similar tech to shade finders; value relies on retailer integration; crowded shade space.
- **Commercial:** Per recovered order. **Difficulty:** Medium.

## 10. ShadeGap — who can't buy your foundation?
- **Pitch:** Map a brand's shade range against a population panel to find uncovered skin tones.
- **Risk:** Too close to CASTING/ShadeSpan ("who does our catalogue never show?"). **Reject.**

## 11. PanelScreen — recruit the right skin for cosmetic studies
- **Pitch:** Screen study volunteers by measured skin concerns (e.g., moderate spots) instead of self-report.
- **User:** CROs, brands running studies.
- **YouCam:** skin analysis thresholds.
- **Risk:** Narrow; best as a Baseline feature. **Merge into #1.**

## 12. SunSelf — UV behaviour change via aging simulation
- **User:** Sunscreen brands, cancer charities (appearance-based interventions show medium effect sizes).
- **YouCam:** aging simulation, skin analysis spots.
- **Risk:** "Future face" gimmick cluster (time-mirror, future-you); health claims.
- **Difficulty:** Low.

## 13. CounterHandoff — the in-store consultation that follows you online
- **User:** Beauty retailers with advisor turnover 35–55%.
- **Risk:** Perfect Corp already sells this; low novelty.

## 14. BaseTruth — what box dye will actually do on *your* hair
- **Pitch:** Detect base hair colour/type and warn when a box-dye VTO is physically unrealistic (e.g., black → platinum).
- **User:** At-home colourers (~20% need correction; $150–1,200).
- **YouCam:** hair-color detection (skin-tone-analysis hair_color), hair-type, hair-color VTO.
- **Risk:** Lift physics are our heuristic, not YouCam's; hair colour VTO is common.
- **Commercial:** Hair-colour brands (fewer complaints/returns). **Difficulty:** Medium.

## 15. TesterFree — hygienic tester kiosk
- **Risk:** Virtual testers are YouCam's core business already. **Reject.**

## 16. GradeLab — calibrate estheticians' skin grading against an instrument
- **User:** Esthetics schools.
- **Risk:** Small market; moderate wow.

## 17. PDP Proof — shoppers check a brand's before/after
- **Pitch:** Browser extension that scores comparability of before/after images on product pages.
- **Risk:** Can't run full counterfactuals on arbitrary web images; legal risk of accusing brands. **Merge into #1** as the "verified badge" consumer surface.

## 18. Restorative-art matching for funeral homes
- **Risk:** Macabre for a beauty-brand judge panel; ToS consent issues. **Reject.**

## 19. CranialDoc — hair-loss documentation for wig insurance claims
- **User:** Alopecia/chemo patients seeking reimbursement (insurance averages ~$300; Medicare rarely covers).
- **YouCam:** hair-density detection.
- **Risk:** Medical documentation needs clinicians; overclaim risk. **Reject.**

## 20. ReviewTwin — reviews from people with your skin
- **Pitch:** Measure reviewer skin tone from review photos so shoppers filter foundation reviews by measured (not self-reported) tone.
- **YouCam:** skin-tone-analysis on UGC.
- **Risk:** Review-photo lighting varies wildly (the same confound Baseline solves); consent for UGC. Moderate.

## 21. Shadelab R&D — prototype a shade range virtually
- **Risk:** ShadeGap/CASTING adjacency. **Reject.**

## 22. ClaimCheck for Amazon/TikTok Shop sellers
- **Pitch:** Marketplace sellers' before/after images get flagged/removed; pre-check them.
- **Merge into #1** as a go-to-market wedge (marketplace policy + NAD + ASA).

---

## Decision matrix (1–5; 5 = best. "Confusion risk" scored inversely: 5 = unlikely to be confused)

| # | Idea | Tech | Design | Impact | Idea quality | Differentiation | User specificity | Pain | YouCam indispensable | Demo wow | Feasibility | Monetization | Defensibility | Evidence-able | Confusion risk | One-sentence | **Total /75** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Baseline** | 5 | 4 | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | 4 | 5 | 4 | 5 | **70** |
| 4 | BrowMap | 3 | 4 | 3 | 4 | 4 | 5 | 4 | 4 | 3 | 5 | 3 | 2 | 3 | 5 | 5 | **57** |
| 9 | ReturnReason | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 2 | 4 | 3 | 5 | **55** |
| 5 | Before You Lose It | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | 3 | 3 | 2 | 3 | 2 | 4 | 4 | **56** |
| 2 | ShadeRecipe | 3 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 4 | 2 | 3 | 2 | 5 | **50** |
| 3 | SwatchPanel | 3 | 4 | 3 | 3 | 2 | 4 | 3 | 4 | 3 | 4 | 4 | 2 | 3 | 2 | 5 | **49** |
| 14 | BaseTruth | 3 | 4 | 3 | 4 | 4 | 4 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 4 | 4 | **51** |
| 7 | CoverMatch | 3 | 3 | 4 | 4 | 3 | 5 | 4 | 3 | 3 | 2 | 2 | 2 | 2 | 3 | 5 | **48** |
| 6 | ClinicLens | 3 | 4 | 3 | 2 | 2 | 4 | 4 | 4 | 2 | 4 | 4 | 2 | 3 | 2 | 5 | **48** |
| 20 | ReviewTwin | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 4 | 4 | **47** |
| 8 | FilterDelta | 2 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 4 | 2 | 1 | 2 | 3 | 5 | **44** |
| 12 | SunSelf | 2 | 4 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 5 | 2 | 1 | 2 | 2 | 5 | **42** |
| 10/15/18/19/21 | Rejected | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | overlap, ethics, or no payer |
| 11/17/22 | Merged into #1 | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | features/wedges |

### Category leaders
- **Strongest consumer idea:** Before You Lose It (#5): emotionally powerful, highly specific, but weak payer and slow demo.
- **Strongest B2B idea:** Baseline (#1).
- **Strongest accessibility/inclusion idea:** CoverMatch (#7) (but Aloud/InclusiFit own "accessibility" in judges' minds).
- **Strongest merchant idea:** ReturnReason (#9).
- **Strongest "unexpected use of YouCam":** Baseline (#1): using YouCam's *generative* APIs to attack claims measured by YouCam's *analysis* API.
- **Strongest commercial opportunity:** Baseline (#1): regulator-driven, budget exists (CRO spend), self-serve undercuts $15k floor.
- **Strongest demo:** Baseline (#1): single "the lamp did it" reveal.
- **Strongest overall:** **Baseline.**

### Backups
1. **BrowMap** (#4): specific professional user, clean VTO + face analysis use, legal-sign-off hook, no crowding.
2. **ReturnReason** (#9): retail value is instantly legible; weaker novelty.

### Tradeoffs exposed by the scores
- Baseline's weakest points are **Design** (B2B evidence tools can look dry → we must make the reveal visual) and **Confusion risk** (consumer skin trackers). Both are addressable in copy and UI.
- Before You Lose It scores highest on idea quality after Baseline but collapses on monetization and demo-ability within 3 minutes.
- Shade ideas (#2, #9, #10) share an unsolved dependency (colour under uncontrolled light), which is ironically the exact problem Baseline measures.

---

## ⚠️ Round-1 decision REVERSED (2026-09-30, after overlap check)

**Baseline is killed.** A targeted overlap check found the core insight ("capture conditions fake skin-score improvement; gate/measure them") was already built at least four times in the previous edition, and none of those projects won:
- **Same Light** (github.com/bisale24-ops/same-light): measured YouCam pore scores moving 85→96 on identical skin under ±20% exposure; matches lighting before scanning; can check an ad's before/after and show how much light alone explains; uses the JS Camera Kit.
- **TOLERANCE**: audited score noise across 81 relit variants per face (texture noise up to ±14.2).
- **Glowdays**: grades 5 capture factors and refuses non-comparable comparisons; pitched brand evidence.
- **Assay**: per-user noise floor, normalization, explicitly pitched a brand "claims panel" + FTC.
- Direct commercial competitor: **Haut.AI Clinical Studies Software** (Aug 2026): LIQA live capture QA, remote studies, "Substantiate" claims-ready reports, ICC 0.97–0.98.

Judges have seen the "lamp did it" reveal. A brand-side wrapper on the same insight would read as derivative and would compete head-on with a funded incumbent. Per principle 21, we do not keep it out of attachment.

**Lesson recorded:** the census found *crowded clusters by tagline*; a second-level check on the specific *mechanism* is required before committing. Every finalist concept now gets a mechanism-level overlap check.

**Next:** research professional, hard-to-reverse beauty services (permanent makeup, hair colour), where the census shows almost no entries. Note: GlamCode OS (salon hair-colour/cut/beard VTO → WhatsApp booking) exists, so "salon VTO preview" alone is taken.
