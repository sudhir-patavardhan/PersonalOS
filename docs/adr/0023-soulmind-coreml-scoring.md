# ADR-23: SoulMind CoreML Scoring models run on-device; no raw data to server

**Status:** Accepted · Supersedes: `consumer_dna.skill` · **Source:** site Flow 2

**Decision.** SoulMind's Scoring pipeline runs inside an iOS background task after each Harvest:
1. Fetch all Ledger shards for the Soul from Arweave via Irys.
2. Derive AES key from passkey; decrypt shards in memory (ephemeral — never persisted decrypted).
3. Run CoreML Scoring models on the decrypted Transaktion array.
4. Produce Insight scores: `[{category, score, confidence, computed_at}]`.
5. Apply differential-privacy noise (ADR-14).
6. Wipe decrypted data from memory.
7. `POST /souls/{soul_id}/insights` with noisy scores only.

The SoulProfile Depth Score (ADR-18, ADR-19) is also computed in step 4 and transmitted alongside Insights.

**Consequences.** Model latency must be acceptable for background execution on older devices. Models should target ≤5 seconds end-to-end on A12 Bionic for a 12-month Transaktion batch of ~500 records. Create ML enables iterative model improvement without re-writing the pipeline.

---

> **See also:** ADR-07 § Implementation Detail for Scoring trigger thresholds and algorithm versioning.
