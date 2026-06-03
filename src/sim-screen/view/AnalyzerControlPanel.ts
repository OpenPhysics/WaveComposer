/**
 * AnalyzerControlPanel.ts
 *
 * All Analyzer-screen controls: audio source (microphone / demo) with a
 * start/stop button, a freeze toggle, the analysis settings (FFT size, window,
 * LPC order, max frequency), the spectrogram colormap, and overlay-visibility
 * checkboxes. Analysis settings bind to the model; display settings bind to the
 * AnalyzerViewProperties.
 */
import { DerivedProperty, type NumberProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, Range } from "scenerystack/dot";
import { HBox, Line, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import {
  AquaRadioButtonGroup,
  ButtonNode,
  Checkbox,
  ComboBox,
  type ComboBoxOptions,
  Panel,
  TextPushButton,
} from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import { WINDOW_TYPE_VALUES, type WindowType } from "../../model/dsp/WindowFunction.js";
import { AudioSource, type SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { COLORMAP_NAME_VALUES, type ColormapName } from "../../view/Colormaps.js";
import { ViewConstants } from "../../view/ViewConstants.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";

const FFT_SIZE_OPTIONS = [1024, 2048, 4096];
const MAX_FREQUENCY_RANGE = new Range(2000, 10000);
const LPC_ORDER_RANGE = new Range(8, 24);
const PANEL_WIDTH = 232;

export class AnalyzerControlPanel extends Panel {
  public constructor(model: SimModel, viewProperties: AnalyzerViewProperties, listParent: Node) {
    const controls = StringManager.getInstance().getControlStrings();
    const panelStrings = StringManager.getInstance().getPanelStrings();
    const windowStrings = StringManager.getInstance().getWindowStrings();
    const colormapStrings = StringManager.getInstance().getColormapStrings();

    // ── Source + start/stop + freeze ────────────────────────────────────────
    const sourceGroup = new AquaRadioButtonGroup(
      model.audioSourceProperty,
      [
        { value: AudioSource.MICROPHONE, createNode: () => controlText(controls.microphoneStringProperty) },
        { value: AudioSource.DEMO, createNode: () => controlText(controls.demoStringProperty) },
      ],
      { orientation: "horizontal", spacing: 14, radioButtonOptions: { radius: 7 }, tandem: Tandem.OPT_OUT },
    );

    const startStopLabel = new DerivedProperty(
      [model.isListeningProperty, controls.startMicrophoneStringProperty, controls.stopMicrophoneStringProperty],
      (listening, start, stop) => (listening ? stop : start),
    );
    const startStopButton = new TextPushButton(startStopLabel, {
      font: ViewConstants.CONTROL_FONT,
      baseColor: SimColors.buttonFillColorProperty,
      disabledColor: SimColors.buttonDisabledFillColorProperty,
      textFill: SimColors.textColorProperty,
      buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
      maxTextWidth: PANEL_WIDTH - 20,
      enabledProperty: new DerivedProperty([model.audioSourceProperty], (s) => s === AudioSource.MICROPHONE),
      listener: () => {
        if (model.isListeningProperty.value) {
          model.stopListening();
        } else {
          model.startListening().catch(() => undefined);
        }
      },
      tandem: Tandem.OPT_OUT,
    });

    const freezeCheckbox = makeCheckbox(model.isFrozenProperty, controls.freezeStringProperty);

    // ── Analysis settings ───────────────────────────────────────────────────
    // Shared combo-box styling: dark fill with light item text in default mode
    // (the sun default is white, which leaves the light labels unreadable).
    const comboBoxOptions: ComboBoxOptions = {
      buttonFill: SimColors.buttonFillColorProperty,
      buttonStroke: SimColors.panelBorderColorProperty,
      listFill: SimColors.buttonFillColorProperty,
      listStroke: SimColors.panelBorderColorProperty,
      highlightFill: SimColors.comboBoxHighlightColorProperty,
      tandem: Tandem.OPT_OUT,
    };

    const fftCombo = new ComboBox(
      model.fftSizeProperty,
      FFT_SIZE_OPTIONS.map((size) => ({ value: size, createNode: () => controlText(`${size}`) })),
      listParent,
      comboBoxOptions,
    );

    const windowLabels: Record<WindowType, TReadOnlyProperty<string>> = {
      hann: windowStrings.hannStringProperty,
      hamming: windowStrings.hammingStringProperty,
      blackman: windowStrings.blackmanStringProperty,
    };
    const windowCombo = new ComboBox(
      model.windowTypeProperty,
      WINDOW_TYPE_VALUES.map((type) => ({ value: type, createNode: () => controlText(windowLabels[type]) })),
      listParent,
      comboBoxOptions,
    );

    const colormapLabels: Record<ColormapName, TReadOnlyProperty<string>> = {
      viridis: colormapStrings.viridisStringProperty,
      inferno: colormapStrings.infernoStringProperty,
      magma: colormapStrings.magmaStringProperty,
      grayscale: colormapStrings.grayscaleStringProperty,
    };
    const colormapCombo = new ComboBox(
      viewProperties.colormapProperty,
      COLORMAP_NAME_VALUES.map((name) => ({ value: name, createNode: () => controlText(colormapLabels[name]) })),
      listParent,
      comboBoxOptions,
    );

    const lpcControl = makeNumberControl(controls.lpcOrderStringProperty, model.lpcOrderProperty, LPC_ORDER_RANGE, 1);
    const maxFreqControl = makeNumberControl(
      controls.maxFrequencyStringProperty,
      model.maxFrequencyProperty,
      MAX_FREQUENCY_RANGE,
      500,
      " Hz",
    );

    // ── Overlay visibility ──────────────────────────────────────────────────
    const overlays = new VBox({
      align: "left",
      spacing: 4,
      children: [
        sectionLabel(controls.overlaysStringProperty),
        makeCheckbox(viewProperties.showF0TrackProperty, controls.showF0StringProperty),
        makeCheckbox(viewProperties.showFormantTracksProperty, controls.showFormantsStringProperty),
        makeCheckbox(viewProperties.showLpcEnvelopeProperty, controls.showLpcEnvelopeStringProperty),
        makeCheckbox(viewProperties.showHarmonicsProperty, controls.showHarmonicsStringProperty),
      ],
    });

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(panelStrings.controlsStringProperty, {
          font: ViewConstants.PANEL_TITLE_FONT,
          fill: SimColors.textColorProperty,
        }),
        sectionLabel(controls.sourceStringProperty),
        sourceGroup,
        startStopButton,
        freezeCheckbox,
        divider(),
        labeled(controls.fftSizeStringProperty, fftCombo),
        labeled(controls.windowStringProperty, windowCombo),
        lpcControl,
        maxFreqControl,
        divider(),
        labeled(controls.colormapStringProperty, colormapCombo),
        overlays,
      ],
    });

    super(content, {
      fill: SimColors.panelBackgroundColorProperty,
      stroke: SimColors.panelBorderColorProperty,
      xMargin: ViewConstants.PANEL_X_MARGIN,
      yMargin: ViewConstants.PANEL_Y_MARGIN,
      cornerRadius: ViewConstants.CORNER_RADIUS,
      align: "left",
    });
  }
}

function controlText(content: string | TReadOnlyProperty<string>): Node {
  return new Text(content, { font: ViewConstants.CONTROL_FONT, fill: SimColors.textColorProperty });
}

function sectionLabel(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, { font: ViewConstants.LABEL_FONT, fill: SimColors.textColorProperty });
}

/** A label to the left of a control (used for ComboBoxes, which lack a built-in label). */
function labeled(labelProperty: TReadOnlyProperty<string>, control: Node): Node {
  return new HBox({ spacing: 6, children: [controlText(labelProperty), control] });
}

function divider(): Node {
  return new Line(0, 0, PANEL_WIDTH, 0, { stroke: SimColors.panelBorderColorProperty, lineWidth: 1 });
}

function makeCheckbox(property: Property<boolean>, labelProperty: TReadOnlyProperty<string>): Checkbox {
  return new Checkbox(property, controlText(labelProperty), {
    boxWidth: 16,
    checkboxColor: SimColors.textColorProperty,
    checkboxColorBackground: SimColors.chartBackgroundColorProperty,
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
    titleNodeOptions: { font: ViewConstants.LABEL_FONT, fill: SimColors.textColorProperty },
    numberDisplayOptions: { valuePattern: `{{value}}${unit}`, textOptions: { font: ViewConstants.CONTROL_FONT } },
    sliderOptions: { trackSize: new Dimension2(120, 3), thumbSize: new Dimension2(13, 22) },
    tandem: Tandem.OPT_OUT,
  });
}
