import { describe, expect, it } from "vitest";
import { applyWindow, createWindow, WINDOW_TYPE_VALUES, WindowType } from "./WindowFunction.js";

describe("WindowFunction", () => {
  it("exposes the three selectable window types", () => {
    expect(WINDOW_TYPE_VALUES).toHaveLength(3);
    expect(WINDOW_TYPE_VALUES).toContain(WindowType.HANN);
    expect(WINDOW_TYPE_VALUES).toContain(WindowType.HAMMING);
    expect(WINDOW_TYPE_VALUES).toContain(WindowType.BLACKMAN);
  });

  it("builds a symmetric Hann window with zero endpoints and unity centre", () => {
    const n = 17; // odd length → the peak lands exactly on the centre sample
    const w = createWindow(WindowType.HANN, n);
    expect(w[0]).toBeCloseTo(0, 6);
    expect(w[n - 1]).toBeCloseTo(0, 6);
    expect(w[(n - 1) / 2]).toBeCloseTo(1, 6);
    for (let i = 0; i < (n - 1) / 2; i++) {
      expect(w[i]).toBeCloseTo(w[n - 1 - i] ?? 0, 6);
    }
  });

  it("uses the Hamming pedestal (~0.08) at the endpoints", () => {
    const w = createWindow(WindowType.HAMMING, 32);
    expect(w[0]).toBeCloseTo(0.07672, 4);
  });

  it("applies a window element-wise", () => {
    const signal = new Float32Array([1, 1, 1, 1]);
    const window = new Float32Array([0, 0.5, 0.5, 0]);
    const out = new Float32Array(4);
    applyWindow(signal, window, out);
    expect(Array.from(out)).toEqual([0, 0.5, 0.5, 0]);
  });
});
