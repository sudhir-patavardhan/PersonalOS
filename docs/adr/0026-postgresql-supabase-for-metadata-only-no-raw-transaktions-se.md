# ADR-26 — PostgreSQL / Supabase for metadata only; no raw Transaktions server-side
**Status:** Accepted · Supersedes: ADR-26 (Supabase as vault store) · **Source:** site data model

**Decision.** PersonalOS Backend uses PostgreSQL (Supabase) for all non-Transaktion data: `souls`, `konnections`, `categories`, `consents`, `insights`, `offers`, `claims`, `listings`, `brands`, `withdrawals`. The `transaktions` entity does not exist in PostgreSQL — it exists only as encrypted shards on Arweave. The server holds only the `arweave_ledger_hash` pointer on the `souls` row.

**Consequences.** The server database contains no sensitive personal data beyond email, passkey public key, and wallet address. A full server-side data breach exposes only metadata — no transaction history, no merchant names, no amounts, no behavioral profiles.

---
