# ADR-35: Smart contract enforces fee split and Yield deposit; PersonalOS cannot redirect

**Status:** Accepted · **Source:** site (contracts.html)

**Decision.** `BudgetEscrow.sol` on Base chain encodes the platform fee split in immutable bytecode. The fee percentage and Yield calculation are not configurable by PersonalOS post-deployment — they require a new contract deployment, which is publicly observable on-chain. A `ConsentRegistry.sol` (roadmap) will encode which Categories a Soul has consented to, making Consent grants on-chain verifiable.

The site's framing: *"What separates 'trust us' from 'verify it.' The contracts on Base mean PersonalOS structurally cannot betray Souls."* This is the architectural complement to ADR-07's on-device processing — together they make the privacy and economic promises structurally enforced, not policy-dependent.

**Consequences.** Contract upgrade governance must be defined (multisig, timelock). Fee split changes require transparent on-chain notice. PersonalOS must publish contract addresses in-app and in documentation. Souls who understand blockchain can independently verify that every Claim correctly credited their wallet.

---

## Amendment: Constitutional Immutability (July 2026)

The immutable fee split in BudgetEscrow.sol (`constant FEE_BPS = 1000`) is the first article of PersonalOS's **on-chain constitution** — a set of cryptographic commitments that define what the platform can and cannot do, enforceable by anyone who can read the blockchain.

**Why "constitutional" matters:** Terms of service are policy promises — a lawyer can change them. Smart contract bytecode is a structural commitment — changing it requires deploying a new contract, which is publicly observable on Base chain. The `constant` keyword in Solidity means the value is embedded in the contract's bytecode at compile time and cannot be modified by any function call, governance vote, or administrative action. This is not a promise to keep fees at 10% — it is a mathematical impossibility to charge more than 10% through this contract.

**Constitutional framing for all PersonalOS communications:**
- "The 10% fee ceiling is not a policy — it is bytecode. Changing it requires deploying a new contract, which is publicly observable on-chain."
- "This is the first article of PersonalOS's on-chain constitution. More articles will follow as the governance model matures."

**Relationship to future constitutional commitments (ADR-62 §4):**
1. Fee ceiling ≤ 10% — **already enforced** (BudgetEscrow.sol `constant FEE_BPS = 1000`)
2. Raw data never leaves the device — enforced by architecture (ADR-07), future on-chain attestation
3. Brand intelligence never includes individual soul data — enforced by k≥50 floor (ADR-37), future on-chain attestation
4. Fee changes require 90-day on-chain governance notice — future governance contract
5. Key-destruction deletion is permanent — enforced by architecture (ADR-09), future on-chain attestation

**On-chain governance process (future):** Any change to constitutional commitments will require: (1) a publicly visible on-chain proposal, (2) a minimum 90-day notice period, (3) a new contract deployment (old contract remains readable as historical record). This process is defined in ADR-62 and will be implemented as the governance model matures.

---

> **See also:** ADR-33 § Implementation Detail for smart contract model and immutable fee split. ADR-62 (Competitive Moat & On-Chain Constitution).
>
> **Amendment log:** July 2026 — Added constitutional immutability framing and on-chain governance process reference per delivery channel grilling decisions.
