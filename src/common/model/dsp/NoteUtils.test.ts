import { describe, expect, it } from "vitest";
import {
  centsFromFrequency,
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  noteNameFromFrequency,
} from "./NoteUtils.js";

describe("NoteUtils", () => {
  it("maps A4 = 440 Hz to MIDI 69", () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 6);
    expect(midiToFrequency(69)).toBeCloseTo(440, 6);
  });

  it("names common notes", () => {
    expect(noteNameFromFrequency(440)).toBe("A4");
    expect(noteNameFromFrequency(261.6256)).toBe("C4");
    expect(midiToNoteName(60)).toBe("C4");
  });

  it("reports zero cents on an exact note and a sign off-pitch", () => {
    expect(centsFromFrequency(440)).toBe(0);
    expect(centsFromFrequency(440 * 2 ** (10 / 1200))).toBeGreaterThan(0);
    expect(centsFromFrequency(440 * 2 ** (-10 / 1200))).toBeLessThan(0);
  });

  it("returns an empty name for non-positive frequencies", () => {
    expect(noteNameFromFrequency(0)).toBe("");
    expect(noteNameFromFrequency(-5)).toBe("");
  });
});
