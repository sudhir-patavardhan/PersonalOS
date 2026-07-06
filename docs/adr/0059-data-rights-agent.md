# ADR-59: Data Rights Agent — Automated Data Portability as Growth Engine

**Status:** Accepted · **Source:** Architecture stress-test Q27 (July 2026) · **Depends on:** ADR-07, ADR-38, ADR-39, ADR-40, ADR-47

---

## Context

Users have a legal right to their data under GDPR (Article 20 — Right to Data Portability), CCPA (§1798.100 — Right to Know/Access), and India's DPDP Act (Section 11 — Right of Nomination + Section 12 — Right of Grievance Redressal). In practice, exercising these rights is so painful that almost nobody does it:

1. **Discovery friction:** Users don't know which companies hold their data or how to request it.
2. **Process friction:** Each company has a different request mechanism (email, form, in-app setting, postal mail).
3. **Format friction:** Data arrives in inconsistent formats (JSON, CSV, PDF, ZIP), often weeks later.
4. **Repetition friction:** Rights must be re-exercised periodically as new data accumulates.

PersonalOS already benefits from data portability — every connected source (Plaid, Apple Health, Amazon BYOD, Uber BYOD, Instagram BYOD) is an exercise of the user's data rights. But today, the user does this manually. The Data Rights Agent automates the entire process, turning a legal right into a growth engine: more data sources connected → higher depth scores → better intent predictions → higher earnings.

This is PersonalOS's moat accelerator. Competitors who build on inference (Meta, Google) cannot replicate this because they would be requesting data portability FROM THEMSELVES. PersonalOS is the only entity incentivized to aggregate data FROM everywhere on behalf of the user.

---

## Decisions

### 1. Agent Architecture

The Data Rights Agent is an on-device autonomous process (consistent with ADR-07 — no raw data leaves the device) that:

1. **Discovers** which services hold user data (from email receipts, app usage, connected accounts)
2. **Generates** legally valid data portability requests tailored to each service
3. **Submits** requests via the appropriate channel (API, email, web form)
4. **Tracks** request status and follows up on overdue responses
5. **Ingests** received data into the appropriate PersonalOS connector

```
┌─────────────────────────────────────────────────────┐
│                 Soul's Device                         │
│                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │ Discovery │───▶│ Request Gen  │───▶│ Submission │ │
│  │  Engine   │    │   Engine     │    │   Engine   │ │
│  └──────────┘    └──────────────┘    └────────────┘ │
│       │                                      │       │
│       ▼                                      ▼       │
│  ┌──────────┐                        ┌────────────┐ │
│  │  Service  │                        │  Tracking  │ │
│  │  Registry │                        │  + Ingest  │ │
│  └──────────┘                        └────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Service Discovery

The agent identifies services that hold user data through multiple signals:

| Signal Source | Detection Method | Example |
|---------------|-----------------|---------|
| Email receipts | Parse inbox for order confirmations, account notifications | "Your Spotify receipt" → Spotify has listening data |
| Connected bank (Plaid) | Identify merchants from transaction history | Recurring Netflix charge → Netflix has viewing data |
| App usage (iOS Screen Time API) | Detect installed/used apps | Uber installed + used weekly → Uber has trip data |
| Manual addition | User adds services they know about | "I use Fitbit" |
| Cross-source inference | Combine signals for high-confidence detection | Bank charge + email receipt + app installed = confirmed |

**Confidence threshold:** The agent only suggests a data request when confidence ≥ 80% that the service holds meaningful data. Below that, it queues the service for "Confirm you use this?" prompt.

### 3. Service Registry

A curated, updatable registry of services and their data portability mechanisms:

```typescript
interface ServiceEntry {
  service_id: string;
  name: string;
  category: DataCategory;
  portability_method: 'api' | 'email' | 'web_form' | 'in_app' | 'postal';
  request_template: RequestTemplate;
  expected_response_days: number;
  data_format: 'json' | 'csv' | 'zip' | 'pdf' | 'custom';
  legal_basis: ('gdpr_art20' | 'ccpa_1798100' | 'dpdp_s11')[];
  connector_id?: string; // maps to existing PersonalOS connector if available
  last_verified: Date;
  jurisdiction_requirements: JurisdictionConfig[];
}
```

**Registry maintenance:**
- Initial registry: ~200 services covering 80% of consumer data (top apps, banks, retailers, streaming, fitness, travel)
- Community-contributed additions (verified by PersonalOS before activation)
- Automated health checks: monthly verification that request mechanisms still work
- Version-controlled and auditable

### 4. Request Generation

For each service, the agent generates a legally compliant data portability request:

**GDPR (EU/UK):**
```
Subject: Data Portability Request under Article 20 GDPR

Dear Data Protection Officer,

I am exercising my right to data portability under Article 20 of the 
General Data Protection Regulation. Please provide all personal data 
concerning me in a structured, commonly used, and machine-readable format.

Specifically, I request: [category-specific data types]

Identity verification: [user-provided ID method per service requirements]

Please respond within 30 days as required by Article 12(3) GDPR.

[User name, email, account identifier]
```

**CCPA (California):**
```
Subject: Right to Know / Data Access Request under CCPA §1798.100

I am a California resident exercising my right to access personal 
information under the California Consumer Privacy Act...
```

**DPDP (India):**
```
Subject: Data Access Request under Section 11, DPDP Act 2023...
```

The agent selects the appropriate legal basis based on the user's jurisdiction and the service's location.

### 5. Submission Engine

Requests are submitted via the most efficient available channel:

| Priority | Method | Automation Level |
|----------|--------|------------------|
| 1 | **API** (e.g., Google Takeout API, Apple Privacy API) | Fully automated |
| 2 | **Structured web form** (known URL, predictable fields) | Semi-automated (agent fills, user confirms) |
| 3 | **Email** to known DPO/privacy address | Automated send, manual verification |
| 4 | **In-app setting** (e.g., "Download my data" button) | User guided with step-by-step instructions |
| 5 | **Postal mail** (rare, legacy companies) | Agent generates letter, user prints/sends |

**User approval gate:** The agent NEVER submits a request without explicit user confirmation. The flow is:

1. Agent surfaces a card: "I found that Spotify likely has your listening history. Want me to request it?"
2. User taps "Request my data" or "Not now" or "Never for this service"
3. On approval, agent either submits automatically (Priority 1-3) or provides guided instructions (Priority 4-5)

### 6. Tracking & Follow-Up

The agent maintains a request lifecycle for each submission:

```
States: pending_submission → submitted → acknowledged → processing → 
        data_received → ingested → failed → escalated
```

**Automated follow-up rules:**
- No acknowledgment within 7 days → resend request
- No data within 30 days (GDPR) / 45 days (CCPA) → escalation notice citing legal deadline
- Data received but format unusable → request resubmission in machine-readable format
- Request denied → surface to user with explanation and escalation options (DPA complaint for GDPR, AG complaint for CCPA)

**Dashboard in Soul App:**
```
My Data Requests
├── Spotify — Data received ✓ (ingested 3 days ago)
├── Netflix — Processing (submitted 12 days ago, ~18 days remaining)
├── Uber — Overdue ⚠️ (45 days, escalation ready)
├── Amazon — Available via BYOD (one-tap connect)
└── + Discover more services (14 suggested)
```

### 7. Ingestion Pipeline

When data arrives, the agent:

1. **Validates** the data package (correct format, not empty, matches request)
2. **Maps** to existing PersonalOS connectors where available (Amazon BYOD → ADR-38, Uber → ADR-39, Instagram → ADR-40)
3. **Generates** a new connector if no match exists (using the generic BYOD CSV/JSON parser)
4. **Processes** on-device per ADR-07 (raw data never leaves device; only scores/summaries are derived)
5. **Updates** depth score and recalculates intent predictions with new data

**New source bonus:** Successfully ingesting data from a new service via the Data Rights Agent counts toward the Data Richness component of the soul's composite score (ADR-54 §3).

### 8. Growth Engine Mechanics

The Data Rights Agent creates a self-reinforcing growth loop:

```
More sources connected
    → Higher depth score + data richness
        → Better AI predictions (ADR-53 §4)
            → More accurate intent declarations
                → Higher follow-through rate
                    → Higher tier (ADR-54)
                        → Higher earnings
                            → User motivated to connect more sources
                                → Agent suggests next service to request
```

**Gamification (subtle, not manipulative):**
- "You have data with ~23 services. 14 are requestable. Each new source adds ~3% to your earning potential."
- Progress bar: "Data coverage: 62% — connect 3 more sources to unlock Gold tier path"
- Weekly digest integration: "This week's suggestion: Request your Spotify listening data. Similar souls who connected music data earned 8% more."

### 9. Privacy & Security Constraints

1. **On-device only:** The Service Registry is downloaded to the device. Request generation, submission tracking, and data ingestion all happen locally. PersonalOS servers never see which services a soul uses or what data they requested.
2. **No credential storage:** The agent never stores passwords or tokens for third-party services. API-based requests use OAuth flows where the user authenticates directly.
3. **User can delete anytime:** Any ingested data from a rights request can be deleted from the device at any time. Deletion removes the raw data AND the derived scores (recalculated without that source).
4. **No harvesting beyond request:** The agent only processes data explicitly requested by the user. It does not scrape, crawl, or access accounts beyond the portability request.
5. **Audit log:** Every request submitted, every data package received, and every ingestion event is logged locally for the user's records.

### 10. Competitive Moat Implications

The Data Rights Agent is uniquely defensible:

- **Google/Meta cannot replicate it** — they would be requesting data portability from themselves, cannibalizing their own data moats
- **Apple could replicate it** (device-first, privacy-aligned) but won't — their business model doesn't require cross-platform data aggregation
- **Banks/fintechs** (Plaid, Yodlee) only cover financial data; PersonalOS covers all categories
- **Privacy tools** (Mine, Jumbo) help users delete data or exercise deletion rights; PersonalOS exercises portability rights to CREATE value, not destroy it

The deeper a user's data coverage, the harder it is to leave PersonalOS — not through lock-in, but through accumulated value. A Platinum soul with 12 connected sources, 3 years of intent history, and verified follow-through data cannot recreate that profile elsewhere.

### 11. Rollout Phases

| Phase | Timeline | Scope |
|-------|----------|-------|
| **Phase 1** | Launch | Manual BYOD connectors (Amazon, Uber, Instagram — already built: ADR-38/39/40) + service discovery |
| **Phase 2** | Month 3 | Automated email-based requests for top 50 services + tracking dashboard |
| **Phase 3** | Month 6 | API-based automation for services with programmatic access (Google Takeout, Apple, Twitter/X) |
| **Phase 4** | Month 9 | Full registry (~200 services), community contributions, automated follow-up and escalation |

### 12. Soul Pro Integration

- **Free tier:** Service discovery + manual BYOD connectors (existing ADR-38/39/40). Agent suggests services but user must submit requests manually.
- **Soul Pro:** Full automation — agent submits requests, tracks status, follows up, and ingests automatically. This is a primary Pro value driver: "Let the agent handle your data rights while you do nothing."

---

## Consequences

The Data Rights Agent transforms PersonalOS from a passive data vault into an active data acquisition system — one that operates entirely on behalf of the user, exercising their legal rights to enrich their own profile. This is the moat accelerator: each successful data request makes the user's profile more valuable, their predictions more accurate, and their intent declarations more trustworthy.

The agent also creates a structural dependency on strong data portability laws. PersonalOS's growth is correlated with regulatory environments that enforce GDPR/CCPA/DPDP. Weaker enforcement → slower data acquisition → weaker value proposition. This aligns PersonalOS's corporate interests with consumer privacy advocacy — a genuine "do well by doing good" alignment.

Operational risk: services may rate-limit, challenge, or ignore portability requests. The escalation pipeline (regulatory complaints, automated follow-up) provides pressure, but some services will remain difficult. The agent must handle graceful degradation — partial data is better than no data.

---

> **See also:** ADR-07 (On-Device Processing), ADR-38 (Amazon BYOD), ADR-39 (Uber BYOD), ADR-40 (Instagram BYOD), ADR-53 (Intent Declaration), ADR-54 (Soul Tiers), ADR-58 (Revenue Model — Soul Pro integration)
