#!/usr/bin/env bash
# Web LOD: dedup -> resize (2K colour, 1K data maps) -> WebP q84 [-> quantize if > 5 MB] -> webglass (small glass parts -> opaque gloss)
set -euo pipefail; cd "$(dirname "$0")"; GT=${GT:-/workspace/hiperreal47/tools/node_modules/.bin/gltf-transform}
n=$1; d=out/$n; t=$(mktemp -d)
$GT dedup $d/hiperreal-hd.glb $t/a.glb >/dev/null
$GT resize $t/a.glb $t/b.glb --width 2048 --height 2048 >/dev/null
$GT resize $t/b.glb $t/c.glb --width 1024 --height 1024 --pattern '{*arm*,*orm*,*normal*,*nor_gl*,pastry*,powder*,stone*}' >/dev/null
$GT webp $t/c.glb $d/hiperreal.glb --quality 84 >/dev/null
if [ $(stat -c %s $d/hiperreal.glb) -gt 5000000 ]; then $GT quantize $d/hiperreal.glb $t/q.glb >/dev/null && mv $t/q.glb $d/hiperreal.glb; fi
python3 webglass.py $d/hiperreal.glb >&2  # the web viewer has no transmission: small glass would vanish (19/20/23 lamps, 2 bottles); HD keeps real glass
rm -rf $t; echo "$n web=$(stat -c %s $d/hiperreal.glb) hd=$(stat -c %s $d/hiperreal-hd.glb)"
