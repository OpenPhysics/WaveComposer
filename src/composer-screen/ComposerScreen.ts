/**
 * ComposerScreen.ts
 *
 * The wave-composition screen: superpose sinusoids, explore beats, phase
 * cancellation, harmonic series, and standing-wave modes.
 */
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import SimColors from "../SimColors.js";
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
      {
        backgroundColorProperty: SimColors.backgroundColorProperty,
        ...options,
      },
    );
  }
}
