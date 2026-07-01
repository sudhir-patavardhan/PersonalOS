# ADR-39: Uber BYOD export connector for ride and mobility history

**Status:** Accepted · **Source:** ADR-01 (multi-source Harvest), ADR-05 (Tier 3 onboarding)

**Context.** Uber ride history reveals mobility patterns, commute behaviour, airport trips (travel intent), nightlife activity, and spending on ground transport. Combined with financial data from Plaid, Uber data enables cross-source correlations like "airport ride + airline charge = travel event" and "late-night ride + restaurant charge = dining-out pattern." Uber provides a GDPR/CCPA-compliant personal data download but no public API for individual data portability.

**Decision.** Uber data is Harvested via Soul-initiated BYOD export. The flow:

1. **In-app prompt.** Surfaced as a Tier 3 prompt in the Insight feed (ADR-05), triggered after a travel or mobility Insight fires (e.g., airport-proximate Plaid charges detected). The prompt links to Uber's data download page with instructions.
2. **Export request.** The Soul requests their data from Uber (`privacy.uber.com/privacy/exploreyourdata/download`). Uber delivers a ZIP archive containing JSON/CSV files: `trips.json` (ride history with pickup/dropoff coordinates, timestamps, fare), `rider_app_analytics.json`, and `payment.json`.
3. **Import.** The Soul shares the ZIP via iOS Share Sheet or in-app file picker. Parsed in sandboxed memory — no server upload.
4. **SoulMind enrichment.** The SCE (ADR-30) normalises Uber's schema into `SoulTransaktion` records:
   - `trips.json` → mobility Transaktions with `soul_category` assigned by trip pattern:
     - Trips to/from airports → `travel.ground_transport.airport`
     - Recurring weekday trips between same zones → `commute.regular`
     - Late-night trips (22:00–04:00) → `lifestyle.nightlife.transport`
     - Trips to medical facility zip codes → `soul_tags: ["health_adjacent_trip"]` (not `health_flag: true` — mobility data, not health data)
   - `payment.json` → cross-referenced with Plaid charges to deduplicate (Uber charge on Plaid + Uber trip detail = single enriched Transaktion)
   - Pickup/dropoff coordinates are used for semantic tagging only — raw coordinates are **not** written to the Ledger. SoulMind resolves coordinates to zone-level labels (e.g., "airport", "downtown", "residential") and discards precise GPS data before encryption.
5. **Ledger write.** Standard Harvest pipeline (ADR-01). Raw GPS coordinates zeroed with all other plaintext after encryption.

Uber exports are periodic snapshots. The app prompts quarterly refresh via the Insight feed.

**Consequences.** Uber data is uniquely valuable for mobility-pattern Insights that no other source provides — commute regularity, travel frequency, lifestyle signals. GPS coordinate stripping is a deliberate privacy decision: the Ledger stores zone-level semantic labels, not precise locations, preventing location-history reconstruction from a decrypted Ledger. SoulMind must maintain a parser for Uber's JSON format. The manual BYOD flow limits freshness — acceptable for Tier 3. Deduplication with Plaid charges requires SoulMind to match by amount and timestamp within a tolerance window (±2 hours, ±$0.50).
