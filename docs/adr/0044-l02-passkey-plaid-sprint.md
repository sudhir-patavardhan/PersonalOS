# ADR-44: L0.2 Sprint — Passkey authentication, Plaid Link integration, and on-device scoring

**Status:** Accepted — NEW · **Source:** L0.2 sprint planning grill session (June 2026)

**Context.** L0.1 delivered the iOS project scaffold with domain models, SwiftUI views, and service stubs. L0.2 makes the app functional: the Soul gets a real identity (passkey), a first data source (Plaid), and visible intelligence (Insight scores). All processing remains on-device.

---

## Decisions

### 1. Protocol-based service architecture

All external-facing services use a protocol with mock and live implementations:

- `PasskeyProviding` → `MockPasskeyService` (simulator) / `LivePasskeyService` (device)
- `PlaidProviding` → `MockPlaidService` (all environments) / `LivePlaidService` (requires backend — future sprint)

Injected via `SoulManager` initializer. Unit tests use mocks without simulator/device branching.

### 2. Soul persistence — split storage with consistency check

| Data | Storage | Reason |
|---|---|---|
| `passkeyCredentialID` | Keychain | Security-sensitive, hardware-backed |
| Soul metadata (id, createdAt, depthScore, phase, walletAddress) | JSON file in Documents | Readable, debuggable, simple for single record |
| Collections (Transaktions, Konnections, Insights, SyncReports) | SwiftData | Relational queries, lazy loading, schema migrations |

**Consistency check at app launch:** Load Soul JSON → verify `passkeyCredentialID` exists in Keychain → if mismatch, wipe both sides and restart onboarding. Write order: Keychain first, then JSON. If JSON write fails, delete Keychain entry.

### 3. SwiftData with iOS Data Protection

SwiftData configured with `NSFileProtectionComplete`. No SQLCipher, no field-level encryption on the local store.

**Rationale:** Field-level encryption kills SwiftData query capabilities (can't filter/sort on ciphertext). On-device threat model is covered by three layers:
- Layer 1: iOS Data Protection (file unreadable when device locked)
- Layer 2: App Sandbox (process isolation)
- Layer 3: Passkey gate (biometric required to open app)

ADR-08 AES-256-GCM encryption applies to data **leaving the device** (Arweave writes — L0.3 scope).

**Two-layer model architecture:**

| SwiftData `@Model` class | Domain struct | Relationships |
|---|---|---|
| `SDSoul` | `Soul` | Has many `SDKonnection`, `SDInsight` |
| `SDKonnection` | `Konnection` | Belongs to `SDSoul`, has many `SDSoulTransaktion`, `SDSyncReport` |
| `SDSoulTransaktion` | `SoulTransaktion` | Belongs to `SDKonnection` |
| `SDInsight` | `Insight` | Belongs to `SDSoul` |
| `SDSyncReport` | `SyncReport` | Belongs to `SDKonnection` |

`PersistenceService` handles mapping between layers. Services and views work with domain structs only.

### 4. Passkey — mandatory creation, session-based authentication

**Onboarding:** Passkey creation is mandatory (no skip). Uses `ASAuthorizationPlatformPublicKeyCredentialProvider` with relying party `personalos.app`.

**App access:**
- Cold launch → passkey assertion required
- Background >5 minutes → re-authenticate
- Background <5 minutes → no challenge

**Sensitive action re-authentication (fresh assertion regardless of session):**
- Wallet withdrawal (ADR-43)
- Account deletion (ADR-09)
- Consent revocation
- Data export

### 5. Plaid Link — native SDK, mock-first, with security policy

**Integration:** Plaid LinkKit native iOS SDK via Swift Package Manager.

**`MockPlaidService`:** Returns realistic transactions from 4 personas, randomly selected at onboarding:

| Persona | City | Age | Income | Distinct patterns |
|---|---|---|---|---|
| Priya | NYC | 28 | $95K | Heavy transit/Uber, high dining & delivery, multiple subscriptions, student loans, fitness classes |
| Marcus | Austin | 42 | $130K | Mortgage, kids' activities, insurance, business supplies, Costco, home improvement |
| Sofia | Miami | 35 | $70K variable | Irregular income (3-4 client payments), Adobe/Figma, coworking, remittances, no employer healthcare |
| James | Chicago | 55 | $160K | Higher healthcare, alimony, investment contributions, golf/club memberships, property tax |

Each persona: ~300 transactions across 90 days, 12-15 categories. Persona data is coherent — spending patterns, amounts, and merchants match the demographic profile.

**`PlaidSecurityPolicy` struct** codifies:
- `public_token` must never be logged, persisted, or included in analytics
- `access_token` never sent to the iOS app — server-side only
- Backend endpoint requires passkey-signed authentication
- TLS certificate pinning on app → backend connection
- `LivePlaidService` requires non-nil `backendURL` at init; refuses to start without it
- `#if DEBUG` allows mock; Release requires valid backend URL

**Onboarding:** Plaid Link step is skippable. Skip decision and `appOpenCount` stored in `UserDefaults` for re-engagement nudge (subtle banner after 3 app opens without a Konnection, not shown again for 7 days after dismissal).

### 6. Background transaction loading with sync observability

Transactions load in background after onboarding completes. User lands on Insights tab and sees "Syncing your transactions..." progress state.

**Connector-agnostic `SyncObserver`** tracks every sync regardless of provider:

| Check | What it validates |
|---|---|
| Time-to-first-transaction | Within provider-specific SLA |
| Time-to-complete-sync | Within provider-specific SLA |
| Volume bounds | 90-day count within expected range per provider |
| Category distribution | Flag if >80% single category |
| Date gap detection | Flag gaps >14 days with zero transactions |
| Amount outliers | Flag single transactions >$50,000 |

Provider SLA thresholds:

| Provider | Time-to-first | Time-to-complete | Expected 90-day volume |
|---|---|---|---|
| Plaid | <5s | <30s | 50–500 |
| Setu AA | <8s | <45s | 50–400 |
| Google DPA | <3s | <20s | 200–2,000 |
| Apple Health | <2s | <15s | 500–5,000 |
| Amazon BYOD | <10s | <60s | 20–200 |
| Uber BYOD | <5s | <30s | 10–150 |
| Instagram BYOD | <5s | <30s | 50–500 |

Sync state machine: `.idle` → `.syncing(progress)` → `.completed(summary)` / `.failed(error)`. `SyncReport` persisted per Konnection in SwiftData. Failed syncs surface a retry button on Sources tab.

Feeds into ADR-27's 30-day stale Konnection detection.

### 7. Rule-based scoring engine with marketplace-aligned categories

`BasicScoringEngine` computes 12 Insight categories aligned to the SoulMind taxonomy (ADR-30). Each category has a user-facing label and a marketplace signal for Exchange matching:

| SoulMind Category | User label | Marketplace signal |
|---|---|---|
| `finance.health` | Financial Wellness | Savings products, creditworthiness |
| `dining.grocery` | Home Cooking | Grocery brands, meal kits |
| `dining.restaurant` | Dining Explorer | Restaurants, food delivery |
| `transport.commute` | Mobility Pattern | Auto, insurance, transit |
| `shopping.research` | Considered Buyer | Premium brands, high-value purchases |
| `shopping.impulse` | Spontaneous Shopper | Flash sales, deals |
| `health.fitness` | Wellness Commitment | Fitness, supplements, athleisure |
| `health.medical` | Healthcare Active | *Not marketplace eligible* (ADR-15) |
| `entertainment.streaming` | Content Consumer | Streaming, gaming, media |
| `travel.pattern` | Travel Profile | Airlines, hotels, travel insurance |
| `education.growth` | Growth Mindset | Courses, books, conferences |
| `subscription.management` | Subscription Load | Subscription management tools |

Score drivers:
- Cross-source correlation (40%): temporal/semantic patterns across sources
- Behavioral pattern (35%): frequency, recency, consistency, time-of-day
- Spend allocation (25%): percentage of income, category distribution, trend direction

Minimum 5 transactions to score a category. Depth Score = weighted average across scored categories × Konnection `depthWeight`. With Plaid-only data, 9 of 12 categories are computable.

### 8. Phase 0 UX — empty but purposeful

When Soul is created and passkey is bound but no Konnections exist:
- **Sources tab:** Shows available connectors as a roadmap (Plaid active, others "Coming soon")
- **Insights tab:** Depth Score 0% with "Connect your first data source to start building your profile"
- **Wallet tab:** $0 with "Earnings begin when you reach Phase 2 (60% Depth Score)"

### 9. Account deletion and data export

**Delete Account:** Re-authenticate with passkey → confirmation dialog → delete all SwiftData records → delete Soul JSON file → delete Keychain entry → reset to onboarding. Per ADR-09 pre-deletion checklist (simplified for L0.2 — no Consents/Offers/Wallet to worry about yet).

**Export Data:** Re-authenticate with passkey → serialize all `SoulTransaktion` records + Insights to JSON → present iOS share sheet. Satisfies GDPR Art. 20 data portability.

### 10. Testing

**Unit tests (8 targets):**

| Target | Coverage |
|---|---|
| `SoulManagerTests` | Creation, persistence, consistency check, onboarding gating |
| `MockPasskeyServiceTests` | Credential creation, authentication, failure simulation |
| `MockPlaidServiceTests` | Persona loading, transaction count/category validation |
| `BasicScoringEngineTests` | Per-category scoring, minimum threshold, Depth Score |
| `SyncObserverTests` | SLA violation, consistency checks |
| `PersistenceServiceTests` | SwiftData round-trip, domain ↔ SD mapping, Data Protection |
| `CryptoServiceTests` | Existing — encrypt/decrypt, wrong key |
| `ModelTests` | Existing — expand for SyncReport |

**UI tests (3 tests):**

| Test | Flow |
|---|---|
| `testOnboardingHappyPath` | Welcome → Create Soul → Passkey (mock) → Plaid (mock) → First Insight → Main tab |
| `testOnboardingSkipPlaid` | Welcome → Create Soul → Passkey (mock) → Skip → Empty Insights with nudge |
| `testAppLaunchAuthentication` | Kill → relaunch → passkey challenge (mock) → persisted data visible |

---

## Out of scope

- **L0.2.5:** Sandbox mode with synthetic data for all 7 connectors
- **L0.3:** AES key derivation from passkey secret, Arweave/Irys encrypted writes
- **L0.4:** Coinbase Smart Wallet provisioning
- **Backend:** Plaid token exchange server, `LivePlaidService`
- **CoreML:** Replaces `BasicScoringEngine` in later sprint

---

> **See also:** ADR-41 (Soul onboarding sequence), ADR-08 (AES-256-GCM encryption), ADR-01 (multi-source Harvest), ADR-30 (SoulMind SCE), ADR-23 (on-device Scoring model), ADR-09 (account deletion), ADR-27 (stale Konnection detection), ADR-43 (wallet withdrawal)
