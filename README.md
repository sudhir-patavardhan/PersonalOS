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

Key decisions are recorded in [`docs/adr/`](./docs/adr/):

| ADR | Decision |
|---|---|
| [0001](./docs/adr/0001-continuous-exchange-matching.md) | Exchange runs continuous real-time matching |
| [0002](./docs/adr/0002-base-usdc-payment-rail.md) | Base chain + USDC as primary Payment Rail |
| [0003](./docs/adr/0003-e2e-encrypted-ledger-local-scoring.md) | E2E encrypted Ledger, Scoring runs on-device |
| [0004](./docs/adr/0004-arweave-ledger-storage.md) | Arweave via Irys for permanent Ledger storage |
| [0005](./docs/adr/0005-coinbase-smart-wallet.md) | Coinbase Smart Wallet for Soul Wallets |
