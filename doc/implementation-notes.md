# Implementation Notes - Wave Composer

Developer-facing notes on the architecture. The DSP pipeline is documented for educators in
[model.md](./model.md).

## Architecture Overview

Wave Composer is a three-screen SceneryStack sim. Each screen owns an isolated model extending
`BaseAnalysisModel` (separate audio source, recordings, and analysis outputs). Inactive screens pause
analysis via `linkAnalysisModelToScreenActive()` in each `*Screen.ts`.

```
src/common/model/
  ├─ BaseAnalysisModel.ts        per-screen audio + settings + step() → VoiceAnalyzer
  ├─ VoiceAnalyzer.ts            orchestrates one frame: YIN, FFT, LPC, cepstrum, HNR
  ├─ CompositionState.ts         Composer harmonic partials (Composer screen)
  ├─ HarmonicChartModel.ts / PipeBoundary.ts
  ├─ dsp/
  │   ├─ Fft.ts, WindowFunction.ts, SignalUtils.ts, Decimator.ts
  │   ├─ LinearPredictor.ts, FormantAnalyzer.ts, Autocorrelation.ts
  │   ├─ YinPitchDetector.ts, VoiceQuality.ts, NoteUtils.ts
  │   └─ PolynomialRootFinder.ts, Complex.ts, types.ts
  └─ audio/
      ├─ AudioFrameSource.ts, SharedAudioContext.ts, AnalyserTap.ts
      ├─ MicrophoneInput.ts, RecordedAudioSource.ts, AudioFileFrameSource.ts
      ├─ PresetFrameSource.ts, SyntheticWebAudioSource.ts, SyntheticFrameSource.ts
      ├─ ComposableFrameSource.ts, MonitoredAudioSource.ts, BufferPlaybackSource.ts
      ├─ presetCatalog.ts, presetAssets.ts, voicePresets.ts, WavEncoder.ts
      └─ presets.ts

src/common/view/
  ├─ BaseAnalysisScreenView.ts   shared shell, start/stop, reset
  ├─ ChartFrame.ts, SourceSelector.ts, Colormaps.ts, IpaVowels.ts
  └─ WaveComposerScreenSummaryContent.ts, WaveComposerKeyboardHelpContent.ts

src/composer-screen/
  ├─ model/ComposerModel.ts
  └─ view/ ComposePanelNode, ComposerControlPanel, ComposerReadoutPanel, …

src/analyzer-screen/
  ├─ model/AnalyzerModel.ts
  └─ view/ WaveformNode, SpectrumNode, SpectrogramNode, StandingWaveNode, …

src/voice-screen/
  ├─ model/VoiceModel.ts
  └─ view/ VowelPlotNode, CepstrumNode, SourceFilterDiagramNode, VoiceQualityReadout, …

src/preferences/ WaveComposerPreferencesModel, AnalysisConstants, colormap/LPC/FFT prefs
src/assets/audio/              bundled .ogg presets (see CREDITS.md)
```

Charts use **frequency/time/formant axes**, not spatial model-view transforms. Layout constants live
in `src/WaveComposerConstants.ts` and `src/preferences/AnalysisConstants.ts`.

## Key design decisions

- **One analyzer, reusable buffers.** `VoiceAnalyzer` owns FFT/YIN instances and scratch arrays sized
  to the current config — `analyze()` avoids large per-frame allocation (only small result wrappers).
- **Screen isolation.** `main.ts` constructs three models (`ComposerModel`, `AnalyzerModel`,
  `VoiceModel`) sharing one `WaveComposerPreferencesModel` for FFT size, window, LPC order, colormap.
- **Lazy microphone.** No permission prompt on load; Start enables `MicrophoneInput`. Presets use
  `AudioFileFrameSource` or `createSyntheticSource()` when assets are missing.
- **Formant path decimation.** LPC branch decimates toward ~11 kHz (`FORMANT_LPC_RATE_HZ`) to match
  reference voice-analysis practice (see comments in `VoiceAnalyzer.ts`).
- **View-only overlay state.** `ComposerViewProperties` / `AnalyzerViewProperties` hold chart toggles
  separate from the DSP model.
- **Superposition is drawn, not implied.** `WaveformNode` accepts optional `componentTraces`; the
  Composer screen supplies one per partial, filled by `ComposerModel.fillPartialWaveform()` on the
  same time base as the sum, so the faint component curves line up sample-for-sample with the bold
  summed curve. Each partial's identity color (`PARTIAL_COLOR_PROPERTIES`) is shared by its swatch in
  the Compose panel and its trace, which is what ties a slider to the curve it moves.
- **Preset/partial coupling lives in the model.** `CompositionState` links `presetProperty` to
  `applyPreset()` and every partial Property back to `markCustom()`, so panels stay presentational.
  Partials a preset leaves off keep a non-zero `STANDBY_AMPLITUDE`: switching one on must do
  something audible.

## Model / view design

- `BaseAnalysisModel.step(dt)` pulls frames from the active source when listening, runs
  `voiceAnalyzer.analyze()`, writes `f0Property`, `formantsProperty`, spectrum buffers exposed to views.
- Spectrogram colour comes from user colormap preference, not hardcoded UI colors (`WaveComposerColors`
  for chrome only).
- `SourceSelector.dispose()` cleans up source-switch listeners when used in dynamic contexts.

## Disposal conventions

Most audio nodes and Property links live for the app lifetime. `MicrophoneInput` and recording sources
should be stopped on screen deactivate (handled in screen active linking). If adding removable chart
nodes or source panels, follow fleet WeakRef dispose tests.

## Testing

`npm test` (vitest, `--expose-gc`):

- `tests/common/model/VoiceAnalyzer.test.ts` — end-to-end frame analysis on synthetic signals
- `tests/common/model/dsp/` — Fft, LinearPredictor, FormantAnalyzer, YinPitchDetector, WindowFunction,
  VoiceQuality, Decimator, NoteUtils, PolynomialRootFinder
- `tests/common/model/audio/` — ComposableFrameSource, PresetFrameSource
- `tests/memory-leak.test.ts` — fleet WeakRef/GC regression

## Multi-screen simulations

Three screens with shared preferences and parallel model instances; see fleet `doc/multi-screen.md`
for the pattern used in `main.ts` (pre-built models passed into Screen constructors).
