/**
 * presets.ts
 *
 * Synthesized fallback sources for presets that have no suitable openly-licensed
 * recording. Currently only "Singing": a sung "ah" arpeggio with vibrato, built
 * from the same source-filter vowel generator the DSP tests use. (Every other
 * preset is a real recording loaded via AudioFileFrameSource — see CREDITS.md.)
 */
import { PresetFrameSource } from "./PresetFrameSource.js";
import { generateVowel } from "./SyntheticFrameSource.js";

const AMPLITUDE = 0.7;
const VIBRATO_RATE_HZ = 5.5;
const VIBRATO_DEPTH = 0.025; // ±2.5% of f0
const NOTE_DURATION_S = 0.7;

// Formants for /a/ ("ah"), the vowel that is sung.
const AH_FORMANTS_HZ = [730, 1090, 2440, 3400];
const AH_BANDWIDTHS_HZ = [80, 90, 120, 130];

// A simple sung arpeggio (A3–C4–E4–G4–E4–C4) that loops as a vocalise.
const MELODY_HZ = [220, 261.63, 329.63, 392.0, 329.63, 261.63];

/** A synthesized sung vowel melody with vibrato (the "Singing" preset fallback). */
export function createSingingSource(): PresetFrameSource {
  return new PresetFrameSource((out, sampleRate, timeS) => {
    const noteIndex = Math.floor(timeS / NOTE_DURATION_S) % MELODY_HZ.length;
    const baseF0 = MELODY_HZ[noteIndex] ?? MELODY_HZ[0] ?? 220;
    const f0 = baseF0 * (1 + VIBRATO_DEPTH * Math.sin(2 * Math.PI * VIBRATO_RATE_HZ * timeS));
    out.set(generateVowel(AH_FORMANTS_HZ, AH_BANDWIDTHS_HZ, f0, sampleRate, out.length, AMPLITUDE));
  });
}
