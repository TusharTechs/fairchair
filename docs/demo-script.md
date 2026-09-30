# Demo Script — FairChair (target 2:20, hard limit 3:00)

**Rules for the recording:** original voice-over only, no music with lyrics or copyrighted tracks, no third-party brand logos on screen. Record the deployed site at 1440×900 (desktop parts) and a phone screen recording (capture parts). Show, don't narrate: every claim is on screen when it's said.

**Before recording:** create a fresh studio via `/start` for the stylist beat; have four real selfies ready on the phone (consented; ideally a teammate with 4a–4c hair); check `npm run youcam:check` so live analysis is on; clear old demo requests.

---

### 0:00–0:10 · The problem
**Screen:** landing hero → the DM mockup ("ok should be around $220 😊" → "Saturday: … It's $50 more.").
**VO:** "Every braider quotes from a blurry selfie in their DMs. On the day, the hair is fuller and longer than it looked, and a $220 quote becomes a $50 argument at the chair."

### 0:10–0:25 · Why current tools fail
**Screen:** the three problem cards (starting-at pricing · 6–12 hour styles · Birmingham arrest headline, source link visible).
**VO:** "The things that change the price — length, fullness, texture — are on every braider's FAQ, and measured by nobody. Even quote calculators make someone type the hair in."

### 0:25–0:40 · The product
**Screen:** logo + tagline "Price the hair, not the argument." → the four YouCam chips.
**VO:** "FairChair measures the hair before anyone books, using YouCam's hair type, density, length and frizz detection — and turns the stylist's own menu into an honest quote."

### 0:40–1:40 · Core workflow (the client, live)
**Screen (phone):** `/s/<studio>` → Knotless, Medium, Mid-back → the four guided selfies (straight on · turn right · turn left · chin down) → consent → "Measuring your hair" with each YouCam measurement ticking done → Hair Card → the receipt.
**VO (while capturing):** "Four quick selfies — the angles YouCam's detectors need."
**VO (on receipt):** "Every line says why. Plus forty-five minutes — because YouCam measured high density. Curl pattern adds prep *time* — never a surcharge. The chair is reserved for exactly as long as this hair needs."
**Screen:** stretched-length prompt (for coily results) → pick a slot (only times that fit are offered) → receipt with **Live YouCam result** badge and hash.
**VO:** "Coily hair shrinks, so the client can add a stretched length — shown as reported, not measured. Both sides keep the same receipt."

### 1:40–2:05 · The surprise
**Screen:** `/compare` — Maya vs Nia. Zoom to the summary strip.
**VO:** "Same style, two heads. You might expect the 4C client to pay more. Nia doesn't. The fuller head costs more — and every dollar of the difference points to a YouCam measurement."
**Screen:** landing "Fair by design" card: "+$25 if hair is 4C" flagged → converted to prep minutes.
**VO:** "Texture changes time, never the rate. FairChair won't apply a texture surcharge."

### 2:05–2:25 · Stylist, evidence, business
**Screen:** `/studio/…` → Requests (hair card) → Calendar (6 h 30 m block) → Accuracy tab after logging a real time.
**VO:** "The stylist gets the measured request, a calendar slot sized to the work, and learns which of their own rules runs over."
**Screen:** `docs/measurements.md` table (briefly) or an on-screen card: "Live test: curl type within one band on 6/6 portraits · 8/8 repeat runs identical · quote in 14 s · 7 units ≈ $0.38".
**VO:** "We tested the API live: consistent results, a quote in fourteen seconds, about thirty-eight cents of API per quote — paid for by booking deposits."

### 2:25–2:35 · Close
**Screen:** logo on dark background, URL.
**VO:** "FairChair. Price the hair, not the argument."

---

## Shot list checklist
- [ ] Hero + DM mockup
- [ ] Problem cards with visible sources
- [ ] Phone capture (4 selfies) — real person, consented
- [ ] Measuring screen with real task states
- [ ] Receipt with measured chips + live badge
- [ ] Stretched-length prompt
- [ ] Slot picker (sized)
- [ ] /compare summary
- [ ] Fairness card
- [ ] Studio: request, calendar, accuracy
- [ ] Evidence card
- [ ] Closing card

## Judge-path fallback (if live capture fails on camera)
Use a demo client from the photo step — the result is labelled "Recorded YouCam result", which is honest; say "here's a recorded live result" in VO.
