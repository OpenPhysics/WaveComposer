/**
 * MicrophoneInput.ts
 *
 * Live microphone {@link AudioFrameSource}: getUserMedia → AudioContext →
 * AnalyserNode. Each `getFrame` pulls the current time-domain window via
 * `getFloatTimeDomainData`, which is exactly what the per-frame analyzer needs.
 *
 * Audio enhancements (echo cancellation, noise suppression, AGC) are disabled so
 * the analysis sees the raw signal.
 */
import type { AudioFrameSource } from "./AudioFrameSource.js";

const DEFAULT_SAMPLE_RATE = 44100;

export class MicrophoneInput implements AudioFrameSource {
  private fftSize: number;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  // AnalyserNode requires an ArrayBuffer-backed view; we copy into the caller's
  // buffer (which may be ArrayBufferLike) in getFrame.
  private timeBuffer: Float32Array<ArrayBuffer>;

  public constructor(fftSize: number) {
    this.fftSize = fftSize;
    this.timeBuffer = new Float32Array(fftSize);
  }

  public get sampleRate(): number {
    return this.audioContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  }

  public get isActive(): boolean {
    return this.analyser !== null;
  }

  /** Requests microphone access and starts the audio graph. Idempotent. */
  public async start(): Promise<void> {
    if (this.analyser) {
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = this.fftSize;
    analyser.smoothingTimeConstant = 0;
    const sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    this.stream = stream;
    this.audioContext = audioContext;
    this.analyser = analyser;
    this.sourceNode = sourceNode;
  }

  /** Stops the audio graph and releases the microphone. */
  public stop(): void {
    this.sourceNode?.disconnect();
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
    }
    const audioContext = this.audioContext;
    this.sourceNode = null;
    this.analyser = null;
    this.stream = null;
    this.audioContext = null;
    // Closing is asynchronous; we do not need to wait for it.
    if (audioContext) {
      audioContext.close().catch(() => undefined);
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
    if (!analyser) {
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
