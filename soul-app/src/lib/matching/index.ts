export type {
  CategoryNode,
  TargetingInput,
  ResolverResult,
  SoulProfile,
  ConsentEntry,
  ListingProfile,
  MatchResult,
  ExchangeRun,
  ReachEstimate,
  MatchMetrics,
} from './types';

export {
  getNode,
  getChildren,
  getAncestors,
  getAllLeaves,
  getAllNodes,
  getParentNodes,
  getTradeableLeaves,
  findByTerm,
  CATEGORY_DISPLAY_NAMES,
  TRADEABLE_CATEGORIES,
  ALL_CATEGORIES,
} from './taxonomy';

export {
  resolveTargeting,
  resolveDescriptor,
} from './resolver';

export {
  categoryOverlaps,
  matchSoulToListing,
  runExchange,
  estimateReach,
} from './engine';

export {
  computeMetrics,
} from './metrics';
