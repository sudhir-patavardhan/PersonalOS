# ADR-33: USDC on Base chain as Yield settlement currency; `BudgetEscrow.sol`

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

## Implementation Detail

*Merged from the original USDC Payment Rail ADR (pre-unified numbering). Contains crypto-native positioning, Brand payment flow, and smart contract model specifics.*

### Crypto-Native Positioning
PersonalOS is openly crypto-native — this is a feature, not a footnote. Brands see they are funding in USDC on Base. Souls see a USDC wallet and their Base chain address. The crypto identity is front and centre for both sides of the marketplace. The competitive advantage of atomic, transparent, auditable settlement is part of the platform narrative.

### Brand Payment Flow
Brands fund Listings directly in USDC. Coinbase Commerce provides a seamless fiat-to-USDC conversion flow so non-crypto-native Brands can pay by card or bank transfer — but the Budget escrow, fee split, and Yield settlement are all USDC on Base end-to-end. PersonalOS never holds fiat on the Brand side.

### Soul Onboarding — Earn-First
Soul UX is explicitly crypto-native from day one. Onboarding sequence:
1. Connect bank — "your data earns for you"
2. First Offer arrives — Soul Claims, sees USDC land in real time
3. Wallet reveal at moment of first Yield — "That's yours, on-chain, forever. Here's your address."

The fiat conversion button (Coinbase on/off-ramp) is always visible alongside the USDC balance. Crypto identity is upfront; the emotional entry point is earning, not infrastructure.

### Smart Contract Model
Claim settlement uses an immutable OpenZeppelin escrow pattern deployed on Base:
- `deposit(listing_id, amount)` — Brand locks USDC into the contract
- `settle(soul_address, claim_amount)` — PersonalOS backend calls on each Claim; contract splits atomically into platform fee and Soul Yield
- Contract balance exhausted → Listing deactivates automatically

The contract is immutable once deployed. The fee rate is set at deploy time and published openly — it is a public, auditable commitment, not a terms-of-service promise. If the fee rate changes, a new contract version is deployed; existing Listings honour the rate at which they were funded. Contract address and ABI are published openly on Base chain.

Fee split percentage is deferred to a commercial decision.

### Alternatives Considered (original ADR)
- **Stripe-first** — simpler to start, familiar, but requires separate solutions for India (UPI), creates credit risk, and doesn't align with the data sovereignty narrative.
- **Bitcoin** — too volatile for micro-payments, high transaction fees, slow settlement. Wrong tool for $2–20 Claim payments.
- **Ethereum mainnet** — $1–10 gas fees per transaction make micro-payments economically unviable.
- **Solana** — cheapest and fastest, but different dev stack (Rust/Anchor) and weaker fiat on/off-ramp story.
- **Upgradeable contract** — rejected because PersonalOS could change the fee split unilaterally, undermining the trustless narrative.

### Consequences (original ADR)
- Atomic Claim settlement via smart contract eliminates payment processing lag and credit risk.
- Coinbase Commerce abstracts fiat-to-USDC conversion for Brands — no crypto knowledge required to fund a Listing.
- Coinbase's built-in on/off-ramp solves fiat Withdrawal for Souls without PersonalOS building payment infrastructure.
- Base is EVM-compatible — standard Solidity tooling applies.
- Immutable contract means bugs in settlement logic cannot be patched without migrating to a new contract and updating all active Listings.
- Crypto-native positioning may slow early Brand adoption among non-crypto advertisers; offset by the seamless Coinbase Commerce conversion flow.

---

## Amendment: Soul Reputation Proof On-Chain (July 2026)

To support the Compounding Data Identity vertex of the Impossible Triangle (ADR-62 §1), soul reputation data is anchored on-chain as a verifiable, tamper-proof record.

### What is stored on-chain

A periodic reputation proof for each active soul, submitted as calldata on Base:

```
ReputationProof {
  soulHash: bytes32        // hashed soul identifier (not wallet address — privacy-preserving)
  compositeScore: uint16   // 0-100 composite reputation score
  followThroughRate: uint16 // 0-10000 (basis points, e.g., 7800 = 78%)
  sourceCount: uint8       // number of connected data sources (0-15)
  tenureWeeks: uint16      // weeks since soul onboarding
  proofTimestamp: uint256
}
```

### How it works

1. The PersonalOS backend computes the soul's composite reputation score on the server from aggregated, anonymized signals (claim history, follow-through rate, source count, tenure)
2. A weekly batch job submits reputation proofs for all active souls as calldata on Base
3. The proof is a commitment — it does not reveal raw data, individual transactions, or PII
4. Souls can reference their on-chain reputation proof when interacting with other platforms or services that recognize PersonalOS reputation

### Why on-chain

- **Compounding identity:** A soul's reputation proof accumulates over time. Even if PersonalOS ceased to exist, the on-chain record persists — the soul's verified behavioral history is theirs, not the platform's
- **Portable trust:** Other platforms or services can verify a soul's reputation without trusting PersonalOS's API — the proof is on Base chain, readable by anyone
- **Anti-gaming:** Historical proofs are immutable. A soul cannot retroactively inflate their reputation. The chain of weekly proofs creates a verifiable trajectory
- **Impossible Triangle support:** The accumulated reputation proofs are the concrete mechanism behind "compounding data identity" (ADR-62 Vertex 2) — technology is replicable, but years of verified on-chain reputation history is not

### Privacy constraints

- `soulHash` is a one-way hash — cannot be reversed to identify the soul without the original identifier
- No PII, wallet address, or transaction data is included in the proof
- The proof reveals aggregate reputation metrics only — not which categories, which brands, or which specific claims contributed to the score
- Souls can opt out of on-chain reputation proofing (reputation is still computed, just not anchored on-chain)

### Storage choice

Base chain calldata (not contract storage) for cost efficiency. At ~$0.001 per proof submission on Base L2, weekly proofs for 10,000 souls cost ~$10/week. Alternative: Arweave for permanent storage at even lower cost if Base calldata pruning becomes a concern at scale.

> **Amendment log:** July 2026 — Added soul reputation proof on-chain storage per delivery channel grilling decisions. Supports ADR-62 (Impossible Triangle, Vertex 2: Compounding Data Identity).
