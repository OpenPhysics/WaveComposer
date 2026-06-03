/**
 * init.ts
 *
 * Initializes SceneryStack with simulation metadata.
 *
 * IMPORTANT: This file is the START of the module loading chain:
 *   init.ts → assert.ts → splash.ts → brand.ts → everything else
 *
 * It must run before any other SceneryStack module is imported.
 *
 * ── How to customize ─────────────────────────────────────────────────────────
 * 1. Change `name` to match your package.json "name" field (kebab-case)
 * 2. Change `version` to match your package.json "version" field
 * 3. Update `availableLocales` when you add new translation files
 */
import { init, madeWithSceneryStackSplashDataURI } from "scenerystack/init";

init({
  // Internal identifier used by SceneryStack for URL parameters and phetmarks.
  // Use kebab-case matching the package.json "name" field.
  name: "wave-composer",

  // Displayed in the About dialog (Help menu → About).
  version: "0.0.0",

  // Must match the id registered in src/brand.ts.
  brand: "made-with-scenerystack",

  // Default locale (ISO-639-1, optionally with ISO-3166-1 country code, e.g. "en_US").
  locale: "en",

  // All supported locales — must match the locale keys in src/i18n/StringManager.ts.
  availableLocales: ["en", "fr"],

  // Color profiles the sim supports. Must match the keys used in src/SimColors.ts.
  // "projector" is required (alongside "default") for the Preferences → Visual
  // "Projector Mode" toggle (enabled via supportsProjectorMode in src/main.ts).
  colorProfiles: ["default", "projector"],

  // Enables the sound subsystem (soundManager / tambo). This registers the
  // "supportsSound" sim feature, which adds the Preferences → Audio tab with a
  // master "Audio" toggle and a "Sounds" toggle. Surfaced in src/main.ts via the
  // PreferencesModel audioOptions, and used by soundManager.addSoundGenerator(...).
  supportsSound: true,

  // Enables the Voicing (text-to-speech) feature. Defaults to false, so it must
  // be set here for the Preferences → Audio Voicing controls (surfaced via the
  // PreferencesModel audioOptions in src/main.ts) to function. Voicing is only
  // active in the English locale on platforms with SpeechSynthesis support.
  supportsVoicing: true,

  // Splash screen shown while the simulation loads.
  splashDataURI: madeWithSceneryStackSplashDataURI,

  // Allow the user to switch locale at runtime via the Preferences dialog.
  allowLocaleSwitching: true,
});
