import type { SoulProfile, ListingProfile, MatchResult, ExchangeRun, ReachEstimate } from './types';
import { resolveTargeting } from './resolver';
import { getNode, getAllLeaves, CATEGORY_DISPLAY_NAMES } from './taxonomy';

export function categoryOverlaps(consentCategory: string, targetCategories: string[]): boolean {
  for (const target of targetCategories) {
    if (consentCategory === target) return true;

    const targetNode = getNode(target);
    if (targetNode && targetNode.depth === 0) {
      const leaves = getAllLeaves(target);
      if (leaves.some(l => l.id === consentCategory)) return true;
    }

    const consentNode = getNode(consentCategory);
    if (consentNode?.parent === target) return true;
  }
  return false;
}

function recencyWeight(soul: SoulProfile, category: string): number {
  const lastTs = soul.lastActivity[category];
  if (!lastTs) return 0.5;
  const daysSince = (Date.now() - lastTs) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return 1.0;
  if (daysSince <= 30) return 0.85;
  if (daysSince <= 90) return 0.7;
  return 0.5;
}

export function matchSoulToListing(soul: SoulProfile, listing: ListingProfile): MatchResult | null {
  if (listing.status !== 'active') return null;
  if (listing.escrowRemaining < listing.bidPerClaim) return null;

  const targets = resolveTargeting(listing.targeting);
  if (targets.length === 0) return null;

  const matchedConsents = soul.consents.filter(c =>
    c.active && categoryOverlaps(c.category, targets)
  );
  if (matchedConsents.length === 0) return null;

  const eligible = matchedConsents.filter(c => c.yieldFloor <= listing.bidPerClaim);
  if (eligible.length === 0) return null;

  let bestConsent: typeof eligible[0] | null = null;
  let bestScore = -1;

  for (const c of eligible) {
    const score = soul.noisyScores[c.category];
    if (score !== undefined && score >= listing.minScoreThreshold && score > bestScore) {
      bestConsent = c;
      bestScore = score;
    }
  }

  if (!bestConsent || bestScore < 0) return null;

  const composite = listing.bidPerClaim * soul.reputation * recencyWeight(soul, bestConsent.category);

  return {
    soulId: soul.id,
    listingId: listing.id,
    brandName: listing.brandName,
    matchedCategories: eligible.map(c => c.category),
    consentFloor: bestConsent.yieldFloor,
    insightScore: bestScore,
    compositeScore: Math.round(composite * 100) / 100,
    eligible: true,
  };
}

export function runExchange(souls: SoulProfile[], listings: ListingProfile[]): ExchangeRun {
  const activeListings = listings.filter(l => l.status === 'active');
  const matches: MatchResult[] = [];

  for (const soul of souls) {
    for (const listing of activeListings) {
      const result = matchSoulToListing(soul, listing);
      if (result) matches.push(result);
    }
  }

  matches.sort((a, b) => b.compositeScore - a.compositeScore);

  const totalPairs = souls.length * activeListings.length;
  const matchRate = totalPairs > 0 ? (matches.length / totalPairs) * 100 : 0;

  return {
    timestamp: Date.now(),
    matches,
    totalSouls: souls.length,
    totalListings: activeListings.length,
    matchRate: Math.round(matchRate * 10) / 10,
  };
}

export function estimateReach(
  targeting: { categories?: string[]; descriptor?: string },
  souls: SoulProfile[],
  bidPerClaim: number = 1.0,
  minScoreThreshold: number = 0,
): ReachEstimate {
  const resolved = resolveTargeting(targeting);
  const categoryBreakdown: Map<string, number> = new Map();
  let eligibleCount = 0;

  for (const soul of souls) {
    let matched = false;
    for (const consent of soul.consents) {
      if (!consent.active) continue;
      if (!categoryOverlaps(consent.category, resolved)) continue;
      if (consent.yieldFloor > bidPerClaim) continue;

      const score = soul.noisyScores[consent.category];
      if (score === undefined || score < minScoreThreshold) continue;

      const count = categoryBreakdown.get(consent.category) || 0;
      categoryBreakdown.set(consent.category, count + 1);
      matched = true;
    }
    if (matched) eligibleCount++;
  }

  return {
    eligibleSouls: eligibleCount,
    totalSouls: souls.length,
    matchRate: souls.length > 0 ? Math.round((eligibleCount / souls.length) * 1000) / 10 : 0,
    categoryBreakdown: [...categoryBreakdown.entries()]
      .map(([category, soulCount]) => ({
        category,
        displayName: CATEGORY_DISPLAY_NAMES[category] || category,
        souls: soulCount,
      }))
      .sort((a, b) => b.souls - a.souls),
  };
}
