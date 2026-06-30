# ADR-33 — USDC on Base chain as Yield settlement currency; `BudgetEscrow.sol`
**Status:** Accepted · Supersedes: fiat cashback / coupon model · **Source:** site

**Decision.** All Yield settlement uses USDC on Base chain. Brands fund Listings by depositing USDC into `BudgetEscrow.sol` on Base. On Claim, the contract atomically:
1. Verifies PersonalOS Backend signature + Soul passkey signature.
2. Checks escrow balance ≥ `bid_per_claim_usdc`.
3. Transfers `platform_fee_usdc` → PersonalOS fee wallet.
4. Transfers `yield_usdc` → Soul Smart Wallet.
5. Emits `ClaimSettled(listing_id, soul_wallet, yield_usdc, fee_usdc, tx_hash)`.

The smart contract makes the fee split and Yield deposit immutable and publicly auditable. PersonalOS structurally cannot alter the fee split or redirect Yield without deploying a new contract.

**Consequences.** Regulatory exposure: USDC settlement may trigger FinCEN money-services-business classification, state money-transmitter licensing requirements, and MiCA obligations in the EU. Legal review required before launch in each jurisdiction. Coinbase Smart Wallet's passkey-based signing model removes the need for Souls to understand private keys or seed phrases.

---
