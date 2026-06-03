/**
 * SignalUtils.ts
 *
 * Small, allocation-free time-domain helpers shared across the DSP pipeline.
 */

/** Root-mean-square level of a frame. */
export function rms(signal: Float32Array): number {
  const n = signal.length;
  if (n === 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const s = signal[i] ?? 0;
    sum += s * s;
  }
  return Math.sqrt(sum / n);
}

/**
 * First-order pre-emphasis high-pass: `y[n] = x[n] - alpha * x[n-1]`.
 * Boosts the high frequencies the vocal tract attenuates, which sharpens
 * formant peaks for LPC analysis. `out` may alias `signal`.
 */
export function preEmphasis(signal: Float32Array, alpha: number, out: Float32Array): void {
  const n = signal.length;
  // Walk backwards so an in-place call (out === signal) reads x[n-1] before it
  // is overwritten.
  for (let i = n - 1; i > 0; i--) {
    out[i] = (signal[i] ?? 0) - alpha * (signal[i - 1] ?? 0);
  }
  out[0] = signal[0] ?? 0;
}
