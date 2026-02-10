import { describe, it, expect } from 'vitest';
import { CANONICAL_SEED_PROMPTS, isCanonicalSeed } from '../data/canonicalSeedPrompts';

describe('Canonical Seed Prompts', () => {
  it('should have exactly 21 prompts', () => {
    expect(CANONICAL_SEED_PROMPTS).toHaveLength(21);
  });

  it('every prompt has a non-empty title', () => {
    for (const p of CANONICAL_SEED_PROMPTS) {
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  it('every prompt has non-empty content', () => {
    for (const p of CANONICAL_SEED_PROMPTS) {
      expect(p.content.length).toBeGreaterThan(0);
    }
  });

  it('every prompt id starts with the canonical prefix', () => {
    for (const p of CANONICAL_SEED_PROMPTS) {
      expect(isCanonicalSeed(p.id)).toBe(true);
    }
  });

  it('all ids are unique', () => {
    const ids = CANONICAL_SEED_PROMPTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
