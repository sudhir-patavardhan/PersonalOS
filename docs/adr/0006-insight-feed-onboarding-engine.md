# ADR-06: Insight feed as the onboarding engine

**Status:** Accepted · Supersedes: linear 5-step wizard · **Source:** ADR log (discussion-001)

**Decision.** The linear "connect all your sources" setup wizard is retired. The onboarding experience is: connect one Konnection, receive one Insight, feel the value. Every subsequent Insight in the feed that references a missing data source includes a contextual prompt to add it. Onboarding has no end state — the Insight feed is the engine.

**Consequences.** The first Insight must fire within 90 seconds of first Konnection. SoulMind must produce at least one compelling Insight from financial data alone (the "$X moment"). Requires the Insight feed to handle progressive profile enrichment gracefully.

---

## Section 2 — Privacy & Data Handling
