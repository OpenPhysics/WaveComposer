/**
 * CompositionState.ts
 *
 * Reactive state for the wave-composition lab: up to four partials and named
 * pedagogical presets (pure tone, intervals, beats, phase, timbre shapes).
 */
import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { CompositionPartial } from "./audio/ComposableFrameSource.js";
import { CompositionConstants } from "./audio/ComposableFrameSource.js";

const FREQUENCY_RANGE = new Range(50, 2000);
const AMPLITUDE_RANGE = new Range(0, 1);
const PHASE_RANGE = new Range(0, 2 * Math.PI);

export const ComposePreset = {
  CUSTOM: "custom",
  PURE_TONE: "pureTone",
  OCTAVE: "octave",
  MAJOR_TRIAD: "majorTriad",
  BEATS: "beats",
  PHASE_CANCEL: "phaseCancel",
  PHASE_QUADRATURE: "phaseQuadrature",
  HARMONIC_SERIES: "harmonicSeries",
  SAWTOOTH_ISH: "sawtoothIsh",
  SQUARE_ISH: "squareIsh",
  TRIANGLE_ISH: "triangleIsh",
} as const;

export type ComposePreset = (typeof ComposePreset)[keyof typeof ComposePreset];

export const COMPOSE_SOURCE_ID = "compose";

export const ComposePresetValues = [
  ComposePreset.CUSTOM,
  ComposePreset.PURE_TONE,
  ComposePreset.OCTAVE,
  ComposePreset.MAJOR_TRIAD,
  ComposePreset.BEATS,
  ComposePreset.PHASE_CANCEL,
  ComposePreset.PHASE_QUADRATURE,
  ComposePreset.HARMONIC_SERIES,
  ComposePreset.SAWTOOTH_ISH,
  ComposePreset.SQUARE_ISH,
  ComposePreset.TRIANGLE_ISH,
] as const;

/** Per-partial reactive controls (frequency, amplitude, phase, enabled). */
export class CompositionPartialState {
  public readonly frequencyProperty: NumberProperty;
  public readonly amplitudeProperty: NumberProperty;
  public readonly phaseProperty: NumberProperty;
  public readonly enabledProperty: BooleanProperty;

  public constructor(
    defaultFrequencyHz: number,
    defaultAmplitude: number,
    defaultPhaseRad: number,
    defaultEnabled: boolean,
  ) {
    this.frequencyProperty = new NumberProperty(defaultFrequencyHz, { range: FREQUENCY_RANGE });
    this.amplitudeProperty = new NumberProperty(defaultAmplitude, { range: AMPLITUDE_RANGE });
    this.phaseProperty = new NumberProperty(defaultPhaseRad, { range: PHASE_RANGE });
    this.enabledProperty = new BooleanProperty(defaultEnabled);
  }

  public toPartial(): CompositionPartial {
    return {
      frequencyHz: this.frequencyProperty.value,
      amplitude: this.amplitudeProperty.value,
      phaseRad: this.phaseProperty.value,
      enabled: this.enabledProperty.value,
    };
  }

  public reset(): void {
    this.frequencyProperty.reset();
    this.amplitudeProperty.reset();
    this.phaseProperty.reset();
    this.enabledProperty.reset();
  }
}

export class CompositionState {
  public readonly partials: readonly CompositionPartialState[];
  public readonly presetProperty = new Property<ComposePreset>(ComposePreset.CUSTOM, {
    validValues: [...ComposePresetValues],
  });
  private applyingPreset = false;

  public constructor() {
    this.partials = [
      new CompositionPartialState(220, 0.5, 0, true),
      new CompositionPartialState(224, 0.5, 0, true),
      new CompositionPartialState(440, 0, 0, false),
      new CompositionPartialState(660, 0, 0, false),
    ];
    assertPartialCount(this.partials.length);
  }

  /** Snapshot for the composable audio generator. */
  public getPartials(): CompositionPartial[] {
    return this.partials.map((p) => p.toPartial());
  }

  public applyPreset(preset: ComposePreset): void {
    this.presetProperty.value = preset;
    if (preset === ComposePreset.CUSTOM) {
      return;
    }

    this.applyingPreset = true;
    try {
      const defaults = presetDefaults(preset);
      for (let i = 0; i < this.partials.length; i++) {
        const partial = this.partials[i];
        const values = defaults[i];
        if (!(partial && values)) {
          partial?.enabledProperty.set(false);
          continue;
        }
        if (values.enabled) {
          partial.frequencyProperty.set(values.frequencyHz);
        }
        partial.amplitudeProperty.set(values.amplitude);
        partial.phaseProperty.set(values.phaseRad);
        partial.enabledProperty.set(values.enabled);
      }
    } finally {
      this.applyingPreset = false;
    }
  }

  /** Switch to Custom when the user edits a partial (not during preset application). */
  public markCustom(): void {
    if (!this.applyingPreset) {
      this.presetProperty.value = ComposePreset.CUSTOM;
    }
  }

  public reset(): void {
    this.presetProperty.reset();
    for (const partial of this.partials) {
      partial.reset();
    }
  }
}

function assertPartialCount(count: number): void {
  if (count !== CompositionConstants.MAX_PARTIALS) {
    throw new Error(`Expected ${CompositionConstants.MAX_PARTIALS} composition partials, got ${count}`);
  }
}

type PartialDefaults = {
  frequencyHz: number;
  amplitude: number;
  phaseRad: number;
  enabled: boolean;
};

function presetDefaults(preset: ComposePreset): PartialDefaults[] {
  const pi = Math.PI;
  const halfPi = pi / 2;
  switch (preset) {
    case ComposePreset.PURE_TONE:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 660, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 880, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.OCTAVE:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0.25, phaseRad: 0, enabled: true },
        { frequencyHz: 660, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 880, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.MAJOR_TRIAD:
      return [
        { frequencyHz: 220, amplitude: 0.4, phaseRad: 0, enabled: true },
        { frequencyHz: 275, amplitude: 0.3, phaseRad: 0, enabled: true },
        { frequencyHz: 330, amplitude: 0.25, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.BEATS:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 224, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 660, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.PHASE_CANCEL:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 220, amplitude: 0.5, phaseRad: pi, enabled: true },
        { frequencyHz: 440, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 660, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.PHASE_QUADRATURE:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 220, amplitude: 0.5, phaseRad: halfPi, enabled: true },
        { frequencyHz: 440, amplitude: 0, phaseRad: 0, enabled: false },
        { frequencyHz: 660, amplitude: 0, phaseRad: 0, enabled: false },
      ];
    case ComposePreset.HARMONIC_SERIES:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0.35, phaseRad: 0, enabled: true },
        { frequencyHz: 660, amplitude: 0.25, phaseRad: 0, enabled: true },
        { frequencyHz: 880, amplitude: 0.15, phaseRad: 0, enabled: true },
      ];
    case ComposePreset.SQUARE_ISH:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 660, amplitude: 0.17, phaseRad: 0, enabled: true },
        { frequencyHz: 1100, amplitude: 0.1, phaseRad: 0, enabled: true },
        { frequencyHz: 1540, amplitude: 0.07, phaseRad: 0, enabled: true },
      ];
    case ComposePreset.SAWTOOTH_ISH:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 440, amplitude: 0.25, phaseRad: 0, enabled: true },
        { frequencyHz: 660, amplitude: 0.17, phaseRad: 0, enabled: true },
        { frequencyHz: 880, amplitude: 0.125, phaseRad: 0, enabled: true },
      ];
    case ComposePreset.TRIANGLE_ISH:
      return [
        { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
        { frequencyHz: 660, amplitude: 0.06, phaseRad: 0, enabled: true },
        { frequencyHz: 1100, amplitude: 0.02, phaseRad: 0, enabled: true },
        { frequencyHz: 1540, amplitude: 0.01, phaseRad: 0, enabled: true },
      ];
    default:
      return [];
  }
}
