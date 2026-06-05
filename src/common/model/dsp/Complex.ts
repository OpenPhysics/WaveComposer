/**
 * Complex.ts
 *
 * A tiny immutable complex-number type used by the polynomial root finder and
 * formant extraction. Kept minimal on purpose — only the operations those
 * algorithms need. Performance-critical inner loops (FFT, root finding) use raw
 * Float64 component arithmetic instead of allocating these objects.
 */
export class Complex {
  public readonly re: number;
  public readonly im: number;

  public constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }

  public add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  public sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  public mul(other: Complex): Complex {
    return new Complex(this.re * other.re - this.im * other.im, this.re * other.im + this.im * other.re);
  }

  public div(other: Complex): Complex {
    const denom = other.re * other.re + other.im * other.im;
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom,
    );
  }

  /** Magnitude |z|. */
  public abs(): number {
    return Math.hypot(this.re, this.im);
  }

  /** Argument (phase angle) of z in radians, in (-π, π]. */
  public arg(): number {
    return Math.atan2(this.im, this.re);
  }
}
