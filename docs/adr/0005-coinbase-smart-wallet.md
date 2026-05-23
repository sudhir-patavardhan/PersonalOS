# ADR-0005: Coinbase Smart Wallet for Soul Wallets

## Status
Accepted

## Context
Each Soul needs a Wallet to receive USDC Yield. The question was whether PersonalOS holds custody of Soul funds or Souls hold their own keys.

## Decision
Each Soul's Wallet is provisioned via Coinbase Smart Wallet on Soul signup. Keys are custodied via passkey/biometrics (iCloud Keychain on iOS) — no seed phrase required. Yield is deposited directly on-chain to the Soul's address. PersonalOS cannot access Wallet funds. Souls can export their wallet at any time for full non-custodial sovereignty.

## Alternatives Considered
- **PersonalOS custodial Wallet** — simplest UX, but PersonalOS controls Soul funds. A freeze, breach, or regulatory action could block Soul access to their Yield. Directly contradicts the platform's data and financial sovereignty promise.
- **Fully non-custodial (seed phrase)** — Soul holds keys entirely, maximum sovereignty. But seed phrase onboarding has high drop-off and irreversible loss risk. Not viable as a default for a consumer app.
- **Other embedded wallet providers (Privy, Dynamic)** — viable alternatives, but Coinbase Smart Wallet is native to Base chain, has the strongest fiat on/off-ramp story via Coinbase, and aligns with the rest of the Base/USDC stack.

## Consequences
- No seed phrases in the onboarding flow — Soul signs in with passkey/biometrics.
- iCloud Keychain backs up the passkey, making key recovery accessible to iOS users without extra friction.
- PersonalOS is technically and legally unable to freeze or access Soul Wallet funds.
- Coinbase's on/off-ramp enables fiat Withdrawal without PersonalOS building payment infrastructure.
