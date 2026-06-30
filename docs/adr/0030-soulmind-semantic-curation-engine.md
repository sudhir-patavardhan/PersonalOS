# ADR-30: SoulMind: on-device semantic curation layer before Ledger write

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
