/**
 * StandingWaveNode.ts
 *
 * Compact 1D standing-wave strip: y(x) = Σ Aₙ sin(nπx/L) cos(2πnf₀t), synced to
 * the detected F0 (or the compose-lab fundamental when that source is active).
 */
import { Bounds2, Range } from "scenerystack/dot";
import { CanvasNode, Node } from "scenerystack/scenery";
import type { HarmonicChartModel } from "../../common/model/HarmonicChartModel.js";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import { StringManager } from "../../i18n/StringManager.js";
import SimColors from "../../SimColors.js";

interface StandingWaveNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const POINT_COUNT = 200;
const TWO_PI = 2 * Math.PI;

export class StandingWaveNode extends Node {
  public constructor(model: HarmonicChartModel, options: StandingWaveNodeOptions) {
    super();
    const physics = StringManager.getInstance().getPhysicsStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: new Range(0, 1),
      yRange: new Range(-1, 1),
      xSpacing: 0.25,
      ySpacing: 0.5,
      xLabel: physics.standingWaveStringProperty,
    });

    frame.plotLayer.addChild(new StandingWaveCanvas(model, options.viewWidth, options.viewHeight));
    this.addChild(frame);
  }
}

class StandingWaveCanvas extends CanvasNode {
  private readonly model: HarmonicChartModel;
  private readonly viewWidth: number;
  private readonly viewHeight: number;
  private phaseS = 0;

  public constructor(model: HarmonicChartModel, viewWidth: number, viewHeight: number) {
    super({ canvasBounds: new Bounds2(0, 0, viewWidth, viewHeight) });
    this.model = model;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    model.frameProcessedEmitter.addListener(() => {
      const f0 = this.model.getFundamentalHz();
      this.phaseS += f0 > 0 ? 1 / 60 : 0;
      this.invalidatePaint();
    });
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const f0 = this.model.getFundamentalHz();
    if (f0 <= 0) {
      return;
    }

    const modes = this.getModeAmplitudes();
    const stroke = SimColors.standingWaveColorProperty.value.toCSS();
    context.strokeStyle = stroke;
    context.lineWidth = 2;
    context.beginPath();

    for (let i = 0; i <= POINT_COUNT; i++) {
      const xNorm = i / POINT_COUNT;
      let y = 0;
      for (const mode of modes) {
        if (!mode || mode.amplitude <= 0) {
          continue;
        }
        const n = mode.modeNumber;
        const spatial = Math.sin(n * Math.PI * xNorm);
        const temporal = Math.cos(TWO_PI * f0 * n * this.phaseS);
        y += mode.amplitude * spatial * temporal;
      }
      const px = xNorm * this.viewWidth;
      const py = this.viewHeight / 2 - (y * this.viewHeight) / 2;
      if (i === 0) {
        context.moveTo(px, py);
      } else {
        context.lineTo(px, py);
      }
    }
    context.stroke();
  }

  private getModeAmplitudes(): { modeNumber: number; amplitude: number }[] {
    return [...this.model.getStandingWaveModes()];
  }
}
