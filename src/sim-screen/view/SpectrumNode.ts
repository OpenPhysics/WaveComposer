/**
 * SpectrumNode.ts
 *
 * Instantaneous FFT power spectrum (magnitude in dB vs frequency) with the LPC
 * spectral-envelope curve overlaid, plus vertical markers at the detected formant
 * frequencies and optional integer-harmonic markers (multiples of F0).
 *
 * The two curves are drawn with bamboo CanvasLinePlots (canvas-rendered, so the
 * per-frame `setDataSet` is cheap). Only bins inside the display frequency range
 * are emitted, keeping each dataset to a few hundred points.
 */
import { CanvasLinePlot, ChartCanvasNode, type ChartTransform } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import type { SimModel } from "../../model/SimModel.js";
import SimColors from "../../SimColors.js";
import { ChartFrame } from "../../view/ChartFrame.js";
import { ViewConstants } from "../../view/ViewConstants.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";

interface SpectrumNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const FREQUENCY_TICK_SPACING_HZ = 1000;
const DB_TICK_SPACING = 20;

export class SpectrumNode extends Node {
  private readonly model: SimModel;
  private readonly viewProperties: AnalyzerViewProperties;
  private readonly viewHeight: number;
  private readonly chartTransform: ChartTransform;
  private readonly spectrumPlot: CanvasLinePlot;
  private readonly lpcPlot: CanvasLinePlot;
  private readonly chartCanvas: ChartCanvasNode;
  private readonly formantLines: Line[];
  private readonly harmonicMarkers: Path;

  public constructor(model: SimModel, viewProperties: AnalyzerViewProperties, options: SpectrumNodeOptions) {
    super();
    this.model = model;
    this.viewProperties = viewProperties;
    this.viewHeight = options.viewHeight;
    const axisStrings = StringManager.getInstance().getAxisStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: new Range(model.minFrequencyProperty.value, Math.max(model.maxFrequencyProperty.value, 1)),
      yRange: new Range(ViewConstants.SPECTRUM_MIN_DB, ViewConstants.SPECTRUM_MAX_DB),
      xSpacing: FREQUENCY_TICK_SPACING_HZ,
      ySpacing: DB_TICK_SPACING,
      xLabel: axisStrings.frequencyStringProperty,
      yLabel: axisStrings.magnitudeStringProperty,
    });
    this.chartTransform = frame.chartTransform;

    this.spectrumPlot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: SimColors.spectrumCurveColorProperty.value.toCSS(),
      lineWidth: 1.5,
    });
    this.lpcPlot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: SimColors.lpcEnvelopeColorProperty.value.toCSS(),
      lineWidth: 2,
    });
    this.chartCanvas = new ChartCanvasNode(this.chartTransform, [this.spectrumPlot, this.lpcPlot]);
    frame.plotLayer.addChild(this.chartCanvas);

    // Optional integer-harmonic markers (drawn beneath the formant lines).
    this.harmonicMarkers = new Path(null, {
      stroke: SimColors.harmonicMarkerColorProperty,
      lineWidth: 0.5,
      opacity: 0.6,
    });
    frame.plotLayer.addChild(this.harmonicMarkers);

    // Persistent vertical lines for F1–F4.
    const formantColors = [
      SimColors.formant1ColorProperty,
      SimColors.formant2ColorProperty,
      SimColors.formant3ColorProperty,
      SimColors.formant4ColorProperty,
    ];
    const formantLayer = new Node();
    this.formantLines = formantColors.map((colorProperty) => {
      const line = new Line(0, 0, 0, options.viewHeight, { stroke: colorProperty, lineWidth: 1.5, visible: false });
      formantLayer.addChild(line);
      return line;
    });
    frame.plotLayer.addChild(formantLayer);

    this.addChild(frame);

    // Keep CanvasLinePlot strokes in sync with the active color profile.
    SimColors.spectrumCurveColorProperty.lazyLink((color) => {
      this.spectrumPlot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });
    SimColors.lpcEnvelopeColorProperty.lazyLink((color) => {
      this.lpcPlot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });
    viewProperties.showLpcEnvelopeProperty.link((visible) => {
      this.lpcPlot.visible = visible;
      this.chartCanvas.update();
    });
    viewProperties.showHarmonicsProperty.lazyLink(() => this.update());

    const retarget = () => {
      this.chartTransform.setModelXRange(
        new Range(model.minFrequencyProperty.value, Math.max(model.maxFrequencyProperty.value, 1)),
      );
      this.update();
    };
    model.minFrequencyProperty.lazyLink(retarget);
    model.maxFrequencyProperty.lazyLink(retarget);

    model.frameProcessedEmitter.addListener(() => this.update());
  }

  private update(): void {
    const analysis = this.model.analysis;
    if (!analysis) {
      return;
    }
    const sampleRate = this.model.sampleRateProperty.value;
    const half = analysis.powerSpectrumDb.length;
    const fftSize = half * 2;
    const minF = this.model.minFrequencyProperty.value;
    const maxF = Math.max(this.model.maxFrequencyProperty.value, minF + 1);
    const binStart = Math.max(0, Math.floor((minF * fftSize) / sampleRate));
    const binEnd = Math.min(half - 1, Math.ceil((maxF * fftSize) / sampleRate));

    const spectrumData: Vector2[] = [];
    const lpcData: Vector2[] = [];
    for (let bin = binStart; bin <= binEnd; bin++) {
      const freq = (bin * sampleRate) / fftSize;
      spectrumData.push(new Vector2(freq, analysis.powerSpectrumDb[bin] ?? ViewConstants.SPECTRUM_MIN_DB));
      lpcData.push(new Vector2(freq, analysis.lpcEnvelopeDb[bin] ?? ViewConstants.SPECTRUM_MIN_DB));
    }
    this.spectrumPlot.setDataSet(spectrumData);
    this.lpcPlot.setDataSet(lpcData);
    this.chartCanvas.update();

    this.updateFormantLines(minF, maxF);
    this.updateHarmonicMarkers(minF, maxF);
  }

  private updateFormantLines(minF: number, maxF: number): void {
    const formants = this.model.formantsProperty.value;
    for (let f = 0; f < this.formantLines.length; f++) {
      const line = this.formantLines[f];
      if (!line) {
        continue;
      }
      const freq = formants[f]?.frequencyHz ?? 0;
      if (freq >= minF && freq <= maxF) {
        line.x = this.chartTransform.modelToViewX(freq);
        line.visible = true;
      } else {
        line.visible = false;
      }
    }
  }

  private updateHarmonicMarkers(minF: number, maxF: number): void {
    if (!this.viewProperties.showHarmonicsProperty.value) {
      this.harmonicMarkers.shape = null;
      return;
    }
    const f0 = this.model.f0Property.value;
    if (f0 <= 0) {
      this.harmonicMarkers.shape = null;
      return;
    }
    const shape = new Shape();
    for (let freq = f0; freq <= maxF; freq += f0) {
      if (freq >= minF) {
        const x = this.chartTransform.modelToViewX(freq);
        shape.moveTo(x, 0).lineTo(x, this.viewHeight);
      }
    }
    this.harmonicMarkers.shape = shape;
  }
}
