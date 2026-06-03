/**
 * Fft.ts
 *
 * Radix-2 Cooley-Tukey FFT with precomputed bit-reversal and twiddle tables.
 * Ported from references/paul-spectrogram/src/lib/math/fft.ts and extended with
 * in-place complex `forward`/`inverse` transforms, which the cepstrum and LPC
 * spectral envelope need in addition to the real-input power spectrum.
 *
 * All transforms operate on caller-owned buffers so the analyzer can reuse
 * scratch memory across frames (no per-frame allocation).
 */
export class Fft {
  public readonly size: number;
  private readonly reversedBits: Uint32Array;
  private readonly twiddleReal: Float32Array;
  private readonly twiddleImag: Float32Array;
  private readonly scratchReal: Float32Array;
  private readonly scratchImag: Float32Array;

  public constructor(size: number) {
    if (size < 2 || (size & (size - 1)) !== 0) {
      throw new Error("FFT size must be a power of two and at least 2");
    }
    this.size = size;
    const bits = Math.log2(size);

    this.reversedBits = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      this.reversedBits[i] = Fft.reverseBits(i, bits);
    }

    const half = size / 2;
    this.twiddleReal = new Float32Array(half);
    this.twiddleImag = new Float32Array(half);
    for (let i = 0; i < half; i++) {
      const angle = (-2 * Math.PI * i) / size;
      this.twiddleReal[i] = Math.cos(angle);
      this.twiddleImag[i] = Math.sin(angle);
    }

    this.scratchReal = new Float32Array(size);
    this.scratchImag = new Float32Array(size);
  }

  private static reverseBits(value: number, bits: number): number {
    let reversed = 0;
    let v = value;
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (v & 1);
      v >>= 1;
    }
    return reversed >>> 0;
  }

  /** In-place bit-reversal permutation of the complex buffers. */
  private permute(re: Float32Array, im: Float32Array): void {
    const n = this.size;
    const rev = this.reversedBits;
    for (let i = 0; i < n; i++) {
      const j = rev[i] ?? 0;
      if (j > i) {
        const tr = re[i] ?? 0;
        re[i] = re[j] ?? 0;
        re[j] = tr;
        const ti = im[i] ?? 0;
        im[i] = im[j] ?? 0;
        im[j] = ti;
      }
    }
  }

  /** Cooley-Tukey butterfly stages (assumes the input is already permuted). */
  private butterflies(re: Float32Array, im: Float32Array, inverse: boolean): void {
    const n = this.size;
    const sign = inverse ? -1 : 1;
    for (let span = 2; span <= n; span *= 2) {
      const half = span / 2;
      const twiddleStep = n / span;
      for (let start = 0; start < n; start += span) {
        for (let j = 0; j < half; j++) {
          const twIndex = j * twiddleStep;
          const wr = this.twiddleReal[twIndex] ?? 0;
          const wi = sign * (this.twiddleImag[twIndex] ?? 0);
          const even = start + j;
          const odd = even + half;

          const oddRe = re[odd] ?? 0;
          const oddIm = im[odd] ?? 0;
          const tr = oddRe * wr - oddIm * wi;
          const ti = oddRe * wi + oddIm * wr;

          const evenRe = re[even] ?? 0;
          const evenIm = im[even] ?? 0;
          re[odd] = evenRe - tr;
          im[odd] = evenIm - ti;
          re[even] = evenRe + tr;
          im[even] = evenIm + ti;
        }
      }
    }
  }

  /** In-place complex FFT (`re`/`im` length must equal `size`). */
  private transform(re: Float32Array, im: Float32Array, inverse: boolean): void {
    this.permute(re, im);
    this.butterflies(re, im, inverse);
    if (inverse) {
      const inv = 1 / this.size;
      for (let i = 0; i < this.size; i++) {
        re[i] = (re[i] ?? 0) * inv;
        im[i] = (im[i] ?? 0) * inv;
      }
    }
  }

  /** Forward complex FFT, in place. */
  public forward(re: Float32Array, im: Float32Array): void {
    this.transform(re, im, false);
  }

  /** Inverse complex FFT, in place (includes 1/N normalization). */
  public inverse(re: Float32Array, im: Float32Array): void {
    this.transform(re, im, true);
  }

  /**
   * Power spectrum |X[k]|² (normalized by 1/N²) for the real input `signal`,
   * for bins k in [0, N/2). Writes into `out` when provided.
   */
  public powerSpectrum(signal: Float32Array, out?: Float32Array): Float32Array {
    if (signal.length !== this.size) {
      throw new Error("Input length must equal the FFT size");
    }
    const re = this.scratchReal;
    const im = this.scratchImag;
    re.set(signal);
    im.fill(0);
    this.transform(re, im, false);

    const half = this.size / 2;
    const result = out ?? new Float32Array(half);
    const scale = 1 / (this.size * this.size);
    for (let i = 0; i < half; i++) {
      const r = re[i] ?? 0;
      const m = im[i] ?? 0;
      result[i] = (r * r + m * m) * scale;
    }
    return result;
  }
}
