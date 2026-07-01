# ADR-41: Soul onboarding sequence — install to first Insight in under 3 minutes

**Status:** Accepted · **Source:** ADR-05, ADR-06, ADR-31, ADR-32, ADR-02

**Context.** The onboarding flow touches five separate ADRs (passkey, wallet, Plaid, tiered sources, Insight feed) but none defines the end-to-end sequence or its ordering constraints. The ordering is load-bearing: passkey must exist before any encryption can occur (ADR-08), Smart Wallet must exist before any Claim can settle (ADR-32), and Plaid must complete before SoulMind can fire the first Insight (ADR-06). A Soul who hits a dead end at any step churns permanently — the onboarding sequence is the single highest-leverage UX surface in the product.

**Decision.** New Soul onboarding is a five-step gated sequence. Each step has a precondition and a completion gate. The entire sequence targets < 3 minutes wall-clock time.

### Step 1 — App install and account creation
- **Action:** Soul downloads the iOS app and taps "Get Started."
- **Gate:** App is installed, device eligibility confirmed (A12 Bionic minimum for SoulMind CoreML — ADR-22).
- **Failure path:** Devices below A12 see a clear "your device is not supported" message with the minimum iPhone model (iPhone XS / XR, 2018). No partial onboarding on unsupported devices.

### Step 2 — Passkey creation (ADR-31)
- **Action:** Soul creates a WebAuthn passkey via Face ID / Touch ID. The passkey is stored in iCloud Keychain Secure Enclave. The AES-256-GCM encryption key is derived from the passkey via PBKDF2 (ADR-08). PersonalOS never sees the private key.
- **UX copy:** "This passkey protects everything you connect. It never leaves your device — not even we can see it." The explanation must land before the biometric prompt — the Soul needs to understand *why* they are creating a passkey, not just *that* they are.
- **Gate:** Passkey created and stored in iCloud Keychain. Encryption key derivable. This is irreversible for the session — all subsequent steps depend on the passkey existing.
- **Failure path:** If Face ID / Touch ID is not configured on the device, prompt the Soul to set it up in iOS Settings before continuing. Do not offer a password fallback — passkey-only is a deliberate security decision.

### Step 3 — Coinbase Smart Wallet provisioning (ADR-32)
- **Action:** A non-custodial Coinbase Smart Wallet (ERC-4337) is provisioned on Base chain in the background. The Soul's passkey signs the wallet creation UserOperation. The wallet address is stored on the `souls` row in PostgreSQL.
- **UX:** This step is **invisible to the Soul**. No wallet address, no crypto terminology, no confirmation screen. The wallet is provisioned silently while the Soul reads the Plaid Link intro screen (Step 4). The Soul discovers their wallet at the moment of first Yield (ADR-02: "earn-first" reveal).
- **Gate:** Wallet address exists on-chain and is associated with the Soul's account. Gas is sponsored by PersonalOS via paymaster (ADR-32).
- **Failure path:** If wallet provisioning fails (Base chain congestion, paymaster issue), retry silently up to 3 times. If all retries fail, continue to Step 4 — the wallet is not needed until a Claim settles (Phase 2). Surface a retry in the background. Never block onboarding for wallet provisioning.

### Step 4 — First Konnection via Plaid Link (ADR-02, ADR-05 Tier 1)
- **Action:** Soul connects their primary bank account via Plaid Link (embedded WebView). Plaid handles all credential entry — PersonalOS never sees bank credentials.
- **UX copy:** "Connect your bank — your data earns for you." The value proposition is front and centre: this is not a data collection step, it is the first step toward earning Yield.
- **Gate:** Plaid Link completes successfully. At least one bank account is connected. The first Harvest is triggered immediately — Plaid pulls the most recent 12 months of transaction history.
- **Failure path:** If Plaid Link fails (bank not supported, credential error, timeout), offer retry and a curated list of top-10 supported banks. If the Soul abandons Plaid Link, allow them to proceed to the app with zero Konnections — the Insight feed (ADR-06) will prompt them to connect later. Do not dead-end.

### Step 5 — SoulMind enrichment and first Insight (ADR-01, ADR-30, ADR-06)
- **Action:** The Harvest pipeline runs: Plaid data → SoulMind SCE enrichment (ADR-30) → AES-256-GCM encryption (ADR-08) → Arweave Ledger write (ADR-11) → CoreML Scoring (ADR-23) → first Insight generated. The first Insight fires within 90 seconds of Plaid Link completion (ADR-06).
- **UX:** The Soul sees a loading state ("Analyzing your financial patterns...") for ≤ 90 seconds, then the first Insight appears in the feed. This is the "$816 moment" — the smallest compelling Insight from financial data alone (e.g., "You spent $816 on subscriptions you barely used last year").
- **Gate:** At least one Insight is displayed in the feed. The Soul has experienced the core value proposition. Onboarding is functionally complete.
- **Failure path:** If SoulMind Scoring takes longer than 90 seconds (large transaction history, older device), show progressive Insights as they compute rather than waiting for all Categories. If Plaid returns fewer than 50 Transaktions (new account, limited history), SoulMind generates a "connect more sources to unlock deeper insights" prompt instead of a weak Insight.

### Post-onboarding — ongoing deepening (ADR-05, ADR-06)
After Step 5, the Soul is in Phase 1 with a single Konnection. The Insight feed becomes the onboarding engine (ADR-06):
- Each Insight that references a missing data source includes a contextual prompt to add it (Tier 2: Apple Health, Google; Tier 3: Amazon, Uber, Instagram).
- The Depth Score (ADR-18, ADR-19) is visible and rises with each new Konnection.
- Phase 2 (marketplace) unlocks at 60% Depth Score (ADR-18).

There is no "onboarding complete" screen. The Insight feed is the permanent home.

### Sequence diagram

```
Install → [A12+ check] → Passkey creation → [key derived]
                                                ↓
                                    Smart Wallet provisioning (background)
                                                ↓
                                         Plaid Link → [bank connected]
                                                ↓
                                    SoulMind enrichment + Scoring
                                                ↓
                                      First Insight in feed (≤ 90s)
```

**Performance budget (90s first-Insight target).** Plaid API response ~10s, SCE 6-step enrichment ~5s, AES-256-GCM encrypt ~1s, Arweave/Irys write ~15s, CoreML Scoring ~5s, DP noise + POST Insights ~2s. Total ~38s consumed of 90s budget, leaving ~52s margin for network variance and older devices. Validate on A12 Bionic (iPhone XS) with a 500-record 12-month Plaid batch before committing the 90s target in any public-facing copy. If A12 consistently exceeds 90s, raise minimum to A14 (iPhone 12) or relax to 120s with a progress animation.

**Consequences.** The onboarding sequence is the most constrained UX flow in the product — five steps with hard ordering dependencies, three external service calls (iCloud Keychain, Coinbase, Plaid), and a 90-second SoulMind computation. The < 3-minute target is aggressive but achievable because Step 3 (wallet) runs in parallel with Step 4 (Plaid Link). The earn-first wallet reveal (deferred to first Yield) eliminates crypto friction from onboarding entirely — the Soul does not know they have a blockchain wallet until they earn into it. Every failure path allows forward progress — no step permanently blocks onboarding except passkey creation, which is architecturally non-negotiable.
