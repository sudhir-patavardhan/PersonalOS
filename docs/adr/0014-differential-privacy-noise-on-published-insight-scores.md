# ADR-14 — Differential-privacy noise on published Insight scores
**Status:** Accepted · Supersedes: ADR-14 (Open) · **Source:** delta analysis elevation (June 2026)

**Context.** The behavioral specificity visible in PersonalOS Insights ("76 coffee outings/yr," "matched on Tokyo pattern") is sufficiently precise to re-identify individuals in narrow geographies even if names are absent. Under permanent Arweave storage (ADR-11), this risk is elevated from a theoretical concern to a concrete long-horizon exposure.

**Decision.** SoulMind (ADR-30) applies calibrated Gaussian noise to Insight scores before they are transmitted to PersonalOS Backend. The noise budget is set such that:
- Individual-level Insights surfaced within the Soul's own iOS app are noise-free (the Soul sees their true data).
- Insight scores transmitted to the server (`POST /souls/{soul_id}/insights`) have noise applied such that ε ≤ 2.0 (ε-differential privacy) per Insight category per Harvest.
- The Exchange ranking function operates on noisy scores; small score differences between Souls in the same Category are indistinguishable.

A k-anonymity floor of k ≥ 50 is applied to any aggregate cohort query from the PersonalOS backend: no query result that could identify fewer than 50 Souls is returned from the Insights table.

**Consequences.** Slightly reduced Exchange matching precision (noise attenuates score differences). This is an acceptable trade-off for the re-identification mitigation. SoulMind's Scoring model outputs must be designed to accommodate the noise budget without degrading Insight quality to the Soul.

---
