/**
 * VoiceAnalyzer.ts
 *
 * Pure per-frame orchestrator that wires the DSP modules into a single analysis
 * pass. It owns all reusable scratch/output buffers and the FFT/YIN instances so
 * `analyze()` does no large allocation per frame (only a small result wrapper and
 * the formant list). It has no SceneryStack dependencies, which keeps it fully
 * unit-testable with synthetic signals.
 *
 * Pipeline per frame:
 *   raw frame ─▶ YIN ─▶ F0 + confidence
 *             ─▶ window ─▶ FFT power spectrum (dB)
 *                       └▶ real cepstrum ─▶ CPP
 *             ─▶ pre-emphasis ─▶ window ─▶ autocorr ─▶ LPC ─▶ formants + envelope
 *             ─▶ autocorr ─▶ HNR
 */
import { autocorrelate } from "./dsp/Autocorrelation.js";
import { Fft } from "./dsp/Fft.js";
import { computeLpcEnvelope, extractFormants } from "./dsp/FormantAnalyzer.js";
import { levinsonDurbin } from "./dsp/LinearPredictor.js";
import { preEmphasis } from "./dsp/SignalUtils.js";
import type { FormantData, PitchResult } from "./dsp/types.js";
import { cepstralPeakProminence, computeRealCepstrum, harmonicToNoiseRatio } from "./dsp/VoiceQuality.js";
import { applyWindow, createWindow, type WindowType } from "./dsp/WindowFunction.js";
import { YinPitchDetector } from "./dsp/YinPitchDetector.js";

export interface AnalyzerConfig {
  readonly sampleRate: number;
  readonly fftSize: number;
  readonly windowType: WindowType;
  readonly lpcOrder: number;
  /** Lower bound of the F0 / voice-quality search band, in Hz. */
  readonly f0MinHz: number;
  /** Upper bound of the F0 / voice-quality search band, in Hz. */
  readonly f0MaxHz: number;
  /** Upper bound for formant frequencies, in Hz (lower bound is fixed). */
  readonly formantMaxHz: number;
}

export interface AnalysisResult {
  readonly pitch: PitchResult;
  readonly formants: readonly FormantData[];
  readonly hnrDb: number;
  readonly cppDb: number;
  readonly rms: number;
  /** Raw time-domain frame, length N. Reused — copy if you must retain it. */
  readonly waveform: Float32Array;
  /** Power spectrum in dB, length N/2. Reused. */
  readonly powerSpectrumDb: Float32Array;
  /** LPC spectral envelope in dB, length N/2. Reused. */
  readonly lpcEnvelopeDb: Float32Array;
  /** Real cepstrum, length N. Reused. */
  readonly cepstrum: Float32Array;
}

const PRE_EMPHASIS_ALPHA = 0.97;
const YIN_THRESHOLD = 0.15;
const SILENCE_RMS = 1e-4;
const FORMANT_MIN_HZ = 90;
const FORMANT_MAX_BANDWIDTH_HZ = 600;
const MAX_FORMANTS = 5;
// White-noise correction: lifts the autocorrelation's zero-lag term slightly so
// the Levinson recursion stays well-conditioned on near-singular (strongly
// band-limited) voice frames.
const LPC_REGULARIZATION = 1e-5;

export class VoiceAnalyzer {
  private config: AnalyzerConfig;
  private fft: Fft;
  private yin: YinPitchDetector;
  private window: Float32Array;

  // Reused work + output buffers, sized to the current config.
  private waveform: Float32Array;
  private windowed: Float32Array;
  private preEmphasized: Float32Array;
  private windowedPreEmphasized: Float32Array;
  private powerScratch: Float32Array;
  private powerSpectrumDb: Float32Array;
  private lpcEnvelopeDb: Float32Array;
  private envReScratch: Float32Array;
  private envImScratch: Float32Array;
  private cepstrumReal: Float32Array;
  private cepstrumImag: Float32Array;
  private lpcAutocorr: Float64Array;
  private hnrAutocorr: Float32Array;
  private hnrMaxLag: number;

  public constructor(config: AnalyzerConfig) {
    this.config = config;
    const n = config.fftSize;
    const half = n >> 1;

    this.fft = new Fft(n);
    this.yin = new YinPitchDetector(n);
    this.window = createWindow(config.windowType, n);

    this.waveform = new Float32Array(n);
    this.windowed = new Float32Array(n);
    this.preEmphasized = new Float32Array(n);
    this.windowedPreEmphasized = new Float32Array(n);
    this.powerScratch = new Float32Array(half);
    this.powerSpectrumDb = new Float32Array(half);
    this.lpcEnvelopeDb = new Float32Array(half);
    this.envReScratch = new Float32Array(n);
    this.envImScratch = new Float32Array(n);
    this.cepstrumReal = new Float32Array(n);
    this.cepstrumImag = new Float32Array(n);
    this.lpcAutocorr = new Float64Array(config.lpcOrder + 1);
    this.hnrMaxLag = Math.min(n - 1, Math.ceil(config.sampleRate / config.f0MinHz));
    this.hnrAutocorr = new Float32Array(this.hnrMaxLag + 1);
  }

  /** The current configuration (read-only snapshot). */
  public get currentConfig(): AnalyzerConfig {
    return this.config;
  }

  /** The analysis frame size in samples. */
  public get frameSize(): number {
    return this.config.fftSize;
  }

  /**
   * Applies a new configuration, rebuilding only what changed (FFT/window on
   * size change, window on type change, autocorrelation buffers on rate change).
   */
  public reconfigure(config: AnalyzerConfig): void {
    const prev = this.config;
    const n = config.fftSize;

    if (config.fftSize !== prev.fftSize) {
      const half = n >> 1;
      this.fft = new Fft(n);
      this.yin.setBufferSize(n);
      this.waveform = new Float32Array(n);
      this.windowed = new Float32Array(n);
      this.preEmphasized = new Float32Array(n);
      this.windowedPreEmphasized = new Float32Array(n);
      this.powerScratch = new Float32Array(half);
      this.powerSpectrumDb = new Float32Array(half);
      this.lpcEnvelopeDb = new Float32Array(half);
      this.envReScratch = new Float32Array(n);
      this.envImScratch = new Float32Array(n);
      this.cepstrumReal = new Float32Array(n);
      this.cepstrumImag = new Float32Array(n);
    }

    if (config.fftSize !== prev.fftSize || config.windowType !== prev.windowType) {
      this.window = createWindow(config.windowType, n);
    }

    if (config.lpcOrder !== prev.lpcOrder) {
      this.lpcAutocorr = new Float64Array(config.lpcOrder + 1);
    }

    if (config.sampleRate !== prev.sampleRate || config.f0MinHz !== prev.f0MinHz || config.fftSize !== prev.fftSize) {
      this.hnrMaxLag = Math.min(n - 1, Math.ceil(config.sampleRate / config.f0MinHz));
      this.hnrAutocorr = new Float32Array(this.hnrMaxLag + 1);
    }

    this.config = config;
  }

  /**
   * Analyzes one time-domain frame (`frame.length` must equal the FFT size) and
   * returns the per-frame results. Returned buffers are reused on the next call.
   */
  public analyze(frame: Float32Array): AnalysisResult {
    if (frame.length !== this.config.fftSize) {
      throw new Error("Frame length must equal the configured FFT size");
    }
    const { sampleRate, lpcOrder, f0MinHz, f0MaxHz, formantMaxHz } = this.config;

    this.waveform.set(frame);

    // Pitch (YIN) on the raw frame.
    const pitch = this.yin.detect(frame, {
      sampleRate,
      minFrequencyHz: f0MinHz,
      maxFrequencyHz: f0MaxHz,
      threshold: YIN_THRESHOLD,
      silenceThreshold: SILENCE_RMS,
    });

    // Windowed frame → power spectrum (dB).
    applyWindow(frame, this.window, this.windowed);
    this.fft.powerSpectrum(this.windowed, this.powerScratch);
    for (let k = 0; k < this.powerSpectrumDb.length; k++) {
      this.powerSpectrumDb[k] = 10 * Math.log10((this.powerScratch[k] ?? 0) + 1e-12);
    }

    // Real cepstrum (from the windowed frame) → CPP.
    this.cepstrumReal.set(this.windowed);
    computeRealCepstrum(this.fft, this.cepstrumReal, this.cepstrumImag);
    const cppDb = cepstralPeakProminence(this.cepstrumReal, sampleRate, f0MinHz, f0MaxHz);

    // Pre-emphasis + window → autocorrelation → LPC → formants + envelope.
    preEmphasis(frame, PRE_EMPHASIS_ALPHA, this.preEmphasized);
    applyWindow(this.preEmphasized, this.window, this.windowedPreEmphasized);
    autocorrelate(this.windowedPreEmphasized, lpcOrder, this.lpcAutocorr);
    this.lpcAutocorr[0] = (this.lpcAutocorr[0] ?? 0) * (1 + LPC_REGULARIZATION);
    const lpc = levinsonDurbin(this.lpcAutocorr, lpcOrder);
    const formants = extractFormants(lpc.coefficients, {
      sampleRate,
      maxFormants: MAX_FORMANTS,
      minFrequencyHz: FORMANT_MIN_HZ,
      maxFrequencyHz: Math.min(formantMaxHz, sampleRate / 2),
      maxBandwidthHz: FORMANT_MAX_BANDWIDTH_HZ,
    });
    computeLpcEnvelope(this.fft, lpc.coefficients, lpc.gain, this.envReScratch, this.envImScratch, this.lpcEnvelopeDb);

    // Harmonics-to-noise ratio from the raw-frame autocorrelation.
    autocorrelate(frame, this.hnrMaxLag, this.hnrAutocorr);
    const hnrDb = harmonicToNoiseRatio(this.hnrAutocorr, sampleRate, f0MinHz, f0MaxHz);

    return {
      pitch,
      formants,
      hnrDb,
      cppDb,
      rms: pitch.rms,
      waveform: this.waveform,
      powerSpectrumDb: this.powerSpectrumDb,
      lpcEnvelopeDb: this.lpcEnvelopeDb,
      cepstrum: this.cepstrumReal,
    };
  }
}
