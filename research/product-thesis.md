# Product Thesis

_v1 — 2026-09-30. Supersedes the killed "Baseline" concept (see `idea-bank.md`)._

## Product
**Name (working):** FairChair
**Tagline:** Honest quotes for textured hair, measured before anyone books.
**One sentence:** FairChair turns a client's two photos into a line-item price, the right-length appointment, and a hair supply list for braiders and extension stylists, using YouCam's hair type, density, length, and frizz detection.

## The problem
An independent braider publishes "Knotless, mid-back: from $220." A client DMs "how much?" and a photo. The braider guesses from a compressed selfie at 11 pm. On the day, the client's natural hair turns out to be longer and fuller than it looked. The service takes 7 hours instead of 5. The braider either eats two unpaid hours (and makes the next client wait) or asks for $50 more at the chair, which the client experiences as a bait-and-switch. In November 2025 a dispute exactly like this, $200 agreed by text and $50 more demanded on the day, ended with arrests in Birmingham, Alabama.

The variables that change the price, **how long, how dense, how coily, how frizzy** the client's natural hair is, are known to matter, are written on every braider's FAQ, and are **measured by nobody**. Quotes are guessed from a DM; appointments are booked with a flat duration; the day-of surcharge is the reconciliation.

## The user
- **Buyer / primary user:** Independent textured-hair stylists (braiders, extension and wig installers, silk-press and natural-hair specialists), mostly solo or 1–3 chair studios, booking via Instagram DMs + StyleSeat/Booksy/GlossGenius/Acuity.
- **Secondary user:** Their clients, who want to know the real price and time *before* paying a deposit and blocking a whole day.

## The existing experience
1. Price list says "starting at"; FAQ lists 5 things that change it.
2. Client DMs a photo; stylist answers manually (often at night), or ignores.
3. Stylist books a fixed slot per service.
4. At the chair, the stylist sees the real hair; adjusts price and runs over.
5. Tools that exist are **manual** (Braid Boss Pro calculator: stylist *types* length and density) or **photo collection without analysis** (StyleSeat forms).

## The failure
The inputs to the price are self-reported, guessed, or discovered too late. That single fact causes: surprise charges, disputes, under-booked days, DM overload, and distrust on both sides.

## Our insight
**The price is in the hair, so measure the hair before the booking, and let both sides agree on the measurement.** A quote built from measured, recorded variables is not an opinion: it is the same published rule applied to the same numbers the client can see. Measured once, it also fixes the calendar (the slot is as long as the hair needs) and the shopping list (packs, texture, length).

Second insight: **price by time and materials, never by texture label.** Curl pattern legitimately changes prep time; it should never be a surcharge by itself. FairChair converts texture into minutes and flags rules that charge for a label.

## The product
1. **Stylist setup (3 minutes):** pick services from templates (knotless, box braids, boho, silk press, sew-in, tape-ins, wig install, loc retwist); set base prices and times; FairChair suggests time adjustments per density/length/type/frizz band, which the stylist edits. Output: a quote link for the bio.
2. **Client quote (60 seconds, mobile):** choose service, size, target length → guided capture (front + side/back) with live framing checks → **YouCam Hair Analysis** (type, density, length, frizz) → **Hair Card** (plain-language measurements, confidence, and "not right? retake / tell your stylist") → **line-item quote** where each adjustment cites the measurement that caused it → **preview** of the target look (YouCam extension/hairstyle/colour VTO where the service supports it) → **supply list** (packs/grams, texture match, length to order) → pick a slot already sized to the estimated duration → deposit.
3. **Quote Receipt:** timestamped, hashed record of the photos (optional retention), measurements, rule version, and price. Both sides hold the same document.
4. **Stylist inbox & calendar:** incoming quotes with Hair Cards; slots sized by estimate; after each appointment, one tap logs actual duration → FairChair shows where the stylist's own rules are consistently off ("Your knotless on High density runs 40 min over — adjust?").

## Why YouCam
| Need | YouCam API | Load-bearing? |
|---|---|---|
| Curl pattern (prep/detangle time; texture match for extension hair) | `hair-type-detection` (9 bands, 1→4c) | Yes |
| Fullness (time, pack count) | `hair-density-detection` (0–3 float, 4 grades) | Yes |
| Natural length (short-hair/long-hair adjustments, blend length) | `hair-length-detection` (8 bands) | Yes |
| Frizz (stretch/blow-out prep) | `hair-frizziness-detection` (4 grades) | Yes |
| Shade match for extension hair | `skin-tone-analysis` → `hair_color` hex | Yes (extension services) |
| Show the client what they're paying for | `hair-ext`, `hair-style`, `hair-color` VTO | Yes (conversion) |
| Capture quality gate | `face-attr-analysis` `face_quality` (or local checks) | Supporting |

Remove YouCam and the product reverts to Braid Boss Pro: a form where someone types guesses.

## Why now
- YouCam's hair diagnostics launched **June 2026**; they did not exist for the last generation of salon tools. Nobody in ~289 prior hackathon projects used them.
- Braid prices have roughly doubled to tripled since 2014; higher tickets make surprise charges more painful.
- Stylist booking has moved to link-in-bio tools that accept embedded flows.

## Differentiation
- **Not try-on-first.** The primary output is a price, a duration, and a supply list. Try-on is the confirmation step.
- **Not a consumer stylist or recommender.** It sits between a professional and a paying client at the moment of commitment.
- **Not a salon-chain hardware scanner** (K-Scan, Paul Mitchell) and **not a pre-consult product recommender** (TheHair.App): FairChair prices, schedules, and records.
- **Fairness built in:** texture → time, never texture → surcharge.
- In the Perfect Corp hackathon record, the only nearby project (GlamCode OS) showed colour/cut/beard try-ons and a booking button; it measured nothing and quoted nothing.

## Business
- **Who pays:** the stylist. $19–29/month (anchor: Braid Boss Pro $19.99 for a manual calculator) including N analysed quotes; usage beyond that metered.
- **Why they pay:** fewer DMs, fewer overruns, fewer disputes, deposits that match the work, more bookings from clients who finally see a real number.
- **Unit economics:** one quote ≈ 7 YouCam units for four diagnostics (+1–2 for a try-on). [Dollar cost per unit to be confirmed from the pricing page.]
- **Distribution:** link-in-bio (Instagram/TikTok) → embed in StyleSeat/Booksy/GlossGenius/Acuity; braider communities; beauty-supply partners.
- **Second revenue line:** supply list → affiliate/partner checkout for braiding hair and extension packs (the only step where the client is already buying product).

## Expansion
- Integrations: booking platform apps (Booksy, GlossGenius, Square Appointments).
- Other length/density-priced services: silk press, loc retwists, colour, barbering, lash extensions.
- Extension/wig brands: the same measured profile drives "what to order" on their store (texture, packs, length), cutting unreturnable wrong-hair orders.
- Salon chains: capacity planning from measured service durations.

## Killer demo
**"Same style. Two heads. Two honest quotes."** Two clients request the identical service (knotless, medium, mid-back). FairChair measures both. Client A: $220, 5 h 15 m. Client B: $265, 6 h 45 m. Tap any difference and it points to the YouCam measurement that caused it (density 2.7/3 "High Density" → +60 min; "above chest or longer" → +30 min). The stylist's calendar shows B's slot already longer. No DM thread. No surprise at the chair.
Second beat: a rule that says "+$25 for 4C" is flagged, and FairChair offers to convert it into "+35 min prep for tight coils at your hourly rate."

## Honest limits (stated in the product and submission)
- Bands are coarse; quotes are ranges; the stylist can override with a reason that's shown to the client.
- Accuracy on 4a–4c, protective styles, and covered hair must be measured (`docs/measurements.md`) and disclosed.
- Not a hair-health diagnosis. No scalp/medical claims.
