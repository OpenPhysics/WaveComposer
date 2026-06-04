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
import { Line, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { ButtonNode, Checkbox, Panel, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import { INSTRUMENT_PRESET_CATALOG } from "../../model/audio/presetCatalog.js";
import { AudioSource, type SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { createSourceSelector } from "../../view/SourceSelector.js";
import { ViewConstants } from "../../view/ViewConstants.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";

const MAX_FREQUENCY_RANGE = new Range(2000, 10000);
// Matches SimModel's LPC_ORDER_RANGE: order applies at the decimated ~11 kHz
// formant rate, where ~12 is the sweet spot for F1–F5.
const LPC_ORDER_RANGE = new Range(8, 16);
const PANEL_WIDTH = 232;

export class AnalyzerControlPanel extends Panel {
  public constructor(model: SimModel, viewProperties: AnalyzerViewProperties, listParent: Node) {
    const controls = StringManager.getInstance().getControlStrings();
    const panelStrings = StringManager.getInstance().getPanelStrings();

    // ── Source + start/stop + freeze ────────────────────────────────────────
    const sourceSelector = createSourceSelector(model, listParent, { presetCatalog: INSTRUMENT_PRESET_CATALOG });

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
    const playAudioCheckbox = makeCheckbox(model.isAudioEnabledProperty, controls.playAudioStringProperty);

    // ── Analysis settings ───────────────────────────────────────────────────
    // FFT size and window are configured in Preferences → Visual (see
    // AnalysisPreferenceControls), keeping this panel focused on the common controls.
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
        sourceSelector,
        startStopButton,
        playAudioCheckbox,
        freezeCheckbox,
        divider(),
        lpcControl,
        maxFreqControl,
        divider(),
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
