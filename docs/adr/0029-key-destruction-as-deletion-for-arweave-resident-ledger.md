# ADR-29 — Key-destruction as deletion for the Arweave Ledger
**Status:** Accepted · Supersedes: original ADR-09 · **Source:** ADR-29 (delta analysis, June 2026)

**Decision.** In a permaweb architecture, "deletion" means permanent inaccessibility through passkey destruction, not physical erasure of Arweave content. On Soul account deletion: server-side metadata purged from PostgreSQL; `arweave_ledger_hash` pointer removed; Soul instructed to delete passkey from iCloud Keychain. Encrypted shards remain on Arweave but become permanently inaccessible. Satisfies GDPR Recital 26. Legal confirmation required for India DPDP Act 2023 and CCPA jurisdictions prior to launch.

See the full ADR-29 document (June 2026) for the complete treatment.

---
