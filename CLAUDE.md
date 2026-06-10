# CLAUDE.md — Wave Composer

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

VoceVista-style real-time voice-analysis simulation with three screens. Each screen has an isolated model extending `BaseAnalysisModel` (own audio source + DSP pipeline):

- **Composer** (`src/composer-screen/`) — superpose sinusoids, beats, harmonics, standing-wave modes
- **Analyzer** (`src/sim-screen/`) — spectrogram, spectrum + LPC envelope, waveform
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
| `src/sim-screen/` | Analyzer screen model + view |
| `src/voice-screen/` | Voice & Vowels screen model + view |

## Sim-specific commands

```bash
npm test           # Vitest unit tests
```

When adding a feature, extend the appropriate screen model/view or `BaseAnalysisModel` if shared across screens.
