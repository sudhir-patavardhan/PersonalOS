# PersonalOS — Domain Glossary

## Withdrawal

The act of a Soul moving Yield from their Wallet to an external destination. Withdrawals are processed in USDC stablecoin as the primary Payment Rail. Fiat off-ramps (Stripe/UPI) are secondary options. The domain is decoupled from any specific rail.

## Payment Rail

The external payment infrastructure used to process Withdrawals. Primary: USDC stablecoin on Base (Coinbase L2). Secondary: fiat rails (Stripe for US, UPI for India) via Coinbase's built-in on/off-ramp. Brands pay PersonalOS in fiat; PersonalOS converts to USDC before depositing Yield into a Soul's Wallet.

## Revenue Streams

PersonalOS earns through two mechanisms: (1) a take rate on every Claim — a percentage of the Brand's payment before Yield is deposited into the Soul's Wallet; (2) a Brand subscription for Exchange access. The take rate aligns platform incentives with Soul earnings — PersonalOS makes more when Souls make more.

## MVP Scope

The first version proves money moves end to end. Constraints: one Category (`financial.discretionary_spend`), one Provider (Plaid), one test Brand. A Soul connects their bank via Plaid, Transaktions Harvest into an E2E encrypted Ledger, local Scoring produces an Insight score, the Exchange matches to a Listing, the Soul receives and Claims an Offer, USDC Yield lands in their Coinbase Smart Wallet.

## Category

A named, versioned category of Insight defined and maintained by PersonalOS (e.g. `automotive.new_vehicle_purchase`, `travel.flight_intent`). Categories are the shared vocabulary between Souls (who grant Consents per Category) and Brands (who target Listings at a Category). Categories are owned by PersonalOS — Brands cannot define their own.

## Consent

A Soul's explicit consent for the Exchange to match them against Listings in a specific Insight category. A Consent includes a minimum Yield floor — the Exchange will not deliver an Offer unless the Listing's bid meets or exceeds that floor. A Soul has zero or more Consents, one per opted-in category. When a Soul revokes a Consent, all pending and delivered Offers in that Category expire immediately; Offers already in a seen state remain claimable for a 10-minute grace period before also expiring. Consent revocation is instantaneous from the Soul's perspective — no further matching occurs the moment the Consent is revoked.

## Depth

A measure of how complete and valuable a Soul's Ledger is. Higher Depth means richer Transaktions across more Konnections, which produces more accurate Insights and commands higher Yield floors. PersonalOS uses Depth to recommend minimum Yield floors when a Soul creates a Consent.

## Exchange

The marketplace where Brand Listings are matched to Souls based on their Insights. The Exchange runs continuous real-time matching — triggered both when a new Listing is posted (match against all eligible Souls) and when a Scoring completes (match that Soul against all active Listings). Brands list on the Exchange; Souls receive Offers from it. The Exchange is the core monetization platform of PersonalOS.

## Listing

What a Brand puts into the marketplace: a target Category, a bid price per Claim, creative content to show a matching Soul, and an optional Voucher. A Listing requires a pre-funded Budget in USDC held in escrow on Base. The Listing is active only while Budget remains. When a Claim is made, the Claim amount moves atomically from escrow to PersonalOS (fee) and the Soul's Wallet (Yield) via smart contract. One Listing produces many Offers.

## Budget

The USDC amount a Brand deposits into escrow on Base before a Listing goes live. A Listing is inactive without a Budget. As Claims are made, the Budget is drawn down. When the Budget is exhausted, the Listing deactivates automatically.

## Wallet

A Soul's on-chain USDC wallet on Base (Coinbase L2), provisioned automatically via Coinbase Smart Wallet when a Soul joins. Keys are custodied via passkey/biometrics — no seed phrase required. Yield is deposited directly on-chain. A Soul can export their wallet at any time, achieving full non-custodial sovereignty if they choose. PersonalOS cannot access a Soul's Wallet funds.

## Yield

The payment deposited into a Soul's Wallet when they make a Claim. Yield is the economic benefit a Soul receives in exchange for engaging with a matched Offer. PersonalOS takes a platform fee from the Brand's payment before depositing Yield.

## Claim

The act of a Soul accepting an Offer. A Claim is the billable event — it is what the Brand pays for. One Offer can produce at most one Claim. A Claim triggers atomic USDC settlement on Base: the Brand's Budget escrow splits into a PersonalOS platform fee and Yield deposited into the Soul's Wallet. Settlement confirms within ~2 seconds; the app displays success optimistically on tap and resolves to a confirmed state on-chain. The Soul receives a receipt showing the Yield earned, their updated Wallet balance, and the Voucher if one was included — the Category category is shown, not the Brand name. All Claims appear in the Soul's Claim history with date, Category, Yield amount, and running Wallet balance. After a Claim, Scoring monitors subsequent Harvests for matching purchases in the same Category category — if detected, the Soul's Conviction for that Category increases. There is no direct attribution between a Claim and a downstream purchase; the purchase signal alone is sufficient.

## Conviction

A per-Signal-Type measure of a Soul's track record as a real buyer in that category. Conviction increases when a Harvest detects a matching purchase Transaktion after a Claim in the same Category — regardless of whether that purchase was caused by the specific Listing. Conviction is a directional category-level signal, not strict attribution. Higher Conviction commands higher recommended Yield floors on the Exchange, making high-Conviction Souls more valuable to Brands bidding in that category. Conviction is computed during Scoring alongside Insights.

## Offer

What a Soul receives when their Insights match an active Listing. An Offer is specific to one Soul and one Listing — the same Listing will never re-match the same Soul, even after an Offer expires unused. A Soul may hold multiple simultaneous Offers across different Listings; they are presented as a feed ordered by Yield value descending. An Offer moves through a defined lifecycle: pending (created by Exchange, not yet pushed) → delivered (push notification sent) → seen (Soul opened the Offer in-app) → claimed (Soul accepted) or dismissed (Soul declined) or expired (72 hours elapsed from delivery without action, or Listing Budget exhausted). The expiry clock starts from delivery — not from when the Soul first opens the app. On expiry, the Budget allocation is released and the Exchange may match that Listing to another eligible Soul. A Soul seeing an Offer reveals nothing to the Brand; only a Claim does. A dismissed Offer is indistinguishable from a seen Offer from the Brand's perspective. When a Soul dismisses Offers in the same Category category 3 or more times within 30 days, the app prompts them to raise their Yield floor for that category — turning a pattern of negative engagement into a Consent refinement opportunity rather than a silent signal.

## Voucher

An optional discount, promo code, or access offer included by a Brand in a Listing's content. When a Soul Claims an Offer, they receive the Voucher alongside their Yield. A Voucher is a marketing asset — it gives the Soul tangible value beyond Yield and incentivises a real purchase. Voucher codes are non-unique per Soul; PersonalOS does not track Voucher redemption. Whether the Soul redeems the Voucher is irrelevant to Conviction — only the downstream purchase Transaktion detected via Harvest matters.

## Brand

A company or advertiser that bids to reach Souls with relevant Insights. A Brand is the buyer in the PersonalOS marketplace. Brands bid for the right to make an Offer to a matching Soul — they never receive raw Transaktions or Insight scores. A Brand only learns a Soul responded to an Offer, nothing more. A Brand's dashboard shows aggregate Listing performance only: Claims count, total USDC spent, Budget remaining, Offers delivered, and aggregate claim rate (Offers delivered ÷ Claims). No Soul-level data is ever exposed. A funded Budget is a Brand's only credential — no KYB or identity verification is required. Listing content is reviewed before activation to prevent fraudulent Offers.

## Insight

A derived signal computed from a Soul's Ledger during a Scoring. An Insight represents a Soul's propensity toward a particular product, service, or category — it is never a raw Transaktion. Insights are the only thing the Exchange ever acts on. Raw Transaktions remain in the Ledger and are never exposed externally.

## Scoring

The process of recomputing a Soul's Insights and Conviction scores from their Ledger. A Scoring is triggered when a Harvest adds enough new Transaktions to meaningfully change the Soul's Depth. One Scoring updates all Insights and all per-Signal-Type Conviction scores for that Soul. Scoring turns harvested raw data into actionable signals — only the resulting scores leave the device.

## Ledger

The secure, append-only store of all Transaktions belonging to a Soul. Each Soul has exactly one Ledger. Transaktions are end-to-end encrypted with the Soul's passkey (iCloud Keychain-backed on iOS) and stored permanently on Arweave via Irys bundling. PersonalOS never holds or reads the ciphertext. The Soul's device decrypts the Ledger locally; Scoring runs on-device against the decrypted data; only Insight scores leave the device. The Ledger is the canonical record of a Soul's data — nothing is deleted, only superseded.

## Soul

The individual whose data lives in PersonalOS. A Soul owns their Konnections and all Transaktions produced by them. The term encodes the platform's core value: personal data is a fundamental expression of a person's identity, not a corporate asset.

## Harvest

The act of pulling new Transaktions from a Provider through a Konnection into the Ledger. A Harvest runs automatically on a schedule and can also be triggered manually by a Soul. Each Harvest enriches the Ledger, which in turn improves Insights and can increase the Soul's Depth and recommended Yield floors.

## Transaktion

A single raw data record that flows in through a Konnection (e.g. a bank transaction, an email, a step count reading). A Transaktion is typed by its source (e.g. `bank_transaction`, `email`) and is immutable once ingested. One Konnection produces many Transaktions. Transaktions enter the Ledger only via a Harvest.

## Provider

An external third-party service that PersonalOS integrates with to pull Transaktions (e.g. Plaid for financial data, Google for Gmail). A Konnection is always backed by exactly one Provider. The Provider defines what Transaktion types it produces.

## Konnection

A user's authorized link to a single external data source (e.g. a Chase bank account via Plaid, a Gmail account via Google OAuth). A Konnection has a lifecycle: established → syncing → disconnected. One user may have many Konnections. A Konnection is not the external service itself — it is the user's relationship to it.
