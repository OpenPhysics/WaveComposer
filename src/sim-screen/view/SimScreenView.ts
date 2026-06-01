/**
 * SimScreenView.ts
 *
 * The top-level view for the simulation screen.
 *
 * All visual nodes are added here. Follow these conventions:
 *   - Use this.layoutBounds for positioning (never magic pixel values)
 *   - Keep a ResetAllButton that calls model.reset() and this.reset()
 *   - Override step(dt) for frame-by-frame animation
 *
 * ── Adding content ────────────────────────────────────────────────────────────
 * 1. Create Node subclasses in separate files (e.g. SimControlPanel.ts)
 * 2. Instantiate them here and call this.addChild(...)
 * 3. Link them to model properties:
 *      model.isRunningProperty.link( isRunning => { ... } );
 *
 * ── Layout bounds ─────────────────────────────────────────────────────────────
 * SceneryStack uses a virtual 1024×618 coordinate space by default.
 * this.layoutBounds gives you the full rectangle; use it for alignment:
 *   center, minX, maxX, minY, maxY, width, height
 */

import { Rectangle, Text } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import SimColors from "../../SimColors.js";
import type { SimModel } from "../model/SimModel.js";

// Margin between screen edges and buttons/panels (in layout-bounds coordinates)
const SCREEN_VIEW_MARGIN = 20;

export class SimScreenView extends ScreenView {
  public constructor(model: SimModel, options?: ScreenViewOptions) {
    super(options);

    // ── Background ────────────────────────────────────────────────────────────
    // A full-screen rectangle that follows the active color profile.
    // Replace or remove once you add real content.
    const backgroundRect = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: SimColors.backgroundColorProperty,
    });
    this.addChild(backgroundRect);

    // ── Placeholder label ─────────────────────────────────────────────────────
    // Replace this with your actual simulation content.
    const placeholderText = new Text("Wave Composer", {
      font: "bold 36px sans-serif",
      fill: SimColors.textColorProperty,
      center: this.layoutBounds.center,
    });
    this.addChild(placeholderText);

    // ── Reset All button ──────────────────────────────────────────────────────
    // Always position at bottom-right (PhET convention).
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);
  }

  /**
   * Resets view-side state (animations, panel visibility, etc.).
   * Called by the Reset All button listener.
   */
  public reset(): void {
    // TODO: reset any view-side state here
  }

  /**
   * Steps the view forward by dt seconds for animation.
   * @param _dt - elapsed time in seconds
   */
  public override step(_dt: number): void {
    // TODO: implement animation updates here
  }
}
