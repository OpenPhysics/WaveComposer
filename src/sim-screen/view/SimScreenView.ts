/**
 * SimScreenView.ts
 *
 * The Analyzer screen: a scrolling spectrogram, an instantaneous spectrum (with
 * LPC envelope), and a waveform oscilloscope stacked in the center; a control
 * panel on the left and a live measurement readout on the right.
 *
 * The display nodes subscribe themselves to the model (scalar Properties +
 * frameProcessedEmitter), so this view just builds, lays out, and resets them.
 * Positioning uses this.layoutBounds; the chart width is derived from the gap
 * left between the two side panels.
 */
import { VBox } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { BaseAnalysisScreenView } from "../../common/view/BaseAnalysisScreenView.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { WaveComposerScreenSummaryContent } from "../../common/view/WaveComposerScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { AnalyzerModel } from "../model/AnalyzerModel.js";
import { AnalyzerControlPanel } from "./AnalyzerControlPanel.js";
import { AnalyzerReadoutPanel } from "./AnalyzerReadoutPanel.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";
import { SpectrogramNode } from "./SpectrogramNode.js";
import { SpectrumNode } from "./SpectrumNode.js";
import { StandingWaveNode } from "./StandingWaveNode.js";
import { WaveformNode } from "./WaveformNode.js";

const MARGIN = ViewConstants.SCREEN_MARGIN;
const SPACING = ViewConstants.SPACING;
// Horizontal space reserved for each chart's y-axis label + tick labels.
const CHART_LEFT_GUTTER = 56;
const SPECTROGRAM_HEIGHT = 210;
const SPECTRUM_HEIGHT = 150;
const WAVEFORM_HEIGHT = 70;
const STANDING_WAVE_HEIGHT = 56;

export class SimScreenView extends BaseAnalysisScreenView {
  private readonly viewProperties: AnalyzerViewProperties;
  private readonly spectrogram: SpectrogramNode;

  public constructor(model: AnalyzerModel, viewProperties: AnalyzerViewProperties, options?: ScreenViewOptions) {
    super({
      ...options,
      screenSummaryContent: new WaveComposerScreenSummaryContent(StringManager.getInstance().getA11yStrings().analyzer),
    });

    this.viewProperties = viewProperties;

    // ── Side panels ───────────────────────────────────────────────────────────
    const controlPanel = new AnalyzerControlPanel(model, this.viewProperties, this.popupLayer);
    controlPanel.left = this.layoutBounds.minX + MARGIN;
    controlPanel.top = this.layoutBounds.minY + MARGIN;
    this.addChild(controlPanel);

    const readoutPanel = new AnalyzerReadoutPanel(model);
    readoutPanel.right = this.layoutBounds.maxX - MARGIN;
    readoutPanel.top = this.layoutBounds.minY + MARGIN;
    this.addChild(readoutPanel);

    // ── Center charts ───────────────────────────────────────────────────────────
    const chartLeft = controlPanel.right + SPACING;
    const chartRight = readoutPanel.left - SPACING;
    const chartViewWidth = chartRight - chartLeft - CHART_LEFT_GUTTER;

    this.spectrogram = new SpectrogramNode(model, this.viewProperties, {
      viewWidth: chartViewWidth,
      viewHeight: SPECTROGRAM_HEIGHT,
    });
    const spectrum = new SpectrumNode(model, this.viewProperties, {
      viewWidth: chartViewWidth,
      viewHeight: SPECTRUM_HEIGHT,
    });
    const waveform = new WaveformNode(model, this.viewProperties, {
      viewWidth: chartViewWidth,
      viewHeight: WAVEFORM_HEIGHT,
    });
    const standingWave = new StandingWaveNode(model, {
      viewWidth: chartViewWidth,
      viewHeight: STANDING_WAVE_HEIGHT,
    });

    const charts = new VBox({
      align: "left",
      spacing: SPACING + 14,
      children: [this.spectrogram, spectrum, waveform, standingWave],
    });
    charts.left = chartLeft;
    charts.top = this.layoutBounds.minY + MARGIN;
    this.addChild(charts);

    this.addResetAllButton(model, () => this.reset());
    this.addPopupLayer();
  }

  public reset(): void {
    this.viewProperties.reset();
    this.spectrogram.reset();
  }
}
