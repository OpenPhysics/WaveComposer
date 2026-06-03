import { defineConfig } from "vitest/config";

/**
 * Vitest config for the pure-DSP model layer. The voice-analysis math has no DOM
 * dependencies, so the lightweight "node" environment is used. Specs live next
 * to the code they cover under `src/**`.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
