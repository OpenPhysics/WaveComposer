/**
 * WaveComposerKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar),
 * shared by all screens since they share the same interaction model. Composed
 * from the standard scenery-phet help sections: a slider section, a combo-box
 * section for the selectors, and the basic-actions section (with checkbox
 * guidance) for tab navigation, buttons and the visibility checkboxes.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class WaveComposerKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const leftSections = [new SliderControlsKeyboardHelpSection(), new ComboBoxKeyboardHelpSection()];
    const rightSections = [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })];
    super(leftSections, rightSections);
  }
}
