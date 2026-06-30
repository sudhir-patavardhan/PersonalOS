# ADR-04 — Google Data Portability API, one resource per archive job
**Status:** Accepted (implemented) · **Source:** ADR log (`data-portability/` service)

**Decision.** Google activity data (Search, YouTube, Chrome, Maps) is Harvested via the official Google Data Portability API with per-resource OAuth scopes. Do not mix Data Portability scopes with other Google scopes in a single token. Initiate one resource per archive job. Playwright included for export flows requiring browser automation where the API is unavailable.

**Consequences.** Google activity is some of the highest-signal data for SoulMind's semantic enrichment — search queries immediately preceding a large purchase are a strong intent signal. SoulMind must parse Google's JSON format and cross-reference with financial Transaktions by timestamp proximity.

---
