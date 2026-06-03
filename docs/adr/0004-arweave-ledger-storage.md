# ADR-0004: Arweave via Irys for Ledger Storage

## Status
Accepted (amended: Soul-owned Arweave accounts as opt-in)

## Context
The Ledger must be stored somewhere durable. Options ranged from PersonalOS servers (centralised) to various decentralised storage networks. Since Transaktions are E2E encrypted (ADR-0003), PersonalOS cannot read the ciphertext regardless of where it is stored — but the choice affects durability, sovereignty, and cost.

## Decision
Encrypted Transaktion batches are written permanently to Arweave via the Irys bundling service after each Harvest. PersonalOS holds no copy. The Arweave content hash is the canonical reference to a Soul's Ledger state.

Souls may choose between two Arweave account models:

- **Shared (default):** PersonalOS operates a single Irys account and writes all Souls' encrypted batches through it. Irys batches multiple Souls' writes into single Arweave transactions, keeping per-Soul costs near zero (~$100/year at 100k Souls). The Arweave account is a delivery mechanism only — sovereignty is enforced by encryption, not account ownership.
- **Soul-owned (opt-in):** A Soul provisions their own Arweave wallet, funded with AR tokens. PersonalOS writes only to that Soul's wallet. This grants full transferability — a Soul can point any compatible client at their Arweave address and read their Ledger independently of PersonalOS. It also reinforces ownership semantics: the Ledger lives in an account the Soul controls, not one PersonalOS controls.

The shared model is the default for MVP. Soul-owned accounts are offered as an opt-in for Souls who prioritise transferability and platform independence over cost simplicity.

## Account Model: Cost Comparison

| Model | Arweave tx overhead | Cost at 100k Souls | Operational complexity |
|---|---|---|---|
| Shared (Irys batched) | Amortised across all Souls | ~$100/year | One funded account |
| Soul-owned | One tx per Soul per Harvest | ~$1k–$5k/year | Per-Soul wallet provisioning and funding |

The cost increase in the Soul-owned model comes from losing Irys batching — each Harvest write becomes an independent Arweave transaction with its own base fee. Storage cost (per byte) is identical in both models.

## Alternatives Considered
- **PersonalOS servers (S3-equivalent)** — cheapest (~$5–10k/year at 100k Souls), but PersonalOS controls the storage. A subpoena, breach, or company failure could destroy Soul data. Inconsistent with sovereignty narrative.
- **Arweave + Lit Protocol** — adds threshold key recovery (Soul can recover Ledger even if passkey is lost). Cost is ~$50k/year at 100k Souls vs. ~$100/year for Arweave alone. Deferred: iCloud Keychain backup covers the key recovery problem for the iOS-first launch.
- **Ceramic Network** — strong DID-based identity model, but higher operational complexity and less proven at scale.
- **IPFS** — not permanent by default; requires pinning services that reintroduce centralisation.

## Consequences
- Shared model: Arweave storage costs are negligible (~$100/year at 100k Souls via Irys).
- Soul-owned model: costs rise to ~$1k–$5k/year at 100k Souls due to per-transaction overhead; each Soul also bears responsibility for keeping their wallet funded.
- Data is permanent and cannot be deleted — consistent with Ledger semantics ("nothing deleted, only superseded").
- If a Soul loses their passkey and iCloud Keychain backup, their Ledger is permanently unreadable regardless of account model. Acceptable for iOS-first launch; revisit with Lit Protocol if key loss becomes a material support issue.
- Soul-owned accounts enable true platform portability: a Soul's Ledger is accessible via their Arweave address from any compatible client, independent of PersonalOS.
- Irys batches multiple writes into single Arweave transactions in the shared model, keeping per-Soul write costs near zero.
