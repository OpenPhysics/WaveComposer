/**
 * SpectrumNode.ts
 *
 * Instantaneous FFT power spectrum (magnitude in dB vs frequency) with the LPC
 * spectral-envelope curve overlaid, plus vertical markers at the detected formant
 * frequencies and optional integer-harmonic markers (multiples of F0).
 *
 * Physics pedagogy overlays: allowed-harmonic bands for pipe/string boundary
 * models, mode-number labels on harmonic markers, and a resonance caption on the
 * LPC envelope.
 */
import { CanvasLinePlot, ChartCanvasNode, type ChartTransform } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import type { HarmonicChartModel } from "../../common/model/HarmonicChartModel.js";
import { isModeAllowed, PipeBoundary } from "../../common/model/PipeBoundary.js";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import type { ChartOverlayProperties } from "../../common/view/ChartOverlayProperties.js";
import { ViewConstants } from "../../common/view/ViewConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";

interface SpectrumNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const FREQUENCY_TICK_SPACING_HZ = 1000;
const DB_TICK_SPACING = 20;
const HARMONIC_BAND_WIDTH_HZ = 18;

export class SpectrumNode extends Node {
  private readonly model: HarmonicChartModel;
  private readonly viewProperties: ChartOverlayProperties;
  private readonly viewHeight: number;
  private readonly chartTransform: ChartTransform;
  private readonly spectrumPlot: CanvasLinePlot;
  private readonly lpcPlot: CanvasLinePlot;
  private readonly chartCanvas: ChartCanvasNode;
  private readonly formantLines: Line[];
  private readonly harmonicMarkers: Path;
  private readonly allowedHarmonicLayer: Node;
  private readonly modeNumberLayer: Node;
  private readonly resonanceCaption: Text;

  public constructor(model: HarmonicChartModel, viewProperties: ChartOverlayProperties, options: SpectrumNodeOptions) {
    super();
    this.model = model;
    this.viewProperties = viewProperties;
    this.viewHeight = options.viewHeight;
    const axisStrings = StringManager.getInstance().getAxisStrings();
    const physics = StringManager.getInstance().getPhysicsStrings();

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

    this.allowedHarmonicLayer = new Node();
    frame.plotLayer.addChild(this.allowedHarmonicLayer);

    this.spectrumPlot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: WaveComposerColors.spectrumCurveColorProperty.value.toCSS(),
      lineWidth: 1.5,
    });
    this.lpcPlot = new CanvasLinePlot(this.chartTransform, [], {
      stroke: WaveComposerColors.lpcEnvelopeColorProperty.value.toCSS(),
      lineWidth: 2,
    });
    this.chartCanvas = new ChartCanvasNode(this.chartTransform, [this.spectrumPlot, this.lpcPlot]);
    frame.plotLayer.addChild(this.chartCanvas);

    this.harmonicMarkers = new Path(null, {
      stroke: WaveComposerColors.harmonicMarkerColorProperty,
      lineWidth: 0.5,
      opacity: 0.6,
    });
    frame.plotLayer.addChild(this.harmonicMarkers);

    this.modeNumberLayer = new Node();
    frame.plotLayer.addChild(this.modeNumberLayer);

    const formantColors = [
      WaveComposerColors.formant1ColorProperty,
      WaveComposerColors.formant2ColorProperty,
      WaveComposerColors.formant3ColorProperty,
      WaveComposerColors.formant4ColorProperty,
    ];
    const formantLayer = new Node();
    this.formantLines = formantColors.map((colorProperty) => {
      const line = new Line(0, 0, 0, options.viewHeight, { stroke: colorProperty, lineWidth: 1.5, visible: false });
      formantLayer.addChild(line);
      return line;
    });
    frame.plotLayer.addChild(formantLayer);

    this.resonanceCaption = new Text(physics.resonanceCaptionStringProperty, {
      font: ViewConstants.LABEL_FONT,
      fill: WaveComposerColors.lpcEnvelopeColorProperty,
      right: options.viewWidth - 4,
      top: 2,
      visible: false,
    });
    frame.plotLayer.addChild(this.resonanceCaption);

    this.addChild(frame);

    WaveComposerColors.spectrumCurveColorProperty.lazyLink((color) => {
      this.spectrumPlot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });
    WaveComposerColors.lpcEnvelopeColorProperty.lazyLink((color) => {
      this.lpcPlot.setStroke(color.toCSS());
      this.chartCanvas.update();
    });
    viewProperties.showLpcEnvelopeProperty.link((visible) => {
      this.lpcPlot.visible = visible;
      this.resonanceCaption.visible = visible;
      this.chartCanvas.update();
    });
    viewProperties.showHarmonicsProperty.lazyLink(() => this.update());
    viewProperties.showPipeOverlayProperty.lazyLink(() => this.update());
    viewProperties.showModeNumbersProperty.lazyLink(() => this.update());
    model.pipeBoundaryProperty.lazyLink(() => this.update());

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
    this.updateAllowedHarmonicBands(minF, maxF);
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
    this.modeNumberLayer.removeAllChildren();

    if (!this.viewProperties.showHarmonicsProperty.value) {
      this.harmonicMarkers.shape = null;
      return;
    }
    const f0 = this.model.getFundamentalHz();
    if (f0 <= 0) {
      this.harmonicMarkers.shape = null;
      return;
    }
    const shape = new Shape();
    const modeLabelPattern = StringManager.getInstance().getPhysicsStrings().modeLabelStringProperty.value;
    let modeNumber = 0;
    for (let freq = f0; freq <= maxF; freq += f0) {
      modeNumber += 1;
      if (freq >= minF) {
        const x = this.chartTransform.modelToViewX(freq);
        shape.moveTo(x, 0).lineTo(x, this.viewHeight);
        if (this.viewProperties.showModeNumbersProperty.value) {
          const label = modeLabelPattern.replace("{{n}}", `${modeNumber}`);
          this.modeNumberLayer.addChild(
            new Text(label, {
              font: ViewConstants.LABEL_FONT,
              fill: WaveComposerColors.harmonicMarkerColorProperty,
              centerX: x,
              top: 2,
            }),
          );
        }
      }
    }
    this.harmonicMarkers.shape = shape;
  }

  private updateAllowedHarmonicBands(minF: number, maxF: number): void {
    this.allowedHarmonicLayer.removeAllChildren();
    if (!this.viewProperties.showPipeOverlayProperty.value) {
      return;
    }
    const boundary = this.model.pipeBoundaryProperty.value;
    if (boundary === PipeBoundary.NONE) {
      return;
    }
    const f0 = this.model.getFundamentalHz();
    if (f0 <= 0) {
      return;
    }

    let modeNumber = 0;
    for (let freq = f0; freq <= maxF; freq += f0) {
      modeNumber += 1;
      if (freq < minF || !isModeAllowed(modeNumber, boundary)) {
        continue;
      }
      const xLeft = this.chartTransform.modelToViewX(Math.max(minF, freq - HARMONIC_BAND_WIDTH_HZ / 2));
      const xRight = this.chartTransform.modelToViewX(Math.min(maxF, freq + HARMONIC_BAND_WIDTH_HZ / 2));
      this.allowedHarmonicLayer.addChild(
        new Rectangle(xLeft, 0, xRight - xLeft, this.viewHeight, {
          fill: WaveComposerColors.allowedHarmonicBandColorProperty,
          opacity: 0.12,
        }),
      );
    }
  }
}
