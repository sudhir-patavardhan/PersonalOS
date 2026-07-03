import type { CategoryNode } from './types';

const TAXONOMY: CategoryNode[] = [
  // dining
  { id: 'dining', parent: null, displayName: 'Dining & Food', description: 'Food and dining related categories', synonyms: ['food', 'eating', 'meals', 'dining', 'restaurants', 'groceries'], depth: 0, tradeable: true },
  { id: 'dining.grocery', parent: 'dining', displayName: 'Grocery & Food Shopping', description: 'People who regularly buy groceries', synonyms: ['groceries', 'supermarket', 'organic', 'whole foods', 'food shopping', 'meal ingredients', 'produce', 'farmers market', 'pantry', 'grocery delivery', 'fresh food', 'natural foods'], depth: 1, tradeable: true },
  { id: 'dining.restaurant', parent: 'dining', displayName: 'Dining Out', description: 'People who dine at restaurants regularly', synonyms: ['restaurants', 'dining out', 'eating out', 'takeout', 'dine in', 'fine dining', 'casual dining', 'cuisine', 'chef', 'reservation', 'brunch', 'happy hour'], depth: 1, tradeable: true },
  { id: 'dining.delivery', parent: 'dining', displayName: 'Food Delivery', description: 'People who order food delivery frequently', synonyms: ['food delivery', 'uber eats', 'doordash', 'grubhub', 'takeout', 'order food', 'delivery apps', 'meal delivery', 'prepared meals'], depth: 1, tradeable: true },
  { id: 'dining.meal_prep', parent: 'dining', displayName: 'Meal Kits & Prep', description: 'People interested in meal kits and prep services', synonyms: ['meal kit', 'meal prep', 'hello fresh', 'blue apron', 'cooking box', 'recipe box', 'meal planning', 'batch cooking'], depth: 1, tradeable: true },

  // health
  { id: 'health', parent: null, displayName: 'Health & Wellness', description: 'Health, fitness, and wellness categories', synonyms: ['health', 'wellness', 'fitness', 'medical', 'wellbeing', 'healthcare'], depth: 0, tradeable: true },
  { id: 'health.fitness', parent: 'health', displayName: 'Fitness & Exercise', description: 'Active people who exercise regularly', synonyms: ['fitness', 'exercise', 'workout', 'gym', 'running', 'training', 'athletic', 'sports', 'CrossFit', 'yoga', 'pilates', 'cycling', 'peloton', 'strength training', 'cardio'], depth: 1, tradeable: true },
  { id: 'health.nutrition', parent: 'health', displayName: 'Nutrition & Diet', description: 'People focused on nutrition and dietary choices', synonyms: ['nutrition', 'diet', 'supplements', 'vitamins', 'protein', 'macros', 'healthy eating', 'dietary', 'calorie tracking', 'meal planning', 'organic food', 'plant based', 'keto', 'vegan'], depth: 1, tradeable: true },
  { id: 'health.wellness', parent: 'health', displayName: 'Wellness & Recovery', description: 'People interested in wellness, meditation, and recovery', synonyms: ['wellness', 'meditation', 'mindfulness', 'sleep', 'recovery', 'mental health', 'stress', 'relaxation', 'self care', 'spa', 'therapy', 'calm', 'headspace'], depth: 1, tradeable: true },
  { id: 'health.medical', parent: 'health', displayName: 'Medical & Healthcare', description: 'Medical and healthcare data — never tradeable', synonyms: ['medical', 'doctor', 'hospital', 'prescription', 'healthcare', 'insurance claims'], depth: 1, tradeable: false },

  // shopping
  { id: 'shopping', parent: null, displayName: 'Shopping', description: 'Shopping and retail categories', synonyms: ['shopping', 'buying', 'retail', 'purchasing', 'consumer', 'e-commerce'], depth: 0, tradeable: true },
  { id: 'shopping.research', parent: 'shopping', displayName: 'Research Shoppers', description: 'People who research products before buying', synonyms: ['research', 'comparison', 'reviews', 'product research', 'smart shopping', 'deal hunting', 'price comparison', 'consumer reports', 'best buy', 'outdoor gear', 'electronics'], depth: 1, tradeable: true },
  { id: 'shopping.impulse', parent: 'shopping', displayName: 'Impulse Buyers', description: 'People who make spontaneous purchases', synonyms: ['impulse', 'spontaneous', 'flash sale', 'deal', 'limited time', 'trend', 'new arrivals', 'must have', 'late night shopping'], depth: 1, tradeable: true },
  { id: 'shopping.luxury', parent: 'shopping', displayName: 'Luxury & Premium', description: 'People who buy premium and designer products', synonyms: ['luxury', 'premium', 'designer', 'high end', 'boutique', 'exclusive', 'brand name', 'warby parker', 'fashion', 'style', 'accessories'], depth: 1, tradeable: true },

  // finance
  { id: 'finance', parent: null, displayName: 'Finance', description: 'Financial health and services', synonyms: ['finance', 'financial', 'money', 'banking', 'credit', 'savings'], depth: 0, tradeable: true },
  { id: 'finance.health', parent: 'finance', displayName: 'Financial Health', description: 'People actively managing their financial health', synonyms: ['financial health', 'credit score', 'budgeting', 'savings', 'credit card', 'rewards', 'cashback', 'points', 'chase', 'banking', 'personal finance', 'money management', 'debt', 'spending habits'], depth: 1, tradeable: true },
  { id: 'finance.investment', parent: 'finance', displayName: 'Investing', description: 'People interested in investments and wealth building', synonyms: ['investing', 'stocks', 'crypto', 'brokerage', 'portfolio', 'wealth', 'retirement', '401k', 'IRA', 'dividends', 'trading', 'ETF', 'mutual funds'], depth: 1, tradeable: true },
  { id: 'finance.insurance', parent: 'finance', displayName: 'Insurance', description: 'People shopping for or managing insurance', synonyms: ['insurance', 'auto insurance', 'home insurance', 'life insurance', 'health insurance', 'coverage', 'policy', 'premium', 'deductible', 'allstate', 'geico', 'state farm'], depth: 1, tradeable: true },

  // entertainment
  { id: 'entertainment', parent: null, displayName: 'Entertainment', description: 'Entertainment and media categories', synonyms: ['entertainment', 'media', 'content', 'streaming', 'music', 'shows'], depth: 0, tradeable: true },
  { id: 'entertainment.streaming', parent: 'entertainment', displayName: 'Streaming & Media', description: 'People who subscribe to streaming services', synonyms: ['streaming', 'netflix', 'spotify', 'hulu', 'disney plus', 'podcasts', 'music streaming', 'video streaming', 'audiobooks', 'audio', 'playlists', 'binge watching'], depth: 1, tradeable: true },
  { id: 'entertainment.gaming', parent: 'entertainment', displayName: 'Gaming', description: 'People who play video games', synonyms: ['gaming', 'video games', 'esports', 'console', 'PC gaming', 'mobile games', 'playstation', 'xbox', 'nintendo', 'steam', 'twitch'], depth: 1, tradeable: true },
  { id: 'entertainment.live', parent: 'entertainment', displayName: 'Live Events', description: 'People who attend concerts, sports, and events', synonyms: ['concerts', 'live events', 'festivals', 'sports events', 'tickets', 'theater', 'comedy shows', 'ticketmaster', 'stubhub', 'venue'], depth: 1, tradeable: true },

  // travel
  { id: 'travel', parent: null, displayName: 'Travel', description: 'Travel and experiences', synonyms: ['travel', 'trips', 'vacation', 'tourism', 'adventure', 'explore'], depth: 0, tradeable: true },
  { id: 'travel.pattern', parent: 'travel', displayName: 'Travel Patterns', description: 'Frequent travelers with established patterns', synonyms: ['travel', 'frequent traveler', 'flights', 'airline', 'miles', 'trip planning', 'vacation', 'getaway', 'wanderlust', 'backpacking', 'road trip', 'travel rewards'], depth: 1, tradeable: true },
  { id: 'travel.accommodation', parent: 'travel', displayName: 'Accommodation', description: 'People booking hotels and vacation rentals', synonyms: ['hotels', 'accommodation', 'airbnb', 'vacation rental', 'resort', 'hostel', 'booking', 'lodging', 'stay', 'check in'], depth: 1, tradeable: true },
  { id: 'travel.experiences', parent: 'travel', displayName: 'Travel Experiences', description: 'People interested in tours, activities, and adventures', synonyms: ['tours', 'activities', 'excursions', 'adventure travel', 'guided tours', 'experiences', 'outdoor adventures', 'hiking tours', 'cultural tours', 'REI adventures'], depth: 1, tradeable: true },

  // transport
  { id: 'transport', parent: null, displayName: 'Transportation', description: 'Daily transportation and commuting', synonyms: ['transport', 'commute', 'ride', 'transit', 'mobility'], depth: 0, tradeable: true },
  { id: 'transport.commute', parent: 'transport', displayName: 'Daily Commute', description: 'People with regular commute patterns', synonyms: ['commute', 'commuting', 'daily ride', 'work travel', 'transit pass', 'subway', 'bus', 'train', 'carpool', 'rush hour'], depth: 1, tradeable: true },
  { id: 'transport.rideshare', parent: 'transport', displayName: 'Rideshare', description: 'People who use ride-hailing services', synonyms: ['rideshare', 'uber', 'lyft', 'ride hailing', 'taxi', 'car service', 'ride share', 'shared rides'], depth: 1, tradeable: true },

  // education
  { id: 'education', parent: null, displayName: 'Education & Learning', description: 'Education and personal development', synonyms: ['education', 'learning', 'courses', 'skills', 'development', 'training'], depth: 0, tradeable: true },
  { id: 'education.growth', parent: 'education', displayName: 'Personal Growth', description: 'People investing in personal development', synonyms: ['personal growth', 'self improvement', 'online courses', 'coursera', 'udemy', 'learning', 'skill building', 'knowledge', 'books', 'reading', 'nonfiction', 'leadership'], depth: 1, tradeable: true },
  { id: 'education.professional', parent: 'education', displayName: 'Professional Development', description: 'People pursuing career certifications and skills', synonyms: ['professional development', 'certifications', 'career', 'upskilling', 'bootcamp', 'technical training', 'MBA', 'data science', 'coding', 'project management'], depth: 1, tradeable: true },
  { id: 'education.language', parent: 'education', displayName: 'Language Learning', description: 'People learning new languages', synonyms: ['language learning', 'duolingo', 'rosetta stone', 'babbel', 'foreign language', 'ESL', 'bilingual', 'translation', 'spanish', 'french', 'mandarin'], depth: 1, tradeable: true },

  // subscription
  { id: 'subscription', parent: null, displayName: 'Subscriptions', description: 'Subscription management and optimization', synonyms: ['subscription', 'recurring', 'membership', 'monthly', 'annual plan'], depth: 0, tradeable: true },
  { id: 'subscription.management', parent: 'subscription', displayName: 'Subscription Management', description: 'People managing multiple subscriptions', synonyms: ['subscription management', 'cancel subscription', 'subscription audit', 'recurring charges', 'membership management', 'billing', 'auto renew'], depth: 1, tradeable: true },
  { id: 'subscription.optimization', parent: 'subscription', displayName: 'Subscription Optimization', description: 'People looking to optimize or bundle subscriptions', synonyms: ['bundle', 'optimization', 'consolidate', 'save on subscriptions', 'subscription churn', 'downgrade', 'upgrade', 'family plan', 'student discount'], depth: 1, tradeable: true },
];

const nodeMap = new Map<string, CategoryNode>();
const childrenMap = new Map<string, string[]>();
const synonymIndex = new Map<string, { categoryId: string; score: number }[]>();

function buildIndexes() {
  if (nodeMap.size > 0) return;

  for (const node of TAXONOMY) {
    nodeMap.set(node.id, node);

    if (node.parent) {
      const siblings = childrenMap.get(node.parent) || [];
      siblings.push(node.id);
      childrenMap.set(node.parent, siblings);
    }

    for (const syn of node.synonyms) {
      const lower = syn.toLowerCase();
      const entries = synonymIndex.get(lower) || [];
      entries.push({ categoryId: node.id, score: node.depth === 0 ? 0.5 : 1.0 });
      synonymIndex.set(lower, entries);
    }
  }
}

export function getNode(id: string): CategoryNode | undefined {
  buildIndexes();
  return nodeMap.get(id);
}

export function getChildren(parentId: string): CategoryNode[] {
  buildIndexes();
  const ids = childrenMap.get(parentId) || [];
  return ids.map(id => nodeMap.get(id)!).filter(Boolean);
}

export function getAncestors(id: string): CategoryNode[] {
  buildIndexes();
  const result: CategoryNode[] = [];
  let current = nodeMap.get(id);
  while (current?.parent) {
    const parent = nodeMap.get(current.parent);
    if (parent) result.push(parent);
    current = parent;
  }
  return result;
}

export function getAllLeaves(parentId?: string): CategoryNode[] {
  buildIndexes();
  if (!parentId) {
    return TAXONOMY.filter(n => !childrenMap.has(n.id));
  }
  const leaves: CategoryNode[] = [];
  const stack = [parentId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const kids = childrenMap.get(current);
    if (kids && kids.length > 0) {
      stack.push(...kids);
    } else {
      const node = nodeMap.get(current);
      if (node) leaves.push(node);
    }
  }
  return leaves;
}

export function findByTerm(term: string): { node: CategoryNode; score: number }[] {
  buildIndexes();
  const lower = term.toLowerCase().trim();
  const results: { node: CategoryNode; score: number }[] = [];

  const exact = synonymIndex.get(lower);
  if (exact) {
    for (const entry of exact) {
      const node = nodeMap.get(entry.categoryId);
      if (node) results.push({ node, score: entry.score });
    }
  }

  for (const [syn, entries] of synonymIndex) {
    if (syn === lower) continue;
    if (syn.includes(lower) || lower.includes(syn)) {
      for (const entry of entries) {
        if (results.some(r => r.node.id === entry.categoryId)) continue;
        const node = nodeMap.get(entry.categoryId);
        if (node) results.push({ node, score: entry.score * 0.7 });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function getAllNodes(): CategoryNode[] {
  return [...TAXONOMY];
}

export function getParentNodes(): CategoryNode[] {
  return TAXONOMY.filter(n => n.depth === 0);
}

export function getTradeableLeaves(): CategoryNode[] {
  return getAllLeaves().filter(n => n.tradeable);
}

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  TAXONOMY.map(n => [n.id, n.displayName])
);

export const TRADEABLE_CATEGORIES: string[] = TAXONOMY
  .filter(n => n.tradeable && !childrenMap.has(n.id))
  .map(n => n.id);

export const ALL_CATEGORIES: string[] = TAXONOMY
  .filter(n => !childrenMap.has(n.id))
  .map(n => n.id);
