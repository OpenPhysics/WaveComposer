/**
 * AudioSourceControl.ts
 *
 * Compact audio-source control for the Voice & Vowels screen: a microphone/demo
 * radio selector and a start/stop button. It binds to the same shared SimModel as
 * the Analyzer screen, so selecting the microphone here switches the input for
 * both screens (the model owns the single audio source / analysis pipeline).
 *
 * The Analyzer screen has its own, larger control panel; this mirrors just the
 * source picker so the input can also be chosen without leaving this screen.
 */
import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { AquaRadioButtonGroup, Panel, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import { AudioSource, type SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { ViewConstants } from "../../view/ViewConstants.js";

const MAX_BUTTON_TEXT_WIDTH = 170;

export class AudioSourceControl extends Panel {
  public constructor(model: SimModel) {
    const controls = StringManager.getInstance().getControlStrings();

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
      baseColor: SimColors.accentColorProperty,
      maxTextWidth: MAX_BUTTON_TEXT_WIDTH,
      // Start/stop only applies to the live microphone, not the synthetic demo.
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

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(controls.sourceStringProperty, {
          font: ViewConstants.PANEL_TITLE_FONT,
          fill: SimColors.textColorProperty,
        }),
        sourceGroup,
        startStopButton,
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
