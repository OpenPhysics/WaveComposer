/**
 * FormantAnalyzer.ts
 *
 * Extracts formants from LPC coefficients and evaluates the LPC spectral
 * envelope. Ported from references/in-formant/src/analysis/formant/filteredlp.cpp
 * (the "Filtered" solver, in-formant's default — stronger than the plain
 * simplelp.cpp this file used to mirror).
 *
 * Each conjugate-pole pair of the analysis filter A(z) = 1 - Σ a_m·z^-m maps to
 * a resonance: a root r·e^{jφ} gives frequency = φ·fs/2π and bandwidth =
 * -ln(r)·fs/π. Poles too far inside the unit circle (over-damped) or outside the
 * frequency band are discarded.
 *
 * Beyond that first pass, FilteredLP adds a *merged-peak recovery* step: when two
 * formants sit closer together than the LPC order can resolve, they can collapse
 * into a single visible pole, leaving a suspicious gap to the next formant. The
 * reference detects this with a stochastic argument-principle (Cauchy) integral
 * plus a randomly-seeded Aberth root solve and k-means clustering. We reach the
 * same result deterministically: a real polynomial of degree p already has all p
 * roots, so we simply inspect the roots the solver found inside the suspect
 * angular sector. This is reproducible (no RNG) and therefore unit-testable,
 * which matters more here than transcribing the RNG machinery verbatim.
 *
 * `sampleRate` here is the *analysis* rate the LPC was computed at (the decimated
 * formant rate, ~11 kHz), not the capture rate — see VoiceAnalyzer.
 */

import type { Complex } from "./Complex.js";
import type { Fft } from "./Fft.js";
import { findRoots } from "./PolynomialRootFinder.js";
import type { FormantData } from "./types.js";

export interface FormantOptions {
  /** Rate the LPC coefficients were computed at, in Hz (the decimated rate). */
  readonly sampleRate: number;
  readonly maxFormants: number;
  readonly minFrequencyHz: number;
  readonly maxFrequencyHz: number;
  /** Minimum pole magnitude to accept (closer to 1 = sharper). Default 0.6. */
  readonly minRadius?: number;
}

/** FilteredLP's default pole-magnitude floor (filteredlp.cpp uses r >= 0.6). */
const DEFAULT_MIN_RADIUS = 0.6;
/** A gap larger than this (Hz) between adjacent poles may hide a merged formant. */
const MERGE_GAP_HZ = 700;
/** The lowest pole only counts as "merged" if the next one sits above this (Hz). */
const MERGE_FIRST_GAP_HZ = 1800;
/** Lower angular guard when probing a sector, in Hz (filteredlp.cpp). */
const SECTOR_MIN_HZ = 200;
/** Roots below this magnitude are ignored when counting a sector's poles. */
const SECTOR_MIN_RADIUS = 0.5;
/** Formants within this many Hz of each other are collapsed (de-duplication). */
const MERGE_TOLERANCE_HZ = 20;
/** dB assigned to envelope bins above the analysis Nyquist (below the view floor). */
const ENVELOPE_OUT_OF_BAND_DB = -120;

/** The magnitude/frequency window a pole must fall in to count as a formant. */
interface Band {
  readonly sampleRate: number;
  readonly minRadius: number;
  readonly minFrequencyHz: number;
  readonly maxFrequencyHz: number;
}

interface PickedRoot {
  readonly frequencyHz: number;
  readonly bandwidthHz: number;
  readonly re: number;
  readonly im: number;
}

function frequencyOf(root: Complex, sampleRate: number): number {
  return (Math.atan2(root.im, root.re) * sampleRate) / (2 * Math.PI);
}

function bandwidthOf(magnitude: number, sampleRate: number): number {
  return (-Math.log(magnitude) * sampleRate) / Math.PI;
}

/** A pole as a formant, or null if it is over-damped or out of band. */
function toFormant(root: Complex, band: Band): FormantData | null {
  const magnitude = root.abs();
  if (magnitude < band.minRadius || magnitude >= 1) {
    return null;
  }
  const frequencyHz = frequencyOf(root, band.sampleRate);
  if (frequencyHz < band.minFrequencyHz || frequencyHz > band.maxFrequencyHz) {
    return null;
  }
  return { frequencyHz, bandwidthHz: bandwidthOf(magnitude, band.sampleRate) };
}

/** Upper-half-plane poles inside the band, sorted by ascending frequency. */
function pickPoles(roots: readonly Complex[], band: Band): PickedRoot[] {
  const picked: PickedRoot[] = [];
  for (const root of roots) {
    if (root.im < 0) {
      continue;
    }
    const formant = toFormant(root, band);
    if (formant) {
      picked.push({ ...formant, re: root.re, im: root.im });
    }
  }
  picked.sort((a, b) => a.frequencyHz - b.frequencyHz);
  return picked;
}

/** All poles (|z| >= 0.5) in the angular sector around a suspect merged peak. */
function rootsInSector(roots: readonly Complex[], suspect: PickedRoot, sampleRate: number): Complex[] {
  const phiPeak = Math.atan2(suspect.im, suspect.re);
  const sectorHalfRad = (2 * Math.PI * MERGE_GAP_HZ) / sampleRate;
  const phiLow = Math.max(phiPeak - sectorHalfRad, (2 * Math.PI * SECTOR_MIN_HZ) / sampleRate);
  const phiHigh = phiPeak + sectorHalfRad;

  const inSector: Complex[] = [];
  for (const root of roots) {
    if (root.im < 0 || root.abs() < SECTOR_MIN_RADIUS) {
      continue;
    }
    const phi = Math.atan2(root.im, root.re);
    if (phi >= phiLow && phi <= phiHigh) {
      inSector.push(root);
    }
  }
  return inSector;
}

/**
 * Returns up to `maxFormants` formants sorted by ascending frequency.
 * `lpc` holds the predictor coefficients a_1..a_p from {@link levinsonDurbin}.
 */
export function extractFormants(lpc: Float32Array | Float64Array, options: FormantOptions): FormantData[] {
  const order = lpc.length;
  if (order === 0) {
    return [];
  }

  // A(z) = 1 - Σ a_m·z^-m. As a monic polynomial in z (descending powers):
  // z^p - a_1·z^(p-1) - … - a_p. Its roots are the synthesis-filter poles.
  const coeffs = new Float64Array(order + 1);
  coeffs[0] = 1;
  for (let m = 0; m < order; m++) {
    coeffs[m + 1] = -(lpc[m] ?? 0);
  }
  const roots = findRoots(coeffs);

  const band: Band = {
    sampleRate: options.sampleRate,
    minRadius: options.minRadius ?? DEFAULT_MIN_RADIUS,
    minFrequencyHz: options.minFrequencyHz,
    maxFrequencyHz: Math.min(options.maxFrequencyHz, options.sampleRate / 2),
  };

  const picked = pickPoles(roots, band);

  // A wide gap after a peak may mean an adjacent formant merged into it. Defer
  // those peaks; everything else is a formant outright.
  const formants: FormantData[] = [];
  const suspects: PickedRoot[] = [];
  for (let i = 0; i < picked.length; i++) {
    const current = picked[i];
    const next = picked[i + 1];
    if (!current) {
      continue;
    }
    const isMerged =
      !!next &&
      next.frequencyHz - current.frequencyHz > MERGE_GAP_HZ &&
      (i > 0 || next.frequencyHz > MERGE_FIRST_GAP_HZ);
    if (isMerged) {
      suspects.push(current);
    } else {
      formants.push({ frequencyHz: current.frequencyHz, bandwidthHz: current.bandwidthHz });
    }
  }

  // Recover merged peaks: two or more poles in the suspect's angular sector means
  // the single visible peak actually hid multiple resonances.
  for (const suspect of suspects) {
    const inSector = rootsInSector(roots, suspect, band.sampleRate);
    if (inSector.length >= 2) {
      for (const root of inSector) {
        const formant = toFormant(root, band);
        if (formant) {
          formants.push(formant);
        }
      }
    } else {
      formants.push({ frequencyHz: suspect.frequencyHz, bandwidthHz: suspect.bandwidthHz });
    }
  }

  formants.sort((a, b) => a.frequencyHz - b.frequencyHz);
  return dedupe(formants).slice(0, options.maxFormants);
}

/** Collapses near-coincident formants (keeping the sharper one) after recovery. */
function dedupe(formants: FormantData[]): FormantData[] {
  const result: FormantData[] = [];
  for (const formant of formants) {
    const last = result[result.length - 1];
    if (last && formant.frequencyHz - last.frequencyHz < MERGE_TOLERANCE_HZ) {
      if (formant.bandwidthHz < last.bandwidthHz) {
        result[result.length - 1] = formant;
      }
    } else {
      result.push(formant);
    }
  }
  return result;
}

/**
 * Evaluates the LPC spectral envelope in dB over bins [0, N/2):
 * `H(e^jω) = gain / |A(e^jω)|²`, in dB. `reScratch`/`imScratch` are length-N
 * work buffers; `outDb.length` must be N/2.
 *
 * When the LPC was computed at a decimated rate, pass `decimation` = the integer
 * factor so display bin k (full-rate frequency k·fs/N) reads the analysis-rate
 * angle it actually corresponds to (FFT bin k·decimation). Bins above the
 * decimated Nyquist carry no envelope information and are floored.
 */
export function computeLpcEnvelope(
  fft: Fft,
  lpc: Float32Array | Float64Array,
  gain: number,
  reScratch: Float32Array,
  imScratch: Float32Array,
  outDb: Float32Array,
  decimation: number = 1,
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
  const nyquistBin = reScratch.length >> 1;
  const factor = Math.max(1, Math.floor(decimation));
  const safeGain = Math.max(gain, 1e-12);
  for (let k = 0; k < half; k++) {
    const bin = k * factor;
    if (bin > nyquistBin) {
      outDb[k] = ENVELOPE_OUT_OF_BAND_DB;
      continue;
    }
    const ar = reScratch[bin] ?? 0;
    const ai = imScratch[bin] ?? 0;
    const magSquared = Math.max(ar * ar + ai * ai, 1e-20);
    outDb[k] = 10 * Math.log10(safeGain / magSquared);
  }
}
