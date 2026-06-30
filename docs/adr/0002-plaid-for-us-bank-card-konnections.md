# ADR-02 — Plaid for US bank & card Konnections
**Status:** Accepted (implemented) · **Source:** ADR log (`plaid/` service)

**Decision.** Plaid Express + `plaid` SDK provides the Tier-1, zero-friction US financial Konnection (Capital One, Chase, Amex, and 12,000+ institutions). Session-based, sandbox→production env switch. Plaid Link runs inside an iOS WebView; the Soul's bank credentials are handled entirely by Plaid and never pass through PersonalOS.

**Consequences.** Sub-two-minute first Konnection. Introduces CFPB §1033 open-banking compliance obligation: data received via Plaid under §1033 may only be used for the purpose the Soul authorised — PersonalOS must not use §1033-derived financial data for any Listing matching purpose beyond what is disclosed in the Consent. SoulMind (ADR-30) must apply §1033 use-limitation tags during semantic enrichment so the Exchange can enforce them.

---
