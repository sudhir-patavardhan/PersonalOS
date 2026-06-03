# Integrations & Pre-Implementation Sign-Ups

Everything that needs to be in place before implementation begins, ordered by priority.

---

## Critical Path — Must Have Before Writing Code

### 1. Plaid
**What for:** Konnections — Soul connects their bank account; Transaktions flow in.

- Sign up: `dashboard.plaid.com`
- Get: `client_id` + `secret` (Sandbox keys available immediately)
- Products to enable: **Transactions**
- iOS: Plaid Link SDK (add via Swift Package Manager)
- **Production access requires a separate approval** — Plaid reviews your use case, privacy policy, and data handling. Apply early; can take days to weeks.

---

### 2. Coinbase Developer Platform
**What for:** Coinbase Smart Wallet (Soul Wallets) + Coinbase Onramp/Offramp (fiat Withdrawals).

- Sign up: `portal.cdp.coinbase.com`
- Get: API key for Smart Wallet SDK
- iOS: Coinbase Smart Wallet SDK (Swift)
- Also covers: fiat → USDC for Brands, USDC → fiat for Soul Withdrawals
- Sandbox available immediately; production is the same account

---

### 3. Alchemy (Base RPC Provider)
**What for:** Reliable Base chain access — contract deployment, event listening (Listing funded, Claim settled), reading chain state.

- Sign up: `alchemy.com`
- Create an app on **Base Mainnet** and **Base Sepolia** (testnet)
- Get: RPC URL + API key
- Free tier is sufficient for development; upgrade before launch

---

### 4. Irys (Arweave Bundler)
**What for:** Permanent storage of the E2E encrypted Ledger after each Harvest.

- No traditional sign-up — it's a funded node
- **Dev/testing:** Irys Devnet is free (uploads up to 100KB, no cost)
- **Production:** Fund a server-side wallet with ETH on Base or Arbitrum (Irys accepts both)
- You'll need a server-side hot wallet keypair to sign Irys uploads — generate one and fund it

---

### 5. Apple Developer Program
**What for:** Everything iOS — TestFlight, App Store, iCloud Keychain (passkey-backed Ledger encryption + Smart Wallet), APNS (Offer push notifications).

- Sign up: `developer.apple.com`
- Cost: $99/year (individual) or $299/year (organization)
- **This is the single longest lead-time item** — Apple account review can take several days if you're enrolling as an organization
- Enables: iCloud Keychain entitlement, push notification certificates, TestFlight for beta testing

---

## Needed Before Launch, Not Before Development

### 6. Basescan API Key
**What for:** Verifying deployed smart contracts publicly so anyone can audit the escrow logic.

- Sign up: `basescan.org/register`
- Free — takes 2 minutes

---

### 7. Backend Hosting + Database
**What for:** Running the Exchange matching service, Insight score storage, Listing/Offer API.

- Any provider works: **Railway** (easiest for solo dev), Render, AWS, GCP
- Database: **PostgreSQL** — Supabase or Railway Postgres are the lowest-friction options
- Not a blocker for local development

---

### 8. Stripe (Brand Subscriptions)
**What for:** Recurring Brand subscription billing for Exchange access (one of the three revenue streams).

- Sign up: `dashboard.stripe.com`
- Stripe handles Brand-facing web billing only
- Can defer until Brand onboarding is built

---

## Testnet Setup (Day 1 Dev Task, Not a Sign-Up)

- Get **Base Sepolia ETH** from the Base faucet (free, instant) — needed for deploying and testing smart contracts
- Generate a **dev wallet keypair** (e.g. `cast wallet new` via Foundry) — used for contract deployment and Irys uploads in dev

---

## Summary

| Integration | Sign-up Required | Cost | Approval Wait | Priority |
|---|---|---|---|---|
| Plaid | Yes | Free (sandbox) | Production: days–weeks | **MVP blocker** |
| Coinbase Developer Platform | Yes | Free | Immediate | **MVP blocker** |
| Alchemy | Yes | Free tier | Immediate | **MVP blocker** |
| Irys | No (fund wallet) | Near zero | Immediate | **MVP blocker** |
| Apple Developer | Yes | $99–299/yr | Days (org review) | **MVP blocker** |
| Basescan | Yes | Free | Immediate | Pre-launch |
| Hosting + DB | Yes | ~$10–50/mo | Immediate | Pre-launch |
| Stripe | Yes | % of revenue | Immediate | Phase 2 |

> **Start Apple Developer and Plaid production applications today** — they're the only two with meaningful approval wait times.
