import { describe, expect, it } from "vitest";
import { generateVowel } from "./audio/SyntheticFrameSource.js";
import type { FormantData } from "./dsp/types.js";
import { type AnalyzerConfig, VoiceAnalyzer } from "./VoiceAnalyzer.js";

const SAMPLE_RATE = 44100;

const baseConfig: AnalyzerConfig = {
  sampleRate: SAMPLE_RATE,
  fftSize: 4096,
  windowType: "hann",
  lpcOrder: 20,
  f0MinHz: 60,
  f0MaxHz: 800,
  formantMaxHz: 5000,
};

function nearest(formants: readonly FormantData[], targetHz: number): number {
  let bestDist = Number.POSITIVE_INFINITY;
  let bestFreq = 0;
  for (const f of formants) {
    const d = Math.abs(f.frequencyHz - targetHz);
    if (d < bestDist) {
      bestDist = d;
      bestFreq = f.frequencyHz;
    }
  }
  return bestFreq;
}

describe("VoiceAnalyzer (integration)", () => {
  it("analyzes a synthetic vowel into a consistent F0, formants, and voice quality", () => {
    const analyzer = new VoiceAnalyzer(baseConfig);
    const frame = generateVowel([700, 1220, 2600], [80, 90, 120], 140, SAMPLE_RATE, baseConfig.fftSize);
    const result = analyzer.analyze(frame);

    // Pitch.
    expect(Math.abs(result.pitch.frequencyHz - 140)).toBeLessThan(5);
    expect(result.pitch.confidence).toBeGreaterThan(0.5);

    // Formants (LPC is approximate; allow generous tolerances).
    expect(result.formants.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(nearest(result.formants, 700) - 700)).toBeLessThan(100);
    expect(Math.abs(nearest(result.formants, 1220) - 1220)).toBeLessThan(120);

    // Voice quality: a clean periodic vowel is clearly voiced.
    expect(result.hnrDb).toBeGreaterThan(5);
    expect(result.cppDb).toBeGreaterThan(0);

    // Reused buffer sizes.
    expect(result.waveform).toHaveLength(4096);
    expect(result.powerSpectrumDb).toHaveLength(2048);
    expect(result.lpcEnvelopeDb).toHaveLength(2048);
    expect(result.cepstrum).toHaveLength(4096);
  });

  it("reconfigures to a new FFT size and resizes its buffers", () => {
    const analyzer = new VoiceAnalyzer(baseConfig);
    analyzer.reconfigure({ ...baseConfig, fftSize: 2048 });
    const frame = generateVowel([700, 1220], [80, 90], 160, SAMPLE_RATE, 2048);
    const result = analyzer.analyze(frame);

    expect(result.powerSpectrumDb).toHaveLength(1024);
    expect(result.waveform).toHaveLength(2048);
    expect(Math.abs(result.pitch.frequencyHz - 160)).toBeLessThan(5);
  });

  it("rejects a frame whose length does not match the configured FFT size", () => {
    const analyzer = new VoiceAnalyzer(baseConfig);
    expect(() => analyzer.analyze(new Float32Array(1024))).toThrow();
  });
});
