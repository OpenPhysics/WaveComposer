import { describe, expect, it } from "vitest";
import { generateSine, generateWhiteNoise } from "../../../../src/common/model/audio/SyntheticFrameSource.js";
import type { PitchOptions } from "../../../../src/common/model/dsp/YinPitchDetector.js";
import { YinPitchDetector } from "../../../../src/common/model/dsp/YinPitchDetector.js";

const SAMPLE_RATE = 44100;
const FRAME = 4096;

const options: PitchOptions = {
  sampleRate: SAMPLE_RATE,
  minFrequencyHz: 60,
  maxFrequencyHz: 800,
  threshold: 0.15,
  silenceThreshold: 1e-4,
};

describe("YinPitchDetector", () => {
  it("detects the pitch of pure sine tones within ~1 Hz", () => {
    const detector = new YinPitchDetector(FRAME);
    for (const freq of [110, 220, 440]) {
      const result = detector.detect(generateSine(freq, SAMPLE_RATE, FRAME), options);
      expect(Math.abs(result.frequencyHz - freq)).toBeLessThan(1);
      expect(result.confidence).toBeGreaterThan(0.8);
    }
  });

  it("reports silence as unvoiced", () => {
    const detector = new YinPitchDetector(FRAME);
    const result = detector.detect(new Float32Array(FRAME), options);
    expect(result.frequencyHz).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it("does not report confident pitch for white noise", () => {
    const detector = new YinPitchDetector(FRAME);
    const result = detector.detect(generateWhiteNoise(FRAME, 0.5), options);
    expect(result.frequencyHz === 0 || result.confidence < 0.5).toBe(true);
  });

  it("survives a frame-size change via setBufferSize", () => {
    const detector = new YinPitchDetector(FRAME);
    detector.setBufferSize(2048);
    const result = detector.detect(generateSine(200, SAMPLE_RATE, 2048), options);
    expect(Math.abs(result.frequencyHz - 200)).toBeLessThan(2);
  });
});
