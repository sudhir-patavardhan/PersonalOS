# ADR-23: SoulMind CoreML Scoring models run on-device; no raw data to server

**Status:** Accepted · Supersedes: `consumer_dna.skill` · **Source:** site Flow 2

**Decision.** SoulMind's Scoring pipeline runs inside an iOS background task after each Harvest:
1. Fetch recent Ledger shards from Arweave via Irys (rolling window — see below).
2. Derive AES key from passkey; decrypt shards in memory (ephemeral — never persisted decrypted).
3. Load historical summary from the on-device summary cache (see below).
4. Run CoreML Scoring models on the decrypted Transaktion array + historical summary.
5. Produce Insight scores: `[{category, score, confidence, computed_at}]`.
6. Apply differential-privacy noise (ADR-14).
7. Update the on-device historical summary with the current window's aggregates, then wipe decrypted Transaktions from memory.
8. `POST /souls/{soul_id}/insights` with noisy scores only.

The SoulProfile Depth Score (ADR-18, ADR-19) is also computed in step 5 and transmitted alongside Insights.

### Rolling Window Scoring Model

Decrypting the full Ledger for every Scoring run does not scale. After 3 years of 4 Harvests/day, a Soul could accumulate ~4,000 Ledger shards (200–400MB decrypted). An A12 Bionic with 3GB RAM cannot hold this alongside the app and CoreML models. Scoring therefore operates on a **rolling window + historical summary** architecture:

**Rolling window (active data).** Each Scoring run fetches and decrypts only the most recent 12 months of Ledger shards. The iOS app maintains a local index of shard metadata (ADR-11 § shard ordering metadata: `{shard_index, batch_timestamp, checksum}`) that maps timestamps to Arweave `tx_id`s, enabling selective fetching without downloading the full Ledger. At ~500 Transaktions/month, 12 months = ~6,000 records ≈ 30–60MB decrypted — well within A12 memory budget.

**Historical summary (compacted data).** Data older than 12 months is represented by an encrypted on-device summary cache rather than raw Transaktions. The summary contains per-Category aggregates computed during the Scoring run that retired each month from the active window:

```
HistoricalSummary {
  month: string               // "2025-06"
  category_aggregates: [{
    soul_category: string      // "dining.grocery"
    transaction_count: int
    total_amount_usd: decimal
    avg_amount_usd: decimal
    intent_signal_counts: {string: int}  // {"health_conscious_spend": 7}
    source_breakdown: {string: int}      // {"plaid": 42, "amazon": 3}
  }]
  depth_contributions: {string: float}   // {"plaid": 0.30, "apple_health": 0.20}
}
```

The summary cache is encrypted with the same AES-256-GCM key (ADR-08) and stored on-device only — it is not written to Arweave (it is derived data, not canonical records). If the summary cache is lost (device reset, new device), it is rebuilt by a one-time full-Ledger Scoring pass scheduled during charging + wifi.

**Scoring with both layers.** CoreML models accept two inputs: (1) the raw 12-month rolling window for precise, transaction-level pattern detection (intent signals, recency, trend direction), and (2) the historical summary for long-horizon signals (multi-year spending trajectory, seasonal patterns, lifetime Category depth). The rolling window drives the Insight score; the historical summary modulates confidence and detects year-over-year trends.

**Window rotation.** When a month exits the 12-month window, the Scoring run:
1. Computes category aggregates for the retiring month from the still-decrypted Transaktions.
2. Appends the aggregates to the historical summary cache.
3. Removes the retired month's shard `tx_id`s from the active fetch list.
4. The Arweave shards themselves are never deleted — they remain permanently on-chain. Only the fetch index is updated.

**Memory budget.** Target peak memory during Scoring:
- Rolling window (12mo, ~6,000 records): ~50MB
- Historical summary (all prior months): ~1MB
- CoreML model loaded: ~20MB
- Working memory: ~30MB
- **Total: ~100MB** — safe on A12 (3GB device, ~1.5GB available to apps)

**Consequences.** Model latency must be acceptable for background execution on older devices. Models should target ≤5 seconds end-to-end on A12 Bionic for the rolling window (~6,000 records). Create ML enables iterative model improvement without re-writing the pipeline. The historical summary introduces a lossy compression boundary — Insights that require transaction-level detail older than 12 months (e.g., "you bought this exact item 2 years ago") are not supported. This is an acceptable trade-off: marketplace-relevant Insights are almost always driven by recent behaviour, not multi-year transaction-level history.

---

> **See also:** ADR-07 § Implementation Detail for Scoring trigger thresholds and algorithm versioning.
