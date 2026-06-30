# ADR-12 — Privacy-preserving Exchange: Consents + Yield floor gate
**Status:** Accepted · **Source:** ADR log + site

**Decision.** The Exchange never exposes raw Transaktions or unaggregated Insight scores to Brands. A Brand's Listing targets a Category and sets a bid per Claim. The Exchange matches Souls to Listings only when all of the following are true:
- Soul has an active Consent for the Listing's Category (`revoked_at IS NULL`)
- Soul's Insight score for the Category meets `listing.min_score_threshold`
- Soul's Consent `yield_floor_usdc` ≤ `listing.bid_per_claim_usdc`

Brands receive only: offer count, claim count, budget remaining. No individual Soul data is ever transmitted to a Brand.

**Consequences.** Consent is the operative privacy control for the marketplace. The Soul's Yield floor is a hard pre-ranking gate — it is their minimum price for attention. Brands cannot reach a Soul who has not explicitly consented to their Category at the bid level offered.

---
