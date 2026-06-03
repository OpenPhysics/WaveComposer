import { describe, expect, it } from "vitest";
import { generateSine, generateVowel, generateWhiteNoise } from "../audio/SyntheticFrameSource.js";
import { autocorrelate } from "./Autocorrelation.js";
import { Fft } from "./Fft.js";
import { cepstralPeakProminence, computeRealCepstrum, harmonicToNoiseRatio } from "./VoiceQuality.js";

const SAMPLE_RATE = 44100;
const N = 4096;
const F0_MIN = 60;
const F0_MAX = 800;

function hnrOf(signal: Float32Array): number {
  const maxLag = Math.ceil(SAMPLE_RATE / F0_MIN);
  const autocorr = new Float32Array(maxLag + 1);
  autocorrelate(signal, maxLag, autocorr);
  return harmonicToNoiseRatio(autocorr, SAMPLE_RATE, F0_MIN, F0_MAX);
}

function cppOf(fft: Fft, signal: Float32Array): number {
  const re = Float32Array.from(signal);
  const im = new Float32Array(signal.length);
  computeRealCepstrum(fft, re, im);
  return cepstralPeakProminence(re, SAMPLE_RATE, F0_MIN, F0_MAX);
}

describe("VoiceQuality", () => {
  it("reports a high HNR for a periodic tone and a much lower one for noise", () => {
    const hnrTone = hnrOf(generateSine(200, SAMPLE_RATE, N));
    const hnrNoise = hnrOf(generateWhiteNoise(N, 0.5));
    expect(hnrTone).toBeGreaterThan(10);
    expect(hnrTone).toBeGreaterThan(hnrNoise + 5);
  });

  it("reports a higher CPP for a voiced vowel than for noise", () => {
    const fft = new Fft(N);
    const cppVowel = cppOf(fft, generateVowel([700, 1220], [80, 90], 140, SAMPLE_RATE, N));
    const cppNoise = cppOf(fft, generateWhiteNoise(N, 0.5));
    expect(cppVowel).toBeGreaterThan(0);
    expect(cppVowel).toBeGreaterThan(cppNoise);
  });
});
