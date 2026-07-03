# ADR-48 — Unified Demo Launcher

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-02 |
| Depends on | ADR-45 (Operator Console), ADR-46 (Brand Portal), ADR-47 (Soul App) |

## Context

PersonalOS has three independent web surfaces — Operator Console (:3000), Brand Portal (:3001), and Soul App (:3002) — each with its own login, synthetic data, and design language. A demo audience has no way to see how they connect or follow the money from Brand Budget → Exchange → Soul Wallet. We need a single entry point that ties the full story together.

## Decision

Build a **Demo Launcher** — a lightweight Next.js 16 app on port 3003 that serves as the front door to PersonalOS demos.

### Grill Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q1 | App structure | Next.js 16 | Consistent stack across all four apps — one mental model, one set of dependencies |
| Q2 | Landing layout | Editorial hero | Narrator's job is to tell the story, not repeat metrics. Flow diagram carries more weight than synthetic numbers |
| Q3 | Flow diagram | Animated SVG + Framer Motion | Animated data flow is the centerpiece — makes the connection between surfaces immediately obvious |
| Q4 | Narrative format | Stepper | Presenter controls pacing (critical for live demos). No scroll-jacking. Easy to jump between steps |
| Q5 | Demo login | Per-surface `/api/auth/demo-login` endpoint | Auth logic stays in each surface. Launcher just triggers it. Gated behind `DEMO_MODE=true` |
| Q6 | Status indicators | Client-side health fetch + server-side logging | Green/red dots in UI via browser fetch; server-side polling logs surface availability to Launcher terminal |
| Q7 | Narrative screenshots | Static PNGs in `/public/screenshots/` | Fast loading, no cross-origin issues. Recapture after UI changes |
| Q8 | Design theme | Light neutral | White/slate-50 background — maximum contrast against dark Soul App. Narrator sits "above" the surfaces |
| Q9 | Orchestration | Docker Compose | Isolated environments, clean shutdown, built-in health checks, production-like. HMR via bind mounts |
| Q10 | Architecture page | Include | Low effort — content exists in ADRs. Completes the Launcher for technical audiences |
| Q11 | Surface cards | Rich cards with metrics | Key metrics pulled from `/api/health` make the landing page feel alive before clicking into a surface |

---

## Module 1 — Landing Page (Editorial Hero)

Light background (white/slate-50), dark text, generous whitespace:
- **Hero section**: large tagline ("Own your data. Earn from it."), subtitle explaining PersonalOS in one sentence, "Start Demo" CTA
- **Animated flow diagram**: SVG with Framer Motion — data packets animate along the path Soul → Konnection → Insight → Exchange → Offer → Claim → Yield. Each node clickable to highlight that surface's role. Three accent colors: violet (Soul), blue (Brand), amber (Operator)
- **Surface cards row**: three rich cards below the diagram (see Module 2)

## Module 2 — Rich Surface Cards

Each card contains:
- Surface name, icon, and accent color border (violet / blue / amber)
- Port number and live/offline status dot (green/red via client-side health fetch every 10s)
- Primary persona and login hint (e.g., "Whole Foods Market · admin@wholefoods.demo")
- Key metrics preview from `/api/health` (e.g., "5 brands · 12 listings · $39K escrowed")
- "Open" button → opens surface in new tab
- "Quick Launch" button → POST to `/api/auth/demo-login`, sets session, redirects

## Module 3 — Data Flow Visualization

Interactive animated diagram showing how the same Whole Foods campaign appears across surfaces:
- **Brand node** (blue): Creates Listing for `dining.grocery`, $1.50 bid, $5,000 escrow
- **Exchange node** (amber): Matches Listing to Souls with Grocery Patterns consent and Depth ≥ 40%
- **Soul node** (violet): Alex Rivera receives Offer framed as "Whole Foods Market is looking for grocery shoppers like you" with $1.28 earn
- Click any node → tooltip showing the exact screen from that surface (static screenshot)

## Module 4 — Follow the Money (Stepper)

7-step guided narrative with Next/Back navigation:

| Step | Surface | What happens | Key number | Screenshot |
|------|---------|-------------|------------|------------|
| 1 | Brand Portal | Whole Foods deposits $5,000 USDC into escrow for `dining.grocery` | $5,000 Budget | Escrow page |
| 2 | Operator Console | Exchange matches 847 Souls with Grocery Patterns consent | 847 eligible | Exchange dashboard |
| 3 | Soul App | Alex sees Offer: "Fresh organic groceries delivered" with $1.28 earn | $1.28 Yield | Offers page |
| 4 | Soul App | Alex Claims the Offer — passkey signature simulated | Claim confirmed | Offer detail sheet |
| 5 | Operator Console | Claim event: $1.50 → $0.22 fee (15%) + $1.28 Yield | 15% take rate | Claims feed |
| 6 | Brand Portal | Campaign dashboard updates: +1 Claim, Budget now $4,998.50 | $4,998.50 remaining | Performance page |
| 7 | Soul App | Alex's Wallet shows +$1.28, total balance increases | $48.81 balance | Wallet page |

Each step: cropped screenshot on left, explanation + highlighted key number on right.

## Module 5 — Demo Login Bypass

Each surface adds a `/api/auth/demo-login` POST endpoint:
- Accepts `{ persona: "wholefoods" }` or `{ persona: "alex" }` 
- Creates a session cookie (same JWT flow as normal login) without requiring password or TOTP
- Gated: only active when `DEMO_MODE=true` env var is set
- Response sets the session cookie and returns `{ redirect: "/home" }`
- Surfaces detect demo-login sessions and show a subtle "Demo Mode" pill badge

## Module 6 — Architecture Overview

A single `/architecture` page with:
- **System diagram** (SVG): three Next.js apps, SQLite per surface, shared synthetic data seed, no shared backend
- **Privacy architecture**: on-device scoring → differential privacy → Exchange sees noisy scores only
- **Settlement flow**: USDC on Base (Coinbase L2), BudgetEscrow.sol, atomic fee split
- **Roadmap**: L0.3 (current synthetic demo) → L0.4 (real escrow on Base Sepolia) → L1.0 (production)

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router) |
| Port | 3003 |
| Design | Light theme — Inter font, white/slate-50, surface-colored accents |
| Animations | Framer Motion for flow diagram and stepper transitions |
| Status checks | Client-side fetch to `/api/health` every 10s + server-side polling logged to stdout |
| Orchestration | Docker Compose with bind mounts for HMR |
| Screenshots | Static PNGs in `/public/screenshots/` |

## Design Language

The Launcher is the **narrator** — it sits above the three surfaces and explains them:
- **Light background** (white/slate-50) to contrast with all three surfaces
- **Surface-colored accents**: violet (#8b5cf6) for Soul App, blue (#3b82f6) for Brand Portal, amber (#f59e0b) for Operator Console
- **Clean editorial layout** — generous whitespace, large typography, minimal chrome
- **Flow diagram** uses the three accent colors to show data moving between surfaces
- **Inter font** — neutral, modern, readable

## Demo Credentials

| Surface | Persona | Email | Password | TOTP |
|---------|---------|-------|----------|------|
| Operator Console | Admin | admin@personalos.demo | demo1234 | — |
| Brand Portal | Whole Foods | admin@wholefoods.demo | demo1234 | — |
| Brand Portal | Chase | admin@chase.demo | demo1234 | — |
| Soul App | Alex Rivera | alex@personalos.demo | demo1234 | Real TOTP |
| Soul App | Jordan Chen | jordan@personalos.demo | demo1234 | Real TOTP |

Demo-login bypass skips TOTP for quick access; direct surface login still requires it.

## Docker Compose Orchestration

```yaml
# PersonalOS/docker-compose.yml
services:
  launcher:
    build: ./demo-launcher
    ports: ["3003:3003"]
    volumes: ["./demo-launcher/src:/app/src"]
    environment: [DEMO_MODE=true]
  operator:
    build: ./operator-console
    ports: ["3000:3000"]
    volumes: ["./operator-console/src:/app/src"]
    environment: [DEMO_MODE=true]
  brand:
    build: ./brand-portal
    ports: ["3001:3001"]
    volumes: ["./brand-portal/src:/app/src"]
    environment: [DEMO_MODE=true]
  soul:
    build: ./soul-app
    ports: ["3002:3002"]
    volumes: ["./soul-app/src:/app/src"]
    environment: [DEMO_MODE=true]
```

## Health Endpoints

Each surface adds `/api/health` returning:
```json
{
  "status": "ok",
  "surface": "brand-portal",
  "port": 3001,
  "metrics": {
    "brands": 5,
    "listings": 12,
    "totalEscrowed": 39000
  }
}
```

CORS headers allow the Launcher origin (`:3003`) to fetch these.

## Server-Side Health Logging

The Launcher runs a background interval (every 30s) that polls all three surface health endpoints and logs results:
```
[health] operator-console:3000 ✓ (brands: 5, souls: 847)
[health] brand-portal:3001 ✓ (listings: 12, escrowed: $39K)
[health] soul-app:3002 ✓ (souls: 2, depth_max: 72%)
[health] All surfaces healthy
```

Warnings logged when a surface is unreachable.

## Consequences

- Demo audiences see the full PersonalOS story in one place
- "Follow the Money" narrative makes the value proposition concrete and auditable
- Demo-login bypass eliminates TOTP friction for quick demos while keeping real auth for direct access
- Light theme makes the Launcher visually distinct from all three surfaces
- Docker Compose provides clean orchestration with a path toward production deployment
- Static screenshots require manual recapture after UI changes — README documents the process
