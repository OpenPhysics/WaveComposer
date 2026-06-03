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
import { Node, Rectangle, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import type { SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { ViewConstants } from "../../view/ViewConstants.js";
import { AnalyzerControlPanel } from "./AnalyzerControlPanel.js";
import { AnalyzerReadoutPanel } from "./AnalyzerReadoutPanel.js";
import { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";
import { SpectrogramNode } from "./SpectrogramNode.js";
import { SpectrumNode } from "./SpectrumNode.js";
import { WaveformNode } from "./WaveformNode.js";

const MARGIN = ViewConstants.SCREEN_MARGIN;
const SPACING = ViewConstants.SPACING;
// Horizontal space reserved for each chart's y-axis label + tick labels.
const CHART_LEFT_GUTTER = 56;
const SPECTROGRAM_HEIGHT = 210;
const SPECTRUM_HEIGHT = 150;
const WAVEFORM_HEIGHT = 70;

export class SimScreenView extends ScreenView {
  private readonly viewProperties: AnalyzerViewProperties;
  private readonly spectrogram: SpectrogramNode;

  public constructor(model: SimModel, options?: ScreenViewOptions) {
    super(options);

    this.viewProperties = new AnalyzerViewProperties();

    const background = new Rectangle(0, 0, this.layoutBounds.width, this.layoutBounds.height, {
      fill: SimColors.backgroundColorProperty,
    });
    this.addChild(background);

    // Layer for ComboBox popups; must be on top of the other content.
    const popupLayer = new Node();

    // ── Side panels ───────────────────────────────────────────────────────────
    const controlPanel = new AnalyzerControlPanel(model, this.viewProperties, popupLayer);
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

    const charts = new VBox({
      align: "left",
      spacing: SPACING + 14,
      children: [this.spectrogram, spectrum, waveform],
    });
    charts.left = chartLeft;
    charts.top = this.layoutBounds.minY + MARGIN;
    this.addChild(charts);

    // ── Reset All ──────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - MARGIN,
      bottom: this.layoutBounds.maxY - MARGIN,
    });
    this.addChild(resetAllButton);

    this.addChild(popupLayer);
  }

  public reset(): void {
    this.viewProperties.reset();
    this.spectrogram.reset();
  }

  public override step(_dt: number): void {
    // Display nodes update from the model's frameProcessedEmitter; nothing to do here.
  }
}
