#!/usr/bin/env bash
# Locuciones GOOD de las cápsulas «¿Sabías que…?»: voces del sistema Mac (Mónica ES · Daniel EN), 0 €.
# Lee capsulas/capsulas-good.json y deja capsulas/audio/<id>-es.m4a y <id>-en.m4a (AAC mono 22 kHz ~32 kbps,
# como los avisos del gemelo). Sólo regenera los que faltan o cuyo texto cambió (.txt al lado).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p capsulas/audio
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
python3 - <<'PY' > "$TMP/list.tsv"
import json,re
b=json.load(open('capsulas/capsulas-good.json'))
for c in b['capsulas']:
  for l in ('es','en'):
    t=re.sub(r'^\s*(…|\.\.\.)\s*','',c['texto'][l]).strip().rstrip('.!')
    print(c['id'],l,('Did you know '+t+'?') if l=='en' else ('¿Sabías que '+t+'?'),sep='\t')
PY
n=0
while IFS=$'\t' read -r id l text; do
  out="capsulas/audio/$id-$l.m4a"; sig="capsulas/audio/$id-$l.txt"
  if [ -f "$out" ] && [ -f "$sig" ] && [ "$(cat "$sig")" = "$text" ]; then continue; fi
  v=Mónica; [ "$l" = en ] && v=Daniel
  say -v "$v" -o "$TMP/a.aiff" -- "$text"
  afconvert -f m4af -d aac -b 32000 -c 1 --src-complexity bats -r 127 "$TMP/a.aiff" "$out" 2>/dev/null || afconvert -f m4af -d aac -b 32000 -c 1 "$TMP/a.aiff" "$out"
  printf '%s' "$text" > "$sig"; n=$((n+1))
done < "$TMP/list.tsv"
echo "✓ $n locuciones nuevas · $(ls capsulas/audio/*.m4a | wc -l | tr -d ' ') en total · $(du -sh capsulas/audio | cut -f1)"
