# ADR-21: Multi-brand competitive bidding for declared Consent

**Status:** Accepted · **Source:** ADR log

**Decision.** Multiple Brands may hold active Listings for the same Category. The Exchange ranks them by `bid × Reputation × recency_weight` and delivers the highest-ranked Offer to the Soul per Category per day (subject to Consent notification limits). The Soul sees the Brand, the Yield amount, and the Category. They Claim or dismiss. If dismissed, the second-ranked Brand may be surfaced the next day.

A Soul never sees competing Brand names simultaneously for the same intent (to avoid a sponsored-results inbox aesthetic). The competitive dynamic is visible in the Yield amount — higher bids appear as higher Yield to the Soul.

**Consequences.** Brands compete on price (bid) and track record (Reputation). Reputation score decays if a Soul Claim does not result in a detected purchase (via next Harvest). This creates accountability: a Brand whose Offers are Claimed but not converted accumulates Reputation decay and must bid higher to maintain Exchange position.

---

## Section 4 — Intelligence Architecture (SoulMind)

## Implementation Detail

*Merged from the original Reputation Scoring ADR (pre-unified numbering). Contains per-Category conversion windows, Reputation decay model, and Voucher webhook mechanics.*

### Conversion Windows
Conversion windows are defined per Category by PersonalOS and published as part of the open Scoring algorithm (ADR-0003). They are not Soul-configurable. Example windows:
- `financial.discretionary_spend` — 30 days
- `automotive.new_vehicle_purchase` — 90 days
- `travel.flight_intent` — 14 days

Souls can see the conversion window for each Category in their Consent settings.

### Reputation Decay
Reputation decays over time to reflect current behaviour rather than historical peaks:
- Halves every 6 months of inactivity in a Category (no matching purchase detected)
- Never decays to zero — prior track record retains permanent signal value
- A new matching purchase Transaktion resets the decay clock
- Decay is computed on-device during Scoring, consistent with the privacy model (ADR-0003)

### Vouchers
Vouchers (discount codes, promo offers) may be included in Listing content as a Soul-facing benefit. Voucher integrity is the Brand's responsibility. PersonalOS never generates, stores, or tracks Voucher codes.

For Brands who want protected single-use codes, PersonalOS supports an optional `voucher_delivery_webhook` field on Listings. On each Claim, PersonalOS calls the webhook and the Brand's system returns a fresh code. The code generation and validity logic stays entirely on the Brand side. This is documented explicitly in Brand onboarding.

Non-webhook Vouchers remain non-unique per Soul — Brands accept this limitation when not using the webhook integration.

### Vouchers
Vouchers (discount codes, promo offers) may be included in Listing content as a Soul-facing benefit. Voucher integrity is the Brand's responsibility. PersonalOS never generates, stores, or tracks Voucher codes.

For Brands who want protected single-use codes, PersonalOS supports an optional `voucher_delivery_webhook` field on Listings. On each Claim, PersonalOS calls the webhook and the Brand's system returns a fresh code. The code generation and validity logic stays entirely on the Brand side. This is documented explicitly in Brand onboarding.

Non-webhook Vouchers remain non-unique per Soul — Brands accept this limitation when not using the webhook integration.

### Alternatives Considered (original ADR)
- **Brand-reported redemption via API** — requires every Brand to build an integration. Raises onboarding bar significantly. Not viable for early-stage platform with unproven volume.
- **Unique per-Claim coupon codes** — enables precise redemption tracking but creates a de-anonymization risk: the Brand's checkout system can join the coupon code to their customer record, bridging from anonymous to identifiable. Contradicts the privacy model.
- **Soul self-reporting** — "Did you make a purchase?" prompt in-app. Gameable — Souls have Yield incentive to misreport. Unreliable as a signal.
- **Strict last-touch attribution** — holding a Claim responsible only if the purchase occurs within a tight window (e.g. 24 hours). Too brittle; most considered purchases take days to weeks.
- **Fixed conversion window across all Categories** — rejected. Purchase consideration time varies too widely by category to use a single window without systematically over- or under-counting Reputation in high and low-velocity categories.
- **Soul-configurable Reputation decay** — rejected. Reputation is a signal for Brands, not a setting for Souls. Allowing Souls to slow decay would create an incentive to inflate their own scores.

### Consequences (original ADR)
- Reputation is a directional signal, not a precise attribution. A Soul who buys a car is a real automotive buyer regardless of which specific Listing triggered the purchase.
- Reputation computation runs on-device during Scoring — consistent with the privacy model (ADR-0003). Only the resulting Reputation scores reach the server.
- Plaid coverage is not universal: cash purchases, business accounts, and non-linked banks are invisible. Reputation will undercount for some Souls. This is acceptable — it means Reputation is conservative, not inflated.
- Per-Signal-Type conversion windows require PersonalOS to maintain a versioned window table as part of the published Scoring algorithm.
- Time-based decay means Reputation scores are dynamic — the Exchange's composite ranking score (`bid × Reputation × recency_weight`) will shift over time even without new Harvests.
- The `voucher_delivery_webhook` is optional infrastructure — Brands who don't use it accept non-unique codes. PersonalOS must document this tradeoff clearly to avoid Brand confusion post-launch.
- Brands cannot query or influence a Soul's Reputation score — it is derived entirely from Soul-owned data.
