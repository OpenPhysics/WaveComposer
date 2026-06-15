import { describe, expect, it } from "vitest";
import { PresetFrameSource } from "../../../../src/common/model/audio/PresetFrameSource.js";

describe("PresetFrameSource", () => {
  it("is always active and reports its sample rate", () => {
    const source = new PresetFrameSource(() => undefined, 16000);
    expect(source.isActive).toBe(true);
    expect(source.sampleRate).toBe(16000);
  });

  it("advances the frame's start time by one frame each getFrame", () => {
    const seen: number[] = [];
    const sampleRate = 8000;
    const source = new PresetFrameSource((_out, _sr, timeS) => seen.push(timeS), sampleRate);

    const frame = new Float32Array(1024);
    expect(source.getFrame(frame)).toBe(true);
    expect(source.getFrame(frame)).toBe(true);

    expect(seen[0]).toBe(0);
    // Second frame starts exactly one frame-length later (phase continuity).
    expect(seen[1]).toBeCloseTo(1024 / sampleRate, 10);
  });

  it("fills the output buffer from its generator", () => {
    const source = new PresetFrameSource((out) => out.fill(0.42));
    const frame = new Float32Array(8);
    source.getFrame(frame);
    for (const value of frame) {
      expect(value).toBeCloseTo(0.42, 5);
    }
  });
});
