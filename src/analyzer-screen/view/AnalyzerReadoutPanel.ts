/**
 * AnalyzerReadoutPanel.ts
 *
 * Numeric measurement readouts: a voiced/unvoiced indicator, pitch (F0) + musical
 * note with cents deviation, the four formant frequencies, HNR and CPP voice-
 * quality metrics, and an input-level meter. Each value binds to a model Property
 * via a DerivedProperty so it updates live; the panel itself holds no DSP state.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { Circle, type Color, GridBox, HBox, Node, Rectangle, Text, VBox } from "scenerystack/scenery";
import { Panel } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import WaveComposerColors from "../../WaveComposerColors.js";
import { WaveComposerConstants } from "../../WaveComposerConstants.js";
import type { AnalyzerModel } from "../model/AnalyzerModel.js";

const EMPTY = "—";
const LEVEL_BAR_WIDTH = 150;
const LEVEL_BAR_HEIGHT = 10;
const LEVEL_FULL_SCALE_RMS = 0.5;

export class AnalyzerReadoutPanel extends Panel {
  public constructor(model: AnalyzerModel) {
    const readout = StringManager.getInstance().getReadoutStrings();
    const panelStrings = StringManager.getInstance().getPanelStrings();

    // ── Voiced / unvoiced indicator ──────────────────────────────────────────
    const voicedFill = new DerivedProperty(
      [model.isVoicedProperty, WaveComposerColors.voicedColorProperty, WaveComposerColors.unvoicedColorProperty],
      (voiced, on, off): Color => (voiced ? on : off),
    );
    const voicedText = new DerivedProperty(
      [model.isVoicedProperty, readout.voicedStringProperty, readout.unvoicedStringProperty],
      (voiced, on, off) => (voiced ? on : off),
    );
    const indicator = new HBox({
      spacing: 6,
      children: [
        new Circle(6, { fill: voicedFill }),
        new Text(voicedText, { font: WaveComposerConstants.LABEL_FONT, fill: WaveComposerColors.textColorProperty }),
      ],
    });

    // ── Numeric rows ──────────────────────────────────────────────────────────
    const hz = (n: number): string => (n > 0 ? `${Math.round(n)} Hz` : EMPTY);
    const db = (n: number, valid: boolean): string => (valid ? `${toFixed(n, 1)} dB` : EMPTY);

    const pitchValue = new DerivedProperty([model.f0Property], hz);
    const noteValue = new DerivedProperty(
      [model.isVoicedProperty, model.noteNameProperty, model.centsProperty],
      (voiced, note, cents) => (voiced && note ? `${note} ${cents >= 0 ? "+" : ""}${cents}¢` : EMPTY),
    );
    const hnrValue = new DerivedProperty([model.hnrProperty, model.isVoicedProperty], (v, voiced) => db(v, voiced));
    const cppValue = new DerivedProperty([model.cppProperty, model.isVoicedProperty], (v, voiced) => db(v, voiced));

    const rows: Node[][] = [
      [label(readout.pitchStringProperty), value(pitchValue)],
      [label(readout.noteStringProperty), value(noteValue)],
      [label(readout.formant1StringProperty), value(new DerivedProperty([model.f1FrequencyProperty], hz))],
      [label(readout.formant2StringProperty), value(new DerivedProperty([model.f2FrequencyProperty], hz))],
      [label(readout.formant3StringProperty), value(new DerivedProperty([model.f3FrequencyProperty], hz))],
      [label(readout.formant4StringProperty), value(new DerivedProperty([model.f4FrequencyProperty], hz))],
      [label(readout.hnrStringProperty), value(hnrValue)],
      [label(readout.cppStringProperty), value(cppValue)],
    ];
    const grid = new GridBox({ rows, xSpacing: 16, ySpacing: 5, xAlign: "left" });

    // ── Input-level meter ──────────────────────────────────────────────────────
    const levelTrack = new Rectangle(0, 0, LEVEL_BAR_WIDTH, LEVEL_BAR_HEIGHT, {
      fill: WaveComposerColors.chartBackgroundColorProperty,
      stroke: WaveComposerColors.panelBorderColorProperty,
      cornerRadius: 2,
    });
    const levelFill = new Rectangle(0, 0, 0, LEVEL_BAR_HEIGHT, {
      fill: WaveComposerColors.accentColorProperty,
      cornerRadius: 2,
    });
    model.rmsLevelProperty.link((rms) => {
      const fraction = Math.max(0, Math.min(1, rms / LEVEL_FULL_SCALE_RMS));
      levelFill.setRect(0, 0, fraction * LEVEL_BAR_WIDTH, LEVEL_BAR_HEIGHT);
    });
    const levelMeter = new HBox({
      spacing: 8,
      children: [
        new Text(readout.levelStringProperty, {
          font: WaveComposerConstants.LABEL_FONT,
          fill: WaveComposerColors.textColorProperty,
        }),
        new Node({ children: [levelTrack, levelFill] }),
      ],
    });

    const content = new VBox({
      align: "left",
      spacing: 8,
      children: [
        new Text(panelStrings.measurementsStringProperty, {
          font: WaveComposerConstants.PANEL_TITLE_FONT,
          fill: WaveComposerColors.textColorProperty,
        }),
        indicator,
        grid,
        levelMeter,
      ],
    });

    super(content, {
      fill: WaveComposerColors.panelBackgroundColorProperty,
      stroke: WaveComposerColors.panelBorderColorProperty,
      xMargin: WaveComposerConstants.PANEL_X_MARGIN,
      yMargin: WaveComposerConstants.PANEL_Y_MARGIN,
      cornerRadius: WaveComposerConstants.CORNER_RADIUS,
      align: "left",
    });
  }
}

function label(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, {
    font: WaveComposerConstants.READOUT_LABEL_FONT,
    fill: WaveComposerColors.textColorProperty,
  });
}

function value(stringProperty: TReadOnlyProperty<string>): Node {
  return new Text(stringProperty, {
    font: WaveComposerConstants.READOUT_VALUE_FONT,
    fill: WaveComposerColors.accentColorProperty,
  });
}
