/**
 * AudioSourceControl.ts
 *
 * Compact audio-source control for the Voice & Vowels screen: the source ComboBox
 * (microphone + voice presets) and a start/stop button.
 *
 * The Analyzer screen has its own, larger control panel; this mirrors just the
 * source picker so the input can also be chosen without leaving this screen.
 */
import { DerivedProperty } from "scenerystack/axon";
import { type Node, Text, VBox } from "scenerystack/scenery";
import { ButtonNode, Checkbox, Panel, TextPushButton } from "scenerystack/sun";
import { Tandem } from "scenerystack/tandem";
import { AudioSource } from "../../common/model/BaseAnalysisModel.js";
import { createSourceSelector } from "../../common/view/SourceSelector.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import SimColors from "../../SimColors.js";
import type { VoiceModel } from "../model/VoiceModel.js";

const MAX_BUTTON_TEXT_WIDTH = 170;

export class AudioSourceControl extends Panel {
  public constructor(model: VoiceModel, listParent: Node) {
    const controls = StringManager.getInstance().getControlStrings();

    // This panel sits near the bottom of the screen, so open the list upward.
    const sourceSelector = createSourceSelector(model, listParent, {
      listPosition: "above",
    });

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

    const playAudioCheckbox = new Checkbox(
      model.isAudioEnabledProperty,
      new Text(controls.playAudioStringProperty, {
        font: ViewConstants.CONTROL_FONT,
        fill: SimColors.textColorProperty,
      }),
      {
        boxWidth: 16,
        checkboxColor: SimColors.textColorProperty,
        checkboxColorBackground: SimColors.chartBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
    );

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
        playAudioCheckbox,
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
