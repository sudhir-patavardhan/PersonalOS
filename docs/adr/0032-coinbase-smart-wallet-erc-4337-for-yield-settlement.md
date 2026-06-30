# ADR-32 — Coinbase Smart Wallet (ERC-4337) for Yield receipt
**Status:** Accepted · Supersedes: fiat coupon/cashback model · **Source:** site + ADR blended

**Decision.** Each Soul is provisioned a non-custodial Coinbase Smart Wallet on Base chain (ERC-4337 account abstraction) during onboarding. The wallet address is stored on the `souls` row. USDC Yield from Claim settlement is deposited directly to this wallet by the `BudgetEscrow.sol` smart contract atomically on Claim. PersonalOS never custodies Soul funds — the smart contract transfers directly from Brand escrow to the Soul's wallet.

The passkey (ADR-31) signs ERC-4337 UserOperations for Claim transactions — no separate crypto wallet seed phrase is required. The Soul's existing Apple ecosystem identity (Face ID / Touch ID backed passkey) is the key for both identity and wallet.

**Consequences.** Non-custodial: PersonalOS cannot access or freeze Soul wallets. Fiat off-ramp via Coinbase off-ramp flow (Coinbase-hosted; PersonalOS mediates only the session URL). Soul onboarding adds Smart Wallet provisioning as an async step after passkey creation. Gas fees for UserOperation submission are abstracted via a paymaster — PersonalOS sponsors gas for Claim transactions, recovering the cost from the platform fee.

---
