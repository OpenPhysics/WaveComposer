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

/**
 * An {@link AudioFrameSource} that can be started and stopped on demand and
 * keeps its internal FFT size in sync with the analyzer.
 *
 * The {@link isPlayable} discriminant lets {@link isPlayableSource} distinguish
 * these sources from {@link MicrophoneInput}, which has similar methods but
 * different lifecycle semantics (explicit user gesture, permission prompt).
 */
export interface PlayableAudioSource extends AudioFrameSource {
  readonly isPlayable: true;
  start(): Promise<void>;
  stop(): void;
  setFftSize(fftSize: number): void;
}

/** Type guard for sources that participate in the generic start/stop/setFftSize dispatch. */
export function isPlayableSource(source: AudioFrameSource): source is PlayableAudioSource {
  return "isPlayable" in source && (source as { isPlayable: unknown }).isPlayable === true;
}
