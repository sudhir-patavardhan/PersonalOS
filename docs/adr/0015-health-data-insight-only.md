# ADR-15: Health data: Insight-only; excluded from Listing matching until policy resolved

**Status:** Accepted · Supersedes: ADR-15 (Open) · **Source:** ADR log + legal caution

**Decision.** Health data (Apple Health, MyChart FHIR) is used exclusively to generate Insights for the Soul's own consumption. It is explicitly excluded from the Exchange matching layer, Consent categories, and any Listing targeting until a separate health-data-in-marketplace policy is established and reviewed by legal counsel. The boundary is enforced in SoulMind: health-derived Insight scores are tagged `marketplace_eligible: false` and the Exchange enforces this flag as a hard gate.

**Consequences.** The "glucose months = Whole Foods months" cross-source correlation is visible to the Soul inside their iOS app but cannot be used to target a nutrition brand's Listing. This is a deliberate restraint. If the policy is later relaxed, a new ADR must be written covering HIPAA-adjacent obligations, and the SoulMind tagging schema must be updated.
