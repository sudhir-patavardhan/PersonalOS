# ADR-22: On-device iOS SoulMind models over cloud LLM Agent SDK

**Status:** Accepted · Supersedes: ADR-22 through ADR-28 (Agent SDK / MCP / SKILL.md / zero-retention API) · **Source:** site (Harvest → Scoring → Insight, Flow 2)

**Context.** The prior ADR log accepted Claude Agent SDK, MCP connectors, and SKILL.md files (ADR-22 through ADR-25, ADR-27, ADR-28) as the intelligence layer. The site architecture runs all intelligence on the iOS device using native models — no cloud LLM API call is made for Scoring or Insight generation.

**Decision.** The intelligence layer is SoulMind: a suite of on-device iOS models (CoreML, Create ML, and custom Swift inference code) that run entirely within the Soul's device. No Transaktion data is transmitted to any cloud LLM for processing. SoulMind components:

1. **Semantic enrichment engine** (ADR-30) — resolves schema heterogeneity across sources, normalises merchants, infers categories, tags intent signals.
2. **Insight Scoring models** (ADR-23) — CoreML models compute propensity scores per Category from enriched Transaktions.
3. **Cross-source correlation engine** (ADR-24) — on-device pattern matching across Konnection types.
4. **Offer relevance ranker** (ADR-25) — on-device score used as input to Exchange matching.

The prior Agent SDK / SKILL.md / MCP / zero-retention-API decisions (ADR-22 through ADR-28) are superseded for the intelligence layer. PersonalOS Backend does not call any LLM API as part of the Harvest or Scoring pipeline.

**Consequences.** Requires iOS ML engineering capability (CoreML, Create ML, Swift). Models must be small enough to run on A12 Bionic (2018 iPhone XS minimum). Model updates are shipped via iOS app updates — the model version is stored in the `algorithm_version` field on Insight records for reproducibility. The `is_stale` flag on Insights enables background re-Scoring when a new model version ships without blocking the Exchange.
