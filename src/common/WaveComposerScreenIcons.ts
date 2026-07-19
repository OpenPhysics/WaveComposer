/**
 * WaveComposerScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for the three Wave Composer
 * screens. Drawn on the standard PhET 548 × 373 canvas using WaveComposerColors.
 *
 *   Composer — stacked sinusoids summing into a thicker composite wave.
 *   Analyzer — spectrum curve with an LPC envelope overlay.
 *   Voice    — waveform plus F1/F2 formant markers (vowel analysis).
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import WaveComposerColors from "../WaveComposerColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: WaveComposerColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: WaveComposerColors.backgroundColorProperty,
  });
}

function chartPanel(): Rectangle {
  return new Rectangle(40, 40, W - 80, H - 80, 10, 10, {
    fill: WaveComposerColors.chartBackgroundColorProperty,
    stroke: WaveComposerColors.panelBorderColorProperty,
    lineWidth: 3,
  });
}

function wavePath(
  x0: number,
  x1: number,
  y0: number,
  amp: number,
  cycles: number,
  phase: number,
  stroke: unknown,
  lineWidth = 4,
): Path {
  const shape = new Shape();
  const samples = 64;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x1 - x0);
    const y = y0 + amp * Math.sin(phase + t * cycles * Math.PI * 2);
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  return new Path(shape, {
    stroke: stroke as never,
    lineWidth,
    lineCap: "round",
    lineJoin: "round",
  });
}

export function createComposerIcon(): ScreenIcon {
  const y = H / 2;
  return iconFrom(
    new Node({
      children: [
        background(),
        chartPanel(),
        wavePath(70, W - 70, y, 35, 2, 0, WaveComposerColors.formant1ColorProperty, 3),
        wavePath(70, W - 70, y, 28, 3, 0.4, WaveComposerColors.formant2ColorProperty, 3),
        wavePath(70, W - 70, y, 55, 2, 0.2, WaveComposerColors.waveformColorProperty, 6),
      ],
    }),
  );
}

export function createAnalyzerIcon(): ScreenIcon {
  // Spectrum-like decaying envelope with harmonic peaks.
  const spectrum = new Shape();
  const x0 = 70;
  const x1 = W - 70;
  const baseY = H - 90;
  const samples = 80;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x1 - x0);
    const envelope = Math.exp(-2.2 * t);
    const harmonics = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 8));
    const y = baseY - 180 * envelope * harmonics;
    if (i === 0) {
      spectrum.moveTo(x, y);
    } else {
      spectrum.lineTo(x, y);
    }
  }
  const lpc = new Shape();
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = x0 + t * (x1 - x0);
    const y = baseY - 170 * Math.exp(-1.8 * t) * (0.7 + 0.3 * Math.sin(t * Math.PI * 3));
    if (i === 0) {
      lpc.moveTo(x, y);
    } else {
      lpc.lineTo(x, y);
    }
  }

  return iconFrom(
    new Node({
      children: [
        background(),
        chartPanel(),
        new Line(70, baseY, W - 70, baseY, {
          stroke: WaveComposerColors.axisColorProperty,
          lineWidth: 2,
        }),
        new Path(spectrum, {
          stroke: WaveComposerColors.spectrumCurveColorProperty,
          lineWidth: 4,
          lineCap: "round",
          lineJoin: "round",
        }),
        new Path(lpc, {
          stroke: WaveComposerColors.lpcEnvelopeColorProperty,
          lineWidth: 4,
          lineCap: "round",
          lineJoin: "round",
        }),
      ],
    }),
  );
}

export function createVoiceIcon(): ScreenIcon {
  const y = H / 2 + 40;
  const f1 = new Circle(12, {
    fill: WaveComposerColors.formant1ColorProperty,
    centerX: W * 0.35,
    centerY: H / 2 - 40,
  });
  const f2 = new Circle(12, {
    fill: WaveComposerColors.formant2ColorProperty,
    centerX: W * 0.58,
    centerY: H / 2 - 70,
  });
  const vowel = new Circle(16, {
    fill: WaveComposerColors.vowelCurrentColorProperty,
    centerX: W * 0.48,
    centerY: H / 2 - 55,
  });

  return iconFrom(
    new Node({
      children: [
        background(),
        chartPanel(),
        wavePath(70, W - 70, y, 40, 3.5, 0, WaveComposerColors.waveformColorProperty, 5),
        f1,
        f2,
        vowel,
        new Line(f1.centerX, f1.centerY, vowel.centerX, vowel.centerY, {
          stroke: WaveComposerColors.sourceFilterColorProperty,
          lineWidth: 3,
        }),
        new Line(f2.centerX, f2.centerY, vowel.centerX, vowel.centerY, {
          stroke: WaveComposerColors.sourceFilterColorProperty,
          lineWidth: 3,
        }),
      ],
    }),
  );
}
