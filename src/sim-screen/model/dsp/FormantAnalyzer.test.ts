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
  maxBandwidthHz: 600,
};

/** Predictor coefficients of a single 2nd-order resonator at (freq, r). */
function resonatorLpc(freq: number, r: number): Float32Array {
  const theta = (2 * Math.PI * freq) / SAMPLE_RATE;
  // A(z) = 1 - 2r·cosθ·z^-1 + r^2·z^-2 → predictor a = [2r·cosθ, -r^2].
  return Float32Array.from([2 * r * Math.cos(theta), -(r * r)]);
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

  it("recovers two formants from a cascade of resonators", () => {
    // A(z) = A1(z)·A2(z); predictor coeffs are −(A coefficients) for m ≥ 1.
    const theta1 = (2 * Math.PI * 700) / SAMPLE_RATE;
    const theta2 = (2 * Math.PI * 1800) / SAMPLE_RATE;
    const r1 = 0.98;
    const r2 = 0.97;
    const a1 = [1, -2 * r1 * Math.cos(theta1), r1 * r1];
    const a2 = [1, -2 * r2 * Math.cos(theta2), r2 * r2];
    const product = convolve(a1, a2); // degree-4 polynomial [1, c1..c4]
    const lpc = Float32Array.from(product.slice(1).map((c) => -c));

    const formants = extractFormants(lpc, options);
    expect(nearest(formants, 700)?.frequencyHz).toBeCloseTo(700, 0);
    expect(nearest(formants, 1800)?.frequencyHz).toBeCloseTo(1800, 0);
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
});
