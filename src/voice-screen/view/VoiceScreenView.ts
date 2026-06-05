/**
 * VoiceScreenView.ts
 *
 * The Voice & Vowels screen: an F1×F2 vowel chart on the left, a cepstrum chart
 * on the right, and a voice-quality readout below it. The screen owns an
 * independent VoiceModel, so its source and analysis settings are isolated.
 */
import { Node } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { BaseAnalysisScreenView } from "../../common/view/BaseAnalysisScreenView.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import type { VoiceModel } from "../model/VoiceModel.js";
import { AudioSourceControl } from "./AudioSourceControl.js";
import { CepstrumNode } from "./CepstrumNode.js";
import { VoiceQualityReadout } from "./VoiceQualityReadout.js";
import { VowelPlotNode } from "./VowelPlotNode.js";

const MARGIN = ViewConstants.SCREEN_MARGIN;
const SPACING = ViewConstants.SPACING;
const CHART_LEFT_GUTTER = 56;
const VOWEL_PLOT_SIZE = 380;
const CEPSTRUM_HEIGHT = 200;

export class VoiceScreenView extends BaseAnalysisScreenView {
  private readonly vowelPlot: VowelPlotNode;

  public constructor(model: VoiceModel, options?: ScreenViewOptions) {
    super(options);

    // ── Vowel plot (left) ───────────────────────────────────────────────────
    this.vowelPlot = new VowelPlotNode(model, { viewWidth: VOWEL_PLOT_SIZE, viewHeight: VOWEL_PLOT_SIZE });
    const vowelContainer = new Node({ children: [this.vowelPlot] });
    vowelContainer.left = this.layoutBounds.minX + MARGIN;
    vowelContainer.top = this.layoutBounds.minY + MARGIN;
    this.addChild(vowelContainer);

    // ── Audio source control (below the vowel plot) ─────────────────────────
    const sourceControl = new AudioSourceControl(model, this.popupLayer);
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

    this.addResetAllButton(model, () => this.reset());
    this.addPopupLayer();
  }

  public reset(): void {
    this.vowelPlot.reset();
  }
}
