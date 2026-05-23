# ADR-0004: Arweave via Irys for Ledger Storage

## Status
Accepted

## Context
The Ledger must be stored somewhere durable. Options ranged from PersonalOS servers (centralised) to various decentralised storage networks. Since Transaktions are E2E encrypted (ADR-0003), PersonalOS cannot read the ciphertext regardless of where it is stored — but the choice affects durability, sovereignty, and cost.

## Decision
Encrypted Transaktion batches are written permanently to Arweave via the Irys bundling service after each Harvest. PersonalOS holds no copy. The Arweave content hash is the canonical reference to a Soul's Ledger state.

## Alternatives Considered
- **PersonalOS servers (S3-equivalent)** — cheapest (~$5–10k/year at 100k Souls), but PersonalOS controls the storage. A subpoena, breach, or company failure could destroy Soul data. Inconsistent with sovereignty narrative.
- **Arweave + Lit Protocol** — adds threshold key recovery (Soul can recover Ledger even if passkey is lost). Cost is ~$50k/year at 100k Souls vs. ~$100/year for Arweave alone. Deferred: iCloud Keychain backup covers the key recovery problem for the iOS-first launch.
- **Ceramic Network** — strong DID-based identity model, but higher operational complexity and less proven at scale.
- **IPFS** — not permanent by default; requires pinning services that reintroduce centralisation.

## Consequences
- Arweave storage costs are negligible (~$100/year at 100k Souls via Irys).
- Data is permanent and cannot be deleted — consistent with Ledger semantics ("nothing deleted, only superseded").
- If a Soul loses their passkey and iCloud Keychain backup, their Ledger is permanently unreadable. Acceptable for iOS-first launch; revisit with Lit Protocol if key loss becomes a material support issue.
- Irys batches multiple writes into single Arweave transactions, keeping per-Soul write costs near zero.
