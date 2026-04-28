/**
 * Seeded pseudo-random number generator (Mulberry32).
 *
 * Used by the demo-data generator to produce deterministic fixture data for
 * tests and reproducible dev seeding. Not cryptographically secure — demo /
 * fixture data only.
 *
 * A given seed always produces the same sequence:
 *   createRng(42).next() === createRng(42).next() // true
 *
 * String seeds are hashed to a 32-bit integer via xmur3 before being fed to
 * Mulberry32, so `createRng("alice")` is also deterministic.
 *
 * Self-contained: no external deps, no imports from other modules.
 */

export type Rng = {
  /** Uniform float in `[0, 1)`. */
  next(): number;
  /** Uniform integer in `[min, max]` (both inclusive). */
  nextInt(min: number, max: number): number;
  /** Uniform float in `[min, max)`. */
  nextFloat(min: number, max: number): number;
  /** Uniform choice from a non-empty array. */
  pick<T>(items: readonly T[]): T;
  /** Returns `true` with the given probability in `[0, 1]`. */
  chance(probability: number): boolean;
};

/**
 * Create a seeded RNG. If `seed` is omitted, derives a non-deterministic seed
 * from `Math.random()` — acceptable because this RNG is only used for demo
 * fixture data, never security-sensitive choices.
 */
export function createRng(seed?: number | string): Rng {
  const intSeed =
    seed === undefined
      ? Math.floor(Math.random() * 0x1_0000_0000)
      : typeof seed === "number"
        ? normalizeSeed(seed)
        : hashStringToInt(seed);

  const nextFloat01 = mulberry32(intSeed);

  const rng: Rng = {
    next: () => nextFloat01(),
    nextInt: (min, max) => {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error("nextInt: min and max must be finite numbers");
      }
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      // max-inclusive: span = hi - lo + 1
      return lo + Math.floor(nextFloat01() * (hi - lo + 1));
    },
    nextFloat: (min, max) => {
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new Error("nextFloat: min and max must be finite numbers");
      }
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return lo + nextFloat01() * (hi - lo);
    },
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error("pick: cannot pick from an empty array");
      }
      const index = Math.floor(nextFloat01() * items.length);
      // Guard against the (exceedingly rare) case where nextFloat01() returns
      // a value that rounds to items.length due to floating-point edge cases.
      const safeIndex = index === items.length ? items.length - 1 : index;
      return items[safeIndex] as T;
    },
    chance: (probability) => {
      if (!Number.isFinite(probability)) {
        throw new Error("chance: probability must be a finite number");
      }
      if (probability <= 0) return false;
      if (probability >= 1) return true;
      return nextFloat01() < probability;
    },
  };

  return rng;
}

/**
 * Mulberry32 — a tiny, fast, good-enough 32-bit PRNG.
 * See https://stackoverflow.com/a/47593316 for the canonical reference.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Normalize any finite number into a deterministic 32-bit unsigned integer.
 * Guarantees `normalizeSeed(n) === normalizeSeed(n)` for the same `n`, so
 * `createRng(42)` twice produces identical sequences.
 */
function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    // Fall back to a fixed non-random value to keep determinism on bad input.
    return 0;
  }
  // Fold non-integer / negative / large values into an unsigned 32-bit int.
  // Using the fractional part ensures floats like 0.5 don't collapse to 0.
  const scaled = seed * 2654435761; // Knuth multiplicative hash constant
  return scaled >>> 0;
}

/**
 * xmur3 string hasher — produces a 32-bit unsigned integer from a string.
 * Small, fast, and deterministic. Good enough for seeding a PRNG.
 * See https://github.com/bryc/code/blob/master/jshash/PRNGs.md
 */
function hashStringToInt(input: string): number {
  let h = 2166136261 >>> 0; // FNV-1a offset basis, used as xmur3 initial state
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
