/**
 * AudioFrameSource.ts
 *
 * The abstraction the model analyzes through. Keeping the analyzer behind this
 * interface means the live microphone and the synthetic/test generators are
 * interchangeable, and the DSP can be unit-tested without any Web Audio APIs.
 */
export interface AudioFrameSource {
  /** Sample rate of the delivered frames, in Hz. */
  readonly sampleRate: number;

  /** Whether the source is currently producing frames. */
  readonly isActive: boolean;

  /**
   * Writes the most recent time-domain frame into `out` (length = analysis FFT
   * size). Returns true when fresh samples were written, false otherwise.
   */
  getFrame(out: Float32Array): boolean;
}
