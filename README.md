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

## Build Order (MVP)

1. **Konnections** — Soul signup + Plaid integration. A Soul connects their bank via Plaid; Transaktions Harvest into the Ledger.
2. **Ledger** — Secure storage and display of a Soul's Transaktions.
3. **Scoring** — Compute Insights from Ledger data. Start with financial Categories.
4. **Exchange (v1)** — Brand Listings, Consent-gated matching, Offer delivery.
5. **Claims + Wallet** — Claim flow, Yield deposit, Wallet balance display.

## Domain Modeling Status

The domain model is being developed via grilling sessions (`/grill-with-docs`). The following areas are **resolved**:

- Core data flow: Soul → Konnection → Harvest → Transaktion → Ledger → Scoring → Insight
- Exchange mechanics: Listing → matching → Offer → Claim → Yield → Wallet
- Consent model: Consent per Category with Yield floor
- Revenue model: take rate on Claims + Brand subscription
- Exchange matching: continuous real-time (triggered on new Listing and on Scoring)

The following areas are **not yet resolved** (continue grilling):

- Wallet withdrawal mechanics (bank transfer vs. gift cards, KYC requirements)
- MVP scope and sequencing decisions
- Data residency and Ledger security model
- Insight computation detail (what signals → what scores)
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
