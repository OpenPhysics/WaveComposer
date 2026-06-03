/**
 * FormantAnalyzer.ts
 *
 * Extracts formants from LPC coefficients and evaluates the LPC spectral
 * envelope. Ported from references/in-formant/src/analysis/formant/simplelp.cpp.
 *
 * Each conjugate-pole pair of the analysis filter A(z) = 1 - Σ a_m·z^-m maps to
 * a resonance: a root r·e^{jφ} gives frequency = φ·fs/2π and bandwidth =
 * -ln(r)·fs/π. Poles with too-wide bandwidth (far inside the unit circle) or
 * outside the frequency band are discarded.
 */
import type { Fft } from "./Fft.js";
import { findRoots } from "./PolynomialRootFinder.js";
import type { FormantData } from "./types.js";

export interface FormantOptions {
  readonly sampleRate: number;
  readonly maxFormants: number;
  readonly minFrequencyHz: number;
  readonly maxFrequencyHz: number;
  readonly maxBandwidthHz: number;
}

/**
 * Returns up to `maxFormants` formants sorted by ascending frequency.
 * `lpc` holds the predictor coefficients a_1..a_p from {@link levinsonDurbin}.
 */
export function extractFormants(lpc: Float32Array, options: FormantOptions): FormantData[] {
  const order = lpc.length;
  if (order === 0) {
    return [];
  }

  // A(z) = 1 - Σ a_m·z^-m. As a monic polynomial in z (descending powers):
  // z^p - a_1·z^(p-1) - … - a_p.
  const coeffs = new Float64Array(order + 1);
  coeffs[0] = 1;
  for (let m = 0; m < order; m++) {
    coeffs[m + 1] = -(lpc[m] ?? 0);
  }

  const roots = findRoots(coeffs);
  const { sampleRate } = options;
  const formants: FormantData[] = [];

  for (const root of roots) {
    // Keep one of each conjugate pair (upper half-plane).
    if (root.im < 0) {
      continue;
    }
    const magnitude = root.abs();
    if (magnitude <= 0 || magnitude >= 1) {
      continue;
    }
    const frequencyHz = (Math.atan2(root.im, root.re) * sampleRate) / (2 * Math.PI);
    const bandwidthHz = (-Math.log(magnitude) * sampleRate) / Math.PI;
    if (frequencyHz < options.minFrequencyHz || frequencyHz > options.maxFrequencyHz) {
      continue;
    }
    if (bandwidthHz > options.maxBandwidthHz) {
      continue;
    }
    formants.push({ frequencyHz, bandwidthHz });
  }

  formants.sort((a, b) => a.frequencyHz - b.frequencyHz);
  return formants.slice(0, options.maxFormants);
}

/**
 * Evaluates the LPC spectral envelope in dB over bins [0, N/2):
 * `H(e^jω) = gain / |A(e^jω)|²`, in dB. `reScratch`/`imScratch` are length-N
 * work buffers; `outDb.length` must be N/2.
 */
export function computeLpcEnvelope(
  fft: Fft,
  lpc: Float32Array,
  gain: number,
  reScratch: Float32Array,
  imScratch: Float32Array,
  outDb: Float32Array,
): void {
  reScratch.fill(0);
  imScratch.fill(0);
  reScratch[0] = 1;
  const order = lpc.length;
  for (let m = 0; m < order; m++) {
    reScratch[m + 1] = -(lpc[m] ?? 0);
  }

  fft.forward(reScratch, imScratch);

  const half = outDb.length;
  const safeGain = Math.max(gain, 1e-12);
  for (let k = 0; k < half; k++) {
    const ar = reScratch[k] ?? 0;
    const ai = imScratch[k] ?? 0;
    const magSquared = Math.max(ar * ar + ai * ai, 1e-20);
    outDb[k] = 10 * Math.log10(safeGain / magSquared);
  }
}
