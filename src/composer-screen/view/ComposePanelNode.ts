/**
 * ComposePanelNode.ts
 *
 * Partial controls and pedagogical presets for the Composer screen.
 */
import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { GridBox, Line, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { Checkbox, ComboBox, Panel } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { ComposePreset, ComposePresetValues } from "../../common/model/CompositionState.js";
import { WaveComposerConstants } from "../../common/WaveComposerConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import type { ComposerModel } from "../model/ComposerModel.js";

const PARTIAL_COLUMN_WIDTH = 168;
const PARTIAL_COLUMN_SPACING = 8;
const PANEL_WIDTH = PARTIAL_COLUMN_WIDTH * 2 + PARTIAL_COLUMN_SPACING;
const SLIDER_TRACK_WIDTH = PARTIAL_COLUMN_WIDTH - 28;
const SLIDER_TRACK_HEIGHT = 2;
const SLIDER_THUMB_SIZE = new Dimension2(10, 16);
const FREQUENCY_RANGE = new Range(50, 2000);
const AMPLITUDE_RANGE = new Range(0, 1);
const PHASE_RANGE = new Range(0, 2 * Math.PI);

export class ComposePanelNode extends Panel {
  public constructor(model: ComposerModel, listParent: Node) {
    const compose = StringManager.getInstance().getComposeStrings();

    const presetLabels: Record<ComposePreset, TReadOnlyProperty<string>> = {
      [ComposePreset.CUSTOM]: compose.customStringProperty,
      [ComposePreset.PURE_TONE]: compose.pureToneStringProperty,
      [ComposePreset.OCTAVE]: compose.octaveStringProperty,
      [ComposePreset.MAJOR_TRIAD]: compose.majorTriadStringProperty,
      [ComposePreset.BEATS]: compose.beatsStringProperty,
      [ComposePreset.PHASE_CANCEL]: compose.phaseCancelStringProperty,
      [ComposePreset.PHASE_QUADRATURE]: compose.phaseQuadratureStringProperty,
      [ComposePreset.HARMONIC_SERIES]: compose.harmonicSeriesStringProperty,
      [ComposePreset.SAWTOOTH_ISH]: compose.sawtoothIshStringProperty,
      [ComposePreset.SQUARE_ISH]: compose.squareIshStringProperty,
      [ComposePreset.TRIANGLE_ISH]: compose.triangleIshStringProperty,
    };

    const presetCombo = new ComboBox(
      model.composition.presetProperty,
      ComposePresetValues.map((value) => ({
        value,
        createNode: () => controlText(presetLabels[value]),
      })),
      listParent,
      {
        buttonFill: WaveComposerColors.buttonFillColorProperty,
        buttonStroke: WaveComposerColors.panelBorderColorProperty,
        listFill: WaveComposerColors.buttonFillColorProperty,
        listStroke: WaveComposerColors.panelBorderColorProperty,
        highlightFill: WaveComposerColors.comboBoxHighlightColorProperty,
        accessibleName: compose.presetStringProperty,
        tandem: Tandem.OPT_OUT,
      },
    );
    model.composition.presetProperty.lazyLink((preset) => {
      if (preset !== ComposePreset.CUSTOM) {
        model.composition.applyPreset(preset);
      }
    });

    const partialSections: Node[] = [];
    for (let index = 0; index < model.composition.partials.length; index++) {
      const partial = model.composition.partials[index];
      if (!partial) {
        continue;
      }
      const label = new DerivedProperty([compose.partialStringProperty], (text) => `${text} ${index + 1}`);
      partial.frequencyProperty.lazyLink(() => model.composition.markCustom());
      partial.amplitudeProperty.lazyLink(() => model.composition.markCustom());
      partial.phaseProperty.lazyLink(() => model.composition.markCustom());
      partial.enabledProperty.lazyLink(() => model.composition.markCustom());

      partialSections.push(
        new VBox({
          align: "left",
          spacing: 2,
          children: [
            sectionLabel(label),
            makeCheckbox(partial.enabledProperty, compose.enabledStringProperty),
            makeNumberControl(compose.frequencyStringProperty, partial.frequencyProperty, FREQUENCY_RANGE, 1, " Hz"),
            makeNumberControl(compose.amplitudeStringProperty, partial.amplitudeProperty, AMPLITUDE_RANGE, 0.05, "", 2),
            makeNumberControl(compose.phaseStringProperty, partial.phaseProperty, PHASE_RANGE, 0.1, " rad", 2),
          ],
        }),
      );
    }

    const partialGrid = new GridBox({
      xSpacing: PARTIAL_COLUMN_SPACING,
      ySpacing: 4,
      xAlign: "left",
      rows: [partialSections.slice(0, 2), partialSections.slice(2, 4)],
    });

    const content = new VBox({
      align: "left",
      spacing: 6,
      children: [
        new Text(compose.titleStringProperty, {
          font: WaveComposerConstants.PANEL_TITLE_FONT,
          fill: WaveComposerColors.textColorProperty,
        }),
        sectionLabel(compose.presetStringProperty),
        presetCombo,
        divider(),
        partialGrid,
      ],
    });

    super(content, {
      fill: WaveComposerColors.panelBackgroundColorProperty,
      stroke: WaveComposerColors.panelBorderColorProperty,
      xMargin: WaveComposerConstants.PANEL_X_MARGIN,
      yMargin: WaveComposerConstants.PANEL_Y_MARGIN,
      cornerRadius: WaveComposerConstants.CORNER_RADIUS,
      align: "left",
    });
  }
}

function controlText(content: string | TReadOnlyProperty<string>): Node {
  return new Text(content, { font: WaveComposerConstants.CONTROL_FONT, fill: WaveComposerColors.textColorProperty });
}

function sectionLabel(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, {
    font: WaveComposerConstants.LABEL_FONT,
    fill: WaveComposerColors.textColorProperty,
  });
}

function divider(): Node {
  return new Line(0, 0, PANEL_WIDTH, 0, { stroke: WaveComposerColors.panelBorderColorProperty, lineWidth: 1 });
}

function makeCheckbox(
  property: import("scenerystack/axon").Property<boolean>,
  labelProperty: TReadOnlyProperty<string>,
): Checkbox {
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
  decimalPlaces = 0,
): NumberControl {
  return new NumberControl(title, property, range, {
    delta,
    layoutFunction: NumberControl.createLayoutFunction1({
      ySpacing: 2,
      titleXSpacing: 4,
      arrowButtonsXSpacing: 6,
    }),
    titleNodeOptions: { font: WaveComposerConstants.LABEL_FONT, fill: WaveComposerColors.textColorProperty },
    numberDisplayOptions: {
      valuePattern: `{{value}}${unit}`,
      decimalPlaces,
      textOptions: { font: WaveComposerConstants.CONTROL_FONT },
    },
    arrowButtonOptions: { scale: 0.72 },
    sliderOptions: {
      trackSize: new Dimension2(SLIDER_TRACK_WIDTH, SLIDER_TRACK_HEIGHT),
      thumbSize: SLIDER_THUMB_SIZE,
    },
    tandem: Tandem.OPT_OUT,
  });
}
