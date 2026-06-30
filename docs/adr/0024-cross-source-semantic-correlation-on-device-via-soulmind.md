# ADR-24 — Cross-source semantic correlation on-device via SoulMind
**Status:** Accepted · Supersedes: ADR-24 (LLM cross-source correlation) · **Source:** site + ADR log insight

**Decision.** Cross-source correlations ("best glucose months = highest Whole Foods spend months," "travel months = highest steps") are computed on-device by SoulMind using temporal join logic against the enriched Transaktion array. No complex SQL joins required — the in-memory decrypted Ledger is the dataset; SoulMind iterates over it with pattern-matching rules.

Correlation rules are encoded as Swift logic in SoulMind, versioned alongside the Scoring models. New correlation rules ship in app updates.

**Consequences.** The insight "Your food spend and your health outcomes are directly correlated" emerges from the raw data on-device, not from a cloud model. This is both architecturally cleaner and privacy-preserving: PersonalOS never knows which correlations SoulMind discovered — only the resulting noisy Insight scores.

---
