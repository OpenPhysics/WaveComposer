/**
 * ComposerModel.ts
 *
 * Dedicated wave-composition screen model. Synthesizes a user-defined sum of up to
 * four sinusoids and feeds the shared DSP pipeline for live waveform, spectrum,
 * and standing-wave displays.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { createComposableGenerator, createComposableSource } from "../../common/model/audio/ComposableFrameSource.js";
import { BaseAnalysisModel } from "../../common/model/BaseAnalysisModel.js";
import { COMPOSE_SOURCE_ID, CompositionState } from "../../common/model/CompositionState.js";
import type { HarmonicChartModel, StandingWaveMode } from "../../common/model/HarmonicChartModel.js";
import { createPipeBoundaryProperty, PipeBoundary } from "../../common/model/PipeBoundary.js";
import type { WaveComposerPreferencesModel } from "../../preferences/WaveComposerPreferencesModel.js";

const DEFAULT_MIN_FREQUENCY_HZ = 0;
const FREQUENCY_RANGE = new Range(0, 22050);

export class ComposerModel extends BaseAnalysisModel implements HarmonicChartModel {
  public readonly minFrequencyProperty = new NumberProperty(DEFAULT_MIN_FREQUENCY_HZ, { range: FREQUENCY_RANGE });
  public readonly isFrozenProperty = new BooleanProperty(false);
  public readonly composition = new CompositionState();
  public readonly pipeBoundaryProperty = createPipeBoundaryProperty(PipeBoundary.STRING);
  private readonly displayGenerator = createComposableGenerator(() => this.composition.getPartials());

  public constructor(analysisPreferences: WaveComposerPreferencesModel) {
    super([], analysisPreferences, { includeMicrophone: false });
    this.registerAdditionalSource(
      COMPOSE_SOURCE_ID,
      createComposableSource(() => this.composition.getPartials(), analysisPreferences.fftSizeProperty.value),
    );
    this.audioSourceProperty.value = COMPOSE_SOURCE_ID;
  }

  protected override getAdditionalSourceIds(): string[] {
    return [COMPOSE_SOURCE_ID];
  }

  public override getSourceValues(): string[] {
    return [COMPOSE_SOURCE_ID];
  }

  public override reset(): void {
    super.reset();
    this.minFrequencyProperty.reset();
    this.isFrozenProperty.reset();
    this.composition.reset();
    this.pipeBoundaryProperty.reset();
    this.audioSourceProperty.value = COMPOSE_SOURCE_ID;
  }

  /** Lowest active partial frequency (the fundamental), or 0 if none are active. */
  public getFundamentalHz(): number {
    let fundamental = 0;
    for (const partial of this.composition.partials) {
      const frequency = partial.frequencyProperty.value;
      if (partial.enabledProperty.value && frequency > 0 && (fundamental === 0 || frequency < fundamental)) {
        fundamental = frequency;
      }
    }
    return fundamental;
  }

  public getStandingWaveModes(): readonly StandingWaveMode[] {
    return this.composition.partials
      .map((partial, index) => ({
        modeNumber: index + 1,
        amplitude: partial.enabledProperty.value ? partial.amplitudeProperty.value : 0,
      }))
      .filter((mode) => mode.amplitude > 0);
  }

  /** Beat rate (Hz) when exactly two close partials are active; otherwise 0. */
  public getBeatRateHz(): number {
    const frequencies = this.composition.partials
      .filter((p) => p.enabledProperty.value && p.frequencyProperty.value > 0)
      .map((p) => p.frequencyProperty.value)
      .sort((a, b) => a - b);
    if (frequencies.length !== 2) {
      return 0;
    }
    const low = frequencies[0] ?? 0;
    const high = frequencies[1] ?? 0;
    return Math.abs(high - low);
  }

  protected override get isAnalysisPaused(): boolean {
    return this.isFrozenProperty.value;
  }

  /**
   * Fills `out` with a phase-continuous sum of the enabled partials. Used by the
   * oscilloscope so the displayed time window is not capped at one FFT frame.
   */
  public fillDisplayWaveform(out: Float32Array): void {
    this.displayGenerator(out, this.sampleRateProperty.value, this.getSourcePlaybackTimeS(COMPOSE_SOURCE_ID));
  }
}
