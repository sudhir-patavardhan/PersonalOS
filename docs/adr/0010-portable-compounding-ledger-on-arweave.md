# ADR-10 — Portable, compounding Ledger on Arweave
**Status:** Accepted · Supersedes: ADR-10 (local .wallet file) · **Source:** site data model + ADR-10

**Decision.** The Soul's Ledger is no longer a local `.wallet` file on their device. It is a permanent, content-addressed, Soul-owned collection of encrypted Transaktion batches on Arweave. The Ledger compounds in value as more Harvests write to it — Year 3 data has 36 months of pattern resolution, dramatically more signal than Year 1.

Two account models govern who holds the Arweave write key:
- **Shared model (default):** PersonalOS writes to the Ledger via a shared Irys account. Batched writes minimise cost (~$100/year at 100k Souls). The Soul holds only the decryption passkey; PersonalOS holds the write key but cannot read the content.
- **Soul-owned model (opt-in):** PersonalOS writes to the Soul's own Arweave wallet. Higher per-transaction cost but full platform-independent ownership — the Soul's Ledger is accessible without PersonalOS.

The Ledger is the retention mechanism. Its growing value (more signal = better Insights = better Offers = more Yield) is the primary reason Souls do not churn. The vault compounding story from the prior ADR-10 is preserved; the implementation layer has changed.

**Consequences.** Cross-device access: any iOS device with the passkey can fetch and decrypt the Ledger from Arweave without PersonalOS involvement. Optional iCloud Keychain sync of the passkey provides seamless multi-device experience. ADR-11 (cloud sync) is superseded by Arweave for the Ledger; ADR-11 remains relevant for non-Ledger metadata (Insights, Consents, Offers).

---
