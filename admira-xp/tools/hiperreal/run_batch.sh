#!/usr/bin/env bash
# Usage: run_batch.sh "44 45 ..." [samples]   -> out/<n>/{hiperreal-hd.glb,hiperreal.blend,before.png,after.png}
set -u; cd "$(dirname "$0")"; B=~/blender-dl/blender-5.2.2-linux-x64/blender; S=${2:-32}; CAT=${CAT:-/workspace/grokbot-xpaceos/inventario/assets/catalog}
for n in $1; do p=$(printf %02d $n); src=$(python3 -c "import json;c=json.load(open('pieces.json'));print({**c['defaults'],**c['pieces'].get('$n',{})}['source'])")
  mkdir -p out/$n
  [ "${SKIP_BUILD:-}" ] || $B -b $CAT/$p/$src.blend --factory-startup --python pipeline.py -- --piece $n --out out/$n --mode build 2>&1 | grep -E "^BUILD|Traceback|Error" 
  [ "${SKIP_RENDER:-}" ] && continue
  $B -b $CAT/$p/$src.blend --factory-startup --python pipeline.py -- --piece $n --out out/$n --mode before --samples $S 2>&1 | grep -E "RENDERED|Traceback|Error"
  $B -b out/$n/hiperreal.blend --factory-startup --python pipeline.py -- --piece $n --out out/$n --mode after --samples $S 2>&1 | grep -E "RENDERED|Traceback|Error"
done
