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
import type { AnalysisPreferencesModel } from "../../preferences/AnalysisPreferencesModel.js";

const DEFAULT_MIN_FREQUENCY_HZ = 0;
const FREQUENCY_RANGE = new Range(0, 22050);

/** Presets whose captions describe odd-harmonic cylindrical bores. */
const CLOSED_PIPE_PRESET_IDS = new Set(["clarinet", "oboe"]);

/** Presets whose captions describe rich / conical harmonic content. */
const OPEN_PIPE_PRESET_IDS = new Set(["flute", "horn", "saxophone"]);

/** Presets whose captions describe bowed / plucked string ladders. */
const STRING_PRESET_IDS = new Set(["violin", "viola", "cello", "piano", "guitar"]);

const DEFAULT_STANDING_WAVE_MODES: readonly StandingWaveMode[] = [
  { modeNumber: 1, amplitude: 1 },
  { modeNumber: 2, amplitude: 0.6 },
  { modeNumber: 3, amplitude: 0.4 },
  { modeNumber: 4, amplitude: 0.25 },
];

export class AnalyzerModel extends BaseAnalysisModel implements HarmonicChartModel {
  public readonly minFrequencyProperty = new NumberProperty(DEFAULT_MIN_FREQUENCY_HZ, { range: FREQUENCY_RANGE });
  /** When true, analysis is paused so the current display can be inspected. */
  public readonly isFrozenProperty = new BooleanProperty(false);
  /**
   * Expected allowed harmonics for pedagogy overlays. Auto-updates when certain
   * instrument presets are selected; user can override via the control panel.
   */
  public readonly pipeBoundaryProperty = createPipeBoundaryProperty(PipeBoundary.NONE);

  public constructor(analysisPreferences: AnalysisPreferencesModel) {
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

  public getStandingWaveModes(): readonly StandingWaveMode[] {
    return this.f0Property.value > 0 ? DEFAULT_STANDING_WAVE_MODES : [];
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
