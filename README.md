# Wave Composer

A single-screen simulation built with [SceneryStack](https://scenerystack.org/),
Vite 8, TypeScript 6, and Biome 2.

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from icons/icon.svg
npm start        # dev server → http://localhost:5173
```

Open `http://localhost:5173` in your browser. You should see a dark screen with
"Wave Composer" text, a Reset All button, and a navigation bar with Preferences (gear icon).

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | TypeScript type check only (`tsc --noEmit`) |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Generate PNG icons from `icons/icon.svg` |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
src/
  init.ts                    # SceneryStack initialization (chain start)
  assert.ts                  # Enable runtime assertions
  splash.ts                  # Splash screen
  brand.ts                   # Brand registration (MUST be first import in main.ts)
  main.ts                    # Simulation entry point
  SimNamespace.ts            # Namespace for ProfileColorProperty registration
  SimColors.ts               # Dynamic colors (dark default + projector mode)
  i18n/
    StringManager.ts         # Singleton i18n string accessor
    strings_en.json          # English strings
    strings_fr.json          # French strings
  sim-screen/
    SimScreen.ts             # Screen wrapper (model + view factories)
    model/
      SimModel.ts            # Simulation model (state + logic)
    view/
      SimScreenView.ts       # Simulation view (nodes + layout)
scripts/
  generate-icons.ts          # Generate PNG icons from icons/icon.svg
icons/
  icon.svg                   # Source icon (512×512 SVG — edit this one)
.github/
  workflows/
    ci.yml                   # GitHub Actions: type-check, lint, build
.githooks/
  pre-commit                 # Runs Biome before each commit
```

## Customizing the Template

### Rename the simulation

Search-and-replace `sim-template` / `SimTemplate` / `Sim Template` / `SimModel` / `SimScreen` etc.
with your simulation's name throughout the source files.

### Adding a locale

1. Create `src/i18n/strings_XX.json` — copy `strings_en.json` and translate the values
2. Import it in `src/i18n/StringManager.ts` and add `XX: stringsXX` to the locale map
3. Add `"XX"` to `availableLocales` in `src/init.ts`

### Adding strings

1. Add the key + English value to `src/i18n/strings_en.json`
2. Add the same key + translated value to **all** locale files  
   *(TypeScript will error here if any locale is missing a key — that's intentional)*
3. Expose the new `StringProperty` via a getter in `StringManager.ts`

### Customizing colors

Edit `src/SimColors.ts`. Each `ProfileColorProperty` takes:
- `"default"` — color in standard (dark) mode
- `"projector"` — color when Projector Mode is enabled

Pass the property directly to any node's `fillProperty` or `strokeProperty`.

### Updating the icon

Edit `icons/icon.svg`, then run `npm run icons` to regenerate the PNG files.
The theme color in `index.html` and `vite.config.ts` (currently `#1a1a2e`) should
match your icon's background.

## Git Hooks

Activate the pre-commit hook once after cloning:

```bash
git config core.hooksPath .githooks
```

This runs `biome check` before every commit so formatting/lint issues are caught early.

## PWA

The simulation is a Progressive Web App. After running `npm run build`:
- Users can install it as a standalone app on desktop and mobile
- It works offline (Workbox service worker caches all assets)
- The manifest is at `dist/manifest.webmanifest`

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^6 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.4 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1 | PWA + service worker |

## License

MIT
