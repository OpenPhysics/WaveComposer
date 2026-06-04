# Credits

## Bundled audio clips (`src/assets/audio/`)

Demo sources are real recordings from [Wikimedia Commons](https://commons.wikimedia.org/)
and the [ClueSurf/wikipedia-ipa](https://huggingface.co/datasets/ClueSurf/wikipedia-ipa)
dataset (Wikipedia IPA chart audio, CC BY-SA 4.0). Audio is **unmodified** except renamed
to kebab-case filenames. Run `scripts/download-preset-audio.sh` to fetch or refresh clips.

### Voice & Vowels — IPA vowels (Denelson83, Wikimedia Commons)

| File | IPA | Commons source |
|---|---|---|
| `vowel-ah.ogg` | /ɑ/ | [Open back unrounded vowel](https://commons.wikimedia.org/wiki/File:Open_back_unrounded_vowel.ogg) |
| `vowel-ee.ogg` | /i/ | [Close front unrounded vowel](https://commons.wikimedia.org/wiki/File:Close_front_unrounded_vowel.ogg) |
| `vowel-ih.ogg` | /ɪ/ | [Near-close near-front unrounded vowel](https://commons.wikimedia.org/wiki/File:Near-close_near-front_unrounded_vowel.ogg) |
| `vowel-oo.ogg` | /u/ | [Close back rounded vowel](https://commons.wikimedia.org/wiki/File:Close_back_rounded_vowel.ogg) |
| `vowel-uh.ogg` | /ʌ/ | [Open-mid back unrounded vowel](https://commons.wikimedia.org/wiki/File:Open-mid_back_unrounded_vowel.ogg) |
| `vowel-oh.ogg` | /o/ | [Open-mid back rounded vowel](https://commons.wikimedia.org/wiki/File:Open-mid_back_rounded_vowel.ogg) |
| `vowel-ay.ogg` | /æ/ | [Open front unrounded vowel](https://commons.wikimedia.org/wiki/File:Open_front_unrounded_vowel.ogg) |
| `vowel-er.ogg` | /ə/ | [Mid-central vowel](https://commons.wikimedia.org/wiki/File:Mid-central_vowel.ogg) |

Author for Denelson83 vowels: **Denelson83** — CC BY-SA 3.0 / GFDL (see each file page).

### Voice & Vowels — IPA consonants

| File | IPA | Source |
|---|---|---|
| `consonant-m.ogg` | /m/ | [Bilabial nasal](https://commons.wikimedia.org/wiki/File:Bilabial_nasal.ogg) |
| `consonant-n.ogg` | /n/ | [Alveolar nasal](https://commons.wikimedia.org/wiki/File:Alveolar_nasal.ogg) |
| `consonant-s.ogg` | /s/ | [Voiceless alveolar sibilant](https://commons.wikimedia.org/wiki/File:Voiceless_alveolar_sibilant.ogg) |
| `consonant-sh.ogg` | /ʃ/ | [Voiceless palato-alveolar sibilant](https://commons.wikimedia.org/wiki/File:Voiceless_palato-alveolar_sibilant.ogg) |
| `consonant-f.wav` | /f/ | [ClueSurf/wikipedia-ipa](https://huggingface.co/datasets/ClueSurf/wikipedia-ipa) (`f.wav`) |
| `consonant-p.wav` | /p/ | ClueSurf/wikipedia-ipa (`p.wav`) |
| `consonant-t.wav` | /t/ | ClueSurf/wikipedia-ipa (`t.wav`) |
| `consonant-b.wav` | /b/ | ClueSurf/wikipedia-ipa (`b.wav`) |

Plosives and /f/ use Hugging Face when Wikimedia rate-limits downloads; same Wikipedia IPA
recordings, WAV format from the dataset mirror.

### Analyzer — instruments (Wikimedia Commons)

| File | Source recording | Author | License |
|---|---|---|---|
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
| `guitar-scale.ogg` | [Classical guitar scale.ogg](https://commons.wikimedia.org/wiki/File:Classical_guitar_scale.ogg) | Georg Feitscher | CC BY-SA 3.0 / GFDL |
| `snare.ogg` | [Snare drum muffled.ogg](https://commons.wikimedia.org/wiki/File:Snare_drum_muffled.ogg) | — | See Commons file page |
| `timpani.ogg` | [Timpani F major triad.ogg](https://commons.wikimedia.org/wiki/File:Timpani_F_major_triad.ogg) | — | See Commons file page |
| `cymbals.ogg` | [Crash cymbal.ogg](https://commons.wikimedia.org/wiki/File:Crash_cymbal.ogg) | Clngre | CC BY-SA 3.0 / GFDL |

Optional: `oboe.ogg` — [Ferling Oboe Study](https://commons.wikimedia.org/wiki/File:Ferling_Oboe_Study_No_28_Aaron_Hill.ogg)

### Voice & Vowels — singing demos

| File | Description | Source | Author | License |
|---|---|---|---|---|
| `singing-arpeggio.mp3` | Female voice singing "rising" on an A-minor arpeggio | [Freesound #448085](https://freesound.org/people/womb_affliction/sounds/448085/) | Katarina Rose (womb_affliction) | CC BY 3.0 |
| `singing-vibrato.wav` | Female voice sustaining with vibrato | [Wikimedia Commons — Female-vibrato-1.wav](https://commons.wikimedia.org/wiki/File:Female-vibrato-1.wav) | Beetricks | CC0 1.0 |
| `soprano-scale.mp3` | Female voice singing A-major scale, one note per 2 bars | [Freesound #442571](https://freesound.org/people/mooncubedesign/sounds/442571/) | mooncubedesign | CC0 1.0 |
| `vowel-chain.ogg` | IPA front unrounded vowels [a æ ɛ e i] in sequence | [Wikimedia Commons — Frontal vowels a æ ɛ e i.ogg](https://commons.wikimedia.org/wiki/File:Frontal_vowels_a_%C3%A6_%C9%9B_e_i.ogg) | Brendan C. Heberlein | CC BY-SA 4.0 |

### Synthesized instrument fallbacks

**Cello** and **oboe** until `cello.ogg` / `oboe.ogg` are present — `src/model/audio/presets.ts` (CC0 1.0).

### Refreshing clips

```bash
# Re-download voice IPA (use PAUSE=3 if Wikimedia returns HTTP 429)
FORCE=1 PAUSE=3 bash scripts/download-preset-audio.sh
```

Preset wiring: `src/model/audio/presetCatalog.ts` and `presetAssets.ts` (glob). Prefer **Ogg / WAV / MP3** (not Ogg Speex).
