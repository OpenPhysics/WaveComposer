/**
 * ComposerScreenView.ts
 *
 * The wave-composition screen: partial controls on the left, waveform / spectrum /
 * standing-wave charts in the center, and live readouts on the right.
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { VBox } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import { SpectrumNode } from "../../analyzer-screen/view/SpectrumNode.js";
import { StandingWaveNode } from "../../analyzer-screen/view/StandingWaveNode.js";
import { WaveformNode } from "../../analyzer-screen/view/WaveformNode.js";
import { BaseAnalysisScreenView } from "../../common/view/BaseAnalysisScreenView.js";
import { WaveComposerScreenSummaryContent } from "../../common/view/WaveComposerScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";
import type { ComposerModel } from "../model/ComposerModel.js";
import { ComposePanelNode } from "./ComposePanelNode.js";
import { ComposerControlPanel } from "./ComposerControlPanel.js";
import { ComposerReadoutPanel } from "./ComposerReadoutPanel.js";
import type { ComposerViewProperties } from "./ComposerViewProperties.js";

const MARGIN = WaveComposerConstants.SCREEN_MARGIN;
const SPACING = WaveComposerConstants.SPACING;
const CHART_LEFT_GUTTER = 56;
const RESET_BUTTON_CLEARANCE = 44;

export type ComposerScreenViewOptions = ScreenViewOptions;

export class ComposerScreenView extends BaseAnalysisScreenView {
  private readonly viewProperties: ComposerViewProperties;

  public constructor(
    model: ComposerModel,
    viewProperties: ComposerViewProperties,
    providedOptions?: ComposerScreenViewOptions,
  ) {
    const options = optionize<ComposerScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new WaveComposerScreenSummaryContent(
          StringManager.getInstance().getA11yStrings().composer,
        ),
      },
      providedOptions,
    );
    super(options);
    this.viewProperties = viewProperties;

    const readoutPanel = new ComposerReadoutPanel(model);
    readoutPanel.right = this.layoutBounds.maxX - MARGIN;
    readoutPanel.top = this.layoutBounds.minY + MARGIN;
    this.addChild(readoutPanel);

    const controlPanel = new ComposerControlPanel(model, this.viewProperties, this.popupLayer);
    controlPanel.left = readoutPanel.left;
    controlPanel.top = readoutPanel.bottom + SPACING;
    this.addChild(controlPanel);

    const composePanel = new ComposePanelNode(model, this.popupLayer);
    composePanel.left = this.layoutBounds.minX + MARGIN;
    composePanel.top = this.layoutBounds.minY + MARGIN;
    this.addChild(composePanel);

    const chartLeft = composePanel.right + SPACING;
    const chartRight = readoutPanel.left - SPACING;
    const chartViewWidth = chartRight - chartLeft - CHART_LEFT_GUTTER;

    const chartsTop = this.layoutBounds.minY + MARGIN;
    const chartsBottom = this.layoutBounds.maxY - MARGIN - RESET_BUTTON_CLEARANCE;
    const interChartSpacing = SPACING + 14;
    const usableChartHeight = chartsBottom - chartsTop - 2 * interChartSpacing;
    const waveformHeight = Math.round(usableChartHeight * 0.28);
    const spectrumHeight = Math.round(usableChartHeight * 0.46);
    const standingWaveHeight = usableChartHeight - waveformHeight - spectrumHeight;

    const waveform = new WaveformNode(model, this.viewProperties, {
      viewWidth: chartViewWidth,
      viewHeight: waveformHeight,
    });
    const spectrum = new SpectrumNode(model, this.viewProperties, {
      viewWidth: chartViewWidth,
      viewHeight: spectrumHeight,
    });
    const standingWave = new StandingWaveNode(model, {
      viewWidth: chartViewWidth,
      viewHeight: standingWaveHeight,
    });

    const charts = new VBox({
      align: "left",
      spacing: interChartSpacing,
      children: [waveform, spectrum, standingWave],
    });
    charts.left = chartLeft;
    charts.top = chartsTop;
    this.addChild(charts);

    this.addResetAllButton(model, () => this.reset());
    this.establishPdomOrder([composePanel, charts, controlPanel, readoutPanel]);
    this.addPopupLayer();
  }

  public reset(): void {
    this.viewProperties.reset();
  }
}
