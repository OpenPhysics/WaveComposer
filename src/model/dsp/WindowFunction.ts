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

/** Multiplies `signal` by `window` element-wise into `out` (may alias signal). */
export function applyWindow(signal: Float32Array, window: Float32Array, out: Float32Array): void {
  const n = signal.length;
  for (let i = 0; i < n; i++) {
    out[i] = (signal[i] ?? 0) * (window[i] ?? 0);
  }
}
