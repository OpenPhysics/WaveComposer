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
import type { BaseAnalysisModel } from "../../common/model/BaseAnalysisModel.js";
import { hasDisplayWaveform } from "../../common/model/HarmonicChartModel.js";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import type { ChartOverlayProperties } from "../../common/view/ChartOverlayProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";

interface WaveformNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const TIME_TICK_SPACING_MS = 10;
const AMPLITUDE_TICK_SPACING = 0.5;

export class WaveformNode extends Node {
  private readonly model: BaseAnalysisModel;
  private readonly viewProperties: ChartOverlayProperties;
  private readonly maxPoints: number;
  private readonly chartTransform: ChartTransform;
  private readonly plot: CanvasLinePlot;
  private readonly chartCanvas: ChartCanvasNode;
  private displayWaveformBuffer = new Float32Array(0);

  public constructor(model: BaseAnalysisModel, viewProperties: ChartOverlayProperties, options: WaveformNodeOptions) {
    super();
    this.model = model;
    this.viewProperties = viewProperties;
    this.maxPoints = Math.max(2, Math.round(options.viewWidth));
    const axisStrings = StringManager.getInstance().getAxisStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: new Range(0, viewProperties.timeWindowMsProperty.value),
      yRange: new Range(-WaveComposerConstants.WAVEFORM_AMPLITUDE, WaveComposerConstants.WAVEFORM_AMPLITUDE),
      xSpacing: TIME_TICK_SPACING_MS,
      ySpacing: AMPLITUDE_TICK_SPACING,
      xLabel: axisStrings.timeStringProperty,
      yLabel: axisStrings.amplitudeStringProperty,
    });
    this.chartTransform = frame.chartTransform;

    this.plot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: WaveComposerColors.waveformColorProperty.value.toCSS(),
      lineWidth: 1.5,
    });
    this.chartCanvas = new ChartCanvasNode(this.chartTransform, [this.plot]);
    frame.plotLayer.addChild(this.chartCanvas);
    this.addChild(frame);

    WaveComposerColors.waveformColorProperty.lazyLink((color) => {
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
    const sampleRate = this.model.sampleRateProperty.value;
    const windowMs = this.viewProperties.timeWindowMsProperty.value;
    const windowSamples = Math.max(2, Math.round((windowMs / 1000) * sampleRate));

    let waveform: Float32Array;
    let sampleCount: number;
    if (hasDisplayWaveform(this.model)) {
      if (this.displayWaveformBuffer.length < windowSamples) {
        this.displayWaveformBuffer = new Float32Array(windowSamples);
      }
      waveform = this.displayWaveformBuffer.subarray(0, windowSamples);
      this.model.fillDisplayWaveform(waveform);
      sampleCount = windowSamples;
    } else {
      const analysis = this.model.analysis;
      if (!analysis) {
        return;
      }
      waveform = analysis.waveform;
      sampleCount = Math.min(waveform.length, windowSamples);
    }

    const step = Math.max(1, Math.ceil(sampleCount / this.maxPoints));
    const data: Vector2[] = [];
    for (let i = 0; i < sampleCount; i += step) {
      const timeMs = (i / sampleRate) * 1000;
      data.push(new Vector2(timeMs, waveform[i] ?? 0));
    }
    this.plot.setDataSet(data);
    this.chartCanvas.update();
  }
}
