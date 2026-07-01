# ADR-40: Instagram BYOD export connector for interest and aspiration signals

**Status:** Accepted · **Source:** ADR-01 (multi-source Harvest), ADR-05 (Tier 3 onboarding)

**Context.** Instagram activity — follows, likes, saved posts, search history, and ad interaction — reveals interest patterns, aspirational preferences, and brand affinity that financial data alone cannot surface. A Soul who follows luxury travel accounts, saves Patagonia posts, and searches for "best hiking boots" has strong outdoor/adventure intent even if no related purchase has occurred yet. This pre-purchase intent signal is uniquely valuable for Exchange matching. Instagram (Meta) provides a GDPR/CCPA-compliant personal data download but no public API for individual data portability.

**Decision.** Instagram data is Harvested via Soul-initiated BYOD export. The flow:

1. **In-app prompt.** Surfaced as a Tier 3 prompt in the Insight feed (ADR-05), triggered after an interest-adjacent Insight fires or when the Depth Score would benefit from a social signal source (ADR-19 weights social at 10%). The prompt links to Instagram's data download page with instructions.
2. **Export request.** The Soul requests their data from Instagram (`accountscenter.instagram.com` → "Your information" → "Download your information"). Meta delivers a ZIP/JSON archive containing: `liked_posts.json`, `saved_posts.json`, `following.json` (accounts followed), `searches.json` (search history), `ads_interests.json` (Meta's interest categories), `ads_clicked.json`, and `comments.json`.
3. **Import.** The Soul shares the ZIP via iOS Share Sheet or in-app file picker. Parsed in sandboxed memory — no server upload.
4. **SoulMind enrichment.** The SCE (ADR-30) normalises Instagram's schema into `SoulTransaktion` records:
   - `following.json` → interest signals: accounts are categorised by SoulMind into interest clusters (e.g., following @patagonia, @rei, @nationalparks → `soul_tags: ["outdoor_lifestyle", "adventure_travel"]`)
   - `saved_posts.json` → stronger intent signal than likes (deliberate save = considered interest). Post content metadata is used for category assignment.
   - `searches.json` → intent signals: search terms are mapped to SoulMind categories and cross-referenced with financial Transaktions (e.g., Instagram search for "best running shoes" + Plaid charge at Nike within 14 days → `intent_signals: ["researched_before_buy"]`)
   - `ads_interests.json` → Meta's own interest categorisation is used as a secondary signal for SoulMind taxonomy assignment, not trusted as primary (Meta's categories are advertising-optimised, not Soul-optimised)
   - `ads_clicked.json` → brand affinity signals: which brands the Soul has engaged with in Meta's ad ecosystem
   - Raw post content, images, captions, and usernames of other accounts are **not** written to the Ledger. SoulMind extracts semantic tags and interest signals only — the Ledger stores derived interest categories, not social media content.
5. **Ledger write.** Standard Harvest pipeline (ADR-01). Raw Instagram export data zeroed after enrichment.

Instagram exports are periodic snapshots. The app prompts quarterly refresh via the Insight feed.

**Consequences.** Instagram data fills the "aspiration and interest" gap — it surfaces intent signals that precede financial transactions, making Offer matching more relevant before a purchase happens. This is the only source that captures pre-purchase brand affinity at scale. Content stripping is a deliberate privacy decision: the Ledger stores interest categories and intent signals, not social media activity logs, preventing social-graph reconstruction from a decrypted Ledger. SoulMind must maintain a parser for Meta's JSON export format, which changes periodically. The 10% Depth Score weight for social data (ADR-19) means Instagram alone has limited impact on Phase 2 gate, but combined with other Tier 3 sources it meaningfully moves the Depth Score. The manual BYOD flow limits freshness — acceptable for Tier 3, where the data provides directional interest signals rather than real-time intent.
