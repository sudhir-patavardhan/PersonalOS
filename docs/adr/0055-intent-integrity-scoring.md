# ADR-55: Intent Integrity Scoring — Anti-Gaming & Quality Assurance

**Status:** Accepted · **Source:** ADR-53 grill session Q9-Q11, Q29 (July 2026) · **Depends on:** ADR-51, ADR-53, ADR-54

---

## Context

ADR-53 introduces intent declarations where souls signal future purchase intent and earn premium bids (1.5-5x standard). This creates a gaming incentive: rational actors will declare high-value intents they have no real intention to follow through on, poisoning signal quality and eroding brand trust.

The existential risk to the intent marketplace is not technical failure — it is signal degradation. If 30% of "Ready" declarations are fake, brand conversion rates drop, brands reduce premium bids, the premium collapses, and the system reverts to passive consent only. PersonalOS becomes another Taboola — optimizing for clicks over genuine human interest.

ADR-55 defines the multi-layered defense system that ensures declared intent is genuine, verified, and trustworthy.

---

## Decisions

### 1. Intent Integrity Score (Per Declaration)

Every active intent declaration (Level 2 or 3) receives a continuously updated integrity score from 0-100, normalized to a 0.7-1.0 multiplier in the matching formula.

Five scoring components:

| Component | Weight | What It Measures |
|-----------|--------|------------------|
| **Cross-source signal alignment** | 30 | Do 2+ connected sources show activity consistent with declared intent? |
| **Historical follow-through rate** | 25 | This soul's track record of acting on past declarations |
| **Category base rate** | 15 | How often do declarations in this category convert across all users? |
| **Timing plausibility** | 15 | Does the declared window align with typical purchase cycles for this category? |
| **Soul tier bonus** | 15 | Platinum/Gold users get a trust baseline from ADR-54 |

### 2. Cross-Source Signal Alignment (30 points)

The primary verification layer. PersonalOS's structural moat — data never leaves the device, but on-device processing can detect whether connected sources show activity consistent with declared intent:

| Source | Signals Checked | Example for "Auto Purchase, 60 Days" |
|--------|----------------|--------------------------------------|
| **Plaid** | Transactions in category, loan applications, insurance quotes | Auto-related charges, dealer transactions |
| **Location** | Visits to relevant businesses | Dealership visits, test drive locations |
| **Amazon** | Purchases in adjacent categories | Car accessories, seat covers, charging cables |
| **Apple Health** | Activity pattern changes (indirect) | Weekend activity shifts suggesting lifestyle change |
| **Browsing/Instagram** | Content engagement in category | Auto content, review sites, comparison tools |

Scoring:
- 0 sources show alignment: 0 points
- 1 source shows alignment: 15 points
- 2+ sources show alignment: 30 points (full score)

Alignment is checked on-device. Only the alignment score (not raw data) leaves the device.

### 3. Historical Follow-Through Rate (25 points)

From ADR-54's follow-through calculation:
- `(verified_followthroughs / total_past_declarations) × 25`
- Minimum 3 past declarations required; before that, defaults to 12.5/25 (neutral)
- Decays toward recent performance: last 6 months weighted 2x vs. older history

### 4. Category Base Rate (15 points)

Platform-wide conversion rate for this category provides context:
- High-conversion categories (dining, grocery): base rate ~60% → 12-15 points
- Medium-conversion categories (electronics, fitness): base rate ~40% → 8-10 points
- Low-conversion categories (automotive, real estate): base rate ~25% → 5-8 points

This prevents the system from penalizing souls who declare intent in naturally low-conversion categories (car purchases take longer than grocery runs).

### 5. Timing Plausibility (15 points)

Does the declared window make sense for this category?
- Automotive declared for 60 days: Plausible (15 points)
- Automotive declared for 30 days: Unusual but possible (10 points)
- Dining declared for 60 days: Over-long for a typically impulsive category (8 points)
- Category matches soul's personal seasonal pattern: +3 bonus points

Plausibility baselines are operator-configurable per category.

### 6. Soul Tier Bonus (15 points)

| Tier | Bonus |
|------|-------|
| Standard | 5 points |
| Gold | 10 points |
| Platinum | 15 points |

Platinum souls have earned trust through sustained follow-through (ADR-54). Their declarations start with a higher integrity baseline.

### 7. Score Normalization

The raw integrity score (0-100) normalizes to a multiplier in the matching formula:

| Raw Score | Multiplier | Effect |
|-----------|-----------|--------|
| 80-100 | 1.0 | Full intent premium — high-confidence declaration |
| 60-79 | 0.9 | Slight discount — some uncertainty |
| 40-59 | 0.8 | Notable discount — limited verification evidence |
| Below 40 | Held from matching | Declaration held; operator review triggered |

Declarations below 40 are NOT rejected — they're held for operator review. The operator can approve (override), suspend (temporarily block), or request the soul connect additional sources.

### 8. Level Jump Adjustments

When a soul jumps directly from Level 0 to a higher level (ADR-53 §6):

| Jump | Initial Adjustment | Normalization |
|------|-------------------|---------------|
| 0→3 (Off to Ready) | 0.85x on integrity multiplier | Returns to 1.0x after first verified follow-through in that category |
| 0→2 (Off to Exploring) | 0.90x on integrity multiplier | Returns to 1.0x after 14 days of sustained engagement |
| 1→3 or 2→3 | No adjustment | Already demonstrated engagement at lower level |

### 9. Operator Escalation Triggers

Automated flags that trigger operator review in the Operator Console:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Integrity score below 40 | Any declaration | Held from matching; operator reviews |
| Sudden declaration spike | 3+ new Level 3 declarations in 24 hours from one soul | Flag for review; likely gaming |
| Premium-only targeting | Soul only declares in top-3 highest-premium categories, never lower-value ones | Pattern flag |
| Repeated 0→3 jumps without follow-through | 3+ direct jumps to Ready with no subsequent verified activity | Slot cap reduction |
| Cross-soul coordination | Multiple souls with similar declaration patterns from similar IP ranges/devices | Sybil/collusion flag |

Operator actions:
- **Approve**: Override flag, declaration enters matching pool
- **Suspend**: Temporarily block declaration (with notification to soul)
- **Revoke slots**: Reduce soul's maximum intent slots (severe gaming)
- **Warn**: Send educational notification to soul about follow-through impact on earning potential

### 10. Passive Verification Architecture

The critical design constraint: PersonalOS never sees raw user data. Verification happens on-device:

1. On-device processing scans connected sources for category-relevant activity
2. Device computes an alignment score (0-30) — a single number, not raw data
3. Alignment score is submitted to the server alongside the intent declaration
4. Server combines alignment score with the other four components to compute total integrity
5. Raw data never leaves the device; only the aggregated score is transmitted

This preserves the privacy architecture (ADR-07, ADR-28) while enabling verification.

### 11. Brand-Side Integrity (Cross-Brand Fraud Detection)

Beyond soul-side integrity, the system detects brand-side gaming (ADR-53 Q29):

**Reputation Bond**:
- Every brand deposits $1-5K refundable USDC beyond their listing escrow
- Bond amount scales with listing bid: higher bids require larger bonds
- Slashed on confirmed manipulation; refunded in full on clean exit

**Cross-Brand Pattern Detection**:
- Wallet address clustering: multiple brands funded from the same wallet
- Claim pattern analysis: same souls claiming across suspiciously similar brands
- Score trajectory analysis: brands with identical, synchronized score improvements
- Targeting anomaly: brands that exclusively target Ready/Platinum souls without any Open-level activity

**Consequences of confirmed brand gaming**:
- Bond slashed (partial or full depending on severity)
- Brand score reset to cold start (75, "New" badge)
- Operator may suspend brand account pending review
- Repeated violations: permanent platform ban

### 12. Sensitive Category Guardrails

The AI agent (ADR-53 §4) must not predict intent in sensitive categories without strong evidence:

**Sensitive categories** (hardcoded, operator-reviewable):
- Health conditions (beyond general fitness/wellness)
- Fertility and family planning
- Financial distress (debt, bankruptcy, collections)
- Mental health
- Legal services
- Addiction recovery

**Requirements before AI can suggest**:
- Soul has explicitly connected a relevant data source (e.g., Apple Health for health categories)
- Soul has 3+ prior data points showing activity in this category
- Soul has previously set Level 1+ engagement in this category at least once

If requirements are not met, the agent will never suggest these categories — even if cross-source data implies relevance.

---

## Consequences

The Intent Integrity Score creates a self-reinforcing quality loop: genuine intent declarations score high, earn premium bids, and build the soul's tier status (ADR-54). Fake declarations score low, get discounted or held, damage the soul's follow-through rate, and reduce their slot allocation. The cost of gaming exceeds the reward within 2-3 cycles.

For brands, the integrity score provides confidence that every intent-declared audience has been verified through multiple independent signals. This is the concrete mechanism behind the ad-waste thesis: brands pay premium for signals that have been verified, not just declared.

The on-device verification architecture ensures this quality layer operates without compromising the privacy promise. PersonalOS can verify intent quality without ever seeing the underlying data — the same structural advantage that makes the platform trustworthy makes it resistant to gaming.

---

> **See also:** ADR-53 (Intent Declaration), ADR-54 (Soul Tier System), ADR-51 (Brand Scoring)
