/**
 * AnalyzerScreen.ts
 *
 * The real-time analysis screen: spectrogram, spectrum with LPC envelope, and
 * waveform of the live microphone or preset audio source.
 */
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { linkAnalysisModelToScreenActive } from "../common/model/BaseAnalysisModel.js";
import { WaveComposerKeyboardHelpContent } from "../common/view/WaveComposerKeyboardHelpContent.js";
import WaveComposerColors from "../WaveComposerColors.js";
import type { AnalyzerModel } from "./model/AnalyzerModel.js";
import { AnalyzerScreenView } from "./view/AnalyzerScreenView.js";
import type { AnalyzerViewProperties } from "./view/AnalyzerViewProperties.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type AnalyzerScreenOptions = ScreenOptions & { tandem: Tandem; viewProperties: AnalyzerViewProperties };

export class AnalyzerScreen extends Screen<AnalyzerModel, AnalyzerScreenView> {
  public constructor(model: AnalyzerModel, options: AnalyzerScreenOptions) {
    super(
      () => model,
      (screenModel) =>
        new AnalyzerScreenView(screenModel, options.viewProperties, {
          tandem: options.tandem.createTandem("view"),
        }),
      {
        backgroundColorProperty: WaveComposerColors.backgroundColorProperty,
        createKeyboardHelpNode: () => new WaveComposerKeyboardHelpContent(),
        ...options,
      },
    );
    linkAnalysisModelToScreenActive(this.activeProperty, model);
  }
}
