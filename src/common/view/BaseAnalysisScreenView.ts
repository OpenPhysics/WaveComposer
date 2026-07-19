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
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";
import type { BaseAnalysisModel } from "../model/BaseAnalysisModel.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../WaveComposerButtonOptions.js";

export class BaseAnalysisScreenView extends ScreenView {
  protected readonly popupLayer = new Node();
  private resetAllButton: ResetAllButton | null = null;

  public constructor(options?: ScreenViewOptions) {
    super(options);

    const background = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: WaveComposerColors.backgroundColorProperty,
    });
    this.addChild(background);
  }

  protected addResetAllButton(model: BaseAnalysisModel, resetView: () => void): ResetAllButton {
    this.resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        resetView();
      },
      right: this.layoutBounds.maxX - WaveComposerConstants.SCREEN_MARGIN,
      bottom: this.layoutBounds.maxY - WaveComposerConstants.SCREEN_MARGIN,
      accessibleName: StringManager.getInstance().getA11yStrings().controls.resetAllStringProperty,
    });
    this.addChild(this.resetAllButton);
    return this.resetAllButton;
  }

  /**
   * Deterministic Tab / screen-reader order. ScreenView throws if you set
   * `pdomOrder` on itself, so borrow the interactive nodes onto a wrapper.
   * Reset All is always last.
   */
  protected establishPdomOrder(interactiveNodes: Node[]): void {
    if (!this.resetAllButton) {
      throw new Error("call addResetAllButton before establishPdomOrder");
    }
    this.addChild(
      new Node({
        pdomOrder: [...interactiveNodes, this.resetAllButton],
      }),
    );
  }

  /** Add after content so popups render above everything else. */
  protected addPopupLayer(): void {
    this.addChild(this.popupLayer);
  }

  public override step(_dt: number): void {
    // Display nodes update from the model's frameProcessedEmitter; nothing to do here.
  }
}
