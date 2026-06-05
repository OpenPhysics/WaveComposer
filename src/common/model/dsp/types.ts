/**
 * types.ts
 *
 * Shared value types for the voice-analysis DSP core. These are plain data
 * interfaces with no SceneryStack dependencies so the whole `dsp/` folder stays
 * pure and unit-testable.
 */

/** A single formant: a resonance of the vocal tract. */
export interface FormantData {
  /** Centre frequency of the resonance, in Hz. */
  readonly frequencyHz: number;
  /** -3 dB bandwidth of the resonance, in Hz. Wider = more damped. */
  readonly bandwidthHz: number;
}

/** Result of a fundamental-frequency (F0) estimate for one frame. */
export interface PitchResult {
  /** Estimated fundamental frequency in Hz, or 0 when unvoiced/silent. */
  readonly frequencyHz: number;
  /** Periodicity confidence in [0, 1] (1 - YIN aperiodicity). */
  readonly confidence: number;
  /** Root-mean-square level of the analysed frame, in [0, ~1]. */
  readonly rms: number;
}
