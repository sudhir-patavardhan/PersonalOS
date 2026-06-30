# PersonalOS — Unified Architecture Decision Log

> **Read-only reference.** Individual ADR files in this directory (`0001-*.md` through `0037-*.md`) are the working copies. Edit those, not this file.

**Document status:** Canonical consolidated register. Supersedes `PersonalOS_ADR_Log.md` (28 ADRs, assembled May 2026) and the architecture decisions implicit in the site at `sudhir-patavardhan.github.io/PersonalOS/site/`. Where the two prior sources conflicted, the resolution applied here is stated explicitly in each ADR. Nine new ADRs (29–37) have been added to cover gaps identified in the delta analysis and to introduce the on-device semantic curation layer — the most significant new architectural decision in this document.

**Authors:** Sharad Rao · Sudhir Patavardhan
**Last revised:** June 2026

**Legend — Status:** `Accepted` (decided & in effect) · `Proposed` (agreed direction, not yet built) · `Open` (raised, unresolved) · `Superseded` (replaced by a later ADR)

---

## Domain vocabulary (canonical)

Both prior sources used different terminology for the same concepts. This document adopts the following terms throughout. All 28 prior ADRs have been silently updated to use this vocabulary.

| Prior ADR term | Prior site term | Canonical term used here |
|---|---|---|
| User | Soul | **Soul** |
| Transaction | Transaktion | **Transaktion** (site spelling — signals immutability) |
| Bank connection | Konnection | **Konnection** |
| Vault | Ledger | **Ledger** (Arweave-resident encrypted store) |
| Data pull / export | Harvest | **Harvest** |
| Coupon / reward / cashback | Yield | **Yield** (USDC, settled on-chain) |
| Brand offer | Listing | **Listing** |
| Offer activation | Claim | **Claim** |
| Insight / DNA score | Insight | **Insight** |
| Consumer DNA profile | Profile | **SoulProfile** |
| Behavioral archetype | Archetype | **Archetype** |
| Platform fee | Platform fee | **Platform fee** |
| Subscription / connect | Consent | **Consent** |
| Semantic enrichment layer | *(absent from both)* | **SoulMind** — see ADR-30 |

---

## Index

| # | Decision | Status | Supersedes |
|---|---|---|---|
| 01 | Multi-source Harvest: Plaid (US), AA (India), Google DPA, Apple Health, BYOD exports | Accepted | — |
| 02 | Plaid for US bank & card Konnections | Accepted (impl.) | — |
| 03 | Setu / RBI Account Aggregator for India financial data | Accepted (impl.) | — |
| 04 | Google Data Portability API, one resource per archive job | Accepted (impl.) | — |
| 05 | Tiered Harvest onboarding: zero / low / deferred friction | Accepted | — |
| 06 | Insight feed as the onboarding engine | Accepted | 5-step wizard |
| 07 | On-device processing; scores-only leave the device | Accepted | ADR-28 (cloud LLM) |
| 08 | AES-256-GCM encryption for all on-device state | Accepted | — |
| 09 | Data deletion = passkey destruction, not Arweave erasure | Accepted | ADR-09 (file deletion) |
| 10 | Portable, compounding Ledger on Arweave | Accepted | ADR-10 (local .wallet file) |
| 11 | Arweave / Irys as the encrypted Ledger store | Accepted | ADR-26 (Supabase as vault) |
| 12 | Privacy-preserving broker: Consents + Yield floor gate | Accepted | — |
| 13 | Consent tokens carry derived Insights, never raw Transaktions | Accepted | — |
| 14 | Differential-privacy noise on published Insight scores | Accepted | ADR-14 (Open) |
| 15 | Health data: Insight-only; excluded from Listing matching until policy resolved | Accepted | ADR-15 (Open) |
| 16 | Apple Health Records (FHIR) over bespoke MyChart aggregation | Accepted | — |
| 17 | Two-phase model: SoulMind insight engine → intent marketplace | Accepted | — |
| 18 | SoulProfile Depth Score as Phase 1→2 gate (60%) | Accepted | — |
| 19 | Two-axis Depth Score: breadth × depth; financial data weighted 2× | Accepted | ADR-19 (Open) |
| 20 | Intent-first Consent matching over passive inference | Accepted | inference matching |
| 21 | Multi-brand competitive bidding for declared Consent | Accepted | — |
| 22 | On-device iOS SoulMind models over cloud LLM Agent SDK | Accepted | ADR-22–25, 27, 28 |
| 23 | SoulMind runs CoreML scoring models on-device; no raw data to server | Accepted | consumer_dna.skill |
| 24 | Cross-source semantic correlation on-device via SoulMind | Accepted | ADR-24 (LLM correlation) |
| 25 | Offer matching: Consent + Yield floor + SoulMind score; semantic v2 on-device | Accepted | offer_match.skill |
| 26 | PostgreSQL (Supabase) for metadata only; no raw Transaktions server-side | Accepted | ADR-26 (vault in Supabase) |
| 27 | Harvest scheduler: cron + Plaid webhook; SoulMind scores pushed post-Harvest | Accepted | ADR-27 (Agent SDK cron) |
| 28 | On-device intelligence replaces zero-retention cloud API | Accepted | ADR-28 (zero-retention API) |
| 29 | Key-destruction as deletion for Arweave-resident Ledger | Accepted | ADR-09 |
| 30 | SoulMind: on-device semantic curation layer before Ledger write | **Accepted — NEW** | absent from both prior docs |
| 31 | WebAuthn passkey as Soul identity anchor and encryption key | Accepted | absent from ADR log |
| 32 | Coinbase Smart Wallet (ERC-4337) for Yield settlement | Accepted | fiat/coupon model |
| 33 | USDC on Base chain as settlement currency; BudgetEscrow.sol | Accepted | cashback/coupon model |
| 34 | Blended settlement: USDC Yield + optional fiat Voucher per Listing | Accepted | pure-fiat ADR model |
| 35 | Smart contract enforces fee split and Yield deposit | Accepted | policy-based fee model |
| 36 | Arweave account model: shared (default) vs Soul-owned (opt-in) | Accepted | — |
| 37 | Re-identification mitigation: k-anonymity floor + Insight noise | Accepted | ADR-14 (Open) |

---

## Section 1 — Data Acquisition & Harvest

### ADR-01 — Multi-source Harvest: Plaid, Account Aggregator, Google DPA, Apple Health, BYOD exports
**Status:** Accepted · **Source:** ADR log + site architecture

**Context.** PersonalOS aggregates financial, health, entertainment, mobility, and commerce data from a diverse source universe: US banks (Plaid), Indian banks (Setu AA), Google activity (Data Portability API), Apple Health (FHIR export), Amazon (BYOD CSV), ride-share (Uber export), and any future source. Each source has a different API contract, consent model, data format, and semantic vocabulary. No two sources share a common schema. Historically, the ADR log treated each connector independently (ADR-02, 03, 04). The site added Plaid with passkey provisioning. Neither source addressed what happens to the raw heterogeneous data *before* it reaches the Ledger — the semantic gap described in instruction 9.

**Decision.** Harvest is the process of pulling raw data from any source into the Soul's iOS device, normalising it through the SoulMind semantic layer (ADR-30), encrypting the enriched Transaktions, and writing the encrypted batch to the Arweave Ledger. Harvest never writes raw, unprocessed data to the Ledger. The enriched-and-encrypted form is the canonical record. The steps are:

1. Source connector pulls raw data (Plaid transactions, Apple Health XML, Google activity JSON, Uber CSV, etc.) into a sandboxed in-memory buffer on the iOS device.
2. SoulMind (ADR-30) curates and enriches: normalises merchant names, resolves schema heterogeneity, attaches semantic tags, infers categories, and applies differential-privacy noise at the Insight layer.
3. AES-256-GCM encryption is applied to the enriched batch using the key derived from the Soul's passkey.
4. The encrypted batch is written to Arweave via Irys.
5. Only the Arweave content hash and aggregate Insight scores leave the device to PersonalOS Backend.
6. The in-memory plaintext buffer is zeroed. Raw source data is never stored on-device or server-side beyond the duration of step 2.

**Consequences.** Every downstream system — Ledger, Exchange, Marketplace — operates on semantically enriched, privacy-normalised data. The heterogeneity of source formats is resolved once, on-device, at ingestion time. Adds SoulMind as a required dependency for every Harvest job.

---

### ADR-02 — Plaid for US bank & card Konnections
**Status:** Accepted (implemented) · **Source:** ADR log (`plaid/` service)

**Decision.** Plaid Express + `plaid` SDK provides the Tier-1, zero-friction US financial Konnection (Capital One, Chase, Amex, and 12,000+ institutions). Session-based, sandbox→production env switch. Plaid Link runs inside an iOS WebView; the Soul's bank credentials are handled entirely by Plaid and never pass through PersonalOS.

**Consequences.** Sub-two-minute first Konnection. Introduces CFPB §1033 open-banking compliance obligation: data received via Plaid under §1033 may only be used for the purpose the Soul authorised — PersonalOS must not use §1033-derived financial data for any Listing matching purpose beyond what is disclosed in the Consent. SoulMind (ADR-30) must apply §1033 use-limitation tags during semantic enrichment so the Exchange can enforce them.

---

### ADR-03 — Setu / RBI Account Aggregator for India financial data
**Status:** Accepted (implemented) · **Source:** ADR log (`account-aggregator/` service)

**Decision.** Setu FIU API (token-cached auth, FIU-UAT environment) provides the India-side financial Konnection in parallel with Plaid. The RBI Account Aggregator framework is consent-native by regulation.

**Consequences.** Parallel Harvest codepath required for India Souls. India DPDP Act 2023 "right to erasure" applies — key-destruction (ADR-29) satisfies this under Recital-26-equivalent reasoning; legal confirmation required pre-launch for India jurisdiction. SoulMind must maintain a separate semantic tag namespace for India-specific merchant categories (UPI merchants do not map to Plaid category codes).

---

### ADR-04 — Google Data Portability API, one resource per archive job
**Status:** Accepted (implemented) · **Source:** ADR log (`data-portability/` service)

**Decision.** Google activity data (Search, YouTube, Chrome, Maps) is Harvested via the official Google Data Portability API with per-resource OAuth scopes. Do not mix Data Portability scopes with other Google scopes in a single token. Initiate one resource per archive job. Playwright included for export flows requiring browser automation where the API is unavailable.

**Consequences.** Google activity is some of the highest-signal data for SoulMind's semantic enrichment — search queries immediately preceding a large purchase are a strong intent signal. SoulMind must parse Google's JSON format and cross-reference with financial Transaktions by timestamp proximity.

---

### ADR-05 — Tiered Harvest onboarding: zero / low / deferred friction
**Status:** Accepted · **Source:** ADR log + site (Soul Onboarding Flow 1)

**Decision.** Three friction tiers govern which sources are presented at which onboarding moment:
- **Tier 1 — zero friction:** Plaid Konnection + WebAuthn passkey + Smart Wallet provisioning (ADR-31, ADR-32). Completed in <3 minutes. Unlocks first financial Insights. This is the entire first session.
- **Tier 2 — low friction:** Apple Health (FHIR export), Google Data Portability API. Presented after first Insight is delivered. Async Harvest jobs with reminder notifications. Never block the primary flow.
- **Tier 3 — deferred:** Amazon BYOD CSV, Instagram, Uber, MyChart. Surfaced as "deepen your SoulProfile" prompts inside the Insight feed, triggered after a relevant Insight fires (e.g., the Amazon late-night spend insight prompts Amazon Konnection).

**Consequences.** First-session value is guaranteed from Plaid alone. SoulMind must handle sparse profiles gracefully at Tier 1 — only financial Insights available initially, with health and entertainment Insights unlocking progressively. Profile Depth Score (ADR-18, ADR-19) rises with each Tier addition.

---

### ADR-06 — Insight feed as the onboarding engine
**Status:** Accepted · Supersedes: linear 5-step wizard · **Source:** ADR log (discussion-001)

**Decision.** The linear "connect all your sources" setup wizard is retired. The onboarding experience is: connect one Konnection, receive one Insight, feel the value. Every subsequent Insight in the feed that references a missing data source includes a contextual prompt to add it. Onboarding has no end state — the Insight feed is the engine.

**Consequences.** The first Insight must fire within 90 seconds of first Konnection. SoulMind must produce at least one compelling Insight from financial data alone (the "$X moment"). Requires the Insight feed to handle progressive profile enrichment gracefully.

---

## Section 2 — Privacy & Data Handling

### ADR-07 — On-device processing; only Insights and scores leave the device
**Status:** Accepted · Supersedes: ADR-28 (zero-retention cloud API) · **Source:** site (Harvest → Scoring → Insight, Flow 2) + ADR-07

**Context.** The original ADR-07 accepted on-device processing as a principle but partially contradicted it with ADR-28 (zero-retention cloud API for LLM inference). The site architecture is unambiguous: all Scoring and SoulMind semantic computation runs on the iOS device. No raw Transaktion data — not even encrypted — is transmitted to PersonalOS Backend at any point. The only outbound data from the device to the server is: Arweave content hashes (pointers), aggregated Insight scores, and Claim actions.

**Decision.** Raw Transaktion data is processed exclusively on the Soul's iOS device. PersonalOS Backend never receives, holds, or processes any Transaktion in plaintext or ciphertext. The server receives only:
- Arweave `tx_id` (a content hash — cryptographically opaque)
- Insight scores (`{category, score, confidence, computed_at}`)
- Reputation scores (post-Claim purchase detected)
- Consent configurations
- Claim actions (Soul-initiated)

All SoulMind semantic enrichment (ADR-30), CoreML Scoring (ADR-22, ADR-23), cross-source correlation (ADR-24), and Insight generation runs on-device before any Arweave write. This supersedes ADR-28's acceptance of a cloud LLM API call for intelligence.

**Consequences.** The privacy claim becomes architectural rather than contractual: PersonalOS structurally cannot read Soul data because it never receives it. This is the strongest possible trust guarantee. Requires SoulMind and CoreML Scoring models to run on iPhone hardware (A14 Bionic or later recommended; A12 Bionic minimum for acceptable Scoring latency). Adds an iOS-native ML engineering dependency that was absent from the prior ADR log.

---

### ADR-08 — AES-256-GCM encryption for all on-device state
**Status:** Accepted · **Source:** ADR log

**Decision.** All data in the Soul's on-device buffer — raw Transaktions awaiting SoulMind enrichment, enriched Transaktions awaiting Arweave upload, decrypted Ledger shards fetched from Arweave for Scoring — is encrypted at rest with AES-256-GCM. The encryption key is derived from the Soul's WebAuthn passkey stored in iCloud Keychain Secure Enclave (ADR-31). No on-device Transaktion data is ever written to disk in plaintext.

**Consequences.** Any compromise of the iOS device without the passkey reveals only ciphertext. Key derivation from the Secure Enclave means the key cannot be extracted from the device even by PersonalOS.

---

### ADR-09 — Data deletion = passkey destruction, not Arweave erasure
**Status:** Accepted · Supersedes: original ADR-09 (immediate raw-file deletion) · **Source:** ADR-29 (delta analysis, June 2026)

**Context.** The original ADR-09 promised immediate deletion of raw export files after parsing. Under the Arweave Ledger architecture (ADR-11), encrypted Transaktion shards are written to a permanent, immutable blockchain — they cannot be deleted by any party. The deletion promise must be reframed to reflect this reality.

**Decision.** "Deletion" in PersonalOS means passkey destruction — the irreversible loss of the AES-256-GCM decryption key that makes all Arweave Ledger data permanently inaccessible. When a Soul requests account deletion:

1. PersonalOS Backend removes all server-side references to the Soul: `soul_accounts` row, `konnections`, `consents`, `insights`, `offers`, `claims` rows deleted from PostgreSQL.
2. The Soul is instructed to delete the passkey from iCloud Keychain on their device.
3. The `arweave_ledger_hash` pointer is removed from the database. No server-side entity can locate the Ledger shards.
4. The encrypted Transaktion shards remain on Arweave permanently but are computationally inaccessible — indistinguishable from random noise — without the passkey.

This satisfies GDPR Recital 26 (data rendered permanently inaccessible is no longer personal data) and the spirit of the India DPDP Act 2023 right to erasure. Legal confirmation required for each jurisdiction prior to launch.

The original ADR-09 spirit — that plaintext raw data is never persistently stored — is preserved and strengthened: SoulMind zeros the in-memory plaintext buffer immediately after AES encryption, before any Arweave upload.

**Consequences.** Privacy policy and deletion-request confirmation copy must accurately describe key-destruction-as-deletion. "Your data is deleted" is replaced with "your encryption key is destroyed, making your stored data permanently inaccessible to anyone including PersonalOS." A passkey recovery mechanism must be designed (see ADR-31 open sub-questions) or the consequences of passkey loss made explicit in onboarding.

---

### ADR-10 — Portable, compounding Ledger on Arweave
**Status:** Accepted · Supersedes: ADR-10 (local .wallet file) · **Source:** site data model + ADR-10

**Decision.** The Soul's Ledger is no longer a local `.wallet` file on their device. It is a permanent, content-addressed, Soul-owned collection of encrypted Transaktion batches on Arweave. The Ledger compounds in value as more Harvests write to it — Year 3 data has 36 months of pattern resolution, dramatically more signal than Year 1.

Two account models govern who holds the Arweave write key:
- **Shared model (default):** PersonalOS writes to the Ledger via a shared Irys account. Batched writes minimise cost (~$100/year at 100k Souls). The Soul holds only the decryption passkey; PersonalOS holds the write key but cannot read the content.
- **Soul-owned model (opt-in):** PersonalOS writes to the Soul's own Arweave wallet. Higher per-transaction cost but full platform-independent ownership — the Soul's Ledger is accessible without PersonalOS.

The Ledger is the retention mechanism. Its growing value (more signal = better Insights = better Offers = more Yield) is the primary reason Souls do not churn. The vault compounding story from the prior ADR-10 is preserved; the implementation layer has changed.

**Consequences.** Cross-device access: any iOS device with the passkey can fetch and decrypt the Ledger from Arweave without PersonalOS involvement. Optional iCloud Keychain sync of the passkey provides seamless multi-device experience. ADR-11 (cloud sync) is superseded by Arweave for the Ledger; ADR-11 remains relevant for non-Ledger metadata (Insights, Consents, Offers).

---

### ADR-11 — Arweave / Irys as the encrypted Ledger store
**Status:** Accepted · Supersedes: ADR-26 (Supabase as vault store) · **Source:** site architecture

**Decision.** Arweave via Irys is the canonical store for all encrypted Transaktion data. The `TRANSAKTION` entity does not exist in PostgreSQL — the PersonalOS database holds only the Arweave content hash pointer on the `souls` row. This is the most consequential storage decision in the architecture: it makes the Ledger permanent, permaweb-native, and platform-independent.

Irys provides optimistic finality guarantees before Arweave network propagation is confirmed. The Irys receipt is the functional confirmation for the iOS app; Arweave `tx_id` is the permanent reference.

**Consequences.** Arweave storage has a one-time permanent cost (currently ~$0.003/MB via Irys at scale). This must be modelled per Soul per Harvest in the Bill of Materials. Arweave writes are irreversible — SoulMind (ADR-30) must produce the final enriched, privacy-normalised form before upload, because post-write correction is impossible. Data compaction strategy (how many Transaktions per shard, compression format) must be specified in the SoulMind design.

---

### ADR-12 — Privacy-preserving Exchange: Consents + Yield floor gate
**Status:** Accepted · **Source:** ADR log + site

**Decision.** The Exchange never exposes raw Transaktions or unaggregated Insight scores to Brands. A Brand's Listing targets a Category and sets a bid per Claim. The Exchange matches Souls to Listings only when all of the following are true:
- Soul has an active Consent for the Listing's Category (`revoked_at IS NULL`)
- Soul's Insight score for the Category meets `listing.min_score_threshold`
- Soul's Consent `yield_floor_usdc` ≤ `listing.bid_per_claim_usdc`

Brands receive only: offer count, claim count, budget remaining. No individual Soul data is ever transmitted to a Brand.

**Consequences.** Consent is the operative privacy control for the marketplace. The Soul's Yield floor is a hard pre-ranking gate — it is their minimum price for attention. Brands cannot reach a Soul who has not explicitly consented to their Category at the bid level offered.

---

### ADR-13 — Consent tokens carry derived Insights, never raw Transaktions
**Status:** Accepted · **Source:** ADR log

**Decision.** When a Soul shares their SoulProfile externally (e.g., enables a Brand to see their match scores), a one-time Consent token is issued containing only derived Insight scores ("Premium Travel 98%") and the Archetype label. The token never contains Transaktions, merchant names, amounts, or any data that could be reverse-engineered to individual purchases.

**Consequences.** Granular, revocable, per-share consent. Token lifecycle (issuance, expiry, revocation) must be built in PersonalOS Backend. Tokens are signed and time-limited to prevent replay.

---

### ADR-14 — Differential-privacy noise on published Insight scores
**Status:** Accepted · Supersedes: ADR-14 (Open) · **Source:** delta analysis elevation (June 2026)

**Context.** The behavioral specificity visible in PersonalOS Insights ("76 coffee outings/yr," "matched on Tokyo pattern") is sufficiently precise to re-identify individuals in narrow geographies even if names are absent. Under permanent Arweave storage (ADR-11), this risk is elevated from a theoretical concern to a concrete long-horizon exposure.

**Decision.** SoulMind (ADR-30) applies calibrated Gaussian noise to Insight scores before they are transmitted to PersonalOS Backend. The noise budget is set such that:
- Individual-level Insights surfaced within the Soul's own iOS app are noise-free (the Soul sees their true data).
- Insight scores transmitted to the server (`POST /souls/{soul_id}/insights`) have noise applied such that ε ≤ 2.0 (ε-differential privacy) per Insight category per Harvest.
- The Exchange ranking function operates on noisy scores; small score differences between Souls in the same Category are indistinguishable.

A k-anonymity floor of k ≥ 50 is applied to any aggregate cohort query from the PersonalOS backend: no query result that could identify fewer than 50 Souls is returned from the Insights table.

**Consequences.** Slightly reduced Exchange matching precision (noise attenuates score differences). This is an acceptable trade-off for the re-identification mitigation. SoulMind's Scoring model outputs must be designed to accommodate the noise budget without degrading Insight quality to the Soul.

---

### ADR-15 — Health data: Insight-only; excluded from Listing matching until policy resolved
**Status:** Accepted · Supersedes: ADR-15 (Open) · **Source:** ADR log + legal caution

**Decision.** Health data (Apple Health, MyChart FHIR) is used exclusively to generate Insights for the Soul's own consumption. It is explicitly excluded from the Exchange matching layer, Consent categories, and any Listing targeting until a separate health-data-in-marketplace policy is established and reviewed by legal counsel. The boundary is enforced in SoulMind: health-derived Insight scores are tagged `marketplace_eligible: false` and the Exchange enforces this flag as a hard gate.

**Consequences.** The "glucose months = Whole Foods months" cross-source correlation is visible to the Soul inside their iOS app but cannot be used to target a nutrition brand's Listing. This is a deliberate restraint. If the policy is later relaxed, a new ADR must be written covering HIPAA-adjacent obligations, and the SoulMind tagging schema must be updated.

---

### ADR-16 — Apple Health Records (FHIR) over bespoke MyChart aggregation
**Status:** Accepted · **Source:** ADR log

**Decision.** Clinical health data (lab results, medications, conditions) is ingested via Apple Health's FHIR integration, which aggregates from Epic, Cerner, and other EHR systems through Apple's existing infrastructure. PersonalOS does not build a direct MyChart/Epic integration.

**Consequences.** Avoids building and maintaining a patchwork of per-health-system OAuth integrations. Ties clinical data ingestion to Apple Health availability on the Soul's device. Clinical data is subject to ADR-15's marketplace exclusion.

---

## Section 3 — Product Model & Marketplace

### ADR-17 — Two-phase model: SoulMind insight engine → intent marketplace
**Status:** Accepted · **Source:** ADR log

**Decision.** Phase 1 is a personal SoulMind insight engine: the Soul understands themselves more deeply than any advertiser does. Phase 2 is an intent-driven marketplace where Souls declare what they want, Brands bid to fulfill it, and Yield settles atomically on-chain. Phase 2 is earned through Phase 1 — you unlock the marketplace by building a sufficiently rich SoulProfile.

The product narrative: *"We built the insight engine so that when you enter the marketplace, you are not a consumer to be targeted — you are a Soul with demonstrated intent, verified history, and a Yield floor below which no Brand can reach you."*

**Consequences.** Phase 1 must stand alone as a compelling product. Phase 2 depends on the cold-start liquidity problem being solved (enough Souls at sufficient Depth Score for Brands to find the market worthwhile). The Depth Score gate (ADR-18) is the mechanism that builds marketplace liquidity organically.

---

### ADR-18 — SoulProfile Depth Score as Phase 1→2 gate (60%)
**Status:** Accepted · **Source:** ADR log (discussion-002)

**Decision.** A Soul must reach a SoulProfile Depth Score of ≥ 60% to unlock Phase 2 (Listing matching, Claim settlement, Yield). The Depth Score is computed on-device by SoulMind (ADR-19, ADR-30). Phase 2 is framed as *earned through data contribution* — the UI presents it as "your SoulProfile is ready for the marketplace," not as a paywall or upgrade.

**Consequences.** Aligns Soul and platform incentives: more connected sources = richer Insights = marketplace access = Yield. The 60% threshold is a starting value; it should be tuned based on marketplace conversion data in the first 90 days of Phase 2 operation.

---

### ADR-19 — Two-axis Depth Score: breadth × depth; financial data weighted 2×
**Status:** Accepted · Supersedes: ADR-19 (Open) · **Source:** ADR log (discussion-002) + resolution

**Decision.** The SoulProfile Depth Score is computed on-device by SoulMind as:

`DepthScore = Σ (source_weight × min(history_months / 12, 1.0))` normalised to 0–100%.

Source weights (summing to 100% if all sources connected at 12 months):

| Source | Weight | Rationale |
|---|---|---|
| Plaid / Account Aggregator (financial) | 30% | Highest signal; anchor source |
| Apple Health | 20% | Second-highest signal; lifestyle foundation |
| Google Activity | 15% | Intent and research signal |
| Amazon / commerce | 15% | Purchase pattern signal |
| Uber / mobility | 10% | Location and lifestyle signal |
| Instagram / social | 10% | Interest and aspiration signal |

History depth: each source contributes proportionally to the months of history available, capped at 12 months (full contribution). A Soul with Plaid connected for 12 months and nothing else scores 30%.

Score transparency: the Soul sees their score breakdown by source. The breakdown is not exposed to Brands or the Exchange to prevent gaming.

**Consequences.** Resolves the ADR-19 open sub-questions. Financial data is explicitly weighted highest. The score is predictable and auditable by the Soul. 60% gate requires at minimum Plaid (full 12 months) + Apple Health (full 12 months) + one additional source — or equivalent combinations.

---

### ADR-20 — Intent-first Consent matching; Exchange augments with Scoring-triggered discovery
**Status:** Accepted · **Source:** ADR log + site Exchange Flows 3 and 4

**Context.** ADR-20 (original) accepted intent-first matching as the exclusive model — the Soul declares intent, Brands bid. The site's Exchange runs two complementary triggers: Listing-triggered (new Brand Listing scans matching Souls) and Scoring-triggered (new Insight score triggers scan of active Listings). These are passive matching patterns in tension with ADR-20's intent-first principle.

**Decision.** The architecture blends both, with intent-first as the primary UX and Exchange triggers as the discovery layer:

- **Consent = declared intent.** A Soul grants a Consent for a Category (e.g., `automotive.new_vehicle_purchase`) with a Yield floor. This is the explicit intent declaration. The Exchange acts on it. No Consent = no Offers, regardless of how high a Soul's Insight score is for a Category.
- **Exchange triggers discover, Consents gate.** Listing-triggered and Scoring-triggered Exchange runs (site Flows 3 and 4) are the mechanism by which the platform discovers that a Soul's declared Consent is now matchable with an available Listing. They are discovery events, not targeting events — they cannot surface an Offer without a prior Consent.
- **Consent UX is explicit.** Granting a Consent is a deliberate Soul action in the app, not an inferred background process. The Consent screen shows: Category name, Yield floor the Soul sets, notification preferences, and example types of Brands that may appear. The Soul chooses; the Exchange discovers matches for what they have chosen.

**Consequences.** The Exchange's bi-directional trigger model (site) is preserved as the matching engine. ADR-20's intent-first principle is preserved as the gating UX layer. Together they produce a system where: Souls only receive Offers for Categories they have actively consented to, at Yield floors they have set, from Brands whose Listings meet those floors. This is materially different from a conventional ad exchange.

---

### ADR-21 — Multi-brand competitive bidding for declared Consent
**Status:** Accepted · **Source:** ADR log

**Decision.** Multiple Brands may hold active Listings for the same Category. The Exchange ranks them by `bid × Reputation × recency_weight` and delivers the highest-ranked Offer to the Soul per Category per day (subject to Consent notification limits). The Soul sees the Brand, the Yield amount, and the Category. They Claim or dismiss. If dismissed, the second-ranked Brand may be surfaced the next day.

A Soul never sees competing Brand names simultaneously for the same intent (to avoid a sponsored-results inbox aesthetic). The competitive dynamic is visible in the Yield amount — higher bids appear as higher Yield to the Soul.

**Consequences.** Brands compete on price (bid) and track record (Reputation). Reputation score decays if a Soul Claim does not result in a detected purchase (via next Harvest). This creates accountability: a Brand whose Offers are Claimed but not converted accumulates Reputation decay and must bid higher to maintain Exchange position.

---

## Section 4 — Intelligence Architecture (SoulMind)

### ADR-22 — On-device iOS SoulMind models over cloud LLM Agent SDK
**Status:** Accepted · Supersedes: ADR-22 through ADR-28 (Agent SDK / MCP / SKILL.md / zero-retention API) · **Source:** site (Harvest → Scoring → Insight, Flow 2)

**Context.** The prior ADR log accepted Claude Agent SDK, MCP connectors, and SKILL.md files (ADR-22 through ADR-25, ADR-27, ADR-28) as the intelligence layer. The site architecture runs all intelligence on the iOS device using native models — no cloud LLM API call is made for Scoring or Insight generation.

**Decision.** The intelligence layer is SoulMind: a suite of on-device iOS models (CoreML, Create ML, and custom Swift inference code) that run entirely within the Soul's device. No Transaktion data is transmitted to any cloud LLM for processing. SoulMind components:

1. **Semantic enrichment engine** (ADR-30) — resolves schema heterogeneity across sources, normalises merchants, infers categories, tags intent signals.
2. **Insight Scoring models** (ADR-23) — CoreML models compute propensity scores per Category from enriched Transaktions.
3. **Cross-source correlation engine** (ADR-24) — on-device pattern matching across Konnection types.
4. **Offer relevance ranker** (ADR-25) — on-device score used as input to Exchange matching.

The prior Agent SDK / SKILL.md / MCP / zero-retention-API decisions (ADR-22 through ADR-28) are superseded for the intelligence layer. PersonalOS Backend does not call any LLM API as part of the Harvest or Scoring pipeline.

**Consequences.** Requires iOS ML engineering capability (CoreML, Create ML, Swift). Models must be small enough to run on A12 Bionic (2018 iPhone XS minimum). Model updates are shipped via iOS app updates — the model version is stored in the `algorithm_version` field on Insight records for reproducibility. The `is_stale` flag on Insights enables background re-Scoring when a new model version ships without blocking the Exchange.

---

### ADR-23 — SoulMind CoreML Scoring models run on-device; no raw data to server
**Status:** Accepted · Supersedes: `consumer_dna.skill` · **Source:** site Flow 2

**Decision.** SoulMind's Scoring pipeline runs inside an iOS background task after each Harvest:
1. Fetch all Ledger shards for the Soul from Arweave via Irys.
2. Derive AES key from passkey; decrypt shards in memory (ephemeral — never persisted decrypted).
3. Run CoreML Scoring models on the decrypted Transaktion array.
4. Produce Insight scores: `[{category, score, confidence, computed_at}]`.
5. Apply differential-privacy noise (ADR-14).
6. Wipe decrypted data from memory.
7. `POST /souls/{soul_id}/insights` with noisy scores only.

The SoulProfile Depth Score (ADR-18, ADR-19) is also computed in step 4 and transmitted alongside Insights.

**Consequences.** Model latency must be acceptable for background execution on older devices. Models should target ≤5 seconds end-to-end on A12 Bionic for a 12-month Transaktion batch of ~500 records. Create ML enables iterative model improvement without re-writing the pipeline.

---

### ADR-24 — Cross-source semantic correlation on-device via SoulMind
**Status:** Accepted · Supersedes: ADR-24 (LLM cross-source correlation) · **Source:** site + ADR log insight

**Decision.** Cross-source correlations ("best glucose months = highest Whole Foods spend months," "travel months = highest steps") are computed on-device by SoulMind using temporal join logic against the enriched Transaktion array. No complex SQL joins required — the in-memory decrypted Ledger is the dataset; SoulMind iterates over it with pattern-matching rules.

Correlation rules are encoded as Swift logic in SoulMind, versioned alongside the Scoring models. New correlation rules ship in app updates.

**Consequences.** The insight "Your food spend and your health outcomes are directly correlated" emerges from the raw data on-device, not from a cloud model. This is both architecturally cleaner and privacy-preserving: PersonalOS never knows which correlations SoulMind discovered — only the resulting noisy Insight scores.

---

### ADR-25 — Listing matching: Consent + Yield floor + SoulMind score; semantic v2 on-device
**Status:** Accepted · Supersedes: `offer_match.skill` · **Source:** ADR log + site Exchange model

**Decision.** Offer matching is a two-layer process:
- **Server-side Exchange (gate):** matches Consents to Listings by Category, Yield floor, and score threshold. The Exchange operates on noisy Insight scores from the server database. This is the privacy-preserving, approximate matching layer.
- **On-device ranking (optional v2):** SoulMind can compute a richer relevance score for a received Offer using full unnoised Insight data — the score visible only to the Soul. In Phase 2, this on-device score is displayed to the Soul ("This Offer matches you at 96%") but is not transmitted to the Brand or Exchange.

Semantic v2: SoulMind uses embedding similarity (CoreML NaturalLanguage framework) to compare the Soul's inferred intent signals against Listing creative content. This enables relevance ranking beyond Category matching — a Listing for Patagonia is ranked above a Listing for fast fashion even if both are in `apparel.outdoor` — without transmitting fine-grained data to the server.

**Consequences.** The Exchange operates on noisy scores (privacy-preserving but approximate). The Soul's on-device ranking provides a richer, accurate relevance signal for their own display. This architecture gives the Soul more signal than the Exchange has — consistent with the "Soul is more informed than the Brand" product promise.

---

### ADR-26 — PostgreSQL / Supabase for metadata only; no raw Transaktions server-side
**Status:** Accepted · Supersedes: ADR-26 (Supabase as vault store) · **Source:** site data model

**Decision.** PersonalOS Backend uses PostgreSQL (Supabase) for all non-Transaktion data: `souls`, `konnections`, `categories`, `consents`, `insights`, `offers`, `claims`, `listings`, `brands`, `withdrawals`. The `transaktions` entity does not exist in PostgreSQL — it exists only as encrypted shards on Arweave. The server holds only the `arweave_ledger_hash` pointer on the `souls` row.

**Consequences.** The server database contains no sensitive personal data beyond email, passkey public key, and wallet address. A full server-side data breach exposes only metadata — no transaction history, no merchant names, no amounts, no behavioral profiles.

---

### ADR-27 — Harvest scheduler: cron + Plaid webhook; SoulMind Scoring triggered post-Harvest
**Status:** Accepted · Supersedes: ADR-27 (Agent SDK cron) · **Source:** site Flow 2 + ADR-27

**Decision.** Harvest is triggered by two mechanisms:
1. **Cron schedule:** every 6 hours per Konnection for active Souls.
2. **Plaid webhook:** real-time `DEFAULT_UPDATE` webhook fires within minutes of new transactions; triggers an immediate incremental Harvest.

PersonalOS Backend assembles the new Transaktion batch and pushes it to the Soul's iOS device via APNs background push. The iOS app performs SoulMind enrichment, encryption, Arweave write, and Scoring. Only the Arweave `tx_id` and updated Insight scores return to the server. No Agent SDK, MCP, or Memory MCP is involved in the Harvest or Scoring pipeline.

**Consequences.** Plaid webhook eliminates the 6-hour staleness window for financial data. APNs background push requires the iOS app to handle wakeup and background task completion reliably.

---

### ADR-28 — On-device intelligence replaces zero-retention cloud API
**Status:** Accepted · Supersedes: ADR-28 (zero-retention API tier over local Ollama) · **Source:** site Flow 2 and ADR-07

**Decision.** ADR-28 (original) accepted a zero-retention cloud LLM API as the intelligence layer, with privacy guaranteed by contract. This is superseded by the on-device SoulMind architecture (ADR-22 through ADR-25), where no LLM API call is made during Harvest or Scoring. The privacy guarantee returns to architectural: PersonalOS structurally cannot read Transaktion data because SoulMind never sends it.

Cloud LLM APIs may be used for non-Transaktion purposes (e.g., generating natural-language Insight narrative text from score deltas, with no raw data in the prompt) but this is a UI enhancement, not a core intelligence function.

**Consequences.** The marketing claim "we cannot read your data" is structurally true again, not merely contractual. Removes Anthropic API dependency from the critical intelligence path. Prior SKILL.md files (`consumer_dna.skill`, `offer_match.skill`, `finance_analysis.skill`) are retired as intelligence infrastructure; their logic is re-implemented in SoulMind CoreML models and Swift code.

---

## Section 5 — New ADRs (29–37)

### ADR-29 — Key-destruction as deletion for the Arweave Ledger
**Status:** Accepted · Supersedes: original ADR-09 · **Source:** ADR-29 (delta analysis, June 2026)

**Decision.** In a permaweb architecture, "deletion" means permanent inaccessibility through passkey destruction, not physical erasure of Arweave content. On Soul account deletion: server-side metadata purged from PostgreSQL; `arweave_ledger_hash` pointer removed; Soul instructed to delete passkey from iCloud Keychain. Encrypted shards remain on Arweave but become permanently inaccessible. Satisfies GDPR Recital 26. Legal confirmation required for India DPDP Act 2023 and CCPA jurisdictions prior to launch.

See the full ADR-29 document (June 2026) for the complete treatment.

---

### ADR-30 — SoulMind: on-device semantic curation layer before Ledger write
**Status:** Accepted — NEW · **Source:** instruction 9 (June 2026 synthesis session)

**Context.** Neither the prior ADR log nor the site architecture addresses what happens to raw data from heterogeneous sources — Plaid transactions, Google activity JSON, Apple Health XML, Uber CSV, MyChart FHIR, Instagram export — *before* it is encrypted and written to the Arweave Ledger. Each source uses different merchant naming conventions, category schemas, data formats, and semantic vocabularies. Plaid uses its own category taxonomy; Google uses activity types; Apple Health uses HealthKit quantity type identifiers; Uber uses trip records without merchant names.

Without a semantic curation layer, the Ledger contains incoherent, source-specific raw records that cannot be meaningfully correlated or Scored. The "$816 wasted on Adobe CC" insight cannot emerge from a Plaid `RECREATION > SUBSCRIPTION` category code alone — it requires knowing that `Adobe Creative Cloud` is a productivity subscription, that zero usage signals were found in the activity data, and that the annual cost is computable from the recurring monthly charge.

This semantic gap is the most important unaddressed architectural question in both prior documents.

**Decision.** SoulMind includes a **Semantic Curation Engine (SCE)** that runs on-device between raw source data ingestion and Arweave Ledger write. The SCE is the only component that reads raw plaintext Transaktion data. Its output — enriched, semantically tagged Transaktions — is what gets encrypted and written to the Ledger. The Ledger therefore contains semantically rich records, not raw source records.

The SCE performs six operations in sequence, all in an on-device sandboxed memory context:

**1. Schema normalisation.** Raw source payloads are mapped to a unified `SoulTransaktion` schema regardless of origin:

```
SoulTransaktion {
  id: uuid
  source: enum (plaid | setu_aa | google_activity | apple_health |
                 uber | amazon | instagram | mychart | ...)
  harvested_at: timestamp
  occurred_at: timestamp
  raw_ref: string          // source-specific ID — never transmitted
  amount_usd: decimal?     // nil for non-financial sources
  currency: string?
  merchant_raw: string?    // as received from source
  merchant_canonical: string?   // resolved by SCE
  category_raw: string?    // source-native category code
  soul_category: string    // SCE-assigned, from SoulMind taxonomy
  soul_tags: string[]      // SCE-inferred semantic tags
  intent_signals: string[] // inferred purchase-intent signals
  health_flag: bool        // true if derived from health source (ADR-15 gate)
  marketplace_eligible: bool // false if health_flag or ADR-15 exclusion
  use_limitation_tags: string[] // e.g. ["cfpb_1033"] for Plaid-sourced data
  confidence: float        // SCE confidence in enrichment
}
```

**2. Merchant resolution.** Raw merchant strings ("WHOLEFDS #1234 NYC 4920") are resolved to canonical names ("Whole Foods Market") using an on-device merchant resolution dictionary (bundled with the app, updated via app updates). Unknown merchants are passed through unresolved with `confidence: 0.0`. The dictionary contains the top 50,000 US and Indian merchants by transaction volume; a fallback fuzzy-match handles variants.

**3. Cross-source semantic tagging.** SCE applies semantic tags by correlating across simultaneously available source data. Examples:
- A Plaid subscription charge to "Adobe Creative Cloud" + zero Adobe-related activity in Google activity data → `soul_tags: ["subscription", "productivity_software", "zero_usage_signal"]`
- An Uber trip to a zip code containing a medical facility + an Apple Health step count spike → `soul_tags: ["transport", "health_adjacent_trip"]` (not `health_flag: true` — the trip is financial data; the correlation is a tag, not health data)
- A Plaid charge to "Amazon" at 11:04pm + no prior search activity for the item in Google data → `intent_signals: ["late_night_purchase", "impulse_pattern"]`
- A recurring monthly Plaid charge of consistent amount on the same day → `soul_tags: ["recurring_subscription", "billing_cycle_detected"]`

**4. SoulMind taxonomy assignment.** Each `SoulTransaktion` is assigned a `soul_category` from the SoulMind canonical Category tree, independent of the source's own category system. The SoulMind taxonomy is versioned (semver) and bundled with the app. Example mappings:
- Plaid `FOOD_AND_DRINK > RESTAURANTS` → SoulMind `dining.restaurant`
- Plaid `RECREATION > FITNESS_CLUBS` → SoulMind `health.fitness.gym`
- Google `YOUTUBE_WATCH > TUTORIAL` → SoulMind `entertainment.education.video`
- Apple Health `HKQuantityTypeIdentifierStepCount` → SoulMind `health.activity.steps`
- Uber `TRIP` to airport → SoulMind `travel.ground_transport.airport`

The SoulMind Category tree is a superset of the Exchange Category namespace. Exchange Categories (e.g., `automotive.new_vehicle_purchase`) are leaf nodes or aggregations of SoulMind taxonomy nodes.

**5. Use-limitation and compliance tagging.** The SCE applies regulatory use-limitation tags at ingestion time, not retroactively:
- All Plaid-sourced Transaktions under CFPB §1033 receive `use_limitation_tags: ["cfpb_1033"]`. The Exchange reads this tag and enforces that §1033-constrained data cannot be used for Listing matching beyond the disclosed purpose.
- Health-derived data receives `health_flag: true` and `marketplace_eligible: false` (ADR-15).
- India AA data receives `use_limitation_tags: ["rbi_aa"]`.

**6. Intent signal extraction.** Across the full Transaktion window (up to 12 months), the SCE infers intent signals that SoulMind Scoring models use to compute Insights:
- Researched-before-buy signal: Google search events temporally proximate (±7 days) to a large Plaid purchase in the same semantic category.
- Late-night impulse signal: Plaid charges between 22:00–02:00 local time correlated with no prior Google search for the merchant.
- Travel planning signal: Plaid charges to airlines or booking platforms + Google Maps searches for the destination city.
- Health trajectory signal: Apple Health metric trends correlated with dietary Plaid spending changes.

Intent signals are the bridge between raw multi-source data and SoulMind Scoring. They are the answer to: "how does PersonalOS know I'm a premium buyer?" — it knows because the SCE inferred it from the temporal and semantic patterns across your Transaktions, on your device, before anything was encrypted.

**Output.** The SCE outputs a `SoulTransaktion[]` array of enriched records. This array is immediately encrypted by AES-256-GCM (ADR-08) and written to Arweave (ADR-11). The plaintext array is zeroed from memory after encryption. PersonalOS Backend never sees it.

**Consequences.** The Ledger contains semantically rich, correlation-aware, regulatory-compliant records — not raw source dumps. All Scoring, Insight generation, and Offer matching operates on this enriched layer. The SCE is the most complex component in SoulMind and the primary differentiator of the product. Its merchant dictionary, taxonomy, and cross-source correlation rules are proprietary IP and must be protected accordingly. The SCE's output quality determines the quality of every Insight, every Archetype, and every matched Offer.

The SCE must handle missing data gracefully: if only Plaid is connected, it enriches financial data alone. If Apple Health is added later, the next Harvest run re-processes the health data and adds cross-source tags to existing financial Transaktions that can now be correlated. The Ledger is append-only, but Insight scores are recomputed on re-Scoring, so the enrichment of historical data is reflected in updated Insights without modifying existing Ledger shards.

---

### ADR-31 — WebAuthn passkey as Soul identity anchor and AES key derivation source
**Status:** Accepted · **Source:** site Flow 1 (Soul Onboarding) + absent from ADR log

**Decision.** The Soul's WebAuthn passkey, created at first onboarding and stored in iCloud Keychain Secure Enclave, serves dual purpose:
1. **Authentication:** passkey assertion proves Soul identity for all API calls and on-chain Claim signing (ERC-4337 UserOperation).
2. **Encryption key derivation:** AES-256-GCM key for all on-device Transaktion encryption is derived from the passkey via PBKDF2 (310,000 iterations, SHA-256, device-specific salt). The decryption key never leaves the Secure Enclave context.

Passkey is stored in iCloud Keychain, providing automatic cross-device sync across the Soul's Apple ecosystem without PersonalOS involvement.

**Open sub-questions.** Passkey recovery path if iCloud Keychain is lost: options include Social Recovery (trusted contacts hold key shards), a hardware security key backup, or accepting that Ledger data is permanently inaccessible if the passkey is lost (with this risk disclosed in onboarding). This must be decided before launch.

**Consequences.** The Soul onboarding sequence is: passkey creation → Smart Wallet provisioning (ADR-32) → first Konnection (ADR-02). Passkey creation must complete before any Harvest can occur. The design of the passkey creation UX — including explaining why a passkey is being created and what it protects — is a critical onboarding moment.

---

### ADR-32 — Coinbase Smart Wallet (ERC-4337) for Yield receipt
**Status:** Accepted · Supersedes: fiat coupon/cashback model · **Source:** site + ADR blended

**Decision.** Each Soul is provisioned a non-custodial Coinbase Smart Wallet on Base chain (ERC-4337 account abstraction) during onboarding. The wallet address is stored on the `souls` row. USDC Yield from Claim settlement is deposited directly to this wallet by the `BudgetEscrow.sol` smart contract atomically on Claim. PersonalOS never custodies Soul funds — the smart contract transfers directly from Brand escrow to the Soul's wallet.

The passkey (ADR-31) signs ERC-4337 UserOperations for Claim transactions — no separate crypto wallet seed phrase is required. The Soul's existing Apple ecosystem identity (Face ID / Touch ID backed passkey) is the key for both identity and wallet.

**Consequences.** Non-custodial: PersonalOS cannot access or freeze Soul wallets. Fiat off-ramp via Coinbase off-ramp flow (Coinbase-hosted; PersonalOS mediates only the session URL). Soul onboarding adds Smart Wallet provisioning as an async step after passkey creation. Gas fees for UserOperation submission are abstracted via a paymaster — PersonalOS sponsors gas for Claim transactions, recovering the cost from the platform fee.

---

### ADR-33 — USDC on Base chain as Yield settlement currency; `BudgetEscrow.sol`
**Status:** Accepted · Supersedes: fiat cashback / coupon model · **Source:** site

**Decision.** All Yield settlement uses USDC on Base chain. Brands fund Listings by depositing USDC into `BudgetEscrow.sol` on Base. On Claim, the contract atomically:
1. Verifies PersonalOS Backend signature + Soul passkey signature.
2. Checks escrow balance ≥ `bid_per_claim_usdc`.
3. Transfers `platform_fee_usdc` → PersonalOS fee wallet.
4. Transfers `yield_usdc` → Soul Smart Wallet.
5. Emits `ClaimSettled(listing_id, soul_wallet, yield_usdc, fee_usdc, tx_hash)`.

The smart contract makes the fee split and Yield deposit immutable and publicly auditable. PersonalOS structurally cannot alter the fee split or redirect Yield without deploying a new contract.

**Consequences.** Regulatory exposure: USDC settlement may trigger FinCEN money-services-business classification, state money-transmitter licensing requirements, and MiCA obligations in the EU. Legal review required before launch in each jurisdiction. Coinbase Smart Wallet's passkey-based signing model removes the need for Souls to understand private keys or seed phrases.

---

### ADR-34 — Blended settlement: USDC Yield (primary) + optional fiat Voucher (supplementary)
**Status:** Accepted · **Source:** ADR model (coupon/cashback) blended with site (USDC Yield)

**Decision.** The original ADR model described cashback and coupon rewards; the site uses pure USDC Yield. The blended model preserves both:

- **USDC Yield (primary, mandatory):** Every Claim settles USDC to the Soul's wallet via `BudgetEscrow.sol`. This is the blockchain-enforced, non-custodial, auditable payment that defines the product's value proposition. Minimum `yield_usdc` = Brand's `bid_per_claim_usdc` minus `platform_fee_usdc`.
- **Voucher (supplementary, Brand-optional):** A Brand may attach a Voucher to a Listing — a single-use discount code or promotional offer delivered after Claim. Vouchers are Brand-generated and Brand-controlled; PersonalOS mediates delivery via `voucher_delivery_webhook` but does not guarantee Voucher value. Voucher presence does not reduce the USDC Yield — it is additive.

The ADR model's concept of "matched offers / coupons" maps to the Voucher layer. The Yield layer is new from the site architecture. Together: a Soul Claims, receives USDC (guaranteed by smart contract) + optionally receives a Voucher (guaranteed by Brand).

**Consequences.** Brands who want to offer both a cash reward and a product discount can do so. The USDC Yield is the headline promise; the Voucher is a Brand marketing tool. Soul-facing UX shows: "Earn $4.50 USDC + $30 off your next Whole Foods order." Both are real; both are distinct settlement mechanisms.

---

### ADR-35 — Smart contract enforces fee split and Yield deposit; PersonalOS cannot redirect
**Status:** Accepted · **Source:** site (contracts.html)

**Decision.** `BudgetEscrow.sol` on Base chain encodes the platform fee split in immutable bytecode. The fee percentage and Yield calculation are not configurable by PersonalOS post-deployment — they require a new contract deployment, which is publicly observable on-chain. A `ConsentRegistry.sol` (roadmap) will encode which Categories a Soul has consented to, making Consent grants on-chain verifiable.

The site's framing: *"What separates 'trust us' from 'verify it.' The contracts on Base mean PersonalOS structurally cannot betray Souls."* This is the architectural complement to ADR-07's on-device processing — together they make the privacy and economic promises structurally enforced, not policy-dependent.

**Consequences.** Contract upgrade governance must be defined (multisig, timelock). Fee split changes require transparent on-chain notice. PersonalOS must publish contract addresses in-app and in documentation. Souls who understand blockchain can independently verify that every Claim correctly credited their wallet.

---

### ADR-36 — Arweave account model: shared (default) vs Soul-owned (opt-in)
**Status:** Accepted · **Source:** site data model (arweave_account_model field)

**Decision.** Two Arweave write models are supported, selectable by the Soul:

- **Shared (default):** PersonalOS writes encrypted Ledger shards via a shared Irys account. ~$100/year at 100k Souls. PersonalOS holds the Arweave write key but cannot decrypt the content (Soul holds the AES key via passkey). Simplest onboarding path.
- **Soul-owned (opt-in):** PersonalOS writes to the Soul's own Arweave wallet address, stored in `arweave_wallet_address` on the `souls` row. Higher per-transaction cost. The Soul's Ledger is fully platform-independent — accessible without PersonalOS, transferable to future systems. Maximum portability.

The `arweave_account_model` enum on the `souls` table records which model is active.

**Consequences.** Shared model is the default; Soul-owned model is an advanced opt-in for Souls who want maximum data sovereignty. The distinction should be explained clearly in the privacy settings screen, not buried in documentation.

---

### ADR-37 — Re-identification mitigation: k-anonymity floor + Insight noise
**Status:** Accepted · Supersedes: ADR-14 (Open) · **Source:** delta analysis + ADR-14

**Decision.** Two complementary mitigations address re-identification risk under permanent Arweave storage:

1. **On-device noise (ADR-14):** SoulMind applies calibrated Gaussian noise (ε ≤ 2.0 differential privacy) to Insight scores before transmission to PersonalOS Backend. The Soul sees their true unnoised Insights on-device; the server receives noisy scores.

2. **k-anonymity floor on server queries:** No PersonalOS Backend query against the `insights` or `souls` tables may return a result set that implies fewer than k=50 distinct Souls. The Exchange query for matching Souls against a Listing must return at minimum 50 results before an Offer is issued to any individual (or suppress Offers if the Category has fewer than 50 eligible Souls platform-wide). This prevents a Brand from using a highly specific Category to narrowly identify individuals.

Together: even if the Arweave encrypted Ledger is someday decrypted (which requires breaking AES-256-GCM), the re-identification risk from noisy scores transmitted to the server is bounded. And a Brand running queries through the Exchange cannot isolate individuals below the k=50 floor.

**Consequences.** The k=50 floor reduces marketplace efficiency for niche Categories in early growth phases — a Category with 49 eligible Souls generates no Offers until the 50th Soul joins. This is an acceptable cold-start constraint that improves naturally as the Soul base grows.

---

## Superseded decisions — complete map

| Earlier decision | Status | Superseded by |
|---|---|---|
| Live-API harvesting across platforms | Superseded | ADR-01 (multi-source Harvest) |
| Linear 5-step setup wizard | Superseded | ADR-06 (Insight feed onboarding) |
| Inference-based offer matching | Superseded | ADR-20 (intent-first Consent) |
| Local Ollama LLM | Superseded | ADR-22 (SoulMind on-device models) |
| Claude Agent SDK / MCP / SKILL.md as intelligence | Superseded | ADR-22 through ADR-25 (SoulMind) |
| Zero-retention cloud API tier | Superseded | ADR-28 (on-device replaces cloud API) |
| Supabase as vault/Ledger store | Superseded | ADR-11 (Arweave / Irys) |
| Local .wallet file vault | Superseded | ADR-10 + ADR-11 (Arweave Ledger) |
| Fiat cashback / coupon settlement | Superseded | ADR-33 + ADR-34 (USDC Yield + Voucher) |
| Immediate raw-file deletion | Superseded | ADR-29 (key-destruction as deletion) |
| `consumer_dna.skill` | Superseded | ADR-23 (SoulMind CoreML Scoring) |
| `offer_match.skill` | Superseded | ADR-25 (on-device Offer relevance) |
| ADR-14 (Open) | Accepted | ADR-14 + ADR-37 (DP noise + k-anonymity) |
| ADR-15 (Open) | Accepted | ADR-15 (health data excluded from marketplace) |
| ADR-19 (Open) | Accepted | ADR-19 (weighted two-axis Depth Score) |

---

## Open decisions (unresolved)

| # | Question | Owner |
|---|---|---|
| ADR-31 | Passkey recovery path if iCloud Keychain is lost | Engineering + Product |
| ADR-33 | FinCEN / money-transmitter / MiCA regulatory classification for USDC settlement | Legal |
| ADR-29 | DPDP Act 2023 and CCPA confirmation that key-destruction satisfies right to erasure | Legal |
| ADR-35 | Contract upgrade governance: multisig structure, timelock period | Engineering + Legal |
| ADR-30 | Merchant dictionary coverage for India-specific merchants (Setu AA source) | Data / Engineering |
| ADR-15 | Health data in marketplace policy — when and under what conditions is this revisited? | Product + Legal |

---

*This document supersedes `PersonalOS_ADR_Log.md` (28 ADRs, May 2026) and the implicit architectural decisions in `sudhir-patavardhan.github.io/PersonalOS/site/`. Consolidated June 2026 from the delta analysis session, Sharad Rao and Claude.*
