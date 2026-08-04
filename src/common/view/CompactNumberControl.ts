/**
 * CompactNumberControl.ts
 *
 * A NumberControl laid out on a single line — `title —slider— ◀ value ▶` — instead
 * of the default two rows. Panels that stack many of these (the Composer screen's
 * twelve partial controls) only fit beside the charts at this height.
 *
 * Pass shared {@link AlignGroup}s to make the title and value columns of several
 * controls line up; without them each control sizes its own columns.
 */
import type { NumberProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Dimension2, type Range } from "scenerystack/dot";
import { AlignGroup, HBox } from "scenerystack/scenery";
import { NumberControl, type NumberControlOptions } from "scenerystack/scenery-phet";
import { Tandem } from "scenerystack/tandem";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";

const DEFAULT_TRACK_SIZE = new Dimension2(84, 3);
const DEFAULT_THUMB_SIZE = new Dimension2(11, 20);

export interface CompactNumberControlOptions extends NumberControlOptions {
  /** Shared group that keeps the title column the same width across controls. */
  titleGroup?: AlignGroup;
  /** Shared group that keeps the value column the same width across controls. */
  valueGroup?: AlignGroup;
  /**
   * Total row width. The slider absorbs whatever the title, arrows and value
   * leave over, so a row can never grow past the panel that holds it.
   */
  rowWidth?: number;
}

export function createCompactNumberControl(
  title: TReadOnlyProperty<string>,
  property: NumberProperty,
  range: Range,
  providedOptions: CompactNumberControlOptions = {},
): NumberControl {
  const { titleGroup, valueGroup, rowWidth, ...options } = providedOptions;
  const titles = titleGroup ?? new AlignGroup({ matchVertical: false });
  const values = valueGroup ?? new AlignGroup({ matchVertical: false });

  return new NumberControl(title, property, range, {
    layoutFunction: (titleNode, numberDisplay, slider, decrementButton, incrementButton) => {
      if (rowWidth !== undefined) {
        slider.mutateLayoutOptions({ stretch: true });
      }
      return new HBox({
        spacing: 4,
        ...(rowWidth === undefined ? {} : { preferredWidth: rowWidth }),
        children: [
          titles.createBox(titleNode, { xAlign: "left" }),
          slider,
          ...(decrementButton ? [decrementButton] : []),
          values.createBox(numberDisplay, { xAlign: "right" }),
          ...(incrementButton ? [incrementButton] : []),
        ],
      });
    },
    titleNodeOptions: { font: WaveComposerConstants.LABEL_FONT, fill: WaveComposerColors.textColorProperty },
    arrowButtonOptions: { scale: 0.62 },
    tandem: Tandem.OPT_OUT,
    ...options,
    numberDisplayOptions: {
      textOptions: { font: WaveComposerConstants.CONTROL_FONT },
      ...options.numberDisplayOptions,
    },
    sliderOptions: {
      trackSize: DEFAULT_TRACK_SIZE,
      thumbSize: DEFAULT_THUMB_SIZE,
      ...options.sliderOptions,
    },
  });
}
