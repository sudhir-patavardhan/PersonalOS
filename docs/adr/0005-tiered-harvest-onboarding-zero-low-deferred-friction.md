# ADR-05 — Tiered Harvest onboarding: zero / low / deferred friction
**Status:** Accepted · **Source:** ADR log + site (Soul Onboarding Flow 1)

**Decision.** Three friction tiers govern which sources are presented at which onboarding moment:
- **Tier 1 — zero friction:** Plaid Konnection + WebAuthn passkey + Smart Wallet provisioning (ADR-31, ADR-32). Completed in <3 minutes. Unlocks first financial Insights. This is the entire first session.
- **Tier 2 — low friction:** Apple Health (FHIR export), Google Data Portability API. Presented after first Insight is delivered. Async Harvest jobs with reminder notifications. Never block the primary flow.
- **Tier 3 — deferred:** Amazon BYOD CSV, Instagram, Uber, MyChart. Surfaced as "deepen your SoulProfile" prompts inside the Insight feed, triggered after a relevant Insight fires (e.g., the Amazon late-night spend insight prompts Amazon Konnection).

**Consequences.** First-session value is guaranteed from Plaid alone. SoulMind must handle sparse profiles gracefully at Tier 1 — only financial Insights available initially, with health and entertainment Insights unlocking progressively. Profile Depth Score (ADR-18, ADR-19) rises with each Tier addition.

---
