# ADR-36: Arweave account model: shared (default) vs Soul-owned (opt-in)

**Status:** Accepted · **Source:** site data model (arweave_account_model field)

**Decision.** Two Arweave write models are supported, selectable by the Soul:

- **Shared (default):** PersonalOS writes encrypted Ledger shards via a shared Irys account. ~$100/year at 100k Souls. PersonalOS holds the Arweave write key but cannot decrypt the content (Soul holds the AES key via passkey). Simplest onboarding path.
- **Soul-owned (opt-in):** PersonalOS writes to the Soul's own Arweave wallet address, stored in `arweave_wallet_address` on the `souls` row. Higher per-transaction cost. The Soul's Ledger is fully platform-independent — accessible without PersonalOS, transferable to future systems. Maximum portability.

The `arweave_account_model` enum on the `souls` table records which model is active.

**Consequences.** Shared model is the default; Soul-owned model is an advanced opt-in for Souls who want maximum data sovereignty. The distinction should be explained clearly in the privacy settings screen, not buried in documentation.

---

> **See also:** ADR-11 § Implementation Detail for Irys fallback strategy, Soul-owned wallet funding, and cost comparison.
