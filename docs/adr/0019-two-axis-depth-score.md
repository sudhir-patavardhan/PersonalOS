# ADR-19: Two-axis Depth Score: breadth × depth; financial data weighted 2×

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
