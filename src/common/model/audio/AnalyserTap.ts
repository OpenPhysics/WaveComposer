/**
 * AnalyserTap.ts
 *
 * Shared AnalyserNode + GainNode wiring extracted from the three Web-Audio–backed
 * {@link AudioFrameSource}s ({@link MicrophoneInput}, {@link BufferPlaybackSource},
 * {@link SyntheticWebAudioSource}). Encapsulates the private read buffer, FFT-size
 * management, monitoring toggle, and frame reads so that logic is not triplicated.
 */

export class AnalyserTap {
  private fftSize: number;
  /** ArrayBuffer-backed view required by getFloatTimeDomainData. */
  private timeBuffer: Float32Array<ArrayBuffer>;
  private _analyser: AnalyserNode | null = null;
  private _gainNode: GainNode | null = null;
  private _monitoringEnabled = true;

  public get analyser(): AnalyserNode | null {
    return this._analyser;
  }

  public get gainNode(): GainNode | null {
    return this._gainNode;
  }

  /** The current monitoring preference; honoured in setup() when the gain node is created. */
  public get monitoringEnabled(): boolean {
    return this._monitoringEnabled;
  }

  public constructor(fftSize: number) {
    this.fftSize = fftSize;
    this.timeBuffer = new Float32Array(fftSize);
  }

  /**
   * Creates (or re-uses across stop/start cycles) the AnalyserNode and GainNode
   * inside the given context. Returns both nodes for the caller to wire into its
   * source-specific graph.
   */
  public setup(audioContext: AudioContext): { analyser: AnalyserNode; gainNode: GainNode } {
    const analyser = this._analyser ?? audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = 0;
    this._analyser = analyser;

    const gainNode = this._gainNode ?? audioContext.createGain();
    gainNode.gain.value = this._monitoringEnabled ? 1 : 0;
    this._gainNode = gainNode;

    return { analyser, gainNode };
  }

  public setFftSize(fftSize: number): void {
    this.fftSize = fftSize;
    if (this.timeBuffer.length !== fftSize) {
      this.timeBuffer = new Float32Array(fftSize);
    }
    if (this._analyser) {
      this._analyser.fftSize = fftSize;
    }
  }

  public setMonitoringEnabled(enabled: boolean): void {
    this._monitoringEnabled = enabled;
    if (this._gainNode) {
      this._gainNode.gain.value = enabled ? 1 : 0;
    }
  }

  /**
   * Reads the current time-domain frame into `out`. Returns true on success,
   * false when the audio graph has not been set up yet (before first start()).
   */
  public readFrame(out: Float32Array): boolean {
    if (!this._analyser) {
      return false;
    }
    this._analyser.getFloatTimeDomainData(this.timeBuffer);
    const count = Math.min(out.length, this.timeBuffer.length);
    for (let i = 0; i < count; i++) {
      out[i] = this.timeBuffer[i] ?? 0;
    }
    return true;
  }

  /**
   * Nulls the node references so readFrame returns false and isActive can return
   * false. Call from stop() in sources that tear down their AudioContext entirely
   * (e.g. {@link MicrophoneInput}) rather than preserving nodes for fast restart.
   */
  public clear(): void {
    this._analyser = null;
    this._gainNode = null;
  }
}
