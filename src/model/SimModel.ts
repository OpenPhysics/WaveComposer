/**
 * SimModel.ts
 *
 * Top-level model for the voice-analysis screen. It owns:
 *   - the reactive settings (FFT size, window, LPC order, display range)
 *   - the reactive analysis outputs (F0, note, formants, HNR, CPP, RMS)
 *   - the {@link VoiceAnalyzer} (pure DSP) and the audio sources: a live
 *     {@link MicrophoneInput} (the default), a set of synthetic {@link PresetFrameSource}
 *     demonstrations (vowels, clarinet, flute, violin, cymbals), and two bundled
 *     {@link AudioFileFrameSource} clips (singing, guitar scale). {@link audioSourceProperty}
 *     selects between them; the microphone starts lazily (on the Start button) so no
 *     permission prompt appears on load.
 *
 * Scalar results are exposed as Axon Properties / DerivedProperties. The large
 * per-frame arrays (waveform, spectrum, LPC envelope, cepstrum) live in reused
 * analyzer buffers and are surfaced through {@link analysis}; a single
 * {@link frameProcessedEmitter} signals when new buffer contents are ready, which
 * avoids per-frame allocation and Property churn.
 *
 * The Sim framework calls {@link step} every animation frame; it pulls the
 * current frame from the active source, runs the analyzer, and writes the results.
 */
import {
  BooleanProperty,
  DerivedProperty,
  Emitter,
  NumberProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import clarinetUrl from "../assets/audio/clarinet.ogg?url";
import cymbalsUrl from "../assets/audio/cymbals.ogg?url";
import fluteUrl from "../assets/audio/flute.ogg?url";
import guitarUrl from "../assets/audio/guitar-scale.ogg?url";
import violinUrl from "../assets/audio/violin.ogg?url";
import vowelAhUrl from "../assets/audio/vowel-ah.ogg?url";
import vowelEeUrl from "../assets/audio/vowel-ee.ogg?url";
import { AudioFileFrameSource } from "./audio/AudioFileFrameSource.js";
import type { AudioFrameSource } from "./audio/AudioFrameSource.js";
import { MicrophoneInput } from "./audio/MicrophoneInput.js";
import { createSingingSource } from "./audio/presets.js";
import { centsFromFrequency, noteNameFromFrequency } from "./dsp/NoteUtils.js";
import type { FormantData } from "./dsp/types.js";
import { WINDOW_TYPE_VALUES, WindowType } from "./dsp/WindowFunction.js";
import { type AnalysisResult, type AnalyzerConfig, VoiceAnalyzer } from "./VoiceAnalyzer.js";

const DEFAULT_FFT_SIZE = 2048;
const FFT_SIZE_VALUES = [1024, 2048, 4096];
// At the full 44.1/48 kHz rate the formant band occupies only the lower part of
// the spectrum, so a higher LPC order is needed to resolve F1–F4 cleanly (a
// future pass may downsample before LPC, allowing a lower order).
const DEFAULT_LPC_ORDER = 18;
const LPC_ORDER_RANGE = new Range(8, 24);
const DEFAULT_MIN_FREQUENCY_HZ = 0;
const DEFAULT_MAX_FREQUENCY_HZ = 5000;
const FREQUENCY_RANGE = new Range(0, 22050);

// Fixed F0 / voice-quality search band (Hz). Covers low male speech to high
// singing without wandering into formant territory.
const F0_MIN_HZ = 60;
const F0_MAX_HZ = 800;

// A voiced frame needs both a positive F0 and enough periodicity confidence.
const VOICED_CONFIDENCE_THRESHOLD = 0.5;

const EMPTY_FORMANTS: readonly FormantData[] = [];

const DEFAULT_SAMPLE_RATE_HZ = 44100;

/**
 * Which audio source the analyzer reads from. `MICROPHONE` is the live input (the
 * default; it starts lazily so no permission prompt appears on load). The rest are
 * permission-free demonstrations: synthetic presets (vowels, instruments, cymbals)
 * and two bundled CC0 recordings (singing, guitar scale) that auto-play on selection.
 */
export const AudioSource = {
  MICROPHONE: "microphone",
  VOWEL_AH: "vowelAh",
  VOWEL_EE: "vowelEe",
  CLARINET: "clarinet",
  FLUTE: "flute",
  VIOLIN: "violin",
  CYMBALS: "cymbals",
  SINGING: "singing",
  GUITAR: "guitar",
} as const;
export type AudioSource = (typeof AudioSource)[keyof typeof AudioSource];
/** Display order for the source selector. */
export const AUDIO_SOURCE_VALUES: readonly AudioSource[] = [
  AudioSource.MICROPHONE,
  AudioSource.VOWEL_AH,
  AudioSource.VOWEL_EE,
  AudioSource.CLARINET,
  AudioSource.FLUTE,
  AudioSource.VIOLIN,
  AudioSource.CYMBALS,
  AudioSource.SINGING,
  AudioSource.GUITAR,
];

export class SimModel implements TModel {
  // ── Settings (inputs) ───────────────────────────────────────────────────────
  public readonly fftSizeProperty = new NumberProperty(DEFAULT_FFT_SIZE, { validValues: FFT_SIZE_VALUES });
  public readonly lpcOrderProperty = new NumberProperty(DEFAULT_LPC_ORDER, { range: LPC_ORDER_RANGE });
  public readonly windowTypeProperty = new Property<WindowType>(WindowType.HANN, {
    validValues: [...WINDOW_TYPE_VALUES],
  });
  public readonly minFrequencyProperty = new NumberProperty(DEFAULT_MIN_FREQUENCY_HZ, { range: FREQUENCY_RANGE });
  public readonly maxFrequencyProperty = new NumberProperty(DEFAULT_MAX_FREQUENCY_HZ, { range: FREQUENCY_RANGE });

  // ── State ───────────────────────────────────────────────────────────────────
  /** Selects the active audio source. Defaults to the live microphone (lazy-started). */
  public readonly audioSourceProperty = new Property<AudioSource>(AudioSource.MICROPHONE, {
    validValues: [...AUDIO_SOURCE_VALUES],
  });
  /** When true, analysis is paused so the current display can be inspected. */
  public readonly isFrozenProperty = new BooleanProperty(false);
  /** Whether the microphone is currently capturing. */
  public readonly isListeningProperty = new BooleanProperty(false);
  /** Sample rate (Hz) of the active source; the view needs it to map FFT bins → Hz. */
  public readonly sampleRateProperty = new NumberProperty(DEFAULT_SAMPLE_RATE_HZ);

  // ── Outputs (scalar results) ────────────────────────────────────────────────
  public readonly f0Property = new NumberProperty(0);
  public readonly f0ConfidenceProperty = new NumberProperty(0);
  public readonly rmsLevelProperty = new NumberProperty(0);
  public readonly hnrProperty = new NumberProperty(0);
  public readonly cppProperty = new NumberProperty(0);
  public readonly formantsProperty = new Property<readonly FormantData[]>(EMPTY_FORMANTS);

  // ── Outputs (derived) ───────────────────────────────────────────────────────
  public readonly isVoicedProperty: TReadOnlyProperty<boolean> = new DerivedProperty(
    [this.f0Property, this.f0ConfidenceProperty],
    (f0, confidence) => f0 > 0 && confidence >= VOICED_CONFIDENCE_THRESHOLD,
  );
  public readonly noteNameProperty: TReadOnlyProperty<string> = new DerivedProperty([this.f0Property], (f0) =>
    noteNameFromFrequency(f0),
  );
  public readonly centsProperty: TReadOnlyProperty<number> = new DerivedProperty([this.f0Property], (f0) =>
    f0 > 0 ? centsFromFrequency(f0) : 0,
  );
  public readonly f1FrequencyProperty: TReadOnlyProperty<number> = this.createFormantFrequencyProperty(0);
  public readonly f2FrequencyProperty: TReadOnlyProperty<number> = this.createFormantFrequencyProperty(1);
  public readonly f3FrequencyProperty: TReadOnlyProperty<number> = this.createFormantFrequencyProperty(2);
  public readonly f4FrequencyProperty: TReadOnlyProperty<number> = this.createFormantFrequencyProperty(3);

  /** Fires after each analyzed frame; listeners read {@link analysis} buffers. */
  public readonly frameProcessedEmitter = new Emitter();

  private readonly micInput: MicrophoneInput;
  /** Every selectable source, keyed by {@link AudioSource}. */
  private readonly sources: ReadonlyMap<AudioSource, AudioFrameSource>;
  private readonly analyzer: VoiceAnalyzer;
  private frameBuffer: Float32Array;
  private latestResult: AnalysisResult | null = null;

  public constructor() {
    this.micInput = new MicrophoneInput(DEFAULT_FFT_SIZE);
    this.sources = new Map<AudioSource, AudioFrameSource>([
      [AudioSource.MICROPHONE, this.micInput],
      // Real recordings (see CREDITS.md); singing has no suitable free clip, so it
      // falls back to a synthesized sung vowel.
      [AudioSource.VOWEL_AH, new AudioFileFrameSource(vowelAhUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.VOWEL_EE, new AudioFileFrameSource(vowelEeUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.CLARINET, new AudioFileFrameSource(clarinetUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.FLUTE, new AudioFileFrameSource(fluteUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.VIOLIN, new AudioFileFrameSource(violinUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.CYMBALS, new AudioFileFrameSource(cymbalsUrl, DEFAULT_FFT_SIZE)],
      [AudioSource.SINGING, createSingingSource()],
      [AudioSource.GUITAR, new AudioFileFrameSource(guitarUrl, DEFAULT_FFT_SIZE)],
    ]);
    this.analyzer = new VoiceAnalyzer(this.buildConfig());
    this.frameBuffer = new Float32Array(DEFAULT_FFT_SIZE);

    // Reconfigure the analyzer + sources whenever an analysis setting changes.
    this.fftSizeProperty.lazyLink(() => this.applyConfig());
    this.windowTypeProperty.lazyLink(() => this.applyConfig());
    this.lpcOrderProperty.lazyLink(() => this.applyConfig());
    this.maxFrequencyProperty.lazyLink(() => this.applyConfig());
    // Switching source: release the old one, auto-start the new one if it's a file
    // clip (the combo selection is a user gesture), and update the sample rate.
    this.audioSourceProperty.lazyLink((source, oldSource) => {
      this.deactivate(oldSource);
      this.activate(source);
      this.applyConfig();
    });
  }

  /** The audio source the analyzer currently reads from. */
  private get source(): AudioFrameSource {
    return this.sources.get(this.audioSourceProperty.value) ?? this.micInput;
  }

  /** Starts a newly selected source. File clips auto-play; the mic stays lazy. */
  private activate(value: AudioSource): void {
    const source = this.sources.get(value);
    if (source instanceof AudioFileFrameSource) {
      source.start().catch(() => undefined);
    }
  }

  /** Releases a source we are leaving (mic device / file playback). */
  private deactivate(value: AudioSource): void {
    if (value === AudioSource.MICROPHONE) {
      this.stopListening();
      return;
    }
    const source = this.sources.get(value);
    if (source instanceof AudioFileFrameSource) {
      source.stop();
    }
  }

  /**
   * The most recent per-frame analysis, including the reused buffers (waveform,
   * power spectrum dB, LPC envelope dB, cepstrum), or null before the first
   * frame. Read inside a {@link frameProcessedEmitter} listener; do not retain
   * the buffers across frames.
   */
  public get analysis(): AnalysisResult | null {
    return this.latestResult;
  }

  /**
   * Starts microphone capture (prompts for permission on first call) and selects
   * the microphone as the active source.
   */
  public async startListening(): Promise<void> {
    this.audioSourceProperty.value = AudioSource.MICROPHONE;
    await this.micInput.start();
    // The AudioContext's sample rate is known only after start.
    this.applyConfig();
    this.isListeningProperty.value = true;
  }

  /** Stops microphone capture and releases the device. */
  public stopListening(): void {
    this.micInput.stop();
    this.isListeningProperty.value = false;
  }

  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    this.stopListening();
    this.audioSourceProperty.reset();
    this.sampleRateProperty.reset();
    this.fftSizeProperty.reset();
    this.lpcOrderProperty.reset();
    this.windowTypeProperty.reset();
    this.minFrequencyProperty.reset();
    this.maxFrequencyProperty.reset();
    this.isFrozenProperty.reset();
    this.f0Property.reset();
    this.f0ConfidenceProperty.reset();
    this.rmsLevelProperty.reset();
    this.hnrProperty.reset();
    this.cppProperty.reset();
    this.formantsProperty.reset();
    this.latestResult = null;
  }

  /**
   * Steps the model forward by dt seconds.
   * Called every animation frame by the Sim framework.
   *
   * @param _dt - elapsed time in seconds since the last frame
   */
  public step(_dt: number): void {
    const source = this.source;
    if (this.isFrozenProperty.value || !source.isActive) {
      return;
    }
    if (!source.getFrame(this.frameBuffer)) {
      return;
    }

    const result = this.analyzer.analyze(this.frameBuffer);
    this.latestResult = result;

    this.f0Property.value = result.pitch.frequencyHz;
    this.f0ConfidenceProperty.value = result.pitch.confidence;
    this.rmsLevelProperty.value = result.rms;
    this.hnrProperty.value = result.hnrDb;
    this.cppProperty.value = result.cppDb;
    this.formantsProperty.value = result.formants;

    this.frameProcessedEmitter.emit();
  }

  /** Builds the analyzer config from the current settings + source sample rate. */
  private buildConfig(): AnalyzerConfig {
    return {
      sampleRate: this.source.sampleRate,
      fftSize: this.fftSizeProperty.value,
      windowType: this.windowTypeProperty.value,
      lpcOrder: this.lpcOrderProperty.value,
      f0MinHz: F0_MIN_HZ,
      f0MaxHz: F0_MAX_HZ,
      formantMaxHz: this.maxFrequencyProperty.value,
    };
  }

  /** Pushes the current settings into the analyzer, the sources, and the frame buffer. */
  private applyConfig(): void {
    const fftSize = this.fftSizeProperty.value;
    // Sources backed by a Web Audio AnalyserNode need their FFT size kept in sync.
    this.micInput.setFftSize(fftSize);
    for (const source of this.sources.values()) {
      if (source instanceof AudioFileFrameSource) {
        source.setFftSize(fftSize);
      }
    }
    if (this.frameBuffer.length !== fftSize) {
      this.frameBuffer = new Float32Array(fftSize);
    }
    this.sampleRateProperty.value = this.source.sampleRate;
    this.analyzer.reconfigure(this.buildConfig());
  }

  /** Derived property for the nth formant frequency (0 when absent). */
  private createFormantFrequencyProperty(index: number): TReadOnlyProperty<number> {
    return new DerivedProperty([this.formantsProperty], (formants) => formants[index]?.frequencyHz ?? 0);
  }
}
