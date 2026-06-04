#!/usr/bin/env bash
# Downloads bundled preset clips from Wikimedia Commons (see CREDITS.md).
set -euo pipefail
UA="WaveComposer/1.0 (preset bundler)"
OUT="$(cd "$(dirname "$0")/.." && pwd)/src/assets/audio"
mkdir -p "$OUT"

download() {
  local out_name="$1"
  local url="$2"
  local dest="$OUT/$out_name"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "skip $out_name"
    return
  fi
  echo "get  $out_name"
  curl -fsSL -A "$UA" "$url" -o "$dest"
}

# IPA vowels (Denelson83 / UCLA-style)
download "vowel-ih.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e9/Near-close_near-front_unrounded_vowel.ogg"
download "vowel-oo.ogg" "https://upload.wikimedia.org/wikipedia/commons/8/84/Close_back_rounded_vowel.ogg"

# Piano / scales
download "piano.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e2/Eb_major_piano.ogg"

# Woodwinds & brass
download "bassoon.ogg" "https://upload.wikimedia.org/wikipedia/commons/f/f9/Bassoon-technical-chromatic.ogg"
download "trumpet.ogg" "https://upload.wikimedia.org/wikipedia/commons/3/38/Natural_trumpet_B-flat.ogg"
download "piccolo.ogg" "https://upload.wikimedia.org/wikipedia/commons/b/b4/It-piccolo.oga"
download "saxophone.ogg" "https://upload.wikimedia.org/wikipedia/commons/e/e1/Jazz-Sax.ogg"
download "trombone.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/ab/Trombone-multiphonics.ogg"
download "horn.ogg" "https://upload.wikimedia.org/wikipedia/commons/8/85/De-Ventilhorn.ogg"

# Strings
download "viola.ogg" "https://upload.wikimedia.org/wikipedia/commons/3/31/Viola_CGDA.ogg"

# Percussion
download "snare.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/a3/Snare_drum_muffled.ogg"
download "timpani.ogg" "https://upload.wikimedia.org/wikipedia/commons/c/c4/Timpani_F_major_triad.ogg"

# Optional: run again after a pause if Wikimedia returns HTTP 429.
download "oboe.ogg" "https://upload.wikimedia.org/wikipedia/commons/4/44/Ferling_Oboe_Study_No_28_Aaron_Hill.ogg"
download "harp.ogg" "https://upload.wikimedia.org/wikipedia/commons/a/a2/Harp_Curtain_01.ogg"
download "organ.wav" "https://upload.wikimedia.org/wikipedia/commons/e/e1/01_holpijp_8.wav"

echo "done — $(ls -1 "$OUT" | wc -l) files in $OUT"
