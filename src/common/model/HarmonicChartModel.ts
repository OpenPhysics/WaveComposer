/**
 * HarmonicChartModel.ts
 *
 * Shared model surface for waveform, spectrum, and standing-wave chart nodes on
 * screens that visualize harmonics and wave superposition.
 */
import type { NumberProperty, Property } from "scenerystack/axon";
import type { BaseAnalysisModel } from "./BaseAnalysisModel.js";
import type { PipeBoundary } from "./PipeBoundary.js";

export type StandingWaveMode = {
  readonly modeNumber: number;
  readonly amplitude: number;
};

export type HarmonicChartModel = BaseAnalysisModel & {
  readonly minFrequencyProperty: NumberProperty;
  readonly pipeBoundaryProperty: Property<PipeBoundary>;
  getFundamentalHz(): number;
  getStandingWaveModes(): readonly StandingWaveMode[];
};

/** Models that can synthesize a longer waveform for the oscilloscope time window. */
export type DisplayWaveformModel = {
  fillDisplayWaveform(out: Float32Array): void;
};

export function hasDisplayWaveform(model: BaseAnalysisModel): model is BaseAnalysisModel & DisplayWaveformModel {
  return "fillDisplayWaveform" in model && typeof model.fillDisplayWaveform === "function";
}
