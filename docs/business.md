# FairChair — Business Assessment

_2026-10-01. Candid, not a pitch. Numbers marked [F] are sourced; [A] are our assumptions._

## 1. Unit economics (the constraint that shapes everything)
- YouCam API price: **$0.046–0.055 per unit** (subscription $24/mo for 500 units; PAYG $0.055) [F: yce.perfectcorp.com/ai-api/api-pricing, 2026-10-01].
- One quote = 4 hair detectors = **7 units ≈ $0.35–0.39**. With a try-on preview: +1–2 units → **≈ $0.45**.
- A busy braider answering ~60 quote requests/month → **~$25/month of API cost** [A].

**Implication:** a flat $19–29/month subscription with unlimited quotes loses money on busy stylists. The price must scale with usage, or be tied to money that is already moving (deposits).

## 2. Pricing model we recommend
| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Deposit take-rate (recommended)** | Client pays the booking deposit through FairChair (Stripe Connect); platform fee 3% of deposit (≈ $2.25 on a $75 deposit) + stylist pays nothing up-front | Zero friction to sign up; revenue scales with real bookings; the analysis cost (~$0.40) is covered by one booking per ~5 quotes | Needs Stripe Connect + payouts; stylists already pay card fees elsewhere |
| B. Subscription + quota | $29/mo incl. 50 quotes, $0.60 per extra | Predictable | Up-front ask to a price-sensitive solo market |
| C. Per-quote credits | $0.99/quote, first 10 free | Simple | Feels like paying for leads that may not book |

Start with **A + a free tier of 10 analysed quotes/month**; add B for heavy users.

## 3. How big can this realistically get?
**Side-income scenario (12 months, one person, organic):** [A]
- 100 active stylists × ~15 bookings/month × $75 deposit × 3% ≈ **$3,400/month gross platform fees**.
- Minus API (100 × 60 quotes × $0.40 ≈ $2,400) → **~$1,000/month net**. Thin.
- The same 100 stylists on option B ($29) → $2,900 − API $2,400 → also thin.

**Honest read:** as a pure solo-stylist tool, FairChair is a *real but small* business. Margins improve only if (a) quotes per booking fall (analyse only after the client picks a slot/pays a refundable hold), (b) YouCam volume pricing drops (10k units/mo ≈ $0.046), or (c) a higher-value buyer pays.

**The higher-value buyer: extension & wig brands (B2B, eCommerce) — now built ("Find my match").** The same engine answers the #1 pre-purchase question on every extension store: *how many bundles, what texture, what length, which shade?* Opened hair is non-returnable [F: Luxy return policy], and brands run human "colour match" teams today [F: Luxy, Bellami]. A Shopify app at **$99–299/month** per brand needs only ~10–20 brands to match the whole stylist scenario above, with far lower API cost per dollar of revenue. This is the version most likely to earn meaningful side income, and it's squarely "eCommerce value" for the hackathon narrative.

**Recommended sequencing:** win/place in the hackathon with the stylist story (clearest, most human demo) → launch free for stylists to collect real accuracy data → build the Shopify "Order the right hair" app on the same engine as the paid product.

## 4. Where to deploy
| Layer | Hackathon / now | When charging money |
|---|---|---|
| App hosting | **Vercel Hobby** (free) | **Vercel Pro ($20/mo)** — Hobby's terms are for non-commercial use. Alternatives: Railway / Fly.io (~$5–10/mo) |
| Database | **Neon** free tier (Postgres) | Neon Launch (~$19/mo) when storage/compute grows |
| Payments | — | **Stripe Connect** (deposits + platform fee), **Stripe Billing** (subscriptions) |
| Domain | vercel.app subdomain | own domain (~$15/yr) |
| Email | — | Resend / Postmark for receipts & magic-link login |
| Distribution (stylists) | — | Link-in-bio on Instagram/TikTok; direct outreach to braiders in one city first (Atlanta, Houston, DC); braiding-supply stores; braider Facebook groups; later Square Appointments / Acuity integrations |
| Distribution (brands) | — | **Shopify App Store** listing ("Order the right hair") |

Fixed running cost at launch ≈ **$40–60/month** + API usage.

## 5. Risks that decide success
1. **Capture friction.** YouCam's hair type/frizz need 3 angles and density a head-lowered selfie → 4 photos. Clients already send photos to braiders, but 4 guided selfies must feel like 30 seconds. Mitigation: guided capture (YouCam JS Camera Kit), density optional.
2. **Accuracy on real textured hair.** Synthetic test: type 6/6 within one band; density unvalidated. Must test on real, consented photos before charging.
3. **Biometric-privacy law.** Face photos may fall under Illinois BIPA / Texas CUBI / Washington biometric rules. Needs explicit consent, a public retention/deletion policy (we already delete from YouCam after analysis and don't store photos), and a privacy policy before launch.
4. **Platform risk.** Booksy/StyleSeat/GlossGenius could add photo-based quoting. Defence: speed, the fairness positioning, the stylist's own accuracy history, and the brand-side product.
5. **Pricing sensitivity.** Braiders are small businesses; anything that looks like a "lead fee" is resisted. Deposit take-rate aligns cost with revenue.

## 6. What would make it genuinely successful
- 20 real stylists using it for a month, and published before/after numbers: fewer day-of price changes, fewer overruns.
- One extension brand piloting the "order the right hair" widget.
- A YouCam/Perfect Corp partnership (winners get a product-team meeting): they sell the hair APIs to "extension vendors and beauty supply retailers", so FairChair is a showcase for them.


## 7. Store widget unit economics (built)
- One match = hair type (2) + density (1) + length (2) = **5 units ≈ $0.26**, plus an optional extension try-on (1 unit ≈ $0.05). Hair colour (20 units) is excluded — it misread dark hair in testing and shoppers choose colour instead.
- A typical extension order is 3–7 packs at ~$90–130 each, so the API cost is a fraction of a percent of order value.
- Pricing: $99–299/month per store by matches included; integration costs the merchant nothing (paste a product link, add one Custom Liquid block; checkout stays in Shopify).
