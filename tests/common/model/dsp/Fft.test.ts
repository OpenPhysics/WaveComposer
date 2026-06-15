import { describe, expect, it } from "vitest";
import { Fft } from "../../../../src/common/model/dsp/Fft.js";

function argmax(array: Float32Array): number {
  let best = 0;
  let bestValue = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < array.length; i++) {
    const v = array[i] ?? 0;
    if (v > bestValue) {
      bestValue = v;
      best = i;
    }
  }
  return best;
}

describe("Fft", () => {
  it("rejects non-power-of-two sizes", () => {
    expect(() => new Fft(48)).toThrow();
    expect(() => new Fft(1)).toThrow();
  });

  it("puts a sinusoid's power in the matching bin", () => {
    const n = 64;
    const cycles = 8; // integer cycles per window → energy lands exactly on bin 8
    const signal = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      signal[i] = Math.sin((2 * Math.PI * cycles * i) / n);
    }
    const power = new Fft(n).powerSpectrum(signal);
    expect(power).toHaveLength(n / 2);
    expect(argmax(power)).toBe(cycles);
  });

  it("inverse(forward(x)) reconstructs the original signal", () => {
    const n = 64;
    const original = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      original[i] = Math.sin(i * 0.3) + 0.5 * Math.cos(i * 0.11);
    }
    const re = Float32Array.from(original);
    const im = new Float32Array(n);
    const fft = new Fft(n);
    fft.forward(re, im);
    fft.inverse(re, im);
    for (let i = 0; i < n; i++) {
      expect(re[i]).toBeCloseTo(original[i] ?? 0, 3);
      expect(im[i]).toBeCloseTo(0, 3);
    }
  });
});
