# Demo Script — FairChair (target 2:40, hard limit 3:00)

**Rules for the recording:** original voice-over only, no music with lyrics or copyrighted tracks, no third-party brand logos on screen. Record the deployed site at 1440×900 (desktop parts) and a phone screen recording (capture parts). Show, don't narrate: every claim is on screen when it's said.

**Before recording:** create a fresh studio via `/start` and upload a portfolio photo; have a consented person with 4a–4c hair for the live capture; check `npm run youcam:check` so live analysis is on; clear old demo requests.

---

### 0:00–0:10 · The problem
**Screen:** landing hero → DM mockup ("ok should be around $220 😊" → "Saturday: … It's $50 more.").
**VO:** "Every braider quotes from a blurry selfie. On the day, the hair is fuller and longer than it looked, and a $220 quote becomes a $50 argument at the chair."

### 0:10–0:22 · Why current tools fail
**Screen:** the three problem cards (sources visible).
**VO:** "Length, fullness and texture decide the price and the time — and nobody measures them. Even quote calculators make someone type the hair in."

### 0:22–0:32 · The product
**Screen:** tagline + the YouCam chips.
**VO:** "FairChair measures the hair first, with YouCam's hair type, density, length and frizz detection."

### 0:32–1:22 · Core workflow (client, live, phone)
**Screen:** `/s/<studio>` → Knotless · Medium · Mid-back → **Use guided camera** (YouCam Camera Kit: step back → turn right/left → chin down) → "Measuring your hair" with each row ticking and saying what it decides → Hair Card → receipt.
**VO (capture):** "YouCam's own guided camera takes the angles its detectors need."
**VO (receipt):** "Every line says why: plus forty-five minutes because YouCam measured high density. Curl pattern adds prep *time*, never a surcharge."
**Screen:** "See it on you" → the stylist's own braids on the client (live badge) → slot picker (only times that fit) → receipt.
**VO:** "The client sees this stylist's actual work on themselves, books a slot that fits the whole job, and both sides keep the same receipt."

### 1:22–1:42 · The surprise
**Screen:** `/compare` — Maya vs Nia; zoom to the summary strip → the fairness card.
**VO:** "Same style, two heads. You might expect the 4C client to pay more. Nia doesn't — the fuller head costs more, and every dollar points to a measurement. Texture changes time, never the rate."

### 1:42–2:12 · The same measurement, on a store
**Screen:** `/store-demo` → scroll to "Find my match" → 20", Black → demo client → match card (Kinky Straight · 24" · 5 packs, each with its reason) → extension try-on → the Shopify cart link.
**VO:** "Opened hair can't be returned. On an extension store, the same measurements pick the texture, the length — with shrinkage — and how many packs, show it in the shopper's own texture, and hand off to the store's Shopify checkout. A store connects by pasting a product link."

### 2:12–2:32 · Stylist, evidence, business
**Screen:** studio dashboard → portfolio upload → calendar (sized block) → Accuracy tab after logging a time → evidence card: "Hair type within one band 6/6 · 8/8 repeat runs identical · quote in 18 s · 7 units ≈ $0.38 · hair colour misread dark hair → shoppers choose colour".
**VO:** "We tested every API live, and let the results decide: when YouCam's colour misread black hair, we took it out of the decision. About thirty-eight cents of API per quote — paid for by deposits and store subscriptions."

### 2:32–2:40 · Close
**Screen:** logo on dark background, URL.
**VO:** "FairChair. Price the hair, not the argument."

---

## Shot list
- [ ] Hero + DM mockup · problem cards
- [ ] Phone: guided camera (all three steps), measuring screen, receipt with live badge
- [ ] Try-on of the stylist's portfolio photo (live)
- [ ] Slot picker · receipt
- [ ] /compare summary · fairness card
- [ ] /store-demo match flow → match card → extension try-on → cart link
- [ ] Studio: portfolio upload, calendar, accuracy
- [ ] Evidence card · closing card

## Fallback
If live capture fails on camera, use a demo client: results are labelled "Recorded YouCam result"; say so in VO.
