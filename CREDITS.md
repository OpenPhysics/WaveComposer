# Credits

## Bundled audio clips (`src/assets/audio/`)

Demo sources are real recordings from [Wikimedia Commons](https://commons.wikimedia.org/),
used under their open licenses. Audio is **unmodified** except renamed to kebab-case
filenames. Run `scripts/download-preset-audio.sh` to fetch clips added after the
initial bundle. Attribution and license per clip:

| File | Source recording | Author | License |
|---|---|---|---|
| `vowel-ah.ogg` | [Open back unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg) | Denelson83 | CC BY-SA 3.0 / GFDL 1.2+ |
| `vowel-ee.ogg` | [Close front unrounded vowel.ogg](https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg) | Denelson83 | CC BY-SA 3.0 / GFDL 1.2+ |
| `clarinet.ogg` | [Jazz Clarinet.ogg](https://commons.wikimedia.org/wiki/File:Jazz_Clarinet.ogg) | Serolillo | CC BY 2.5 |
| `flute.ogg` | [Carnatic flute.ogg](https://commons.wikimedia.org/wiki/File:Carnatic_flute.ogg) | Bansuri.arvind | CC BY-SA 3.0 |
| `piccolo.ogg` | [It-piccolo.oga](https://commons.wikimedia.org/wiki/File:It-piccolo.oga) | — | See Commons file page |
| `violin.ogg` | [Violin G major scale.ogg](https://commons.wikimedia.org/wiki/File:Violin_G_major_scale.ogg) | Mutatis mutandis | CC BY-SA 3.0 |
| `viola.ogg` | [Viola CGDA.ogg](https://commons.wikimedia.org/wiki/File:Viola_CGDA.ogg) | — | See Commons file page |
| `bassoon.ogg` | [Bassoon-technical-chromatic.ogg](https://commons.wikimedia.org/wiki/File:Bassoon-technical-chromatic.ogg) | — | See Commons file page |
| `saxophone.ogg` | [Jazz-Sax.ogg](https://commons.wikimedia.org/wiki/File:Jazz-Sax.ogg) | — | See Commons file page |
| `trumpet.ogg` | [Natural trumpet B-flat.ogg](https://commons.wikimedia.org/wiki/File:Natural_trumpet_B-flat.ogg) | — | See Commons file page |
| `horn.ogg` | [De-Ventilhorn.ogg](https://commons.wikimedia.org/wiki/File:De-Ventilhorn.ogg) | — | See Commons file page |
| `trombone.ogg` | [Trombone-multiphonics.ogg](https://commons.wikimedia.org/wiki/File:Trombone-multiphonics.ogg) | — | See Commons file page |
| `piano.ogg` | [Eb major piano.ogg](https://commons.wikimedia.org/wiki/File:Eb_major_piano.ogg) | ROUX₪ | CC0 1.0 |
| `guitar-scale.ogg` | [Classical guitar scale.ogg](https://commons.wikimedia.org/wiki/File:Classical_guitar_scale.ogg) | Georg Feitscher (User:Feitscherg) | CC BY-SA 3.0 / GFDL 1.2+ |
| `snare.ogg` | [Snare drum muffled.ogg](https://commons.wikimedia.org/wiki/File:Snare_drum_muffled.ogg) | — | See Commons file page |
| `timpani.ogg` | [Timpani F major triad.ogg](https://commons.wikimedia.org/wiki/File:Timpani_F_major_triad.ogg) | — | See Commons file page |
| `cymbals.ogg` | [Crash cymbal.ogg](https://commons.wikimedia.org/wiki/File:Crash_cymbal.ogg) | Clngre | CC BY-SA 3.0 / GFDL 1.2+ |

Optional clips (same script; swap synthesizers when present):

| File | Source recording |
|---|---|
| `oboe.ogg` | [Ferling Oboe Study No 28 Aaron Hill.ogg](https://commons.wikimedia.org/wiki/File:Ferling_Oboe_Study_No_28_Aaron_Hill.ogg) |
| `harp.ogg` | [Harp Curtain 01.ogg](https://commons.wikimedia.org/wiki/File:Harp_Curtain_01.ogg) |
| `organ.wav` | [01 holpijp 8.wav](https://commons.wikimedia.org/wiki/File:01_holpijp_8.wav) |

These clips remain under their respective licenses (the CC BY-SA clips keep the
ShareAlike obligation; reuse must attribute the author and link the license).

### Voice & Vowels screen (`voicePresets` in `presetCatalog.ts`)

Bundled IPA vowels use the same Wikimedia clips as above (`vowel-ah.ogg`, `vowel-ee.ogg`).
Optional: `vowel-ih.ogg`, `vowel-oo.ogg` via `scripts/download-preset-audio.sh`.

Synthesized phonetics/voice demos (`src/model/audio/voicePresets.ts`, CC0 1.0): extra
vowels, nasals /m/ /n/, fricatives /s/ /sh/ /f/, plosives /p/ /t/ /b/, singing arpeggio,
vibrato sustain, soprano scale, and vowel chain.

### Synthesized instrument fallbacks

- **Cello** — bowed-string harmonic ladder (synthetic). CC0 1.0.
- **Oboe** — odd-harmonic scale (synthetic) until `oboe.ogg` is downloaded.

### Swapping clips

Preset wiring lives in `src/model/audio/presetCatalog.ts` and `presetAssets.ts` (glob).
Replace or add a file under `src/assets/audio/`, update `CREDITS.md`, and rebuild.
Prefer **Ogg Vorbis / Opus / WAV / MP3** (browser `decodeAudioData` does not support
Ogg **Speex**).
