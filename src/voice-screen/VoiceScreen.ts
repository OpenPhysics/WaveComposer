/**
 * VoiceScreen.ts
 *
 * The second screen (Voice & Vowels). It shares the single SimModel created in
 * main.ts with the Analyzer screen, so both screens visualize the same live
 * analysis pipeline.
 */
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import type { SimModel } from "../model/SimModel.js";
import SimColors from "../SimColors.js";
import { VoiceScreenView } from "./view/VoiceScreenView.js";

type VoiceScreenOptions = ScreenOptions & { tandem: Tandem };

export class VoiceScreen extends Screen<SimModel, VoiceScreenView> {
  public constructor(model: SimModel, options: VoiceScreenOptions) {
    super(
      () => model,
      (sharedModel) =>
        new VoiceScreenView(sharedModel, {
          tandem: options.tandem.createTandem("view"),
        }),
      {
        backgroundColorProperty: SimColors.backgroundColorProperty,
        ...options,
      },
    );
  }
}
