# Implementation Notes - Wave Composer Simulation

## Architecture Overview

Wave Composer is a VoceVista-style real-time voice and wave analysis simulation with three screens. Each screen has an isolated model extending `BaseAnalysisModel` with its own audio source and DSP pipeline. Inactive screens pause their analysis pipeline via `linkAnalysisModelToScreenActive()`.

### High-Level Architecture

The simulation follows a modular architecture with **three screens**:

- **Composer** (`src/composer-screen/`): Synthetic sinusoid superposition, beats, harmonics, standing-wave modes
- **Analyzer** (`src/analyzer-screen/`): Spectrogram, spectrum with LPC envelope, waveform
- **Voice & Vowels** (`src/voice-screen/`): F1×F2 vowel plot, cepstrum, voice-quality readout

Shared infrastructure lives under `src/common/`:

- **Model**: `BaseAnalysisModel`, `VoiceAnalyzer`, audio sources, DSP modules
- **View**: `BaseAnalysisScreenView`, `ChartFrame`, `SourceSelector`, colormaps

Audio defaults to microphone input but starts lazily on the Start button. Permission-free preset recordings and synthetic fallbacks use `PresetFrameSource` and related classes. Attributions are in `CREDITS.md`.

### Coordinate System

Displays use chart axes (frequency, time, formant space) rather than spatial model-view transforms. Layout margins are defined in `src/common/WaveComposerConstants.ts`.

## Model Components

### Core Model Design

`BaseAnalysisModel` provides per-screen audio capture, FFT, formant analysis, F0 detection, and voice-quality metrics. Each screen model adds pedagogy-specific state:

1. **ComposerModel** — `CompositionState` with up to four sinusoids, pipe boundary, standing-wave modes
2. **AnalyzerModel** — instrument presets, freeze, pipe-boundary pedagogy
3. **VoiceModel** — voice and phonetics presets

### Component Specialization

Shared model modules:

1. **VoiceAnalyzer**: Orchestrates the per-frame DSP chain
2. **CompositionState**: Harmonic partials for the Composer screen
3. **DSP modules** (`src/common/model/dsp/`): `Fft`, `LinearPredictor`, `FormantAnalyzer`, `YinPitchDetector`, `Autocorrelation`, `Decimator`
4. **Audio sources** (`src/common/model/audio/`): `MicrophoneInput`, `PresetFrameSource`, `RecordedAudioSource`, `SyntheticWebAudioSource`
5. **WaveComposerPreferencesModel**: Shared FFT size, LPC order, window function, and analysis settings (Preferences → Visual)

Bundled preset audio lives in `src/assets/audio/`.

View-specific overlay toggles use `ComposerViewProperties` and `AnalyzerViewProperties`.

## View Components

### BaseAnalysisScreenView as Coordinator

The base view provides the shared shell: background, reset, and popup layer. Each screen view adds specialized chart nodes.

**Composer screen:**

1. **ComposePanelNode**, **ComposerControlPanel**, **ComposerReadoutPanel**
2. **StandingWaveNode**

**Analyzer screen:**

1. **WaveformNode**, **SpectrumNode**, **SpectrogramNode**
2. **AnalyzerControlPanel**, **AnalyzerReadoutPanel**
3. **StandingWaveNode**

**Voice screen:**

1. **VowelPlotNode**, **CepstrumNode**, **SourceFilterDiagramNode**
2. **VoiceQualityReadout**, **AudioSourceControl**

Shared view utilities: **ChartFrame**, **SourceSelector**, **ColormapPreferenceControl**.

### Color Scheme

Colors are defined in `WaveComposerColors.ts`. Spectrogram and chart colors should follow the user-selected colormap preference rather than hardcoded palettes.

### Performance Optimizations

- Inactive screen pipelines are paused to avoid redundant FFT work
- FFT size is user-configurable via preferences
- Preset audio avoids microphone permission for classroom demos

Unit tests for DSP and audio modules run via `npm test` (Vitest).

Note that audio nodes and Property links should be disposed if screen lifecycle changes; most objects persist for the app lifetime.
