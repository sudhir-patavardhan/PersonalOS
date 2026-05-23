# ADR-0001: Continuous Real-Time Exchange Matching

## Status
Accepted

## Context
The Exchange must match Brand Listings to Souls based on their Insights. The question was when to run matching: after each Cultivation (batch), when a Soul opens the app, or continuously.

## Decision
The Exchange runs continuous real-time matching. Two events trigger a match pass:
1. A new Listing is posted → match against all eligible Souls
2. A Cultivation completes for a Soul → match that Soul against all active Listings

## Alternatives Considered
- **Post-Cultivation batch** — simpler infrastructure, but introduces latency between fresh Insights and Offer delivery. A Soul with a new high-value Insight could miss a time-sensitive Listing.
- **On app-open** — ties matching to engagement, not data freshness. A Soul who doesn't open the app for a week misses all matches during that window.

## Consequences
- Requires an event-driven matching service that reacts to both Listing and Cultivation events.
- Higher infrastructure complexity than batch matching.
- Ensures Offers always reflect the freshest Insights and Listings are filled as fast as possible.
