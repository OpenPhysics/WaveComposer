/**
 * ComposerViewProperties.ts
 *
 * View-only state for the Composer screen. Overlay toggles default on so
 * harmonic pedagogy is visible immediately.
 */
import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import type { ChartOverlayProperties } from "../../common/view/ChartOverlayProperties.js";
import { WaveComposerConstants } from "../../common/WaveComposerConstants.js";

export class ComposerViewProperties implements ChartOverlayProperties {
  public readonly showLpcEnvelopeProperty = new BooleanProperty(false);
  public readonly showHarmonicsProperty = new BooleanProperty(true);
  public readonly showPipeOverlayProperty = new BooleanProperty(true);
  public readonly showModeNumbersProperty = new BooleanProperty(true);
  public readonly timeWindowMsProperty = new NumberProperty(80, {
    range: WaveComposerConstants.TIME_WINDOW_MS_RANGE,
  });

  public reset(): void {
    this.showLpcEnvelopeProperty.reset();
    this.showHarmonicsProperty.reset();
    this.showPipeOverlayProperty.reset();
    this.showModeNumbersProperty.reset();
    this.timeWindowMsProperty.reset();
  }
}
