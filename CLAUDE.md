# CLAUDE.md — Wave Composer

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

VoceVista-style real-time voice-analysis simulation with three screens. Each screen has an isolated model extending `BaseAnalysisModel` (own audio source + DSP pipeline):

- **Composer** (`src/composer-screen/`) — superpose sinusoids, beats, harmonics, standing-wave modes
- **Analyzer** (`src/analyzer-screen/`) — spectrogram, spectrum + LPC envelope, waveform
- **Voice & Vowels** (`src/voice-screen/`) — F1×F2 vowel plot, cepstrum, voice-quality readout

Audio defaults to **microphone** but starts lazily on the Start button (no permission prompt on load). Permission-free **presets** (real recordings + synthesized fallback) use `AudioFileFrameSource` / `PresetFrameSource`. Attributions in `CREDITS.md`.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/BaseAnalysisModel.ts` | Shared per-screen audio + DSP base model |
| `src/common/model/audio/` | `MicrophoneInput`, presets, file playback, synthetic sources |
| `src/common/model/dsp/` | FFT, LPC, YIN, formants, cepstrum, windows |
| `src/common/view/` | `ChartFrame`, colormaps, IPA vowels, source selector |
| `src/assets/audio/` | Bundled preset recordings (`.ogg`) |
| `src/composer-screen/` | Composer screen model + view |
| `src/analyzer-screen/` | Analyzer screen model + view |
| `src/voice-screen/` | Voice & Vowels screen model + view |

## Accessibility

Follows the shared [OpenPhysics accessibility convention](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).
Each screen registers the shared `WaveComposerScreenSummaryContent` (constructed with the screen's
own `a11y` subgroup — `composer` / `analyzer` / `voice`) via the `screenSummaryContent` super-option.
A11y strings live under the top-level `a11y` key in each locale JSON, via `StringManager.getA11yStrings()`.
Current-details is static per screen; it can be made live by deriving from each screen's model.

## Compliance carve-outs

- **Nested constants:** DSP/layout constants live beside analysis models under `src/common/model/` (multi-screen tool layout).

## Testing

Fleet-standard Vitest layout:

| Path | Purpose |
|---|---|
| `vitest.config.ts` | Test environment + `setupFiles` when present; `execArgv: ["--expose-gc"]` with memory-leak suite |
| `tests/setup.ts` | Canvas / AudioContext mocks + `init({ name: "…" })` before SceneryStack imports (when required) |
| `tests/**/*.test.ts` | Model/physics unit tests — mirror `src/` under `tests/` |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression (fleet pattern) |

- Put unit tests only under root `tests/` (never co-locate or use `__tests__/`).
- Run `npm test`. CI runs the suite when a `test` script is present.
- Expand `memory-leak.test.ts` for components that add/remove nodes or link Properties at runtime (see OpticsLab).

## Sim-specific commands

```bash
npm test           # Vitest unit tests
```

When adding a feature, extend the appropriate screen model/view or `BaseAnalysisModel` if shared across screens.
