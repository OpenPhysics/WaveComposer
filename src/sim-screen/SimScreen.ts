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
import type { AnalyzerModel } from "./model/AnalyzerModel.js";
import type { AnalyzerViewProperties } from "./view/AnalyzerViewProperties.js";
import { SimScreenView } from "./view/SimScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SimScreenOptions = ScreenOptions & { tandem: Tandem; viewProperties: AnalyzerViewProperties };

export class SimScreen extends Screen<AnalyzerModel, SimScreenView> {
  public constructor(model: AnalyzerModel, options: SimScreenOptions) {
    super(
      () => model,
      (screenModel) =>
        new SimScreenView(screenModel, options.viewProperties, {
          tandem: options.tandem.createTandem("view"),
        }),
      {
        backgroundColorProperty: SimColors.backgroundColorProperty,
        ...options,
      },
    );
  }
}
