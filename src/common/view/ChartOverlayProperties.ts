/**
 * ChartOverlayProperties.ts
 *
 * View-only overlay toggles shared by Analyzer and Composer chart nodes.
 */
import type { BooleanProperty, NumberProperty } from "scenerystack/axon";

export type ChartOverlayProperties = {
  readonly showLpcEnvelopeProperty: BooleanProperty;
  readonly showHarmonicsProperty: BooleanProperty;
  readonly showPipeOverlayProperty: BooleanProperty;
  readonly showModeNumbersProperty: BooleanProperty;
  readonly timeWindowMsProperty: NumberProperty;
};
