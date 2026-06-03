# CLAUDE.md — Project Context for Claude Code

## Project: Wave Composer

A VoceVista-style real-time voice-analysis [SceneryStack](https://scenerystack.org/)
simulation. Two screens share one `SimModel` (a single audio source + DSP pipeline):
- **Analyzer** (`src/sim-screen/`) — spectrogram, spectrum + LPC envelope, waveform, readouts, controls.
- **Voice & Vowels** (`src/voice-screen/`) — F1×F2 vowel plot, cepstrum, voice-quality readout.

The model defaults to a synthetic **demo** audio source (`src/model/audio/DemoFrameSource.ts`)
so the displays animate on load and the sim runs without a microphone.

## Tech Stack

| Tool | Version | Notes |
|---|---|---|
| SceneryStack | ^3.0.0 | Simulation framework (PhET-derived) |
| Vite | ^8 | Build tool and dev server |
| TypeScript | ^6 | `erasableSyntaxOnly` — no `enum` or `namespace` |
| Biome | ^2.4 | Linting + formatting (not ESLint, not Prettier) |
| vite-plugin-pwa | ^1 | PWA / offline / installable |

## !! Critical: SceneryStack Import Order !!

`src/main.ts` must have `import "./brand.js"` as its **very first import**. This
triggers the full bootstrap chain:

```
brand.ts → splash.ts → assert.ts → init.ts
```

**Never reorder these imports.** SceneryStack will fail silently or throw cryptic
errors if the chain is broken.

## Key Files

| File | Purpose |
|---|---|
| `src/init.ts` | Sim name, version, locales — START of chain |
| `src/assert.ts` | Enables runtime assertions |
| `src/splash.ts` | Shows splash screen while loading |
| `src/brand.ts` | Registers brand (logo, copyright, links) |
| `src/main.ts` | Entry point — imports brand.js first |
| `src/SimColors.ts` | All dynamic colors (`ProfileColorProperty`) |
| `src/SimNamespace.ts` | Namespace for scoping color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/i18n/strings_en.json` | English strings (source of truth for keys) |
| `src/i18n/strings_fr.json` | French strings (must have identical keys) |
| `src/model/SimModel.ts` | Shared simulation state & DSP orchestration |
| `src/model/audio/` | Audio sources: `MicrophoneInput`, `DemoFrameSource`, `SyntheticFrameSource` |
| `src/model/dsp/` | Pure DSP: FFT, LPC, YIN, formants, cepstrum, windows |
| `src/view/` | Shared view code: `ChartFrame`, `Colormaps`, `IpaVowels`, `ViewConstants` |
| `src/sim-screen/SimScreen.ts` | Analyzer screen wrapper (takes the shared model) |
| `src/sim-screen/view/SimScreenView.ts` | Analyzer layout (spectrogram, spectrum, waveform, panels) |
| `src/voice-screen/VoiceScreen.ts` | Voice & Vowels screen wrapper (shares the model) |
| `src/voice-screen/view/VoiceScreenView.ts` | Vowel plot, cepstrum, voice-quality readout |

## Conventions

- **No `enum`** — use `const SomeEnum = { ... } as const` instead (TS6 `erasableSyntaxOnly`)
- **No `namespace`** — use modules or classes with static members
- **`import type`** required for type-only imports (`verbatimModuleSyntax`)
- **Formatter**: 2-space indent, 120-char line width, double quotes, always semicolons
- **Colors** always go in `SimColors.ts` — never hardcode hex values in view files
- **Strings** always go in the JSON files — never hardcode display text in view files
- **Positioning** always uses `this.layoutBounds` — never magic pixel values

## Common Commands

```bash
npm start          # dev server (http://localhost:5173)
npm run build      # type-check + production build
npm run fix        # biome auto-fix (format + lint)
npm run check      # tsc type check only
npm run icons      # regenerate PNG icons from icons/icon.svg
```

## SceneryStack Module Paths

```
scenerystack/sim          Sim, Screen, ScreenView, ScreenViewOptions, PreferencesModel, onReadyToLaunch
scenerystack/axon         Property, BooleanProperty, NumberProperty, StringProperty, TReadOnlyProperty
scenerystack/scenery      Node, Rectangle, Circle, Text, Image, ProfileColorProperty
scenerystack/scenery-phet ResetAllButton, ArrowNode, NumberDisplay, MagnifyingGlassZoomButtonGroup
scenerystack/dot          Vector2, Dimension2, Range, Bounds2
scenerystack/tandem       Tandem
scenerystack/phet-core    Namespace, optionize
scenerystack/chipper      LocalizedString
scenerystack/joist        TModel
scenerystack/init         init, madeWithSceneryStackSplashDataURI
scenerystack/brand        brand, TBrand, madeWithSceneryStackOnDark, madeWithSceneryStackOnLight
scenerystack/assert       enableAssert
scenerystack/splash       (side-effect import)
```

## Adding Simulation Content

1. **Model** — add `Property<T>` fields to `SimModel`, call `.reset()` on each in `reset()`
2. **View** — create `Node` subclasses, add them in `SimScreenView`, link to model:
   ```typescript
   model.myValueProperty.link(value => { myNode.visible = value > 0; });
   ```
3. **Colors** — add `ProfileColorProperty` entries to `SimColors.ts`
4. **Strings** — add keys to `strings_en.json` + all locale files, expose in `StringManager`
5. **Preferences** — extend `PreferencesModel` options in `src/main.ts`

## TypeScript 6 Notes

- `erasableSyntaxOnly` rejects `enum` and `namespace` (they generate runtime JS)
- `verbatimModuleSyntax` requires explicit `import type` for type-only symbols
- `noUncheckedSideEffectImports` requires side-effect imports to be in package exports  
  (`scenerystack/splash` is exported, so it's fine — if you see an error, check the package version)

## CI

GitHub Actions runs on every push/PR to `main`:
1. `npm run check` (TypeScript)
2. `npm run lint` (Biome)
3. `npm run icons && npm run build` (production artifact uploaded)
