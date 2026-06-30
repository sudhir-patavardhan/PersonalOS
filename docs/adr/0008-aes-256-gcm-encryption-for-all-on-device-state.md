# ADR-08 — AES-256-GCM encryption for all on-device state
**Status:** Accepted · **Source:** ADR log

**Decision.** All data in the Soul's on-device buffer — raw Transaktions awaiting SoulMind enrichment, enriched Transaktions awaiting Arweave upload, decrypted Ledger shards fetched from Arweave for Scoring — is encrypted at rest with AES-256-GCM. The encryption key is derived from the Soul's WebAuthn passkey stored in iCloud Keychain Secure Enclave (ADR-31). No on-device Transaktion data is ever written to disk in plaintext.

**Consequences.** Any compromise of the iOS device without the passkey reveals only ciphertext. Key derivation from the Secure Enclave means the key cannot be extracted from the device even by PersonalOS.

---
