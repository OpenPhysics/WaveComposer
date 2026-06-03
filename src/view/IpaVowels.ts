/**
 * IpaVowels.ts
 *
 * Reference F1/F2 formant positions for common American-English monophthongs,
 * used to annotate the vowel plot (the IPA symbols are language-neutral, so they
 * are not localized). Values are representative averages (in the spirit of the
 * Peterson–Barney / Hillenbrand vowel data); they mark where each vowel typically
 * sits in F1×F2 space so a learner can compare their live vowel against them.
 */

export interface IpaVowel {
  /** IPA symbol shown on the plot. */
  readonly symbol: string;
  /** Example English word containing the vowel. */
  readonly example: string;
  /** First formant (Hz) — plotted on the (inverted) vertical axis. */
  readonly f1Hz: number;
  /** Second formant (Hz) — plotted on the (inverted) horizontal axis. */
  readonly f2Hz: number;
}

export const IPA_VOWELS: readonly IpaVowel[] = [
  { symbol: "i", example: "heed", f1Hz: 270, f2Hz: 2290 },
  { symbol: "ɪ", example: "hid", f1Hz: 390, f2Hz: 1990 },
  { symbol: "ɛ", example: "head", f1Hz: 530, f2Hz: 1840 },
  { symbol: "æ", example: "had", f1Hz: 660, f2Hz: 1720 },
  { symbol: "ɑ", example: "hod", f1Hz: 730, f2Hz: 1090 },
  { symbol: "ɔ", example: "hawed", f1Hz: 570, f2Hz: 840 },
  { symbol: "ʊ", example: "hood", f1Hz: 440, f2Hz: 1020 },
  { symbol: "u", example: "who'd", f1Hz: 300, f2Hz: 870 },
  { symbol: "ʌ", example: "hud", f1Hz: 640, f2Hz: 1190 },
  { symbol: "ɝ", example: "heard", f1Hz: 490, f2Hz: 1350 },
];
