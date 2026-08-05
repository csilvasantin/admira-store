#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# book-tags-demo.sh — Reserva una parrilla DEMO en admira.tv para los 4 paneles
# DOOH del gemelo (XpaceOS), por su TAG. Tras ejecutarlo, cada panel emite SU
# propia programación (en vez del fallback al canal de la casa).
#
# La clave NO va en el repo: se pasa al ejecutar.
#   GRID_KEY='la-clave-de-la-cupula' bash admira-xp/scripts/book-tags-demo.sh
#
# Reversible: para quitar una reserva → POST /grid/unbook {key,screen,date,id}.
# Requiere: bash, curl, python3.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
API='https://api.admira.store'
STOCK='https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/index.json'
DATE="${DATE:-$(python3 -c 'import datetime;print(datetime.date.today().isoformat())')}"
BANDS=(manana mediodia tarde noche)   # reserva en las 4 franjas → siempre emite
# Panel (tag) → título del anuncio demo
TAGS=(xt-gracia-p1 xt-gracia-p2 xt-gracia-esc xt-gracia-mh)

if [ -z "${GRID_KEY:-}" ]; then
  echo "❌ Falta GRID_KEY. Uso: GRID_KEY='...' bash $0" >&2; exit 1
fi

echo "📅 Fecha grid: $DATE"
echo "🎬 Descargando Stock (vídeos)…"
mapfile -t VIDEOS < <(curl -s "$STOCK" | python3 -c '
import sys,json
d=json.load(sys.stdin)
vs=[x for x in (d.get("items") or []) if x.get("type")=="video" and x.get("url")]
for x in vs[:8]:
    print("%s\t%s\t%s" % (x.get("id",""), x.get("url",""), (x.get("title") or x.get("name") or "Canal").replace("\t"," ")[:80]))
')
if [ "${#VIDEOS[@]}" -eq 0 ]; then echo "❌ Sin vídeos en el Stock" >&2; exit 1; fi

i=0
for tag in "${TAGS[@]}"; do
  IFS=$'\t' read -r sid surl stitle <<< "${VIDEOS[$(( i % ${#VIDEOS[@]} ))]}"
  i=$((i+1))
  echo "── $tag ← \"$stitle\""
  for band in "${BANDS[@]}"; do
    payload=$(python3 - "$GRID_KEY" "$tag" "$DATE" "$band" "$surl" "$stitle" "$sid" <<'PY'
import sys,json
key,screen,date,band,url,title,sid=sys.argv[1:8]
print(json.dumps({
  "key":key,"screen":screen,"date":date,"bandId":band,"slots":1,"status":"own",
  "advertiser":"XpaceOS demo","title":title,
  "creative":{"url":url,"type":"video","name":title,"stockId":sid}
}))
PY
)
    resp=$(curl -s -X POST "$API/grid/book" -H 'Content-Type: application/json' -d "$payload")
    echo "   $band → $resp"
  done
done
echo "✅ Hecho. Recarga xpaceos.com/admira-xp — los 4 paneles emitirán su parrilla por tag."
