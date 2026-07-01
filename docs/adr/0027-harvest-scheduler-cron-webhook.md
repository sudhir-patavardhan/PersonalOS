# ADR-27: Harvest scheduler: cron + Plaid webhook; SoulMind Scoring triggered post-Harvest

**Status:** Accepted · Supersedes: ADR-27 (Agent SDK cron) · **Source:** site Flow 2 + ADR-27

**Decision.** Harvest is triggered by two mechanisms:
1. **Cron schedule:** every 6 hours per Konnection for active Souls.
2. **Plaid webhook:** real-time `DEFAULT_UPDATE` webhook fires within minutes of new transactions; triggers an immediate incremental Harvest.

PersonalOS Backend assembles the new Transaktion batch and pushes it to the Soul's iOS device via APNs background push. The iOS app performs SoulMind enrichment, encryption, Arweave write, and Scoring. Only the Arweave `tx_id` and updated Insight scores return to the server. No Agent SDK, MCP, or Memory MCP is involved in the Harvest or Scoring pipeline.

**Trigger validation.** The scheduler enforces safeguards to prevent spurious or duplicate Harvests:
- **Webhook signature verification:** Plaid webhooks are verified using Plaid's JWT signature before triggering a Harvest. Unsigned or tampered webhooks are dropped and logged.
- **Deduplication window:** If a cron-triggered and webhook-triggered Harvest overlap within a 5-minute window for the same Konnection, the second is suppressed. The `last_harvested_at` timestamp on the Konnection row is the deduplication key.
- **Rate limiting:** No Konnection is Harvested more than once per hour, regardless of webhook frequency. Rapid-fire webhooks (e.g., during a batch bank posting event) are coalesced.
- **APNs delivery failure:** If the iOS device does not acknowledge the background push within 10 minutes, the Harvest is queued server-side and retried on next device wake. The server never performs the Harvest itself — it only schedules.
- **Stale Konnection detection:** If a Konnection has not completed a successful Harvest in 30 days despite scheduled attempts, it is flagged `stale` and the Soul is prompted to re-authenticate via Plaid Link.

**Consequences.** Plaid webhook eliminates the 6-hour staleness window for financial data. APNs background push requires the iOS app to handle wakeup and background task completion reliably.
