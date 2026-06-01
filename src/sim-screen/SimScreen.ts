/**
 * SimScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * For multi-screen simulations, duplicate this file (e.g. IntroScreen.ts,
 * LabScreen.ts) and add each screen to the screens array in src/main.ts.
 */
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import SimColors from "../SimColors.js";
import { SimModel } from "./model/SimModel.js";
import { SimScreenView } from "./view/SimScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SimScreenOptions = ScreenOptions & { tandem: Tandem };

export class SimScreen extends Screen<SimModel, SimScreenView> {
  public constructor(options: SimScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new SimModel(),
      // View factory — receives the model instance
      (model) =>
        new SimScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      {
        backgroundColorProperty: SimColors.backgroundColorProperty,
        ...options,
      },
    );
  }
}
