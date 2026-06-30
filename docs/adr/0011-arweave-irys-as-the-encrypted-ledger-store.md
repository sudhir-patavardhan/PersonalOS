# ADR-11 — Arweave / Irys as the encrypted Ledger store
**Status:** Accepted · Supersedes: ADR-26 (Supabase as vault store) · **Source:** site architecture

**Decision.** Arweave via Irys is the canonical store for all encrypted Transaktion data. The `TRANSAKTION` entity does not exist in PostgreSQL — the PersonalOS database holds only the Arweave content hash pointer on the `souls` row. This is the most consequential storage decision in the architecture: it makes the Ledger permanent, permaweb-native, and platform-independent.

Irys provides optimistic finality guarantees before Arweave network propagation is confirmed. The Irys receipt is the functional confirmation for the iOS app; Arweave `tx_id` is the permanent reference.

**Consequences.** Arweave storage has a one-time permanent cost (currently ~$0.003/MB via Irys at scale). This must be modelled per Soul per Harvest in the Bill of Materials. Arweave writes are irreversible — SoulMind (ADR-30) must produce the final enriched, privacy-normalised form before upload, because post-write correction is impossible. Data compaction strategy (how many Transaktions per shard, compression format) must be specified in the SoulMind design.

---
