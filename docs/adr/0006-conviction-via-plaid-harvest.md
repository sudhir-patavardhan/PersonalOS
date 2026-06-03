# ADR-0006: Conviction Scoring via Plaid Harvest Detection

## Status
Accepted (amended: per-Signal-Type conversion windows, time-based decay, Voucher webhook)

## Context
After a Soul Claims an Offer, there is no guaranteed connection between that Claim and an actual purchase. Brands care about real buyers, not just attention. The platform needed a mechanism to surface Souls who act on Claims — without requiring Brand-reported attribution, without unique per-Soul coupon tracking, and without breaking the anonymity model.

## Decision
Conviction is scored per-Signal-Type using Plaid Harvest data. After a Claim in a given Signal Type, Scoring monitors subsequent Harvests for matching purchase Transaktions in that category. If a matching purchase is detected within the Signal Type's conversion window, the Soul's Conviction for that Signal Type increases. There is no direct attribution between a specific Claim and a specific purchase — the category-level purchase signal is sufficient.

### Conversion Windows
Conversion windows are defined per Signal Type by PersonalOS and published as part of the open Scoring algorithm (ADR-0003). They are not Soul-configurable. Example windows:
- `financial.discretionary_spend` — 30 days
- `automotive.new_vehicle_purchase` — 90 days
- `travel.flight_intent` — 14 days

Souls can see the conversion window for each Signal Type in their Consent settings.

### Conviction Decay
Conviction decays over time to reflect current behaviour rather than historical peaks:
- Halves every 6 months of inactivity in a Signal Type (no matching purchase detected)
- Never decays to zero — prior track record retains permanent signal value
- A new matching purchase Transaktion resets the decay clock
- Decay is computed on-device during Scoring, consistent with the privacy model (ADR-0003)

### Vouchers
Vouchers (discount codes, promo offers) may be included in Listing content as a Soul-facing benefit. Voucher integrity is the Brand's responsibility. PersonalOS never generates, stores, or tracks Voucher codes.

For Brands who want protected single-use codes, PersonalOS supports an optional `voucher_delivery_webhook` field on Listings. On each Claim, PersonalOS calls the webhook and the Brand's system returns a fresh code. The code generation and validity logic stays entirely on the Brand side. This is documented explicitly in Brand onboarding.

Non-webhook Vouchers remain non-unique per Soul — Brands accept this limitation when not using the webhook integration.

## Alternatives Considered
- **Brand-reported redemption via API** — requires every Brand to build an integration. Raises onboarding bar significantly. Not viable for early-stage platform with unproven volume.
- **Unique per-Claim coupon codes** — enables precise redemption tracking but creates a de-anonymization risk: the Brand's checkout system can join the coupon code to their customer record, bridging from anonymous to identifiable. Contradicts the privacy model.
- **Soul self-reporting** — "Did you make a purchase?" prompt in-app. Gameable — Souls have Yield incentive to misreport. Unreliable as a signal.
- **Strict last-touch attribution** — holding a Claim responsible only if the purchase occurs within a tight window (e.g. 24 hours). Too brittle; most considered purchases take days to weeks.
- **Fixed conversion window across all Signal Types** — rejected. Purchase consideration time varies too widely by category to use a single window without systematically over- or under-counting Conviction in high and low-velocity categories.
- **Soul-configurable Conviction decay** — rejected. Conviction is a signal for Brands, not a setting for Souls. Allowing Souls to slow decay would create an incentive to inflate their own scores.

## Consequences
- Conviction is a directional signal, not a precise attribution. A Soul who buys a car is a real automotive buyer regardless of which specific Listing triggered the purchase.
- Conviction computation runs on-device during Scoring — consistent with the privacy model (ADR-0003). Only the resulting Conviction scores reach the server.
- Plaid coverage is not universal: cash purchases, business accounts, and non-linked banks are invisible. Conviction will undercount for some Souls. This is acceptable — it means Conviction is conservative, not inflated.
- Per-Signal-Type conversion windows require PersonalOS to maintain a versioned window table as part of the published Scoring algorithm.
- Time-based decay means Conviction scores are dynamic — the Exchange's composite ranking score (`bid × Conviction × recency_weight`) will shift over time even without new Harvests.
- The `voucher_delivery_webhook` is optional infrastructure — Brands who don't use it accept non-unique codes. PersonalOS must document this tradeoff clearly to avoid Brand confusion post-launch.
- Brands cannot query or influence a Soul's Conviction score — it is derived entirely from Soul-owned data.
