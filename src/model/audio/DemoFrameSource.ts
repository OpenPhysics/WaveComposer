/**
 * DemoFrameSource.ts
 *
 * A lively, self-contained {@link AudioFrameSource} used when no microphone is
 * available (and as the default on load, so the displays animate immediately and
 * the sim is verifiable headlessly).
 *
 * Each frame is synthesized with {@link generateVowel} — a glottal impulse train
 * driven through a cascade of formant resonators. That is exactly the source-
 * filter model LPC is built to invert, so the analyzer recovers a clear F0 *and*
 * clean formants (the same generator the DSP unit tests rely on). Across frames we
 * slowly morph the formants between several vowels and apply a gentle F0 vibrato,
 * so the vowel marker wanders the vowel space and the spectrogram tracks weave.
 */

import type { AudioFrameSource } from "./AudioFrameSource.js";
import { generateVowel } from "./SyntheticFrameSource.js";

const DEMO_SAMPLE_RATE = 44100;

// Fundamental and its vibrato (gentle, singer-like).
const F0_BASE_HZ = 130;
const VIBRATO_RATE_HZ = 5;
const VIBRATO_DEPTH = 0.03; // ±3% of F0

// Seconds spent morphing from one vowel to the next.
const MORPH_PERIOD_S = 4;

// Output level each frame is normalized to (generateVowel peak-normalizes).
const AMPLITUDE = 0.7;

// Formant targets (Hz) for a handful of vowels the demo cycles through.
// Roughly /a/, /i/, /ɛ/, /u/ — chosen to spread across the F1×F2 vowel space.
const VOWEL_FORMANTS_HZ: readonly (readonly number[])[] = [
  [730, 1090, 2440, 3400],
  [270, 2290, 3010, 3500],
  [530, 1840, 2480, 3400],
  [300, 870, 2240, 3400],
];
const FORMANT_BANDWIDTHS_HZ = [80, 90, 120, 130];

/** Smoothstep easing for a gentle vowel-to-vowel crossfade. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export class DemoFrameSource implements AudioFrameSource {
  public readonly sampleRate: number;
  public readonly isActive = true;

  // Elapsed time, advanced one frame at a time; drives vibrato + vowel morph.
  private timeS = 0;

  public constructor(sampleRate: number = DEMO_SAMPLE_RATE) {
    this.sampleRate = sampleRate;
  }

  /** Interpolated formant frequencies at the given time (vowel morph). */
  private formantsAt(timeS: number): number[] {
    const phase = (timeS / MORPH_PERIOD_S) % VOWEL_FORMANTS_HZ.length;
    const index = Math.floor(phase);
    const frac = smoothstep(phase - index);
    const a = VOWEL_FORMANTS_HZ[index] ?? VOWEL_FORMANTS_HZ[0] ?? [];
    const b = VOWEL_FORMANTS_HZ[(index + 1) % VOWEL_FORMANTS_HZ.length] ?? a;
    const out: number[] = [];
    for (let f = 0; f < a.length; f++) {
      out[f] = (a[f] ?? 0) + frac * ((b[f] ?? 0) - (a[f] ?? 0));
    }
    return out;
  }

  public getFrame(out: Float32Array): boolean {
    const f0 = F0_BASE_HZ * (1 + VIBRATO_DEPTH * Math.sin(2 * Math.PI * VIBRATO_RATE_HZ * this.timeS));
    const formants = this.formantsAt(this.timeS);
    const frame = generateVowel(formants, FORMANT_BANDWIDTHS_HZ, f0, this.sampleRate, out.length, AMPLITUDE);
    out.set(frame);
    this.timeS += out.length / this.sampleRate;
    return true;
  }
}
