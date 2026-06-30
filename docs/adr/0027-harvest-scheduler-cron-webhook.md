# ADR-27: Harvest scheduler: cron + Plaid webhook; SoulMind Scoring triggered post-Harvest

**Status:** Accepted · Supersedes: ADR-27 (Agent SDK cron) · **Source:** site Flow 2 + ADR-27

**Decision.** Harvest is triggered by two mechanisms:
1. **Cron schedule:** every 6 hours per Konnection for active Souls.
2. **Plaid webhook:** real-time `DEFAULT_UPDATE` webhook fires within minutes of new transactions; triggers an immediate incremental Harvest.

PersonalOS Backend assembles the new Transaktion batch and pushes it to the Soul's iOS device via APNs background push. The iOS app performs SoulMind enrichment, encryption, Arweave write, and Scoring. Only the Arweave `tx_id` and updated Insight scores return to the server. No Agent SDK, MCP, or Memory MCP is involved in the Harvest or Scoring pipeline.

**Consequences.** Plaid webhook eliminates the 6-hour staleness window for financial data. APNs background push requires the iOS app to handle wakeup and background task completion reliably.
