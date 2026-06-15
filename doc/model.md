# Model - Wave Composer

This document describes the model (the underlying signal processing, math, and behavior) for the
simulation, in terms appropriate for an educator. It is the companion to
[implementation-notes.md](./implementation-notes.md), which targets developers.

## Overview

Wave Composer is a real-time **sound-analysis** simulation in the spirit of voice-spectrography tools.
Rather than a physics model of moving objects, its "model" is a **digital signal processing (DSP)
pipeline**: an audio signal is captured in short overlapping frames, and each frame is transformed into
the frequency-domain and acoustic representations that musicians and speech scientists use. The three
screens share the same pipeline (`BaseAnalysisModel`) but expose different views of it:

- **Composer** — the signal is *synthesized* from user-chosen sinusoids, beats, harmonic stacks, and
  standing-wave modes, so students can hear and see how adding partials builds a complex tone.
- **Analyzer** — a live **spectrogram** (frequency vs. time), instantaneous **spectrum** with an **LPC
  spectral envelope**, and the time-domain **waveform**.
- **Voice & Vowels** — an **F1×F2 vowel plot**, a **cepstrum**, and a voice-quality readout derived from
  the same frame analysis applied to speech.

The audio source defaults to the microphone but starts only when the student presses Start; permission-
free preset recordings (and synthesized fallbacks) are available so the sim works without a microphone.

## Quantities and units

| Quantity | Symbol | Units | Notes |
|---|---|---|---|
| Sample rate | fₛ | Hz | Frames are sampled from the audio context (typically 44.1/48 kHz) |
| Frame (FFT) size | N | samples | User preference (1024 / 2048 / 4096); sets frequency resolution fₛ/N |
| Frequency | f | Hz | Bin k maps to f = k·fₛ/N |
| Magnitude / level | — | dB | Spectrum and spectrogram are shown on a decibel scale |
| Fundamental frequency | f₀ | Hz | Estimated pitch of a voiced/periodic signal |
| Formants | F1, F2, … | Hz | Vocal-tract resonance peaks, read from the LPC envelope |
| LPC order | p | — | Number of linear-prediction coefficients (preference, range 8–16) |
| Quefrency | τ | s | Independent axis of the cepstrum (the "spectrum of the log-spectrum") |

## Governing computations

**Windowing + FFT.** Each frame of N samples is multiplied by a window function (Hann, etc., a user
preference) to reduce spectral leakage, then transformed with the FFT to a magnitude spectrum. The
spectrogram is the sequence of these spectra stacked over time and mapped to color.

**LPC envelope and formants.** Linear Predictive Coding fits an all-pole filter of order *p* to the
frame; the smooth envelope of that filter approximates the vocal-tract transfer function, and its peaks
are the formant frequencies F1, F2, … plotted on the vowel chart.

**Pitch (YIN).** The fundamental frequency f₀ is estimated with the YIN autocorrelation-difference
method, which is robust to the octave errors that plague naive autocorrelation.

**Cepstrum.** Taking the inverse transform of the log-magnitude spectrum produces the cepstrum; a peak at
quefrency τ indicates periodicity at f₀ = 1/τ, separating the source (pitch) from the filter (formants).

All analysis advances through the model's `step(dt)` chain as new audio frames arrive; there are no
frame-rate assumptions in the model.

## Simplifications

- Analysis is per-frame and assumes the signal is approximately stationary over each short frame.
- Formant extraction is the standard LPC peak-picking approximation, not a full articulatory model.
- Synthesized sources on the Composer screen are ideal (no instrument body or noise model).
