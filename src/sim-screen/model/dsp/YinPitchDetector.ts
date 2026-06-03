/**
 * YinPitchDetector.ts
 *
 * Fundamental-frequency (F0) estimation via the YIN algorithm.
 * Ported from references/vocal-pitch-monitor/src/engine/AudioEngine.ts, with an
 * added F0 search-range restriction so sub-harmonics outside the configured
 * band are not selected.
 *
 * Pipeline: RMS silence gate → difference function → cumulative mean normalized
 * difference (CMND) → absolute-threshold valley → parabolic interpolation. Each
 * stage is a small helper run once per frame.
 */
import { rms } from "./SignalUtils.js";
import type { PitchResult } from "./types.js";

export interface PitchOptions {
  readonly sampleRate: number;
  readonly minFrequencyHz: number;
  readonly maxFrequencyHz: number;
  /** CMND acceptance threshold (YIN default 0.15). Lower = stricter. */
  readonly threshold: number;
  /** RMS below this is treated as silence (unvoiced). */
  readonly silenceThreshold: number;
}

/** Above this CMND minimum, even the best lag is deemed unvoiced. */
const APERIODICITY_REJECT = 0.8;

export class YinPitchDetector {
  private yinBuffer: Float32Array;

  public constructor(bufferSize: number) {
    this.yinBuffer = new Float32Array(bufferSize >> 1);
  }

  /** Resizes the internal scratch buffer when the analysis frame size changes. */
  public setBufferSize(bufferSize: number): void {
    const half = bufferSize >> 1;
    if (this.yinBuffer.length !== half) {
      this.yinBuffer = new Float32Array(half);
    }
  }

  public detect(signal: Float32Array, options: PitchOptions): PitchResult {
    const half = signal.length >> 1;
    const rmsLevel = rms(signal);
    if (rmsLevel < options.silenceThreshold) {
      return { frequencyHz: 0, confidence: 0, rms: rmsLevel };
    }

    const tauMin = Math.max(2, Math.floor(options.sampleRate / options.maxFrequencyHz));
    const tauMax = Math.min(half - 1, Math.ceil(options.sampleRate / options.minFrequencyHz));
    if (tauMax <= tauMin) {
      return { frequencyHz: 0, confidence: 0, rms: rmsLevel };
    }

    this.differenceFunction(signal, half);
    this.cumulativeMeanNormalize(half);

    let tau = this.thresholdLag(options.threshold, tauMin, tauMax);
    let aperiodicity: number;
    if (tau < 0) {
      const minimum = this.globalMinimum(tauMin, tauMax);
      if (minimum.tau < 0 || minimum.value > APERIODICITY_REJECT) {
        return { frequencyHz: 0, confidence: 0, rms: rmsLevel };
      }
      tau = minimum.tau;
      aperiodicity = minimum.value;
    } else {
      aperiodicity = this.yinBuffer[tau] ?? 1;
    }

    const frequencyHz = options.sampleRate / this.refineLag(tau, half);
    if (frequencyHz < options.minFrequencyHz || frequencyHz > options.maxFrequencyHz) {
      return { frequencyHz: 0, confidence: 0, rms: rmsLevel };
    }
    return { frequencyHz, confidence: Math.max(0, Math.min(1, 1 - aperiodicity)), rms: rmsLevel };
  }

  /** Squared difference function d[τ] = Σ (x[i] − x[i+τ])². */
  private differenceFunction(signal: Float32Array, half: number): void {
    const yin = this.yinBuffer;
    for (let tau = 0; tau < half; tau++) {
      let sum = 0;
      for (let i = 0; i < half; i++) {
        const delta = (signal[i] ?? 0) - (signal[i + tau] ?? 0);
        sum += delta * delta;
      }
      yin[tau] = sum;
    }
  }

  /** Cumulative mean normalized difference, in place over the YIN buffer. */
  private cumulativeMeanNormalize(half: number): void {
    const yin = this.yinBuffer;
    yin[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < half; tau++) {
      runningSum += yin[tau] ?? 0;
      yin[tau] = runningSum > 0 ? (yin[tau] ?? 0) * (tau / runningSum) : 1;
    }
  }

  /** First lag below `threshold` (valley-followed) within the band, or -1. */
  private thresholdLag(threshold: number, tauMin: number, tauMax: number): number {
    const yin = this.yinBuffer;
    for (let t = tauMin; t <= tauMax; t++) {
      if ((yin[t] ?? 1) < threshold) {
        let best = t;
        while (best + 1 <= tauMax && (yin[best + 1] ?? 1) < (yin[best] ?? 1)) {
          best++;
        }
        return best;
      }
    }
    return -1;
  }

  /** Global CMND minimum within the band (fallback when nothing crosses). */
  private globalMinimum(tauMin: number, tauMax: number): { tau: number; value: number } {
    const yin = this.yinBuffer;
    let tau = -1;
    let value = Number.POSITIVE_INFINITY;
    for (let t = tauMin; t <= tauMax; t++) {
      const v = yin[t] ?? Number.POSITIVE_INFINITY;
      if (v < value) {
        value = v;
        tau = t;
      }
    }
    return { tau, value };
  }

  /** Parabolic interpolation around `tau` for sub-sample lag accuracy. */
  private refineLag(tau: number, half: number): number {
    if (tau <= 0 || tau >= half - 1) {
      return tau;
    }
    const yin = this.yinBuffer;
    const x0 = yin[tau - 1] ?? 0;
    const x1 = yin[tau] ?? 0;
    const x2 = yin[tau + 1] ?? 0;
    const a = (x0 - 2 * x1 + x2) / 2;
    const b = (x2 - x0) / 2;
    return a !== 0 ? tau - b / (2 * a) : tau;
  }
}
