/**
 * ComposerControlPanel.ts
 *
 * Playback, analysis settings, overlay toggles, and boundary-model controls
 * for the Composer screen.
 */
import type { NumberProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { Line, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { Checkbox, ComboBox, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { PipeBoundary, PipeBoundaryValues } from "../../common/model/PipeBoundary.js";
import type { ChartOverlayProperties } from "../../common/view/ChartOverlayProperties.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import type { ComposerModel } from "../model/ComposerModel.js";

const MAX_FREQUENCY_RANGE = new Range(500, 3000);
const PANEL_WIDTH = 232;

export class ComposerControlPanel extends Panel {
  public constructor(model: ComposerModel, viewProperties: ChartOverlayProperties, listParent: Node) {
    const controls = StringManager.getInstance().getControlStrings();
    const panelStrings = StringManager.getInstance().getPanelStrings();
    const physics = StringManager.getInstance().getPhysicsStrings();

    const pipeBoundaryLabels: Record<PipeBoundary, TReadOnlyProperty<string>> = {
      [PipeBoundary.NONE]: physics.noneStringProperty,
      [PipeBoundary.STRING]: physics.stringStringProperty,
      [PipeBoundary.OPEN_PIPE]: physics.openPipeStringProperty,
      [PipeBoundary.CLOSED_PIPE]: physics.closedPipeStringProperty,
    };

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(panelStrings.controlsStringProperty, {
          font: ViewConstants.PANEL_TITLE_FONT,
          fill: WaveComposerColors.textColorProperty,
        }),
        makeCheckbox(model.isAudioEnabledProperty, controls.playAudioStringProperty),
        makeCheckbox(model.isFrozenProperty, controls.freezeStringProperty),
        divider(),
        makeNumberControl(
          controls.maxFrequencyStringProperty,
          model.maxFrequencyProperty,
          MAX_FREQUENCY_RANGE,
          500,
          " Hz",
        ),
        divider(),
        sectionLabel(controls.overlaysStringProperty),
        makeCheckbox(viewProperties.showHarmonicsProperty, controls.showHarmonicsStringProperty),
        makeCheckbox(viewProperties.showPipeOverlayProperty, controls.showPipeOverlayStringProperty),
        makeCheckbox(viewProperties.showModeNumbersProperty, controls.showModeNumbersStringProperty),
        sectionLabel(controls.pipeBoundaryStringProperty),
        new ComboBox(
          model.pipeBoundaryProperty,
          PipeBoundaryValues.map((value) => ({
            value,
            createNode: () => controlText(pipeBoundaryLabels[value]),
          })),
          listParent,
          {
            buttonFill: WaveComposerColors.buttonFillColorProperty,
            buttonStroke: WaveComposerColors.panelBorderColorProperty,
            listFill: WaveComposerColors.buttonFillColorProperty,
            listStroke: WaveComposerColors.panelBorderColorProperty,
            highlightFill: WaveComposerColors.comboBoxHighlightColorProperty,
            tandem: Tandem.OPT_OUT,
          },
        ),
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

function controlText(content: string | TReadOnlyProperty<string>): Node {
  return new Text(content, { font: ViewConstants.CONTROL_FONT, fill: WaveComposerColors.textColorProperty });
}

function sectionLabel(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: ViewConstants.LABEL_FONT, fill: WaveComposerColors.textColorProperty });
}

function divider(): Node {
  return new Line(0, 0, PANEL_WIDTH, 0, { stroke: WaveComposerColors.panelBorderColorProperty, lineWidth: 1 });
}

function makeCheckbox(property: Property<boolean>, labelProperty: TReadOnlyProperty<string>): Checkbox {
  return new Checkbox(property, controlText(labelProperty), {
    boxWidth: 16,
    checkboxColor: WaveComposerColors.textColorProperty,
    checkboxColorBackground: WaveComposerColors.chartBackgroundColorProperty,
    tandem: Tandem.OPT_OUT,
  });
}

function makeNumberControl(
  title: TReadOnlyProperty<string>,
  property: NumberProperty,
  range: Range,
  delta: number,
  unit = "",
): NumberControl {
  return new NumberControl(title, property, range, {
    delta,
    titleNodeOptions: { font: ViewConstants.LABEL_FONT, fill: WaveComposerColors.textColorProperty },
    numberDisplayOptions: { valuePattern: `{{value}}${unit}`, textOptions: { font: ViewConstants.CONTROL_FONT } },
    sliderOptions: { trackSize: new Dimension2(120, 3), thumbSize: new Dimension2(13, 22) },
    tandem: Tandem.OPT_OUT,
  });
}
