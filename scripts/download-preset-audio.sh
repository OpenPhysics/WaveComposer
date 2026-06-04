#!/usr/bin/env bash
# Downloads bundled preset clips from Wikimedia Commons and Hugging Face fallbacks.
# See CREDITS.md for attribution.
#
# Usage:
#   bash scripts/download-preset-audio.sh          # skip existing files
#   FORCE=1 bash scripts/download-preset-audio.sh  # re-fetch IPA voice clips
#   PAUSE=3 bash scripts/download-preset-audio.sh    # slower (avoids Wikimedia 429)
set -euo pipefail
UA="WaveComposer/1.0 (preset bundler)"
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/assets/audio"
HF_CONS="https://huggingface.co/datasets/ClueSurf/wikipedia-ipa/resolve/main/base/consonant/audio"
mkdir -p "$OUT"
FORCE="${FORCE:-0}"
PAUSE="${PAUSE:-2}"

download() {
  local out_name="$1"
  local url="$2"
  local dest="$OUT/$out_name"
  if [[ "$FORCE" != "1" && -f "$dest" && -s "$dest" ]]; then
    echo "skip $out_name"
    return 0
  fi
  echo "get  $out_name"
  if curl -fsSL -A "$UA" "$url" -o "$dest"; then
    sleep "$PAUSE"
    return 0
  fi
  echo "fail $out_name (will retry HF fallback if configured)"
  rm -f "$dest"
  return 1
}

download_hf_wav() {
  local out_stem="$1"
  local hf_file="$2"
  local dest="$OUT/${out_stem}.wav"
  if [[ "$FORCE" != "1" && -f "$dest" && -s "$dest" ]]; then
    echo "skip ${out_stem}.wav"
    return 0
  fi
  echo "get  ${out_stem}.wav (Hugging Face)"
  curl -fsSL -L -A "$UA" "$HF_CONS/$hf_file" -o "$dest"
  sleep 1
}

echo "=== IPA vowels (Wikimedia Commons / Denelson83) ==="
download "vowel-ah.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e5/Open_back_unrounded_vowel.ogg" || true
download "vowel-ee.ogg" "https://upload.wikimedia.org/wikipedia/commons/9/91/Close_front_unrounded_vowel.ogg" || true
download "vowel-ih.ogg" "https://upload.wikimedia.org/wikipedia/commons/4/4c/Near-close_near-front_unrounded_vowel.ogg" || true
download "vowel-oo.ogg" "https://upload.wikimedia.org/wikipedia/commons/5/5d/Close_back_rounded_vowel.ogg" || true
download "vowel-uh.ogg" "https://upload.wikimedia.org/wikipedia/commons/9/92/Open-mid_back_unrounded_vowel.ogg" || true
download "vowel-oh.ogg" "https://upload.wikimedia.org/wikipedia/commons/0/02/Open-mid_back_rounded_vowel.ogg" || true
download "vowel-ay.ogg" "https://upload.wikimedia.org/wikipedia/commons/6/65/Open_front_unrounded_vowel.ogg" || true
download "vowel-er.ogg" "https://upload.wikimedia.org/wikipedia/commons/d/d9/Mid-central_vowel.ogg" || true

echo "=== IPA consonants (Wikimedia; HF .wav fallback for plosives /f/) ==="
download "consonant-m.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/a9/Bilabial_nasal.ogg" || true
download "consonant-n.ogg" "https://upload.wikimedia.org/wikipedia/commons/2/29/Alveolar_nasal.ogg" || true
download "consonant-s.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/ac/Voiceless_alveolar_sibilant.ogg" || true
download "consonant-sh.ogg" "https://upload.wikimedia.org/wikipedia/commons/c/cc/Voiceless_palato-alveolar_sibilant.ogg" || true

if [[ "$FORCE" == "1" || ! -f "$OUT/consonant-f.ogg" && ! -f "$OUT/consonant-f.wav" ]]; then
  download "consonant-f.ogg" "https://upload.wikimedia.org/wikipedia/commons/3/33/Voiceless_labiodental_fricative.ogg" \
    || download_hf_wav "consonant-f" "f.wav"
fi
if [[ "$FORCE" == "1" || ! -f "$OUT/consonant-p.wav" ]]; then
  download "consonant-p.ogg" "https://upload.wikimedia.org/wikipedia/commons/5/51/Voiceless_bilabial_plosive.ogg" \
    || download_hf_wav "consonant-p" "p.wav"
fi
if [[ "$FORCE" == "1" || ! -f "$OUT/consonant-t.wav" ]]; then
  download "consonant-t.ogg" "https://upload.wikimedia.org/wikipedia/commons/0/02/Voiceless_alveolar_plosive.ogg" \
    || download_hf_wav "consonant-t" "t.wav"
fi
if [[ "$FORCE" == "1" || ! -f "$OUT/consonant-b.wav" ]]; then
  download "consonant-b.ogg" "https://upload.wikimedia.org/wikipedia/commons/2/2c/Voiced_bilabial_plosive.ogg" \
    || download_hf_wav "consonant-b" "b.wav"
fi

echo "=== Instruments (skip if present) ==="
download "piano.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e2/Eb_major_piano.ogg" || true
download "bassoon.ogg" "https://upload.wikimedia.org/wikipedia/commons/f/f9/Bassoon-technical-chromatic.ogg" || true
download "trumpet.ogg" "https://upload.wikimedia.org/wikipedia/commons/3/38/Natural_trumpet_B-flat.ogg" || true
download "piccolo.ogg" "https://upload.wikimedia.org/wikipedia/commons/b/b4/It-piccolo.oga" || true
download "saxophone.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e1/Jazz-Sax.ogg" || true
download "trombone.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/ab/Trombone-multiphonics.ogg" || true
download "horn.ogg" "https://upload.wikimedia.org/wikipedia/commons/8/85/De-Ventilhorn.ogg" || true
download "viola.ogg" "https://upload.wikimedia.org/wikipedia/commons/3/31/Viola_CGDA.ogg" || true
download "snare.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/a3/Snare_drum_muffled.ogg" || true
download "timpani.ogg" "https://upload.wikimedia.org/wikipedia/commons/c/c4/Timpani_F_major_triad.ogg" || true
download "oboe.ogg" "https://upload.wikimedia.org/wikipedia/commons/4/44/Ferling_Oboe_Study_No_28_Aaron_Hill.ogg" || true

echo "=== Voice singing demos ==="
# singing-arpeggio: Freesound #448085 — Katarina Rose (CC BY 3.0)
# Preview MP3 from CDN; user_hash resolved from page HTML (5781159)
download "singing-arpeggio.mp3" "https://cdn.freesound.org/previews/448/448085_5781159-hq.mp3" || true

# singing-vibrato: Wikimedia Commons — Beetricks (CC0)
download "singing-vibrato.wav" "https://upload.wikimedia.org/wikipedia/commons/c/c3/Female-vibrato-1.wav" || true

# soprano-scale: Freesound #442571 — mooncubedesign (CC0)
# Preview MP3 from CDN; user_hash resolved from page HTML (5426702)
download "soprano-scale.mp3" "https://cdn.freesound.org/previews/442/442571_5426702-hq.mp3" || true

# vowel-chain: Wikimedia Commons — Brendan C. Heberlein (CC BY-SA 4.0)
download "vowel-chain.ogg" "https://upload.wikimedia.org/wikipedia/commons/c/c2/Frontal_vowels_a_%C3%A6_%C9%9B_e_i.ogg" || true

echo "done — $(ls -1 "$OUT" | wc -l) files in $OUT"
