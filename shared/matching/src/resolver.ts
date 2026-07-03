import type { TargetingInput, ResolverResult } from './types';
import { getNode, getAllLeaves, findByTerm, getTradeableLeaves } from './taxonomy';

export function resolveTargeting(input: TargetingInput): string[] {
  const resolved = new Set<string>();

  if (input.categories) {
    for (const cat of input.categories) {
      const node = getNode(cat);
      if (!node) continue;

      const leaves = getAllLeaves(cat);
      if (leaves.length > 0) {
        for (const leaf of leaves) {
          if (leaf.tradeable) resolved.add(leaf.id);
        }
      } else if (node.tradeable) {
        resolved.add(node.id);
      }
    }
  }

  if (input.descriptor) {
    const result = resolveDescriptor(input.descriptor);
    for (const cat of result.resolvedCategories) {
      resolved.add(cat);
    }
  }

  return [...resolved].sort();
}

export function resolveDescriptor(text: string): ResolverResult {
  const tokens = tokenize(text);
  const matchedTerms: ResolverResult['matchedTerms'] = [];
  const unmatchedTerms: string[] = [];
  const seen = new Set<string>();

  for (const token of tokens) {
    const matches = findByTerm(token);
    if (matches.length > 0) {
      for (const m of matches) {
        if (m.node.tradeable && !seen.has(m.node.id)) {
          const leaves = getAllLeaves(m.node.id);
          if (leaves.length > 0) {
            for (const leaf of leaves) {
              if (leaf.tradeable && !seen.has(leaf.id)) {
                matchedTerms.push({ term: token, category: leaf.id, score: m.score * 0.9 });
                seen.add(leaf.id);
              }
            }
          } else {
            matchedTerms.push({ term: token, category: m.node.id, score: m.score });
            seen.add(m.node.id);
          }
        }
      }
    } else {
      unmatchedTerms.push(token);
    }
  }

  const resolvedCategories = [...new Set(matchedTerms.map(m => m.category))].sort();

  const suggestedTerms = resolvedCategories.length === 0
    ? getSuggestedTerms()
    : [];

  return { resolvedCategories, matchedTerms, unmatchedTerms, suggestedTerms };
}

function tokenize(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'who', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'their', 'them', 'they', 'it', 'its', 'from', 'into', 'about', 'like', 'very', 'really', 'just']);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));

  const tokens = [...words];

  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }

  return tokens;
}

function getSuggestedTerms(): string[] {
  const leaves = getTradeableLeaves();
  const terms: string[] = [];
  for (const leaf of leaves.slice(0, 8)) {
    if (leaf.synonyms.length > 0) {
      terms.push(leaf.synonyms[0]);
    }
  }
  return terms;
}
