# ADR-38: Amazon BYOD CSV connector for purchase and browsing history

**Status:** Accepted · **Source:** ADR-01 (multi-source Harvest), ADR-05 (Tier 3 onboarding)

**Context.** Amazon is one of the highest-signal commerce data sources — purchase history, browsing patterns, wishlist activity, and subscription state reveal durable spending preferences and intent signals. Amazon does not offer a public API for personal data access. The EU Digital Services Act and GDPR Article 20 (data portability) require Amazon to provide machine-readable exports, but the mechanism is manual: the Soul must request their data via Amazon's "Request My Data" page and receive a ZIP archive of CSV files days later.

**Decision.** Amazon data is Harvested via Soul-initiated BYOD (Bring Your Own Data) CSV import. The flow:

1. **In-app prompt.** Surfaced as a Tier 3 "deepen your SoulProfile" prompt inside the Insight feed (ADR-05), triggered after a relevant purchase-related Insight fires (e.g., late-night spend pattern from Plaid). The prompt links to Amazon's data request page with step-by-step instructions.
2. **Export request.** The Soul requests their data from Amazon (`amazon.com/gp/privacycentral/dsar/preview.html`). Amazon delivers a ZIP archive to the Soul's email within 1–30 days containing CSVs: `Retail.OrderHistory.csv`, `Retail.CartItems.csv`, `PrimeVideo.WatchHistory.csv`, `Audible.Library.csv`, `Search-Data/Search-Queries.csv`, and others.
3. **Import.** The Soul shares the ZIP file with PersonalOS via the iOS Share Sheet or in-app file picker. The iOS app unzips and parses in a sandboxed memory context — no server upload.
4. **SoulMind enrichment.** The SCE (ADR-30) normalises Amazon's CSV schema into `SoulTransaktion` records:
   - `Retail.OrderHistory.csv` → financial Transaktions with `merchant_canonical: "Amazon"`, per-item `soul_category` assignment, `amount_usd` from order total
   - `Search-Data/Search-Queries.csv` → intent signals: search terms are cross-referenced with subsequent purchases to detect researched-before-buy patterns
   - `PrimeVideo.WatchHistory.csv` → entertainment Transaktions with `soul_category: entertainment.video.streaming`
5. **Ledger write.** Enriched records are encrypted and written to Arweave per the standard Harvest pipeline (ADR-01). Plaintext CSV data is zeroed from memory after encryption.

Amazon exports are not real-time — they are periodic snapshots. The app tracks the most recent import timestamp and prompts the Soul to refresh quarterly via the Insight feed.

**Consequences.** Amazon purchase history is extremely high-value for commerce-related Insights and Offer matching — it fills the gap between Plaid's merchant-level charges (which show "Amazon" but not what was bought) and actual item-level purchase intent. SoulMind must maintain a parser for Amazon's CSV format, which Amazon may change without notice. The manual export flow introduces friction (days of latency, email-based delivery) that limits freshness — acceptable for Tier 3, where the data deepens the profile but is not required for core Insights. No API key, OAuth, or ongoing connection is needed — each import is a one-shot file ingestion.
