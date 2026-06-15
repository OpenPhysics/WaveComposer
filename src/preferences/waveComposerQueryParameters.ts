/**
 * waveComposerQueryParameters.ts
 *
 * Sim-specific startup query parameters for WaveComposer. These provide the
 * initial values for the shared DSP-analysis preferences in
 * WaveComposerPreferencesModel. Public-facing parameters set `public: true`.
 *
 * Usage: append e.g. `?fftSize=4096&lpcOrder=14` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { WINDOW_TYPE_VALUES, WindowType } from "../common/model/dsp/WindowFunction.js";
import WaveComposerNamespace from "../WaveComposerNamespace.js";
import { DEFAULT_FFT_SIZE, DEFAULT_LPC_ORDER, FFT_SIZE_VALUES, LPC_ORDER_RANGE } from "./AnalysisConstants.js";

const waveComposerQueryParameters = QueryStringMachine.getAll({
  /** FFT window size used by the analysis pipeline. */
  fftSize: {
    type: "number" as const,
    defaultValue: DEFAULT_FFT_SIZE,
    validValues: [...FFT_SIZE_VALUES],
    public: true,
  },

  /** Linear-prediction (LPC) order. */
  lpcOrder: {
    type: "number" as const,
    defaultValue: DEFAULT_LPC_ORDER,
    public: true,
    isValidValue: (value: number) =>
      Number.isInteger(value) && value >= LPC_ORDER_RANGE.min && value <= LPC_ORDER_RANGE.max,
  },

  /** Window function applied before the FFT. */
  windowType: {
    type: "string",
    defaultValue: WindowType.HANN,
    validValues: [...WINDOW_TYPE_VALUES],
    public: true,
  },
});

WaveComposerNamespace.register("waveComposerQueryParameters", waveComposerQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default waveComposerQueryParameters;
