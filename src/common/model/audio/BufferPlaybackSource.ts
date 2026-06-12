/**
 * BufferPlaybackSource.ts
 *
 * Shared base for {@link AudioFrameSource}s that loop a decoded {@link AudioBuffer}
 * through an {@link AnalyserNode}: a bundled clip ({@link AudioFileFrameSource}) or
 * an in-memory microphone recording ({@link RecordedAudioSource}). Each `getFrame`
 * taps the current time-domain window — exactly the path {@link MicrophoneInput}
 * uses — so the buffer plays at real time. When monitoring is enabled the same
 * signal is routed to a {@link GainNode} connected to `destination`.
 *
 * All buffer sources share one {@link AudioContext} (see {@link SharedAudioContext})
 * so cycling through many presets never exhausts the browser's per-page budget.
 * Subclasses only provide the buffer via {@link resolveBuffer}.
 */
import type { AudioFrameSource } from "./AudioFrameSource.js";
import type { MonitoredAudioSource } from "./MonitoredAudioSource.js";
import { getSharedSampleRate, resumeSharedAudioContext } from "./SharedAudioContext.js";

export abstract class BufferPlaybackSource implements AudioFrameSource, MonitoredAudioSource {
  private fftSize: number;
  protected buffer: AudioBuffer | null = null;
  private bufferPromise: Promise<AudioBuffer | null> | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private monitoringEnabled = true;
  // AnalyserNode requires an ArrayBuffer-backed view; copied into the caller's
  // buffer (which may be ArrayBufferLike) in getFrame.
  private timeBuffer: Float32Array<ArrayBuffer>;

  protected constructor(fftSize: number) {
    this.fftSize = fftSize;
    this.timeBuffer = new Float32Array(fftSize);
  }

  public get sampleRate(): number {
    return getSharedSampleRate();
  }

  public get isActive(): boolean {
    return this.sourceNode !== null;
  }

  /**
   * Resolves the buffer to loop (fetched + decoded, generated, or recorded). Called
   * once on first {@link start}; the result is cached. May return null if the buffer
   * is unavailable.
   */
  protected abstract resolveBuffer(audioContext: AudioContext): Promise<AudioBuffer | null>;

  /**
   * Resumes the shared audio context, resolves the buffer on first use (cached
   * afterward), and starts looping it through the analyser. Idempotent while
   * already playing. Must be called from a user gesture so the context may start.
   */
  public async start(): Promise<void> {
    if (this.sourceNode) {
      return;
    }
    const audioContext = await resumeSharedAudioContext();
    if (!this.buffer) {
      this.bufferPromise ??= this.resolveBuffer(audioContext);
      this.buffer = await this.bufferPromise;
    }
    const buffer = this.buffer;
    if (!buffer) {
      return;
    }
    const analyser = this.analyser ?? audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = 0;
    this.analyser = analyser;

    const gainNode = this.gainNode ?? audioContext.createGain();
    gainNode.gain.value = this.monitoringEnabled ? 1 : 0;
    this.gainNode = gainNode;

    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    sourceNode.connect(analyser);
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    sourceNode.start(0);
    this.sourceNode = sourceNode;
  }

  public setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    if (this.gainNode) {
      this.gainNode.gain.value = enabled ? 1 : 0;
    }
  }

  /** Stops playback but keeps the resolved buffer for a fast restart. */
  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // Already stopped; ignore.
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    // Disconnect the gain node so the next start() does not accumulate duplicate
    // destination connections — Web Audio connections are additive, not idempotent.
    this.gainNode?.disconnect();
  }

  /** Updates the analyser FFT size (frame length). */
  public setFftSize(fftSize: number): void {
    this.fftSize = fftSize;
    if (this.timeBuffer.length !== fftSize) {
      this.timeBuffer = new Float32Array(fftSize);
    }
    if (this.analyser) {
      this.analyser.fftSize = fftSize;
    }
  }

  public getFrame(out: Float32Array): boolean {
    const analyser = this.analyser;
    if (!(analyser && this.sourceNode)) {
      return false;
    }
    analyser.getFloatTimeDomainData(this.timeBuffer);
    const count = Math.min(out.length, this.timeBuffer.length);
    for (let i = 0; i < count; i++) {
      out[i] = this.timeBuffer[i] ?? 0;
    }
    return true;
  }
}
