#!/bin/bash
# XpaceScan · scan-push.sh — publica resultados de una escena en R2 y la marca LISTA.
# Uso:  ./scan-push.sh <scene-id> <fichero> [fichero…]     (.ply nube · .splat/.ksplat 3DGS · .json nodos)
# El primero de la lista queda como fichero principal del visor (?scene=<id> lo carga solo).
set -euo pipefail
API="${XPACESCAN_API:-https://scan.admira.store}"; UA="Mozilla/5.0 xpacescan-push"
ID="${1:?Uso: scan-push.sh <scene-id> <fichero> [fichero…]}"; shift
[ $# -ge 1 ] || { echo "falta el fichero de resultado"; exit 1; }
TOK="$(bash "$HOME/Claude/admira-vault/vault-get.sh" XPACESCAN_TOKEN 2>/dev/null || true)"
[ -n "$TOK" ] || { echo "sin XPACESCAN_TOKEN en la bóveda"; exit 1; }
MAQ="$(bash "$HOME/Claude/admira-vault/whoami.sh" 2>/dev/null || scutil --get ComputerName 2>/dev/null || hostname -s)"
PRIMARY="$(basename "$1")"; NODES=""
for f in "$@"; do
  n="$(basename "$f")"; sz=$(stat -f%z "$f")
  [ "$sz" -le 99614720 ] || { echo "$n pesa $((sz/1048576)) MB > 95 MB: comprímelo (ksplat) antes"; exit 1; }
  echo "→ $n ($((sz/1048576)) MB)"
  curl -fsS -m 900 -A "$UA" -X PUT -H "Authorization: Bearer $TOK" --data-binary @"$f" "$API/scenes/$ID/files/$n" >/dev/null
  case "$n" in *.json) NODES="$(cat "$f")";; esac
done
python3 - "$API" "$ID" "$TOK" "$MAQ" "$PRIMARY" "$NODES" <<'PY'
import sys,json,urllib.request
api,i,tok,maq,primary,nodes=sys.argv[1:7]
body={"machine":maq,"primary":primary,"note":f"reconstruido en {maq}"}
if nodes:
    try: body["nodes"]=json.loads(nodes)
    except Exception: pass
req=urllib.request.Request(f"{api}/scenes/{i}/ready",data=json.dumps(body).encode(),method="POST",
  headers={"Content-Type":"application/json","Authorization":f"Bearer {tok}","User-Agent":"Mozilla/5.0 xpacescan-push"})
d=json.load(urllib.request.urlopen(req,timeout=30))["scene"]
print("== LISTA ==", d["status"], "·", d["visor"])
PY
