# ADR-25 — Listing matching: Consent + Yield floor + SoulMind score; semantic v2 on-device
**Status:** Accepted · Supersedes: `offer_match.skill` · **Source:** ADR log + site Exchange model

**Decision.** Offer matching is a two-layer process:
- **Server-side Exchange (gate):** matches Consents to Listings by Category, Yield floor, and score threshold. The Exchange operates on noisy Insight scores from the server database. This is the privacy-preserving, approximate matching layer.
- **On-device ranking (optional v2):** SoulMind can compute a richer relevance score for a received Offer using full unnoised Insight data — the score visible only to the Soul. In Phase 2, this on-device score is displayed to the Soul ("This Offer matches you at 96%") but is not transmitted to the Brand or Exchange.

Semantic v2: SoulMind uses embedding similarity (CoreML NaturalLanguage framework) to compare the Soul's inferred intent signals against Listing creative content. This enables relevance ranking beyond Category matching — a Listing for Patagonia is ranked above a Listing for fast fashion even if both are in `apparel.outdoor` — without transmitting fine-grained data to the server.

**Consequences.** The Exchange operates on noisy scores (privacy-preserving but approximate). The Soul's on-device ranking provides a richer, accurate relevance signal for their own display. This architecture gives the Soul more signal than the Exchange has — consistent with the "Soul is more informed than the Brand" product promise.

---
