# ADR-08: AES-256-GCM encryption for all on-device state

**Status:** Accepted · **Source:** ADR log

**Decision.** All data in the Soul's on-device buffer — raw Transaktions awaiting SoulMind enrichment, enriched Transaktions awaiting Arweave upload, decrypted Ledger shards fetched from Arweave for Scoring — is encrypted at rest with AES-256-GCM. The encryption key is derived from the Soul's WebAuthn passkey stored in iCloud Keychain Secure Enclave (ADR-31). No on-device Transaktion data is ever written to disk in plaintext.

**Encryption validation.** The encryption layer enforces integrity checks to prevent corrupted data from reaching Arweave:
- **GCM authentication tag:** AES-256-GCM produces a 128-bit authentication tag per encrypted batch. The tag is stored alongside the ciphertext. Any tampering with the encrypted data is detected on decryption — GCM decryption fails rather than returning corrupted plaintext.
- **Pre-write checksum:** A SHA-256 checksum of the plaintext `SoulTransaktion[]` array is computed before encryption and stored in the encrypted batch header. On decryption (during Scoring), the checksum is recomputed and compared — a mismatch indicates encryption/decryption key derivation error or data corruption.
- **Empty batch rejection:** An encrypted batch with zero valid `SoulTransaktion` records (all quarantined by SCE validation) is not written to Arweave. The Harvest is logged as "no valid records" but not treated as a failure.
- **Key derivation verification:** Before encrypting a Harvest batch, the derived AES key is tested by decrypting a known sentinel value stored at passkey creation time. A failed sentinel check aborts the Harvest and alerts the Soul — it indicates passkey corruption or Secure Enclave state loss.

**Consequences.** Any compromise of the iOS device without the passkey reveals only ciphertext. Key derivation from the Secure Enclave means the key cannot be extracted from the device even by PersonalOS.

---

> **See also:** ADR-07 § Implementation Detail for open algorithm policy, Scoring trigger thresholds, and algorithm versioning.
