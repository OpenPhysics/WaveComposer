import { describe, expect, it } from "vitest";
import type { Complex } from "./Complex.js";
import { findRoots } from "./PolynomialRootFinder.js";

/** Asserts every expected (re, im) root has a computed root within `tol`. */
function expectRoots(roots: Complex[], expected: ReadonlyArray<readonly [number, number]>, tol = 1e-6): void {
  expect(roots).toHaveLength(expected.length);
  for (const [re, im] of expected) {
    const match = roots.some((r) => Math.hypot(r.re - re, r.im - im) < tol);
    expect(match, `no root near (${re}, ${im}) in ${JSON.stringify(roots)}`).toBe(true);
  }
}

describe("PolynomialRootFinder", () => {
  it("finds real roots of z^2 - 1", () => {
    expectRoots(findRoots([1, 0, -1]), [
      [1, 0],
      [-1, 0],
    ]);
  });

  it("finds the imaginary roots of z^2 + 1", () => {
    expectRoots(findRoots([1, 0, 1]), [
      [0, 1],
      [0, -1],
    ]);
  });

  it("finds the factored roots of z^2 + z - 6 = (z - 2)(z + 3)", () => {
    expectRoots(findRoots([1, 1, -6]), [
      [2, 0],
      [-3, 0],
    ]);
  });

  it("finds a complex-conjugate pair from a 2nd-order resonator polynomial", () => {
    // z^2 - 2r·cosθ·z + r^2 has roots r·e^{±jθ}.
    const r = 0.95;
    const theta = 0.7;
    const roots = findRoots([1, -2 * r * Math.cos(theta), r * r]);
    expectRoots(
      roots,
      [
        [r * Math.cos(theta), r * Math.sin(theta)],
        [r * Math.cos(theta), -r * Math.sin(theta)],
      ],
      1e-5,
    );
  });

  it("returns no roots for a degenerate (degree 0) polynomial", () => {
    expect(findRoots([5])).toHaveLength(0);
  });
});
