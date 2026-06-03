import { describe, expect, it } from "vitest";
import { generateWhiteNoise } from "../audio/SyntheticFrameSource.js";
import { autocorrelate } from "./Autocorrelation.js";
import { levinsonDurbin } from "./LinearPredictor.js";

/** Generates an AR(2) process x[n] = a1·x[n-1] + a2·x[n-2] + e[n]. */
function generateAr2(a1: number, a2: number, length: number): Float32Array {
  const excitation = generateWhiteNoise(length, 1, 9999);
  const out = new Float32Array(length);
  for (let n = 0; n < length; n++) {
    const prev1 = n >= 1 ? (out[n - 1] ?? 0) : 0;
    const prev2 = n >= 2 ? (out[n - 2] ?? 0) : 0;
    out[n] = a1 * prev1 + a2 * prev2 + (excitation[n] ?? 0);
  }
  return out;
}

describe("LinearPredictor (Levinson-Durbin)", () => {
  it("recovers the coefficients of a known AR(2) process", () => {
    const a1 = 0.5;
    const a2 = -0.3;
    const signal = generateAr2(a1, a2, 16384);
    const r = new Float32Array(3);
    autocorrelate(signal, 2, r);
    const lpc = levinsonDurbin(r, 2);

    expect(lpc.coefficients).toHaveLength(2);
    expect(lpc.coefficients[0]).toBeCloseTo(a1, 1);
    expect(lpc.coefficients[1]).toBeCloseTo(a2, 1);
    // Stable model → reflection coefficients strictly inside the unit circle.
    for (const k of lpc.reflection) {
      expect(Math.abs(k)).toBeLessThan(1);
    }
    expect(lpc.gain).toBeGreaterThan(0);
  });

  it("returns zero coefficients and zero gain for a silent frame", () => {
    const r = new Float32Array(5); // all zeros
    const lpc = levinsonDurbin(r, 4);
    expect(lpc.gain).toBe(0);
    for (const c of lpc.coefficients) {
      expect(c).toBe(0);
    }
  });
});
