# ADR-03: Setu / RBI Account Aggregator for India financial data

**Status:** Accepted (implemented) · **Source:** ADR log (`account-aggregator/` service)

**Decision.** Setu FIU API (token-cached auth, FIU-UAT environment) provides the India-side financial Konnection in parallel with Plaid. The RBI Account Aggregator framework is consent-native by regulation.

**Consequences.** Parallel Harvest codepath required for India Souls. India DPDP Act 2023 "right to erasure" applies — key-destruction (ADR-29) satisfies this under Recital-26-equivalent reasoning; legal confirmation required pre-launch for India jurisdiction. SoulMind must maintain a separate semantic tag namespace for India-specific merchant categories (UPI merchants do not map to Plaid category codes).
