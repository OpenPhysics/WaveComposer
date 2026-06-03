/**
 * AudioFileFrameSource.ts
 *
 * Plays a bundled audio clip (an openly-licensed recording — see CREDITS.md) as an
 * {@link AudioFrameSource}. The clip is decoded once and looped through an
 * {@link AnalyserNode}, and each `getFrame` taps the current time-domain window —
 * exactly the path {@link MicrophoneInput} uses, so the file plays at real time
 * (a guitar scale advances at its natural pace, not at the analyzer's frame rate).
 *
 * All file sources share one {@link AudioContext} (created lazily on first play, from
 * a user gesture) so selecting through many presets never exhausts the browser's
 * per-page AudioContext budget. The graph is analyzed-only: the buffer source
 * connects to the analyser but not to `destination`, so the clip is silent. (Add
 * `.connect(audioContext.destination)` to make it audible.)
 */
import type { AudioFrameSource } from "./AudioFrameSource.js";

const DEFAULT_SAMPLE_RATE = 44100;

// One AudioContext shared by every file source (lazily created on first start()).
let sharedContext: AudioContext | null = null;
function getSharedContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

export class AudioFileFrameSource implements AudioFrameSource {
  private readonly url: string;
  private fftSize: number;
  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private loadPromise: Promise<void> | null = null;
  // AnalyserNode requires an ArrayBuffer-backed view; copied into the caller's
  // buffer (which may be ArrayBufferLike) in getFrame.
  private timeBuffer: Float32Array<ArrayBuffer>;

  public constructor(url: string, fftSize: number) {
    this.url = url;
    this.fftSize = fftSize;
    this.timeBuffer = new Float32Array(fftSize);
  }

  public get sampleRate(): number {
    return sharedContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  }

  public get isActive(): boolean {
    return this.sourceNode !== null;
  }

  /**
   * Resumes the shared audio context, decodes the clip on first use (cached
   * afterward), and starts looping it through the analyser. Idempotent while
   * already playing. Must be called from a user gesture so the context may start.
   */
  public async start(): Promise<void> {
    if (this.sourceNode) {
      return;
    }
    const audioContext = getSharedContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    if (!this.buffer) {
      this.loadPromise ??= this.load(audioContext);
      await this.loadPromise;
    }
    const buffer = this.buffer;
    if (!buffer) {
      return;
    }
    const analyser = this.analyser ?? audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = 0;
    this.analyser = analyser;

    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    sourceNode.connect(analyser);
    sourceNode.start(0);
    this.sourceNode = sourceNode;
  }

  /** Stops playback but keeps the decoded buffer for a fast restart. */
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

  private async load(audioContext: AudioContext): Promise<void> {
    const response = await fetch(this.url);
    const data = await response.arrayBuffer();
    this.buffer = await audioContext.decodeAudioData(data);
  }
}
