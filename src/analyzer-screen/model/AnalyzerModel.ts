/**
 * AnalyzerModel.ts
 *
 * Screen-specific model for the Analyzer screen. It owns an independent
 * audio/DSP pipeline configured for instrument presets plus Analyzer-only state
 * (freeze, pipe-boundary hints for instrument pedagogy).
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { INSTRUMENT_PRESET_CATALOG } from "../../common/model/audio/presetCatalog.js";
import { BaseAnalysisModel } from "../../common/model/BaseAnalysisModel.js";
import type { HarmonicChartModel, StandingWaveMode } from "../../common/model/HarmonicChartModel.js";
import { createPipeBoundaryProperty, PipeBoundary } from "../../common/model/PipeBoundary.js";
import type { WaveComposerPreferencesModel } from "../../preferences/WaveComposerPreferencesModel.js";

const DEFAULT_MIN_FREQUENCY_HZ = 0;
const FREQUENCY_RANGE = new Range(0, 22050);

/** Presets whose captions describe odd-harmonic cylindrical bores. */
const CLOSED_PIPE_PRESET_IDS = new Set(["clarinet", "oboe"]);

/** Presets whose captions describe rich / conical harmonic content. */
const OPEN_PIPE_PRESET_IDS = new Set(["flute", "horn", "saxophone"]);

/** Presets whose captions describe bowed / plucked string ladders. */
const STRING_PRESET_IDS = new Set(["violin", "viola", "cello", "piano", "guitar"]);

/** Number of harmonics represented in the standing-wave strip. */
const STANDING_WAVE_MODE_COUNT = 4;
/** Harmonics more than this far below the strongest one are not drawn. */
const STANDING_WAVE_FLOOR_DB = 40;

export class AnalyzerModel extends BaseAnalysisModel implements HarmonicChartModel {
  public readonly minFrequencyProperty = new NumberProperty(DEFAULT_MIN_FREQUENCY_HZ, { range: FREQUENCY_RANGE });
  /** When true, analysis is paused so the current display can be inspected. */
  public readonly isFrozenProperty = new BooleanProperty(false);
  /**
   * Expected allowed harmonics for pedagogy overlays. Auto-updates when certain
   * instrument presets are selected; user can override via the control panel.
   */
  public readonly pipeBoundaryProperty = createPipeBoundaryProperty(PipeBoundary.NONE);

  public constructor(analysisPreferences: WaveComposerPreferencesModel) {
    super(INSTRUMENT_PRESET_CATALOG, analysisPreferences);
    this.audioSourceProperty.lazyLink((source) => this.syncPipeBoundaryForPreset(source));
  }

  public override reset(): void {
    super.reset();
    this.minFrequencyProperty.reset();
    this.isFrozenProperty.reset();
    this.pipeBoundaryProperty.reset();
  }

  public getFundamentalHz(): number {
    return this.f0Property.value;
  }

  /**
   * Standing-wave modes with amplitudes read from the measured power spectrum at
   * each harmonic of the detected F0 (normalized to the strongest harmonic), so
   * the strip reflects the actual signal — e.g. a clarinet's weak even harmonics
   * show up weak here too.
   */
  public getStandingWaveModes(): readonly StandingWaveMode[] {
    const f0 = this.f0Property.value;
    const analysis = this.analysis;
    if (f0 <= 0 || !analysis) {
      return [];
    }
    const spectrumDb = analysis.powerSpectrumDb;
    const half = spectrumDb.length;
    const fftSize = half * 2;
    const sampleRate = this.sampleRateProperty.value;

    // Peak dB per harmonic (searching ±1 bin to absorb bin-center error).
    const harmonicDb: number[] = [];
    let maxDb = Number.NEGATIVE_INFINITY;
    for (let n = 1; n <= STANDING_WAVE_MODE_COUNT; n++) {
      const bin = Math.round((n * f0 * fftSize) / sampleRate);
      if (bin < 1 || bin >= half - 1) {
        break;
      }
      const low = spectrumDb[bin - 1] ?? Number.NEGATIVE_INFINITY;
      const mid = spectrumDb[bin] ?? Number.NEGATIVE_INFINITY;
      const high = spectrumDb[bin + 1] ?? Number.NEGATIVE_INFINITY;
      const db = Math.max(low, mid, high);
      harmonicDb.push(db);
      maxDb = Math.max(maxDb, db);
    }
    if (!Number.isFinite(maxDb)) {
      return [];
    }

    const modes: StandingWaveMode[] = [];
    for (let i = 0; i < harmonicDb.length; i++) {
      const relativeDb = (harmonicDb[i] ?? Number.NEGATIVE_INFINITY) - maxDb;
      if (relativeDb < -STANDING_WAVE_FLOOR_DB) {
        continue;
      }
      // Power dB → linear amplitude relative to the strongest harmonic.
      modes.push({ modeNumber: i + 1, amplitude: 10 ** (relativeDb / 20) });
    }
    return modes;
  }

  protected override get isAnalysisPaused(): boolean {
    return this.isFrozenProperty.value;
  }

  private syncPipeBoundaryForPreset(sourceId: string): void {
    if (CLOSED_PIPE_PRESET_IDS.has(sourceId)) {
      this.pipeBoundaryProperty.value = PipeBoundary.CLOSED_PIPE;
    } else if (OPEN_PIPE_PRESET_IDS.has(sourceId)) {
      this.pipeBoundaryProperty.value = PipeBoundary.OPEN_PIPE;
    } else if (STRING_PRESET_IDS.has(sourceId)) {
      this.pipeBoundaryProperty.value = PipeBoundary.STRING;
    } else {
      this.pipeBoundaryProperty.value = PipeBoundary.NONE;
    }
  }
}
