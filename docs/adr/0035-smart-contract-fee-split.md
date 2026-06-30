# ADR-35: Smart contract enforces fee split and Yield deposit; PersonalOS cannot redirect

**Status:** Accepted · **Source:** site (contracts.html)

**Decision.** `BudgetEscrow.sol` on Base chain encodes the platform fee split in immutable bytecode. The fee percentage and Yield calculation are not configurable by PersonalOS post-deployment — they require a new contract deployment, which is publicly observable on-chain. A `ConsentRegistry.sol` (roadmap) will encode which Categories a Soul has consented to, making Consent grants on-chain verifiable.

The site's framing: *"What separates 'trust us' from 'verify it.' The contracts on Base mean PersonalOS structurally cannot betray Souls."* This is the architectural complement to ADR-07's on-device processing — together they make the privacy and economic promises structurally enforced, not policy-dependent.

**Consequences.** Contract upgrade governance must be defined (multisig, timelock). Fee split changes require transparent on-chain notice. PersonalOS must publish contract addresses in-app and in documentation. Souls who understand blockchain can independently verify that every Claim correctly credited their wallet.

---

> **See also:** ADR-33 § Implementation Detail for smart contract model and immutable fee split.
