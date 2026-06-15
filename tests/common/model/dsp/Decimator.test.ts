import { describe, expect, it } from "vitest";
import { Decimator } from "../../../../src/common/model/dsp/Decimator.js";

/** RMS over the first `length` samples of `buffer`. */
function rms(buffer: Float32Array, length: number): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const v = buffer[i] ?? 0;
    sum += v * v;
  }
  return Math.sqrt(sum / length);
}

/** A unit-amplitude sine at `freq` cycles/sample. */
function sine(length: number, freq: number): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = Math.sin(2 * Math.PI * freq * i);
  }
  return out;
}

describe("Decimator", () => {
  it("passes the signal through unchanged at factor 1", () => {
    const d = new Decimator(1);
    expect(d.factor).toBe(1);
    const input = sine(64, 0.1);
    const out = new Float32Array(64);
    const m = d.process(input, out);
    expect(m).toBe(64);
    expect(Array.from(out)).toEqual(Array.from(input));
  });

  it("reports the decimated output length", () => {
    expect(new Decimator(4).outputLength(2048)).toBe(512);
    expect(new Decimator(3).outputLength(1000)).toBe(333);
  });

  it("preserves a DC offset (unity passband gain)", () => {
    const d = new Decimator(4);
    const input = new Float32Array(2048).fill(0.5);
    const out = new Float32Array(512);
    const m = d.process(input, out);
    // Interior samples (clear of the FIR edge transient) sit at the input level.
    expect(out[m >> 1]).toBeCloseTo(0.5, 3);
  });

  it("keeps a tone below the new Nyquist but rejects one above it", () => {
    const d = new Decimator(4); // decimated Nyquist = 0.125 cycles/sample
    const n = 4096;
    const out = new Float32Array(1024);

    const lowM = d.process(sine(n, 0.05), out);
    const lowRms = rms(out, lowM);

    const highM = d.process(sine(n, 0.2), out);
    const highRms = rms(out, highM);

    // The in-band tone keeps most of its energy; the out-of-band tone is killed.
    expect(lowRms).toBeGreaterThan(0.6);
    expect(highRms).toBeLessThan(0.05);
  });
});
