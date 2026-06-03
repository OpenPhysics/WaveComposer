/**
 * PolynomialRootFinder.ts
 *
 * Finds all complex roots of a real polynomial using the Durand-Kerner
 * (Weierstrass) method — simple, dependency-free, and robust for the modest
 * degrees (LPC order ≤ ~24) used here. in-formant uses Aberth's method; Durand-
 * Kerner is the simpler cousin and converges quickly at these sizes.
 *
 * Roots are iterated simultaneously: z_k ← z_k − P(z_k) / Π_{j≠k}(z_k − z_j),
 * with P evaluated by Horner's rule. Components are kept in raw Float64 arrays
 * to avoid allocating complex objects in the iteration.
 */
import { Complex } from "./Complex.js";

const DEFAULT_MAX_ITERATIONS = 80;
const DEFAULT_TOLERANCE = 1e-12;

/** P(z) by Horner's rule (descending coeffs, normalized leading term) → out. */
function evaluateHorner(
  coeffs: ArrayLike<number>,
  degree: number,
  leading: number,
  zr: number,
  zi: number,
  out: Float64Array,
): void {
  let pr = leading;
  let pi = 0;
  for (let i = 1; i <= degree; i++) {
    const t = pr * zr - pi * zi + (coeffs[i] ?? 0);
    pi = pr * zi + pi * zr;
    pr = t;
  }
  out[0] = pr;
  out[1] = pi;
}

/** Π_{j≠k} (z_k − z_j) → out. */
function productOfDifferences(
  re: Float64Array,
  im: Float64Array,
  degree: number,
  k: number,
  zr: number,
  zi: number,
  out: Float64Array,
): void {
  let dr = 1;
  let di = 0;
  for (let j = 0; j < degree; j++) {
    if (j === k) {
      continue;
    }
    const ar = zr - (re[j] ?? 0);
    const ai = zi - (im[j] ?? 0);
    const nr = dr * ar - di * ai;
    const ni = dr * ai + di * ar;
    dr = nr;
    di = ni;
  }
  out[0] = dr;
  out[1] = di;
}

/** Seeds the roots with powers of (0.4 + 0.9i), an off-axis spiral. */
function seedRoots(re: Float64Array, im: Float64Array, degree: number): void {
  let seedRe = 1;
  let seedIm = 0;
  for (let k = 0; k < degree; k++) {
    const nextRe = seedRe * 0.4 - seedIm * 0.9;
    const nextIm = seedRe * 0.9 + seedIm * 0.4;
    seedRe = nextRe;
    seedIm = nextIm;
    re[k] = seedRe;
    im[k] = seedIm;
  }
}

/**
 * Returns the roots of the polynomial whose coefficients are given in
 * descending powers, i.e. `coeffs[0]·z^p + coeffs[1]·z^(p-1) + … + coeffs[p]`.
 * `coeffs[0]` should be non-zero (leading coefficient).
 */
export function findRoots(
  coeffs: ArrayLike<number>,
  maxIterations: number = DEFAULT_MAX_ITERATIONS,
  tolerance: number = DEFAULT_TOLERANCE,
): Complex[] {
  const degree = coeffs.length - 1;
  if (degree <= 0) {
    return [];
  }
  const leading = coeffs[0] ?? 1;
  const re = new Float64Array(degree);
  const im = new Float64Array(degree);
  seedRoots(re, im, degree);

  const pOut = new Float64Array(2);
  const dOut = new Float64Array(2);
  for (let iter = 0; iter < maxIterations; iter++) {
    let maxDelta = 0;
    for (let k = 0; k < degree; k++) {
      const zr = re[k] ?? 0;
      const zi = im[k] ?? 0;
      evaluateHorner(coeffs, degree, leading, zr, zi, pOut);
      productOfDifferences(re, im, degree, k, zr, zi, dOut);

      const dr = dOut[0] ?? 0;
      const di = dOut[1] ?? 0;
      const denomSq = dr * dr + di * di;
      if (denomSq === 0) {
        continue;
      }
      const pr = pOut[0] ?? 0;
      const pi = pOut[1] ?? 0;
      const deltaRe = (pr * dr + pi * di) / denomSq;
      const deltaIm = (pi * dr - pr * di) / denomSq;
      re[k] = zr - deltaRe;
      im[k] = zi - deltaIm;

      const delta = Math.hypot(deltaRe, deltaIm);
      if (delta > maxDelta) {
        maxDelta = delta;
      }
    }
    if (maxDelta < tolerance) {
      break;
    }
  }

  const roots: Complex[] = [];
  for (let k = 0; k < degree; k++) {
    roots.push(new Complex(re[k] ?? 0, im[k] ?? 0));
  }
  return roots;
}
