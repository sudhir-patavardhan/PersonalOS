# ADR-37 — Re-identification mitigation: k-anonymity floor + Insight noise
**Status:** Accepted · Supersedes: ADR-14 (Open) · **Source:** delta analysis + ADR-14

**Decision.** Two complementary mitigations address re-identification risk under permanent Arweave storage:

1. **On-device noise (ADR-14):** SoulMind applies calibrated Gaussian noise (ε ≤ 2.0 differential privacy) to Insight scores before transmission to PersonalOS Backend. The Soul sees their true unnoised Insights on-device; the server receives noisy scores.

2. **k-anonymity floor on server queries:** No PersonalOS Backend query against the `insights` or `souls` tables may return a result set that implies fewer than k=50 distinct Souls. The Exchange query for matching Souls against a Listing must return at minimum 50 results before an Offer is issued to any individual (or suppress Offers if the Category has fewer than 50 eligible Souls platform-wide). This prevents a Brand from using a highly specific Category to narrowly identify individuals.

Together: even if the Arweave encrypted Ledger is someday decrypted (which requires breaking AES-256-GCM), the re-identification risk from noisy scores transmitted to the server is bounded. And a Brand running queries through the Exchange cannot isolate individuals below the k=50 floor.

**Consequences.** The k=50 floor reduces marketplace efficiency for niche Categories in early growth phases — a Category with 49 eligible Souls generates no Offers until the 50th Soul joins. This is an acceptable cold-start constraint that improves naturally as the Soul base grows.

---

## Superseded decisions — complete map

| Earlier decision | Status | Superseded by |
|---|---|---|
| Live-API harvesting across platforms | Superseded | ADR-01 (multi-source Harvest) |
| Linear 5-step setup wizard | Superseded | ADR-06 (Insight feed onboarding) |
| Inference-based offer matching | Superseded | ADR-20 (intent-first Consent) |
| Local Ollama LLM | Superseded | ADR-22 (SoulMind on-device models) |
| Claude Agent SDK / MCP / SKILL.md as intelligence | Superseded | ADR-22 through ADR-25 (SoulMind) |
| Zero-retention cloud API tier | Superseded | ADR-28 (on-device replaces cloud API) |
| Supabase as vault/Ledger store | Superseded | ADR-11 (Arweave / Irys) |
| Local .wallet file vault | Superseded | ADR-10 + ADR-11 (Arweave Ledger) |
| Fiat cashback / coupon settlement | Superseded | ADR-33 + ADR-34 (USDC Yield + Voucher) |
| Immediate raw-file deletion | Superseded | ADR-29 (key-destruction as deletion) |
| `consumer_dna.skill` | Superseded | ADR-23 (SoulMind CoreML Scoring) |
| `offer_match.skill` | Superseded | ADR-25 (on-device Offer relevance) |
| ADR-14 (Open) | Accepted | ADR-14 + ADR-37 (DP noise + k-anonymity) |
| ADR-15 (Open) | Accepted | ADR-15 (health data excluded from marketplace) |
| ADR-19 (Open) | Accepted | ADR-19 (weighted two-axis Depth Score) |

---

## Open decisions (unresolved)

| # | Question | Owner |
|---|---|---|
| ADR-31 | Passkey recovery path if iCloud Keychain is lost | Engineering + Product |
| ADR-33 | FinCEN / money-transmitter / MiCA regulatory classification for USDC settlement | Legal |
| ADR-29 | DPDP Act 2023 and CCPA confirmation that key-destruction satisfies right to erasure | Legal |
| ADR-35 | Contract upgrade governance: multisig structure, timelock period | Engineering + Legal |
| ADR-30 | Merchant dictionary coverage for India-specific merchants (Setu AA source) | Data / Engineering |
| ADR-15 | Health data in marketplace policy — when and under what conditions is this revisited? | Product + Legal |

---

*This document supersedes `PersonalOS_ADR_Log.md` (28 ADRs, May 2026) and the implicit architectural decisions in `sudhir-patavardhan.github.io/PersonalOS/site/`. Consolidated June 2026 from the delta analysis session, Sharad Rao and Claude.*
