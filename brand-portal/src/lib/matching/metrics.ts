import type { ExchangeRun, MatchMetrics, SoulProfile, ListingProfile } from './types';
import { getTradeableLeaves, CATEGORY_DISPLAY_NAMES } from './taxonomy';
import { resolveTargeting } from './resolver';

export function computeMetrics(
  run: ExchangeRun,
  souls: SoulProfile[],
  listings: ListingProfile[],
): MatchMetrics {
  const leaves = getTradeableLeaves();

  const categoryCoverage = leaves.map(leaf => {
    const hasConsents = souls.some(s =>
      s.consents.some(c => c.active && c.category === leaf.id)
    );

    const hasListings = listings.some(l => {
      if (l.status !== 'active') return false;
      const resolved = resolveTargeting(l.targeting);
      return resolved.includes(leaf.id);
    });

    const matchCount = run.matches.filter(m =>
      m.matchedCategories.includes(leaf.id)
    ).length;

    return {
      category: leaf.id,
      displayName: leaf.displayName,
      hasListings,
      hasConsents,
      matchCount,
    };
  });

  const yieldGaps: MatchMetrics['yieldGaps'] = [];
  for (const leaf of leaves) {
    const floors = souls
      .flatMap(s => s.consents)
      .filter(c => c.active && c.category === leaf.id)
      .map(c => c.yieldFloor);

    const bids = listings
      .filter(l => {
        if (l.status !== 'active') return false;
        const resolved = resolveTargeting(l.targeting);
        return resolved.includes(leaf.id);
      })
      .map(l => l.bidPerClaim);

    if (floors.length > 0 && bids.length > 0) {
      const avgFloor = floors.reduce((s, f) => s + f, 0) / floors.length;
      const avgBid = bids.reduce((s, b) => s + b, 0) / bids.length;
      yieldGaps.push({
        category: leaf.id,
        displayName: CATEGORY_DISPLAY_NAMES[leaf.id] || leaf.id,
        avgBid: Math.round(avgBid * 100) / 100,
        avgFloor: Math.round(avgFloor * 100) / 100,
        gap: Math.round((avgBid - avgFloor) * 100) / 100,
      });
    }
  }

  yieldGaps.sort((a, b) => b.gap - a.gap);

  return {
    overallMatchRate: run.matchRate,
    categoryCoverage,
    yieldGaps,
    topMatches: run.matches.slice(0, 20),
  };
}
