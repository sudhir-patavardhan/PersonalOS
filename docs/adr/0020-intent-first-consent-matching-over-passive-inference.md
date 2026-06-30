# ADR-20 — Intent-first Consent matching; Exchange augments with Scoring-triggered discovery
**Status:** Accepted · **Source:** ADR log + site Exchange Flows 3 and 4

**Context.** ADR-20 (original) accepted intent-first matching as the exclusive model — the Soul declares intent, Brands bid. The site's Exchange runs two complementary triggers: Listing-triggered (new Brand Listing scans matching Souls) and Scoring-triggered (new Insight score triggers scan of active Listings). These are passive matching patterns in tension with ADR-20's intent-first principle.

**Decision.** The architecture blends both, with intent-first as the primary UX and Exchange triggers as the discovery layer:

- **Consent = declared intent.** A Soul grants a Consent for a Category (e.g., `automotive.new_vehicle_purchase`) with a Yield floor. This is the explicit intent declaration. The Exchange acts on it. No Consent = no Offers, regardless of how high a Soul's Insight score is for a Category.
- **Exchange triggers discover, Consents gate.** Listing-triggered and Scoring-triggered Exchange runs (site Flows 3 and 4) are the mechanism by which the platform discovers that a Soul's declared Consent is now matchable with an available Listing. They are discovery events, not targeting events — they cannot surface an Offer without a prior Consent.
- **Consent UX is explicit.** Granting a Consent is a deliberate Soul action in the app, not an inferred background process. The Consent screen shows: Category name, Yield floor the Soul sets, notification preferences, and example types of Brands that may appear. The Soul chooses; the Exchange discovers matches for what they have chosen.

**Consequences.** The Exchange's bi-directional trigger model (site) is preserved as the matching engine. ADR-20's intent-first principle is preserved as the gating UX layer. Together they produce a system where: Souls only receive Offers for Categories they have actively consented to, at Yield floors they have set, from Brands whose Listings meet those floors. This is materially different from a conventional ad exchange.

---
