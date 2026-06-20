/**
 * Autocorrelation.ts
 *
 * Direct (time-domain) autocorrelation. Used by LPC (lags 0..order) and by the
 * harmonics-to-noise ratio (longer lag range). For the small lag counts the
 * voice pipeline needs, the O(N·maxLag) direct form is faster and simpler than
 * an FFT-based one.
 */

/**
 * Fills `out[lag] = Σ signal[i]·signal[i-lag]` for lag in 0..maxLag.
 * `out.length` must be at least `maxLag + 1`. Pass `length` to analyze only the
 * first `length` samples of `signal` (e.g. a decimated frame stored in a larger
 * reusable buffer); it defaults to the full array. The accumulation is in double
 * precision; pass a `Float64Array` for `out` when the values feed a deep
 * recursion (LPC) that is sensitive to storage precision.
 */
export function autocorrelate(
  signal: Float32Array,
  maxLag: number,
  out: Float32Array | Float64Array,
  length: number = signal.length,
  normalize = false,
): void {
  const n = length;
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = lag; i < n; i++) {
      sum += (signal[i] ?? 0) * (signal[i - lag] ?? 0);
    }
    out[lag] = normalize && n > lag ? sum / (n - lag) : sum;
  }
}
