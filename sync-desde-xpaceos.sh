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
# La automatización fija SYNC_SHA al último despliegue Pages completado.
# SYNC_BEFORE se conserva sólo para reconstrucciones históricas explícitas.
if [ -n "${SYNC_SHA:-}" ]; then
  git -C "$ORIGEN" checkout -q "$SYNC_SHA"
elif [ -n "${SYNC_BEFORE:-}" ]; then
  OLD="$(git -C "$ORIGEN" rev-list -n 1 --before="$SYNC_BEFORE" origin/main)"
  [ -n "$OLD" ] || { echo "✗ no hay commit de xpaceos anterior a «$SYNC_BEFORE»" >&2; exit 1; }
  git -C "$ORIGEN" checkout -q "$OLD"
else
  git -C "$ORIGEN" pull -q --ff-only || { echo "✗ El clon de xpaceos ha divergido: resuélvelo antes de espejar." >&2; exit 1; }
fi
ORIGEN_FULL_SHA="$(git -C "$ORIGEN" rev-parse HEAD)"
ORIGEN_SHA="${ORIGEN_FULL_SHA:0:7}"
echo "  origen en $ORIGEN_SHA${SYNC_BEFORE:+ (antes de $SYNC_BEFORE)}"

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
  --exclude '.github/' \
  --exclude 'CNAME' \
  --exclude 'gate.js' \
  --exclude 'deploy.sh' \
  --exclude 'sync-desde-xpaceos.sh' \
  --exclude 'sello-y-verja.py' \
  --exclude '.gitignore' \
  --exclude 'functions/_live-presence.js' \
  --exclude 'install-live-presence.py' \
  --exclude 'docs/live-analytics.md' \
  --exclude 'tests/' \
  "$ORIGEN_LIMPIO"/ ./

# La portada de admira.store ES la portada de xpaceos.com, en castellano (Carlos,
# 5-sep-2026: «xpaceos.com y su gemelo digital en castellano que es admira.store»).
# Hasta hoy este paso promovía la experiencia NVIDIA en inglés a la raíz; sigue
# viva en /nvidia/, pero la raíz vuelve a ser el gemelo. El castellano lo fija
# sello-y-verja.py sobre el index.html recién espejado.

# Sello canónico (norma 07) + reposición de la verja, en un solo paso.
SELLO="$(sed -n 's/.*admiranext-version[^>]*content="\([^"]*\)".*/\1/p' "$ORIGEN_LIMPIO/index.html" | head -1)"
[ -n "$SELLO" ] || { echo "✗ El origen publicado no declara versión" >&2; exit 1; }
SELLO="$SELLO" ORIGEN_SHA="$ORIGEN_SHA" python3 "$AQUI/sello-y-verja.py"

python3 install-live-presence.py

# El repo original genera version.json al desplegar; git archive no incluye ese
# archivo generado. Firmar el espejo con la misma release y el commit fuente.
ORIGEN_FULL_SHA="$ORIGEN_FULL_SHA" SELLO="$SELLO" python3 - <<'PYVERSION'
import json,os
from datetime import datetime,timezone
from pathlib import Path
signature=json.loads(Path('release-signature.json').read_text())
version=os.environ['SELLO']; source=os.environ['ORIGEN_FULL_SHA']
assert signature['version']==version
out={**signature,'deployedAt':datetime.now(timezone.utc).isoformat(),'git':source,'gitFull':source,'gitShort':source[:7],'dirty':False,'mirrorOf':'https://www.xpaceos.com/','locale':'es'}
Path('version.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
PYVERSION

echo "→ Listo. Revisa con:  git status --short | head"
echo "   y publica con:     ./deploy.sh"
