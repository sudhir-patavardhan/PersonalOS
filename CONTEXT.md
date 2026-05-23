# PersonalOS — Domain Glossary

## Platinum

A premium Soul subscription tier. Platinum Souls have verified higher Depth, making their Insights more accurate and valuable. The Exchange exposes Platinum Souls to higher-value Listings not available to standard Souls. Brands pay a premium bid to target Platinum Souls exclusively. The subscription fee is designed to be offset by higher Yield earned through premium Listings.

## Revenue Streams

PersonalOS earns through three mechanisms: (1) a take rate on every Claim — a percentage of the Brand's payment before Yield is deposited into the Soul's Wallet; (2) a Brand subscription for Exchange access; (3) a Platinum Soul subscription fee. The take rate aligns platform incentives with Soul earnings — PersonalOS makes more when Souls make more.

## Signal Type

A named, versioned category of Insight defined and maintained by PersonalOS (e.g. `automotive.new_vehicle_purchase`, `travel.flight_intent`). Signal Types are the shared vocabulary between Souls (who grant Permits per Signal Type) and Brands (who target Listings at a Signal Type). Signal Types are owned by PersonalOS — Brands cannot define their own.

## Permit

A Soul's explicit consent for the Exchange to match them against Listings in a specific Insight category. A Permit includes a minimum Yield floor — the Exchange will not deliver an Offer unless the Listing's bid meets or exceeds that floor. A Soul has zero or more Permits, one per opted-in category.

## Depth

A measure of how complete and valuable a Soul's Ledger is. Higher Depth means richer Transaktions across more Konnections, which produces more accurate Insights and commands higher Yield floors. PersonalOS uses Depth to recommend minimum Yield floors when a Soul creates a Permit.

## Exchange

The marketplace where Brand Listings are matched to Souls based on their Insights. The Exchange runs continuous real-time matching — triggered both when a new Listing is posted (match against all eligible Souls) and when a Cultivation completes (match that Soul against all active Listings). Brands list on the Exchange; Souls receive Offers from it. The Exchange is the core monetization platform of PersonalOS.

## Listing

What a Brand puts into the marketplace: a target Insight category, a bid price, and the content to show a matching Soul. A Listing is active until its budget is exhausted or it is withdrawn. One Listing produces many Offers.

## Wallet

A Soul's store of accumulated Yield within PersonalOS. A Soul has exactly one Wallet. The Wallet balance can be withdrawn or held. It grows only through Claims.

## Yield

The payment deposited into a Soul's Wallet when they make a Claim. Yield is the economic benefit a Soul receives in exchange for engaging with a matched Offer. PersonalOS takes a platform fee from the Brand's payment before depositing Yield.

## Claim

The act of a Soul accepting an Offer. A Claim is the billable event — it is what the Brand pays for. One Offer can produce at most one Claim. A Claim triggers a payment to the Soul.

## Offer

What a Soul receives when their Insights match an active Listing. An Offer is specific to one Soul and one Listing. The Soul decides whether to engage — there is no obligation. A Soul seeing an Offer reveals nothing to the Brand; only engagement does.

## Brand

A company or advertiser that bids to reach Souls with relevant Insights. A Brand is the buyer in the PersonalOS marketplace. Brands bid for the right to make an Offer to a matching Soul — they never receive raw Transaktions or Insight scores. A Brand only learns a Soul responded to an Offer, nothing more.

## Insight

A derived signal computed from a Soul's Ledger during a Cultivation. An Insight represents a Soul's propensity toward a particular product, service, or category — it is never a raw Transaktion. Insights are the only thing the Exchange ever acts on. Raw Transaktions remain in the Ledger and are never exposed externally.

## Cultivation

The process of recomputing a Soul's Insights from their Ledger. A Cultivation is triggered when a Harvest adds enough new Transaktions to meaningfully change the Soul's Depth. One Cultivation updates all Insights for that Soul. Cultivation turns harvested raw data into actionable signals.

## Ledger

The secure, append-only store of all Transaktions belonging to a Soul. Each Soul has exactly one Ledger. The Ledger is the canonical record of a Soul's data — nothing is deleted, only superseded. A Soul controls what leaves their Ledger.

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
