/**
 * WaveComposerPreferencesModel.ts
 *
 * Shared DSP analysis settings (FFT size, LPC order, window function) used by
 * every screen's audio pipeline and exposed in Preferences → Visual.
 */
import { NumberProperty, Property } from "scenerystack/axon";
import { WINDOW_TYPE_VALUES, type WindowType } from "../common/model/dsp/WindowFunction.js";
import { FFT_SIZE_VALUES, LPC_ORDER_RANGE } from "./AnalysisConstants.js";
import waveComposerQueryParameters from "./waveComposerQueryParameters.js";

// Re-exported for backwards compatibility; canonical definitions live in AnalysisConstants.ts.
export { DEFAULT_FFT_SIZE, DEFAULT_LPC_ORDER, FFT_SIZE_VALUES, LPC_ORDER_RANGE } from "./AnalysisConstants.js";

export class WaveComposerPreferencesModel {
  // Initial values come from query parameters (see waveComposerQueryParameters).
  public readonly fftSizeProperty = new NumberProperty(waveComposerQueryParameters.fftSize, {
    validValues: [...FFT_SIZE_VALUES],
  });
  public readonly lpcOrderProperty = new NumberProperty(waveComposerQueryParameters.lpcOrder, {
    range: LPC_ORDER_RANGE,
  });
  public readonly windowTypeProperty = new Property<WindowType>(waveComposerQueryParameters.windowType as WindowType, {
    validValues: [...WINDOW_TYPE_VALUES],
  });

  public reset(): void {
    this.fftSizeProperty.reset();
    this.lpcOrderProperty.reset();
    this.windowTypeProperty.reset();
  }
}
