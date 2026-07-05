import { describe, it, expect } from 'vitest';
import { computeBrandScore } from '../scoring';
import type { BrandProfile, ScoreContext, BrandScoringConfig } from '../scoring';
import { DEFAULT_CONFIG } from '../scoring';

function makeCtx(overrides: Partial<ScoreContext> = {}): ScoreContext {
  return {
    settlements: [],
    offers: [],
    listings: [],
    allBrandIds: [],
    ...overrides,
  };
}

function makeBrand(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    brandId: 'brand_1',
    brandName: 'Test Brand',
    categories: ['dining.grocery'],
    declaredMarkets: ['North America'],
    ...overrides,
  };
}

describe('computeBrandScore', () => {
  describe('cold start', () => {
    it('returns base score 75 for brands with no settlements', () => {
      const result = computeBrandScore(makeBrand(), makeCtx());
      expect(result.baseScore).toBe(75);
      expect(result.isNewBrand).toBe(true);
      expect(result.badge).toBeNull();
      expect(result.trendMultiplier).toBe(1.0);
    });

    it('returns base score 75 for brands with <20 settlements', () => {
      const now = Date.now();
      const settlements = Array.from({ length: 15 }, (_, i) => ({
        brandId: 'brand_1', soulId: `soul_${i}`, category: 'dining.grocery',
        bidUsdc: 2, claimedAt: new Date(now - i * 86400000).toISOString(),
      }));
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements }));
      expect(result.baseScore).toBe(75);
      expect(result.isNewBrand).toBe(true);
    });
  });

  describe('graduated brand', () => {
    const now = Date.now();
    const settlements = Array.from({ length: 25 }, (_, i) => ({
      brandId: 'brand_1', soulId: `soul_${i % 5}`, category: 'dining.grocery',
      bidUsdc: 2, claimedAt: new Date(now - i * 86400000).toISOString(),
    }));
    const offers = settlements.map((s, i) => ({
      brandId: 'brand_1', soulId: s.soulId, category: 'dining.grocery',
      status: (i < 20 ? 'claimed' : 'expired') as 'pending' | 'claimed' | 'expired',
      createdAt: s.claimedAt,
    }));
    const listings = [{
      brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
      escrowRemaining: 500, escrowFunded: 1000, status: 'active',
    }];

    it('graduates after 20 settlements', () => {
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements, offers, listings }));
      expect(result.isNewBrand).toBe(false);
      expect(result.baseScore).toBeGreaterThan(0);
      expect(result.baseScore).toBeLessThanOrEqual(100);
    });

    it('computes all three base score components', () => {
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements, offers, listings }));
      expect(result.components.claimRate).toBeGreaterThanOrEqual(0);
      expect(result.components.bidFairness).toBeGreaterThanOrEqual(0);
      expect(result.components.escrowHealth).toBeGreaterThanOrEqual(0);
    });

    it('respects weight distribution', () => {
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements, offers, listings }));
      const expected = Math.round(
        result.components.claimRate * 0.40 +
        result.components.bidFairness * 0.30 +
        result.components.escrowHealth * 0.30
      );
      expect(result.baseScore).toBe(expected);
    });
  });

  describe('escrow health', () => {
    const now = Date.now();
    const settlements = Array.from({ length: 25 }, (_, i) => ({
      brandId: 'brand_1', soulId: `soul_${i % 5}`, category: 'dining.grocery',
      bidUsdc: 2, claimedAt: new Date(now - i * 86400000).toISOString(),
    }));
    const offers = settlements.map(s => ({
      brandId: 'brand_1', soulId: s.soulId, category: 'dining.grocery',
      status: 'claimed' as const, createdAt: s.claimedAt,
    }));

    it('returns 0 when below absolute floor ($50)', () => {
      const listings = [{
        brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
        escrowRemaining: 30, escrowFunded: 1000, status: 'active',
      }];
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements, offers, listings }));
      expect(result.components.escrowHealth).toBe(0);
    });

    it('returns high score with plenty of runway', () => {
      const listings = [{
        brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
        escrowRemaining: 5000, escrowFunded: 10000, status: 'active',
      }];
      const result = computeBrandScore(makeBrand(), makeCtx({ settlements, offers, listings }));
      expect(result.components.escrowHealth).toBeGreaterThanOrEqual(70);
    });
  });

  describe('contextual multipliers', () => {
    it('applies geography boost when region matches declared market', () => {
      const now = Date.now();
      const settlements = Array.from({ length: 25 }, (_, i) => ({
        brandId: 'brand_1', soulId: `soul_${i % 5}`, category: 'dining.grocery',
        bidUsdc: 2, claimedAt: new Date(now - i * 86400000).toISOString(),
      }));
      const offers = settlements.map(s => ({
        brandId: 'brand_1', soulId: s.soulId, category: 'dining.grocery',
        status: 'claimed' as const, createdAt: s.claimedAt,
      }));
      const listings = [{
        brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
        escrowRemaining: 500, escrowFunded: 1000, status: 'active',
      }];

      const withGeo = computeBrandScore(
        makeBrand({ declaredMarkets: ['North America'] }),
        makeCtx({ settlements, offers, listings, soulRegion: 'North America' }),
      );
      const withoutGeo = computeBrandScore(
        makeBrand({ declaredMarkets: ['Europe'] }),
        makeCtx({ settlements, offers, listings, soulRegion: 'North America' }),
      );
      expect(withGeo.components.geography).toBe(1.10);
      expect(withoutGeo.components.geography).toBe(1.0);
    });

    it('applies cohort affinity when soul consents match cohort', () => {
      const now = Date.now();
      const settlements = Array.from({ length: 25 }, (_, i) => ({
        brandId: 'brand_1', soulId: `soul_${i % 5}`, category: 'dining.grocery',
        bidUsdc: 2, claimedAt: new Date(now - i * 86400000).toISOString(),
      }));
      const offers = settlements.map(s => ({
        brandId: 'brand_1', soulId: s.soulId, category: 'dining.grocery',
        status: 'claimed' as const, createdAt: s.claimedAt,
      }));
      const listings = [{
        brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
        escrowRemaining: 500, escrowFunded: 1000, status: 'active',
      }];

      const result = computeBrandScore(
        makeBrand(),
        makeCtx({
          settlements, offers, listings,
          soulConsents: ['dining.grocery', 'health.fitness'],
        }),
      );
      expect(result.components.cohortAffinity).toBe(1.10);
    });
  });

  describe('badges', () => {
    it('assigns no badge during cold start', () => {
      const result = computeBrandScore(makeBrand(), makeCtx());
      expect(result.badge).toBeNull();
    });

    it('assigns repeat_favorite when trend is not active', () => {
      const now = Date.now();
      // Spread settlements evenly so trend multiplier stays below 1.10
      const settlements = Array.from({ length: 25 }, (_, i) => ({
        brandId: 'brand_1',
        soulId: i < 5 ? 'soul_repeat' : `soul_${i}`,
        category: 'dining.grocery',
        bidUsdc: 2,
        claimedAt: new Date(now - (i + 3) * 86400000).toISOString(),
      }));
      const offers = settlements.map(s => ({
        brandId: 'brand_1', soulId: s.soulId, category: 'dining.grocery',
        status: 'claimed' as const, createdAt: s.claimedAt,
      }));
      const listings = [{
        brandId: 'brand_1', category: 'dining.grocery', bidPerClaim: 2.0,
        escrowRemaining: 500, escrowFunded: 1000, status: 'active',
      }];
      // Use a config with no seasonality boost to isolate repeat_favorite
      const config = {
        ...DEFAULT_CONFIG,
        seasonality: {},
      };

      const result = computeBrandScore(
        makeBrand({ declaredMarkets: [] }),
        makeCtx({ settlements, offers, listings, soulId: 'soul_repeat' }),
        config,
      );
      expect(result.badge).toBe('repeat_favorite');
    });
  });
});
