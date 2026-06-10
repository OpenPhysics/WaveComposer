/**
 * SyntheticWebAudioSource.ts
 *
 * Real-time synthetic {@link AudioFrameSource} backed by a Web Audio graph.
 * A {@link ScriptProcessorNode} runs the preset generator at the audio sample
 * rate; an {@link AnalyserNode} feeds the analyzer and a {@link GainNode} can
 * route the same signal to the speakers.
 */
import type { AudioFrameSource } from "./AudioFrameSource.js";
import type { PresetGenerator } from "./PresetFrameSource.js";
import { getSharedSampleRate, resumeSharedAudioContext } from "./SharedAudioContext.js";

const SCRIPT_BUFFER_SIZE = 2048;

export class SyntheticWebAudioSource implements AudioFrameSource {
  private readonly generate: PresetGenerator;
  private fftSize: number;
  private analyser: AnalyserNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private monitoringEnabled = true;
  private elapsedPlaybackTimeS = 0;
  private timeBuffer: Float32Array<ArrayBuffer>;

  public constructor(generate: PresetGenerator, fftSize: number) {
    this.generate = generate;
    this.fftSize = fftSize;
    this.timeBuffer = new Float32Array(fftSize);
  }

  public get sampleRate(): number {
    return getSharedSampleRate();
  }

  public get isActive(): boolean {
    return this.scriptNode !== null;
  }

  /** Elapsed synthesis time (s) since the last {@link start}; used for phase-continuous displays. */
  public get playbackTimeS(): number {
    return this.elapsedPlaybackTimeS;
  }

  /**
   * Starts the synthesis graph. Idempotent while already running. Must be
   * called from a user gesture so the shared context may start.
   */
  public async start(): Promise<void> {
    if (this.scriptNode) {
      return;
    }
    const audioContext = await resumeSharedAudioContext();

    const analyser = this.analyser ?? audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = 0;
    this.analyser = analyser;

    const gainNode = this.gainNode ?? audioContext.createGain();
    gainNode.gain.value = this.monitoringEnabled ? 1 : 0;
    this.gainNode = gainNode;

    const scriptNode = audioContext.createScriptProcessor(SCRIPT_BUFFER_SIZE, 0, 1);
    scriptNode.onaudioprocess = (event) => {
      const out = event.outputBuffer.getChannelData(0);
      this.generate(out, audioContext.sampleRate, this.elapsedPlaybackTimeS);
      this.elapsedPlaybackTimeS += out.length / audioContext.sampleRate;
    };
    scriptNode.connect(analyser);
    scriptNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    this.scriptNode = scriptNode;
  }

  /** Stops synthesis but keeps nodes for a fast restart. */
  public stop(): void {
    this.scriptNode?.disconnect();
    this.scriptNode = null;
    this.elapsedPlaybackTimeS = 0;
  }

  public setMonitoringEnabled(enabled: boolean): void {
    this.monitoringEnabled = enabled;
    if (this.gainNode) {
      this.gainNode.gain.value = enabled ? 1 : 0;
    }
  }

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
    if (!(analyser && this.scriptNode)) {
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
