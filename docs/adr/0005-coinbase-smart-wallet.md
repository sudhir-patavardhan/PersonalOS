# ADR-0005: Coinbase Smart Wallet for Soul Wallets

## Status
Accepted (amended: settlement retry, wallet export semantics, iOS-only scope)

## Context
Each Soul needs a Wallet to receive USDC Yield. The question was whether PersonalOS holds custody of Soul funds or Souls hold their own keys.

## Decision
Each Soul's Wallet is provisioned via Coinbase Smart Wallet on Soul signup. Keys are custodied via passkey/biometrics (iCloud Keychain on iOS) — no seed phrase required. Yield is deposited directly on-chain to the Soul's address. PersonalOS cannot access Wallet funds.

### Platform Scope
PersonalOS is iOS-only at launch. Android is not on the current roadmap. The passkey/iCloud Keychain model is iOS-native and not designed for cross-platform use at this stage.

### Claim Settlement Retry
PersonalOS backend owns on-chain settlement reliability:
- An idempotency key is held per Claim to prevent double-payment
- The backend monitors Base chain for transaction confirmation
- On timeout, the transaction is retried with higher gas
- Soul-facing states: "confirming..." on Claim tap (optimistic) → "confirmed" on-chain confirmation → "delayed — we're on it" if confirmation has not arrived within 60 seconds
- The Soul never retries manually

### Wallet Export and Portability
Coinbase Smart Wallet is a smart contract account — there is no seed phrase to export. "Export" means portability to any Coinbase Smart Wallet-compatible app:
- The Soul's wallet address is permanently theirs on-chain, regardless of PersonalOS
- The Soul can access the same address directly via the Coinbase Wallet app
- App copy is explicit: "your wallet address is yours forever, accessible via Coinbase Wallet" — not "export private key"

## Alternatives Considered
- **PersonalOS custodial Wallet** — simplest UX, but PersonalOS controls Soul funds. A freeze, breach, or regulatory action could block Soul access to their Yield. Directly contradicts the platform's data and financial sovereignty promise.
- **Fully non-custodial (seed phrase)** — Soul holds keys entirely, maximum sovereignty. But seed phrase onboarding has high drop-off and irreversible loss risk. Not viable as a default for a consumer app.
- **Other embedded wallet providers (Privy, Dynamic)** — viable alternatives, but Coinbase Smart Wallet is native to Base chain, has the strongest fiat on/off-ramp story via Coinbase, and aligns with the rest of the Base/USDC stack.

## Consequences
- No seed phrases in the onboarding flow — Soul signs in with passkey/biometrics.
- iCloud Keychain backs up the passkey, making key recovery accessible to iOS users without extra friction.
- PersonalOS is technically and legally unable to freeze or access Soul Wallet funds.
- Coinbase's on/off-ramp enables fiat Withdrawal without PersonalOS building payment infrastructure.
- Settlement retry logic requires PersonalOS backend to maintain per-Claim confirmation state and monitor Base chain events.
- Smart contract account model means wallet portability is Coinbase ecosystem-scoped, not universal — documented explicitly to avoid misleading Souls about the nature of export.
