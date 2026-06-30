# ADR-11: Arweave / Irys as the encrypted Ledger store

**Status:** Accepted · Supersedes: ADR-26 (Supabase as vault store) · **Source:** site architecture

**Decision.** Arweave via Irys is the canonical store for all encrypted Transaktion data. The `TRANSAKTION` entity does not exist in PostgreSQL — the PersonalOS database holds only the Arweave content hash pointer on the `souls` row. This is the most consequential storage decision in the architecture: it makes the Ledger permanent, permaweb-native, and platform-independent.

Irys provides optimistic finality guarantees before Arweave network propagation is confirmed. The Irys receipt is the functional confirmation for the iOS app; Arweave `tx_id` is the permanent reference.

**Consequences.** Arweave storage has a one-time permanent cost (currently ~$0.003/MB via Irys at scale). This must be modelled per Soul per Harvest in the Bill of Materials. Arweave writes are irreversible — SoulMind (ADR-30) must produce the final enriched, privacy-normalised form before upload, because post-write correction is impossible. Data compaction strategy (how many Transaktions per shard, compression format) must be specified in the SoulMind design.

---

## Implementation Detail

*Merged from the original Arweave Ledger Storage ADR (pre-unified numbering). Contains Irys fallback strategy, Soul-owned wallet funding, and cost comparison.*

### Irys Availability and Fallback
Irys is a third-party bundling service. If Irys is unavailable:
- Encrypted Transaktion batches queue locally on the Soul's device
- The queue flushes on next successful Irys connection
- Direct Arweave writes (bypassing Irys) are supported as an emergency fallback, at higher per-transaction cost
- Alternative bundlers (e.g. Turbo) are evaluated if Irys reliability becomes a material issue
- Harvest always completes locally — an Arweave write failure never blocks data ingestion

### Soul-Owned Wallet Funding
For Soul-owned Arweave accounts, AR token funding is managed automatically:
- PersonalOS maintains a platform AR reserve and tops up Soul-owned wallets as needed
- The cost is deducted as a small amount from the Soul's next Yield deposit
- A low-balance alert surfaces in-app for visibility
- The Soul never manages AR funding manually

### Soul-Owned Wallet Funding
For Soul-owned Arweave accounts, AR token funding is managed automatically:
- PersonalOS maintains a platform AR reserve and tops up Soul-owned wallets as needed
- The cost is deducted as a small amount from the Soul's next Yield deposit
- A low-balance alert surfaces in-app for visibility
- The Soul never manages AR funding manually

### Account Model: Cost Comparison
| Model | Arweave tx overhead | Cost at 100k Souls | Operational complexity |
|---|---|---|---|
| Shared (Irys batched) | Amortised across all Souls | ~$100/year | One funded account |
| Soul-owned | One tx per Soul per Harvest | ~$1k–$5k/year | Per-Soul wallet provisioning and auto-funding |

The cost increase in the Soul-owned model comes from losing Irys batching — each Harvest write becomes an independent Arweave transaction with its own base fee. Storage cost (per byte) is identical in both models.

### Alternatives Considered (original ADR)
- **PersonalOS servers (S3-equivalent)** — cheapest (~$5–10k/year at 100k Souls), but PersonalOS controls the storage. A subpoena, breach, or company failure could destroy Soul data. Inconsistent with sovereignty narrative.
- **Arweave + Lit Protocol** — adds threshold key recovery (Soul can recover Ledger even if passkey is lost). Cost is ~$50k/year at 100k Souls vs. ~$100/year for Arweave alone. Deferred: iCloud Keychain backup covers the key recovery problem for the iOS-first launch.
- **Ceramic Network** — strong DID-based identity model, but higher operational complexity and less proven at scale.
- **IPFS** — not permanent by default; requires pinning services that reintroduce centralisation.

### Consequences (original ADR)
- Shared model: Arweave storage costs are negligible (~$100/year at 100k Souls via Irys).
- Soul-owned model: costs rise to ~$1k–$5k/year at 100k Souls due to per-transaction overhead; AR funding cost deducted automatically from Yield.
- Data is permanent and cannot be deleted — consistent with Ledger semantics ("nothing deleted, only superseded").
- If a Soul loses their passkey and iCloud Keychain backup, their Ledger is permanently unreadable regardless of account model. Acceptable for iOS-first launch; revisit with Lit Protocol if key loss becomes a material support issue.
- Soul-owned accounts enable true platform portability: a Soul's Ledger is accessible via their Arweave address from any compatible client, independent of PersonalOS.
- Local queue during Irys outages means the Arweave hash on the Soul record may be temporarily stale — the Exchange must treat a stale hash as valid until the queue flushes, not as an error.
