# ADR-01: Multi-source Harvest: Plaid, Account Aggregator, Google DPA, Apple Health, BYOD exports

**Status:** Accepted · **Source:** ADR log + site architecture

**Context.** PersonalOS aggregates financial, health, entertainment, mobility, and commerce data from a diverse source universe: US banks (Plaid), Indian banks (Setu AA), Google activity (Data Portability API), Apple Health (FHIR export), Amazon (BYOD CSV), ride-share (Uber export), and any future source. Each source has a different API contract, consent model, data format, and semantic vocabulary. No two sources share a common schema. Historically, the ADR log treated each connector independently (ADR-02, 03, 04). The site added Plaid with passkey provisioning. Neither source addressed what happens to the raw heterogeneous data *before* it reaches the Ledger — the semantic gap described in instruction 9.

**Decision.** Harvest is the process of pulling raw data from any source into the Soul's iOS device, normalising it through the SoulMind semantic layer (ADR-30), encrypting the enriched Transaktions, and writing the encrypted batch to the Arweave Ledger. Harvest never writes raw, unprocessed data to the Ledger. The enriched-and-encrypted form is the canonical record. The steps are:

1. Source connector pulls raw data (Plaid transactions, Apple Health XML, Google activity JSON, Uber CSV, etc.) into a sandboxed in-memory buffer on the iOS device.
2. SoulMind (ADR-30) curates and enriches: normalises merchant names, resolves schema heterogeneity, attaches semantic tags, infers categories, and applies differential-privacy noise at the Insight layer.
3. AES-256-GCM encryption is applied to the enriched batch using the key derived from the Soul's passkey.
4. The encrypted batch is written to Arweave via Irys.
5. Only the Arweave content hash and aggregate Insight scores leave the device to PersonalOS Backend.
6. The in-memory plaintext buffer is zeroed. Raw source data is never stored on-device or server-side beyond the duration of step 2.

**Data validation gates.** The Harvest pipeline enforces validation at three boundaries to prevent bad data from reaching the Ledger:
1. **Connector boundary (pre-SCE):** Each source connector validates API response integrity — HTTP status, pagination completeness, schema version match, and auth token validity. Partial or malformed API responses trigger a retry (up to 3 attempts with exponential backoff) before the Harvest is marked failed. A failed Harvest never passes partial data to the SCE.
2. **SCE boundary (pre-encrypt):** The SCE validates every record (see ADR-30 § Input validation). Duplicates are dropped, schema-incomplete records are quarantined, temporal and amount anomalies are flagged. Only validated, enriched `SoulTransaktion` records proceed to encryption.
3. **Ledger boundary (pre-Arweave):** After AES-256-GCM encryption (ADR-08), the encrypted batch is checksummed (SHA-256). The checksum is verified after Arweave write by reading back and comparing. A checksum mismatch triggers re-encryption and re-write. The Arweave `tx_id` is not committed to the server until the read-back checksum passes.

**Consequences.** Every downstream system — Ledger, Exchange, Marketplace — operates on semantically enriched, privacy-normalised data. The heterogeneity of source formats is resolved once, on-device, at ingestion time. Adds SoulMind as a required dependency for every Harvest job.
