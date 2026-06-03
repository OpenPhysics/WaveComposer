/**
 * VoiceScreenView.ts
 *
 * The Voice & Vowels screen: an F1×F2 vowel chart on the left, a cepstrum chart
 * on the right, and a voice-quality readout below it. Shares the single SimModel
 * with the Analyzer screen, so it shows live analysis of the same source.
 */
import { Node, Rectangle } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { ButtonNode } from "scenerystack/sun";
import type { SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { ViewConstants } from "../../view/ViewConstants.js";
import { AudioSourceControl } from "./AudioSourceControl.js";
import { CepstrumNode } from "./CepstrumNode.js";
import { VoiceQualityReadout } from "./VoiceQualityReadout.js";
import { VowelPlotNode } from "./VowelPlotNode.js";

const MARGIN = ViewConstants.SCREEN_MARGIN;
const SPACING = ViewConstants.SPACING;
const CHART_LEFT_GUTTER = 56;
const VOWEL_PLOT_SIZE = 380;
const CEPSTRUM_HEIGHT = 200;

export class VoiceScreenView extends ScreenView {
  private readonly vowelPlot: VowelPlotNode;

  public constructor(model: SimModel, options?: ScreenViewOptions) {
    super(options);

    const background = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: SimColors.backgroundColorProperty,
    });
    this.addChild(background);

    // ── Vowel plot (left) ───────────────────────────────────────────────────
    this.vowelPlot = new VowelPlotNode(model, { viewWidth: VOWEL_PLOT_SIZE, viewHeight: VOWEL_PLOT_SIZE });
    const vowelContainer = new Node({ children: [this.vowelPlot] });
    vowelContainer.left = this.layoutBounds.minX + MARGIN;
    vowelContainer.top = this.layoutBounds.minY + MARGIN;
    this.addChild(vowelContainer);

    // ── Audio source control (below the vowel plot) ─────────────────────────
    // Lets the user point this screen at the microphone without switching to the
    // Analyzer screen; both screens share one model, so the choice applies to both.
    const sourceControl = new AudioSourceControl(model);
    sourceControl.left = vowelContainer.left;
    sourceControl.top = vowelContainer.bottom + SPACING;
    this.addChild(sourceControl);

    // ── Cepstrum + readout (right) ──────────────────────────────────────────
    const rightLeft = vowelContainer.right + SPACING + CHART_LEFT_GUTTER;
    const cepstrumWidth = this.layoutBounds.maxX - MARGIN - rightLeft;

    const cepstrum = new CepstrumNode(model, { viewWidth: cepstrumWidth, viewHeight: CEPSTRUM_HEIGHT });
    const cepstrumContainer = new Node({ children: [cepstrum] });
    cepstrumContainer.left = rightLeft;
    cepstrumContainer.top = this.layoutBounds.minY + MARGIN;
    this.addChild(cepstrumContainer);

    const readout = new VoiceQualityReadout(model);
    readout.left = rightLeft;
    readout.top = cepstrumContainer.bottom + SPACING + 20;
    this.addChild(readout);

    // ── Reset All ────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - MARGIN,
      bottom: this.layoutBounds.maxY - MARGIN,
    });
    this.addChild(resetAllButton);
  }

  public reset(): void {
    this.vowelPlot.reset();
  }

  public override step(_dt: number): void {
    // Display nodes update from the model's frameProcessedEmitter; nothing to do here.
  }
}
