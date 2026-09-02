#!/usr/bin/env bash
# ============================================================================
# sync-desde-xpaceos.sh — admira.store es un ESPEJO de www.xpaceos.com.
# ----------------------------------------------------------------------------
# Por qué un espejo y no un gemelo: los dos dominios se sirven por GITHUB PAGES
# (admira.store responde `server: GitHub.com`, aunque el deploy.sh de al lado
# diga que el origen es Cloudflare — no lo es; lo que llega a producción es su
# `git push`). GitHub Pages sólo admite UN dominio por repositorio, así que
# «mismo origen, dos dominios» no es posible aquí. El gemelo de verdad exige
# mover xpaceos.com a Cloudflare Pages, como ya se hizo con clearchannel.tv y
# admira.app. Mientras tanto, esto: copia fiel y reproducible.
#
# Uso:  ./sync-desde-xpaceos.sh [ruta-al-clon-de-xpaceos]     (por defecto ../xpaceos)
#
# NO se toca xpaceos.com en ningún momento: sólo se lee.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"
ORIGEN="${1:-../xpaceos}"
AQUI="$(pwd)"

[ -d "$ORIGEN/.git" ] || { echo "✗ No encuentro un clon de xpaceos en $ORIGEN" >&2; exit 1; }

echo "→ Actualizando el origen ($ORIGEN)…"
git -C "$ORIGEN" fetch -q origin
git -C "$ORIGEN" pull -q --ff-only || { echo "✗ El clon de xpaceos ha divergido: resuélvelo antes de espejar." >&2; exit 1; }
ORIGEN_SHA="$(git -C "$ORIGEN" rev-parse --short HEAD)"
echo "  origen en $ORIGEN_SHA"

# El espejo se construye desde el commit, no desde el working tree del clon.
# Así una captura de QA o cualquier otro fichero local sin commitear nunca puede
# colarse accidentalmente en admira.store.
ORIGEN_LIMPIO="$(mktemp -d)"
trap 'rm -rf "$ORIGEN_LIMPIO"' EXIT
git -C "$ORIGEN" archive HEAD | tar -x -C "$ORIGEN_LIMPIO"

# Lo PROPIO de admira.store, que el espejo no puede pisar:
#  · CNAME     — o el dominio se lo queda xpaceos.com y esta web se cae
#  · gate.js   — la verja de acceso de admira.studio/store/app
#  · deploy.sh y este script — herramientas del repo, no contenido
echo "→ Espejando contenido…"
rsync -a --delete \
  --exclude '.git/' \
  --exclude 'CNAME' \
  --exclude 'gate.js' \
  --exclude 'deploy.sh' \
  --exclude 'sync-desde-xpaceos.sh' \
  --exclude 'sello-y-verja.py' \
  --exclude '.gitignore' \
  "$ORIGEN_LIMPIO"/ ./

# Carlos decidió que la portada de admira.store sea la misma experiencia que
# xpaceos.com/nvidia. Conservamos todos los assets del espejo y promovemos el
# entrypoint NVIDIA a la raíz, con metadatos del dominio que realmente se sirve.
cp nvidia/index.html index.html
sed -i.bak \
  -e 's#https://www\.xpaceos\.com/nvidia/#https://www.admira.store/#g' \
  -e 's#https://www\.xpaceos\.com/assets/#https://www.admira.store/assets/#g' \
  index.html
rm index.html.bak

# Sello canónico (norma 07) + reposición de la verja, en un solo paso.
SELLO="v.$(date +%d.%m.%Y).r1.$(date +%H:%M)"
SELLO="$SELLO" ORIGEN_SHA="$ORIGEN_SHA" python3 "$AQUI/sello-y-verja.py"

echo "→ Listo. Revisa con:  git status --short | head"
echo "   y publica con:     ./deploy.sh"
