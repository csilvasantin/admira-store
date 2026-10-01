#!/usr/bin/env bash
# ============================================================================
# google-redirects.sh — ¿tiene Google registradas las direcciones de vuelta del
# login? Lo comprueba SIN iniciar sesión.
#
# POR QUÉ: dos veces (la última, 1-oct-2026 con el perímetro de xpaceos.com y
# admira.store) se publicó un login de Google en un host nuevo y Carlos se
# encontró «Error 400: redirect_uri_mismatch» al pulsar el botón. El botón se
# pinta igual con el origen sin registrar: el fallo solo aparece al entrar.
# Google responde redirect_uri_mismatch en la propia URL de autorización, así
# que se puede preguntar antes de publicar.
#
#   google-redirects.sh                         todas las de la flota
#   google-redirects.sh https://host/auth/callback [...]   solo esas
# Sale 1 si falta alguna. Para arreglarlo: consola de Google Cloud, proyecto
# admira-app, cliente «admira.live gate» → URIs de redireccionamiento (y el
# origen https://host en «Orígenes autorizados de JavaScript»).
# ============================================================================
set -uo pipefail
CLIENT_ID="${GOOGLE_CLIENT_ID:-861856772040-e1ri6kpu6maagtb6crdfbb923hsaalgb.apps.googleusercontent.com}"
FLOTA=(
  https://www.pixeria.com/auth/callback
  https://www.yokup.com/auth/callback
  https://www.admira.live/auth/callback
  https://admira.tv/auth/callback
  https://www.admira.studio/auth/callback
  https://www.xpaceos.com/auth/callback
  https://www.admira.store/auth/callback
  https://xpaceos.pages.dev/auth/callback
  https://admira-store.pages.dev/auth/callback
)
[ $# -gt 0 ] && FLOTA=("$@")
falta=0
for uri in "${FLOTA[@]}"; do
  enc="$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$uri")"
  html="$(curl -s -L --max-time 20 -A 'Mozilla/5.0' "https://accounts.google.com/o/oauth2/v2/auth?client_id=$CLIENT_ID&redirect_uri=$enc&response_type=id_token&scope=openid&nonce=comprobacion")"
  if [ -z "$html" ]; then echo "?      $uri  (Google no respondió)"; falta=1
  elif printf '%s' "$html" | grep -qi 'redirect_uri_mismatch'; then echo "FALTA  $uri"; falta=1
  else echo "ok     $uri"; fi
done
[ $falta -eq 0 ] || echo "→ Regístralas en Google Cloud (admira-app · «admira.live gate») antes de publicar."
exit $falta
