/**
 * Decimator.ts
 *
 * Integer-factor downsampler with a windowed-sinc anti-alias low-pass. Used to
 * bring the captured signal down to a formant-appropriate rate (~11 kHz) before
 * LPC analysis.
 *
 * Running LPC at the full capture rate (44.1/48 kHz) forces the predictor to
 * spread its poles across the whole 0–fs/2 band, even though formants only live
 * in the lower ~5 kHz — so too few poles land in the formant region and
 * resonances are missed. The reference pipeline
 * (references/in-formant/src/modules/app/pipeline/processors/formants.cpp)
 * resamples to 11 kHz and runs a low-order LPC there for exactly this reason.
 *
 * Because 44100 and 48000 are both divisible by 4 (→ 11025 / 12000 Hz), an
 * integer decimation factor lands close to the reference's 11 kHz target without
 * any fractional resampling.
 */

/** Half-width of the anti-alias FIR, in output samples per side. */
const TAPS_PER_SIDE = 8;

export class Decimator {
  /** Integer decimation factor (1 = pass-through). */
  public readonly factor: number;
  private readonly taps: Float64Array;
  /** Index of the FIR's center tap. */
  private readonly center: number;

  public constructor(factor: number, tapsPerSide: number = TAPS_PER_SIDE) {
    this.factor = Math.max(1, Math.floor(factor));

    if (this.factor === 1) {
      // Pass-through: a unit impulse, never actually convolved (see process()).
      this.taps = Float64Array.from([1]);
      this.center = 0;
      return;
    }

    // Windowed-sinc low-pass with its cutoff at the decimated Nyquist (π/factor).
    // factor >= 2 here (factor === 1 returned above), so center >= tapsPerSide and
    // length >= 2*tapsPerSide + 1 > 1 — the (length - 1) Hamming divisor is safe.
    const center = tapsPerSide * this.factor;
    const length = 2 * center + 1;
    const taps = new Float64Array(length);
    const cutoff = 0.5 / this.factor; // cycles/sample (Nyquist of the decimated rate)
    let sum = 0;
    for (let i = 0; i < length; i++) {
      const n = i - center;
      const sinc = n === 0 ? 2 * cutoff : Math.sin(2 * Math.PI * cutoff * n) / (Math.PI * n);
      const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (length - 1));
      const value = sinc * hamming;
      taps[i] = value;
      sum += value;
    }
    // Normalize for unity DC gain so levels are preserved across decimation.
    for (let i = 0; i < length; i++) {
      taps[i] = (taps[i] ?? 0) / sum;
    }
    this.taps = taps;
    this.center = center;
  }

  /** Number of output samples produced for an input of `inputLength` samples. */
  public outputLength(inputLength: number): number {
    return this.factor === 1 ? inputLength : Math.floor(inputLength / this.factor);
  }

  /**
   * Anti-alias filters and downsamples `input` into `out`, returning the number
   * of samples written. `out.length` must be at least
   * `outputLength(input.length)`. Samples outside the input are treated as zero,
   * which is fine here because the caller windows the frame first (tapered ends).
   */
  public process(input: Float32Array, out: Float32Array): number {
    const d = this.factor;
    if (d === 1) {
      out.set(input);
      return input.length;
    }
    const n = input.length;
    const m = Math.floor(n / d);
    const taps = this.taps;
    const len = taps.length;
    const center = this.center;
    for (let i = 0; i < m; i++) {
      const base = i * d - center;
      let acc = 0;
      for (let t = 0; t < len; t++) {
        const idx = base + t;
        if (idx >= 0 && idx < n) {
          acc += (input[idx] ?? 0) * (taps[t] ?? 0);
        }
      }
      out[i] = acc;
    }
    return m;
  }
}
