/**
 * AnalysisPreferencesModel.ts
 *
 * Shared DSP analysis settings (FFT size, LPC order, window function) used by
 * every screen's audio pipeline and exposed in Preferences → Visual.
 */
import { NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { WINDOW_TYPE_VALUES, WindowType } from "../common/model/dsp/WindowFunction.js";

export const DEFAULT_FFT_SIZE = 2048;
export const FFT_SIZE_VALUES = [1024, 2048, 4096] as const;
export const DEFAULT_LPC_ORDER = 12;
export const LPC_ORDER_RANGE = new Range(8, 16);

export class AnalysisPreferencesModel {
  public readonly fftSizeProperty = new NumberProperty(DEFAULT_FFT_SIZE, { validValues: [...FFT_SIZE_VALUES] });
  public readonly lpcOrderProperty = new NumberProperty(DEFAULT_LPC_ORDER, { range: LPC_ORDER_RANGE });
  public readonly windowTypeProperty = new Property<WindowType>(WindowType.HANN, {
    validValues: [...WINDOW_TYPE_VALUES],
  });

  public reset(): void {
    this.fftSizeProperty.reset();
    this.lpcOrderProperty.reset();
    this.windowTypeProperty.reset();
  }
}
