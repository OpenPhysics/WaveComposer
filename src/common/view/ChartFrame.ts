/**
 * ChartFrame.ts
 *
 * Reusable static "chrome" for a bamboo chart: a bordered background rectangle,
 * major grid lines, edge tick marks + labels, and optional axis titles. It owns a
 * {@link ChartTransform} (model↔view mapping) and a clipped {@link plotLayer} that
 * callers populate with plots (e.g. a ChartCanvasNode of CanvasLinePlots, or a
 * ScatterPlot). The spectrum, waveform, cepstrum and vowel charts all share it so
 * they look consistent and the axis wiring lives in one place.
 *
 * Local origin (0,0) is the top-left corner of the plotting area; tick labels and
 * axis titles extend into small gutters to the left of / below it.
 */
import type { TReadOnlyProperty } from "scenerystack/axon";
import { AxisLine, ChartRectangle, ChartTransform, GridLineSet, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import type { Range } from "scenerystack/dot";
import { toFixed } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { Node, Text } from "scenerystack/scenery";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";

const TICK_LENGTH = 5;
const Y_TITLE_GUTTER = 38;
const X_TITLE_GUTTER = 30;

export interface ChartFrameOptions {
  viewWidth: number;
  viewHeight: number;
  xRange: Range;
  yRange: Range;
  xRangeInverted?: boolean;
  yRangeInverted?: boolean;
  /** Spacing (model units) for grid + ticks on each axis. */
  xSpacing?: number;
  ySpacing?: number;
  xLabel?: string | TReadOnlyProperty<string>;
  yLabel?: string | TReadOnlyProperty<string>;
  /** Custom tick-label factories (default: rounded integer). */
  createXTickLabel?: (value: number) => Node;
  createYTickLabel?: (value: number) => Node;
}

export class ChartFrame extends Node {
  public readonly chartTransform: ChartTransform;
  /** Clipped layer for plot content; add CanvasLinePlot/ScatterPlot nodes here. */
  public readonly plotLayer: Node;

  public constructor(options: ChartFrameOptions) {
    super();

    const transform = new ChartTransform({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      modelXRange: options.xRange,
      modelYRange: options.yRange,
      modelXRangeInverted: options.xRangeInverted ?? false,
      modelYRangeInverted: options.yRangeInverted ?? false,
    });
    this.chartTransform = transform;

    const background = new ChartRectangle(transform, {
      fill: WaveComposerColors.chartBackgroundColorProperty,
      stroke: WaveComposerColors.panelBorderColorProperty,
      lineWidth: 1,
      cornerXRadius: WaveComposerConstants.CORNER_RADIUS,
      cornerYRadius: WaveComposerConstants.CORNER_RADIUS,
    });
    this.addChild(background);

    if (options.xSpacing !== undefined) {
      this.addChild(
        new GridLineSet(transform, Orientation.HORIZONTAL, options.xSpacing, {
          stroke: WaveComposerColors.gridLineColorProperty,
          lineWidth: 0.5,
        }),
      );
    }
    if (options.ySpacing !== undefined) {
      this.addChild(
        new GridLineSet(transform, Orientation.VERTICAL, options.ySpacing, {
          stroke: WaveComposerColors.gridLineColorProperty,
          lineWidth: 0.5,
        }),
      );
    }

    this.plotLayer = new Node({
      clipArea: Shape.rectangle(0, 0, options.viewWidth, options.viewHeight),
    });
    this.addChild(this.plotLayer);

    // Axes along the chart edges.
    this.addChild(
      new AxisLine(transform, Orientation.VERTICAL, {
        stroke: WaveComposerColors.axisColorProperty,
        lineWidth: 1,
        value: 0,
      }),
    );

    if (options.xSpacing !== undefined) {
      this.addChild(
        new TickMarkSet(transform, Orientation.HORIZONTAL, options.xSpacing, {
          edge: "min",
          stroke: WaveComposerColors.axisColorProperty,
          extent: TICK_LENGTH,
        }),
      );
      this.addChild(
        new TickLabelSet(transform, Orientation.HORIZONTAL, options.xSpacing, {
          edge: "min",
          createLabel: options.createXTickLabel ?? defaultTickLabel,
        }),
      );
    }
    if (options.ySpacing !== undefined) {
      this.addChild(
        new TickMarkSet(transform, Orientation.VERTICAL, options.ySpacing, {
          edge: "min",
          stroke: WaveComposerColors.axisColorProperty,
          extent: TICK_LENGTH,
        }),
      );
      this.addChild(
        new TickLabelSet(transform, Orientation.VERTICAL, options.ySpacing, {
          edge: "min",
          createLabel: options.createYTickLabel ?? defaultTickLabel,
        }),
      );
    }

    if (options.xLabel !== undefined) {
      const xTitle = new Text(options.xLabel, {
        font: WaveComposerConstants.AXIS_LABEL_FONT,
        fill: WaveComposerColors.textColorProperty,
        centerX: options.viewWidth / 2,
        top: options.viewHeight + X_TITLE_GUTTER * 0.5,
      });
      this.addChild(xTitle);
    }
    if (options.yLabel !== undefined) {
      const yTitle = new Text(options.yLabel, {
        font: WaveComposerConstants.AXIS_LABEL_FONT,
        fill: WaveComposerColors.textColorProperty,
        rotation: -Math.PI / 2,
      });
      yTitle.right = -Y_TITLE_GUTTER;
      yTitle.centerY = options.viewHeight / 2;
      this.addChild(yTitle);
    }
  }
}

function defaultTickLabel(value: number): Node {
  // Integers print plainly; fractional spacings (e.g. 0.5) keep one decimal so
  // adjacent ticks don't collapse to the same rounded label.
  const text = Number.isInteger(value) ? `${value}` : toFixed(value, 1);
  return new Text(text, {
    font: WaveComposerConstants.TICK_FONT,
    fill: WaveComposerColors.textColorProperty,
  });
}
