# ADR-32: Coinbase Smart Wallet (ERC-4337) for Yield receipt

**Status:** Accepted · Supersedes: fiat coupon/cashback model · **Source:** site + ADR blended

**Decision.** Each Soul is provisioned a non-custodial Coinbase Smart Wallet on Base chain (ERC-4337 account abstraction) during onboarding. The wallet address is stored on the `souls` row. USDC Yield from Claim settlement is deposited directly to this wallet by the `BudgetEscrow.sol` smart contract atomically on Claim. PersonalOS never custodies Soul funds — the smart contract transfers directly from Brand escrow to the Soul's wallet.

The passkey (ADR-31) signs ERC-4337 UserOperations for Claim transactions — no separate crypto wallet seed phrase is required. The Soul's existing Apple ecosystem identity (Face ID / Touch ID backed passkey) is the key for both identity and wallet.

**Consequences.** Non-custodial: PersonalOS cannot access or freeze Soul wallets. Fiat off-ramp via Coinbase off-ramp flow (Coinbase-hosted; PersonalOS mediates only the session URL). Soul onboarding adds Smart Wallet provisioning as an async step after passkey creation. Gas fees for UserOperation submission are abstracted via a paymaster — PersonalOS sponsors gas for Claim transactions, recovering the cost from the platform fee.

---

## Implementation Detail

*Merged from the original Coinbase Smart Wallet ADR (pre-unified numbering). Contains settlement retry mechanics, wallet export semantics, and iOS-only scope.*

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

### Wallet Export and Portability
Coinbase Smart Wallet is a smart contract account — there is no seed phrase to export. "Export" means portability to any Coinbase Smart Wallet-compatible app:
- The Soul's wallet address is permanently theirs on-chain, regardless of PersonalOS
- The Soul can access the same address directly via the Coinbase Wallet app
- App copy is explicit: "your wallet address is yours forever, accessible via Coinbase Wallet" — not "export private key"

### Alternatives Considered (original ADR)
- **PersonalOS custodial Wallet** — simplest UX, but PersonalOS controls Soul funds. A freeze, breach, or regulatory action could block Soul access to their Yield. Directly contradicts the platform's data and financial sovereignty promise.
- **Fully non-custodial (seed phrase)** — Soul holds keys entirely, maximum sovereignty. But seed phrase onboarding has high drop-off and irreversible loss risk. Not viable as a default for a consumer app.
- **Other embedded wallet providers (Privy, Dynamic)** — viable alternatives, but Coinbase Smart Wallet is native to Base chain, has the strongest fiat on/off-ramp story via Coinbase, and aligns with the rest of the Base/USDC stack.

### Consequences (original ADR)
- No seed phrases in the onboarding flow — Soul signs in with passkey/biometrics.
- iCloud Keychain backs up the passkey, making key recovery accessible to iOS users without extra friction.
- PersonalOS is technically and legally unable to freeze or access Soul Wallet funds.
- Coinbase's on/off-ramp enables fiat Withdrawal without PersonalOS building payment infrastructure.
- Settlement retry logic requires PersonalOS backend to maintain per-Claim confirmation state and monitor Base chain events.
- Smart contract account model means wallet portability is Coinbase ecosystem-scoped, not universal — documented explicitly to avoid misleading Souls about the nature of export.
