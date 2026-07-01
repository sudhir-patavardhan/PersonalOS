# ADR-42: Brand onboarding, Listing creation, and budget lifecycle

**Status:** Accepted · **Source:** gap identified during ADR pressure testing (June 2026)

**Context.** The Soul-side architecture is fully specified (ADR-41 onboarding, ADR-20 Consent, ADR-25 matching). The settlement layer is specified (ADR-33 BudgetEscrow, ADR-35 fee split). But no ADR defines how a Brand enters the platform, creates a Listing, funds it, or manages its lifecycle. Without this, the Exchange has no supply side. The README explicitly lists "Brand onboarding and Listing workflow" as unresolved.

**Decision.** Brand onboarding is a gated, verified process — PersonalOS does not allow self-serve Listing creation without identity verification. The lifecycle has four stages.

### Stage 1 — Brand Registration and Verification

A Brand registers via the PersonalOS Brand Portal (web app, separate from the Soul iOS app). Registration requires:

1. **Business identity:** Legal entity name, jurisdiction of incorporation, tax ID (EIN for US, GSTIN for India, VAT for EU). PersonalOS verifies the entity exists via a business registry lookup (e.g., OpenCorporates API, MCA India).
2. **Authorised representative:** Name, corporate email (no gmail/yahoo — must match the Brand's domain), role. Email verification required.
3. **Brand profile:** Display name (as shown to Souls), logo, website URL, industry vertical. The display name is reviewed by PersonalOS before going live — no impersonation of other Brands.
4. **Terms acceptance:** Brand agrees to PersonalOS Brand Terms of Service, which include: no raw Soul data access, no re-identification attempts, compliance with Consent semantics, acceptance of immutable smart contract fee split.
5. **Compliance screening:** PersonalOS runs the Brand through a sanctions/PEP screening service (e.g., ComplyAdvantage, Dow Jones Risk) before activation. Brands in prohibited categories (tobacco, gambling, firearms, adult content, payday lending) are rejected.

**Gate:** Brand account is `active` only after business entity verification + email verification + compliance screening pass. Typical onboarding time: 1–3 business days. No Listings can be created until `active`.

### Stage 2 — Listing Creation

An active Brand creates Listings via the Brand Portal API or dashboard:

```
Listing {
  listing_id: uuid
  brand_id: uuid
  category: string              // from Exchange Category namespace (subset of SoulMind taxonomy)
  bid_per_claim_usdc: decimal   // minimum $0.50, no maximum
  budget_total_usdc: decimal    // total USDC to escrow for this Listing
  creative_content: {
    headline: string            // ≤60 chars, shown to Soul in Offer
    body: string                // ≤200 chars
    cta_url: string             // Brand's landing page, opened on Claim
    cta_label: string           // "Shop Now", "Learn More", etc.
    image_url: string?          // optional hero image
  }
  voucher_delivery_webhook: string?  // optional, ADR-34
  min_score_threshold: float    // minimum Insight score to match (0.0–100.0)
  geo_targeting: string[]?      // optional country/state codes; empty = global
  start_date: date
  end_date: date?               // optional; if nil, runs until budget exhausted
  status: enum (draft | pending_review | active | paused | exhausted | expired)
}
```

**Listing validation:**
- `category` must exist in the Exchange Category namespace. Brands cannot invent categories.
- `bid_per_claim_usdc` must be ≥ $0.50 (below this, the platform fee makes settlement uneconomical).
- `budget_total_usdc` must be ≥ 10× `bid_per_claim_usdc` (minimum 10 potential Claims per Listing).
- `creative_content` is reviewed by PersonalOS before the Listing goes `active`. Review checks: no misleading claims, no prohibited content, no Soul data requests in the CTA landing page. Automated pre-screening (keyword filter + image moderation) with manual review for flagged content. Target review time: < 24 hours.
- `cta_url` domain must match the Brand's verified website domain or a known subdomain. No third-party redirect chains.
- `min_score_threshold` is capped at 90.0 to prevent Brands from narrowing the match pool below the k-anonymity floor (ADR-37).
- `geo_targeting` is validated against supported jurisdictions. Listings targeting jurisdictions where USDC settlement is not yet legally cleared (ADR-33 open question) are rejected.

### Stage 3 — Budget Funding

After a Listing passes review (`pending_review` → `active`), the Brand funds it:

1. **USDC direct deposit:** Brand sends USDC on Base chain directly to `BudgetEscrow.sol` with the `listing_id` as calldata. The contract verifies the Brand's address matches the registered Brand wallet.
2. **Fiat-to-USDC via Coinbase Commerce:** For non-crypto-native Brands, the Brand Portal provides a Coinbase Commerce checkout flow. The Brand pays by card or bank transfer; Coinbase converts to USDC and deposits to BudgetEscrow on the Brand's behalf. PersonalOS never holds fiat.
3. **Escrow confirmation:** The Listing becomes matchable on the Exchange only after the `BudgetEscrow.sol` contract confirms the full `budget_total_usdc` is deposited. Partial funding is not accepted — the Brand must fund the full budget or revise the Listing.

**Budget lifecycle:**
- Each Claim deducts `bid_per_claim_usdc` from the escrow balance.
- When remaining balance < `bid_per_claim_usdc`, the Listing automatically transitions to `exhausted` and is removed from Exchange matching.
- The Brand can top up an `exhausted` Listing by depositing additional USDC, which transitions it back to `active`.
- The Brand can pause a Listing at any time (removes from matching, does not refund escrow).
- **Refund policy:** Unused escrow balance is refundable on Listing expiry or Brand-initiated cancellation. Refund is processed via `BudgetEscrow.refund(listing_id)` — USDC is returned to the Brand's registered wallet. Refund is only callable by the Brand's registered address + PersonalOS co-signature (2-of-2 multisig) to prevent unauthorised withdrawals.

### Stage 4 — Reporting and Iteration

Active Brands access a real-time dashboard showing:
- **Offer metrics:** Offers delivered, Offers dismissed, dismiss rate by Category
- **Claim metrics:** Claims, Claim rate, budget remaining, estimated budget runway
- **Reputation signal:** aggregate Reputation trend for Souls who Claimed (did Claims lead to purchases?) — reported as a directional indicator, not individual Soul data
- **No Soul-level data:** Brands never see individual Soul profiles, Insight scores, wallet addresses, or any data that could identify a Soul. All reporting is aggregate with k≥50 floor (ADR-37).

Brands can create multiple Listings across different Categories. Each Listing has an independent budget, bid, and lifecycle. A Brand can A/B test by running two Listings in the same Category with different bids and creative content.

**Consequences.** Brand onboarding is intentionally slower than Soul onboarding (1–3 days vs. 3 minutes). This is deliberate — the Brand side is a curated marketplace, not an open ad exchange. Verification prevents spam Listings, impersonation, and prohibited content from reaching Souls. The minimum bid ($0.50) and minimum budget (10× bid) prevent low-value noise on the Exchange. Creative review adds operational load — PersonalOS must staff or automate content moderation. The refund multisig prevents a compromised Brand account from draining its own escrow, but introduces a PersonalOS co-signing dependency that must be highly available.
