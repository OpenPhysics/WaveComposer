/**
 * ComposerReadoutPanel.ts
 *
 * Live readouts for the wave-composition screen: fundamental, beat rate, active
 * partial count, and a short pedagogical caption.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { GridBox, type Node, Text, VBox } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import type { ComposerModel } from "../model/ComposerModel.js";

const EMPTY = "—";

export class ComposerReadoutPanel extends Panel {
  public constructor(model: ComposerModel) {
    const readout = StringManager.getInstance().getReadoutStrings();
    const composerStrings = StringManager.getInstance().getComposerScreenStrings();
    const panelStrings = StringManager.getInstance().getPanelStrings();

    const partialDependencies = model.composition.partials.flatMap((partial) => [
      partial.frequencyProperty,
      partial.amplitudeProperty,
      partial.enabledProperty,
    ]);

    const fundamentalValue = new DerivedProperty([model.f0Property], (f0) => (f0 > 0 ? `${Math.round(f0)} Hz` : EMPTY));
    const beatValue = DerivedProperty.deriveAny(partialDependencies, () => {
      const beatHz = model.getBeatRateHz();
      return beatHz > 0 ? `${toFixed(beatHz, 1)} Hz` : EMPTY;
    });
    const partialCountValue = DerivedProperty.deriveAny(partialDependencies, () => {
      const count = model.composition.partials.filter(
        (partial) => partial.enabledProperty.value && partial.frequencyProperty.value > 0,
      ).length;
      return `${count}`;
    });

    const grid = new GridBox({
      xSpacing: 16,
      ySpacing: 7,
      xAlign: "left",
      rows: [
        [label(readout.pitchStringProperty), value(fundamentalValue)],
        [label(composerStrings.beatRateStringProperty), value(beatValue)],
        [label(composerStrings.activePartialsStringProperty), value(partialCountValue)],
      ],
    });

    const caption = new Text(composerStrings.introStringProperty, {
      font: ViewConstants.LABEL_FONT,
      fill: WaveComposerColors.textColorProperty,
      maxWidth: 220,
    });

    const content = new VBox({
      align: "left",
      spacing: 10,
      children: [
        new Text(panelStrings.measurementsStringProperty, {
          font: ViewConstants.PANEL_TITLE_FONT,
          fill: WaveComposerColors.textColorProperty,
        }),
        grid,
        caption,
      ],
    });

    super(content, {
      fill: WaveComposerColors.panelBackgroundColorProperty,
      stroke: WaveComposerColors.panelBorderColorProperty,
      xMargin: ViewConstants.PANEL_X_MARGIN,
      yMargin: ViewConstants.PANEL_Y_MARGIN,
      cornerRadius: ViewConstants.CORNER_RADIUS,
      align: "left",
    });
  }
}

function label(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, {
    font: ViewConstants.READOUT_LABEL_FONT,
    fill: WaveComposerColors.textColorProperty,
  });
}

function value(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, {
    font: ViewConstants.READOUT_VALUE_FONT,
    fill: WaveComposerColors.accentColorProperty,
  });
}
