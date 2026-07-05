# ADR-53: Intent Declaration & Predictive Matching

**Status:** Accepted · **Source:** ADR-53 grill session (July 2026) · **Depends on:** ADR-20, ADR-21, ADR-25, ADR-42, ADR-46, ADR-47, ADR-51

---

## Context

PersonalOS's existing marketplace operates on passive consent: a Soul grants category-level consent, the Exchange matches them to Brand Listings, and offers arrive reactively. This model already eliminates intermediary waste (ADR-33, ADR-35) and delivers consent-verified audiences (ADR-20).

However, the $500B+ digital ad waste problem (ANA/WFA: <44% of programmatic spend reaches consumers) is not just an intermediary problem — it is an *inference* problem. Brands pay for probabilistic matches against stale behavioral signals. PersonalOS can go further: let Souls proactively declare future purchase intent, and let an AI agent predict likely intent from cross-source historical patterns. Brands then bid against *declared, verified demand* rather than inferred interest.

This transforms the marketplace from "brands search for consumers" to "consumers signal demand, brands respond." Conversion rates move from 3-8% (Meta lookalike audiences) to 40-60% (verified intent-declared audiences), while brand cost per action drops from $30-80 to $2-8.

---

## Decisions

### 1. Four-Level Engagement Model (replaces ADR-20 binary consent)

The binary consent model ("consented" or "not") is replaced by a progressive four-level engagement scale per category:

| Level | Name | Meaning | Brand Access | Bid Multiplier |
|-------|------|---------|--------------|----------------|
| 0 | **Off** | No engagement | Invisible to brands | None |
| 1 | **Open** | "I'm okay hearing from brands here" | Any active brand | Standard (1.0x) |
| 2 | **Exploring** | "I'm actively researching this category" | Brands with score 50+ | 1.5-2x premium |
| 3 | **Ready** | "I'm planning to act in 30-60 days" | Brands with score 70+ or Trending badge | 2-5x floating premium |

- Level 1 (Open) is equivalent to ADR-20's existing consent grant. All existing consent behavior is preserved.
- Levels 2-3 are new intent declaration layers that create premium matching pools.
- Each level requires a yield floor (inherited from Level 1 if not overridden).
- Soul App UX: slider or segmented control per category. Sliding right increases earning potential.

### 2. Unit of Intent

A declaration at Level 2 or 3 includes:
- **Category** (from the existing taxonomy, ADR-49)
- **Behavioral state** ("Exploring" or "Ready")
- **Time window** (30 or 60 days, user-selected)
- **Optional budget signal** ("under $1K / $1-5K / $5K+" — not required)

### 3. Dynamic Slot Cap

Souls have a limited number of Level 2-3 intent slots to preserve signal quality:

- **Base allocation**: 3 slots for new users
- **Earned expansion**: Up to 7 slots based on historical follow-through rate
- **Seasonal expansion**: +2-4 bonus slots during detected personal spending peaks (automatic from Plaid/transaction history)
- **Manual override**: Soul can request additional slots; system approves based on follow-through history
- **Maximum**: ~11 slots during peak season for a high-trust Platinum soul

### 4. AI-Predicted Intent

The personal AI agent (Know Yourself, weekly digest) suggests likely upcoming intent based on:
- Historical patterns: same-period spending from prior years
- Last 60 days of digital footprint across connected sources
- Seasonality and cultural context (Diwali, Chinese New Year, Black Friday — personalized to the individual)
- Industry and brand trend-lines
- Cross-source correlation (Plaid + Health + Location + Amazon)

**Activation**: AI predictions surface as pre-filled intent cards in the weekly digest. User must confirm with a single tap ("Yes, activate" / "Not now"). No prediction auto-activates — the soul always gates.

**Feedback on wrong predictions**: Three quick-tap dismiss options:
- "Not interested" → agent deprioritizes category
- "Not now" → agent retries in 60 days
- "Never suggest this" → permanent block for this category

**Sensitive category guardrails**: Categories that could be sensitive (health conditions, fertility, financial distress) require 3+ historical data points AND prior activity before the agent will suggest them.

### 5. Intent as Pre-Consent Fast-Track

Intent (Level 2-3) is NOT automatic consent. It signals openness. The relationship:

- **Level 1 (Open)** = consent gate (unchanged from ADR-20)
- **Level 2-3** = intent signal that fast-tracks the claim flow when offers arrive
- If a soul sets Level 2-3 on a category without an existing Level 1 consent, the system auto-prompts: "Enable automotive consent to receive premium offers?"
- **Research mode**: Souls experiencing notification fatigue can downshift Level 3→2, which reduces direct offers to aggregate information only

### 6. Level Transitions

- Souls may jump directly from Level 0 to Level 3 (no sequential progression required)
- Direct jumps receive an Intent Integrity Score adjustment (see ADR-55):
  - 0→3 jump: 0.85x integrity multiplier (normalizes after first follow-through)
  - 0→2 jump: 0.90x integrity multiplier
  - 1→3 or 2→3: full integrity (1.0x)
- Guidance system shows relative earning potential: "Connect a financial source → +15% earning boost" — actionable, not gamified

### 7. Intent Expiry Management

- At 75% of declared window (day 45 of 60), AI agent checks in with cross-source context:
  - "Your auto research has been active 55 days. Your Plaid data shows a dealer visit last week."
  - Three response options: "Still looking" (extends 30 days) / "Found something" (closes, logs follow-through) / "Changed plans" (closes, no penalty)
- No response within 5 days → auto-expire with notification: "Your auto intent has paused. Tap to reactivate."

### 8. Matching Engine Integration

The existing composite formula (ADR-21, ADR-25) gains two new factors for intent-declared matches:

```
// Passive match (Level 1 — unchanged):
Composite = Bid × Reputation × Recency × BrandScoreFactor

// Intent-declared match (Level 2-3):
Composite = Bid × IntentPremium × Reputation × Recency × BrandScoreFactor × IntentIntegrity
```

- **IntentPremium** (1.5x-5x): Floating market premium based on supply/demand per category. Minimum floor: 1.5x. Operator-configurable.
- **IntentIntegrity** (0.7-1.0): Normalized fraud score from ADR-55. High-integrity declarations get full value; suspicious ones are discounted.

Soul tier multipliers (ADR-54) stack on IntentPremium:
- Standard soul: base premium
- Gold soul: 1.2x on top of premium
- Platinum soul: 1.5x on top of premium

### 9. Brand Portal Integration

- **Aggregate Demand Dashboard** (Tier 1, free): Shows verified intent volume by category, region, and engagement level:
  ```
  Automotive — Northeast — July 2026
  ├── Ready:      47 verified souls  | Avg conversion: 52%
  ├── Exploring: 203 verified souls  | Avg conversion: 28%
  ├── Open:    1,400 souls           | Avg conversion: 8%
  └── Total addressable: 1,650 souls
  ```
- Conversion benchmarks progress: platform-wide → category-specific → brand-personalized as data accumulates
- **Intent Premium Toggle**: Existing listings gain a toggle to participate in intent-declared matching at market premium. Split performance view: "Passive: 12 claims, 8% | Intent: 34 claims, 52%"
- **Brand score gates access** to higher engagement levels (see §1 table). Score-gated access protects premium souls from low-quality brands.

### 10. Brand-Side Anti-Gaming

- Brands must deposit a **reputation bond** ($1-5K refundable USDC) beyond listing escrow
- **Automated cross-brand pattern detection** flags:
  - Multiple brands from same wallet address or funding source
  - Suspiciously overlapping claim patterns across "different" brands
  - Sudden score spikes from dormant brands
  - Brands exclusively targeting Ready souls
- Bond is slashed on confirmed manipulation; automated detection triggers operator review

### 11. North Star Metric

**Intent-to-Action Conversion Rate (IACR)** with trailing window:
- **Primary**: Follow-through within declared window (30-60 days)
- **Extended**: Follow-through within window + 30-day grace period
- **Engagement Rate**: Verified research activity during window (store visits, comparisons, offer claims)

Target: "52% converted within window, 68% within extended window, 84% showed verified engagement."

---

## Cross-ADR Impact

| ADR | Change Required |
|-----|----------------|
| ADR-20 | Rewrite: "Consent = declared intent" becomes four-level engagement model. Level 1 = existing consent behavior (preserved). |
| ADR-21 | Add IntentPremium × IntentIntegrity factors to composite formula. Soul tier multipliers stack. |
| ADR-25 | Add third matching mode: intent-declared matching alongside passive consent and scoring-triggered discovery. |
| ADR-42 | Add engagement-level access gates by brand score (none / 50+ / 70+). Cold-start brands get temporary Level 2 access. |
| ADR-46 | Add Aggregate Demand Dashboard module + intent premium toggle on listings + split performance view. |
| ADR-47 | Add engagement level control per category (slider/segmented control) in Soul App. |

**New supporting ADRs:**
- **ADR-54**: Soul Tier System — Standard/Gold/Platinum composite scoring and progression
- **ADR-55**: Intent Integrity Scoring — automated fraud detection, passive verification, operator escalation

---

## Consequences

PersonalOS moves from a reactive consent marketplace to a predictive intent marketplace. The ad-waste thesis sharpens: brands no longer pay for inferred interest — they pay for declared, verified, time-bounded demand from identified (but privacy-preserved) humans. The structural moat deepens: no single platform (Meta, Google, Apple, Amazon) can assemble the cross-source data synthesis needed for accurate intent prediction, because each owns only one data silo. PersonalOS can, because the user brings their own data from every source.

The engagement level model creates a dual-sided quality flywheel: souls earn tier status through genuine behavior, brands earn access through quality performance. Both sides are incentivized to be real. This is the structural antidote to the Taboola/Outbrain degradation pattern.

---

> **See also:** ADR-54 (Soul Tier System), ADR-55 (Intent Integrity Scoring), ADR-51 (Brand Scoring System)
