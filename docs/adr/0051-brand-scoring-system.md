# ADR-51: Brand Scoring System — Dynamic Reputation & Badge Assignment

**Status:** Accepted · Implemented · **Source:** ADR-51 grill session (July 2026) · **Depends on:** ADR-21, ADR-25, ADR-42

---

## Context

The PersonalOS marketplace needs a mechanism to differentiate brand quality. Without it, a brand with a history of unfilled escrows and low claim rates appears identical to a well-funded, high-converting brand. Souls cannot make informed decisions about which offers to accept, and the matching engine cannot prioritize quality supply.

ADR-21 defines a Reputation score for competitive bidding, but does not specify the computation model, contextual adjustments, or operator configurability. ADR-51 fills this gap with a complete scoring system.

---

## Decisions

### 1. Base Score (0-100) from Three Weighted Signals

| Signal | Weight | Computation |
|--------|--------|-------------|
| **Claim Rate** | 40% | Claims / total offers delivered in trailing 7-day window |
| **Bid Fairness** | 30% | Percentile rank of brand's bid within their category |
| **Escrow Health** | 30% | Runway tiers based on remaining escrow / bid rate, plus $50 absolute floor |

#### Escrow Health Tiers

| Remaining Runway | Score |
|------------------|-------|
| Below $50 absolute floor | 0 |
| < 10 claims remaining | 25 |
| 10-50 claims remaining | 50 |
| 50-200 claims remaining | 75 |
| 200+ claims remaining | 100 |

### 2. Trend Multiplier (0.9x - 1.2x)

Compares 7-day current performance vs. 30-day baseline:
- Requires 20 settlements in 30-day baseline + 3 in current 7-day window
- Ratio = (7d rate / 30d baseline rate)
- Clamped to [0.9, 1.2]

### 3. Contextual Multipliers

| Multiplier | Range | Trigger |
|------------|-------|---------|
| **Seasonality** | 0.8-1.2 | Category-specific monthly weights (8 categories × 12 months), operator-configurable |
| **Geography** | 1.0 or 1.1 | 10% boost when brand's declared markets match soul's region |
| **Cohort Affinity** | 1.0 or 1.1 | 10% boost when soul's consent patterns match a defined behavioral cohort |

### 4. Final Contextual Score

```
contextualScore = baseScore × trendMultiplier × seasonality × geography × cohortAffinity
```

Clamped to [0, 130] (contextual multipliers can push above 100).

### 5. Badge System

Single highest-priority badge assigned per brand, displayed on offer cards in Soul App:

| Badge | Priority | Threshold | Display |
|-------|----------|-----------|---------|
| **Trending** | 1 (highest) | Trend multiplier ≥ 1.10 | 🔥 Orange |
| **Seasonal Pick** | 2 | Seasonality multiplier ≥ 1.10 | 🌿 Emerald |
| **Popular Nearby** | 3 | Geography multiplier = 1.10 | 📍 Blue |
| **Repeat Favorite** | 4 (lowest) | Soul has 3+ prior settlements with this brand | 💜 Pink |

### 6. Cold Start

- New brands enter with base score **75/100** and a "New" indicator
- Graduate to full scoring algorithm after **20 settlements**
- No badge assigned during cold start
- Trend multiplier locked at 1.0 during cold start

### 7. Lazy Evaluation

Scores are computed on-demand at read time, not cached or scheduled. No cron jobs. This ensures scores always reflect current state and avoids stale data.

### 8. Operator Configurability

All scoring parameters are exposed in the Operator Console:
- **Weights tab**: Adjustable sliders for claim rate / bid fairness / escrow health (must sum to 100%)
- **Seasonality tab**: 8×12 editable grid with color-coded cells
- **Cohorts tab**: Behavioral cohort definitions with required consent categories and boost values
- **Badges tab**: Configurable thresholds for each badge type

Configuration stored as JSON, editable via Operator Console UI.

### 9. Integration with Matching Engine

Brand score feeds into the composite matching formula as `brandScoreFactor`:

```
brandScoreFactor = brand.contextualScore / 100  // normalized to ~0.0 - 1.3
composite = bid × soulReputation × recencyWeight × brandScoreFactor
```

Higher-scoring brands rank higher in matching, receiving priority access to souls.

### 10. Integration with ADR-53 (Intent Declaration)

Brand scores gate access to higher engagement levels:
- Level 1 (Open): Any active brand
- Level 2 (Exploring): Brand score 50+
- Level 3 (Ready): Brand score 70+ OR Trending badge
- Cold-start brands (score 75, "New"): Temporary Level 2 access for first 20 settlements

---

## Implementation Status

Implemented in `shared/scoring/` module:
- `types.ts`: Core type definitions
- `config.ts`: Default configuration with all grilling decisions
- `compute.ts`: Scoring engine (~180 lines)
- `index.ts`: Re-exports

Integrated into matching engine (`shared/matching/src/engine.ts`), Soul App offers page, and Operator Console management UI. 11 Vitest tests passing.

---

> **See also:** ADR-53 (Intent Declaration — score gates), ADR-54 (Soul Tier System), ADR-21 (Competitive Bidding)
