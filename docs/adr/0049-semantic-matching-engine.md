# ADR-49: Semantic Matching Engine — bridging Brand targeting vocabulary to Soul consent categories

**Status:** Accepted · **Depends on:** ADR-12, ADR-20, ADR-25, ADR-30 · **Source:** L0.3 demo gap analysis

---

## Context

The PersonalOS marketplace has three vocabularies that must interoperate:

1. **SoulMind Taxonomy** (ADR-30) — the canonical category tree assigned on-device by the Semantic Curation Engine. Fine-grained: `dining.grocery`, `health.fitness.gym`, `travel.ground_transport.airport`. This is what Souls see in their Insights and Consent settings.

2. **Exchange Categories** — the namespace the Exchange uses for matching. ADR-30 states these are "leaf nodes or aggregations of SoulMind taxonomy nodes." Currently, the three surfaces hardcode identical category strings (`dining.grocery`, `health.fitness`, etc.) with no shared source of truth — each surface independently maintains a copy of the same 12 categories in its own `types.ts`.

3. **Brand Targeting Vocabulary** — what a Brand actually wants to say when creating a Listing. A brand marketer thinks in terms like "organic grocery shoppers," "fitness enthusiasts," or "subscription churners" — not in dotted taxonomy codes.

**The gap:** There is no code that bridges these vocabularies. Matching works only because all three surfaces hardcode the same category strings. No hierarchy, no synonyms, no semantic resolution.

---

## Decision

Build a **Semantic Matching Engine (SME)** as a standalone package at `PersonalOS/shared/matching/`, consumed by each surface via `"@personalos/matching": "file:../shared/matching"`. No monorepo workspace restructuring — the surfaces stay independent.

### Grilled Design Decisions (12 resolved)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Package structure | Standalone with `file:` reference | No monorepo restructuring; surfaces stay independent; Docker just adds a volume |
| 2 | Taxonomy granularity | Expand to ~25 nodes with meaningful new leaves | Adds `health.nutrition`, `dining.delivery`, `shopping.luxury` etc. where they create distinct audience segments; existing 12 categories kept as-is |
| 3 | Audience descriptors | Keyword/synonym matching only | Well-curated synonym arrays cover all demo scenarios; embedding similarity is ADR-25 semantic v2 (future) |
| 4 | Exchange location | Inside Operator Console | SME is a library, not a service; no 5th container; extracts cleanly if L1.0 needs standalone service |
| 5 | Synthetic data migration | Migrate existing data to use SME | Replaces 3-way duplicated string-equality matching with real engine; validates SME against existing demo data |
| 6 | Brand Portal creation flow | Add listing creation with category picker + reach estimate | Reach estimate is the most compelling SME demo moment; in-memory only, no persistence needed |
| 7 | Match metrics timing | On-demand, computed on page load | 4 souls × 25 listings = trivial computation; no caching or scheduling needed at L0.3 |
| 8 | Soul App matched category | Show matched category on Offer cards | Reinforces transparency — "you see this because you consented to Grocery Patterns" |
| 9 | Zero-match behavior | Block submission with inline feedback | Fuzzy fallbacks risk violating consent contract (ADR-12); suggest alternative terms instead |
| 10 | Parent vs leaf consent | Leaf-only consent; parents are display groupings | Souls consent narrowly (explicit control), Brands target broadly (reach); new taxonomy nodes never auto-consent |
| 11 | Shared types scope | Taxonomy + matching + category constants only | Each surface keeps its own view-model types (they're already divergent); package eliminates duplicated category constants |
| 12 | Exchange page | New top-level `/exchange` page in Operator Console | Exchange is the central mechanism; deserves its own operational dashboard, not a section buried in Categories |

---

## Category Taxonomy (L0.3)

Expanded from 12 flat categories to ~25 hierarchical nodes. Existing categories preserved as-is; new leaves added where they create meaningful targeting distinctions.

```
dining                              (parent — display grouping)
├── dining.grocery                  (existing)
├── dining.restaurant               (existing)
├── dining.delivery                 (new — food delivery apps)
└── dining.meal_prep                (new — meal kits, prep services)

health                              (parent)
├── health.fitness                  (existing)
├── health.nutrition                (new — supplements, diet plans)
├── health.wellness                 (new — meditation, sleep, recovery)
└── health.medical                  (existing — private, never tradeable)

shopping                            (parent)
├── shopping.research               (existing)
├── shopping.impulse                (existing)
└── shopping.luxury                 (new — premium/designer brands)

finance                             (parent)
├── finance.health                  (existing)
├── finance.investment              (new — brokerage, crypto, savings)
└── finance.insurance               (new — auto, home, life)

entertainment                       (parent)
├── entertainment.streaming         (existing)
├── entertainment.gaming            (new — games, esports)
└── entertainment.live              (new — concerts, events, sports)

travel                              (parent)
├── travel.pattern                  (existing)
├── travel.accommodation            (new — hotels, vacation rentals)
└── travel.experiences              (new — tours, activities)

transport                           (parent)
├── transport.commute               (existing)
└── transport.rideshare             (new — ride-hailing beyond commute)

education                           (parent)
├── education.growth                (existing)
├── education.professional          (new — certifications, career dev)
└── education.language              (new — language learning apps)

subscription                        (parent)
├── subscription.management         (existing)
└── subscription.optimization       (new — bundle analysis, churn)
```

Each node carries:
- `id`: dotted path (`dining.grocery`)
- `parent`: reference to parent (`dining`)
- `displayName`: human label ("Grocery & Food Shopping")
- `description`: one-line for Brand UX ("People who regularly buy groceries")
- `synonyms`: 10-20 terms for keyword matching (`["groceries", "supermarket", "organic", "whole foods", "food shopping", "meal ingredients"]`)
- `depth`: 0 = root, 1 = parent, 2 = leaf
- `tradeable`: boolean (false only for `health.medical`)

---

## Matching Algorithm

### Category Overlap

`categoryOverlaps(consentCategory, targetCategories)` handles:
- **Exact match:** `dining.grocery` ↔ `dining.grocery`
- **Brand targets parent:** listing targets `dining` → matches Soul consent for `dining.grocery` (parent-to-child)
- **Soul consented to leaf only:** consent for `dining.grocery` does NOT match listing targeting `dining.restaurant` (no sibling matching)

Souls consent to **leaf nodes only**. Parents are display groupings in the consent UI and targeting aggregations for Brands. A Brand targeting `dining` reaches any Soul with any `dining.*` consent. A Soul who consented to `dining.grocery` only sees grocery Offers, not restaurant Offers — even from a Brand targeting all of `dining`.

### Matching Gates (from ADR-12, ADR-20, ADR-25)

```typescript
function matchSoulToListing(soul, listing): MatchResult | null {
  // 1. Resolve listing targeting to Exchange categories
  const targets = resolveTargeting(listing.targeting);

  // 2. Find overlapping active consents
  const matched = soul.consents.filter(c =>
    c.active && categoryOverlaps(c.category, targets)
  );
  if (matched.length === 0) return null;

  // 3. Yield floor gate — Soul's minimum bid ≤ Listing's bid
  const eligible = matched.filter(c => c.yieldFloor <= listing.bidPerClaim);
  if (eligible.length === 0) return null;

  // 4. Insight score threshold — noisy score ≥ Listing's minimum
  const best = eligible.find(c => {
    const score = soul.noisyScores[c.category];
    return score !== undefined && score >= listing.minScoreThreshold;
  });
  if (!best) return null;

  // 5. Composite ranking score
  const composite = listing.bidPerClaim * soul.reputation * recencyWeight(soul, best.category);

  return { soulId: soul.id, listingId: listing.id, matchedCategories: [best.category],
           consentFloor: best.yieldFloor, insightScore: soul.noisyScores[best.category],
           compositeScore: composite, eligible: true };
}
```

### Targeting Resolution

Brands specify targeting via:
1. **Direct category selection** — pick from taxonomy tree (shown with display names)
2. **Audience descriptor** — free text resolved via synonym matching: tokenize → match against synonym index → return matching category IDs. Zero matches → block submission with suggestions.
3. **Parent targeting** — selecting `dining` expands to all `dining.*` leaves

All inputs resolve to a `string[]` of leaf category IDs for matching.

---

## Module Design

### M1: Taxonomy Registry (`shared/matching/src/taxonomy.ts`)
- Hardcoded taxonomy tree — single source of truth
- `getNode(id)`, `getChildren(id)`, `getAncestors(id)`, `getAllLeaves(parentId)`
- `findByTerm(term)` — synonym matching, returns ranked nodes
- Exports `CATEGORY_DISPLAY_NAMES`, `TRADEABLE_CATEGORIES` (replaces per-surface duplication)

### M2: Targeting Resolver (`shared/matching/src/resolver.ts`)
- `resolveTargeting(input: TargetingInput): string[]` — categories, descriptors, or parent nodes → resolved leaf IDs
- `resolveDescriptor(text: string): ResolverResult` — tokenize, synonym match, return categories + confidence
- Zero-match returns empty array + suggested terms

### M3: Match Engine (`shared/matching/src/engine.ts`)
- `matchSoulToListing(soul, listing): MatchResult | null`
- `runExchange(souls[], listings[]): ExchangeRun` — full pass, sorted by composite score
- `estimateReach(targeting, souls[]): ReachEstimate` — how many Souls a targeting spec would reach
- Implements category overlap, yield floor gate, score threshold, composite ranking

### M4: Quality Metrics (`shared/matching/src/metrics.ts`)
- `computeMetrics(run: ExchangeRun): MatchMetrics`
- Match rate, category coverage, yield gap, targeting resolution quality

### M5: Operator Console — Exchange Page
- New `/exchange` top-level page with sidebar entry
- Live Exchange run results: which Souls matched which Listings
- Category coverage heatmap (consents vs listings per node)
- Match quality metrics dashboard
- "Simulate targeting" tool — input targeting, see projected matches

### M6: Brand Portal — Listing Creation
- "Create Listing" flow with taxonomy-backed category picker
- Audience descriptor field with live synonym resolution preview
- Reach estimate: "~340 Souls eligible at $1.50 bid"
- In-memory listing creation (not persisted across reloads)
- Existing Listings page shows taxonomy display names

### M7: Soul App — Category Display
- Consent management shows taxonomy `displayName` instead of raw codes
- Offer cards show "Matched: Grocery & Food Shopping" tag
- No consent data model changes — `category` field stores leaf IDs

### M8: Synthetic Data Migration
- All three surfaces import taxonomy and matching from `@personalos/matching`
- Eliminate duplicated `CATEGORY_DISPLAY_NAMES`, `TRADEABLE_CATEGORIES` from each `types.ts`
- Settlement/offer generation calls `runExchange()` instead of inline string-equality matching
- Add new leaf categories to select brand listings and soul consents where meaningful

---

## File Structure

```
PersonalOS/
├── shared/
│   └── matching/
│       ├── package.json            # name: @personalos/matching
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts            # public API
│           ├── taxonomy.ts         # M1
│           ├── resolver.ts         # M2
│           ├── engine.ts           # M3
│           ├── metrics.ts          # M4
│           └── types.ts            # MatchResult, TargetingInput, etc.
├── operator-console/
│   └── src/app/(dashboard)/exchange/   # M5
├── brand-portal/
│   └── src/app/(dashboard)/listings/   # M6 (enhanced)
├── soul-app/
│   └── src/app/(app)/offers/           # M7 (enhanced)
└── demo-launcher/                      # no changes
```

---

## What This Is NOT

- **Not an ML model.** Deterministic synonym matching and taxonomy traversal. Embedding similarity is ADR-25 semantic v2 (future).
- **Not real-time streaming.** Exchange runs on-demand (page load). Event-driven matching is L1.0.
- **Not a shared database.** A library consumed by each surface. No cross-surface data flow.
- **Not a service.** No new port, no new container. Pure functions imported by existing surfaces.

---

## Consequences

- The three surfaces gain a real matching bridge — no more hardcoded string equality
- Brand targeting becomes realistic with human-readable taxonomy and audience descriptors
- The Operator Console gets a functioning Exchange dashboard with quality metrics
- Category constants are deduplicated into a single shared source of truth
- Synthetic data across all surfaces is generated by the same matching engine
- Foundation for ADR-50 (Claim Flow Integration) — real matches enable real cross-surface flows
- Foundation for ADR-25 semantic v2 — the synonym-based resolver can be swapped for embedding similarity without changing the matching engine
