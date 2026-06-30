# ADR-07 — On-device processing; only Insights and scores leave the device
**Status:** Accepted · Supersedes: ADR-28 (zero-retention cloud API) · **Source:** site (Harvest → Scoring → Insight, Flow 2) + ADR-07

**Context.** The original ADR-07 accepted on-device processing as a principle but partially contradicted it with ADR-28 (zero-retention cloud API for LLM inference). The site architecture is unambiguous: all Scoring and SoulMind semantic computation runs on the iOS device. No raw Transaktion data — not even encrypted — is transmitted to PersonalOS Backend at any point. The only outbound data from the device to the server is: Arweave content hashes (pointers), aggregated Insight scores, and Claim actions.

**Decision.** Raw Transaktion data is processed exclusively on the Soul's iOS device. PersonalOS Backend never receives, holds, or processes any Transaktion in plaintext or ciphertext. The server receives only:
- Arweave `tx_id` (a content hash — cryptographically opaque)
- Insight scores (`{category, score, confidence, computed_at}`)
- Reputation scores (post-Claim purchase detected)
- Consent configurations
- Claim actions (Soul-initiated)

All SoulMind semantic enrichment (ADR-30), CoreML Scoring (ADR-22, ADR-23), cross-source correlation (ADR-24), and Insight generation runs on-device before any Arweave write. This supersedes ADR-28's acceptance of a cloud LLM API call for intelligence.

**Consequences.** The privacy claim becomes architectural rather than contractual: PersonalOS structurally cannot read Soul data because it never receives it. This is the strongest possible trust guarantee. Requires SoulMind and CoreML Scoring models to run on iPhone hardware (A14 Bionic or later recommended; A12 Bionic minimum for acceptable Scoring latency). Adds an iOS-native ML engineering dependency that was absent from the prior ADR log.

---
