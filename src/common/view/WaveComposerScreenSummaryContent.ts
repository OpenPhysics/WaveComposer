/**
 * WaveComposerScreenSummaryContent.ts
 *
 * Accessible screen summary (SceneryStack Interactive Description) shared by all
 * three Wave Composer screens. Each screen constructs it with its own a11y string
 * subgroup (composer / analyzer / voice), so the structured regions stay accurate
 * per screen while the construction stays uniform.
 *
 * Follows the OpenPhysics accessibility convention; see the canonical
 * SceneryStackTemplate/SimScreenSummaryContent.ts.
 */
import { ScreenSummaryContent } from "scenerystack/sim";
import type { StringManager } from "../../i18n/StringManager.js";

// The per-screen a11y subgroup shape (one of getA11yStrings().composer / .analyzer / .voice).
type ScreenA11yStrings = ReturnType<StringManager["getA11yStrings"]>["composer"];

export class WaveComposerScreenSummaryContent extends ScreenSummaryContent {
  public constructor(strings: ScreenA11yStrings) {
    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      currentDetailsContent: strings.currentDetailsStringProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
    });
  }
}
