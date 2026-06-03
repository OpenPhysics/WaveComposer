/**
 * AudioSourceControl.ts
 *
 * Compact audio-source control for the Voice & Vowels screen: the shared source
 * ComboBox (microphone + presets) and a start/stop button. It binds to the same
 * shared SimModel as the Analyzer screen, so changing the source here switches the
 * input for both screens (the model owns the single audio source / analysis pipeline).
 *
 * The Analyzer screen has its own, larger control panel; this mirrors just the
 * source picker so the input can also be chosen without leaving this screen.
 */
import { DerivedProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { ButtonNode, Panel, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import { AudioSource, type SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { createSourceSelector } from "../../view/SourceSelector.js";
import { ViewConstants } from "../../view/ViewConstants.js";

const MAX_BUTTON_TEXT_WIDTH = 170;

export class AudioSourceControl extends Panel {
  public constructor(model: SimModel, listParent: Node) {
    const controls = StringManager.getInstance().getControlStrings();

    // This panel sits near the bottom of the screen, so open the list upward.
    const sourceSelector = createSourceSelector(model, listParent, { listPosition: "above" });

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
        sourceSelector,
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
