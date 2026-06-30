# ADR-28: On-device intelligence replaces zero-retention cloud API

**Status:** Accepted · Supersedes: ADR-28 (zero-retention API tier over local Ollama) · **Source:** site Flow 2 and ADR-07

**Decision.** ADR-28 (original) accepted a zero-retention cloud LLM API as the intelligence layer, with privacy guaranteed by contract. This is superseded by the on-device SoulMind architecture (ADR-22 through ADR-25), where no LLM API call is made during Harvest or Scoring. The privacy guarantee returns to architectural: PersonalOS structurally cannot read Transaktion data because SoulMind never sends it.

Cloud LLM APIs may be used for non-Transaktion purposes (e.g., generating natural-language Insight narrative text from score deltas, with no raw data in the prompt) but this is a UI enhancement, not a core intelligence function.

**Consequences.** The marketing claim "we cannot read your data" is structurally true again, not merely contractual. Removes Anthropic API dependency from the critical intelligence path. Prior SKILL.md files (`consumer_dna.skill`, `offer_match.skill`, `finance_analysis.skill`) are retired as intelligence infrastructure; their logic is re-implemented in SoulMind CoreML models and Swift code.

---

## Section 5 — New ADRs (29–37)
