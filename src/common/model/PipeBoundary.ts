/**
 * PipeBoundary.ts
 *
 * Standing-wave boundary models for harmonic-overlay pedagogy (string, open pipe,
 * closed pipe).
 */
import { Property } from "scenerystack/axon";

export const PipeBoundary = {
  NONE: "none",
  STRING: "string",
  OPEN_PIPE: "openPipe",
  CLOSED_PIPE: "closedPipe",
} as const;

export type PipeBoundary = (typeof PipeBoundary)[keyof typeof PipeBoundary];

export const PipeBoundaryValues = [
  PipeBoundary.NONE,
  PipeBoundary.STRING,
  PipeBoundary.OPEN_PIPE,
  PipeBoundary.CLOSED_PIPE,
] as const;

export function isModeAllowed(modeNumber: number, boundary: PipeBoundary): boolean {
  if (boundary === PipeBoundary.CLOSED_PIPE) {
    return modeNumber % 2 === 1;
  }
  if (boundary === PipeBoundary.STRING || boundary === PipeBoundary.OPEN_PIPE) {
    return true;
  }
  return false;
}

export function createPipeBoundaryProperty(defaultValue: PipeBoundary = PipeBoundary.NONE): Property<PipeBoundary> {
  return new Property<PipeBoundary>(defaultValue, { validValues: [...PipeBoundaryValues] });
}
