# ADR-0006: Conviction Scoring via Plaid Harvest Detection

## Status
Accepted

## Context
After a Soul Claims an Offer, there is no guaranteed connection between that Claim and an actual purchase. Brands care about real buyers, not just attention. The platform needed a mechanism to surface Souls who act on Claims — without requiring Brand-reported attribution, without unique per-Soul coupon tracking, and without breaking the anonymity model.

## Decision
Conviction is scored per-Signal-Type using Plaid Harvest data. After a Claim in a given Signal Type, Cultivation monitors subsequent Harvests for matching purchase Transaktions in that category. If a matching purchase is detected within a reasonable window, the Soul's Conviction for that Signal Type increases. There is no direct attribution between a specific Claim and a specific purchase — the category-level purchase signal is sufficient.

Vouchers (discount codes, promo offers) may be included in Listing content as a Soul-facing benefit. They are non-unique per Soul and are not used as tracking or attribution mechanisms. Voucher redemption is not reported to PersonalOS.

## Alternatives Considered
- **Brand-reported redemption via API** — requires every Brand to build an integration. Raises onboarding bar significantly. Not viable for early-stage platform with unproven volume.
- **Unique per-Claim coupon codes** — enables precise redemption tracking but creates a de-anonymization risk: the Brand's checkout system can join the coupon code to their customer record, bridging from anonymous to identifiable. Contradicts the privacy model.
- **Soul self-reporting** — "Did you make a purchase?" prompt in-app. Gameable — Souls have Yield incentive to misreport. Unreliable as a signal.
- **Strict last-touch attribution** — holding a Claim responsible only if the purchase occurs within a tight window (e.g. 24 hours). Too brittle; most considered purchases take days to weeks.

## Consequences
- Conviction is a directional signal, not a precise attribution. A Soul who buys a car is a real automotive buyer regardless of which specific Listing triggered the purchase.
- Conviction computation runs on-device during Cultivation — consistent with the privacy model (ADR-0003). Only the resulting Conviction scores reach the server.
- Plaid coverage is not universal: cash purchases, business accounts, and non-linked banks are invisible. Conviction will undercount for some Souls. This is acceptable — it means Conviction is conservative, not inflated.
- The conversion window (how long after a Claim to watch for a matching purchase) is an implementation parameter to tune; it does not affect the domain model.
- Brands cannot query or influence a Soul's Conviction score — it is derived entirely from Soul-owned data.
