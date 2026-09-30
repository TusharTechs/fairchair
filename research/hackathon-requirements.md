# Hackathon Requirements — YouCam API Skin AI & eCommerce VTO Hackathon

_Researched 2026-09-30. Devpost blocks raw HTTP fetches; page text was retrieved through a summarizing fetcher, so quotes may be lightly trimmed. Re-verify anything marked **[unverified]** on the live page before submitting._

Official page: https://youcam-api-skin-ai-ecommerce.devpost.com/
Rules: https://youcam-api-skin-ai-ecommerce.devpost.com/rules
Resources: https://youcam-api-skin-ai-ecommerce.devpost.com/resources

---

## TL;DR — what actually matters for strategy

| Item | Finding | Strategic implication |
|---|---|---|
| Deadline | **Nov 2, 2026 @ 11:45 am ET** | ~4.5 weeks from today (Sep 30). Enough for a real product; not enough for scope creep. |
| Tracks | **Skin AI** ("help users understand their skin and know exactly what to do next") and **eCommerce VTO** ("brings Virtual Try-On together into one seamless, intuitive experience" — beauty + fashion) | No per-track prizes; single overall pool. We can cross tracks. |
| Stage One | Pass/fail: "reasonably fits the theme and reasonably applies the required APIs" | This is the gate MirrorIQ likely *passed*; the cut happened when judges triaged for differentiation before deep review. |
| Stage Two | 4 equally weighted criteria (below) | Tie-break order = Tech Implementation first. |
| **Quality of Idea wording** | **"Is this a creative, non-obvious use of at least one YouCam API?"** | The rubric literally rewards *inversion*. Obvious uses are penalized by definition. |
| **Potential Impact wording** | **"Does the project make a credible, specific case for solving a real problem?"** | "Specific" and "credible" → named user, cited evidence, measurable outcome. |
| Organizer ask | "fresh, unexpected solutions to real-world pain points … **not surface-level wrappers**" … "show us real impact **beyond a simple API call**" | YouCam output must be *transformed* into something new (a measurement, a decision, a record), not just displayed. |
| Credits | **1,000 free API units** per registrant (redeem code emailed after Devpost registration) | Budget carefully; cache every result; demo mode for UI work. |
| Newness | Must be new or "significantly updated after the start of the Submission Period" (Sep 29, 2026) with explanation | We build new. MirrorIQ's client code can be reused as infrastructure (disclose it). |
| Competition | 388 registrants at day 2; previous edition: 1,280 participants / **238 projects** | Expect 150–300 submissions → first-pass triage on title + tagline + description + thumbnail. |
| Prizes | $6,000 total: 1st $2,500, 2nd $1,000, 3rd $500, Women in Tech $1,000, Rising Star (student) $1,000. One prize per project. | Also: feature blog + product-team meeting — a real commercial door with Perfect Corp. |

---

## 1. Dates
- Registration: Sep 24, 2026 12:00 pm ET → Nov 2, 2026 11:45 am ET
- Submission period: **Sep 29, 2026 12:00 pm ET → Nov 2, 2026 11:45 am ET**
- Judging: Nov 3 → Nov 20, 2026
- Winners announced: on or around **Nov 24, 2026**
- Source: /rules, main page

## 2. Eligibility
- Individuals at age of majority, teams, and organizations.
- Excluded: Promotion Entity employees/family, judges, conflicts of interest; excluded countries include Afghanistan, Belarus, Brazil, China, Cuba, Iran, Iraq, North Korea, Russia, Ukraine (occupied regions), Venezuela, Vietnam "and others"; previous edition also excluded Italy and Quebec **[verify current list on /rules]**. India is not excluded (India region uses `yce.makeupar.com`).

## 3. Submission requirements
- Working project "built with the required developer tools".
- **Code repository URL** (public or shared privately) with source + instructions.
- **Text description** explaining features/functionality and consumer or retail value.
- Screenshots.
- **Demo video 1–3 minutes**, on YouTube/Vimeo/Youku, showing the experience end-to-end, **explaining which YouCam API is used**, and showing the project running on its target device. No third-party trademarks or copyrighted music without permission.
- English (or with translation).
- Must be **free and unrestricted for judges to test** until judging ends → deployed URL with a judge path, no paywall, no mandatory signup.
- If "significantly updated," must explain the update.
- Winners: exit interview + blog feature.

## 4. Tracks
- **Skin AI** — "Use YouCam's Skin AI, alone or combined with other YouCam APIs, to help users understand their skin and know exactly what to do next."
- **eCommerce VTO** — "Build something that brings Virtual Try-On together into one seamless, intuitive experience" (beauty + fashion).
- No track-specific prizes; one pool.

## 5. APIs named on the hackathon page
- "AI Skin Analysis", "Skin AI", and "generative Apparel Virtual Try-On" — "same models powering 800+ global beauty and fashion brands."
- Docs: https://docs.perfectcorp.com/develop/introduction (India: docs.makeupar.com)
- Console: https://yce.perfectcorp.com/api-console (keys, playground)
- Full API reference: see **§ API Reference** below.

## 6. Credits
- 1,000 free units per registrant. Claim: register on Devpost → redeem code by email → sign up at yce.perfectcorp.com → Account → Redeem Code.
- Forum note: redeem codes briefly failed in the first days; organizer fixed it.

## 7. Technical requirements
- "Entrants must create a working application that integrates at least one Perfect Corp. YouCam API and demonstrate clear consumer or eCommerce value."
- "Functional web or mobile prototype." → **Web is preferable** for judges: zero install, instant access, works on the judge's laptop.
- Third-party SDKs/APIs allowed if authorized.

## 8. Judging criteria (Stage Two, equally weighted)
1. **Technological Implementation** — "How thoroughly and skillfully does the project integrate at least one YouCam API?"
2. **Design** — "Does the project deliver a complete, coherent product experience?"
3. **Potential Impact** — "Does the project make a credible, specific case for solving a real problem?"
4. **Quality of Idea** — "Is this a creative, non-obvious use of at least one YouCam API?"

Tie-break: higher score in the first listed criterion (Technological Implementation).
Named judge on the page: Wendy Yen (Perfect Corp; also forum manager).

## 9. What "clear consumer or retail value" means in practice
Reading the rubric + organizer copy together:
- A **specific** person or business must be demonstrably better off (time saved, money saved, a purchase made with confidence, a return avoided, an ability gained).
- The value must be **credible**: grounded in cited evidence and in what the API actually measures.
- The API must be **thoroughly** integrated ("beyond a simple API call") — multiple features, correct async handling, results transformed into a new artifact.

## 10. Restrictions
- Original work; no third-party IP violations; no Sponsor financial/preferential support.
- Sponsor receives a license to use the entry for judging/promotion.
- **No explicit rule text found on medical/skin claims or AI-generated content [unverified].** Regardless: YouCam's own skin analysis is marketed as cosmetic, not diagnostic. We avoid any diagnosis/treatment claims and label outputs as cosmetic appearance measurements.
- Personal images: rules treat likeness/photograph as personal information → privacy-first handling is both a requirement and a design feature.

## 11. Disqualification risks
- Not fitting theme / not applying the APIs (Stage One).
- Missing video, repo, or English; **project not accessible to judges** during judging (Nov 3–20) → keep deployment and API key alive, keep enough credits, and have a cached demo path.
- Trademarks/copyrighted music in the video → use only original/royalty-free audio and avoid real brand logos.
- False eligibility info; unsportsmanlike conduct.

## 12. Upgrading existing projects
- Allowed if "significantly updated after the start of the Submission Period," with an explanation. We are building a new product; reused infrastructure (YouCam client from MirrorIQ) will be disclosed in the README.

## 13. Previous edition (same organizers)
- "YouCam API Skin AI & Apparel VTO Hackathon" — https://youcam-api.devpost.com/
- Jul 6 → Aug 17, 2026; 1,280 participants, 238 projects; same 4 criteria.
- Winners: **Aloud**, **ShadeSpan**, **CASTING**, **KeepMe**, **ConfidFit** (placement order unconfirmed). See `previous-winners-analysis.md`.

## 14. Anything else that affects strategy
- **The judge panel is Perfect Corp product people.** They know every obvious use of their own API; "non-obvious" is judged against *their* mental model, not the public's. A project that shows them a new *market* for their API is valuable to them commercially.
- **Web > mobile** for judge access.
- **Credits are finite** (1,000 units) and judging runs 17 days after submission → a judge-mode that replays cached real results for the canonical path, plus a clearly-labelled live path, is essential.
- **The written submission is the gatekeeper**: with ~200+ entries, the first cut is made on title/tagline/thumbnail/description.

## API Reference (current docs, verified 2026-09-30)

Docs: https://docs.perfectcorp.com (index: /llms.txt; OpenAPI bundles: /_bundle/reference/<slug>.yaml). Release v1.15.1 (2026-09-04). Changelog: /release/changelog.

### Core pattern (all V2)
- Base URL `https://yce-api-01.makeupar.com`; header `Authorization: Bearer <API_KEY>`.
- Upload: `POST /s2s/v2.0/file` `{"files":[{content_type,file_name,file_size}]}` → `data.files[0].{file_id, requests[0].{url,method,headers}}` → **PUT bytes** with those headers. ≤10 MB/image.
- Run: `POST /s2s/v2.0/task/<feature>` → `data.task_id`. Poll `GET …/<feature>/<task_id>` → `data.task_status: running|success|error` (+`results`, `error`). Docs suggest ~10 s poll; official skills repo uses 5 s × 20.
- Delete: `POST /s2s/v2.0/task/delete {task_id}` (removes inputs + outputs) → privacy-by-design.
- Webhooks: Standard Webhooks (HMAC-SHA256 `webhook-signature`), payload only has `task_id` + status; max 10 endpoints.
- **Units charged only on `success`**; errors are free.
- Rate limit: 250 req / 300 s per IP **and** per token (~0.8 QPS sustained). 429 otherwise.
- Balance: `GET /s2s/v1.0/client/credit`; per-feature costs: `GET /s2s/v2.0/credit/feature-cost`.
- Result URLs valid **2 h**; task_id queryable 24 h (docs conflict: 24 h–30 d). Download outputs immediately.
- Parse large IDs as strings.
- Common errors: `error_no_face`, `error_multiple_people`, `error_large_face_angle`, `error_nsfw_content_detected`, `exceed_max_filesize`, `invalid_parameter`, `error_inference`; skin-specific: `error_below_min_image_size`, `error_src_face_too_small`, `error_src_face_out_of_bound`, `error_lighting_dark`.

### Skin Analysis — `/s2s/v2.0|v2.1/task/skin-analysis`
- Body: `src_file_id`, `dst_actions[]`, `format: "json"` (default is zip!), `miniserver_args.enable_mask_overlay`.
- SD concerns: `wrinkle, pore, texture, acne, oiliness, radiance, eye_bag, age_spot, dark_circle_v2, droopy_upper_eyelid, droopy_lower_eyelid, firmness, moisture, redness, tear_trough, skin_type`. HD: `hd_*` equivalents with sub-regions (wrinkle: forehead/glabellar/crowfeet/periocular/nasolabial/marionette; pore: forehead/nose/cheek). **Cannot mix SD and HD.**
- Output (json): `data.results.output[] {type, region, raw_score, ui_score, score, mask_urls[]}`, overall score, `skin_age`.
- **`raw_score` float 1–100, higher = healthier. `ui_score` is deliberately adjusted upward "as a psychological motivator."** → Evidence products must use `raw_score`.
- Input: SD short side ≥480 px, HD ≥1080 px; face width >60% of image width; frontal, even light, no makeup, forehead visible.
- Cost: SD 9 / 12 / 14 / 16 units for 1–4 / 5–8 / 9–12 / 13–16 concerns; HD 12 / 16 / 20 / 22.

### Other relevant endpoints (units)
| Feature | Slug | Units | Output |
|---|---|---|---|
| Face Analyzer | `face-attr-analysis` | 10 (1–5 features) | face shape, age, … **`face_quality{has_face, area, frontal, lighting, faceangle}`**; `face_angle_strictness_level` |
| Facial color tones | `skin-tone-analysis` | 20 | hex skin/eye/lip/brow/hair color |
| Fitzpatrick | `fitzpatrick-scale-analyzer` | 10 | I–VI |
| **Skin Simulation** | `skin-simulation` | 4–6 | image with improved wrinkle/radiance/oiliness/acne/eye_bags/dark_circle/spots/pores/texture/redness (0–1 each) |
| **Photo Lighting** | `lighting` | 2 | relit (brightened) image; no params |
| Photo Enhance | `enhance` | 2 | enhanced image |
| Color correction | `colorize/color-correct` | 2 | color-corrected image |
| Makeup VTO | `makeup-vto` | 1 | effects incl. **`skin_smooth`, `foundation`, `concealer`** |
| Aging | `aging` | ? | aged/de-aged face |
| Clothes | `cloth`, `cloth-v3`, `cloth-v4` | 2 | garment on person |
| Hair/nail/jewelry/etc. | various | 1–2 | VTO images |

### Capture tooling
- **JS Camera Kit v2.5** (`https://plugins-media.makeupar.com/v2.5-camera-kit/sdk.js`): modes incl. `skincare`, `hdskincare`, `shadefinder`; `qualityLevel: relaxed|moderate|strict`; events `faceQualityChanged`, `faceDetectionCaptured` (returns image; then upload via File API). Capture-guidance only; no key in browser. [Access for hackathon accounts unverified.]
- MCP servers (`https://mcp-api-01.makeupar.com/mcp/beauty|fashion|creators`) and `YouCam-API/skills` GitHub repo (reference Python client).

### Terms of Service highlights
- Must obtain consent from people in photos (§3.4, §11.2.3). Commercial use of outputs allowed (§11.3). **No using the service to build ML training datasets (§8.6(t)).** Users 13+.
- No explicit medical disclaimer in ToS; we still make **no diagnostic claims** and describe outputs as cosmetic appearance measurements.
