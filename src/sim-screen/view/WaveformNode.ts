/**
 * WaveformNode.ts
 *
 * Time-domain oscilloscope of the current frame. Shows the first
 * `timeWindowMsProperty` milliseconds of the analyzed waveform, decimated to
 * roughly one point per view pixel so longer windows stay cheap to draw.
 */
import { CanvasLinePlot, ChartCanvasNode, type ChartTransform } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import SimColors from "../../SimColors.js";
import type { AnalyzerModel } from "../model/AnalyzerModel.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";

interface WaveformNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const TIME_TICK_SPACING_MS = 10;
const AMPLITUDE_TICK_SPACING = 0.5;

export class WaveformNode extends Node {
  private readonly model: AnalyzerModel;
  private readonly viewProperties: AnalyzerViewProperties;
  private readonly maxPoints: number;
  private readonly chartTransform: ChartTransform;
  private readonly plot: CanvasLinePlot;
  private readonly chartCanvas: ChartCanvasNode;

  public constructor(model: AnalyzerModel, viewProperties: AnalyzerViewProperties, options: WaveformNodeOptions) {
    super();
    this.model = model;
    this.viewProperties = viewProperties;
    this.maxPoints = Math.max(2, Math.round(options.viewWidth));
    const axisStrings = StringManager.getInstance().getAxisStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: new Range(0, viewProperties.timeWindowMsProperty.value),
      yRange: new Range(-ViewConstants.WAVEFORM_AMPLITUDE, ViewConstants.WAVEFORM_AMPLITUDE),
      xSpacing: TIME_TICK_SPACING_MS,
      ySpacing: AMPLITUDE_TICK_SPACING,
      xLabel: axisStrings.timeStringProperty,
      yLabel: axisStrings.amplitudeStringProperty,
    });
    this.chartTransform = frame.chartTransform;

    this.plot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: SimColors.waveformColorProperty.value.toCSS(),
      lineWidth: 1.5,
    });
    this.chartCanvas = new ChartCanvasNode(this.chartTransform, [this.plot]);
    frame.plotLayer.addChild(this.chartCanvas);
    this.addChild(frame);

    SimColors.waveformColorProperty.lazyLink((color) => {
      this.plot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });
    viewProperties.timeWindowMsProperty.lazyLink((ms) => {
      this.chartTransform.setModelXRange(new Range(0, ms));
      this.update();
    });

    model.frameProcessedEmitter.addListener(() => this.update());
  }

  private update(): void {
    const analysis = this.model.analysis;
    if (!analysis) {
      return;
    }
    const sampleRate = this.model.sampleRateProperty.value;
    const windowMs = this.viewProperties.timeWindowMsProperty.value;
    const waveform = analysis.waveform;
    const windowSamples = Math.min(waveform.length, Math.max(2, Math.round((windowMs / 1000) * sampleRate)));
    const step = Math.max(1, Math.ceil(windowSamples / this.maxPoints));

    const data: Vector2[] = [];
    for (let i = 0; i < windowSamples; i += step) {
      const timeMs = (i / sampleRate) * 1000;
      data.push(new Vector2(timeMs, waveform[i] ?? 0));
    }
    this.plot.setDataSet(data);
    this.chartCanvas.update();
  }
}
