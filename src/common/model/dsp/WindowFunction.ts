/**
 * WindowFunction.ts
 *
 * Analysis windows applied before the FFT to reduce spectral leakage.
 * Constants follow the standard definitions (see references/paul-spectrogram).
 *
 * No `enum` (TS6 `erasableSyntaxOnly`) — a `const … as const` object plus a
 * matching union type is used instead.
 */

export const WindowType = {
  HANN: "hann",
  HAMMING: "hamming",
  BLACKMAN: "blackman",
} as const;

export type WindowType = (typeof WindowType)[keyof typeof WindowType];

/** All selectable window types, handy for control UIs and validation. */
export const WINDOW_TYPE_VALUES: readonly WindowType[] = [WindowType.HANN, WindowType.HAMMING, WindowType.BLACKMAN];

/**
 * Builds a window of the given length. Called only when the FFT size or window
 * type changes, so allocation here is fine.
 */
export function createWindow(type: WindowType, length: number): Float32Array {
  const window = new Float32Array(length);
  if (length === 1) {
    window[0] = 1;
    return window;
  }
  const denom = length - 1;
  for (let n = 0; n < length; n++) {
    const x = (2 * Math.PI * n) / denom;
    let value: number;
    if (type === WindowType.HAMMING) {
      value = 0.53836 - 0.46164 * Math.cos(x);
    } else if (type === WindowType.BLACKMAN) {
      value = 0.42 - 0.5 * Math.cos(x) + 0.08 * Math.cos(2 * x);
    } else {
      value = 0.5 - 0.5 * Math.cos(x);
    }
    window[n] = value;
  }
  return window;
}

/**
 * Builds a Gaussian window of the given length, used only for the LPC/formant
 * branch — its smooth, low-leakage taper keeps the autocorrelation well-behaved.
 * `alpha` is the inverse of the standard deviation as a fraction of the half-
 * width (larger = narrower main lobe); the reference formant analyzer asks for
 * 2.5, which puts the endpoints near 0.044, matching MATLAB's `gausswin`.
 *
 * (The reference's own `gaussianWindow` in
 * references/in-formant/src/analysis/filter/filter.cpp is the "confined" Gaussian
 * variant, but its parameterization is degenerate at alpha = 2.5 — sigma ends up
 * far wider than the window — so we use the standard form it was clearly after.)
 */
export function createGaussianWindow(length: number, alpha: number): Float32Array {
  const window = new Float32Array(length);
  if (length === 1) {
    window[0] = 1;
    return window;
  }
  const half = (length - 1) / 2;
  for (let n = 0; n < length; n++) {
    const ratio = (alpha * (n - half)) / half;
    window[n] = Math.exp(-0.5 * ratio * ratio);
  }
  return window;
}

/** Multiplies `signal` by `window` element-wise into `out` (may alias signal). */
export function applyWindow(signal: Float32Array, window: Float32Array, out: Float32Array): void {
  const n = signal.length;
  for (let i = 0; i < n; i++) {
    out[i] = (signal[i] ?? 0) * (window[i] ?? 0);
  }
}
