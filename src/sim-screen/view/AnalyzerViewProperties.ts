/**
 * AnalyzerViewProperties.ts
 *
 * View-only reactive state for the Analyzer screen — display preferences that
 * don't belong in the model (they don't affect the DSP): the spectrogram
 * colormap, which overlays are shown, and the waveform time window. Kept in one
 * place so the control panel and the display nodes share the same Properties and
 * Reset All can restore them.
 */
import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { COLORMAP_NAME_VALUES, type ColormapName } from "../../common/view/Colormaps.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";

export class AnalyzerViewProperties {
  /** Spectrogram colormap. */
  public readonly colormapProperty = new Property<ColormapName>("viridis", {
    validValues: [...COLORMAP_NAME_VALUES],
  });
  /** Show the F0 (pitch) track over the spectrogram. */
  public readonly showF0TrackProperty = new BooleanProperty(true);
  /** Show the F1–F4 formant tracks over the spectrogram. */
  public readonly showFormantTracksProperty = new BooleanProperty(true);
  /** Show the LPC spectral-envelope curve over the spectrum. */
  public readonly showLpcEnvelopeProperty = new BooleanProperty(true);
  /** Show integer-harmonic markers (multiples of F0) over the spectrum. */
  public readonly showHarmonicsProperty = new BooleanProperty(false);
  /** Oscilloscope time window in milliseconds. */
  public readonly timeWindowMsProperty = new NumberProperty(ViewConstants.DEFAULT_TIME_WINDOW_MS, {
    range: ViewConstants.TIME_WINDOW_MS_RANGE,
  });

  public reset(): void {
    this.colormapProperty.reset();
    this.showF0TrackProperty.reset();
    this.showFormantTracksProperty.reset();
    this.showLpcEnvelopeProperty.reset();
    this.showHarmonicsProperty.reset();
    this.timeWindowMsProperty.reset();
  }
}
