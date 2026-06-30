# ADR-16 — Apple Health Records (FHIR) over bespoke MyChart aggregation
**Status:** Accepted · **Source:** ADR log

**Decision.** Clinical health data (lab results, medications, conditions) is ingested via Apple Health's FHIR integration, which aggregates from Epic, Cerner, and other EHR systems through Apple's existing infrastructure. PersonalOS does not build a direct MyChart/Epic integration.

**Consequences.** Avoids building and maintaining a patchwork of per-health-system OAuth integrations. Ties clinical data ingestion to Apple Health availability on the Soul's device. Clinical data is subject to ADR-15's marketplace exclusion.

---

## Section 3 — Product Model & Marketplace
