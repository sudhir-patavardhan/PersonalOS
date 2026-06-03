# ADR-0001: Continuous Real-Time Exchange Matching

## Status
Accepted (amended: Offer ranking, notification control, expiry model)

## Context
The Exchange must match Brand Listings to Souls based on their Insights. The question was when to run matching: after each Scoring (batch), when a Soul opens the app, or continuously.

## Decision
The Exchange runs continuous real-time matching. Two events trigger a match pass:
1. A new Listing is posted → match against all eligible Souls
2. A Scoring completes for a Soul → match that Soul against all active Listings

The Exchange acts as a personal assistant to the Soul — it curates Offers intelligently rather than delivering everything that technically matches.

### Offer Ranking
Matched Offers are ranked by a composite score: `bid × Reputation × recency_weight`, where:
- `bid` is the Listing's USDC bid per Claim
- `Reputation` is the Soul's per-Signal-Type track record as a real buyer (ADR-0006)
- `recency_weight` decays if the Soul has had no relevant Transaktions in that Category recently

The Yield floor on a Soul's Consent is a hard pre-ranking gate — applied before composite scoring. The Exchange will not rank or deliver any Offer whose bid falls below the Soul's floor for that Category. The floor is adjustable only via Consent settings, not overridden per-Offer.

Dismiss history acts as a suppression filter: 3+ dismissals in a Category category within 30 days temporarily suppresses further Offers in that category and prompts the Soul to raise their Yield floor.

### Notification Control
Notification frequency is Soul-configurable per Consent: maximum Offers per day, quiet hours. The Exchange respects these as hard caps before delivery. Default on signup is 1 push notification per day to prevent cold-start spam.

When a Scoring run produces multiple matched Offers, only the top-ranked Offer (by composite score) is pushed immediately. Remaining matched Offers sit silently in the Soul's feed, discoverable on app open.

### Offer Expiry
- For Offers where a push notification was sent: the 72-hour expiry clock starts at push delivery time.
- For silent Offers queued behind the Soul's notification cap: the expiry clock starts when the Offer is promoted to a push slot or first seen by the Soul in-app — whichever comes first.

This ensures no Offer expires without the Soul having had a fair opportunity to act on it.

## Alternatives Considered
- **Post-Scoring batch** — simpler infrastructure, but introduces latency between fresh Insights and Offer delivery. A Soul with a new high-value Insight could miss a time-sensitive Listing.
- **On app-open** — ties matching to engagement, not data freshness. A Soul who doesn't open the app for a week misses all matches during that window.
- **Flood delivery** — delivering all matched Offers immediately with push notifications. Rejected: notification fatigue degrades Soul trust and engagement.

## Consequences
- Requires an event-driven matching service that reacts to both Listing and Scoring events.
- Higher infrastructure complexity than batch matching.
- Ensures Offers always reflect the freshest Insights and Listings are filled as fast as possible.
- Composite ranking requires Reputation and recency signals to be available at match time — these must be stored server-side as outputs of Scoring (scores only, not raw data).
- Soul-configurable notification caps require the Exchange to track per-Soul notification state and queue depth.
- Expiry clock management is more complex with two start-time rules — implementation must track notification delivery status per Offer.
