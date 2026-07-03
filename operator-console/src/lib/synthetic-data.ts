import { createHash } from 'crypto';
import { Soul, Brand, Listing, Settlement, Consent, FEE_RATE } from './types';
import { categoryOverlaps } from './matching';

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
    return (this.seed >>> 0) / 0xffffffff;
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  gaussian(mean: number, stddev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1 || 0.001)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stddev;
  }
}

function applyDPNoise(score: number, epsilon: number, rng: SeededRandom): number {
  const sensitivity = 100;
  const sigma = sensitivity / epsilon;
  const noisy = score + rng.gaussian(0, sigma);
  return Math.round(Math.max(0, Math.min(100, noisy)));
}

function truncateWallet(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function generateTxHash(listingId: string, wallet: string, timestamp: string, seed: number): string {
  const input = `${listingId}${wallet}${timestamp}${seed}`;
  return '0x' + createHash('sha256').update(input).digest('hex');
}

const RAW_PERSONA_SCORES: Record<string, Record<string, number>> = {
  priya: {
    'finance.health': 75, 'dining.grocery': 62, 'dining.restaurant': 71,
    'transport.commute': 58, 'shopping.research': 62, 'shopping.impulse': 55,
    'health.fitness': 67, 'entertainment.streaming': 50, 'travel.pattern': 58,
    'education.growth': 52, 'subscription.management': 40,
  },
  marcus: {
    'finance.health': 70, 'dining.grocery': 65, 'dining.restaurant': 48,
    'transport.commute': 45, 'shopping.research': 60, 'shopping.impulse': 38,
    'health.fitness': 55, 'entertainment.streaming': 52, 'travel.pattern': 35,
    'education.growth': 58, 'subscription.management': 48,
  },
  sofia: {
    'finance.health': 45, 'dining.grocery': 40, 'dining.restaurant': 55,
    'transport.commute': 50, 'shopping.research': 58, 'shopping.impulse': 62,
    'health.fitness': 48, 'entertainment.streaming': 60, 'travel.pattern': 65,
    'education.growth': 68, 'subscription.management': 35,
  },
  james: {
    'finance.health': 80, 'dining.grocery': 50, 'dining.restaurant': 60,
    'transport.commute': 52, 'shopping.research': 55, 'shopping.impulse': 30,
    'health.fitness': 58, 'entertainment.streaming': 55, 'travel.pattern': 70,
    'education.growth': 42, 'subscription.management': 52,
  },
};

function buildSouls(rng: SeededRandom): Soul[] {
  const wallets: Record<string, string> = {
    priya: '0x7A3f8c2E9b4D6a1F0e5C7B3d2A8f4E6c9D8B2c',
    marcus: '0x4E1d7F9a3C6B2e8D5A0f1C4b7E3d6A9F2c8B5a',
    sofia: '0x9B2c4E6a8D1f3A5C7e0B9d2F4a6C8E1b3D5F7a',
    james: '0x1F5a3D7c9E2b4A6f8C0d1B3e5A7F9c2D4E6B8a',
  };

  const consentDefs: Record<string, { category: string; floor: number }[]> = {
    priya: [
      { category: 'dining.grocery', floor: 0.75 }, { category: 'dining.restaurant', floor: 1.00 },
      { category: 'shopping.research', floor: 1.00 }, { category: 'shopping.impulse', floor: 0.75 },
      { category: 'entertainment.streaming', floor: 0.75 }, { category: 'education.growth', floor: 1.00 },
      { category: 'transport.commute', floor: 0.75 }, { category: 'travel.pattern', floor: 1.00 },
    ],
    marcus: [
      { category: 'finance.health', floor: 2.00 }, { category: 'dining.grocery', floor: 1.50 },
      { category: 'shopping.research', floor: 1.50 }, { category: 'transport.commute', floor: 1.00 },
      { category: 'entertainment.streaming', floor: 1.00 }, { category: 'education.growth', floor: 1.50 },
      { category: 'subscription.management', floor: 1.00 },
    ],
    sofia: [
      { category: 'education.growth', floor: 0.75 }, { category: 'travel.pattern', floor: 0.50 },
      { category: 'shopping.impulse', floor: 0.50 }, { category: 'shopping.research', floor: 0.50 },
      { category: 'dining.restaurant', floor: 0.50 }, { category: 'entertainment.streaming', floor: 0.50 },
      { category: 'transport.commute', floor: 0.50 },
    ],
    james: [
      { category: 'finance.health', floor: 3.00 }, { category: 'travel.pattern', floor: 3.00 },
      { category: 'entertainment.streaming', floor: 2.00 }, { category: 'dining.restaurant', floor: 2.00 },
      { category: 'health.fitness', floor: 2.00 }, { category: 'subscription.management', floor: 2.00 },
    ],
  };

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 21);

  return Object.entries(wallets).map(([name, wallet]) => {
    const rawScores = RAW_PERSONA_SCORES[name];
    const noisyScores: Record<string, number> = {};
    for (const [cat, score] of Object.entries(rawScores)) {
      noisyScores[cat] = applyDPNoise(score, 2.0, rng);
    }

    const consents: Consent[] = (consentDefs[name] || []).map(c => ({
      category: c.category,
      yieldFloorUsdc: c.floor,
      grantedAt: new Date(baseDate.getTime() + rng.int(0, 3) * 86400000).toISOString(),
      revokedAt: null,
    }));

    const eligibleScores = Object.values(noisyScores).filter((_, i) =>
      Object.keys(noisyScores)[i] !== 'health.medical'
    );
    const avgScore = eligibleScores.reduce((a, b) => a + b, 0) / eligibleScores.length;
    const breadthBonus = Math.min(eligibleScores.length / 12 * 20, 20);
    const depthScore = Math.min(avgScore + breadthBonus, 100);

    return {
      id: name,
      walletAddress: wallet,
      walletDisplay: truncateWallet(wallet),
      depthScore: Math.round(depthScore * 10) / 10,
      noisyScores,
      consents,
      connectedAt: new Date(baseDate.getTime() + rng.int(0, 2) * 86400000).toISOString(),
      phase: depthScore >= 60 ? 'two' as const : 'one' as const,
    };
  });
}

function buildBrands(): Brand[] {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const brandDefs: { name: string; vertical: string; listings: Omit<Listing, 'id' | 'brandId' | 'brandName' | 'status' | 'createdAt' | 'escrowRemainingUsdc'>[] }[] = [
    { name: 'Whole Foods Market', vertical: 'Grocery/Dining', listings: [
      { category: 'dining.grocery', bidPerClaimUsdc: 1.50, minScoreThreshold: 40, escrowFundedUsdc: 5000 },
      { category: 'dining.restaurant', bidPerClaimUsdc: 2.00, minScoreThreshold: 40, escrowFundedUsdc: 5000 },
    ]},
    { name: 'Peloton', vertical: 'Fitness', listings: [
      { category: 'health.fitness', bidPerClaimUsdc: 3.00, minScoreThreshold: 55, escrowFundedUsdc: 8000 },
      { category: 'entertainment.streaming', bidPerClaimUsdc: 1.25, minScoreThreshold: 55, escrowFundedUsdc: 8000 },
    ]},
    { name: 'Chase Sapphire', vertical: 'Finance/Travel', listings: [
      { category: 'finance.health', bidPerClaimUsdc: 2.50, minScoreThreshold: 50, escrowFundedUsdc: 15000 },
      { category: 'travel.pattern', bidPerClaimUsdc: 4.00, minScoreThreshold: 50, escrowFundedUsdc: 15000 },
    ]},
    { name: 'Coursera', vertical: 'Education', listings: [
      { category: 'education.growth', bidPerClaimUsdc: 1.75, minScoreThreshold: 25, escrowFundedUsdc: 3000 },
      { category: 'shopping.research', bidPerClaimUsdc: 0.75, minScoreThreshold: 25, escrowFundedUsdc: 3000 },
    ]},
    { name: 'Uber', vertical: 'Transport', listings: [
      { category: 'transport.commute', bidPerClaimUsdc: 1.00, minScoreThreshold: 30, escrowFundedUsdc: 6000 },
      { category: 'dining.restaurant', bidPerClaimUsdc: 1.50, minScoreThreshold: 30, escrowFundedUsdc: 6000 },
    ]},
    { name: 'Allstate', vertical: 'Insurance', listings: [
      { category: 'finance.health', bidPerClaimUsdc: 2.00, minScoreThreshold: 45, escrowFundedUsdc: 10000 },
      { category: 'transport.commute', bidPerClaimUsdc: 1.75, minScoreThreshold: 45, escrowFundedUsdc: 10000 },
    ]},
    { name: 'REI', vertical: 'Outdoor/Retail', listings: [
      { category: 'shopping.research', bidPerClaimUsdc: 1.25, minScoreThreshold: 40, escrowFundedUsdc: 7000 },
      { category: 'health.fitness', bidPerClaimUsdc: 1.50, minScoreThreshold: 40, escrowFundedUsdc: 7000 },
      { category: 'travel.pattern', bidPerClaimUsdc: 2.00, minScoreThreshold: 40, escrowFundedUsdc: 7000 },
    ]},
    { name: 'Spotify', vertical: 'Entertainment', listings: [
      { category: 'entertainment.streaming', bidPerClaimUsdc: 0.80, minScoreThreshold: 20, escrowFundedUsdc: 4000 },
      { category: 'subscription.management', bidPerClaimUsdc: 1.00, minScoreThreshold: 20, escrowFundedUsdc: 4000 },
    ]},
    { name: 'Warby Parker', vertical: 'DTC Retail', listings: [
      { category: 'shopping.impulse', bidPerClaimUsdc: 2.50, minScoreThreshold: 50, escrowFundedUsdc: 5500 },
      { category: 'shopping.research', bidPerClaimUsdc: 1.50, minScoreThreshold: 30, escrowFundedUsdc: 5500 },
    ]},
    { name: 'One Medical', vertical: 'Healthcare', listings: [
      { category: 'health.fitness', bidPerClaimUsdc: 3.50, minScoreThreshold: 55, escrowFundedUsdc: 6500 },
      { category: 'subscription.management', bidPerClaimUsdc: 1.25, minScoreThreshold: 55, escrowFundedUsdc: 6500 },
    ]},
  ];

  let listingCounter = 0;
  return brandDefs.map((bd, bi) => {
    const brandId = `brand_${bi + 1}`;
    return {
      id: brandId,
      name: bd.name,
      vertical: bd.vertical,
      status: 'active' as const,
      verifiedAt: daysAgo(25 + bi),
      listings: bd.listings.map(l => {
        listingCounter++;
        return {
          id: `listing_${listingCounter}`,
          brandId,
          brandName: bd.name,
          category: l.category,
          bidPerClaimUsdc: l.bidPerClaimUsdc,
          minScoreThreshold: l.minScoreThreshold,
          escrowFundedUsdc: l.escrowFundedUsdc,
          escrowRemainingUsdc: l.escrowFundedUsdc,
          status: 'active' as const,
          createdAt: daysAgo(20 + bi),
        };
      }),
    };
  });
}

function generateSettlements(souls: Soul[], brands: Brand[], rng: SeededRandom): { settlements: Settlement[]; brands: Brand[] } {
  const now = new Date();
  const settlements: Settlement[] = [];
  const allListings = brands.flatMap(b => b.listings);
  let settlementCount = 0;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const targetClaims = isWeekend ? rng.int(8, 12) : rng.int(15, 20);

    for (let c = 0; c < targetClaims; c++) {
      const soul = rng.pick(souls);
      const eligibleListings = allListings.filter(listing => {
        if (listing.status !== 'active') return false;
        if (listing.escrowRemainingUsdc < listing.bidPerClaimUsdc) return false;
        const consent = soul.consents.find(cn => categoryOverlaps(cn.category, [listing.category]) && !cn.revokedAt);
        if (!consent) return false;
        if (consent.yieldFloorUsdc > listing.bidPerClaimUsdc) return false;
        const score = soul.noisyScores[listing.category];
        if (!score || score < listing.minScoreThreshold) return false;
        return true;
      });

      if (eligibleListings.length === 0) continue;

      const listing = rng.pick(eligibleListings);
      const yieldUsdc = Math.round(listing.bidPerClaimUsdc * (1 - FEE_RATE) * 100) / 100;
      const feeUsdc = Math.round(listing.bidPerClaimUsdc * FEE_RATE * 100) / 100;

      const hour = rng.int(8, 22);
      const minute = rng.int(0, 59);
      const settledAt = new Date(date);
      settledAt.setHours(hour, minute, rng.int(0, 59));

      const txHash = generateTxHash(listing.id, soul.walletAddress, settledAt.toISOString(), 42);

      listing.escrowRemainingUsdc = Math.round((listing.escrowRemainingUsdc - listing.bidPerClaimUsdc) * 100) / 100;
      if (listing.escrowRemainingUsdc < listing.bidPerClaimUsdc) {
        listing.status = 'depleted';
      }

      settlementCount++;
      settlements.push({
        id: `settlement_${settlementCount}`,
        listingId: listing.id,
        brandName: listing.brandName,
        category: listing.category,
        soulWallet: soul.walletAddress,
        soulWalletDisplay: soul.walletDisplay,
        yieldUsdc,
        feeUsdc,
        bidUsdc: listing.bidPerClaimUsdc,
        txHash,
        settledAt: settledAt.toISOString(),
      });
    }
  }

  settlements.sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
  return { settlements, brands };
}

export interface SyntheticData {
  souls: Soul[];
  brands: Brand[];
  settlements: Settlement[];
}

let cachedData: SyntheticData | null = null;

export function getSyntheticData(): SyntheticData {
  if (cachedData) return cachedData;

  const rng = new SeededRandom(42);
  const souls = buildSouls(rng);
  const brands = buildBrands();
  const result = generateSettlements(souls, brands, rng);

  cachedData = {
    souls,
    brands: result.brands,
    settlements: result.settlements,
  };
  return cachedData;
}
