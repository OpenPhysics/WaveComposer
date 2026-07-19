/**
 * SpectrogramNode.ts
 *
 * Scrolling waterfall display (time × frequency × intensity). A ChartFrame
 * supplies the frequency (y) axis and labels; the intensity raster and the
 * F0/formant track overlays are drawn by an inner Canvas-2D node.
 *
 * The raster is kept in an offscreen canvas used as a ring buffer: each analyzed
 * frame writes one vertical column (frequency bins → colormap), advancing a write
 * index. `paintCanvas` blits the ring in two slices so the newest column is always
 * at the right edge and older data scrolls left — no per-frame self-copy.
 *
 * Overlays (F0 and F1–F4) keep their own rolling history aligned with the same
 * ring index, drawn as polylines over the raster and gated by the view's
 * overlay-visibility Properties.
 */
import type { ChartTransform } from "scenerystack/bamboo";
import { Bounds2, Range } from "scenerystack/dot";
import { CanvasNode, type CanvasNodeOptions, Node } from "scenerystack/scenery";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import { getColormapLut } from "../../common/view/Colormaps.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";
import type { AnalyzerModel } from "../model/AnalyzerModel.js";
import type { AnalyzerViewProperties } from "./AnalyzerViewProperties.js";

interface SpectrogramNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const FREQUENCY_TICK_SPACING_HZ = 1000;

export class SpectrogramNode extends Node {
  private readonly raster: SpectrogramRaster;
  private readonly chartTransform: ChartTransform;

  public constructor(model: AnalyzerModel, viewProperties: AnalyzerViewProperties, options: SpectrogramNodeOptions) {
    super();
    const { viewWidth, viewHeight } = options;

    const frame = new ChartFrame({
      viewWidth,
      viewHeight,
      xRange: new Range(0, 1),
      yRange: new Range(model.minFrequencyProperty.value, Math.max(model.maxFrequencyProperty.value, 1)),
      ySpacing: FREQUENCY_TICK_SPACING_HZ,
      yLabel: "Frequency (Hz)",
    });
    this.chartTransform = frame.chartTransform;

    this.raster = new SpectrogramRaster(model, viewProperties, viewWidth, viewHeight);
    frame.plotLayer.addChild(this.raster);
    this.addChild(frame);

    // Keep the frequency axis in sync with the analysis display range; the raster
    // mapping changes too, so clear the history to avoid mixing scales.
    const retarget = () => {
      this.chartTransform.setModelYRange(
        new Range(model.minFrequencyProperty.value, Math.max(model.maxFrequencyProperty.value, 1)),
      );
      this.raster.clear();
    };
    model.minFrequencyProperty.lazyLink(retarget);
    model.maxFrequencyProperty.lazyLink(retarget);
  }

  public reset(): void {
    this.raster.clear();
  }
}

/** Canvas-2D scrolling raster + F0/formant overlays. */
class SpectrogramRaster extends CanvasNode {
  private readonly model: AnalyzerModel;
  private readonly viewProperties: AnalyzerViewProperties;
  private readonly viewWidth: number;
  private readonly viewHeight: number;
  private readonly cols: number;
  private readonly rows: number;
  private readonly offscreen: HTMLCanvasElement;
  private readonly offContext: CanvasRenderingContext2D;
  private readonly columnImage: ImageData;
  private writeIndex = 0;
  private readonly f0History: Float32Array;
  private readonly formantHistory: Float32Array[];

  public constructor(
    model: AnalyzerModel,
    viewProperties: AnalyzerViewProperties,
    viewWidth: number,
    viewHeight: number,
    providedOptions?: CanvasNodeOptions,
  ) {
    super({ ...providedOptions, canvasBounds: new Bounds2(0, 0, viewWidth, viewHeight) });
    this.model = model;
    this.viewProperties = viewProperties;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.cols = WaveComposerConstants.SPECTROGRAM_HISTORY_COLUMNS;
    this.rows = Math.max(1, Math.round(viewHeight));

    const offscreen = document.createElement("canvas");
    offscreen.width = this.cols;
    offscreen.height = this.rows;
    this.offscreen = offscreen;
    this.offContext = offscreen.getContext("2d") as CanvasRenderingContext2D;
    this.columnImage = this.offContext.createImageData(1, this.rows);

    this.f0History = new Float32Array(this.cols);
    this.formantHistory = [
      new Float32Array(this.cols),
      new Float32Array(this.cols),
      new Float32Array(this.cols),
      new Float32Array(this.cols),
    ];

    this.clear();

    model.frameProcessedEmitter.addListener(() => this.pushFrame());
    // New columns adopt the new colormap immediately; clear so it isn't mixed.
    model.fftSizeProperty.lazyLink(() => this.clear());
    viewProperties.colormapProperty.lazyLink(() => this.clear());
    viewProperties.showF0TrackProperty.lazyLink(() => this.invalidatePaint());
    viewProperties.showFormantTracksProperty.lazyLink(() => this.invalidatePaint());
  }

  /** Resets the scrolling history to the background color. */
  public clear(): void {
    this.offContext.fillStyle = WaveComposerColors.chartBackgroundColorProperty.value.toCSS();
    this.offContext.fillRect(0, 0, this.cols, this.rows);
    this.f0History.fill(0);
    for (const history of this.formantHistory) {
      history.fill(0);
    }
    this.writeIndex = 0;
    this.invalidatePaint();
  }

  private pushFrame(): void {
    const analysis = this.model.analysis;
    if (!analysis) {
      return;
    }
    const sampleRate = this.model.sampleRateProperty.value;
    const half = analysis.powerSpectrumDb.length;
    const fftSize = half * 2;
    const minF = this.model.minFrequencyProperty.value;
    const maxF = Math.max(this.model.maxFrequencyProperty.value, minF + 1);
    const lut = getColormapLut(this.viewProperties.colormapProperty.value);
    const data = this.columnImage.data;
    const dbSpan = WaveComposerConstants.SPECTROGRAM_MAX_DB - WaveComposerConstants.SPECTROGRAM_MIN_DB;

    for (let r = 0; r < this.rows; r++) {
      // Row 0 is the top of the display = highest frequency.
      const frac = this.rows > 1 ? 1 - r / (this.rows - 1) : 0;
      const freq = minF + frac * (maxF - minF);
      let bin = Math.round((freq * fftSize) / sampleRate);
      if (bin < 0) {
        bin = 0;
      } else if (bin >= half) {
        bin = half - 1;
      }
      const db = analysis.powerSpectrumDb[bin] ?? WaveComposerConstants.SPECTROGRAM_MIN_DB;
      let t = (db - WaveComposerConstants.SPECTROGRAM_MIN_DB) / dbSpan;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const lutIndex = Math.round(t * 255) * 3;
      const o = r * 4;
      data[o] = lut[lutIndex] ?? 0;
      data[o + 1] = lut[lutIndex + 1] ?? 0;
      data[o + 2] = lut[lutIndex + 2] ?? 0;
      data[o + 3] = 255;
    }
    this.offContext.putImageData(this.columnImage, this.writeIndex, 0);

    this.f0History[this.writeIndex] = this.model.f0Property.value;
    const formants = this.model.formantsProperty.value;
    for (let f = 0; f < this.formantHistory.length; f++) {
      const history = this.formantHistory[f];
      if (history) {
        history[this.writeIndex] = formants[f]?.frequencyHz ?? 0;
      }
    }
    this.writeIndex = (this.writeIndex + 1) % this.cols;
    this.invalidatePaint();
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.imageSmoothingEnabled = false;
    const scaleX = this.viewWidth / this.cols;
    const wi = this.writeIndex;
    const leftCount = this.cols - wi;

    // Oldest columns [wi .. cols-1] on the left, then [0 .. wi-1] on the right.
    if (leftCount > 0) {
      context.drawImage(this.offscreen, wi, 0, leftCount, this.rows, 0, 0, leftCount * scaleX, this.viewHeight);
    }
    if (wi > 0) {
      context.drawImage(this.offscreen, 0, 0, wi, this.rows, leftCount * scaleX, 0, wi * scaleX, this.viewHeight);
    }

    this.paintTracks(context, scaleX);
  }

  private paintTracks(context: CanvasRenderingContext2D, scaleX: number): void {
    const minF = this.model.minFrequencyProperty.value;
    const maxF = Math.max(this.model.maxFrequencyProperty.value, minF + 1);

    if (this.viewProperties.showF0TrackProperty.value) {
      this.paintTrack(
        context,
        this.f0History,
        WaveComposerColors.f0TrackColorProperty.value.toCSS(),
        2,
        scaleX,
        minF,
        maxF,
      );
    }
    if (this.viewProperties.showFormantTracksProperty.value) {
      const colors = [
        WaveComposerColors.formant1ColorProperty,
        WaveComposerColors.formant2ColorProperty,
        WaveComposerColors.formant3ColorProperty,
        WaveComposerColors.formant4ColorProperty,
      ];
      for (let f = 0; f < this.formantHistory.length; f++) {
        const history = this.formantHistory[f];
        const color = colors[f];
        if (history && color) {
          this.paintTrack(context, history, color.value.toCSS(), 1.5, scaleX, minF, maxF);
        }
      }
    }
  }

  private paintTrack(
    context: CanvasRenderingContext2D,
    history: Float32Array,
    css: string,
    lineWidth: number,
    scaleX: number,
    minF: number,
    maxF: number,
  ): void {
    context.strokeStyle = css;
    context.lineWidth = lineWidth;
    context.beginPath();
    let penDown = false;
    for (let p = 0; p < this.cols; p++) {
      // p = 0 is the oldest column (left edge); matches the raster blit order.
      const dataIndex = (this.writeIndex + p) % this.cols;
      const freq = history[dataIndex] ?? 0;
      if (freq > 0 && freq >= minF && freq <= maxF) {
        const x = (p + 0.5) * scaleX;
        const y = this.viewHeight * (1 - (freq - minF) / (maxF - minF));
        if (penDown) {
          context.lineTo(x, y);
        } else {
          context.moveTo(x, y);
          penDown = true;
        }
      } else {
        penDown = false;
      }
    }
    context.stroke();
  }
}
