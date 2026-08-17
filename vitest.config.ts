import { defineConfig } from "vitest/config";

/**
 * Vitest config for the pure-DSP model layer. The voice-analysis math has no DOM
 * dependencies, so the lightweight "node" environment is used. Specs live in
 * `tests/`, mirroring the source tree they cover under `src/`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // --expose-gc lets us call global.gc() to force garbage collection
    execArgv: ["--expose-gc"],
    testTimeout: 30_000,
  },
});
