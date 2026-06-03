/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screen, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. It triggers the full bootstrap chain:
 *
 *   brand.ts → splash.ts → assert.ts → init.ts
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first — triggers: init.ts → assert.ts → splash.ts → brand.ts
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { StringManager } from "./i18n/StringManager.js";
import { SimModel } from "./model/SimModel.js";
import { SimScreen } from "./sim-screen/SimScreen.js";
import { VoiceScreen } from "./voice-screen/VoiceScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();
  const screenNames = stringManager.getScreenNames();

  // A single model drives both screens (one audio source / analysis pipeline).
  const model = new SimModel();

  const screens = [
    new SimScreen(model, {
      // The screen name Property updates automatically when the locale changes
      name: screenNames.analyzerStringProperty,
      tandem: Tandem.ROOT.createTandem("analyzerScreen"),
    }),
    new VoiceScreen(model, {
      name: screenNames.voiceStringProperty,
      tandem: Tandem.ROOT.createTandem("voiceScreen"),
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      audioOptions: {
        // Adds the Preferences → Audio tab with a "Sounds" toggle.
        // Requires supportsSound: true in src/init.ts. Register actual sounds
        // with soundManager.addSoundGenerator(...) from scenerystack/tambo.
        supportsSound: true,
        // Adds an "Extra Sounds" toggle (a second, optional sonification layer).
        // Requires supportsSound above.
        supportsExtraSound: true,
        // Adds Voicing (text-to-speech) controls and the Voicing toolbar.
        // Requires supportsVoicing: true in src/init.ts. Only active in English
        // on platforms with SpeechSynthesis; degrades gracefully elsewhere.
        // NOTE: supportsCoreVoicing is intentionally omitted — it is mutually
        // exclusive with supportsVoicing (asserts if both are on) and is a
        // phet-internal mode, not meant for sims.
        supportsVoicing: true,
      },
      inputOptions: {
        // Adds the Preferences → Input tab with a touchscreen gesture-control toggle.
        supportsGestureControl: true,
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
