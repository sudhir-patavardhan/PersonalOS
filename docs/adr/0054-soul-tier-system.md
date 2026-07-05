# ADR-54: Soul Tier System — Standard, Gold, Platinum

**Status:** Accepted · **Source:** ADR-53 grill session Q7, Q8, Q25, Q28 (July 2026) · **Depends on:** ADR-20, ADR-25, ADR-47, ADR-53

---

## Context

ADR-53 (Intent Declaration & Predictive Matching) introduces premium matching pools where brands pay 1.5-5x standard bids for intent-declared audiences. Not all souls are equally valuable to brands: a soul who consistently declares genuine intent, connects multiple data sources, and follows through on declarations is worth significantly more than a new user with one source and no track record.

Without a tier system, brands cannot differentiate signal quality within engagement levels. A "Ready" declaration from a proven, multi-source soul should rank higher and earn more than a "Ready" declaration from a new, single-source user with no history. The tier system creates this differentiation while giving souls a clear progression path that rewards genuine engagement.

---

## Decisions

### 1. Three Tiers

| Tier | Threshold | Population Target |
|------|-----------|-------------------|
| **Standard** | Everyone starts here | ~60% of active souls |
| **Gold** | Top 30% composite score | ~25% of active souls |
| **Platinum** | Top 10% composite score | ~10% of active souls |

Tier thresholds are percentile-based, recalculated monthly. As the overall user base quality improves, the bar rises — this prevents tier inflation.

### 2. Composite Score (0-100)

Four weighted signals determine tier placement:

| Signal | Weight | What It Measures | Data Source |
|--------|--------|------------------|-------------|
| **Follow-through rate** | 40% | Did the soul act on declared intents? (purchase, brand engagement, offer claim within declared window) | Plaid transactions, Location visits, settlement history |
| **Data richness** | 30% | Number and diversity of connected sources | Connected source count: Plaid, Apple Health, Location, Amazon, Uber, Instagram |
| **Tenure + consistency** | 20% | Time on platform with sustained activity (not just registration age) | Account age × activity frequency (weekly active threshold) |
| **Settlement history** | 10% | Total claims processed, average response time to offers | Settlement records |

### 3. Scoring Details

#### Follow-Through Rate (40%)
- Measured per intent declaration: did verified activity in the declared category occur within the declared window + 30-day grace?
- "Verified activity" includes: Plaid transaction in category, location visit to relevant business, offer claim, Amazon purchase in category
- Score: `(verified_followthroughs / total_declarations) × 100`
- Minimum 3 declarations required before this signal activates; before that, score defaults to 50/100

#### Data Richness (30%)
| Connected Sources | Score |
|-------------------|-------|
| 1 source | 20 |
| 2 sources | 45 |
| 3 sources | 70 |
| 4 sources | 85 |
| 5+ sources | 100 |

Diversity bonus: +10 points if sources span 3+ categories (financial + health + location > financial + financial + financial)

#### Tenure + Consistency (20%)
- Base: `min(account_age_months × 8, 60)` — caps at 60 after ~8 months
- Consistency multiplier: `weekly_active_weeks / total_weeks_since_registration`
  - "Weekly active" = at least one offer viewed, consent adjusted, or source synced
- Score: `base × consistency_multiplier`
- Maximum: 100 (8+ months, 100% weekly activity)

#### Settlement History (10%)
- Volume component (60%): `min(total_settlements / 50, 1.0) × 60`
- Responsiveness component (40%): Average time from offer received to claim/dismiss
  - < 24 hours: 40 points
  - 24-72 hours: 25 points
  - 72+ hours: 10 points

### 4. Tier Multipliers on Intent Premium

Soul tiers stack multiplicatively on the IntentPremium from ADR-53:

| Tier | Multiplier on IntentPremium | Example: $2 bid, 3x IntentPremium |
|------|----------------------------|-----------------------------------|
| Standard | 1.0x | $2 × 3.0 × 1.0 = $6.00 per claim |
| Gold | 1.2x | $2 × 3.0 × 1.2 = $7.20 per claim |
| Platinum | 1.5x | $2 × 3.0 × 1.5 = $9.00 per claim |

Soul earnings (90% of claim): Standard = $5.40, Gold = $6.48, Platinum = $8.10.

### 5. Platinum Commitment Unlock

Platinum souls gain an exclusive feature: **commitment unlock** for brand access. Brands must deposit escrow specifically targeting the Platinum pool before their offers reach Platinum souls. This creates a velvet-rope dynamic:

- Brands know Platinum souls are the highest converters — worth the commitment
- Platinum souls know only serious, well-funded brands get through
- Creates aspiration for Gold souls to reach Platinum

### 6. Tier Visibility

- **Soul App**: Tier badge displayed on profile, with progress indicator showing distance to next tier and specific actions to improve (ADR-53 Q25: relative earning potential with actions)
- **Brand Portal**: Aggregate tier distribution visible in demand dashboard: "Ready in automotive: 12 Platinum, 35 Gold, 156 Standard"
- **Matching Engine**: Tier is a factor in composite score via the tier multiplier (not a hard gate — Standard souls still receive offers)

### 7. Tier Transitions

- Recalculated monthly based on trailing 90-day data
- **Promotion**: Immediate when composite score crosses threshold
- **Demotion**: 30-day grace period with notification ("Your Gold status is at risk — here's how to maintain it")
- **No demotion below Standard**: Standard is the floor, not a punishment tier

### 8. Cold Start

New souls (< 30 days) are Standard tier with a "New" indicator. Their composite score begins accumulating from day one. Typical path to Gold: 3-4 months with 3+ sources and consistent activity.

---

## Consequences

The tier system creates a dual incentive loop: souls are motivated to connect more sources and follow through on intents (improving data quality for the entire marketplace), while brands are motivated to bid higher for proven, high-tier souls (increasing soul earnings). This is a positive-sum flywheel — quality begets quality.

The percentile-based thresholds prevent tier inflation: as the user base grows and quality improves, the bar rises proportionally. This ensures Gold and Platinum always represent genuinely differentiated value.

---

> **See also:** ADR-53 (Intent Declaration), ADR-55 (Intent Integrity Scoring), ADR-51 (Brand Scoring)
