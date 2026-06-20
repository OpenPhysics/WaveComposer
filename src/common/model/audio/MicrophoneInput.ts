/**
 * MicrophoneInput.ts
 *
 * Live microphone {@link AudioFrameSource}: getUserMedia → AudioContext →
 * AnalyserNode. Each `getFrame` pulls the current time-domain window via
 * `getFloatTimeDomainData`, which is exactly what the per-frame analyzer needs.
 *
 * Audio enhancements (echo cancellation, noise suppression, AGC) are disabled so
 * the analysis sees the raw signal.
 *
 * While capturing, the same source node can be tapped by a {@link ScriptProcessorNode}
 * to record the raw PCM into memory (see {@link startRecording}); the captured clip
 * is replayed through a {@link RecordedAudioSource}.
 */
import { AnalyserTap } from "./AnalyserTap.js";
import type { AudioFrameSource } from "./AudioFrameSource.js";
import type { MonitoredAudioSource } from "./MonitoredAudioSource.js";

const DEFAULT_SAMPLE_RATE = 44100;
const RECORD_BUFFER_SIZE = 4096;
// Caps in-memory recording at ~2 min (44.1 kHz / 4096 samples per chunk ≈ 10.8 chunks/s).
const MAX_RECORDING_CHUNKS = 1300;

/** A captured microphone clip: mono PCM samples and the rate they were recorded at. */
export interface RecordedClip {
  readonly samples: Float32Array;
  readonly sampleRate: number;
}

export class MicrophoneInput implements AudioFrameSource, MonitoredAudioSource {
  private readonly tap: AnalyserTap;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  /** Serialises concurrent start() calls: both callers await the same promise. */
  private startInProgress: Promise<void> | null = null;
  // Recording tap: a ScriptProcessorNode that accumulates raw PCM while active.
  // It must be connected to the destination to run, so its (silent) output is
  // routed through a muted gain to avoid echoing the microphone to the speakers.
  private recordProcessor: ScriptProcessorNode | null = null;
  private recordSink: GainNode | null = null;
  private recordedChunks: Float32Array[] = [];

  public constructor(fftSize: number) {
    this.tap = new AnalyserTap(fftSize);
  }

  public get sampleRate(): number {
    return this.audioContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  }

  public get isActive(): boolean {
    return this.tap.analyser !== null;
  }

  /**
   * Requests microphone access and starts the audio graph. Idempotent and
   * concurrency-safe: concurrent callers share the same in-flight promise.
   */
  public start(): Promise<void> {
    if (this.tap.analyser) {
      return Promise.resolve();
    }
    if (!this.startInProgress) {
      this.startInProgress = this.doStart().finally(() => {
        this.startInProgress = null;
      });
    }
    return this.startInProgress;
  }

  private async doStart(): Promise<void> {
    if (this.tap.analyser) {
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

    const { analyser, gainNode } = this.tap.setup(audioContext);
    const sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    this.stream = stream;
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
  }

  public setMonitoringEnabled(enabled: boolean): void {
    this.tap.setMonitoringEnabled(enabled);
  }

  public get isRecording(): boolean {
    return this.recordProcessor !== null;
  }

  /** Begins accumulating raw PCM from the live microphone. No-op if not capturing. */
  public startRecording(): void {
    const audioContext = this.audioContext;
    const sourceNode = this.sourceNode;
    if (!(audioContext && sourceNode) || this.recordProcessor) {
      return;
    }
    this.recordedChunks = [];
    const processor = audioContext.createScriptProcessor(RECORD_BUFFER_SIZE, 1, 1);
    processor.onaudioprocess = (event) => {
      if (this.recordedChunks.length < MAX_RECORDING_CHUNKS) {
        // Copy: the input buffer is reused across callbacks.
        this.recordedChunks.push(Float32Array.from(event.inputBuffer.getChannelData(0)));
      }
    };
    const sink = audioContext.createGain();
    sink.gain.value = 0;
    sourceNode.connect(processor);
    processor.connect(sink);
    sink.connect(audioContext.destination);
    this.recordProcessor = processor;
    this.recordSink = sink;
  }

  /** Stops recording and returns the captured clip, or null if nothing was captured. */
  public stopRecording(): RecordedClip | null {
    if (!this.recordProcessor) {
      return null;
    }
    const sampleRate = this.audioContext?.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const chunks = this.recordedChunks;
    this.teardownRecording();
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (total === 0) {
      return null;
    }
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    return { samples, sampleRate };
  }

  /** Discards an in-progress recording without producing a clip. */
  public cancelRecording(): void {
    this.teardownRecording();
  }

  private teardownRecording(): void {
    if (this.recordProcessor) {
      this.recordProcessor.onaudioprocess = null;
      this.recordProcessor.disconnect();
      this.recordProcessor = null;
    }
    if (this.recordSink) {
      this.recordSink.disconnect();
      this.recordSink = null;
    }
    this.recordedChunks = [];
  }

  /** Stops the audio graph and releases the microphone. */
  public stop(): void {
    this.teardownRecording();
    this.sourceNode?.disconnect();
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
    }
    const audioContext = this.audioContext;
    this.sourceNode = null;
    this.stream = null;
    this.audioContext = null;
    // Clear tap references so isActive returns false and readFrame returns false.
    this.tap.clear();
    // Closing is asynchronous; we do not need to wait for it.
    if (audioContext) {
      audioContext.close().catch(() => undefined);
    }
  }

  /** Updates the analyser FFT size (frame length). */
  public setFftSize(fftSize: number): void {
    this.tap.setFftSize(fftSize);
  }

  public getFrame(out: Float32Array): boolean {
    return this.tap.readFrame(out);
  }
}
