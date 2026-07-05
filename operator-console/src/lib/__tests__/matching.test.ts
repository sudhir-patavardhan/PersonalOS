import { describe, it, expect } from 'vitest';
import { matchSoulToListing, runExchange, categoryOverlaps } from '../matching';
import type { SoulProfile, ListingProfile } from '../matching';

function makeSoul(overrides: Partial<SoulProfile> = {}): SoulProfile {
  return {
    id: 'soul_1',
    displayName: 'Test Soul',
    consents: [{ category: 'dining.grocery', yieldFloor: 0.50, active: true, grantedAt: Date.now() }],
    noisyScores: { 'dining.grocery': 65 },
    reputation: 0.85,
    lastActivity: { 'dining.grocery': Date.now() },
    ...overrides,
  };
}

function makeListing(overrides: Partial<ListingProfile> = {}): ListingProfile {
  return {
    id: 'listing_1',
    brandId: 'brand_1',
    brandName: 'Test Brand',
    targeting: { categories: ['dining.grocery'] },
    bidPerClaim: 2.00,
    minScoreThreshold: 30,
    escrowRemaining: 500,
    status: 'active',
    headline: 'Test listing',
    body: 'Test body',
    ...overrides,
  };
}

describe('categoryOverlaps', () => {
  it('returns true for exact match', () => {
    expect(categoryOverlaps('dining.grocery', ['dining.grocery'])).toBe(true);
  });

  it('returns false for non-matching categories', () => {
    expect(categoryOverlaps('dining.grocery', ['health.fitness'])).toBe(false);
  });

  it('returns true for parent match', () => {
    expect(categoryOverlaps('dining.grocery', ['dining'])).toBe(true);
  });
});

describe('matchSoulToListing', () => {
  it('matches when consent, score, and bid align', () => {
    const result = matchSoulToListing(makeSoul(), makeListing());
    expect(result).not.toBeNull();
    expect(result!.eligible).toBe(true);
    expect(result!.compositeScore).toBeGreaterThan(0);
  });

  it('returns null for inactive listing', () => {
    const result = matchSoulToListing(makeSoul(), makeListing({ status: 'paused' }));
    expect(result).toBeNull();
  });

  it('returns null when escrow is insufficient', () => {
    const result = matchSoulToListing(makeSoul(), makeListing({ escrowRemaining: 0.50 }));
    expect(result).toBeNull();
  });

  it('returns null when bid is below yield floor', () => {
    const soul = makeSoul({
      consents: [{ category: 'dining.grocery', yieldFloor: 5.00, active: true, grantedAt: Date.now() }],
    });
    const result = matchSoulToListing(soul, makeListing({ bidPerClaim: 2.00 }));
    expect(result).toBeNull();
  });

  it('returns null when score is below threshold', () => {
    const soul = makeSoul({ noisyScores: { 'dining.grocery': 10 } });
    const result = matchSoulToListing(soul, makeListing({ minScoreThreshold: 50 }));
    expect(result).toBeNull();
  });

  it('returns null when consent is inactive', () => {
    const soul = makeSoul({
      consents: [{ category: 'dining.grocery', yieldFloor: 0.50, active: false, grantedAt: Date.now() }],
    });
    const result = matchSoulToListing(soul, makeListing());
    expect(result).toBeNull();
  });

  it('includes brand score in composite when provided', () => {
    const withScore = matchSoulToListing(makeSoul(), makeListing({ brandContextualScore: 80 }));
    const withoutScore = matchSoulToListing(makeSoul(), makeListing());
    expect(withScore).not.toBeNull();
    expect(withoutScore).not.toBeNull();
    expect(withScore!.compositeScore).toBeLessThan(withoutScore!.compositeScore);
  });
});

describe('runExchange', () => {
  it('returns matches for eligible soul-listing pairs', () => {
    const result = runExchange([makeSoul()], [makeListing()]);
    expect(result.matches.length).toBe(1);
    expect(result.matchRate).toBeGreaterThan(0);
  });

  it('returns empty matches when no souls have consents', () => {
    const soul = makeSoul({ consents: [] });
    const result = runExchange([soul], [makeListing()]);
    expect(result.matches.length).toBe(0);
  });

  it('sorts matches by composite score descending', () => {
    const soul1 = makeSoul({ id: 's1', reputation: 0.5 });
    const soul2 = makeSoul({ id: 's2', reputation: 0.95 });
    const result = runExchange([soul1, soul2], [makeListing()]);
    expect(result.matches.length).toBe(2);
    expect(result.matches[0].compositeScore).toBeGreaterThanOrEqual(result.matches[1].compositeScore);
  });
});
