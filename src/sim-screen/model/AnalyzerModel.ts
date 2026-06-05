/**
 * AnalyzerModel.ts
 *
 * Screen-specific model for the Analyzer screen. It owns an independent
 * audio/DSP pipeline configured for instrument presets plus Analyzer-only state.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { INSTRUMENT_PRESET_CATALOG } from "../../common/model/audio/presetCatalog.js";
import { BaseAnalysisModel } from "../../common/model/BaseAnalysisModel.js";

const DEFAULT_MIN_FREQUENCY_HZ = 0;
const FREQUENCY_RANGE = new Range(0, 22050);

export class AnalyzerModel extends BaseAnalysisModel {
  public readonly minFrequencyProperty = new NumberProperty(DEFAULT_MIN_FREQUENCY_HZ, { range: FREQUENCY_RANGE });
  /** When true, analysis is paused so the current display can be inspected. */
  public readonly isFrozenProperty = new BooleanProperty(false);

  public constructor() {
    super(INSTRUMENT_PRESET_CATALOG);
  }

  public override reset(): void {
    super.reset();
    this.minFrequencyProperty.reset();
    this.isFrozenProperty.reset();
  }

  protected override get isAnalysisPaused(): boolean {
    return this.isFrozenProperty.value;
  }
}
