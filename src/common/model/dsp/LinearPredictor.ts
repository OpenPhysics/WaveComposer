/**
 * LinearPredictor.ts
 *
 * Linear Predictive Coding via the Levinson-Durbin recursion.
 * Ported from references/in-formant/src/analysis/linpred/autocorr.cpp.
 *
 * Models the signal as an all-pole filter: x̂[n] = Σ a_m·x[n-m]. The analysis
 * filter is A(z) = 1 - Σ a_m·z^-m; its roots are the vocal-tract resonances
 * (formants). The residual energy `gain` drives the LPC spectral envelope.
 */

export interface LpcResult {
  /**
   * Predictor coefficients a_1..a_p (length = order). Kept in double precision:
   * the analysis-filter roots (formants) of clustered near-unit-circle poles are
   * ill-conditioned, and Float32 storage of these coefficients can shift a
   * formant by tens of Hz.
   */
  readonly coefficients: Float64Array;
  /** Reflection (PARCOR) coefficients k_1..k_p, each in (-1, 1) when stable. */
  readonly reflection: Float32Array;
  /** Residual (prediction-error) energy; 0 for a silent/degenerate frame. */
  readonly gain: number;
}

/**
 * Runs the recursion on an autocorrelation sequence `r[0..order]`.
 * `autocorr.length` must be at least `order + 1`. A `Float64Array` is preferred
 * for higher orders, where Float32 storage of the autocorrelation loses the
 * precision the recursion needs as the residual energy shrinks.
 */
export function levinsonDurbin(autocorr: Float32Array | Float64Array, order: number): LpcResult {
  const coefficients = new Float64Array(order);
  const reflection = new Float32Array(order);

  let error = autocorr[0] ?? 0;
  if (error <= 0) {
    // Silent or DC-only frame — no meaningful prediction.
    return { coefficients, reflection, gain: 0 };
  }

  // a[0] = 1 (implicit); a[1..order] are built up in `a`. Float64 for stability.
  const a = new Float64Array(order + 1);
  // Scratch copy of `a` from the previous iteration; avoids a per-iteration slice().
  const aPrev = new Float64Array(order + 1);
  a[0] = 1;

  for (let i = 1; i <= order; i++) {
    let acc = autocorr[i] ?? 0;
    for (let j = 1; j < i; j++) {
      acc -= (a[j] ?? 0) * (autocorr[i - j] ?? 0);
    }
    const k = acc / error;
    reflection[i - 1] = k;

    // Update a[1..i-1] symmetrically using the previous iteration's values.
    for (let j = 0; j <= i; j++) {
      aPrev[j] = a[j] ?? 0;
    }
    a[i] = k;
    for (let j = 1; j < i; j++) {
      a[j] = (aPrev[j] ?? 0) - k * (aPrev[i - j] ?? 0);
    }

    error *= 1 - k * k;
    if (error <= 0) {
      error = 0;
      break;
    }
  }

  for (let m = 1; m <= order; m++) {
    coefficients[m - 1] = a[m] ?? 0;
  }
  return { coefficients, reflection, gain: error };
}
