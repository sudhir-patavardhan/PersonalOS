# ADR-46: Brand Portal — marketplace interface for brand advertisers

**Status:** Draft · **Source:** L0.3 planning (July 2026)

**Context.** The PersonalOS marketplace has three actors: Souls (iOS app, L0.2.5), Operators (Operator Console, ADR-45), and Brands. ADR-42 defines the Brand onboarding and Listing lifecycle in architectural terms, but no ADR specifies the actual Brand-facing interface. Without a Brand Portal, there is no way for brands to create Listings, fund escrow, optimize campaigns, or measure ROI. The marketplace triangle is incomplete.

The Brand Portal is the third and final interface in the PersonalOS ecosystem. It must balance giving brands enough signal to make smart bidding decisions while enforcing the privacy boundary: brands never see individual Soul data.

---

## Decisions

### 1. Separate web application — Next.js dashboard (same stack as Operator Console)

The Brand Portal is a standalone web app, completely separate from both the iOS Soul app and the Operator Console. Each Brand sees only their own data — never other Brands' bids, budgets, or performance.

| Data source | What it provides | Privacy constraint |
|---|---|---|
| PersonalOS Backend API | Listing status, claim results, aggregate metrics | k ≥ 50 on all cohort queries; no individual Soul data |
| Base chain (via viem) | BudgetEscrow balance, ClaimSettled events for this Brand's Listings | Brand sees only its own escrow and settlements |
| Category Supply API | Aggregate supply stats per category (consenting Soul count, score distribution bands) | Counts only; no individual scores or wallet addresses |

The portal **never** accesses: individual Soul scores, Soul wallet addresses, Soul transaction data, other Brands' bids or budgets, or Operator Console data.

### 2. Seven modules

Left sidebar navigation:

```
[Brand Name] Portal
├── Dashboard         (Campaign overview — landing page)
├── Listings          (Create, edit, manage Listings)
│   └── [Listing Detail]
├── Escrow            (Fund, top-up, view balances, request refund)
├── Performance       (Campaign analytics — claims, spend, ROI)
├── Optimize          (Tune bids, thresholds, caps, reallocation)
├── Marketplace       (Browse category supply, pricing guidance)
├── ──────────
└── Settings          (Brand profile, team members, API keys)
```

#### Module A — Dashboard (Campaign Overview)

Landing page with 6 KPI cards:

| KPI | Description |
|---|---|
| Active Listings | Count of Listings in `active` status |
| Total Claims (7d) | Claims across all Listings in the past 7 days |
| Spend Rate (7d) | USDC spent on claims in the past 7 days |
| Budget Remaining | Total USDC across all active escrows |
| Avg Cost per Claim | Total spend ÷ total claims (lifetime) |
| Estimated Runway | Days until budget exhaustion at current spend rate |

Plus: a claims-over-time sparkline chart, top-performing Listings by claim rate, and alerts (low escrow, depleted Listing, paused Listing).

#### Module B — Listing Management

Full CRUD for Listings per ADR-42:

- **Create Listing:** Category picker (from the 11 tradeable categories — `health.medical` excluded), bid per claim (min $0.50), minimum score threshold (dynamically validated — system checks that eligible Soul count ≥ 50 using the same noised supply query as what-if projections; if below k-anonymity floor, UI blocks creation and suggests a lower threshold), budget amount, creative content (headline ≤60 chars, body ≤200 chars, CTA URL, CTA label), geo-targeting (two-layer: Soul voluntarily declares a broad region at consent time — feeds supply metrics; at claim time, Soul's device checks its actual location against the Listing's geo-target before claiming — platform never knows exact location), start/end dates.
- **Listing states:** `draft` → `pending_review` → `active` → `paused` / `exhausted` / `expired`. **L0.3:** `pending_review → active` auto-approves instantly (state machine is wired correctly, but creative review is deferred). Production: Operator approves via a review queue in the Operator Console (future feature).
- **Edit:** Active Listings can have bid, threshold, and creative edited (triggers re-review for creative changes). Budget increases via Escrow module.
- **Pause/Resume:** Instant pause removes from matching. Resume restores.
- **Detail view:** Per-Listing metrics, escrow balance, claim history (anonymized — timestamps and amounts only, no Soul identifiers).

#### Module C — Escrow Management

Interface to BudgetEscrow.sol interactions:

- **Fund Listing:** Three options shown in the funding UI: (1) **"Simulate Deposit"** (active for L0.3) — instant synthetic credit, (2) **"Connect Wallet"** (Coming Soon) — WalletConnect / Coinbase Wallet on Base, (3) **"Pay with Card"** (Coming Soon) — fiat-to-USDC via Coinbase Commerce. UI communicates the full production vision; real wallet + fiat integrations are a single follow-on milestone (post-L0.3).
- **Balance view:** Per-Listing escrow balance, total across all Listings, depletion charts.
- **Top-up:** Add funds to an active or exhausted Listing.
- **Refund request:** Request refund of unused escrow balance on cancelled/expired Listings. Shows refund status (pending co-signature, completed).
- **Transaction history:** All escrow deposits, claim deductions, refunds — with on-chain tx hashes (synthetic hashes in L0.3).

#### Module D — Performance Analytics

Read-only campaign analytics with aggregate data:

- **Claims timeline:** Daily/weekly claims chart per Listing, with spend overlay.
- **Category breakdown:** Claims by category, cost per claim by category.
- **Reach metrics:** Unique Souls reached (anonymized count, not identifiers). Soul count is noised (±10%) to prevent exact counting.
- **Budget utilization:** Spend vs. funded across all Listings.
- **Conversion signal:** Aggregate Reputation trend — did claims lead to detected purchases? Shown as a directional indicator (improving/stable/declining), not per-Soul.
- **Comparative benchmarks:** Brand's cost-per-claim vs. category median (without revealing competitor bids).

#### Module E — Campaign Optimization

Active controls for tuning live campaigns:

- **Bid adjustment:** Slider or input to raise/lower bid on active Listings. Shows estimated impact on match ranking.
- **Threshold tuning:** Adjust minimum score threshold. Shows estimated eligible Soul count at new threshold (aggregate, noised).
- **Daily spend cap:** Set maximum USDC spend per day per Listing. Listing pauses for the day when cap is hit.
- **Budget reallocation:** Move allocation between Listings (within the same Brand). Off-chain operation — the platform tracks per-Listing allocations internally while total Brand escrow remains on-chain. Invariant: sum of all per-Listing allocations = on-chain total. Both Escrow (Module C) and Optimize (Module E) read/write the same allocation table, keeping them in sync. Reallocation is instant and gas-free.
- **What-if projections:** "If I change bid to $X and threshold to Y, approximately how many Souls become eligible?" Thresholds are bucketed in steps of 10 (50, 60, 70, 80, 90) and eligible counts are noised ±15% with fresh noise per query — prevents binary-search attacks on score distributions while giving brands useful directional signal.
- **A/B guidance:** Side-by-side comparison view — brand picks two Listings in the same Category and sees metrics in two columns (claims, cost, spend rate, threshold). Not a traffic-splitting experiment engine — both Listings compete naturally. Helps brands understand which creative/bid combo performs better from organic competition.

#### Module F — Category Marketplace

Browse available marketplace supply to inform campaign strategy:

- **Category grid:** All 11 tradeable categories with aggregate supply metrics:
  - Consenting Soul count (noised ±10%)
  - Score distribution bands (e.g., "40% of consenting Souls score 50–75")
  - Median yield floor across consenting Souls
  - Competitor count: shown only when ≥ 3 brands are in the category (below threshold, display "Few" instead of a number — prevents identification by elimination)
  - Suggested bid range (floor to competitive)
- **Category detail:** Deeper supply/demand dynamics, historical claim velocity, seasonal patterns.
- **`health.medical`:** Shown with "Not Available" badge — architecturally excluded per ADR-15.

Note: Brands see competitor *count* and *median bid range*, not individual competitor identities or exact bids. This gives enough signal for bid strategy without leaking competitive intelligence.

#### Settings

- **Brand profile:** Update display name, logo, website, industry vertical.
- **Team management:** Self-service invite flow — admin clicks "Invite," selects a role, gets a one-time setup URL (expires 24h or first use). Teammate visits the URL, sets their own password, scans their own TOTP QR, verifies. Admin never touches teammate credentials. Roles: admin, campaign_manager, viewer.
- **API keys:** Deferred to post-L0.3. Shown as a "Coming Soon" card in Settings. Production: generate scoped keys for programmatic Listing management, with rate limiting and rotation.
- **Wallet configuration:** Register/update the Brand's Base wallet address for escrow interactions.
- **Notification preferences:** In-app alert banners on the Dashboard for low escrow, depleted Listings, paused Listings, and review status changes. Email notification toggles shown as "Coming Soon" — email infrastructure deferred to post-L0.3.

### 3. Authentication — Email + TOTP (same pattern as Operator Console)

Identical TOTP auth from ADR-45:
1. First brand admin sets up email + password + TOTP QR scan.
2. Invite flow for additional team members.
3. Login requires all three factors every time. 8-hour JWT sessions.

Roles:
- `admin` — full access, manage team, manage wallet, request refunds
- `campaign_manager` — create/edit Listings, adjust bids, fund escrow
- `viewer` — read-only access to all modules

### 4. Synthetic data for current milestone

Like the Operator Console, the Brand Portal runs against synthetic data for L0.3:

- **Multi-tenant demo:** 2–3 seeded brands (e.g., Whole Foods Market, Nike, Starbucks) each with their own login credentials. Auth is fully multi-tenant — Brand A's JWT cannot access Brand B's data. Demonstrates real privacy isolation: log in as Whole Foods → see grocery Listings; log out, log in as Nike → see fitness Listings; neither sees the other's bids, budgets, or performance.
- **Synthetic Listings:** Each brand's Listings from the shared synthetic data, filtered by brand ID at the auth boundary
- **Synthetic claims:** Settlement events from the shared data, filtered to the authenticated brand only
- **Synthetic supply data:** Category supply metrics derived from the 4 sandbox personas
- **Deterministic:** Same seed=42, same data as operator console — both views are consistent

### 5. What brands explicitly CANNOT see

| Prohibited | Reason |
|---|---|
| Individual Soul Insight scores | Only aggregate score distribution bands (ADR-14) |
| Soul wallet addresses | Settlement feed shows claim amounts/times, not Soul identifiers |
| Other Brands' exact bids or budgets | Only median bid range and competitor count |
| Soul transaction or purchase data | On-device only (ADR-07) |
| Soul names, emails, or PII | No PII collected (ADR-31) |
| Exact Soul counts | All counts noised ±10% to prevent fingerprinting |

### 6. Semantic alignment — Brand targeting vocabulary vs. Soul self-categorization

Brands and Souls describe the same categories in different vocabularies. A Brand creates a Listing targeting `shopping.grocery` with keywords like "organic shoppers" or "meal planners." A Soul, meanwhile, self-identifies by granting consent to their `shopping.grocery` Insight, which is computed from their own transaction and behavior data — they think in terms of "I buy groceries at Whole Foods" not "I am a grocery shopper segment."

The matching layer must bridge this gap:

| Layer | Who defines it | Example |
|---|---|---|
| **Platform categories** (canonical) | PersonalOS (the 12 categories from ADR-14) | `shopping.grocery` |
| **Brand targeting terms** | Brand, at Listing creation | "organic shoppers", "meal kit subscribers" |
| **Soul consent scope** | Soul, in the iOS app | "I consent to share my grocery Insight" |

**Resolution:** Matching happens at the **platform category level**, not at the brand's marketing vocabulary level. When a Brand creates a Listing, they pick from the canonical 12 categories — not free-text segments. The Brand's creative content (headline, body) can use any marketing language, but the *match* is determined by: (1) the Soul has consented to that category, (2) the Soul's noisy Insight score meets the Brand's minimum threshold, and (3) the Brand's bid wins the competitive ranking per ADR-21.

Brand-side sub-targeting (e.g., "only Souls who score 70+ in grocery AND 50+ in fitness") is a **future capability** — for L0.3, each Listing targets exactly one category. This keeps the semantic model simple and auditable.

The Brand Portal's Listing Builder (Module B) enforces this by presenting a **category picker** (not a free-text targeting field), ensuring Brands can only target categories that exist in the Soul-side taxonomy.

### 7. Tech stack

Same as Operator Console (ADR-45): Next.js 16 (App Router), Tailwind CSS, Recharts, jose (JWT), otplib (TOTP), bcryptjs, better-sqlite3 (synthetic), viem (production chain reads). Runs on port 3001 (Operator Console on 3000) — both can run simultaneously for side-by-side demos.

Shared code: The synthetic data module lives in a shared workspace package (`packages/synthetic-data`) that both the Operator Console and Brand Portal import. This guarantees both portals produce identical data from seed=42 without code duplication.

---

## Consequences

1. The Brand Portal completes the three-sided marketplace interface: Soul app (data owner), Brand Portal (data buyer), Operator Console (platform operator). All three can be demoed with synthetic data.

2. The Campaign Optimization module (Module E) is the primary differentiator from generic ad dashboards. Brands can tune campaigns in real-time with privacy-preserving "what-if" projections — a capability traditional ad platforms don't offer because they rely on individual-level targeting.

3. The daily spend cap and budget reallocation features in Module E add operational safety — brands can't accidentally burn through escrow faster than intended.

4. Showing competitors' median bid range (not exact bids) in Module F gives brands enough signal for pricing without creating a race-to-the-bottom dynamic. This is a deliberate marketplace design choice.

5. The ±10% noise on Soul counts prevents brands from precisely measuring the marketplace's exact size, which could be competitively sensitive information about PersonalOS's traction.

---

## Related ADRs

- ADR-07: On-device processing
- ADR-12: Privacy-preserving Exchange
- ADR-14: Differential privacy on Insight scores
- ADR-15: Health data — insight-only, not marketplace-eligible
- ADR-21: Multi-brand competitive bidding
- ADR-33: USDC on Base — BudgetEscrow.sol
- ADR-35: Smart contract fee split
- ADR-37: Re-identification mitigation (k ≥ 50)
- ADR-42: Brand onboarding and Listing lifecycle
- ADR-45: Operator Console (shared synthetic data, shared tech stack)
