# ADR-47: Soul App — the individual's interface for data control, earning, and privacy

**Status:** Accepted · **Source:** ADR-41 (onboarding), ADR-43 (wallet), ADR-25 (matching), ADR-06 (Insight feed), ADR-13 (consent tokens), ADR-19 (depth score), ADR-45 (operator console), ADR-46 (brand portal)

**Context.** The Operator Console (ADR-45) and Brand Portal (ADR-46) are built. The Soul App is the third and most important surface — it is where individuals manage their data, grant/revoke consents, receive and claim Offers, and earn Yield. Unlike the other two surfaces, the Soul App must feel personal, trustworthy, and empowering — not like an admin dashboard. For L0.3, this is a Next.js web app with synthetic data that demonstrates the full Soul experience. The native iOS app comes later.

**Decision.** The Soul App is a 7-module web application with a modern, personal-feeling UI. It uses a dark/glassmorphism aesthetic with accent gradients to differentiate it from the utilitarian operator and brand surfaces.

---

## Grill Decisions

### Decision 1 — Auth model
**Choice: Email + TOTP** (same as Operator Console and Brand Portal). Proven, works in preview browser. Production Soul App uses WebAuthn passkeys (ADR-31); noted in UI as "Passkey auth in production."

### Decision 2 — Design language
**Choice: Full glassmorphism.** Dark gradient backgrounds, frosted glass cards (backdrop-blur + semi-transparent), gradient accent CTAs (violet-500 → cyan-400), subtle animations. Tuned for readability with sufficient contrast.

### Decision 3 — Navigation pattern
**Choice: Bottom tab bar.** 5 tabs: Home | Consents | Offers | Wallet | Profile. Konnections moved under Profile (setup-once activity vs. ongoing Consents optimization). Privacy Center and Settings also nested under Profile.

### Decision 4 — Home feed layout
**Choice: Hero card + scrollable feed.** Large hero section (greeting, Depth Score ring, earnings sparkline) followed by vertical Insight card feed. Gives glassmorphism design room to breathe.

### Decision 5 — Offer card interaction
**Choice: Feed + detail sheet.** Offer cards in a list show Brand, category, bid amount. Tapping opens a bottom sheet with full creative, Brand reputation, match score, and Claim button. Two-step deliberate flow respects the financial gravity of claiming.

### Decision 6 — Wallet balance display
**Choice: Animated counter.** USDC amount counts up with animation on page load. Fast count-up for returning users, dramatic reveal for first-time or new earnings. Creates micro-dopamine "my data earned this" moment on every visit.

### Decision 7 — Depth Score visualization
**Choice: Animated ring/donut.** Circular progress ring with percentage in center, gradient fill (violet → cyan). 60% Phase 2 threshold marked with notch. Source breakdown as mini legend below.

### Decision 8 — Consent marketplace context
**Choice: Rich — bid range + demand signal.** Each consent card shows current bid range and demand indicator (High/Moderate/Low). Uses same k≥3 privacy threshold as Brand Portal. Empowers informed yield floor decisions.

### Decision 9 — Privacy Center depth
**Choice: Sharing log + visual DP explainer.** Chronological sharing log of every consent token issued, plus interactive differential privacy visualization: "Your score: 82 → Brand sees: 76 (noise applied)."

### Decision 10 — Dismiss flow and yield floor nudge
**Choice: Inline prompt on 3rd dismiss.** Bottom sheet appears with floor adjustment slider in-context. Turns negative moment (dismiss) into constructive optimization. Dismissible if Soul wants to keep current floor.

### Decision 11 — Synthetic Soul differentiation
**Choice: Phase-gated features.** Jordan (28% Depth, below 60%) sees Offers tab locked with "Reach 60% to unlock marketplace." Fewer available consent categories. Home emphasizes "connect more sources." Alex (72%) sees full experience.

### Decision 12 — Konnection simulation
**Choice: Simulated connect flow.** Tapping "Connect" triggers progress animation, source appears connected, Depth Score recalculates, new Insights appear. Demonstrates the compounding value loop. Jordan connecting Apple Health → score jumps to 48%.

### Decision 13 — Earnings chart style
**Choice: Area chart with gradient fill.** Smooth line with violet-to-transparent gradient fill on dark background. Shows daily earnings rhythm. Gradient ties into accent palette.

### Decision 14 — Data deletion UX
**Choice: Multi-step with friction.** Three steps: (1) tap Delete, (2) type "DELETE" to confirm, (3) TOTP authentication. Demo shows "Demo mode: data would be permanently deleted in production" at end.

### Decision 15 — Cross-surface brand creative
**Choice: Exact match with Soul framing.** Brand creative (headline, body, CTA) preserved from Brand Portal BRAND_DEFS. Soul-facing framing wraps around it: "Earn $1.50" badge, "96% match" score, "Whole Foods is looking for grocery shoppers like you" subtitle.

### Decision 16 — Port
**Choice: 3002.** Sequential after Operator Console (3000) and Brand Portal (3001).

---

## Module A — Home (Insight Feed)

The Soul's primary surface. Follows ADR-06: the Insight feed is the permanent home, not a dashboard.

**Layout:** Hero card at top (greeting, animated Depth Score ring, earnings sparkline), followed by scrollable Insight card feed (Decision 4).

**Content:**
- **Greeting + Depth Score ring** — animated circular progress ring with gradient fill (violet → cyan), percentage in center, 60% Phase 2 threshold notch. Source breakdown as mini legend below (Decision 7)
- **Insight cards** — scrollable feed of personalized Insights from SoulMind analysis. Each card shows category icon, Insight text, confidence score, and timestamp. Cards reference missing data sources with contextual prompts to connect them
- **Active Offers banner** — count of pending Offers waiting for action, with tap to navigate to Offers tab. Hidden for Phase 1 Souls (Jordan) — shows "Unlock marketplace at 60%" instead (Decision 11)
- **Earnings summary** — total lifetime Yield in USDC with fiat equivalent, last 7-day trend sparkline
- **Konnection prompts** — contextual cards suggesting new data sources based on existing Insights (ADR-06)

**Synthetic data:** 8–12 pre-written Insights across categories (financial, health, shopping, dining), 2–3 konnection prompt cards, earnings from claimed Offers.

---

## Module B — Consents (tab)

Per-category consent management. The Soul's primary economic lever — promoted to main tab bar (Decision 3).

**Content:**
- **Active consents** — glassmorphism cards per consented category showing: display name, yield floor (USDC), date granted, Offers received count, total earned. Edit button (floor adjustment) and revoke toggle
- **Marketplace context** — each consent shows bid range and demand signal: "High demand · $1.50–$2.50" (Decision 8). Uses k≥3 privacy threshold
- **Available categories** — categories the Soul qualifies for but hasn't consented to. Shows estimated earning potential
- **Yield floor editor** — slider per category with marketplace context
- **Privacy explanation** — persistent card: "Brands see your noisy score (±noise), never your actual data. You can revoke anytime."

**Phase gating (Decision 11):** Jordan sees fewer available categories and a prompt to connect more sources to unlock additional categories.

**Synthetic data:** Alex: 5 active consents, 3 available. Jordan: 2 active consents, 1 available.

---

## Module C — Offers (tab)

Matched Offers from the marketplace. Feed + detail sheet interaction (Decision 5).

**Content:**
- **Pending Offers feed** — cards showing: Brand name, category, bid amount ("Earn $1.50"), expiry countdown (72h), match score badge ("96% match"). Exact Brand creative preserved from Brand Portal with Soul framing (Decision 15)
- **Detail sheet** — tapping card opens bottom sheet with: full creative (headline + body + CTA), Brand reputation, category context, "Only you see this match score" note, Claim button
- **Claim flow** — Claim → confirmation modal → simulated passkey sign (TOTP) → success animation with counter increment
- **Dismiss** — X button to dismiss. On 3rd dismiss in same category: inline bottom sheet with yield floor adjustment slider (Decision 10)
- **History tab** — past Offers: claimed, dismissed, expired

**Phase gating (Decision 11):** Jordan sees locked state: "Reach 60% Depth Score to unlock the marketplace. Connect more data sources to increase your score."

**Synthetic data:** Alex: 3–4 pending Offers from Whole Foods/Chase/REI, 5–8 historical. Jordan: locked.

---

## Module D — Wallet (tab)

USDC balance and withdrawal. Follows ADR-43.

**Content:**
- **Balance card** — animated counter rolling up to USDC balance (Decision 6). Fiat equivalent below. Gradient glow on glassmorphism card
- **Earnings chart** — 30-day area chart with violet-to-transparent gradient fill (Decision 13)
- **Recent transactions** — Claims (earned) and withdrawals with date, Brand/destination, amount, category, tx hash
- **Cash Out** — "Simulate Withdrawal" active, "Coinbase Pay" Coming Soon
- **Transfer** — "Simulate Transfer" active
- **Wallet address** — with copy button. "Your wallet is non-custodial — only you control it"

**Synthetic data:** Alex: ~$47.50, 7–10 transactions, 30-day chart. Jordan: ~$8.00, 2–3 transactions.

---

## Module E — Profile (tab)

Account management hub. Contains Konnections, Privacy Center, and Settings (Decision 3).

### E1 — Konnections
- **Connected sources** — cards showing source name, connection date, data freshness, Depth Score contribution
- **Available sources** — Tier 1/2/3 with simulated connect flow (Decision 12). Tapping "Connect" → progress animation → source connected → Depth Score recalculates → new Insights appear
- **Disconnect** — per source with impact explanation

### E2 — Privacy Center
- **Sharing log** — every consent token: Brand, category, noisy score shared, timestamp, status (Decision 9)
- **DP visual explainer** — interactive: "Your score: 82 → Brand sees: 76 (noise applied)" with slider showing noise range
- **Data deletion** — multi-step: tap → type "DELETE" → TOTP → demo-mode confirmation (Decision 14)
- **Export** — "Download my data" button

### E3 — Settings
- **Soul profile** — display name, avatar, region
- **Notification preferences** — max Offers/day, quiet hours
- **Security** — passkey/TOTP status, sessions
- **Appearance** — dark mode default (glassmorphism requires dark)
- **Sign out**

---

## Design Language

Full glassmorphism (Decision 2):

- **Color palette:** Deep dark backgrounds (#0a0a0f → #1a1a2e gradient), accent gradient (violet-500 → cyan-400) for CTAs and highlights, muted zinc for secondary text
- **Card style:** Glassmorphism — semi-transparent backgrounds (rgba white 5–8%), subtle backdrop-blur, thin border (white 10%), rounded-2xl corners
- **Typography:** Clean sans-serif, large hero numbers for balance/scores, condensed labels
- **Motion:** Subtle entrance animations on cards (fade + slide up), pulse animation on earnings updates, ring animation on Depth Score
- **Icons:** Outlined/duotone style, consistent stroke width
- **Overall feel:** Premium fintech app (think: Robinhood × Loom dark mode × Arc browser)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Port | 3002 (Decision 16) |
| Auth | Email + TOTP (Decision 1) |
| Styling | Tailwind v4 |
| Charts | Recharts |
| Data | Synthetic, deterministic (SeededRandom) |
| State | React useState/useEffect |

---

## Multi-Soul Demo

| Soul | Email | Depth Score | Konnections | Phase | Consents | Earned |
|---|---|---|---|---|---|---|
| Alex Rivera | alex@personalos.me | 72% | Plaid + Health + Amazon | 2 (unlocked) | 5 active | ~$47 |
| Jordan Chen | jordan@personalos.me | 28% | Plaid only | 1 (locked) | 2 active | ~$8 |

Phase gating (Decision 11): Jordan's Offers tab is locked, fewer consent categories available, Home emphasizes source connection prompts.

---

## Privacy Boundaries (Soul App perspective)

| Data point | Soul sees | Brand sees | Operator sees |
|---|---|---|---|
| Raw transactions | Category summaries only | Never | Never |
| Insight scores | Exact score | Noisy score (±DP) | Noisy aggregate |
| Wallet address | Full address + QR | Never | Truncated (display) |
| Consent details | Full history + revoke | Category + noisy count | Category + noisy count |
| Earnings | Exact per-Claim | Cost per Claim (their side) | Fee amount only |
| Other Souls' data | Never | Never | Aggregate only |
| Brand bids | Bid on their Offer only | Their own bids | All bids |

---

## Cross-surface Data Flow (L0.3 synthetic)

The Soul App reuses the same synthetic data definitions as the Brand Portal and Operator Console:
- Brands that create Listings in Brand Portal generate Offers that appear in Soul App (Decision 15: exact creative with Soul framing)
- Claims in Soul App generate settlements visible in Brand Portal and Operator Console
- Category supply metrics in Brand Portal marketplace reflect consenting Souls from Soul App
- All three surfaces use the same SeededRandom deterministic generator for consistency

**Consequences.** The Soul App completes the three-surface triangle. With all three surfaces built, the next milestone is wiring them together with a real matching engine, replacing synthetic data with live cross-surface data flow. The dark/glassmorphism design language ensures the Soul App feels personal and premium — distinct from the admin surfaces that Operators and Brands use.
