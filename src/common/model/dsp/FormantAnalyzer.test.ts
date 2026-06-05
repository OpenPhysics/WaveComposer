import { describe, expect, it } from "vitest";
import { Fft } from "./Fft.js";
import { computeLpcEnvelope, extractFormants, type FormantOptions } from "./FormantAnalyzer.js";
import type { FormantData } from "./types.js";

const SAMPLE_RATE = 44100;

const options: FormantOptions = {
  sampleRate: SAMPLE_RATE,
  maxFormants: 5,
  minFrequencyHz: 90,
  maxFrequencyHz: 5000,
  minRadius: 0.6,
};

/** Predictor coefficients of a single 2nd-order resonator at (freq, r). */
function resonatorLpc(freq: number, r: number): Float64Array {
  const theta = (2 * Math.PI * freq) / SAMPLE_RATE;
  // A(z) = 1 - 2r·cosθ·z^-1 + r^2·z^-2 → predictor a = [2r·cosθ, -r^2].
  return Float64Array.from([2 * r * Math.cos(theta), -(r * r)]);
}

/** Real polynomial convolution. */
function convolve(a: number[], b: number[]): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      out[i + j] = (out[i + j] ?? 0) + (a[i] ?? 0) * (b[j] ?? 0);
    }
  }
  return out;
}

function nearest(formants: readonly FormantData[], targetHz: number): FormantData | undefined {
  let best: FormantData | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const f of formants) {
    const d = Math.abs(f.frequencyHz - targetHz);
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return best;
}

describe("FormantAnalyzer", () => {
  it("recovers a single resonator's frequency and bandwidth", () => {
    const r = 0.99;
    const freq = 1000;
    const formants = extractFormants(resonatorLpc(freq, r), options);
    expect(formants.length).toBeGreaterThanOrEqual(1);
    const f1 = formants[0];
    expect(f1?.frequencyHz).toBeCloseTo(freq, 0);
    expect(f1?.bandwidthHz).toBeCloseTo((-Math.log(r) * SAMPLE_RATE) / Math.PI, 0);
  });

  /** Predictor coefficients of a cascade of 2nd-order resonators at the given peaks. */
  function cascadeLpc(peaks: ReadonlyArray<readonly [number, number]>): Float64Array {
    let poly = [1];
    for (const [freq, r] of peaks) {
      const theta = (2 * Math.PI * freq) / SAMPLE_RATE;
      poly = convolve(poly, [1, -2 * r * Math.cos(theta), r * r]);
    }
    // A(z) = Π A_i(z); predictor coeffs are −(A coefficients) for m ≥ 1.
    return Float64Array.from(poly.slice(1).map((c) => -c));
  }

  it("recovers two formants from a cascade of resonators", () => {
    const formants = extractFormants(
      cascadeLpc([
        [700, 0.98],
        [1800, 0.97],
      ]),
      options,
    );
    expect(nearest(formants, 700)?.frequencyHz).toBeCloseTo(700, 0);
    expect(nearest(formants, 1800)?.frequencyHz).toBeCloseTo(1800, 0);
  });

  it("recovers a three-formant /a/-like vowel", () => {
    const formants = extractFormants(
      cascadeLpc([
        [730, 0.97],
        [1090, 0.96],
        [2440, 0.95],
      ]),
      options,
    );
    expect(nearest(formants, 730)?.frequencyHz).toBeCloseTo(730, 0);
    expect(nearest(formants, 1090)?.frequencyHz).toBeCloseTo(1090, 0);
    expect(nearest(formants, 2440)?.frequencyHz).toBeCloseTo(2440, 0);
  });

  it("does not duplicate a formant across a wide spectral gap", () => {
    // A large gap between two resonances must not spawn a spurious extra peak.
    const formants = extractFormants(
      cascadeLpc([
        [500, 0.97],
        [2800, 0.96],
      ]),
      options,
    );
    expect(formants).toHaveLength(2);
    expect(nearest(formants, 500)?.frequencyHz).toBeCloseTo(500, 0);
    expect(nearest(formants, 2800)?.frequencyHz).toBeCloseTo(2800, 0);
  });

  it("rejects over-damped poles below the magnitude floor", () => {
    // r = 0.5 is below the default 0.6 floor → not a formant.
    expect(extractFormants(resonatorLpc(1500, 0.5), options)).toHaveLength(0);
    expect(extractFormants(resonatorLpc(1500, 0.95), options).length).toBeGreaterThanOrEqual(1);
  });

  it("evaluates an LPC envelope that peaks at the resonance", () => {
    const n = 1024;
    const half = n >> 1;
    const fft = new Fft(n);
    const freq = 1000;
    const lpc = resonatorLpc(freq, 0.99);
    const reScratch = new Float32Array(n);
    const imScratch = new Float32Array(n);
    const envelopeDb = new Float32Array(half);
    computeLpcEnvelope(fft, lpc, 1, reScratch, imScratch, envelopeDb);

    let peakBin = 0;
    let peakValue = Number.NEGATIVE_INFINITY;
    for (let k = 0; k < half; k++) {
      const v = envelopeDb[k] ?? 0;
      if (v > peakValue) {
        peakValue = v;
        peakBin = k;
      }
    }
    const expectedBin = (freq * n) / SAMPLE_RATE;
    expect(Math.abs(peakBin - expectedBin)).toBeLessThanOrEqual(2);
  });

  it("maps a decimated-rate envelope onto the full-rate display bins", () => {
    // LPC computed at fsLpc = 44100/4; the envelope must peak at the full-rate
    // bin for the resonance (display bin k = freq·N/fs).
    const n = 2048;
    const half = n >> 1;
    const decimation = 4;
    const fsLpc = SAMPLE_RATE / decimation;
    const fft = new Fft(n);
    const freq = 1500;
    const theta = (2 * Math.PI * freq) / fsLpc;
    const lpc = Float32Array.from([2 * 0.97 * Math.cos(theta), -(0.97 * 0.97)]);
    const reScratch = new Float32Array(n);
    const imScratch = new Float32Array(n);
    const envelopeDb = new Float32Array(half);
    computeLpcEnvelope(fft, lpc, 1, reScratch, imScratch, envelopeDb, decimation);

    let peakBin = 0;
    let peakValue = Number.NEGATIVE_INFINITY;
    for (let k = 0; k < half; k++) {
      const v = envelopeDb[k] ?? 0;
      if (v > peakValue) {
        peakValue = v;
        peakBin = k;
      }
    }
    const expectedBin = (freq * n) / SAMPLE_RATE;
    expect(Math.abs(peakBin - expectedBin)).toBeLessThanOrEqual(2);
  });
});
