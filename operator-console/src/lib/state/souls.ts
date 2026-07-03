export interface CanonicalSoul {
  id: string;
  displayName: string;
  email: string;
  region: string;
  avatarInitials: string;
  walletAddress: string;
  connectedSources: string[];
  depthScore: number;
  phase: 1 | 2;
  consents: { category: string; floor: number }[];
  noisyScores: Record<string, number>;
  reputation: number;
}

export const CANONICAL_SOULS: CanonicalSoul[] = [
  {
    id: 'priya',
    displayName: 'Priya Sharma',
    email: 'priya@personalos.me',
    region: 'North America',
    avatarInitials: 'PS',
    walletAddress: '0x7A3f8c2E9b4D6a1F0e5C7B3d2A8f4E6c9D8B2c',
    connectedSources: ['plaid', 'apple_health', 'amazon'],
    depthScore: 72,
    phase: 2,
    consents: [
      { category: 'dining.grocery', floor: 0.75 },
      { category: 'dining.restaurant', floor: 1.00 },
      { category: 'shopping.research', floor: 1.00 },
      { category: 'shopping.impulse', floor: 0.75 },
      { category: 'entertainment.streaming', floor: 0.75 },
      { category: 'education.growth', floor: 1.00 },
      { category: 'transport.commute', floor: 0.75 },
      { category: 'travel.pattern', floor: 1.00 },
    ],
    noisyScores: {
      'finance.health': 75, 'dining.grocery': 62, 'dining.restaurant': 71,
      'transport.commute': 58, 'shopping.research': 62, 'shopping.impulse': 55,
      'health.fitness': 67, 'entertainment.streaming': 50, 'travel.pattern': 58,
      'education.growth': 52, 'subscription.management': 40,
    },
    reputation: 0.85,
  },
  {
    id: 'marcus',
    displayName: 'Marcus Thompson',
    email: 'marcus@personalos.me',
    region: 'North America',
    avatarInitials: 'MT',
    walletAddress: '0x4E1d7F9a3C6B2e8D5A0f1C4b7E3d6A9F2c8B5a',
    connectedSources: ['plaid', 'apple_health'],
    depthScore: 58,
    phase: 2,
    consents: [
      { category: 'finance.health', floor: 2.00 },
      { category: 'dining.grocery', floor: 1.50 },
      { category: 'shopping.research', floor: 1.50 },
      { category: 'transport.commute', floor: 1.00 },
      { category: 'entertainment.streaming', floor: 1.00 },
      { category: 'education.growth', floor: 1.50 },
      { category: 'subscription.management', floor: 1.00 },
    ],
    noisyScores: {
      'finance.health': 70, 'dining.grocery': 65, 'dining.restaurant': 48,
      'transport.commute': 45, 'shopping.research': 60, 'shopping.impulse': 38,
      'health.fitness': 55, 'entertainment.streaming': 52, 'travel.pattern': 35,
      'education.growth': 58, 'subscription.management': 48,
    },
    reputation: 0.80,
  },
  {
    id: 'sofia',
    displayName: 'Sofia Martinez',
    email: 'sofia@personalos.me',
    region: 'North America',
    avatarInitials: 'SM',
    walletAddress: '0x9B2c4E6a8D1f3A5C7e0B9d2F4a6C8E1b3D5F7a',
    connectedSources: ['plaid', 'amazon', 'spotify'],
    depthScore: 65,
    phase: 2,
    consents: [
      { category: 'education.growth', floor: 0.75 },
      { category: 'travel.pattern', floor: 0.50 },
      { category: 'shopping.impulse', floor: 0.50 },
      { category: 'shopping.research', floor: 0.50 },
      { category: 'dining.restaurant', floor: 0.50 },
      { category: 'entertainment.streaming', floor: 0.50 },
      { category: 'transport.commute', floor: 0.50 },
    ],
    noisyScores: {
      'finance.health': 45, 'dining.grocery': 40, 'dining.restaurant': 55,
      'transport.commute': 50, 'shopping.research': 58, 'shopping.impulse': 62,
      'health.fitness': 48, 'entertainment.streaming': 60, 'travel.pattern': 65,
      'education.growth': 68, 'subscription.management': 35,
    },
    reputation: 0.78,
  },
  {
    id: 'james',
    displayName: 'James Wilson',
    email: 'james@personalos.me',
    region: 'North America',
    avatarInitials: 'JW',
    walletAddress: '0x1F5a3D7c9E2b4A6f8C0d1B3e5A7F9c2D4E6B8a',
    connectedSources: ['plaid', 'apple_health', 'uber'],
    depthScore: 45,
    phase: 2,
    consents: [
      { category: 'finance.health', floor: 3.00 },
      { category: 'travel.pattern', floor: 3.00 },
      { category: 'entertainment.streaming', floor: 2.00 },
      { category: 'dining.restaurant', floor: 2.00 },
      { category: 'health.fitness', floor: 2.00 },
      { category: 'subscription.management', floor: 2.00 },
    ],
    noisyScores: {
      'finance.health': 80, 'dining.grocery': 50, 'dining.restaurant': 60,
      'transport.commute': 52, 'shopping.research': 55, 'shopping.impulse': 30,
      'health.fitness': 58, 'entertainment.streaming': 55, 'travel.pattern': 70,
      'education.growth': 42, 'subscription.management': 52,
    },
    reputation: 0.72,
  },
];

export interface MarketplaceMetadata {
  totalSouls: number;
  totalConsents: number;
  categoryDistribution: Record<string, { consentCount: number; avgFloor: number; avgScore: number }>;
  phaseBreakdown: { phase1: number; phase2: number };
  avgDepthScore: number;
  avgConsentsPerSoul: number;
}

export function getMarketplaceMetadata(): MarketplaceMetadata {
  const allConsents = CANONICAL_SOULS.flatMap(s => s.consents);
  const catMap: Record<string, { floors: number[]; scores: number[] }> = {};

  for (const soul of CANONICAL_SOULS) {
    for (const consent of soul.consents) {
      if (!catMap[consent.category]) catMap[consent.category] = { floors: [], scores: [] };
      catMap[consent.category].floors.push(consent.floor);
      const score = soul.noisyScores[consent.category];
      if (score) catMap[consent.category].scores.push(score);
    }
  }

  const categoryDistribution: Record<string, { consentCount: number; avgFloor: number; avgScore: number }> = {};
  for (const [cat, data] of Object.entries(catMap)) {
    categoryDistribution[cat] = {
      consentCount: data.floors.length,
      avgFloor: data.floors.reduce((a, b) => a + b, 0) / data.floors.length,
      avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
    };
  }

  return {
    totalSouls: CANONICAL_SOULS.length,
    totalConsents: allConsents.length,
    categoryDistribution,
    phaseBreakdown: {
      phase1: CANONICAL_SOULS.filter(s => s.phase === 1).length,
      phase2: CANONICAL_SOULS.filter(s => s.phase === 2).length,
    },
    avgDepthScore: CANONICAL_SOULS.reduce((s, soul) => s + soul.depthScore, 0) / CANONICAL_SOULS.length,
    avgConsentsPerSoul: allConsents.length / CANONICAL_SOULS.length,
  };
}

export function getSoulById(id: string): CanonicalSoul | undefined {
  return CANONICAL_SOULS.find(s => s.id === id);
}
