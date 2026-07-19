/**
 * VowelPlotNode.ts
 *
 * F1×F2 vowel chart. Axes are inverted (F2 high→low left→right, F1 low→high
 * top→bottom) to match the conventional IPA vowel quadrilateral. Reference IPA
 * vowels are drawn as labeled markers; the live measured vowel is a moving dot
 * with a short fading trail, shown only while the frame is voiced.
 */
import { ScatterPlot } from "scenerystack/bamboo";
import { Vector2 } from "scenerystack/dot";
import { Circle, Node, Text } from "scenerystack/scenery";
import { ChartFrame } from "../../common/view/ChartFrame.js";
import { IPA_VOWELS } from "../../common/view/IpaVowels.js";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";
import type { VoiceModel } from "../model/VoiceModel.js";

interface VowelPlotNodeOptions {
  viewWidth: number;
  viewHeight: number;
}

const F1_TICK_SPACING_HZ = 200;
const F2_TICK_SPACING_HZ = 500;
const TRAIL_LENGTH = 40;

export class VowelPlotNode extends Node {
  private readonly trail: Vector2[] = [];

  public constructor(model: VoiceModel, options: VowelPlotNodeOptions) {
    super();
    const axisStrings = StringManager.getInstance().getAxisStrings();

    const frame = new ChartFrame({
      viewWidth: options.viewWidth,
      viewHeight: options.viewHeight,
      xRange: WaveComposerConstants.VOWEL_F2_RANGE,
      yRange: WaveComposerConstants.VOWEL_F1_RANGE,
      xRangeInverted: true,
      yRangeInverted: true,
      xSpacing: F2_TICK_SPACING_HZ,
      ySpacing: F1_TICK_SPACING_HZ,
      xLabel: axisStrings.f2StringProperty,
      yLabel: axisStrings.f1StringProperty,
    });
    const chartTransform = frame.chartTransform;

    // Reference IPA vowels.
    const referenceLayer = new Node();
    for (const vowel of IPA_VOWELS) {
      const point = chartTransform.modelToViewXY(vowel.f2Hz, vowel.f1Hz);
      referenceLayer.addChild(new Circle(2, { fill: WaveComposerColors.vowelReferenceColorProperty, center: point }));
      referenceLayer.addChild(
        new Text(vowel.symbol, {
          font: WaveComposerConstants.VOWEL_LABEL_FONT,
          fill: WaveComposerColors.vowelReferenceColorProperty,
          centerX: point.x,
          centerY: point.y - 11,
        }),
      );
    }
    frame.plotLayer.addChild(referenceLayer);

    // Fading trail + current marker.
    const trailPlot = new ScatterPlot(chartTransform, [], {
      radius: 2.5,
      fill: WaveComposerColors.vowelCurrentColorProperty,
      opacity: 0.45,
    });
    frame.plotLayer.addChild(trailPlot);

    const currentMarker = new Circle(6, {
      fill: WaveComposerColors.vowelCurrentColorProperty,
      stroke: WaveComposerColors.textColorProperty,
      lineWidth: 1.5,
      visible: false,
    });
    frame.plotLayer.addChild(currentMarker);

    this.addChild(frame);

    model.frameProcessedEmitter.addListener(() => {
      const f1 = model.f1FrequencyProperty.value;
      const f2 = model.f2FrequencyProperty.value;
      const visible =
        model.isVoicedProperty.value &&
        f1 > 0 &&
        f2 > 0 &&
        WaveComposerConstants.VOWEL_F1_RANGE.contains(f1) &&
        WaveComposerConstants.VOWEL_F2_RANGE.contains(f2);

      currentMarker.visible = visible;
      if (visible) {
        currentMarker.center = chartTransform.modelToViewXY(f2, f1);
        this.trail.push(new Vector2(f2, f1));
        if (this.trail.length > TRAIL_LENGTH) {
          this.trail.shift();
        }
        trailPlot.setDataSet([...this.trail]);
      }
    });
  }

  public reset(): void {
    this.trail.length = 0;
  }
}
