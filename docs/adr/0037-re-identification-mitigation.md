# ADR-37: Re-identification mitigation: k-anonymity floor + Insight noise

**Status:** Accepted · Supersedes: ADR-14 (Open) · **Source:** delta analysis + ADR-14

**Decision.** Two complementary mitigations address re-identification risk under permanent Arweave storage:

1. **On-device noise (ADR-14):** SoulMind applies calibrated Gaussian noise (ε ≤ 2.0 differential privacy) to Insight scores before transmission to PersonalOS Backend. The Soul sees their true unnoised Insights on-device; the server receives noisy scores.

2. **k-anonymity floor on server queries:** No PersonalOS Backend query against the `insights` or `souls` tables may return a result set that implies fewer than k=50 distinct Souls. The Exchange query for matching Souls against a Listing must return at minimum 50 results before an Offer is issued to any individual (or suppress Offers if the Category has fewer than 50 eligible Souls platform-wide). This prevents a Brand from using a highly specific Category to narrowly identify individuals.

Together: even if the Arweave encrypted Ledger is someday decrypted (which requires breaking AES-256-GCM), the re-identification risk from noisy scores transmitted to the server is bounded. And a Brand running queries through the Exchange cannot isolate individuals below the k=50 floor.

**Consequences.** The k=50 floor reduces marketplace efficiency for niche Categories in early growth phases — a Category with 49 eligible Souls generates no Offers until the 50th Soul joins. This is an acceptable cold-start constraint that improves naturally as the Soul base grows.
