/**
 * VoiceScreen.ts
 *
 * The second screen (Voice & Vowels). It owns an independent VoiceModel so its
 * source selection, microphone state, recordings, and analyzer outputs stay
 * isolated from the Analyzer screen.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { linkAnalysisModelToScreenActive } from "../common/model/BaseAnalysisModel.js";
import { WaveComposerKeyboardHelpContent } from "../common/view/WaveComposerKeyboardHelpContent.js";
import { createVoiceIcon } from "../common/WaveComposerScreenIcons.js";
import WaveComposerColors from "../WaveComposerColors.js";
import type { VoiceModel } from "./model/VoiceModel.js";
import { VoiceScreenView } from "./view/VoiceScreenView.js";

type VoiceScreenOptions = ScreenOptions & { tandem: Tandem };

export class VoiceScreen extends Screen<VoiceModel, VoiceScreenView> {
  public constructor(model: VoiceModel, options: VoiceScreenOptions) {
    super(
      () => model,
      (screenModel) =>
        new VoiceScreenView(screenModel, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<VoiceScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: WaveComposerColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new WaveComposerKeyboardHelpContent(),
          homeScreenIcon: createVoiceIcon(),
          navigationBarIcon: createVoiceIcon(),
        },
        options,
      ),
    );
    linkAnalysisModelToScreenActive(this.activeProperty, model);
  }
}
