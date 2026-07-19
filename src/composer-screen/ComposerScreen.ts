/**
 * ComposerScreen.ts
 *
 * The wave-composition screen: superpose sinusoids, explore beats, phase
 * cancellation, harmonic series, and standing-wave modes.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { linkAnalysisModelToScreenActive } from "../common/model/BaseAnalysisModel.js";
import { WaveComposerKeyboardHelpContent } from "../common/view/WaveComposerKeyboardHelpContent.js";
import { createComposerIcon } from "../common/WaveComposerScreenIcons.js";
import WaveComposerColors from "../WaveComposerColors.js";
import type { ComposerModel } from "./model/ComposerModel.js";
import { ComposerScreenView } from "./view/ComposerScreenView.js";
import type { ComposerViewProperties } from "./view/ComposerViewProperties.js";

type ComposerScreenOptions = ScreenOptions & { tandem: Tandem; viewProperties: ComposerViewProperties };

export class ComposerScreen extends Screen<ComposerModel, ComposerScreenView> {
  public constructor(model: ComposerModel, options: ComposerScreenOptions) {
    super(
      () => model,
      (screenModel) =>
        new ComposerScreenView(screenModel, options.viewProperties, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ComposerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: WaveComposerColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new WaveComposerKeyboardHelpContent(),
          homeScreenIcon: createComposerIcon(),
          navigationBarIcon: createComposerIcon(),
        },
        options,
      ),
    );
    linkAnalysisModelToScreenActive(this.activeProperty, model);
  }
}
