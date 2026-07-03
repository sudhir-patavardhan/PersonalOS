import { createHash } from 'crypto';
import { FEE_RATE } from './types';
import { categoryOverlaps, CATEGORY_DISPLAY_NAMES as SME_DISPLAY_NAMES } from './matching';
import type { Listing, BrandSettlement, BrandProfile, CategorySupply, EscrowTransaction, ReputationTrend, Alert } from './types';

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

function applyNoise(value: number, pct: number, rng: SeededRandom): number {
  const noise = rng.float(-pct, pct);
  return Math.max(0, Math.round(value * (1 + noise)));
}

function generateTxHash(input: string, seed: number): string {
  return '0x' + createHash('sha256').update(`${input}${seed}`).digest('hex');
}

interface SoulData {
  id: string;
  wallet: string;
  consents: { category: string; floor: number }[];
  scores: Record<string, number>;
}

const BRAND_DEFS: { name: string; vertical: string; listings: { category: string; bid: number; threshold: number; escrow: number; headline: string; body: string; ctaUrl: string; ctaLabel: string }[] }[] = [
  { name: 'Whole Foods Market', vertical: 'Grocery/Dining', listings: [
    { category: 'dining.grocery', bid: 1.50, threshold: 40, escrow: 5000, headline: 'Fresh organic groceries delivered', body: 'Get 20% off your first Whole Foods delivery order. Quality organic produce at your doorstep.', ctaUrl: 'https://wholefoodsmarket.com/delivery', ctaLabel: 'Order Now' },
    { category: 'dining.restaurant', bid: 2.00, threshold: 40, escrow: 5000, headline: 'Whole Foods prepared meals', body: 'Restaurant-quality meals made fresh daily. Perfect for busy weeknights.', ctaUrl: 'https://wholefoodsmarket.com/meals', ctaLabel: 'See Menu' },
  ]},
  { name: 'Peloton', vertical: 'Fitness', listings: [
    { category: 'health.fitness', bid: 3.00, threshold: 55, escrow: 8000, headline: 'Transform your fitness journey', body: 'Join millions of members. Stream world-class workouts from home.', ctaUrl: 'https://onepeloton.com/app', ctaLabel: 'Start Free Trial' },
    { category: 'entertainment.streaming', bid: 1.25, threshold: 55, escrow: 8000, headline: 'Peloton entertainment workouts', body: 'Music-driven workouts that make fitness fun. 10,000+ on-demand classes.', ctaUrl: 'https://onepeloton.com/classes', ctaLabel: 'Browse Classes' },
  ]},
  { name: 'Chase Sapphire', vertical: 'Finance/Travel', listings: [
    { category: 'finance.health', bid: 2.50, threshold: 50, escrow: 15000, headline: 'Earn 3x points on every purchase', body: 'Chase Sapphire Preferred. 60,000 bonus points after $4,000 spend in 3 months.', ctaUrl: 'https://chase.com/sapphire', ctaLabel: 'Apply Now' },
    { category: 'travel.pattern', bid: 4.00, threshold: 50, escrow: 15000, headline: 'Travel rewards that go further', body: 'Points worth 25% more on Chase travel. No foreign transaction fees.', ctaUrl: 'https://chase.com/travel', ctaLabel: 'Plan Trip' },
  ]},
  { name: 'Coursera', vertical: 'Education', listings: [
    { category: 'education.growth', bid: 1.75, threshold: 25, escrow: 3000, headline: 'Learn from top universities', body: 'Access courses from Stanford, MIT, and more. Earn certificates.', ctaUrl: 'https://coursera.org/plus', ctaLabel: 'Start Learning' },
    { category: 'shopping.research', bid: 0.75, threshold: 25, escrow: 3000, headline: 'Research-backed skill building', body: 'Professional certificates in data science, business, and tech.', ctaUrl: 'https://coursera.org/professional', ctaLabel: 'Browse Certs' },
  ]},
  { name: 'Uber', vertical: 'Transport', listings: [
    { category: 'transport.commute', bid: 1.00, threshold: 30, escrow: 6000, headline: 'Your daily commute, simplified', body: 'Save 15% on Uber commute rides. Schedule rides in advance.', ctaUrl: 'https://uber.com/commute', ctaLabel: 'Get Offer' },
    { category: 'dining.restaurant', bid: 1.50, threshold: 30, escrow: 6000, headline: 'Uber Eats — dinner delivered', body: 'Free delivery on your first 3 orders. Thousands of local restaurants.', ctaUrl: 'https://ubereats.com', ctaLabel: 'Order Food' },
  ]},
  { name: 'Allstate', vertical: 'Insurance', listings: [
    { category: 'finance.health', bid: 2.00, threshold: 45, escrow: 10000, headline: 'Bundle and save with Allstate', body: 'Get a personalized insurance quote in minutes. Save up to 25%.', ctaUrl: 'https://allstate.com/quote', ctaLabel: 'Get Quote' },
    { category: 'transport.commute', bid: 1.75, threshold: 45, escrow: 10000, headline: 'Safe driver discount', body: 'Drive safe, save more. Earn up to 30% discount with Drivewise.', ctaUrl: 'https://allstate.com/drivewise', ctaLabel: 'Learn More' },
  ]},
  { name: 'REI', vertical: 'Outdoor/Retail', listings: [
    { category: 'shopping.research', bid: 1.25, threshold: 40, escrow: 7000, headline: 'Gear up for your next adventure', body: 'Expert-tested outdoor gear. Member dividends on every purchase.', ctaUrl: 'https://rei.com/membership', ctaLabel: 'Join REI' },
    { category: 'health.fitness', bid: 1.50, threshold: 40, escrow: 7000, headline: 'Outdoor fitness gear', body: 'Trail running, hiking, cycling — gear for every outdoor workout.', ctaUrl: 'https://rei.com/fitness', ctaLabel: 'Shop Gear' },
    { category: 'travel.pattern', bid: 2.00, threshold: 40, escrow: 7000, headline: 'REI Adventures await', body: 'Guided outdoor trips worldwide. From beginner hikes to expert climbs.', ctaUrl: 'https://rei.com/adventures', ctaLabel: 'Book Trip' },
  ]},
  { name: 'Spotify', vertical: 'Entertainment', listings: [
    { category: 'entertainment.streaming', bid: 0.80, threshold: 20, escrow: 4000, headline: 'Music for every moment', body: 'Premium ad-free listening. Download for offline. Try 3 months free.', ctaUrl: 'https://spotify.com/premium', ctaLabel: 'Go Premium' },
    { category: 'subscription.management', bid: 1.00, threshold: 20, escrow: 4000, headline: 'One subscription, all audio', body: 'Music, podcasts, and audiobooks in one app. Family plans available.', ctaUrl: 'https://spotify.com/family', ctaLabel: 'See Plans' },
  ]},
  { name: 'Warby Parker', vertical: 'DTC Retail', listings: [
    { category: 'shopping.impulse', bid: 2.50, threshold: 50, escrow: 5500, headline: 'Designer frames from $95', body: 'Try 5 frames at home for free. Premium lenses included.', ctaUrl: 'https://warbyparker.com/home-try-on', ctaLabel: 'Try at Home' },
    { category: 'shopping.research', bid: 1.50, threshold: 30, escrow: 5500, headline: 'Smart eyewear shopping', body: 'Virtual try-on technology. Find your perfect frame in minutes.', ctaUrl: 'https://warbyparker.com/eyeglasses', ctaLabel: 'Browse Frames' },
  ]},
  { name: 'One Medical', vertical: 'Healthcare', listings: [
    { category: 'health.fitness', bid: 3.50, threshold: 55, escrow: 6500, headline: 'Primary care, reimagined', body: 'Same-day appointments. 24/7 virtual care. One flat membership fee.', ctaUrl: 'https://onemedical.com/join', ctaLabel: 'Join Now' },
    { category: 'subscription.management', bid: 1.25, threshold: 55, escrow: 6500, headline: 'Healthcare made simple', body: 'Replace fragmented health subscriptions with one membership.', ctaUrl: 'https://onemedical.com/pricing', ctaLabel: 'See Pricing' },
  ]},
];

const SOUL_DEFS: SoulData[] = [
  { id: 'priya', wallet: '0x7A3f8c2E9b4D6a1F0e5C7B3d2A8f4E6c9D8B2c', consents: [
    { category: 'dining.grocery', floor: 0.75 }, { category: 'dining.restaurant', floor: 1.00 },
    { category: 'shopping.research', floor: 1.00 }, { category: 'shopping.impulse', floor: 0.75 },
    { category: 'entertainment.streaming', floor: 0.75 }, { category: 'education.growth', floor: 1.00 },
    { category: 'transport.commute', floor: 0.75 }, { category: 'travel.pattern', floor: 1.00 },
  ], scores: { 'finance.health': 75, 'dining.grocery': 62, 'dining.restaurant': 71, 'transport.commute': 58, 'shopping.research': 62, 'shopping.impulse': 55, 'health.fitness': 67, 'entertainment.streaming': 50, 'travel.pattern': 58, 'education.growth': 52, 'subscription.management': 40 }},
  { id: 'marcus', wallet: '0x4E1d7F9a3C6B2e8D5A0f1C4b7E3d6A9F2c8B5a', consents: [
    { category: 'finance.health', floor: 2.00 }, { category: 'dining.grocery', floor: 1.50 },
    { category: 'shopping.research', floor: 1.50 }, { category: 'transport.commute', floor: 1.00 },
    { category: 'entertainment.streaming', floor: 1.00 }, { category: 'education.growth', floor: 1.50 },
    { category: 'subscription.management', floor: 1.00 },
  ], scores: { 'finance.health': 70, 'dining.grocery': 65, 'dining.restaurant': 48, 'transport.commute': 45, 'shopping.research': 60, 'shopping.impulse': 38, 'health.fitness': 55, 'entertainment.streaming': 52, 'travel.pattern': 35, 'education.growth': 58, 'subscription.management': 48 }},
  { id: 'sofia', wallet: '0x9B2c4E6a8D1f3A5C7e0B9d2F4a6C8E1b3D5F7a', consents: [
    { category: 'education.growth', floor: 0.75 }, { category: 'travel.pattern', floor: 0.50 },
    { category: 'shopping.impulse', floor: 0.50 }, { category: 'shopping.research', floor: 0.50 },
    { category: 'dining.restaurant', floor: 0.50 }, { category: 'entertainment.streaming', floor: 0.50 },
    { category: 'transport.commute', floor: 0.50 },
  ], scores: { 'finance.health': 45, 'dining.grocery': 40, 'dining.restaurant': 55, 'transport.commute': 50, 'shopping.research': 58, 'shopping.impulse': 62, 'health.fitness': 48, 'entertainment.streaming': 60, 'travel.pattern': 65, 'education.growth': 68, 'subscription.management': 35 }},
  { id: 'james', wallet: '0x1F5a3D7c9E2b4A6f8C0d1B3e5A7F9c2D4E6B8a', consents: [
    { category: 'finance.health', floor: 3.00 }, { category: 'travel.pattern', floor: 3.00 },
    { category: 'entertainment.streaming', floor: 2.00 }, { category: 'dining.restaurant', floor: 2.00 },
    { category: 'health.fitness', floor: 2.00 }, { category: 'subscription.management', floor: 2.00 },
  ], scores: { 'finance.health': 80, 'dining.grocery': 50, 'dining.restaurant': 60, 'transport.commute': 52, 'shopping.research': 55, 'shopping.impulse': 30, 'health.fitness': 58, 'entertainment.streaming': 55, 'travel.pattern': 70, 'education.growth': 42, 'subscription.management': 52 }},
];

function applyDPNoise(score: number, epsilon: number, rng: SeededRandom): number {
  const sensitivity = 100;
  const sigma = sensitivity / epsilon;
  const noisy = score + rng.gaussian(0, sigma);
  return Math.round(Math.max(0, Math.min(100, noisy)));
}

interface FullBrandData {
  profile: BrandProfile;
  listings: Listing[];
  settlements: BrandSettlement[];
  escrowTransactions: EscrowTransaction[];
  reputationTrend: ReputationTrend[];
  alerts: Alert[];
}

interface AllBrandsData {
  brands: Record<string, FullBrandData>;
  categorySupply: CategorySupply[];
}

let cachedData: AllBrandsData | null = null;

export function getBrandPortalData(): AllBrandsData {
  if (cachedData) return cachedData;

  const rng = new SeededRandom(42);

  const noisyScores: Record<string, Record<string, number>> = {};
  for (const soul of SOUL_DEFS) {
    noisyScores[soul.id] = {};
    for (const [cat, score] of Object.entries(soul.scores)) {
      noisyScores[soul.id][cat] = applyDPNoise(score, 2.0, rng);
    }
  }

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const brands: Record<string, FullBrandData> = {};
  let listingCounter = 0;

  for (let bi = 0; bi < BRAND_DEFS.length; bi++) {
    const bd = BRAND_DEFS[bi];
    const brandId = `brand_${bi + 1}`;
    const listings: Listing[] = bd.listings.map(l => {
      listingCounter++;
      return {
        id: `listing_${listingCounter}`,
        brandId,
        brandName: bd.name,
        category: l.category,
        bidPerClaimUsdc: l.bid,
        minScoreThreshold: l.threshold,
        escrowFundedUsdc: l.escrow,
        escrowRemainingUsdc: l.escrow,
        status: 'active' as const,
        createdAt: daysAgo(20 + bi),
        headline: l.headline,
        body: l.body,
        ctaUrl: l.ctaUrl,
        ctaLabel: l.ctaLabel,
      };
    });

    brands[brandId] = {
      profile: { id: brandId, name: bd.name, vertical: bd.vertical, status: 'active', verifiedAt: daysAgo(25 + bi) },
      listings,
      settlements: [],
      escrowTransactions: listings.map(l => ({
        id: `etx_deposit_${l.id}`,
        listingId: l.id,
        type: 'deposit' as const,
        amountUsdc: l.escrowFundedUsdc,
        txHash: generateTxHash(`deposit_${l.id}`, 42),
        timestamp: l.createdAt,
      })),
      reputationTrend: [],
      alerts: [],
    };
  }

  const allListings = Object.values(brands).flatMap(b => b.listings);
  let settlementCount = 0;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const targetClaims = isWeekend ? rng.int(8, 12) : rng.int(15, 20);

    for (let c = 0; c < targetClaims; c++) {
      const soul = rng.pick(SOUL_DEFS);
      const soulScores = noisyScores[soul.id];

      const eligibleListings = allListings.filter(listing => {
        if (listing.status !== 'active') return false;
        if (listing.escrowRemainingUsdc < listing.bidPerClaimUsdc) return false;
        const consent = soul.consents.find(cn => categoryOverlaps(cn.category, [listing.category]));
        if (!consent) return false;
        if (consent.floor > listing.bidPerClaimUsdc) return false;
        const score = soulScores[listing.category];
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

      const txHash = generateTxHash(`${listing.id}${soul.wallet}${settledAt.toISOString()}`, 42);

      listing.escrowRemainingUsdc = Math.round((listing.escrowRemainingUsdc - listing.bidPerClaimUsdc) * 100) / 100;
      if (listing.escrowRemainingUsdc < listing.bidPerClaimUsdc) {
        listing.status = 'exhausted';
      }

      settlementCount++;
      const settlement: BrandSettlement = {
        id: `settlement_${settlementCount}`,
        listingId: listing.id,
        category: listing.category,
        yieldUsdc,
        feeUsdc,
        bidUsdc: listing.bidPerClaimUsdc,
        txHash,
        settledAt: settledAt.toISOString(),
      };

      const brand = brands[listing.brandId];
      brand.settlements.push(settlement);
      brand.escrowTransactions.push({
        id: `etx_claim_${settlementCount}`,
        listingId: listing.id,
        type: 'claim_deduction',
        amountUsdc: listing.bidPerClaimUsdc,
        txHash,
        timestamp: settledAt.toISOString(),
      });
    }
  }

  for (const brand of Object.values(brands)) {
    brand.settlements.sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
    brand.escrowTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const trendRng = new SeededRandom(42 + brand.profile.id.charCodeAt(brand.profile.id.length - 1));
    let repScore = 50 + trendRng.int(-10, 10);
    brand.reputationTrend = [];
    for (let d = 13; d >= 0; d--) {
      const trendDate = new Date(now);
      trendDate.setDate(trendDate.getDate() - d);
      const dayClaims = brand.settlements.filter(s => {
        const sd = new Date(s.settledAt);
        return sd.toDateString() === trendDate.toDateString();
      }).length;
      if (dayClaims > 0) {
        repScore += trendRng.int(-2, 5);
      } else {
        repScore += trendRng.int(-3, 1);
      }
      repScore = Math.max(20, Math.min(95, repScore));
      brand.reputationTrend.push({ date: trendDate.toISOString().split('T')[0], score: repScore });
    }

    for (const listing of brand.listings) {
      if (listing.status === 'exhausted') {
        brand.alerts.push({ id: `alert_depleted_${listing.id}`, type: 'depleted', message: `"${listing.headline || listing.category}" is depleted — escrow exhausted`, listingId: listing.id, severity: 'critical' });
      } else if (listing.escrowRemainingUsdc < listing.escrowFundedUsdc * 0.15) {
        brand.alerts.push({ id: `alert_low_${listing.id}`, type: 'low_escrow', message: `"${listing.headline || listing.category}" escrow below 15% — consider topping up`, listingId: listing.id, severity: 'warning' });
      }
    }
  }

  const CAT_NAMES: Record<string, string> = SME_DISPLAY_NAMES;

  const allCats = ['finance.health', 'dining.grocery', 'dining.restaurant', 'transport.commute', 'shopping.research', 'shopping.impulse', 'health.fitness', 'health.medical', 'entertainment.streaming', 'travel.pattern', 'education.growth', 'subscription.management'];
  const supplyRng = new SeededRandom(4242);

  const categorySupply: CategorySupply[] = allCats.map(cat => {
    const isAvailable = cat !== 'health.medical';
    if (!isAvailable) {
      return { category: cat, displayName: CAT_NAMES[cat], isAvailable: false, consentingSouls: 0, scoreDistribution: [], medianYieldFloor: null, competitorCount: null, suggestedBidRange: null, claimVelocity: 0 };
    }

    const consentingSoulCount = SOUL_DEFS.filter(s => s.consents.some(c => categoryOverlaps(c.category, [cat]))).length;
    const noisedCount = applyNoise(consentingSoulCount * 25 + supplyRng.int(20, 80), 0.10, supplyRng);

    const scores = SOUL_DEFS.map(s => noisyScores[s.id][cat]).filter(Boolean);
    const distribution: { band: string; percentage: number }[] = [];
    if (scores.length > 0) {
      const bands = [{ band: '0–25', min: 0, max: 25 }, { band: '26–50', min: 26, max: 50 }, { band: '51–75', min: 51, max: 75 }, { band: '76–100', min: 76, max: 100 }];
      for (const b of bands) {
        const count = scores.filter(s => s >= b.min && s <= b.max).length;
        distribution.push({ band: b.band, percentage: Math.round((count / scores.length) * 100) });
      }
    }

    const catListings = allListings.filter(l => categoryOverlaps(l.category, [cat]));
    const competitorBrands = new Set(catListings.map(l => l.brandId));
    const competitorCount = competitorBrands.size >= 3 ? competitorBrands.size : null;

    const floors = SOUL_DEFS.flatMap(s => s.consents.filter(c => categoryOverlaps(c.category, [cat])).map(c => c.floor));
    const medianFloor = floors.length > 0 ? floors.sort((a, b) => a - b)[Math.floor(floors.length / 2)] : null;

    const bids = catListings.map(l => l.bidPerClaimUsdc);
    const suggestedBidRange = bids.length > 0 ? {
      floor: Math.min(...bids),
      competitive: Math.round((bids.reduce((a, b) => a + b, 0) / bids.length) * 1.2 * 100) / 100,
    } : null;

    const weekSettlements = Object.values(brands).flatMap(b => b.settlements).filter(s => categoryOverlaps(s.category, [cat]));
    const claimVelocity = weekSettlements.length / 7;

    return { category: cat, displayName: CAT_NAMES[cat], isAvailable, consentingSouls: noisedCount, scoreDistribution: distribution, medianYieldFloor: medianFloor, competitorCount, suggestedBidRange, claimVelocity };
  });

  cachedData = { brands, categorySupply };
  return cachedData;
}

export function getBrandData(brandId: string): FullBrandData | null {
  const data = getBrandPortalData();
  return data.brands[brandId] || null;
}

export function getCategorySupply(): CategorySupply[] {
  return getBrandPortalData().categorySupply;
}

export const DEMO_BRANDS: { brandId: string; name: string; email: string }[] = [
  { brandId: 'brand_1', name: 'Whole Foods Market', email: 'admin@wholefoods.demo' },
  { brandId: 'brand_3', name: 'Chase Sapphire', email: 'admin@chase.demo' },
  { brandId: 'brand_7', name: 'REI', email: 'admin@rei.demo' },
];
