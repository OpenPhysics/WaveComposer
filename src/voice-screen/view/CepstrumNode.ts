/**
 * CepstrumNode.ts
 *
 * Real cepstrum vs quefrency (ms). The cepstral peak in the F0 quefrency band is
 * the basis of the CPP voice-quality metric; a marker is drawn at the quefrency
 * corresponding to the detected F0 (1000 / F0 ms) so the peak it lands on is easy
 * to see.
 */
import { CanvasLinePlot, ChartCanvasNode, type ChartTransform } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Line, Node } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import type { SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { ChartFrame } from "../../view/ChartFrame.js";
import { ViewConstants } from "../../view/ViewConstants.js";

interface CepstrumNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const QUEFRENCY_TICK_SPACING_MS = 5;
const AMPLITUDE_TICK_SPACING = 0.5;
const CEPSTRUM_Y_RANGE = new Range(-0.5, 1.5);

export class CepstrumNode extends Node {
  private readonly model: SimModel;
  private readonly chartTransform: ChartTransform;
  private readonly plot: CanvasLinePlot;
  private readonly chartCanvas: ChartCanvasNode;
  private readonly peakMarker: Line;

  public constructor(model: SimModel, options: CepstrumNodeOptions) {
    super();
    this.model = model;
    const axisStrings = StringManager.getInstance().getAxisStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: new Range(ViewConstants.CEPSTRUM_MIN_MS, ViewConstants.CEPSTRUM_MAX_MS),
      yRange: CEPSTRUM_Y_RANGE,
      xSpacing: QUEFRENCY_TICK_SPACING_MS,
      ySpacing: AMPLITUDE_TICK_SPACING,
      xLabel: axisStrings.quefrencyStringProperty,
      yLabel: axisStrings.amplitudeStringProperty,
    });
    this.chartTransform = frame.chartTransform;

    this.plot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: SimColors.cepstrumCurveColorProperty.value.toCSS(),
      lineWidth: 1.5,
    });
    this.chartCanvas = new ChartCanvasNode(this.chartTransform, [this.plot]);
    frame.plotLayer.addChild(this.chartCanvas);

    this.peakMarker = new Line(0, 0, 0, options.viewHeight, {
      stroke: SimColors.harmonicMarkerColorProperty,
      lineWidth: 1.5,
      visible: false,
    });
    frame.plotLayer.addChild(this.peakMarker);

    this.addChild(frame);

    SimColors.cepstrumCurveColorProperty.lazyLink((color) => {
      this.plot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });

    model.frameProcessedEmitter.addListener(() => this.update());
  }

  private update(): void {
    const analysis = this.model.analysis;
    if (!analysis) {
      return;
    }
    const sampleRate = this.model.sampleRateProperty.value;
    const cepstrum = analysis.cepstrum;
    const startIndex = Math.max(1, Math.floor((ViewConstants.CEPSTRUM_MIN_MS / 1000) * sampleRate));
    const endIndex = Math.min(cepstrum.length - 1, Math.ceil((ViewConstants.CEPSTRUM_MAX_MS / 1000) * sampleRate));

    const data: Vector2[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      data.push(new Vector2((i / sampleRate) * 1000, cepstrum[i] ?? 0));
    }
    this.plot.setDataSet(data);
    this.chartCanvas.update();

    const f0 = this.model.f0Property.value;
    if (f0 > 0) {
      const quefrencyMs = 1000 / f0;
      if (quefrencyMs >= ViewConstants.CEPSTRUM_MIN_MS && quefrencyMs <= ViewConstants.CEPSTRUM_MAX_MS) {
        this.peakMarker.x = this.chartTransform.modelToViewX(quefrencyMs);
        this.peakMarker.visible = true;
      } else {
        this.peakMarker.visible = false;
      }
    } else {
      this.peakMarker.visible = false;
    }
  }
}
