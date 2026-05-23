# ADR-0002: Base Chain + USDC as Primary Payment Rail

## Status
Accepted

## Context
Claims trigger Yield payments from Brands to Souls. We needed a payment rail for these micro-payments. Options included fiat (Stripe, UPI) and crypto.

## Decision
USDC stablecoin on Base (Coinbase L2) is the primary Payment Rail. When a Claim is made, USDC moves atomically from the Brand's Budget escrow to PersonalOS (fee) and the Soul's Wallet via smart contract. Fiat off-ramps (Stripe for US, UPI for India) are available to Souls via Coinbase's built-in on/off-ramp.

## Alternatives Considered
- **Stripe-first** — simpler to start, familiar, but requires separate solutions for India (UPI), creates credit risk, and doesn't align with the data sovereignty narrative.
- **Bitcoin** — too volatile for micro-payments, high transaction fees, slow settlement. Wrong tool for $2–20 Claim payments.
- **Ethereum mainnet** — $1–10 gas fees per transaction make micro-payments economically unviable.
- **Solana** — cheapest and fastest, but different dev stack (Rust/Anchor) and weaker fiat on/off-ramp story.

## Consequences
- Atomic Claim settlement via smart contract eliminates payment processing lag and credit risk.
- Coinbase's built-in on/off-ramp solves the fiat conversion problem without building it.
- Base is EVM-compatible — standard Solidity tooling applies.
- Brands must fund Listings in USDC (pre-funded Budget), which may create friction for non-crypto-native Brands.
