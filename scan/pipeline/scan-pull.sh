#!/bin/bash
# XpaceScan · scan-pull.sh — baja una escena subida desde el móvil (scan.admira.store),
# la reconstruye con scan-to-splat.sh y sube el resultado con scan-push.sh.
# Cierra el círculo móvil → R2 → esta máquina → R2 → visor (misión yokup 1236).
# Uso:  ./scan-pull.sh <scene-id> [fps]      (id = el que enseña el móvil / el aviso del grupo)
#       ./scan-pull.sh --lista               (escenas pendientes en R2)
# Token: s:XPACESCAN_TOKEN en la bóveda (vault-get.sh); sin él no se pueden publicar resultados.
set -euo pipefail
API="${XPACESCAN_API:-https://scan.admira.store}"
HERE="$(cd "$(dirname "$0")" && pwd)"
UA="Mozilla/5.0 xpacescan-pull"
if [ "${1:-}" = "--lista" ]; then
  curl -fsS -m 20 -A "$UA" "$API/scenes" | python3 -c '
import sys,json
for s in json.load(sys.stdin)["scenes"]: print(f"{s[\"id\"]:40} {s[\"status\"]:11} {s[\"size\"]/1048576:7.1f} MB  {s.get(\"note\",\"\")[:40]}")'
  exit 0
fi
ID="${1:?Uso: scan-pull.sh <scene-id> [fps] | --lista}"; FPS="${2:-3}"
TOK="$(bash "$HOME/Claude/admira-vault/vault-get.sh" XPACESCAN_TOKEN 2>/dev/null || true)"
[ -n "$TOK" ] || { echo "sin XPACESCAN_TOKEN en la bóveda"; exit 1; }
MAQ="$(bash "$HOME/Claude/admira-vault/whoami.sh" 2>/dev/null || scutil --get ComputerName 2>/dev/null || hostname -s)"
status(){ curl -fsS -m 15 -A "$UA" -X POST -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d "{\"status\":\"$1\",\"note\":\"$2\",\"machine\":\"$MAQ\",\"progress\":${3:-0}}" "$API/scenes/$ID/status" >/dev/null || true; }
M="$(curl -fsS -m 20 -A "$UA" "$API/scenes/$ID")"
# El vídeo se baja por el MISMO host del API (no por la URL pública del manifiesto): si
# esta máquina no llega al dominio propio (IPv6/LaLiga) pero sí al respaldo, sigue funcionando.
VNAME="$(printf '%s' "$M" | python3 -c 'import sys,json; s=json.load(sys.stdin)["scene"]; print(s["video"]["name"])')"
VURL="$API/scenes/$ID/files/$VNAME"
NAME="$(printf '%s' "$M" | python3 -c 'import sys,json; print(json.load(sys.stdin)["scene"]["name"])')"
OUT="$HERE/../scenes/$ID"; mkdir -p "$OUT"
VIDEO="$OUT/video.${VURL##*.}"
echo "== XpaceScan pull · $ID («$NAME») → $MAQ"
status processing "descargando vídeo en $MAQ" 5
curl -fsS -m 900 -A "$UA" -o "$VIDEO" "$VURL"
echo "   vídeo: $(du -h "$VIDEO" | cut -f1)"
status processing "frames + COLMAP en $MAQ" 20
if ! "$HERE/scan-to-splat.sh" "$VIDEO" "$ID" "$FPS"; then
  status error "la reconstrucción falló en $MAQ (¿pocos frames / poco solape?)" 0; exit 1
fi
status processing "subiendo nube de puntos" 90
exec "$HERE/scan-push.sh" "$ID" "$OUT/points.ply"
