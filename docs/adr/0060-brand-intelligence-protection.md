# ADR-60: Brand Intelligence Protection & On-Chain Access Audit

**Status:** Accepted · **Source:** Delivery channel grilling Q6, Q8 (July 2026) · **Depends on:** ADR-33, ADR-35, ADR-45, ADR-46, ADR-58

---

## Context

PersonalOS delivers aggregate demand intelligence to brands via the Brand Portal (ADR-46) as part of the tiered subscription model (ADR-58). This intelligence — category-level demand volumes, conversion benchmarks, seasonal patterns, and suppression signals — is commercially valuable. Without protection, brands could extract insights during a subscription period, cancel, and continue using the knowledge indefinitely. Worse, a competing platform or ad tech company could subscribe, reverse-engineer PersonalOS's matching signals, and build an approximation.

The soul side of PersonalOS has robust privacy infrastructure: on-device processing (ADR-07), differential privacy (ADR-14), k-anonymity floors (ADR-37). The brand side needs equivalent protection — not for privacy, but for commercial intelligence integrity.

---

## Decisions

### 1. Three-Tier Intelligence Protection

Intelligence delivered to brands is protected at three levels based on sensitivity:

| Tier | Data Type | Protection Mechanism |
|------|-----------|---------------------|
| **Open** | Aggregate demand dashboard (category volumes, growth trends) | On-chain access audit log — every view recorded |
| **Gated** | Conversion attribution, category suppression signals, exclusion data | Smart contract-gated delivery via subscription NFT + time-locked access |
| **Sealed** | High-value intent matching (Ready/Platinum audience composition) | Zero-knowledge matching — brand sees conversion results, never matching criteria |

### 2. On-Chain Access Audit Log

Every significant intelligence access event is recorded on Base chain as calldata, extending the Operator Audit Log pattern from ADR-45:

```
AccessEvent {
  brandId: bytes32         // hashed brand identifier
  dataType: uint8          // enum: DEMAND_VIEW | ATTRIBUTION | SUPPRESSION | FORECAST
  categoryHash: bytes32    // hashed category accessed
  timestamp: uint256
  subscriptionTier: uint8  // GROWTH | SCALE | ENTERPRISE
}
```

Events are batched and submitted daily to minimize gas costs. The audit trail is tamper-proof and publicly verifiable — if a brand extracts intelligence and later uses suspiciously similar targeting after cancellation, the on-chain record proves what they accessed and when.

### 3. Subscription NFT Access Control

Brand subscription status is represented by a non-transferable NFT (soulbound token) on Base chain:

- **Minting:** When a brand subscribes or upgrades, an NFT representing their tier is minted to their registered wallet
- **Burning:** When a subscription lapses or is downgraded, the NFT is burned automatically
- **API gate:** The intelligence API checks NFT ownership before delivering gated or sealed data
- **Expiry:** NFTs include an expiry timestamp; even if the burn transaction is delayed, the API rejects expired tokens

This ensures access termination is cryptographic, not policy-dependent. A cancelled brand cannot access intelligence even if there is a delay in processing the cancellation — the NFT expires on-chain.

### 4. Time-Locked Exclusion Signals

Category-level suppression signals (delivered at Scale tier and above) are time-locked:

- Each suppression signal batch includes a `validUntil` timestamp (7 days from generation)
- After expiry, the signal hashes are no longer valid for use in ad platform API integrations
- Brands must maintain an active subscription to receive refreshed signals
- The time-lock is enforced at the API level; expired signal batches return empty results

### 5. Zero-Knowledge Matching for Sensitive Signals

For the highest-value intelligence — which souls are at Ready level, which are Platinum tier, what specific intent combinations drive the highest conversion — brands never see the matching criteria:

- The brand submits their offer creative and bid parameters
- PersonalOS's matching engine identifies eligible souls on-device
- The brand receives only: match count, conversion results, and aggregate performance metrics
- The WHY behind the match (which data sources, which behavioral signals, which cross-source correlations) is never exposed

This prevents reverse-engineering of PersonalOS's matching algorithm, which is the core intellectual property.

### 6. Non-Extraction Terms of Service

Brand Terms of Service include:

- **Non-extraction clause:** Brands agree not to systematically extract, store, or reproduce aggregate intelligence for use outside the PersonalOS platform
- **Audit right:** PersonalOS reserves the right to audit brand usage patterns; the on-chain access log provides the evidence basis
- **Violation consequences:** Confirmed extraction triggers subscription termination, reputation bond forfeiture (ADR-53 §10), and permanent platform ban

The on-chain audit trail transforms this from a "trust us" clause into a "verify it" enforcement mechanism.

### 7. Anti-Poaching Protections

To prevent brands from using PersonalOS offers to build direct relationships that bypass the platform:

- Offer CTA URLs are reviewed during listing creation (ADR-42) — loyalty program enrollment, email capture forms, and account creation flows embedded in CTA landing pages violate brand ToS
- Repeat claim patterns are monitored: if a brand's offers consistently redirect to relationship-building flows rather than product pages, the operator is alerted
- The brand score (ADR-51) penalizes brands with high claim rates but low follow-through, which is a signal of poaching behavior

### 8. Operator Configurability

Via the Operator Console (ADR-45):

- Set the time-lock duration for suppression signals (default: 7 days, range: 1-30 days)
- Review access audit logs per brand
- Flag and investigate anomalous access patterns (e.g., a brand querying every category at maximum frequency before cancellation)
- Override NFT expiry for grace periods during payment processing delays

---

## Consequences

Brand intelligence protection creates symmetry in PersonalOS's trust architecture: souls are protected by on-device processing and differential privacy; brands' commercial intelligence is protected by on-chain access audits and cryptographic access controls. Both sides have blockchain-verified guarantees.

The subscription NFT model makes PersonalOS's commercial relationships verifiable on-chain, consistent with the platform's transparency ethos. A brand can prove they are an active subscriber; PersonalOS can prove when access was terminated.

The zero-knowledge matching tier protects PersonalOS's core intellectual property — the cross-source correlation engine — from reverse-engineering, while still delivering measurable value (conversion results) to brands.

---

> **See also:** ADR-35 (Immutable Fee Split), ADR-45 (Operator Console), ADR-46 (Brand Portal), ADR-51 (Brand Scoring), ADR-58 (Revenue Model), ADR-62 (Competitive Moat)
