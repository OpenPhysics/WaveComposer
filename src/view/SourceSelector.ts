/**
 * SourceSelector.ts
 *
 * The shared audio-source picker used by both screens' controls: a ComboBox over
 * microphone, presets from a screen-specific catalog, and user recordings, plus a
 * one-line caption and Record / Save buttons. Both screens share one SimModel, so
 * the active source applies everywhere; each screen passes its own preset catalog.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { ButtonNode, ComboBox, type ComboBoxOptions, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import { findPresetEntry, INSTRUMENT_PRESET_CATALOG, type PresetCatalogEntry } from "../model/audio/presetCatalog.js";
import { downloadBlob, encodeWav } from "../model/audio/WavEncoder.js";
import { AudioSource, type SimModel } from "../model/SimModel.js";
import SimColors from "../SimColors.js";
import { ViewConstants } from "./ViewConstants.js";

const CAPTION_MAX_WIDTH = 200;
const BUTTON_MAX_TEXT_WIDTH = 180;

interface SourceSelectorOptions {
  /** Presets listed in the ComboBox (defaults to {@link INSTRUMENT_PRESET_CATALOG}). */
  presetCatalog?: readonly PresetCatalogEntry[];
  /** Direction the dropdown opens; use "above" when the control sits near the bottom. */
  listPosition?: "above" | "below";
}

type PresetStrings = ReturnType<StringManager["getPresetStrings"]>;
type VoicePresetStrings = ReturnType<StringManager["getVoicePresetStrings"]>;

function presetNameProperty(strings: PresetStrings | VoicePresetStrings, nameKey: string): TReadOnlyProperty<string> {
  return strings[`${nameKey}StringProperty` as keyof typeof strings] as TReadOnlyProperty<string>;
}

function presetCaptionProperty(
  strings: PresetStrings | VoicePresetStrings,
  captionKey: string,
): TReadOnlyProperty<string> {
  return strings[`${captionKey}StringProperty` as keyof typeof strings] as TReadOnlyProperty<string>;
}

/** Builds the source ComboBox + caption + record/save buttons as a left-aligned column. */
export function createSourceSelector(model: SimModel, listParent: Node, options?: SourceSelectorOptions): Node {
  const catalog = options?.presetCatalog ?? INSTRUMENT_PRESET_CATALOG;
  const instrumentStrings = StringManager.getInstance().getPresetStrings();
  const voiceStrings = StringManager.getInstance().getVoicePresetStrings();
  const controls = StringManager.getInstance().getControlStrings();

  function stringsForEntry(entry: PresetCatalogEntry): PresetStrings | VoicePresetStrings {
    return entry.stringGroup === "voicePresets" ? voiceStrings : instrumentStrings;
  }

  const captionByPresetId = new Map(
    catalog.map((entry) => [entry.id, presetCaptionProperty(stringsForEntry(entry), entry.captionKey)]),
  );
  const nameByPresetId = new Map(
    catalog.map((entry) => [entry.id, presetNameProperty(stringsForEntry(entry), entry.nameKey)]),
  );

  const recordingLabelCache = new Map<string, TReadOnlyProperty<string>>();
  function nameProperty(value: string): TReadOnlyProperty<string> {
    if (value === AudioSource.MICROPHONE) {
      return instrumentStrings.microphoneStringProperty;
    }
    const presetName = nameByPresetId.get(value);
    if (presetName) {
      return presetName;
    }
    const orphan = findPresetEntry(value);
    if (orphan) {
      return presetNameProperty(stringsForEntry(orphan), orphan.nameKey);
    }
    let label = recordingLabelCache.get(value);
    if (!label) {
      const index = model.getRecording(value)?.index ?? 0;
      label = new DerivedProperty([instrumentStrings.recordingStringProperty], (text) => `${text} ${index}`);
      recordingLabelCache.set(value, label);
    }
    return label;
  }

  const comboBoxOptions: ComboBoxOptions = {
    buttonFill: SimColors.buttonFillColorProperty,
    buttonStroke: SimColors.panelBorderColorProperty,
    listFill: SimColors.buttonFillColorProperty,
    listStroke: SimColors.panelBorderColorProperty,
    highlightFill: SimColors.comboBoxHighlightColorProperty,
    listPosition: options?.listPosition ?? "below",
    tandem: Tandem.OPT_OUT,
  };

  const comboContainer = new Node();
  let combo: ComboBox<string> | null = null;
  let comboValues: string[] = [];
  function rebuildCombo(): void {
    if (combo) {
      comboContainer.removeChild(combo);
      combo.dispose();
      combo = null;
    }
    comboValues = model.getSourceValues(catalog);
    combo = new ComboBox(
      model.audioSourceProperty,
      comboValues.map((value) => ({
        value,
        createNode: () =>
          new Text(nameProperty(value), { font: ViewConstants.CONTROL_FONT, fill: SimColors.textColorProperty }),
      })),
      listParent,
      comboBoxOptions,
    );
    comboContainer.addChild(combo);
  }

  // Both screens share audioSourceProperty but each lists only its own catalog. When the value
  // changes to one outside this ComboBox's items (e.g. the other screen picked singingVibrato),
  // rebuild so this ComboBox is disposed before its button asserts on the foreign value.
  // When the value is already one of our items — i.e. the user just picked it from THIS ComboBox —
  // we must NOT rebuild: disposing the in-flight ComboBox tears down its button before
  // ComboBoxListBox voices the selection, throwing "utterance is not an Utterance" (Voicing.js).
  model.audioSourceProperty.lazyLink(() => {
    if (!comboValues.includes(model.audioSourceProperty.value)) {
      rebuildCombo();
    }
  });
  model.recordings.lengthProperty.lazyLink(rebuildCombo);
  rebuildCombo();

  const captionProperty = DerivedProperty.deriveAny(
    [
      model.audioSourceProperty,
      instrumentStrings.microphoneCaptionStringProperty,
      instrumentStrings.recordingCaptionStringProperty,
      ...captionByPresetId.values(),
    ],
    () => {
      const value = model.audioSourceProperty.value;
      if (value === AudioSource.MICROPHONE) {
        return instrumentStrings.microphoneCaptionStringProperty.value;
      }
      const caption = captionByPresetId.get(value);
      if (caption) {
        return caption.value;
      }
      const orphan = findPresetEntry(value);
      if (orphan) {
        return presetCaptionProperty(stringsForEntry(orphan), orphan.captionKey).value;
      }
      return instrumentStrings.recordingCaptionStringProperty.value;
    },
  );
  const caption = new Text(captionProperty, {
    font: ViewConstants.LABEL_FONT,
    fill: SimColors.textColorProperty,
    maxWidth: CAPTION_MAX_WIDTH,
  });

  const recordLabel = new DerivedProperty(
    [model.isRecordingProperty, controls.recordStringProperty, controls.stopRecordingStringProperty],
    (recording, record, stop) => (recording ? stop : record),
  );
  const recordButton = new TextPushButton(recordLabel, {
    font: ViewConstants.CONTROL_FONT,
    baseColor: SimColors.buttonFillColorProperty,
    textFill: SimColors.textColorProperty,
    buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
    maxTextWidth: BUTTON_MAX_TEXT_WIDTH,
    listener: () => {
      if (model.isRecordingProperty.value) {
        model.stopRecording();
      } else {
        model.startRecording().catch(() => undefined);
      }
    },
    tandem: Tandem.OPT_OUT,
  });

  const saveButton = new TextPushButton(controls.saveRecordingStringProperty, {
    font: ViewConstants.CONTROL_FONT,
    baseColor: SimColors.buttonFillColorProperty,
    disabledColor: SimColors.buttonDisabledFillColorProperty,
    textFill: SimColors.textColorProperty,
    buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
    maxTextWidth: BUTTON_MAX_TEXT_WIDTH,
    enabledProperty: new DerivedProperty([model.audioSourceProperty], (value) => model.isRecordingId(value)),
    listener: () => {
      const entry = model.getRecording(model.audioSourceProperty.value);
      if (entry) {
        downloadBlob(encodeWav(entry.samples, entry.sampleRate), `recording-${entry.index}.wav`);
      }
    },
    tandem: Tandem.OPT_OUT,
  });

  const recordControls = new HBox({ spacing: 6, align: "center", children: [recordButton, saveButton] });

  return new VBox({ align: "left", spacing: 4, children: [comboContainer, caption, recordControls] });
}
