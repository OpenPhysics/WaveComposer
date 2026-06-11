/**
 * BaseAnalysisScreenView.ts
 *
 * Shared shell for analysis screens: background, popup layer ordering, Reset All,
 * and the no-op step used by display nodes that subscribe directly to models.
 */
import { Node, Rectangle } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { ButtonNode } from "scenerystack/sun";
import WaveComposerColors from "../../WaveComposerColors.js";
import type { BaseAnalysisModel } from "../model/BaseAnalysisModel.js";
import { ViewConstants } from "./ViewConstants.js";

export class BaseAnalysisScreenView extends ScreenView {
  protected readonly popupLayer = new Node();

  public constructor(options?: ScreenViewOptions) {
    super(options);

    const background = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: WaveComposerColors.backgroundColorProperty,
    });
    this.addChild(background);
  }

  protected addResetAllButton(model: BaseAnalysisModel, resetView: () => void): void {
    const resetAllButton = new ResetAllButton({
      buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
      listener: () => {
        model.reset();
        resetView();
      },
      right: this.layoutBounds.maxX - ViewConstants.SCREEN_MARGIN,
      bottom: this.layoutBounds.maxY - ViewConstants.SCREEN_MARGIN,
    });
    this.addChild(resetAllButton);
  }

  /** Add after content so popups render above everything else. */
  protected addPopupLayer(): void {
    this.addChild(this.popupLayer);
  }

  public override step(_dt: number): void {
    // Display nodes update from the model's frameProcessedEmitter; nothing to do here.
  }
}
