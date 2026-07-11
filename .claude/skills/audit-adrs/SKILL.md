---
name: audit-adrs
description: Audit PersonalOS ADR files against the 5 core architectural constraints (privacy spine, k≥50, no PII, immutable fee, sensitive categories). Use this skill whenever ADRs are added, amended, or the user wants to check architectural consistency. Triggers on "audit", "check ADRs", "privacy audit", "constraint check", "ADR violations", or any concern about ADR consistency.
---

# ADR architectural constraint audit

You are auditing PersonalOS Architecture Decision Records for violations of the platform's 5 non-negotiable constraints. These constraints are the "privacy spine" — if any ADR contradicts them, the entire trust narrative collapses. An investor, regulator, or technical co-founder reading the ADRs would find the contradiction and lose confidence.

## The 5 constraints

### Constraint 1 — Raw data never leaves the device
**Source:** ADR-07

Any language suggesting the backend, server, API, or cloud computes, processes, accesses, stores, or temporarily holds raw user data (transactions, purchases, browsing history, health data, location, social media content) is a violation. Only aggregated scores, noisy insight summaries, and metadata should leave the device.

Watch for:
- "backend computes..." or "server processes..."
- "assembles the batch" (implies server touches raw data)
- Data flowing through the server as a relay (even encrypted — ADR-07 says "not even encrypted")
- Plaid/bank data being processed server-side before reaching the device
- Reputation or tier scores computed on the server from underlying signals
- Any flow where the server could structurally read raw user data, even if it "doesn't"

The test: if you deleted the server, would the raw data still never leave the device? If the server is in the data path, it's a violation.

### Constraint 2 — Brands never see individual soul data (k≥50)
**Source:** ADR-37, ADR-14

Any language suggesting brands can access individual-level scores, identify individual souls, or receive data at granularity below k≥50 aggregation is a violation. This includes:

- Showing counts below 50 to brands (e.g., "12 Platinum souls in automotive")
- Individual soul scores visible via consent tokens or any mechanism
- On-chain events that link a brand's listing to a specific soul wallet
- Per-soul reputation proofs readable by anyone on a public chain
- Webhook calls that enable a brand to correlate claims to individual customers
- Any mechanism where a brand could narrow the anonymity set below 50

The test: could a brand, by observing only what this ADR gives them access to, identify or profile a specific soul? If yes, it's a violation.

### Constraint 3 — No PII shared with any third party, even hashed
**Source:** ADR-37, ADR-31

Any language suggesting PII (names, emails, wallet addresses, phone numbers, device identifiers) is shared, transmitted, or accessible to brands, operators, or external parties is a violation. This explicitly includes:

- Hashed identifiers on public blockchains (Arweave, Base) — hashed PII is still PII
- Wallet addresses in on-chain events (persistent pseudonymous identifiers)
- soul_id_hash, soulHash, or any hashed soul identifier published publicly
- Any persistent identifier that could be correlated across interactions

The test: is there a persistent identifier visible to a third party that maps to a specific soul, even indirectly? If yes, it's a violation.

### Constraint 4 — Immutable fee, not policy-adjustable
**Source:** ADR-35

The platform fee is `constant FEE_BPS = 1000` in BudgetEscrow.sol — immutable bytecode. Any language suggesting the fee can be changed via config, admin panel, governance vote, operator console, or time-delayed governance call without deploying an entirely new contract is a violation.

Watch for:
- "operator-adjustable" fee rates
- "configurable floor" within a range
- "governance call" to change the active rate
- Any language that distinguishes "ceiling" (immutable) from "active rate" (adjustable)

The trust claim is: "it is a mathematical impossibility to charge more than 10% through this contract." If the active rate can change within a range, that's "trust us to stay within the range" — policy, not bytecode.

### Constraint 5 — Sensitive category guardrails
**Source:** ADR-15, ADR-55 §12

Health conditions, fertility, financial distress, mental health, legal matters, and addiction categories must not be predicted or inferred without explicit safeguards. Health data must never enter the marketplace (`marketplace_eligible: false`). Watch for:

- Health data being tradeable or marketplace-eligible
- AI/ML predicting sensitive categories without requiring 3+ prior data points AND prior activity
- Sensitive inferences without opt-in consent
- Missing `health_flag` or `marketplace_eligible: false` on health-adjacent data

## How to run the audit

### Input
The argument to this skill is optional:
- No argument: audit ALL .md files in the ADR directory
- A number (e.g., "33"): audit only that specific ADR
- Multiple numbers (e.g., "33 54 58"): audit only those ADRs

### Step 1 — Locate and read ADRs

Find the ADR directory. It is at `PersonalOS/docs/adr/` relative to the project root. Read every ADR file (or the specified subset). Skip the unified compilation file (`PersonalOS_ADR_Unified.md`) if present.

For a full audit with many ADRs, use parallel subagents — split the ADRs into batches of ~15-20 and audit each batch in parallel. Each subagent should receive the full constraint definitions above.

### Step 2 — Check each ADR against all 5 constraints

For each ADR:
1. Read the entire file
2. Check every statement, code block, example, table, and amendment against all 5 constraints
3. Be strict: if language is ambiguous about WHERE computation happens (device vs server), flag it as ambiguous
4. If an ADR acknowledges a risk but implements the risky mechanism anyway, that's still a violation (acknowledging a risk doesn't resolve it)

### Step 3 — Check for cross-ADR contradictions

After individual checks, look for contradictions between ADRs:
- Does one ADR say the fee is immutable while another says it's adjustable?
- Does one ADR promise k≥50 while another shows sub-50 counts to brands?
- Does one ADR say "not even encrypted data leaves" while another has the server relaying encrypted blobs?
- Does one ADR's amendment contradict the base ADR's principles?

### Step 4 — Classify severity

- **Critical**: Direct, unambiguous violation of a core constraint. The language clearly states something that breaks the privacy spine. Must be fixed before any investor or regulator reads the ADRs.
- **High**: Clear violation but in a specific feature or example, not the core architecture. The mechanism enables a constraint breach even if the intent was sound.
- **Medium**: Ambiguous language that could be read as a violation. The ADR doesn't explicitly violate a constraint but doesn't explicitly prevent the violation either.
- **Ambiguous**: The ADR is silent on a question it should answer (e.g., doesn't state where computation happens when it matters).

### Step 5 — Output the report

Present results in this structure:

1. **Summary stats**: ADRs audited, ADRs with violations, total violations, count by severity
2. **Violations by constraint**: how many violations each constraint has
3. **Ranked violation list** (most severe first): for each violation:
   - ADR number and title
   - Severity badge
   - Constraint number(s) violated
   - Exact quote from the ADR
   - Why it's a violation (one sentence)
   - Suggested fix direction (one sentence)
4. **Cross-ADR contradictions** (if any)
5. **Clean ADRs**: list of ADRs that passed all checks

Use the show_widget visualization tool to render the report as an interactive dashboard if available, otherwise present as structured text.

## Important notes

- Amendments added to existing ADRs are common sources of violations — they're often written in a hurry and may not have been checked against the base constraints
- On-chain events and public blockchain data are frequently overlooked as PII vectors
- The Plaid data flow (bank transactions via API) is a common violation point for constraint 1
- Demand dashboards and tier distributions are common violation points for constraint 2
- "The server doesn't read it" is not the same as "the server can't read it" — structural guarantees matter, not behavioral promises
