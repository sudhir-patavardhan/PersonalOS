import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import type { ExchangeState, Listing, NewListing, Offer, Settlement, ExchangeRun, Metrics, CategoryHeat } from './types';

const FEE_RATE = 0.10;

function getStatePath(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'shared', 'state', 'exchange.json');
    if (fs.existsSync(path.join(dir, 'shared', 'state'))) return candidate;
    dir = path.dirname(dir);
  }
  return path.join(process.cwd(), '..', 'shared', 'state', 'exchange.json');
}

const EMPTY_STATE: ExchangeState = { listings: [], offers: [], settlements: [], exchangeRuns: [] };

export function readState(): ExchangeState {
  const filePath = getStatePath();
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const state = JSON.parse(raw) as ExchangeState;
    return {
      listings: state.listings || [],
      offers: state.offers || [],
      settlements: state.settlements || [],
      exchangeRuns: state.exchangeRuns || [],
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function writeState(state: ExchangeState): void {
  const filePath = getStatePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);

  const size = Buffer.byteLength(JSON.stringify(state));
  if (size > 100_000) {
    console.warn(`[shared-state] exchange.json is ${(size / 1024).toFixed(0)}KB — consider resetting`);
  }
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_live_${ts}_${rand}`;
}

function generateTxHash(seed: string): string {
  return '0x' + createHash('sha256').update(seed + Date.now()).digest('hex').slice(0, 64);
}

// --- Listing operations ---

export function createListing(input: NewListing): Listing {
  const state = readState();
  const listing: Listing = {
    ...input,
    id: generateId('listing'),
    escrowRemaining: input.escrowFunded,
    status: 'active',
    createdAt: new Date().toISOString(),
  };
  state.listings.push(listing);
  writeState(state);
  return listing;
}

export function getActiveListings(): Listing[] {
  return readState().listings.filter(l => l.status === 'active');
}

export function getAllListings(): Listing[] {
  return readState().listings;
}

export function updateListingEscrow(listingId: string, deductAmount: number): Listing | null {
  const state = readState();
  const listing = state.listings.find(l => l.id === listingId);
  if (!listing) return null;
  listing.escrowRemaining = Math.round((listing.escrowRemaining - deductAmount) * 100) / 100;
  if (listing.escrowRemaining < listing.bidPerClaim) {
    listing.status = 'exhausted';
  }
  writeState(state);
  return listing;
}

// --- Exchange operations ---

export interface MatchInput {
  soulId: string;
  listingId: string;
  brandId: string;
  brandName: string;
  category: string;
  bidPerClaim: number;
  compositeScore: number;
  matchedCategories: string[];
}

export function recordExchangeRun(matches: MatchInput[]): ExchangeRun {
  const state = readState();
  const runId = generateId('run');

  const existingPairs = new Set(
    state.offers
      .filter(o => o.status === 'pending')
      .map(o => `${o.soulId}:${o.listingId}`)
  );

  let created = 0;
  const categories = new Set<string>();

  for (const match of matches) {
    const pairKey = `${match.soulId}:${match.listingId}`;
    if (existingPairs.has(pairKey)) continue;

    const offer: Offer = {
      id: generateId('offer'),
      listingId: match.listingId,
      soulId: match.soulId,
      brandId: match.brandId,
      brandName: match.brandName,
      category: match.category,
      bidPerClaim: match.bidPerClaim,
      compositeScore: match.compositeScore,
      matchedCategories: match.matchedCategories,
      status: 'pending',
      exchangeRunId: runId,
      createdAt: new Date().toISOString(),
    };
    state.offers.push(offer);
    existingPairs.add(pairKey);
    created++;
    categories.add(match.category);
  }

  const run: ExchangeRun = {
    id: runId,
    matchCount: matches.length,
    categoriesCovered: categories.size,
    offersCreated: created,
    ranAt: new Date().toISOString(),
  };
  state.exchangeRuns.push(run);
  writeState(state);
  return run;
}

export function getPendingOffers(soulId: string): Offer[] {
  return readState().offers.filter(o => o.soulId === soulId && o.status === 'pending');
}

export function getAllOffers(): Offer[] {
  return readState().offers;
}

// --- Claim operations ---

export function claimOffer(offerId: string): Settlement | { error: string } {
  const state = readState();
  const offer = state.offers.find(o => o.id === offerId);
  if (!offer) return { error: 'Offer not found' };
  if (offer.status === 'claimed') return { error: 'Already claimed' };
  if (offer.status === 'expired') return { error: 'Offer expired' };

  const listing = state.listings.find(l => l.id === offer.listingId);
  if (!listing) return { error: 'Listing not found' };
  if (listing.escrowRemaining < offer.bidPerClaim) return { error: 'Insufficient escrow' };

  offer.status = 'claimed';

  listing.escrowRemaining = Math.round((listing.escrowRemaining - offer.bidPerClaim) * 100) / 100;
  if (listing.escrowRemaining < listing.bidPerClaim) {
    listing.status = 'exhausted';
  }

  const yieldUsdc = Math.round(offer.bidPerClaim * (1 - FEE_RATE) * 100) / 100;
  const feeUsdc = Math.round(offer.bidPerClaim * FEE_RATE * 100) / 100;

  const settlement: Settlement = {
    id: generateId('settlement'),
    offerId: offer.id,
    listingId: offer.listingId,
    soulId: offer.soulId,
    brandId: offer.brandId,
    category: offer.category,
    bidUsdc: offer.bidPerClaim,
    yieldUsdc,
    feeUsdc,
    txHash: generateTxHash(`${offer.id}_${offer.soulId}_${offer.listingId}`),
    claimedAt: new Date().toISOString(),
  };
  state.settlements.push(settlement);
  writeState(state);
  return settlement;
}

export function getSettlements(filter?: { brandId?: string; soulId?: string }): Settlement[] {
  const settlements = readState().settlements;
  if (!filter) return settlements;
  return settlements.filter(s => {
    if (filter.brandId && s.brandId !== filter.brandId) return false;
    if (filter.soulId && s.soulId !== filter.soulId) return false;
    return true;
  });
}

// --- Metrics ---

export function getMetrics(): Metrics {
  const state = readState();
  const categoryHeat: Record<string, CategoryHeat> = {};

  for (const offer of state.offers) {
    if (!categoryHeat[offer.category]) {
      categoryHeat[offer.category] = { offerCount: 0, claimCount: 0, claimRate: 0, avgBid: 0, totalVolume: 0 };
    }
    categoryHeat[offer.category].offerCount++;
  }

  for (const settlement of state.settlements) {
    if (!categoryHeat[settlement.category]) {
      categoryHeat[settlement.category] = { offerCount: 0, claimCount: 0, claimRate: 0, avgBid: 0, totalVolume: 0 };
    }
    categoryHeat[settlement.category].claimCount++;
    categoryHeat[settlement.category].totalVolume += settlement.bidUsdc;
  }

  for (const [cat, heat] of Object.entries(categoryHeat)) {
    heat.claimRate = heat.offerCount > 0 ? heat.claimCount / heat.offerCount : 0;
    const catOffers = state.offers.filter(o => o.category === cat);
    heat.avgBid = catOffers.length > 0 ? catOffers.reduce((s, o) => s + o.bidPerClaim, 0) / catOffers.length : 0;
  }

  const topCategories = Object.entries(categoryHeat)
    .sort((a, b) => b[1].offerCount - a[1].offerCount)
    .slice(0, 5)
    .map(([cat]) => cat);

  const lastSettlement = state.settlements.length > 0
    ? state.settlements[state.settlements.length - 1].claimedAt
    : null;

  return {
    categoryHeat,
    topCategories,
    totalExchangeRuns: state.exchangeRuns.length,
    totalVolume: state.settlements.reduce((s, t) => s + t.bidUsdc, 0),
    lastActivity: lastSettlement,
  };
}

// --- Reset ---

export function resetState(): void {
  const filePath = getStatePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(EMPTY_STATE, null, 2), 'utf-8');
}
