#!/usr/bin/env bash
# cloudflare-grandes.sh <paquete> — Cloudflare Pages no admite archivos de más de 25 MiB.
# Quita del paquete cualquier archivo que pase de ese tamaño y añade a <paquete>/_redirects un 302
# a la copia de XpaceOS (origen del espejo). Así un maestro pesado nuevo (.blend, GLB HD…) ya no
# rompe el despliegue de admira.store ni hay que listarlo a mano (08-10-2026, tras la pieza 47).
#
# Destino, en este orden, y sólo si responde 200 con el mismo tamaño que el archivo local:
#   1. raw.githubusercontent.com/<xpaceos>/<commit espejado>/<ruta>  (copia fija; version.json.mirrorOf)
#   2. https://www.xpaceos.com/<ruta>                                   (GitHub Pages, admite hasta 100 MB)
#   3. raw.githubusercontent.com/<admira-store>/<este commit>/<ruta>    (archivo propio de la tienda)
# Nunca apunta a admira.store ni a admira-store.pages.dev: sin bucles de redirección.
# Si ninguno se puede comprobar (sin red), usa www.xpaceos.com y avisa; el despliegue sigue.
# Vive en .github/ porque el espejo nocturno (sync-desde-xpaceos.sh) no toca esa carpeta.
set -euo pipefail
SITE="${1:?uso: cloudflare-grandes.sh <dir-del-paquete> [commit-de-la-tienda]}"
STORE_SHA="${2:-$(git rev-parse HEAD 2>/dev/null || true)}"
LIMIT=$((25 * 1024 * 1024))
XP_REPO="${XPACEOS_REPO:-csilvasantin/xpaceos}"
STORE_REPO="${STORE_REPO:-csilvasantin/admira-store}"
XP_SHA="$(jq -r 'if .mirrorOf then (.gitFull // .git // "") else "" end' version.json 2>/dev/null || true)"
[[ "$XP_SHA" =~ ^[0-9a-f]{40}$ ]] || XP_SHA=""

check() {  # check <url> <bytes> → 0 si llega a un 200 con ese tamaño fuera de los dominios de la tienda
  local out code len eff
  out="$(curl -sSIL --max-redirs 3 --max-time 20 -o /dev/stderr -w '%{http_code} %{url_effective}' "$1" 2>/tmp/cf-grandes-h.$$)" || { rm -f /tmp/cf-grandes-h.$$; return 1; }
  code="${out%% *}"; eff="${out#* }"
  len="$(tr -d '\r' </tmp/cf-grandes-h.$$ | awk 'tolower($1)=="content-length:"{v=$2} END{print v}')"; rm -f /tmp/cf-grandes-h.$$
  case "$eff" in *admira.store/*|*admira-store.pages.dev/*) return 1;; esac
  [ "$code" = 200 ] && { [ -z "$len" ] || [ "$len" = "$2" ]; }
}

n=0
while IFS= read -r -d '' big; do
  rel="${big#"$SITE"}"; rel="/${rel#/}"; enc="${rel// /%20}"; bytes="$(wc -c <"$big" | tr -d ' ')"
  [ "$bytes" -gt "$LIMIT" ] || continue
  cands=()
  [ -n "$XP_SHA" ] && cands+=("https://raw.githubusercontent.com/$XP_REPO/$XP_SHA$enc")
  cands+=("https://www.xpaceos.com$enc")
  [ -n "$STORE_SHA" ] && cands+=("https://raw.githubusercontent.com/$STORE_REPO/$STORE_SHA$enc")
  dest=""
  for c in "${cands[@]}"; do if check "$c" "$bytes"; then dest="$c"; break; fi; done
  if [ -z "$dest" ]; then dest="https://www.xpaceos.com$enc"; echo "⚠ sin comprobar (se publica igual): $rel → $dest"; fi
  rm -f "$big"
  # Las reglas generadas van primero: Cloudflare aplica la primera que coincide.
  printf '%s %s 302\n' "$enc" "$dest" >>"$SITE/_redirects.grandes"
  echo "más de 25 MiB → 302: $rel → $dest"; n=$((n + 1))
done < <(find "$SITE" -type f -size +25M -print0)
if [ -s "$SITE/_redirects.grandes" ]; then
  { cat "$SITE/_redirects.grandes"; [ -f "$SITE/_redirects" ] && cat "$SITE/_redirects"; } >"$SITE/_redirects.nuevo"
  mv "$SITE/_redirects.nuevo" "$SITE/_redirects"
fi
rm -f "$SITE/_redirects.grandes"
echo "✓ archivos de más de 25 MiB fuera del paquete: $n"
