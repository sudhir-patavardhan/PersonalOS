# ADR-13 — Consent tokens carry derived Insights, never raw Transaktions
**Status:** Accepted · **Source:** ADR log

**Decision.** When a Soul shares their SoulProfile externally (e.g., enables a Brand to see their match scores), a one-time Consent token is issued containing only derived Insight scores ("Premium Travel 98%") and the Archetype label. The token never contains Transaktions, merchant names, amounts, or any data that could be reverse-engineered to individual purchases.

**Consequences.** Granular, revocable, per-share consent. Token lifecycle (issuance, expiry, revocation) must be built in PersonalOS Backend. Tokens are signed and time-limited to prevent replay.

---
