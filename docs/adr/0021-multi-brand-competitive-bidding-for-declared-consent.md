# ADR-21 — Multi-brand competitive bidding for declared Consent
**Status:** Accepted · **Source:** ADR log

**Decision.** Multiple Brands may hold active Listings for the same Category. The Exchange ranks them by `bid × Reputation × recency_weight` and delivers the highest-ranked Offer to the Soul per Category per day (subject to Consent notification limits). The Soul sees the Brand, the Yield amount, and the Category. They Claim or dismiss. If dismissed, the second-ranked Brand may be surfaced the next day.

A Soul never sees competing Brand names simultaneously for the same intent (to avoid a sponsored-results inbox aesthetic). The competitive dynamic is visible in the Yield amount — higher bids appear as higher Yield to the Soul.

**Consequences.** Brands compete on price (bid) and track record (Reputation). Reputation score decays if a Soul Claim does not result in a detected purchase (via next Harvest). This creates accountability: a Brand whose Offers are Claimed but not converted accumulates Reputation decay and must bid higher to maintain Exchange position.

---

## Section 4 — Intelligence Architecture (SoulMind)
