/**
 * SourceSelector.ts
 *
 * The shared audio-source picker used by both screens' controls: a ComboBox over
 * every {@link AudioSource} (microphone + presets) plus a one-line caption naming
 * what the current source demonstrates. Both screens share one SimModel, so the
 * selection applies everywhere.
 *
 * ComboBox popups render into the `listParent` layer the caller supplies (a Node
 * added on top of the screen), exactly like the other combos in AnalyzerControlPanel.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { ComboBox, type ComboBoxOptions } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import { AUDIO_SOURCE_VALUES, type AudioSource, type SimModel } from "../model/SimModel.js";
import SimColors from "../SimColors.js";
import { ViewConstants } from "./ViewConstants.js";

const CAPTION_MAX_WIDTH = 200;

interface SourceSelectorOptions {
  /** Direction the dropdown opens; use "above" when the control sits near the bottom. */
  listPosition?: "above" | "below";
}

/** Builds the source ComboBox + caption as a left-aligned column. */
export function createSourceSelector(model: SimModel, listParent: Node, options?: SourceSelectorOptions): Node {
  const presets = StringManager.getInstance().getPresetStrings();

  const names: Record<AudioSource, TReadOnlyProperty<string>> = {
    microphone: presets.microphoneStringProperty,
    vowelAh: presets.vowelAhStringProperty,
    vowelEe: presets.vowelEeStringProperty,
    clarinet: presets.clarinetStringProperty,
    flute: presets.fluteStringProperty,
    violin: presets.violinStringProperty,
    cymbals: presets.cymbalsStringProperty,
    singing: presets.singingStringProperty,
    guitar: presets.guitarStringProperty,
  };
  const captions: Record<AudioSource, TReadOnlyProperty<string>> = {
    microphone: presets.microphoneCaptionStringProperty,
    vowelAh: presets.vowelAhCaptionStringProperty,
    vowelEe: presets.vowelEeCaptionStringProperty,
    clarinet: presets.clarinetCaptionStringProperty,
    flute: presets.fluteCaptionStringProperty,
    violin: presets.violinCaptionStringProperty,
    cymbals: presets.cymbalsCaptionStringProperty,
    singing: presets.singingCaptionStringProperty,
    guitar: presets.guitarCaptionStringProperty,
  };

  // Dark fill + light item text (the sun default is white, which hides our light labels).
  const comboBoxOptions: ComboBoxOptions = {
    buttonFill: SimColors.buttonFillColorProperty,
    buttonStroke: SimColors.panelBorderColorProperty,
    listFill: SimColors.buttonFillColorProperty,
    listStroke: SimColors.panelBorderColorProperty,
    highlightFill: SimColors.comboBoxHighlightColorProperty,
    listPosition: options?.listPosition ?? "below",
    tandem: Tandem.OPT_OUT,
  };

  const combo = new ComboBox(
    model.audioSourceProperty,
    AUDIO_SOURCE_VALUES.map((value) => ({
      value,
      createNode: () => new Text(names[value], { font: ViewConstants.CONTROL_FONT, fill: SimColors.textColorProperty }),
    })),
    listParent,
    comboBoxOptions,
  );

  // Caption tracks the selection; depends on the caption strings too so it follows locale.
  const captionProperty = DerivedProperty.deriveAny(
    [model.audioSourceProperty, ...AUDIO_SOURCE_VALUES.map((value) => captions[value])],
    () => captions[model.audioSourceProperty.value].value,
  );
  const caption = new Text(captionProperty, {
    font: ViewConstants.LABEL_FONT,
    fill: SimColors.textColorProperty,
    maxWidth: CAPTION_MAX_WIDTH,
  });

  return new VBox({ align: "left", spacing: 4, children: [combo, caption] });
}
