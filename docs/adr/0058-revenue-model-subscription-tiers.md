# ADR-58: Revenue Model & Subscription Tiers

**Status:** Accepted · **Source:** Architecture stress-test Q11-12, user journey grilling (July 2026) · **Depends on:** ADR-33, ADR-35, ADR-42, ADR-53, ADR-54

---

## Context

PersonalOS has a single revenue stream today: a platform fee on each claim settlement (ADR-33, ADR-35). This fee is encoded immutably in the smart contract — structurally trustworthy but structurally fragile. A single revenue stream tied to settlement volume means:

1. **Revenue = 0 when claim volume = 0.** Cold start, seasonal dips, and category deserts produce zero revenue while operational costs continue.
2. **No recurring baseline.** Every month starts from zero — there is no predictable floor to plan against.
3. **Misaligned growth incentives.** The only way to grow revenue is to push more claims, which could pressure the platform toward engagement-maximizing rather than trust-maximizing behavior.

The architecture stress-test (Q11-12) established that PersonalOS needs three revenue streams: settlement fees (existing), soul subscriptions (new), and brand subscriptions (new). The user specified: "We should have fees both coming from soul members as subscription and brands as annual fees — obviously brands pay a lot more than souls."

This ADR formalizes the complete revenue model.

---

## Decisions

### 1. Three Revenue Streams

| Stream | Source | Nature | % of Revenue (Steady State) |
|--------|--------|--------|----------------------------|
| **Settlement Fee** | Per-claim deduction | Transactional | ~50-60% |
| **Soul Pro** | Monthly subscription | Recurring | ~10-15% |
| **Brand Tiers** | Monthly subscription | Recurring | ~25-35% |

The settlement fee remains the primary revenue engine. Subscriptions provide a recurring baseline that covers infrastructure costs even during low-volume periods.

### 2. Settlement Fee (Existing — Amended)

The immutable on-chain fee split from ADR-35 is preserved. This ADR amends the fee parameters:

- **Ceiling:** 10% of claim value (immutable, encoded in contract bytecode)
- **Configurable floor:** 5-10%, operator-adjustable via the Operator Console (ADR-45)
- **Default:** 10% for standard claims, 8% for intent-premium claims (Level 2-3), 5% for Platinum-tier-to-Platinum-brand claims

The reduced fee on high-value claims incentivizes both sides to level up — souls toward Platinum, brands toward higher scores — which improves marketplace quality.

**Contract implementation:** The fee ceiling (10%) is immutable. The operator sets the active rate within the [5%, 10%] range via a time-delayed governance call (48-hour delay per ADR-45). Rate changes are logged on-chain and visible to all participants.

### 3. Soul Subscriptions — Free + Soul Pro

All souls start free. The free tier includes everything needed for the core value proposition: data ownership, consent management, earning from claims, and the Know Yourself weekly digest.

#### Free Tier (Default)

| Feature | Included |
|---------|----------|
| Data source connections | Up to 3 sources |
| Engagement levels | Level 0-2 (Off, Open, Exploring) |
| Intent declarations | 2 active slots |
| Know Yourself digest | Weekly summary |
| AI predictions | Basic (top 3 categories) |
| Claim earnings | Standard (90% of claim value at 10% fee) |
| Wallet & withdrawals | Full access, no restrictions |

#### Soul Pro — $4.99/month

| Feature | Upgrade |
|---------|---------|
| Data source connections | Unlimited |
| Engagement levels | Level 0-3 (including Ready) |
| Intent declarations | Up to 7 base slots (+ earned expansion per ADR-53) |
| Know Yourself digest | Daily micro-insights + weekly deep dive |
| AI predictions | Full cross-source predictions with confidence scores |
| Claim earnings | Standard (same 90% split — Pro does not change the on-chain fee) |
| Priority matching | Pro souls surface first in same-score ties |
| Category analytics | "Your automotive data is worth $X/month to brands" — category-level earning potential visibility |
| Export & portability | Full data export in standard formats (JSON, CSV) |

**Critical constraint:** Soul Pro does NOT change the on-chain settlement split. A Pro soul and a Free soul claiming the same offer receive the same USDC amount. Pro unlocks capabilities (more sources, more intent slots, better AI), not a better economic split. The 90/10 split is a trust contract — it must not be tiered.

**Payment:** Soul Pro is billed monthly via in-app purchase (Apple/Google) or direct USDC payment from the soul's wallet. USDC payment option gives a 10% discount ($4.49/month) to incentivize on-chain payment and avoid app store fees.

**Founding Cohort Override:** During the founding cohort phase (first 200-500 souls, per stress-test Q8), all souls receive Pro features free for 90 days. This bootstraps the IACR data needed to demonstrate intent marketplace value to brands.

### 4. Brand Subscription Tiers

Brands pay a monthly platform access fee in addition to per-claim settlement costs. The subscription unlocks platform capabilities; the per-claim cost remains the transactional marketplace fee.

#### Starter — Free

| Feature | Included |
|---------|----------|
| Aggregate Demand Dashboard | View-only (browse before you buy, per UJ Q12) |
| Active Listings | 0 (view-only, no listing creation) |
| Access | No claim access — observation only |
| Purpose | Let brands see verified demand before committing money |

The free Starter tier is the "browse before you buy" pattern from the user journey grilling. Brands verify that real demand exists in their category before spending anything. This reduces cold-start churn (the "Elena problem" from UJ Q14).

#### Growth — $199/month

| Feature | Included |
|---------|----------|
| Active Listings | Up to 5 concurrent |
| Engagement level access | Level 1 (Open) — standard matching |
| Intent premium | Not available |
| Reporting | Standard dashboard (claims, spend, basic performance) |
| Creative review | Standard queue (< 24 hours) |
| Support | Email, 48-hour SLA |
| Escrow requirement | Per ADR-42 (minimum 10× bid per listing) |

#### Scale — $999/month

| Feature | Included |
|---------|----------|
| Active Listings | Up to 20 concurrent |
| Engagement level access | Level 1-2 (Open + Exploring) with brand score 50+ |
| Intent premium | Available for Level 2 (Exploring) matches |
| Reporting | Advanced dashboard with category benchmarks, A/B performance |
| Creative review | Priority queue (< 12 hours) |
| Support | Email + chat, 24-hour SLA |
| Reputation bond | Required ($1K refundable USDC, per ADR-53 §10) |
| API access | Full Brand Portal API for programmatic listing management |

#### Enterprise — $4,999/month

| Feature | Included |
|---------|----------|
| Active Listings | Unlimited |
| Engagement level access | Level 1-3 (Open + Exploring + Ready) with brand score 70+ |
| Intent premium | Full access including Ready (Level 3) premium pool |
| Reporting | Full analytics with conversion attribution, IACR benchmarks, category demand forecasting |
| Creative review | Dedicated reviewer (< 4 hours) |
| Support | Dedicated account manager, 4-hour SLA |
| Reputation bond | Required ($5K refundable USDC) |
| API access | Full API + webhooks for real-time claim events |
| Platinum pool access | Can target Platinum souls via commitment escrow (ADR-54 §5) |
| Custom categories | Request new subcategories in the taxonomy |

### 5. Brand Billing

- **Monthly billing** in USDC (preferred) or fiat via Coinbase Commerce
- **Annual prepay discount:** 15% off (effectively ~2 months free)
- **Subscription is separate from escrow.** The monthly fee covers platform access. Listing escrow (USDC deposited into BudgetEscrow.sol) is separate and fully refundable per ADR-42.
- **Downgrade policy:** Brands can downgrade at any billing cycle. Active listings exceeding the new tier's limit are paused (not deleted). Escrow remains intact.
- **Upgrade policy:** Immediate, prorated for the current billing cycle.

### 6. Revenue Waterfall Example

Steady-state scenario: 10,000 active souls (15% Pro), 200 active brands (100 Growth, 70 Scale, 30 Enterprise), 50,000 claims/month at average $3/claim:

| Stream | Calculation | Monthly |
|--------|-------------|---------|
| Settlement fees | 50,000 × $3 × ~8% avg | $12,000 |
| Soul Pro | 1,500 × $4.99 | $7,485 |
| Brand — Growth | 100 × $199 | $19,900 |
| Brand — Scale | 70 × $999 | $69,930 |
| Brand — Enterprise | 30 × $4,999 | $149,970 |
| **Total** | | **$259,285/month** |

Brand subscriptions dominate at scale. Settlement fees provide the marketplace heartbeat. Soul Pro is supplementary but meaningful.

### 7. Anti-Perverse-Incentive Guardrails

The revenue model must not create incentives that degrade trust:

1. **Soul Pro does not change settlement economics.** A paying soul must not feel that free souls are getting the same offers at the same price — because they are. Pro unlocks tools, not a better deal.
2. **Brand tier does not buy better soul data.** Enterprise brands see aggregate analytics, not individual soul profiles. The k-anonymity floor (ADR-37) applies equally at all tiers.
3. **Settlement fee reduction at higher quality levels** prevents the platform from being incentivized to keep users at lower tiers (where fees are higher). The platform earns more from volume at lower margins than from fewer claims at higher margins.
4. **No ads or data selling.** PersonalOS never monetizes soul data outside the consent-gated claim marketplace. No shadow revenue streams.

### 8. Operator Configurability

Via the Operator Console (ADR-45), the operator can:

- Adjust the active settlement fee rate within [5%, 10%] (48-hour time delay)
- Set promotional pricing for brand tiers (e.g., 50% off first 3 months during launch)
- Grant complimentary Soul Pro (for founding cohort, beta testers, etc.)
- Create custom Enterprise contracts for large brands (override monthly pricing with annual contracts)
- View revenue dashboards: MRR, ARR, churn, LTV by tier, settlement fee revenue

All pricing changes are logged in the Operator Audit Log.

---

## Consequences

Three revenue streams provide resilience: if claim volume dips (seasonal, cold start), subscription revenue covers baseline costs. If a brand churns, the settlement fees from remaining brands continue. The model aligns incentives: PersonalOS earns more when both sides level up (reduced fee rate is offset by higher claim volume and tier multipliers on intent-premium claims).

The free Starter tier for brands and free default for souls ensures the platform never charges for the privilege of seeing value — only for capturing it. This is critical for cold-start: brands must see demand before paying, and souls must earn before subscribing.

The immutable settlement fee ceiling (10%) remains the trust anchor. Subscriptions are off-chain commercial relationships — they can be adjusted, promoted, and negotiated without touching the on-chain social contract.

---

> **See also:** ADR-33 (USDC Settlement), ADR-35 (Fee Split), ADR-42 (Brand Lifecycle), ADR-53 (Intent Marketplace), ADR-54 (Soul Tiers)
