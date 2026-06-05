/**
 * VoiceQuality.ts
 *
 * Voice-quality measures derived from the cepstrum and autocorrelation:
 *   - real cepstrum: IFFT(log|FFT(x)|)
 *   - Cepstral Peak Prominence (CPP): height of the cepstral peak above a
 *     regression line through the cepstrum, a robust clarity/periodicity measure
 *   - Harmonics-to-Noise Ratio (HNR): from the normalized autocorrelation peak
 *     (a simplified Boersma estimate)
 */
import type { Fft } from "./Fft.js";

const LOG_EPSILON = 1e-12;
/** Converts natural-log cepstral units to a decibel-like scale (20/ln 10). */
const NEPER_TO_DB = 20 / Math.LN10;

/**
 * Computes the real cepstrum in place: on input `re` holds the (windowed) time
 * signal and `im` is scratch; on output `re` holds the real cepstrum. Both
 * buffers have length N (the FFT size).
 */
export function computeRealCepstrum(fft: Fft, re: Float32Array, im: Float32Array): void {
  const n = re.length;
  im.fill(0);
  fft.forward(re, im);
  for (let k = 0; k < n; k++) {
    const magnitude = Math.hypot(re[k] ?? 0, im[k] ?? 0);
    re[k] = Math.log(magnitude + LOG_EPSILON);
    im[k] = 0;
  }
  fft.inverse(re, im);
}

/**
 * Cepstral Peak Prominence (dB-like). Searches the quefrency band that
 * corresponds to [minF0, maxF0] for the cepstral peak, fits a least-squares
 * line across that band, and returns peak − line at the peak's quefrency.
 * Periodic voicing yields a high value; noise yields a low one.
 */
export function cepstralPeakProminence(
  cepstrum: Float32Array,
  sampleRate: number,
  minF0Hz: number,
  maxF0Hz: number,
): number {
  const maxQuefrency = cepstrum.length >> 1;
  const qMin = Math.max(2, Math.floor(sampleRate / maxF0Hz));
  const qMax = Math.min(maxQuefrency - 1, Math.ceil(sampleRate / minF0Hz));
  if (qMax <= qMin) {
    return 0;
  }

  // Least-squares line fit (value vs quefrency index) over [qMin, qMax].
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXy = 0;
  let sumXx = 0;
  let peakValue = Number.NEGATIVE_INFINITY;
  let peakIndex = qMin;
  for (let q = qMin; q <= qMax; q++) {
    const value = cepstrum[q] ?? 0;
    sumX += q;
    sumY += value;
    sumXy += q * value;
    sumXx += q * q;
    count++;
    if (value > peakValue) {
      peakValue = value;
      peakIndex = q;
    }
  }

  const denom = count * sumXx - sumX * sumX;
  let slope = 0;
  let intercept = sumY / count;
  if (denom !== 0) {
    slope = (count * sumXy - sumX * sumY) / denom;
    intercept = (sumY - slope * sumX) / count;
  }
  const lineAtPeak = slope * peakIndex + intercept;
  return Math.max(0, (peakValue - lineAtPeak) * NEPER_TO_DB);
}

/**
 * Harmonics-to-Noise Ratio in dB from a (non-normalized) autocorrelation
 * sequence. Finds the largest normalized peak r[τ]/r[0] within the F0 lag band
 * and returns 10·log10(rn / (1 − rn)). Returns 0 for unvoiced/degenerate input.
 * `autocorr.length` must cover τ up to sampleRate / minF0Hz.
 */
export function harmonicToNoiseRatio(
  autocorr: Float32Array,
  sampleRate: number,
  minF0Hz: number,
  maxF0Hz: number,
): number {
  const r0 = autocorr[0] ?? 0;
  if (r0 <= 0) {
    return 0;
  }
  const tauMin = Math.max(1, Math.floor(sampleRate / maxF0Hz));
  const tauMax = Math.min(autocorr.length - 1, Math.ceil(sampleRate / minF0Hz));
  if (tauMax <= tauMin) {
    return 0;
  }

  let peak = 0;
  for (let tau = tauMin; tau <= tauMax; tau++) {
    const rn = (autocorr[tau] ?? 0) / r0;
    if (rn > peak) {
      peak = rn;
    }
  }

  if (peak <= 0) {
    return 0;
  }
  // Clamp below 1 so the ratio stays finite for near-perfectly-periodic frames.
  const clamped = Math.min(peak, 0.999999);
  return 10 * Math.log10(clamped / (1 - clamped));
}
