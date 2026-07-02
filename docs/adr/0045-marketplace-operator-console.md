# ADR-45: Marketplace Operator Console — privacy-preserving dashboard for platform operators

**Status:** Accepted · **Source:** L0.2.5 grill session (July 2026)

**Context.** The iOS app is the Soul's view — Priya sees her own raw transactions, Insights, and Consent settings on-device. But PersonalOS platform operators (Sudhir, Sharad) need visibility into marketplace health, settlement activity, and aggregate platform metrics without seeing any individual Soul's raw data. No ADR currently defines this operator-side interface. Without it, the platform is blind to its own marketplace dynamics.

The privacy boundary is architectural, not policy-based: operators see only what smart contracts emit on-chain (ADR-33, ADR-35) and aggregate metrics that satisfy the k ≥ 50 anonymity floor (ADR-14). The console reads from the blockchain and from the server's noisy Insight scores — never from on-device data.

---

## Decisions

### 1. Separate web application — Next.js dashboard

The Operator Console is a standalone web app, completely separate from the iOS Soul app. It connects to:

| Data source | What it provides | Privacy constraint |
|---|---|---|
| Base chain (via viem) | BudgetEscrow events, ConsentRegistry state, ClaimSettled events, fee wallet balances | Public on-chain data — no privacy concern |
| PersonalOS Backend API | Aggregate metrics, Listing status, Brand accounts | k ≥ 50 anonymity floor on all cohort queries (ADR-14) |
| Brand Portal API | Brand verification status, Listing lifecycle | Brand-side data, not Soul data |

The console **never** connects to: Soul devices, SwiftData stores, Keychain, raw transaction data, or unaggregated Insight scores.

### 2. Six navigation modules

Left sidebar navigation with Dashboard as landing page:

```
PersonalOS Operator Console
├── Dashboard          (Marketplace Overview — landing page)
├── Settlements        (On-chain activity feed + charts)
├── Brands             (Brand list → drill into Listings)
│   └── [Brand Detail]
├── Categories         (12-category grid → drill into each)
│   └── [Category Detail]
├── ──────────
├── Operators          (Admin only — invite/manage operator accounts)
└── Audit Log          (All operator actions, read-only)
```

#### Module A — Dashboard (Marketplace Overview)

8 KPI metric cards in a 4×2 grid. Each shows current value, trend arrow (vs yesterday), and health indicator (green/amber/red):

| KPI | Healthy (green) | Warning (amber) | Critical (red) |
|---|---|---|---|
| Active Souls (Phase 2, depth ≥ 60%) | ≥ 50 | 10–49 | < 10 |
| Active Listings | ≥ 10 | 5–9 | < 5 |
| Claims Today | ≥ 10 | 3–9 | < 3 |
| Revenue Today (platform fees) | ≥ $50 | $10–49 | < $10 |
| Total Escrow Balance | ≥ $10K | $2K–9.9K | < $2K |
| Match Rate (claims ÷ offers, 7-day rolling) | ≥ 15% | 5–14% | < 5% |
| Avg Settlement Time | < 30s | 30s–2min | > 2min |
| Category Coverage (categories with ≥1 Listing + ≥1 consenting Soul) | ≥ 8 of 12 | 4–7 of 12 | < 4 of 12 |

Each card links to the relevant deeper module.

#### Module B — Settlement Activity (on-chain)

Reads directly from `BudgetEscrow.sol` and `ClaimSettled` events on Base:

- **Transaction feed:** Each `ClaimSettled` event shows: listing_id, anonymized soul_wallet (first 6 + last 4 chars), yield_usdc, fee_usdc, tx_hash, timestamp. Operator sees that a settlement happened and the amounts, but cannot link soul_wallet to a real identity.
- **Transaction hashes:** Each settlement has a realistic tx hash (derived from `sha256(listing_id + soul_wallet + timestamp + seed)`). Rendered as clickable links with Basescan icon; in synthetic mode, click shows tooltip "Synthetic data — block explorer link available in production." In production, links to `https://basescan.org/tx/{hash}`.
- **Fee revenue:** Cumulative platform fees, daily/weekly/monthly revenue charts, fee wallet balance
- **Escrow status:** Per-Listing escrow balance, depletion rate, estimated runway
- **Settlement health:** Average settlement time, failed transactions, gas costs

#### Module C — Brand Management

Operator view of the Brand-side lifecycle (ADR-42):

- **Brand pipeline:** Pending verification, active, suspended Brands
- **Listing management:** Active/paused/depleted Listings, bid amounts, category distribution, score thresholds
- **Brand performance:** Per-Brand claim rate, budget utilization, average yield paid
- **Compliance:** Flagged Brands, screening results, Terms violations
- **Admin actions:** Suspend/reinstate Brand, pause/resume Listing (all logged to Audit Log)

#### Module D — Category Intelligence

Aggregate marketplace dynamics per Insight category (12 categories from ADR-44):

- **Supply:** How many Souls have active Consents in each Category, average noisy score
- **Demand:** How many active Listings target each Category, total escrowed budget, score thresholds
- **Pricing:** Average bid, median yield floor, bid/floor spread (indicates pricing health)
- **Velocity:** Claims per day per Category, match rate, time-to-claim
- **`health.medical`:** Displayed with a locked icon and "Private — Not Tradeable" badge. Supply/demand show "N/A". Tooltip: "This category is architecturally excluded from the marketplace per ADR-15. Health data contributes to Depth Score but is never available for Brand matching."

This module helps operators identify: cold categories (supply but no demand), overpriced categories (high bids, low claims), and marketplace imbalances.

#### Operators page (Admin only)

- First-run setup flow: first operator creates account via setup page
- Admin invites additional operators via invite link
- Manage operator accounts: view, deactivate
- Role assignment: `admin` or `viewer`

#### Audit Log

Captures real operator actions only (not pre-seeded):

| Action | Logged when |
|---|---|
| `operator.login` | Successful authentication |
| `operator.logout` | Logout or session expiry |
| `operator.invite_sent` | Admin invites another operator |
| `brand.suspended` | Operator suspends a Brand |
| `brand.reinstated` | Operator reinstates a suspended Brand |
| `listing.paused` | Operator pauses a Listing |
| `listing.resumed` | Operator resumes a paused Listing |
| `data.exported` | Operator exports a report/CSV |

Each entry records: operator email, action type, target entity, timestamp.

### 3. Authentication — Email + TOTP (no shortcuts)

Full TOTP authentication from day one:

1. **First-run setup:** App detects no operators exist → shows one-time setup page. First operator enters email, sets password, scans QR code (generated via `otpauth://` URI with `otplib`) into authenticator app (Google Authenticator, 1Password, Authy).
2. **Invite flow:** First admin invites second operator via Settings → generates invite link → same email + password + TOTP QR setup.
3. **Login:** Email → Password → 6-digit TOTP code (30-second window). All three required every time. No "remember this device."
4. **Session:** JWT via NextAuth.js, 8-hour expiry, no refresh token. Re-authenticate after 8 hours.
5. **Password storage:** bcrypt-hashed. TOTP secrets: encrypted in server SQLite (demo) / PostgreSQL (production).

Roles:
- `admin` — full access, can suspend Brands, pause Listings, invite operators
- `viewer` — read-only access to all modules, no administrative actions

### 4. Synthetic marketplace data

For the current milestone, the console runs against synthetic data that mirrors the sandbox personas. No real blockchain — data served from a seeded random generator (seed=42) producing deterministic, reproducible output.

#### 4a. Differential privacy simulation

Insight scores displayed in the console have ε=2.0 Gaussian noise applied to the raw scores from the iOS scoring engine. Souls see true scores on-device; the console sees noisy scores. This reinforces the privacy boundary in the demo itself.

#### 4b. Synthetic Soul wallets

Each persona gets a deterministic fake Base wallet address:

| Persona | Wallet |
|---|---|
| Priya | `0x7A3f8c2E9b4D6a1F0e5C7B3d2A8f4E6c9D8B2c` |
| Marcus | `0x4E1d7F9a3C6B2e8D5A0f1C4b7E3d6A9F2c8B5a` |
| Sofia | `0x9B2c4E6a8D1f3A5C7e0B9d2F4a6C8E1b3D5F7a` |
| James | `0x1F5a3D7c9E2b4A6f8C0d1B3e5A7F9c2D4E6B8a` |

Displayed truncated (first 6 + last 4) in settlement feed. Operator cannot link wallet to real identity.

#### 4c. 10 Brands with 19 Listings

| # | Brand | Listings (Category → Bid/Claim → Min Score) | Escrow |
|---|---|---|---|
| 1 | Whole Foods Market | `dining.grocery` $1.50 (≥40), `dining.restaurant` $2.00 (≥40) | $5,000 |
| 2 | Peloton | `health.fitness` $3.00 (≥55), `entertainment.streaming` $1.25 (≥55) | $8,000 |
| 3 | Chase Sapphire | `finance.health` $2.50 (≥50), `travel.pattern` $4.00 (≥50) | $15,000 |
| 4 | Coursera | `education.growth` $1.75 (≥25), `shopping.research` $0.75 (≥25) | $3,000 |
| 5 | Uber | `transport.commute` $1.00 (≥30), `dining.restaurant` $1.50 (≥30) | $6,000 |
| 6 | Allstate | `finance.health` $2.00 (≥45), `transport.commute` $1.75 (≥45) | $10,000 |
| 7 | REI | `shopping.research` $1.25 (≥40), `health.fitness` $1.50 (≥40), `travel.pattern` $2.00 (≥40) | $7,000 |
| 8 | Spotify | `entertainment.streaming` $0.80 (≥20), `subscription.management` $1.00 (≥20) | $4,000 |
| 9 | Warby Parker | `shopping.impulse` $2.50 (≥50), `shopping.research` $1.50 (≥30) | $5,500 |
| 10 | One Medical | `health.fitness` $3.50 (≥55), `subscription.management` $1.25 (≥55) | $6,500 |

Multi-brand competition in key categories: `health.fitness` (3 Brands), `finance.health` (2), `dining.restaurant` (2), `shopping.research` (3), `transport.commute` (2), `entertainment.streaming` (2), `subscription.management` (2).

#### 4d. Selective Consent per Soul

| Soul | Consents to (with Yield floor) | Withholds |
|---|---|---|
| Priya ($95K) | dining.grocery $0.75, dining.restaurant $1.00, shopping.research $1.00, shopping.impulse $0.75, entertainment $0.75, education $1.00, transport $0.75, travel $1.00 | health.fitness, finance.health |
| Marcus ($130K) | finance $2.00, dining.grocery $1.50, shopping.research $1.50, transport $1.00, entertainment $1.00, education $1.50, subscription $1.00 | health.fitness, shopping.impulse |
| Sofia ($70K) | education $0.75, travel $0.50, shopping.impulse $0.50, shopping.research $0.50, dining.restaurant $0.50, entertainment $0.50, transport $0.50 | finance.health, subscription.management |
| James ($160K) | finance $3.00, travel $3.00, entertainment $2.00, dining.restaurant $2.00, health.fitness $2.00, subscription $2.00 | shopping.impulse, education.growth |

Creates realistic supply variation: `health.fitness` has 3 competing Brands but only 1 consenting Soul (James).

#### 4e. Fee split

15% platform fee, 85% to Soul. For a $2.00 bid: $1.70 → Soul wallet, $0.30 → PersonalOS fee wallet. Encoded as immutable constant mirroring `BudgetEscrow.sol` (ADR-35).

#### 4f. Settlement generation

7 days of data (simulating steady-state marketplace, days 15–21 of operation):

- All 10 Brands and 4 Souls active from day 1 of dataset
- ~15–20 claims/day on weekdays, ~8–12 on weekends
- ~120 total settlement events over 7 days
- Matching logic: Soul has Consent for category + noisy score ≥ Listing threshold + yield floor ≤ bid
- Coursera `shopping.research` ($0.75, $3K escrow) nearing depletion by day 7
- Fixed random seed (42) for reproducible output
- Realistic tx hashes derived from `sha256(listing_id + soul_wallet + timestamp + seed)`

Expected totals (~120 settlements, avg bid ~$1.80):
- Total marketplace volume: ~$216
- Soul payouts: ~$184
- Platform revenue: ~$32

### 5. What operators explicitly CANNOT see

| Prohibited | Reason |
|---|---|
| Individual Soul's raw transactions | On-device only (ADR-07) |
| Individual Soul's true (un-noised) Insight scores | Noise applied before server transmission (ADR-14) |
| Soul's real name, email, or personal identifiers | Soul identity is a wallet address + passkey, no PII collected |
| Which specific merchants a Soul transacts with | Never leaves device |
| Soul's health data (Apple Health) | healthFlag=true data is insight-only, not marketplace-eligible (ADR-15) |
| Mapping between wallet address and real-world identity | Wallet is pseudonymous; operator has no KYC on Souls |

The console enforces these constraints by architecture, not by access control: the data simply doesn't exist in any system the console can reach.

### 6. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | React ecosystem, SSR for dashboard, API routes for synthetic data |
| Styling | Tailwind CSS + shadcn/ui | Rapid dashboard UI, consistent components |
| Charts | Recharts | Lightweight, React-native charting |
| Blockchain reads | viem | Type-safe, modern alternative to ethers.js, built for Base/OP stack |
| Auth | NextAuth.js with credentials provider | Email + TOTP for small operator set |
| TOTP | otplib + qrcode | TOTP generation/verification + QR code rendering |
| Password | bcrypt | Industry-standard password hashing |
| Data (synthetic) | Seeded generator + SQLite | Reproducible synthetic data; mirrors on-chain event shape |
| Data (production) | PostgreSQL for caches + direct chain reads | Cache on-chain events for query performance; source of truth remains chain |
| Deployment | Vercel (demo) → self-hosted (production) | Fast iteration now, controlled infra later |

---

## Consequences

1. The Operator Console is the first server-side component in PersonalOS. All prior work (L0.1–L0.2.5) has been purely on-device. This is architecturally consistent: the server sees only what crosses the privacy boundary (noisy scores, on-chain events, Brand data).

2. The synthetic data layer faithfully represents the on-chain data shape so that the transition to real smart contracts requires no UI changes — only swapping the data source from synthetic to viem chain reads.

3. Operators gain marketplace visibility while maintaining the core promise: "PersonalOS structurally cannot see your data." The console is evidence of this claim — operators can show investors/regulators exactly what they can and cannot see.

4. The Category Intelligence module (Module D) directly informs marketplace operations: pricing guidance to Brands, category health alerts, and supply/demand rebalancing.

5. The `health.medical` "Private — Not Tradeable" badge in the category grid is a demo talking point: "We could monetize health data — the scores exist — but we chose to make it structurally impossible."

6. The 15/85 fee split, visible in every settlement row, is the economic transparency story: Souls and investors can verify that 85 cents of every dollar goes to the Soul.

---

## Related ADRs

- ADR-07: On-device processing — scores only leave device
- ADR-12: Privacy-preserving Exchange — Consent + Yield floor gate
- ADR-14: Differential privacy noise on published Insight scores
- ADR-15: Health data — insight-only, not marketplace-eligible
- ADR-17: Two-phase model — SoulMind → marketplace
- ADR-33: USDC on Base — BudgetEscrow.sol
- ADR-35: Smart contract fee split — immutable, auditable
- ADR-42: Brand onboarding and Listing lifecycle
- ADR-44: L0.2 sprint — scoring engine and Insight categories
