# Measurements — live YouCam API

Our own measurements, produced with the live YouCam API. Raw responses: `spike/results.json`. Script: `scripts/spike.mts`.

## Run 1 — 2026-09-30 · synthetic accuracy & determinism spike

**Method.** Six synthetic adult portraits were generated with YouCam text-to-image (`/s2s/v2.0/task/text-to-image/youcam`, model `youcam-image-v2`, 1104×1472), each prompted with an *intended* hair profile. For each, YouCam image-to-image produced the three extra views the hair detectors require (turned right ~45°, turned left ~45°, head lowered ~45°). The four hair detectors then ran with the documented inputs: type and frizz on [front, right, left]; length on front; density on the lowered view. Two portraits were analysed twice to test determinism.
No real people were photographed. "Intended" is the prompt, not a verified ground truth. This is a smoke test of behaviour, not an accuracy study.

| Portrait | Intended type | **Hair Type** | Intended length | **Hair Length** | Intended density | **Hair Density** | **Frizz** |
|---|---|---|---|---|---|---|---|
| coily-long-full | 4b–4c | **4B to 4C** ✓ | long when stretched (large afro) | **short hair** | high | 2.11 Medium | Slightly Frizzy |
| curly-collarbone | 3b–3c | **3B to 3C** ✓ | collarbone | **above chest** ✓ | medium | 2.57 High | Slightly Frizzy |
| coily-short | 4a–4c | **4B to 4C** ✓ | above ears | **above the ears** ✓ | medium-high | 0.74 Low | Frizzy |
| straight-fine-shoulder | 1–2a | **1 to 2A** ✓ | shoulder | **above chest** (≈) | low | error_face_angle_invalid | Not Frizzy ✓ |
| wavy-long | 2b–2c | **2B to 2C** ✓ | past chest | **long hair** ✓ | medium | error_face_angle_invalid | Slightly Frizzy |
| kinky-chest-stretched | 4a–4b | **4B to 4C** (one band off) | chest (stretched) | **long hair** ✓ | high | error_face_angle_invalid | Not Frizzy |

### Findings
1. **Hair type: 5/6 within the intended band, 6/6 within one band, including all three coily portraits.** The critical go/no-go risk (does it read 4a–4c?) passes on this test. Must be re-checked on real, consented photos.
2. **Determinism: 8/8 identical outputs** when the same images were re-analysed (type, density, length, frizz × 2 portraits). The same photos produce the same quote.
3. **Length measures how hair hangs, not stretched length.** A large 4C afro reads "short hair". This is shrinkage, and it matters for braiding and silk-press pricing. → Product change: for curly/coily results, ask the client to confirm *stretched* length and show it as "client-reported" beside the measured value.
4. **Density needs a genuine head-lowered selfie.** 3/6 synthetic lowered views were rejected (`error_face_angle_invalid`). → Product change: guided capture for the density photo (angle cue), with a clear retake message; quotes still work with density "not measured" (range widens).
5. **Capture protocol is four selfies, not two photos** (type/frizz require exactly three images in the order front → right → left, same size; back/top views are rejected). → Product change: four-step guided capture.
6. **Live API returns upper-case type mappings** (`"4B to 4C"`), unlike the docs (`"4b to 4c"`). Normalizer fixed and tested before it could ship.
7. **Latency:** detectors report 4.6–8.6 s processing (`timed`); submit→success observed at 10–52 s including queue and our 3 s poll interval. Four run in parallel → quote wait ≈ slowest task. → The waiting screen must show per-measurement progress and useful content.
8. **False positive:** one image-to-image request for a lowered head was rejected with `error_nsfw_content_detected`.
9. **Units:** the run consumed 93 units (1,000 → 907 on the batch expiring 2026-11-15).

### Unit costs observed
text-to-image ≈1, image-to-image ≈1, hair type 2, density 1, length 2, frizz 2. A four-detector quote = **7 units**.

### Addendum — density retry (same day)
Regenerated the head-lowered view for the three portraits whose density failed, with a stricter prompt (pitch-only, chin toward chest, hairline facing camera). All three were again rejected with `error_face_angle_invalid`. Type/length/frizz outputs were identical to the first run (further determinism evidence). Conclusion: synthetic lowered views don't meet the density detector's angle requirement; density must be validated with real guided selfies (YouCam JS Camera Kit `hairdensity` mode or our own angle cue). Raw: `spike/results-straight-fine-shoulder+wavy-long+kinky-chest-stretched.json`.

## Run 2 — 2026-10-01 · live end-to-end through FairChair's own API
Four views of the "curly-collarbone" portrait posted to `POST /api/analyses` (knotless, demo studio), then polled via `GET /api/analyses/:id`.

1. **First attempt found a real bug.** Hair type and density succeeded; length and frizz then failed with `unknown_internal_error`. Cause: FairChair called `POST /s2s/v2.0/task/delete` as soon as each task succeeded, and that endpoint also deletes the task's *input files* — which the still-running tasks shared (the front photo). Fix: delete upstream only after **every** task in the analysis has finished; plus one automatic retry for transient engine errors (`unknown_internal_error`, `error_inference`), which cost no units.
2. **Second attempt: complete in 14 s.** Type and density were served from FairChair's result cache (same image hashes → 0 units); length and frizz ran live. Measurements identical to Run 1 (3B–3C · 2.57 High · above chest · Slightly Frizzy).
3. Upstream tasks deleted after completion (`upstream_deleted = true`).

## Run 3 — 2026-10-01 · try-on (hair-transfer v2.1, custom reference)
- Reference: one AI-generated portfolio photo of medium, mid-back knotless braids (text-to-image, ~1 unit).
- Transferred onto four portraits (3B–3C curls, 4C afro, short tapered 4C, stretched 4A–4B): **4/4 succeeded**, 8.6–8.9 s each, 2 units each. Faces preserved; braids rendered at the reference length regardless of the client's natural length.
- Live through FairChair's `/api/tryon`: 14.6 s round trip; result returned to the browser and not stored; task deleted afterwards.
- Raw: `spike/tryon-*.json`; images: `public/demo/previews/`.

## Run 4 — 2026-10-01 · production (Vercel + Neon)
- All judge-path pages return 200 on https://fairchair.vercel.app; a wrong studio key returns 404.
- Demo path (recorded results, 0 units): analysis → quote → booking → receipt → recorded try-on all succeed.
- **Found:** Vercel rejects request bodies over 4.5 MB (`FUNCTION_PAYLOAD_TOO_LARGE`). Four full-size photos (~8 MB) failed before reaching our code. Fix: the browser prepares photos at 1280 px / JPEG 0.85 (≈270 KB each, 1.1 MB for four); client and server enforce a friendly limit.
- Live analysis on production with browser-sized photos: **all four measurements in 18 s**; values match Run 1 (density 0.73 vs 0.74 at full resolution — same grade), confirming 1280 px loses nothing.

## Run 5 — 2026-10-01 · hair colour & extension try-on (for the store widget)
**Hair colour (`skin-tone-analysis` → `hair_color`, 20 units each).** The output is one of 7 fixed colours (a family, not a shade).

| Portrait | Hair colour by eye | YouCam `hair_color` | Correct? | `face_quality.area` |
|---|---|---|---|---|
| curly-collarbone (Maya) | brown | #42280E Brown | ✓ | toosmall |
| coily-long-full (Nia) | black | #000000 Black | ✓ | toosmall |
| coily-short (Tess) | black | #FAF0BE **Blonde** | ✗ | good |
| kinky-chest-stretched (Ada) | black | #FAF0BE **Blonde** | ✗ | good |

**Decision:** 2/4 wrong, both black hair on dark skin — the users this product exists for. FairChair **does not auto-select shade** from `hair_color`; the shopper chooses a colour family and is told which shade numbers to swatch. This also removes 20 units per match. Raw: `spike/demo-extras-*.json`.

**Extension try-on (`hair-ext`, 1 unit):** 3 templates exist (`all_length_1`, `all_length_2_`, `all_length_3`; titles "Length 1–3"; no length/colour parameter). 6/6 runs succeeded (7–15 s). The added hair **keeps the client's own curl pattern**, which is exactly what a blend preview should show. Length differences mostly fall below a head-and-shoulders frame, so the UI presents it as "your hair with extensions", not exact inches.

## Run 6 — 2026-10-01 · YouCam JS Camera Kit (guided capture)
- Loads without an API key; modes used: `hairlength` (1 phase, step-back), `hairtype` (3 phases: front, right, left), `hairdensity` (2 phases; the last is the lowered head).
- **Found:** the docs name the init callback `window.YMKAsyncInit`, but sdk.js v2.5 calls `window.ymkAsyncInit` (lower-case y) — an integration written from the docs never initialises. FairChair defines both.
- Verified in a camera-less browser: SDK loads, Camera Kit mounts, camera request → `cameraFailed` (`error_permission_denied`) → friendly fallback to manual upload. Real capture to be verified on a phone.

## Run 7 — 2026-10-01 · first real person, real phone (guided camera, production)
- Guided capture completed all three Camera Kit steps on an iPhone after fixing two integration bugs (live view mounted off-screen; a late `closed` event cancelling the next step).
- **Hair Density: Medium (1.96/3)** — the first density reading on a real photo (synthetic chin-down views were always rejected). **Hair Length: "above the ears".**
- Hair Type and Frizziness: `error_face_angle_invalid`. Hypothesis: mirrored front-camera images / capture order deliver "right" as the left view. Fix shipped: retry once with sides swapped; YouCam's error message is now shown to the client for diagnosis.
