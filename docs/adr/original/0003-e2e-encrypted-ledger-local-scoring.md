# ADR-0003: E2E Encrypted Ledger with Local Scoring

## Status
Accepted (amended: open algorithm, Scoring threshold, algorithm versioning)

## Context
The Ledger holds a Soul's raw Transaktions. The question was who can read them and where Scoring (Insight computation) runs.

## Decision
Transaktions are end-to-end encrypted with the Soul's passkey before leaving the device. PersonalOS never holds the decryption key. Scoring runs entirely on the Soul's iOS device against locally decrypted data. Only the resulting Insight scores are sent to PersonalOS servers.

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

## Alternatives Considered
- **Platform-readable Ledger, server-side Scoring** — simplest to build, but contradicts the platform's core promise. If PersonalOS can read all Transaktions, it is functionally indistinguishable from the data brokers it claims to replace.
- **Encrypted at rest, platform-decryptable** — protects against external breaches but not against platform misuse or legal compulsion. Does not support the sovereignty narrative.
- **Closed Scoring algorithm** — rejected. The algorithm is not the moat; hiding it would undermine the transparency and trust narrative.
- **Soul-configurable Scoring threshold** — rejected. Battery and performance tuning is an implementation concern, not a sovereignty decision.

## Consequences
- PersonalOS cannot compute Insights centrally — Scoring logic must ship in the iOS app.
- Insight computation quality is bounded by what can run efficiently on a mobile device.
- Server-side ML models for Insight generation are not possible without a privacy-preserving compute layer (e.g. federated learning) — a future consideration.
- This is a genuine, auditable privacy guarantee: PersonalOS legally and technically cannot access raw Transaktions.
- Publishing the algorithm openly invites scrutiny — any bias or flaw in scoring logic is publicly visible. This is intentional.
- Algorithm versioning adds implementation complexity: the app must track algorithm version per Insight and manage background re-scoring without disrupting the Exchange.
- Souls with very large Ledgers (years of transactions across many Konnections) may experience slow background re-scoring after major algorithm updates.
