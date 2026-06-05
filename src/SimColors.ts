/**
 * SimColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import SimColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import SimColors from "../../SimColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: SimColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the SimColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import SimNamespace from "./SimNamespace.js";

const SimColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(SimNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(SimNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(SimNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(SimNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(SimNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Interactive controls (push buttons + combo boxes) ─────────────────────────
  /**
   * Base fill for push buttons and combo-box buttons/lists. Pairs with
   * textColorProperty for the label, so the control reads correctly in both modes:
   * dark blue with light text in default mode, light gray with dark text in
   * projector mode. (The previous accent-blue button base went near-black in
   * projector mode, leaving the black label unreadable.)
   */
  buttonFillColorProperty: new ProfileColorProperty(SimNamespace, "buttonFill", {
    default: "#243a63",
    projector: "#e0e0e0",
  }),
  /**
   * Fill for a disabled push button (e.g. start/stop while the demo source is
   * selected). Stays dark in default mode so the dimmed light label remains
   * legible; the sun default (light gray) made light-on-light text vanish.
   */
  buttonDisabledFillColorProperty: new ProfileColorProperty(SimNamespace, "buttonDisabledFill", {
    default: "#2c3450",
    projector: "#d6d6d6",
  }),
  /** Hover/selection highlight for combo-box list items (kept readable behind the label). */
  comboBoxHighlightColorProperty: new ProfileColorProperty(SimNamespace, "comboBoxHighlight", {
    default: "#35538c",
    projector: "#cdd8ea",
  }),

  // ── Chart chrome ────────────────────────────────────────────────────────────
  /** Plotting-area background (spectrum, waveform, cepstrum, vowel plot). */
  chartBackgroundColorProperty: new ProfileColorProperty(SimNamespace, "chartBackground", {
    default: "#0d1117",
    projector: "#ffffff",
  }),
  /** Faint grid lines inside charts. */
  gridLineColorProperty: new ProfileColorProperty(SimNamespace, "gridLine", {
    default: "#2a3550",
    projector: "#dddddd",
  }),
  /** Chart axis lines and tick marks. */
  axisColorProperty: new ProfileColorProperty(SimNamespace, "axis", {
    default: "#8a97b8",
    projector: "#555555",
  }),

  // ── Spectrum / waveform / cepstrum curves ────────────────────────────────────
  /** Instantaneous FFT magnitude curve. */
  spectrumCurveColorProperty: new ProfileColorProperty(SimNamespace, "spectrumCurve", {
    default: "#4fc3f7",
    projector: "#1565c0",
  }),
  /** LPC spectral-envelope overlay. */
  lpcEnvelopeColorProperty: new ProfileColorProperty(SimNamespace, "lpcEnvelope", {
    default: "#ffb74d",
    projector: "#e65100",
  }),
  /** Time-domain oscilloscope trace. */
  waveformColorProperty: new ProfileColorProperty(SimNamespace, "waveform", {
    default: "#81c784",
    projector: "#2e7d32",
  }),
  /** Cepstrum trace. */
  cepstrumCurveColorProperty: new ProfileColorProperty(SimNamespace, "cepstrumCurve", {
    default: "#4fc3f7",
    projector: "#1565c0",
  }),
  /** Marker for the detected cepstral peak / harmonic markers. */
  harmonicMarkerColorProperty: new ProfileColorProperty(SimNamespace, "harmonicMarker", {
    default: "#fff176",
    projector: "#f9a825",
  }),

  // ── Overlay tracks (spectrogram + spectrum formant markers) ───────────────────
  /** Fundamental-frequency (F0) track. */
  f0TrackColorProperty: new ProfileColorProperty(SimNamespace, "f0Track", {
    default: "#ffffff",
    projector: "#000000",
  }),
  formant1ColorProperty: new ProfileColorProperty(SimNamespace, "formant1", {
    default: "#ff5252",
    projector: "#c62828",
  }),
  formant2ColorProperty: new ProfileColorProperty(SimNamespace, "formant2", {
    default: "#69f0ae",
    projector: "#00897b",
  }),
  formant3ColorProperty: new ProfileColorProperty(SimNamespace, "formant3", {
    default: "#40c4ff",
    projector: "#0277bd",
  }),
  formant4ColorProperty: new ProfileColorProperty(SimNamespace, "formant4", {
    default: "#e040fb",
    projector: "#8e24aa",
  }),

  // ── Readout indicators ────────────────────────────────────────────────────────
  /** Voiced-state indicator (lit). */
  voicedColorProperty: new ProfileColorProperty(SimNamespace, "voiced", {
    default: "#69f0ae",
    projector: "#2e7d32",
  }),
  /** Unvoiced/silent indicator. */
  unvoicedColorProperty: new ProfileColorProperty(SimNamespace, "unvoiced", {
    default: "#546e7a",
    projector: "#b0bec5",
  }),

  // ── Vowel plot ─────────────────────────────────────────────────────────────────
  /** Reference IPA vowel markers + labels. */
  vowelReferenceColorProperty: new ProfileColorProperty(SimNamespace, "vowelReference", {
    default: "#90a4ae",
    projector: "#607d8b",
  }),
  /** The live, measured vowel position. */
  vowelCurrentColorProperty: new ProfileColorProperty(SimNamespace, "vowelCurrent", {
    default: "#ffca28",
    projector: "#ef6c00",
  }),

  // ── Wave-physics overlays ─────────────────────────────────────────────────────
  /** Shaded bands for allowed harmonics on the spectrum. */
  allowedHarmonicBandColorProperty: new ProfileColorProperty(SimNamespace, "allowedHarmonicBand", {
    default: "#4fc3f7",
    projector: "#90caf9",
  }),
  /** 1D standing-wave mode curve. */
  standingWaveColorProperty: new ProfileColorProperty(SimNamespace, "standingWave", {
    default: "#ffab91",
    projector: "#d84315",
  }),
  /** Source–filter diagram accents on the Voice screen. */
  sourceFilterColorProperty: new ProfileColorProperty(SimNamespace, "sourceFilter", {
    default: "#ce93d8",
    projector: "#7b1fa2",
  }),
  /** Live resonance-tuning indicator. */
  resonanceTuningColorProperty: new ProfileColorProperty(SimNamespace, "resonanceTuning", {
    default: "#ffd54f",
    projector: "#f9a825",
  }),
};

export default SimColors;
