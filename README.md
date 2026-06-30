# PersonalOS

A platform for personal data management and monetization — giving individuals ownership, control, and economic benefit from their own data.

## Vision

PersonalOS inverts the current data economy. Today, corporations harvest people's data and sell it without consent or compensation. PersonalOS gives that power back to individuals: connect your data sources, own your Ledger, and earn Yield when Brands bid for your attention.

## Domain Model

The domain language for this project is defined in [`CONTEXT.md`](./CONTEXT.md). **Read this before writing any code.** All code, APIs, and discussions should use these terms precisely.

Key concepts at a glance:

| Term | Meaning |
|---|---|
| **Soul** | The individual who owns their data |
| **Konnection** | A Soul's authorized link to an external data source (e.g. Plaid, Gmail) |
| **Provider** | The external service a Konnection connects to (e.g. Plaid) |
| **Harvest** | Pulling new data through a Konnection into the Ledger |
| **Transaktion** | A single raw data record in the Ledger |
| **Ledger** | A Soul's secure, append-only store of all Transaktions |
| **Scoring** | Recomputing a Soul's Insights from their Ledger |
| **Insight** | A derived propensity signal — the only thing that ever leaves the Ledger |
| **Category** | A named Insight category defined by PersonalOS (e.g. `automotive.new_vehicle_purchase`) |
| **Consent** | A Soul's opt-in consent for a Category, with a minimum Yield floor |
| **Depth** | A measure of how rich and complete a Soul's Ledger is |
| **Exchange** | The real-time marketplace that matches Listings to Souls |
| **Brand** | A company that bids to reach Souls on the Exchange |
| **Listing** | What a Brand posts on the Exchange (target Category + bid price + content) |
| **Offer** | What a Soul receives when their Insights match a Listing |
| **Claim** | A Soul accepting an Offer — the billable event |
| **Yield** | Payment deposited into a Soul's Wallet after a Claim |
| **Wallet** | A Soul's accumulated Yield balance |

## Build Order

Six layers, built foundation-up. Each layer has a **gate** — a provable condition that must hold before the next begins. The critical path is **SoulMind's Semantic Curation Engine** (ADR-30): it touches raw plaintext and determines the quality of everything downstream.

| Layer | Name | Key Components | Gate |
|---|---|---|---|
| **0** | **Identity & Crypto Foundation** | iOS app shell (Swift), WebAuthn passkey + Secure Enclave (ADR-31), AES-256-GCM + PBKDF2 key derivation (ADR-08), Coinbase Smart Wallet provisioning (ADR-32) | A Soul can be created and the same encryption key re-derived deterministically from the passkey — never extracted from the Enclave |
| **1** | **Harvest & Ledger — the data spine** | Plaid connector (ADR-02), **★ SoulMind Semantic Curation Engine** (ADR-30), Arweave/Irys Ledger write + read (ADR-11), append-only shard model (ADR-10) | A real bank's data is enriched, encrypted, written to Arweave, and read back identically — plaintext buffer provably zeroed |
| **2** | **Intelligence & Phase 1 value** ← MVP | SoulMind CoreML Scoring ≤5s on A12 (ADR-23), cross-source correlation (ADR-24), Insight feed + 90-second first Insight (ADR-06), differential-privacy noise on scores (ADR-14) | The "$816 moment" reliably fires from financial data alone — the smallest thing worth shipping |
| **3** | **Breadth & Depth** | Apple Health FHIR (ADR-16), Google Data Portability API (ADR-04), Setu Account Aggregator for India (ADR-03), tiered onboarding (ADR-05), Depth Score + health exclusion gate (ADR-18/19, ADR-15) | Souls reliably cross 60% Depth with multi-source data; health insights are barred from any marketplace path |
| **4** | **The Marketplace — Phase 2** ← revenue | Consent model + UX (ADR-20), server Exchange matching (ADR-25), multi-brand bidding + Reputation (ADR-21), BudgetEscrow.sol on Base + USDC (ADR-33/35), Claim → Yield + Voucher (ADR-34) | An end-to-end Claim settles real USDC on Base testnet, then mainnet — Consent-gated, Yield-floor-honoured, fee-split-immutable |
| **5** | **Hardening, Scale & Sovereignty** | k-anonymity k=50 floor (ADR-37), §1033 enforcement at Exchange (ADR-02), ConsentRegistry.sol + upgrade governance (ADR-35), Soul-owned Arweave opt-in (ADR-36), passkey recovery path (ADR-31, open) | External smart-contract audit and independent privacy audit both pass before scaled launch |

## Domain Modeling Status

The domain model is being developed via grilling sessions (`/grill-with-docs`). The following areas are **resolved**:

- Core data flow: Soul → Konnection → Harvest → Transaktion → Ledger → Scoring → Insight
- Exchange mechanics: Listing → matching → Offer → Claim → Yield → Wallet
- Consent model: Consent per Category with Yield floor
- Revenue model: take rate on Claims + Brand subscription
- Exchange matching: continuous real-time (triggered on new Listing and on Scoring)
- MVP scope and sequencing: 6-layer build order with gates; MVP at Layer 2 (see Build Order above)
- Data residency and Ledger security: E2E encrypted (AES-256-GCM) on Arweave via Irys; passkey-derived keys in Secure Enclave; plaintext zeroed post-encrypt (ADR-08, ADR-11)
- Insight computation: SoulMind Semantic Curation Engine (ADR-30) enriches on-device; CoreML scoring ≤5s on A12 (ADR-23); differential-privacy noise ε ≤ 2.0 on exported scores (ADR-14)

The following areas are **not yet resolved** (continue grilling):

- Wallet withdrawal mechanics (USDC on Base decided as primary rail; fiat off-ramp details via Coinbase on/off-ramp still light)
- Brand onboarding and Listing workflow

## Tech Stack

- **iOS app (Swift)** — primary client; Scoring runs here, Coinbase Smart Wallet SDK, Plaid Link SDK
- **Backend (TypeScript/Node.js)** — Exchange matching service, Insight score ingestion, Brand/Listing API
- **Smart contracts (Solidity on Base)** — Budget escrow, atomic Claim settlement
- **Storage** — Arweave via Irys (encrypted Ledger), PersonalOS server (Insight scores only)
- **Payments** — USDC on Base (primary), Coinbase on/off-ramp for fiat Withdrawal

## Architecture Decisions

37 architecture decisions are recorded in [`docs/adr/`](./docs/adr/). The canonical consolidated register is [`PersonalOS_ADR_Unified.md`](./docs/adr/PersonalOS_ADR_Unified.md).

| ADR | Decision | Status |
|---|---|---|
| [01](./docs/adr/0001-multi-source-harvest-plaid-us-aa-india-google-dpa-apple-heal.md) | Multi-source Harvest: Plaid, AA, Google DPA, Apple Health, BYOD | Accepted |
| [02](./docs/adr/0002-plaid-for-us-bank-card-konnections.md) | Plaid for US bank & card Konnections | Accepted |
| [03](./docs/adr/0003-setu-rbi-account-aggregator-for-india-financial-data.md) | Setu / RBI Account Aggregator for India | Accepted |
| [04](./docs/adr/0004-google-data-portability-api-one-resource-per-archive-job.md) | Google Data Portability API | Accepted |
| [05](./docs/adr/0005-tiered-harvest-onboarding-zero-low-deferred-friction.md) | Tiered Harvest onboarding: zero / low / deferred friction | Accepted |
| [06](./docs/adr/0006-insight-feed-as-the-onboarding-engine.md) | Insight feed as the onboarding engine | Accepted |
| [07](./docs/adr/0007-on-device-processing-scores-only-leave-the-device.md) | On-device processing; scores-only leave the device | Accepted |
| [08](./docs/adr/0008-aes-256-gcm-encryption-for-all-on-device-state.md) | AES-256-GCM encryption for all on-device state | Accepted |
| [09](./docs/adr/0009-data-deletion-passkey-destruction-not-arweave-erasure.md) | Data deletion = passkey destruction, not Arweave erasure | Accepted |
| [10](./docs/adr/0010-portable-compounding-ledger-on-arweave.md) | Portable, compounding Ledger on Arweave | Accepted |
| [11](./docs/adr/0011-arweave-irys-as-the-encrypted-ledger-store.md) | Arweave / Irys as the encrypted Ledger store | Accepted |
| [12](./docs/adr/0012-privacy-preserving-broker-consents-yield-floor-gate.md) | Privacy-preserving Exchange: Consents + Yield floor gate | Accepted |
| [13](./docs/adr/0013-consent-tokens-carry-derived-insights-never-raw-transaktions.md) | Consent tokens carry derived Insights, never raw Transaktions | Accepted |
| [14](./docs/adr/0014-differential-privacy-noise-on-published-insight-scores.md) | Differential-privacy noise on published Insight scores | Accepted |
| [15](./docs/adr/0015-health-data-insight-only-excluded-from-listing-matching-unti.md) | Health data: Insight-only; excluded from Listing matching | Accepted |
| [16](./docs/adr/0016-apple-health-records-fhir-over-bespoke-mychart-aggregation.md) | Apple Health Records (FHIR) over bespoke MyChart | Accepted |
| [17](./docs/adr/0017-two-phase-model-soulmind-insight-engine-intent-marketplace.md) | Two-phase model: SoulMind insight engine → intent marketplace | Accepted |
| [18](./docs/adr/0018-soulprofile-depth-score-as-phase-1-2-gate-60.md) | SoulProfile Depth Score as Phase 1→2 gate (60%) | Accepted |
| [19](./docs/adr/0019-two-axis-depth-score-breadth-depth-financial-data-weighted-2.md) | Two-axis Depth Score: breadth × depth; financial weighted 2× | Accepted |
| [20](./docs/adr/0020-intent-first-consent-matching-over-passive-inference.md) | Intent-first Consent matching; Exchange augments with Scoring | Accepted |
| [21](./docs/adr/0021-multi-brand-competitive-bidding-for-declared-consent.md) | Multi-brand competitive bidding for declared Consent | Accepted |
| [22](./docs/adr/0022-on-device-ios-soulmind-models-over-cloud-llm-agent-sdk.md) | On-device iOS SoulMind models over cloud LLM Agent SDK | Accepted |
| [23](./docs/adr/0023-soulmind-runs-coreml-scoring-models-on-device-no-raw-data-to.md) | SoulMind CoreML Scoring on-device; no raw data to server | Accepted |
| [24](./docs/adr/0024-cross-source-semantic-correlation-on-device-via-soulmind.md) | Cross-source semantic correlation on-device via SoulMind | Accepted |
| [25](./docs/adr/0025-offer-matching-consent-yield-floor-soulmind-score-semantic-v.md) | Offer matching: Consent + Yield floor + SoulMind score | Accepted |
| [26](./docs/adr/0026-postgresql-supabase-for-metadata-only-no-raw-transaktions-se.md) | PostgreSQL for metadata only; no raw Transaktions server-side | Accepted |
| [27](./docs/adr/0027-harvest-scheduler-cron-plaid-webhook-soulmind-scores-pushed-.md) | Harvest scheduler: cron + Plaid webhook | Accepted |
| [28](./docs/adr/0028-on-device-intelligence-replaces-zero-retention-cloud-api.md) | On-device intelligence replaces zero-retention cloud API | Accepted |
| [29](./docs/adr/0029-key-destruction-as-deletion-for-arweave-resident-ledger.md) | Key-destruction as deletion for Arweave Ledger | Accepted |
| [30](./docs/adr/0030-soulmind-on-device-semantic-curation-layer-before-ledger-wri.md) | **SoulMind: on-device semantic curation (SCE)** | Accepted — NEW |
| [31](./docs/adr/0031-webauthn-passkey-as-soul-identity-anchor-and-encryption-key.md) | WebAuthn passkey as Soul identity anchor + AES key derivation | Accepted |
| [32](./docs/adr/0032-coinbase-smart-wallet-erc-4337-for-yield-settlement.md) | Coinbase Smart Wallet (ERC-4337) for Yield settlement | Accepted |
| [33](./docs/adr/0033-usdc-on-base-chain-as-settlement-currency-budgetescrow-sol.md) | USDC on Base; BudgetEscrow.sol | Accepted |
| [34](./docs/adr/0034-blended-settlement-usdc-yield-optional-fiat-voucher-per-list.md) | Blended settlement: USDC Yield + optional fiat Voucher | Accepted |
| [35](./docs/adr/0035-smart-contract-enforces-fee-split-and-yield-deposit.md) | Smart contract enforces fee split and Yield deposit | Accepted |
| [36](./docs/adr/0036-arweave-account-model-shared-default-vs-soul-owned-opt-in.md) | Arweave account model: shared vs Soul-owned | Accepted |
| [37](./docs/adr/0037-re-identification-mitigation-k-anonymity-floor-insight-noise.md) | Re-identification mitigation: k-anonymity + Insight noise | Accepted |
