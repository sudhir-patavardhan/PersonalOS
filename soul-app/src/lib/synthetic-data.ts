import { createHash } from 'crypto';
import { FEE_RATE, CATEGORY_DISPLAY_NAMES } from './types';
import { categoryOverlaps, getTradeableLeaves, CATEGORY_DISPLAY_NAMES as SME_DISPLAY_NAMES } from './matching';
import type { SoulProfile, Konnection, Insight, SoulConsent, AvailableCategory, Offer, WalletTransaction, SharingLogEntry, DailyEarning } from './types';

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

function generateTxHash(input: string, seed: number): string {
  return '0x' + createHash('sha256').update(`${input}${seed}`).digest('hex');
}

const KONNECTION_DEFS: Omit<Konnection, 'connected' | 'connectedAt' | 'lastSync' | 'historyMonths' | 'depthContribution'>[] = [
  { id: 'plaid', source: 'plaid', displayName: 'Bank (Plaid)', icon: '🏦', tier: 1, maxContribution: 30, dataTypes: ['Transactions', 'Balances', 'Spending patterns'] },
  { id: 'apple_health', source: 'apple_health', displayName: 'Apple Health', icon: '❤️', tier: 2, maxContribution: 20, dataTypes: ['Steps', 'Heart rate', 'Sleep', 'Workouts'] },
  { id: 'google', source: 'google', displayName: 'Google Activity', icon: '🔍', tier: 2, maxContribution: 15, dataTypes: ['Search history', 'Location', 'YouTube'] },
  { id: 'amazon', source: 'amazon', displayName: 'Amazon', icon: '📦', tier: 3, maxContribution: 15, dataTypes: ['Purchase history', 'Wishlists', 'Reviews'] },
  { id: 'uber', source: 'uber', displayName: 'Uber', icon: '🚗', tier: 3, maxContribution: 10, dataTypes: ['Ride history', 'Uber Eats orders'] },
  { id: 'instagram', source: 'instagram', displayName: 'Instagram', icon: '📸', tier: 3, maxContribution: 10, dataTypes: ['Interests', 'Engagement', 'Saved posts'] },
];

const BRAND_CREATIVE: Record<string, { name: string; listings: { category: string; bid: number; headline: string; body: string; ctaUrl: string; ctaLabel: string; reputation: number }[] }> = {
  'whole_foods': { name: 'Whole Foods Market', listings: [
    { category: 'dining.grocery', bid: 1.50, headline: 'Fresh organic groceries delivered', body: 'Get 20% off your first Whole Foods delivery order. Quality organic produce at your doorstep.', ctaUrl: 'https://wholefoodsmarket.com/delivery', ctaLabel: 'Order Now', reputation: 82 },
    { category: 'dining.restaurant', bid: 2.00, headline: 'Whole Foods prepared meals', body: 'Restaurant-quality meals made fresh daily. Perfect for busy weeknights.', ctaUrl: 'https://wholefoodsmarket.com/meals', ctaLabel: 'See Menu', reputation: 82 },
  ]},
  'chase': { name: 'Chase Sapphire', listings: [
    { category: 'finance.health', bid: 2.50, headline: 'Earn 3x points on every purchase', body: 'Chase Sapphire Preferred. 60,000 bonus points after $4,000 spend in 3 months.', ctaUrl: 'https://chase.com/sapphire', ctaLabel: 'Apply Now', reputation: 78 },
    { category: 'travel.pattern', bid: 4.00, headline: 'Travel rewards that go further', body: 'Points worth 25% more on Chase travel. No foreign transaction fees.', ctaUrl: 'https://chase.com/travel', ctaLabel: 'Plan Trip', reputation: 78 },
  ]},
  'rei': { name: 'REI', listings: [
    { category: 'shopping.research', bid: 1.25, headline: 'Gear up for your next adventure', body: 'Expert-tested outdoor gear. Member dividends on every purchase.', ctaUrl: 'https://rei.com/membership', ctaLabel: 'Join REI', reputation: 85 },
    { category: 'health.fitness', bid: 1.50, headline: 'Outdoor fitness gear', body: 'Trail running, hiking, cycling — gear for every outdoor workout.', ctaUrl: 'https://rei.com/fitness', ctaLabel: 'Shop Gear', reputation: 85 },
    { category: 'travel.pattern', bid: 2.00, headline: 'REI Adventures await', body: 'Guided outdoor trips worldwide. From beginner hikes to expert climbs.', ctaUrl: 'https://rei.com/adventures', ctaLabel: 'Book Trip', reputation: 85 },
  ]},
  'spotify': { name: 'Spotify', listings: [
    { category: 'entertainment.streaming', bid: 0.80, headline: 'Music for every moment', body: 'Premium ad-free listening. Download for offline. Try 3 months free.', ctaUrl: 'https://spotify.com/premium', ctaLabel: 'Go Premium', reputation: 74 },
  ]},
  'coursera': { name: 'Coursera', listings: [
    { category: 'education.growth', bid: 1.75, headline: 'Learn from top universities', body: 'Access courses from Stanford, MIT, and more. Earn certificates.', ctaUrl: 'https://coursera.org/plus', ctaLabel: 'Start Learning', reputation: 80 },
  ]},
};

const SOUL_FRAMINGS: Record<string, string> = {
  'dining.grocery': '{brand} is looking for grocery shoppers like you',
  'dining.restaurant': '{brand} wants to reach diners in your area',
  'finance.health': '{brand} is targeting financially savvy individuals',
  'travel.pattern': '{brand} is reaching out to active travelers',
  'shopping.research': '{brand} wants to connect with smart shoppers',
  'shopping.impulse': '{brand} is targeting trend-conscious shoppers',
  'health.fitness': '{brand} is looking for fitness enthusiasts like you',
  'entertainment.streaming': '{brand} wants to reach entertainment lovers',
  'education.growth': '{brand} is targeting lifelong learners',
  'transport.commute': '{brand} wants to reach daily commuters',
  'subscription.management': '{brand} is looking for subscription-savvy users',
};

interface SoulDef {
  id: string;
  displayName: string;
  email: string;
  region: string;
  avatarInitials: string;
  walletAddress: string;
  connectedSources: string[];
  depthScore: number;
  phase: 1 | 2;
  scores: Record<string, number>;
  consents: { category: string; floor: number; grantedDaysAgo: number }[];
}

const SOUL_DEFS: SoulDef[] = [
  {
    id: 'priya', displayName: 'Priya Sharma', email: 'priya@personalos.me', region: 'North America',
    avatarInitials: 'PS', walletAddress: '0x7A3f8c2E9b4D6a1F0e5C7B3d2A8f4E6c9D8B2c',
    connectedSources: ['plaid', 'apple_health', 'amazon'],
    depthScore: 72, phase: 2,
    scores: {
      'finance.health': 75, 'dining.grocery': 62, 'dining.restaurant': 71,
      'transport.commute': 58, 'shopping.research': 62, 'shopping.impulse': 55,
      'health.fitness': 67, 'entertainment.streaming': 50, 'travel.pattern': 58,
      'education.growth': 52, 'subscription.management': 40,
    },
    consents: [
      { category: 'dining.grocery', floor: 0.75, grantedDaysAgo: 45 },
      { category: 'dining.restaurant', floor: 1.00, grantedDaysAgo: 40 },
      { category: 'shopping.research', floor: 1.00, grantedDaysAgo: 38 },
      { category: 'shopping.impulse', floor: 0.75, grantedDaysAgo: 35 },
      { category: 'entertainment.streaming', floor: 0.75, grantedDaysAgo: 30 },
      { category: 'education.growth', floor: 1.00, grantedDaysAgo: 28 },
      { category: 'transport.commute', floor: 0.75, grantedDaysAgo: 25 },
      { category: 'travel.pattern', floor: 1.00, grantedDaysAgo: 20 },
    ],
  },
  {
    id: 'marcus', displayName: 'Marcus Thompson', email: 'marcus@personalos.me', region: 'North America',
    avatarInitials: 'MT', walletAddress: '0x4E1d7F9a3C6B2e8D5A0f1C4b7E3d6A9F2c8B5a',
    connectedSources: ['plaid', 'apple_health'],
    depthScore: 58, phase: 2,
    scores: {
      'finance.health': 70, 'dining.grocery': 65, 'dining.restaurant': 48,
      'transport.commute': 45, 'shopping.research': 60, 'shopping.impulse': 38,
      'health.fitness': 55, 'entertainment.streaming': 52, 'travel.pattern': 35,
      'education.growth': 58, 'subscription.management': 48,
    },
    consents: [
      { category: 'finance.health', floor: 2.00, grantedDaysAgo: 30 },
      { category: 'dining.grocery', floor: 1.50, grantedDaysAgo: 28 },
      { category: 'shopping.research', floor: 1.50, grantedDaysAgo: 25 },
      { category: 'transport.commute', floor: 1.00, grantedDaysAgo: 22 },
      { category: 'entertainment.streaming', floor: 1.00, grantedDaysAgo: 20 },
      { category: 'education.growth', floor: 1.50, grantedDaysAgo: 18 },
      { category: 'subscription.management', floor: 1.00, grantedDaysAgo: 15 },
    ],
  },
];

const INSIGHT_DEFS: { soulId: string; category: string; text: string; confidence: number; icon: string; daysAgo: number; sourcePrompt: string | null }[] = [
  { soulId: 'priya', category: 'dining.grocery', text: 'Your grocery spending peaks on Sundays — you spend 40% more than weekday shops. Meal planning could save ~$120/month.', confidence: 88, icon: '🛒', daysAgo: 0, sourcePrompt: null },
  { soulId: 'priya', category: 'dining.restaurant', text: 'You dine out 3.2 times per week, averaging $34 per visit. Thai and Japanese cuisines dominate.', confidence: 82, icon: '🍜', daysAgo: 1, sourcePrompt: null },
  { soulId: 'priya', category: 'shopping.research', text: 'You research products for an average of 12 days before purchasing. Top category: outdoor gear.', confidence: 85, icon: '🔍', daysAgo: 2, sourcePrompt: null },
  { soulId: 'priya', category: 'shopping.impulse', text: 'Your impulse purchases average $42 and happen most often on Friday evenings. Setting a 24-hour cool-off could save ~$200/month.', confidence: 80, icon: '🛍️', daysAgo: 3, sourcePrompt: null },
  { soulId: 'priya', category: 'entertainment.streaming', text: 'You\'re subscribed to 5 streaming services but regularly use only 2. Consider consolidating.', confidence: 86, icon: '📺', daysAgo: 4, sourcePrompt: null },
  { soulId: 'priya', category: 'education.growth', text: 'Your Amazon purchases include 8 non-fiction books in the last quarter. Top topics: leadership and data science.', confidence: 83, icon: '📚', daysAgo: 5, sourcePrompt: null },
  { soulId: 'priya', category: 'transport.commute', text: 'Your commute costs average $180/month. A transit pass would save ~$45/month based on your patterns.', confidence: 77, icon: '🚇', daysAgo: 6, sourcePrompt: null },
  { soulId: 'priya', category: 'travel.pattern', text: 'Based on your spending patterns, you take ~4 trips per year. Average trip spend: $1,850.', confidence: 79, icon: '✈️', daysAgo: 7, sourcePrompt: null },
  { soulId: 'priya', category: 'health.fitness', text: 'Your resting heart rate dropped 4 BPM over the last 3 months. Your morning runs are paying off.', confidence: 91, icon: '💪', daysAgo: 8, sourcePrompt: null },
  { soulId: 'marcus', category: 'finance.health', text: 'Your savings rate is 18% of take-home pay — above the national average of 6%. Strong financial discipline.', confidence: 90, icon: '📊', daysAgo: 0, sourcePrompt: null },
  { soulId: 'marcus', category: 'dining.grocery', text: 'Your grocery spending is $420/month, which is 15% above the regional average for your household size.', confidence: 80, icon: '🛒', daysAgo: 1, sourcePrompt: null },
  { soulId: 'marcus', category: 'shopping.research', text: 'You compare prices across 4+ retailers before buying electronics. Your patience saved $340 last quarter.', confidence: 84, icon: '🔍', daysAgo: 2, sourcePrompt: null },
  { soulId: 'marcus', category: 'transport.commute', text: 'Your commute is 22 minutes on average. You spend $95/month on gas — switching to hybrid could save $40/month.', confidence: 76, icon: '🚗', daysAgo: 3, sourcePrompt: null },
  { soulId: 'marcus', category: 'entertainment.streaming', text: 'You watch most content on weekends. Your peak viewing is Saturday 8-11 PM across 3 platforms.', confidence: 78, icon: '📺', daysAgo: 4, sourcePrompt: null },
  { soulId: 'marcus', category: 'education.growth', text: 'You completed 3 online courses this quarter. Most time spent on financial planning and data analysis topics.', confidence: 82, icon: '📚', daysAgo: 5, sourcePrompt: null },
  { soulId: 'marcus', category: 'subscription.management', text: 'You have 8 active subscriptions totaling $127/month. Two overlap in functionality — consolidating could save $24/month.', confidence: 88, icon: '💳', daysAgo: 6, sourcePrompt: null },
  { soulId: 'marcus', category: 'health.fitness', text: 'Your step count averages 7,200/day. Weekday counts are 40% lower than weekends — consider a lunchtime walk routine.', confidence: 74, icon: '💪', daysAgo: 7, sourcePrompt: null },
];

export const DEMO_SOULS: { soulId: string; displayName: string; email: string }[] = [
  { soulId: 'priya', displayName: 'Priya Sharma', email: 'priya@personalos.me' },
  { soulId: 'marcus', displayName: 'Marcus Thompson', email: 'marcus@personalos.me' },
];

interface SoulAppData {
  profile: SoulProfile;
  konnections: Konnection[];
  insights: Insight[];
  consents: SoulConsent[];
  availableCategories: AvailableCategory[];
  pendingOffers: Offer[];
  offerHistory: Offer[];
  walletBalance: number;
  walletTransactions: WalletTransaction[];
  dailyEarnings: DailyEarning[];
  sharingLog: SharingLogEntry[];
  pendingOfferCount: number;
}

const cache: Record<string, SoulAppData> = {};

export function getSoulData(soulId: string): SoulAppData | null {
  if (cache[soulId]) return cache[soulId];

  const soul = SOUL_DEFS.find(s => s.id === soulId);
  if (!soul) return null;

  const rng = new SeededRandom(42 + soul.id.charCodeAt(0));
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const profile: SoulProfile = {
    id: soul.id,
    displayName: soul.displayName,
    email: soul.email,
    region: soul.region,
    avatarInitials: soul.avatarInitials,
    depthScore: soul.depthScore,
    phase: soul.phase,
    walletAddress: soul.walletAddress,
    joinedAt: daysAgo(60),
  };

  const konnections: Konnection[] = KONNECTION_DEFS.map(k => {
    const isConnected = soul.connectedSources.includes(k.id);
    const months = isConnected ? (k.id === 'plaid' ? 12 : k.id === 'apple_health' ? 8 : 5) : 0;
    const contribution = isConnected ? Math.round(k.maxContribution * Math.min(months / 12, 1.0)) : 0;
    return {
      ...k,
      connected: isConnected,
      connectedAt: isConnected ? daysAgo(months * 30) : null,
      lastSync: isConnected ? daysAgo(rng.int(0, 1)) : null,
      historyMonths: months,
      depthContribution: contribution,
    };
  });

  const insights: Insight[] = INSIGHT_DEFS
    .filter(i => i.soulId === soulId)
    .map((i, idx) => ({
      id: `insight_${soulId}_${idx}`,
      category: i.category,
      categoryDisplay: CATEGORY_DISPLAY_NAMES[i.category] || i.category,
      text: i.text,
      confidence: i.confidence,
      timestamp: daysAgo(i.daysAgo),
      icon: i.icon,
      sourcePrompt: i.sourcePrompt,
    }));

  const demandSignals: Record<string, 'High' | 'Moderate' | 'Low'> = {
    'finance.health': 'High', 'dining.grocery': 'Moderate', 'dining.restaurant': 'Moderate',
    'transport.commute': 'Low', 'shopping.research': 'Moderate', 'shopping.impulse': 'Low',
    'health.fitness': 'High', 'entertainment.streaming': 'Moderate', 'travel.pattern': 'High',
    'education.growth': 'Moderate', 'subscription.management': 'Low',
  };

  const bidRanges: Record<string, { min: number; max: number }> = {
    'finance.health': { min: 2.00, max: 3.50 }, 'dining.grocery': { min: 1.00, max: 2.50 },
    'dining.restaurant': { min: 1.50, max: 3.00 }, 'transport.commute': { min: 0.75, max: 1.75 },
    'shopping.research': { min: 0.75, max: 2.00 }, 'shopping.impulse': { min: 1.50, max: 3.00 },
    'health.fitness': { min: 1.50, max: 3.50 }, 'entertainment.streaming': { min: 0.50, max: 1.50 },
    'travel.pattern': { min: 2.00, max: 4.00 }, 'education.growth': { min: 1.00, max: 2.50 },
    'subscription.management': { min: 0.75, max: 1.50 },
  };

  const consents: SoulConsent[] = soul.consents.map((c, idx) => {
    const offersReceived = rng.int(2, 8);
    const claimedCount = rng.int(1, Math.min(offersReceived, 4));
    const avgEarn = (bidRanges[c.category]?.min || 1.00) * (1 - FEE_RATE);
    return {
      id: `consent_${soulId}_${idx}`,
      category: c.category,
      categoryDisplay: SME_DISPLAY_NAMES[c.category] || CATEGORY_DISPLAY_NAMES[c.category] || c.category,
      yieldFloorUsdc: c.floor,
      grantedAt: daysAgo(c.grantedDaysAgo),
      offersReceived,
      totalEarned: Math.round(claimedCount * avgEarn * 100) / 100,
      active: true,
      demandSignal: demandSignals[c.category] || 'Moderate',
      bidRange: bidRanges[c.category] || null,
    };
  });

  const consentedCats = new Set(soul.consents.map(c => c.category));
  const allTradeable = getTradeableLeaves().map(l => l.id);
  const availableCategories: AvailableCategory[] = allTradeable
    .filter(c => !consentedCats.has(c))
    .filter(c => {
      if (soul.phase === 1) {
        return ['finance.health', 'dining.grocery', 'dining.restaurant'].includes(c) && !consentedCats.has(c);
      }
      return true;
    })
    .map(c => ({
      category: c,
      categoryDisplay: SME_DISPLAY_NAMES[c] || CATEGORY_DISPLAY_NAMES[c] || c,
      estimatedEarning: `$${(rng.float(2, 15)).toFixed(2)}/week`,
      demandSignal: demandSignals[c] || 'Moderate',
      requiresSource: getRequiredSource(c, soul.connectedSources),
    }));

  const allBrandListings = Object.values(BRAND_CREATIVE).flatMap(b =>
    b.listings.map(l => ({ ...l, brandName: b.name }))
  );

  const pendingOffers: Offer[] = [];
  const offerHistory: Offer[] = [];
  const walletTransactions: WalletTransaction[] = [];
  let walletBalance = 0;
  const dailyEarningsMap: Record<string, number> = {};
  const sharingLog: SharingLogEntry[] = [];

  for (let d = 29; d >= 0; d--) {
    const dateStr = new Date(now.getTime() - d * 86400000).toISOString().split('T')[0];
    dailyEarningsMap[dateStr] = 0;
  }

  if (soul.phase === 2) {
    let offerIdx = 0;
    for (const consent of soul.consents) {
      const matchingListings = allBrandListings.filter(l =>
        categoryOverlaps(consent.category, [l.category]) && l.bid >= consent.floor
      );

      for (const listing of matchingListings) {
        const score = soul.scores[listing.category] || 50;
        const matchScore = Math.min(99, score + rng.int(-5, 10));
        const earnUsdc = Math.round(listing.bid * (1 - FEE_RATE) * 100) / 100;
        const framing = (SOUL_FRAMINGS[listing.category] || '{brand} has an offer for you').replace('{brand}', listing.brandName);

        if (offerIdx < 4 && rng.next() > 0.4) {
          pendingOffers.push({
            id: `offer_pending_${soulId}_${offerIdx}`,
            brandName: listing.brandName,
            brandReputation: (BRAND_CREATIVE[Object.keys(BRAND_CREATIVE).find(k => BRAND_CREATIVE[k].name === listing.brandName)!]?.listings[0]?.reputation) || 75,
            category: listing.category,
            categoryDisplay: SME_DISPLAY_NAMES[listing.category] || CATEGORY_DISPLAY_NAMES[listing.category] || listing.category,
            headline: listing.headline,
            body: listing.body,
            ctaUrl: listing.ctaUrl,
            ctaLabel: listing.ctaLabel,
            bidUsdc: listing.bid,
            earnUsdc,
            matchScore,
            expiresAt: new Date(now.getTime() + rng.int(12, 60) * 3600000).toISOString(),
            status: 'pending',
            claimedAt: null,
            dismissedAt: null,
            soulFraming: framing,
          });
        } else {
          const claimDaysAgo = rng.int(1, 25);
          const status = rng.next() > 0.3 ? 'claimed' as const : (rng.next() > 0.5 ? 'dismissed' as const : 'expired' as const);
          const claimedAt = status === 'claimed' ? daysAgo(claimDaysAgo) : null;
          const txHash = generateTxHash(`offer_${soulId}_${offerIdx}`, 42);
          const dateStr = new Date(now.getTime() - claimDaysAgo * 86400000).toISOString().split('T')[0];

          offerHistory.push({
            id: `offer_hist_${soulId}_${offerIdx}`,
            brandName: listing.brandName,
            brandReputation: 75,
            category: listing.category,
            categoryDisplay: SME_DISPLAY_NAMES[listing.category] || CATEGORY_DISPLAY_NAMES[listing.category] || listing.category,
            headline: listing.headline,
            body: listing.body,
            ctaUrl: listing.ctaUrl,
            ctaLabel: listing.ctaLabel,
            bidUsdc: listing.bid,
            earnUsdc,
            matchScore,
            expiresAt: daysAgo(claimDaysAgo - 3),
            status,
            claimedAt,
            dismissedAt: status === 'dismissed' ? daysAgo(claimDaysAgo) : null,
            soulFraming: framing,
          });

          if (status === 'claimed') {
            walletBalance += earnUsdc;
            if (dailyEarningsMap[dateStr] !== undefined) {
              dailyEarningsMap[dateStr] += earnUsdc;
            }
            walletTransactions.push({
              id: `wtx_${soulId}_${offerIdx}`,
              type: 'claim',
              brandName: listing.brandName,
              category: listing.category,
              amountUsdc: earnUsdc,
              txHash,
              timestamp: claimedAt!,
            });
            sharingLog.push({
              id: `share_${soulId}_${offerIdx}`,
              brandName: listing.brandName,
              category: listing.category,
              categoryDisplay: SME_DISPLAY_NAMES[listing.category] || CATEGORY_DISPLAY_NAMES[listing.category] || listing.category,
              actualScore: soul.scores[listing.category] || 50,
              noisyScore: Math.round((soul.scores[listing.category] || 50) + rng.gaussian(0, 8)),
              sharedAt: claimedAt!,
              status: 'active',
            });
          }
        }
        offerIdx++;
      }
    }
  } else {
    const claimDaysAgo = rng.int(5, 15);
    const earnUsdc = Math.round(2.50 * (1 - FEE_RATE) * 100) / 100;
    walletBalance = earnUsdc * 3 + Math.round(rng.float(0.5, 2) * 100) / 100;
    const dateStr = new Date(now.getTime() - claimDaysAgo * 86400000).toISOString().split('T')[0];
    if (dailyEarningsMap[dateStr] !== undefined) {
      dailyEarningsMap[dateStr] = earnUsdc;
    }
    walletTransactions.push({
      id: `wtx_${soulId}_0`,
      type: 'claim',
      brandName: 'Chase Sapphire',
      category: 'finance.health',
      amountUsdc: earnUsdc,
      txHash: generateTxHash(`marcus_claim_0`, 42),
      timestamp: daysAgo(claimDaysAgo),
    });
    walletTransactions.push({
      id: `wtx_${soulId}_1`,
      type: 'claim',
      brandName: 'Whole Foods Market',
      category: 'dining.grocery',
      amountUsdc: Math.round(1.50 * (1 - FEE_RATE) * 100) / 100,
      txHash: generateTxHash(`marcus_claim_1`, 42),
      timestamp: daysAgo(claimDaysAgo + 3),
    });
  }

  walletBalance = Math.round(walletBalance * 100) / 100;

  const dailyEarnings: DailyEarning[] = Object.entries(dailyEarningsMap)
    .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  walletTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  offerHistory.sort((a, b) => {
    const aDate = a.claimedAt || a.dismissedAt || a.expiresAt;
    const bDate = b.claimedAt || b.dismissedAt || b.expiresAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const data: SoulAppData = {
    profile,
    konnections,
    insights,
    consents,
    availableCategories,
    pendingOffers,
    offerHistory,
    walletBalance,
    walletTransactions,
    dailyEarnings,
    sharingLog,
    pendingOfferCount: pendingOffers.length,
  };

  cache[soulId] = data;
  return data;
}

function getRequiredSource(category: string, connectedSources: string[]): string | null {
  const sourceMap: Record<string, string> = {
    'health.fitness': 'apple_health',
    'transport.commute': 'uber',
    'shopping.impulse': 'amazon',
    'entertainment.streaming': 'google',
  };
  const required = sourceMap[category];
  if (required && !connectedSources.includes(required)) {
    const def = KONNECTION_DEFS.find(k => k.id === required);
    return def?.displayName || required;
  }
  return null;
}
