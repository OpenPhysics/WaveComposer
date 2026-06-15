import { describe, expect, it } from "vitest";
import { createComposableGenerator } from "../../../../src/common/model/audio/ComposableFrameSource.js";

describe("createComposableGenerator", () => {
  it("sums enabled partials", () => {
    const sampleRate = 44100;
    const length = 128;
    const out = new Float32Array(length);
    const generate = createComposableGenerator(() => [
      { frequencyHz: 100, amplitude: 0.5, phaseRad: 0, enabled: true },
      { frequencyHz: 200, amplitude: 0.25, phaseRad: 0, enabled: true },
      { frequencyHz: 300, amplitude: 1, phaseRad: 0, enabled: false },
    ]);
    generate(out, sampleRate, 0);

    let max = 0;
    for (let i = 0; i < length; i++) {
      max = Math.max(max, Math.abs(out[i] ?? 0));
    }
    expect(max).toBeGreaterThan(0.5);
    expect(max).toBeLessThanOrEqual(0.76);
  });

  it("cancels when opposite phase partials share a frequency", () => {
    const sampleRate = 44100;
    const length = 256;
    const out = new Float32Array(length);
    const generate = createComposableGenerator(() => [
      { frequencyHz: 220, amplitude: 0.5, phaseRad: 0, enabled: true },
      { frequencyHz: 220, amplitude: 0.5, phaseRad: Math.PI, enabled: true },
    ]);
    generate(out, sampleRate, 0);

    let max = 0;
    for (let i = 0; i < length; i++) {
      max = Math.max(max, Math.abs(out[i] ?? 0));
    }
    expect(max).toBeLessThan(0.02);
  });
});
