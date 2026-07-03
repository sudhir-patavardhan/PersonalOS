import { estimateReach, type SoulProfile, type ConsentEntry } from '@/lib/matching';
import { getBrandPortalData } from '@/lib/synthetic-data';

function buildSoulProfiles(): SoulProfile[] {
  const data = getBrandPortalData();
  const soulDefs = [
    { id: 'priya', consents: [
      { category: 'dining.grocery', floor: 0.75 }, { category: 'dining.restaurant', floor: 1.00 },
      { category: 'shopping.research', floor: 1.00 }, { category: 'shopping.impulse', floor: 0.75 },
      { category: 'entertainment.streaming', floor: 0.75 }, { category: 'education.growth', floor: 1.00 },
      { category: 'transport.commute', floor: 0.75 }, { category: 'travel.pattern', floor: 1.00 },
    ], scores: { 'finance.health': 75, 'dining.grocery': 62, 'dining.restaurant': 71, 'transport.commute': 58, 'shopping.research': 62, 'shopping.impulse': 55, 'health.fitness': 67, 'entertainment.streaming': 50, 'travel.pattern': 58, 'education.growth': 52, 'subscription.management': 40 }},
    { id: 'marcus', consents: [
      { category: 'finance.health', floor: 2.00 }, { category: 'dining.grocery', floor: 1.50 },
      { category: 'shopping.research', floor: 1.50 }, { category: 'transport.commute', floor: 1.00 },
      { category: 'entertainment.streaming', floor: 1.00 }, { category: 'education.growth', floor: 1.50 },
      { category: 'subscription.management', floor: 1.00 },
    ], scores: { 'finance.health': 70, 'dining.grocery': 65, 'dining.restaurant': 48, 'transport.commute': 45, 'shopping.research': 60, 'shopping.impulse': 38, 'health.fitness': 55, 'entertainment.streaming': 52, 'travel.pattern': 35, 'education.growth': 58, 'subscription.management': 48 }},
    { id: 'sofia', consents: [
      { category: 'education.growth', floor: 0.75 }, { category: 'travel.pattern', floor: 0.50 },
      { category: 'shopping.impulse', floor: 0.50 }, { category: 'shopping.research', floor: 0.50 },
      { category: 'dining.restaurant', floor: 0.50 }, { category: 'entertainment.streaming', floor: 0.50 },
      { category: 'transport.commute', floor: 0.50 },
    ], scores: { 'finance.health': 45, 'dining.grocery': 40, 'dining.restaurant': 55, 'transport.commute': 50, 'shopping.research': 58, 'shopping.impulse': 62, 'health.fitness': 48, 'entertainment.streaming': 60, 'travel.pattern': 65, 'education.growth': 68, 'subscription.management': 35 }},
    { id: 'james', consents: [
      { category: 'finance.health', floor: 3.00 }, { category: 'travel.pattern', floor: 3.00 },
      { category: 'entertainment.streaming', floor: 2.00 }, { category: 'dining.restaurant', floor: 2.00 },
      { category: 'health.fitness', floor: 2.00 }, { category: 'subscription.management', floor: 2.00 },
    ], scores: { 'finance.health': 80, 'dining.grocery': 50, 'dining.restaurant': 60, 'transport.commute': 52, 'shopping.research': 55, 'shopping.impulse': 30, 'health.fitness': 58, 'entertainment.streaming': 55, 'travel.pattern': 70, 'education.growth': 42, 'subscription.management': 52 }},
  ];

  const now = Date.now();
  return soulDefs.map(s => ({
    id: s.id,
    displayName: s.id.charAt(0).toUpperCase() + s.id.slice(1),
    consents: s.consents.map((c): ConsentEntry => ({
      category: c.category,
      yieldFloor: c.floor,
      active: true,
      grantedAt: now - 30 * 86400000,
    })),
    noisyScores: s.scores,
    reputation: 0.8,
    lastActivity: Object.fromEntries(Object.keys(s.scores).map(k => [k, now - Math.random() * 7 * 86400000])),
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  const bid = parseFloat(url.searchParams.get('bid') || '1.00');
  const threshold = parseInt(url.searchParams.get('threshold') || '0');

  if (!category) {
    return Response.json({ error: 'category required' }, { status: 400 });
  }

  const souls = buildSoulProfiles();
  const result = estimateReach(
    { categories: [category] },
    souls,
    bid,
    threshold,
  );

  return Response.json(result);
}
