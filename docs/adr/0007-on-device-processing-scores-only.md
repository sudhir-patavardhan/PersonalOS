# ADR-07: On-device processing; only Insights and scores leave the device

**Status:** Accepted · Supersedes: ADR-28 (zero-retention cloud API) · **Source:** site (Harvest → Scoring → Insight, Flow 2) + ADR-07

**Context.** The original ADR-07 accepted on-device processing as a principle but partially contradicted it with ADR-28 (zero-retention cloud API for LLM inference). The site architecture is unambiguous: all Scoring and SoulMind semantic computation runs on the iOS device. No raw Transaktion data — not even encrypted — is transmitted to PersonalOS Backend at any point. The only outbound data from the device to the server is: Arweave content hashes (pointers), aggregated Insight scores, and Claim actions.

**Decision.** Raw Transaktion data is processed exclusively on the Soul's iOS device. PersonalOS Backend never receives, holds, or processes any Transaktion in plaintext or ciphertext. The server receives only:
- Arweave `tx_id` (a content hash — cryptographically opaque)
- Insight scores (`{category, score, confidence, computed_at}`)
- Reputation scores (post-Claim purchase detected)
- Consent configurations
- Claim actions (Soul-initiated)

All SoulMind semantic enrichment (ADR-30), CoreML Scoring (ADR-22, ADR-23), cross-source correlation (ADR-24), and Insight generation runs on-device before any Arweave write. This supersedes ADR-28's acceptance of a cloud LLM API call for intelligence.

**Server-side ingestion validation.** The `POST /souls/{soul_id}/insights` endpoint validates inbound data to prevent corrupted or malicious scores from entering the Exchange:
- **Schema validation:** Each Insight record must contain `category`, `score`, `confidence`, `computed_at`, and `algorithm_version`. Missing fields reject the entire batch.
- **Score bounds:** `score` must be in [0.0, 100.0], `confidence` must be in [0.0, 1.0]. Out-of-bounds values reject the record.
- **Temporal consistency:** `computed_at` must be within 24 hours of the current server time. Stale or future-dated scores are rejected.
- **Algorithm version check:** `algorithm_version` must match a known deployed version. Scores from unrecognised algorithm versions are held in quarantine until the app version is verified.
- **Soul identity verification:** The request must be signed by the Soul's passkey (ADR-31). The server verifies the WebAuthn assertion before accepting any Insight update.
- **Rate limiting:** No more than 10 Insight updates per Soul per hour. Excessive updates indicate a client bug, not legitimate Scoring.

**Consequences.** The privacy claim becomes architectural rather than contractual: PersonalOS structurally cannot read Soul data because it never receives it. This is the strongest possible trust guarantee. Requires SoulMind and CoreML Scoring models to run on iPhone hardware (A14 Bionic or later recommended; A12 Bionic minimum for acceptable Scoring latency). Adds an iOS-native ML engineering dependency that was absent from the prior ADR log.

---

## Implementation Detail

*Merged from the original E2E Encrypted Ledger ADR (pre-unified numbering). Contains open algorithm policy, Scoring trigger thresholds, and algorithm versioning specifics.*

### Open Scoring Algorithm
The Scoring algorithm (scoring logic and ML model) is published openly. Transparency in how Insights are computed is a trust feature, not a vulnerability. Souls can verify their scores are not manipulated. The competitive moat is the marketplace network effect, not the algorithm.

### Scoring Trigger Threshold
PersonalOS controls the Scoring trigger threshold — it is not Soul-configurable. Scoring fires when either:
- A Harvest adds ≥50 new Transaktions since the last Scoring, **or**
- 7 days have elapsed since the last Scoring

This threshold is tuned for device battery and performance, not sovereignty. Souls should not need to think about it.

### Algorithm Versioning and Updates
Insight scores are versioned alongside the algorithm version that produced them. When a new Scoring algorithm ships:
- Re-scoring runs incrementally in the background, on charging + wifi only
- A progress flag is maintained per Insight record indicating whether it reflects the current algorithm version
- The Exchange continues serving stale-but-valid scores until re-scoring completes for that Soul
- No blocking re-scoring on upgrade day

### Alternatives Considered (original ADR)
- **Platform-readable Ledger, server-side Scoring** — simplest to build, but contradicts the platform's core promise. If PersonalOS can read all Transaktions, it is functionally indistinguishable from the data brokers it claims to replace.
- **Encrypted at rest, platform-decryptable** — protects against external breaches but not against platform misuse or legal compulsion. Does not support the sovereignty narrative.
- **Closed Scoring algorithm** — rejected. The algorithm is not the moat; hiding it would undermine the transparency and trust narrative.
- **Soul-configurable Scoring threshold** — rejected. Battery and performance tuning is an implementation concern, not a sovereignty decision.

### Consequences (original ADR)
- PersonalOS cannot compute Insights centrally — Scoring logic must ship in the iOS app.
- Insight computation quality is bounded by what can run efficiently on a mobile device.
- Server-side ML models for Insight generation are not possible without a privacy-preserving compute layer (e.g. federated learning) — a future consideration.
- This is a genuine, auditable privacy guarantee: PersonalOS legally and technically cannot access raw Transaktions.
- Publishing the algorithm openly invites scrutiny — any bias or flaw in scoring logic is publicly visible. This is intentional.
- Algorithm versioning adds implementation complexity: the app must track algorithm version per Insight and manage background re-scoring without disrupting the Exchange.
- Souls with very large Ledgers (years of transactions across many Konnections) may experience slow background re-scoring after major algorithm updates.
