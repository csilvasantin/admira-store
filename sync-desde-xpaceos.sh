#!/usr/bin/env bash
# ============================================================================
# sync-desde-xpaceos.sh — ESPEJO PARCIAL de www.xpaceos.com en admira.store.
# ----------------------------------------------------------------------------
# Decisión de Carlos (21-oct-2026): admira.store y xpaceos.com son GEMELOS que se
# desarrollan en paralelo (desde el 7-oct cada repo tiene su trabajo propio:
# cápsulas, media, Altadis-18, realista, SneakerStore ampliado… sólo en el
# espejo). El antiguo espejo total (rsync --delete de todo) borraría ese trabajo,
# y el guardián validate-mirror-contract.mjs lo paraba desde el 14-oct. Desde hoy
# el espejado copia SOLO la portada y lo que la portada necesita, y NUNCA borra:
#
#   index.html                      la portada
#   assets/**                       los assets comunes (añade y actualiza; no borra)
#   lead-form.css, lead-form.js     el formulario de la portada
#   data/clientes-mapeo.json        el mapeo de clientes de la portada
#   favicon.ico
#
# Lo propio del espejo lo pone después sello-y-verja.py: sello, castellano,
# metadatos y la marca «admira.store» (también en assets/xpace-shell.js).
# El sello y las novedades del origen se adoptan (release-signature.json y
# novedades.json), conservando quién publica el espejo.
#
# Uso:  ./sync-desde-xpaceos.sh [ruta-al-clon-de-xpaceos]   (por defecto ../xpaceos)
#       SYNC_SHA=<commit> fija el commit del origen (la automatización pasa el
#       último despliegue de Pages completado). SYNC_DRY=1 enseña el plan y no copia.
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
if [ -n "${SYNC_SHA:-}" ]; then
  git -C "$ORIGEN" checkout -q "$SYNC_SHA"
else
  git -C "$ORIGEN" pull -q --ff-only || { echo "✗ El clon de xpaceos ha divergido: resuélvelo antes de espejar." >&2; exit 1; }
fi
ORIGEN_FULL_SHA="$(git -C "$ORIGEN" rev-parse HEAD)"
ORIGEN_SHA="${ORIGEN_FULL_SHA:0:7}"
echo "  origen en $ORIGEN_SHA"

# Copia limpia del origen (lo publicado, sin ficheros sueltos del clon).
ORIGEN_LIMPIO="$(mktemp -d)"
trap 'rm -rf "$ORIGEN_LIMPIO"' EXIT
git -C "$ORIGEN" archive HEAD | tar -x -C "$ORIGEN_LIMPIO"

# Lo que se espeja: la portada y lo que necesita. Nada más y nada se borra.
ESPEJO_FICHEROS=(index.html lead-form.css lead-form.js data/clientes-mapeo.json favicon.ico)
ESPEJO_CARPETAS=(assets)

echo "→ Plan del espejo parcial (origen $ORIGEN_SHA):"
for f in "${ESPEJO_FICHEROS[@]}"; do
  if [ -f "$ORIGEN_LIMPIO/$f" ]; then echo "  fichero  $f"; else echo "  (no está en el origen) $f"; fi
done
for d in "${ESPEJO_CARPETAS[@]}"; do
  [ -d "$ORIGEN_LIMPIO/$d" ] && echo "  carpeta  $d/ ($(find "$ORIGEN_LIMPIO/$d" -type f | wc -l | tr -d ' ') ficheros, sin borrar los del espejo)"
done
if [ "${SYNC_DRY:-}" = "1" ]; then echo "  (SYNC_DRY=1: no se copia nada)"; exit 0; fi

echo "→ Espejando la portada y sus assets…"
for f in "${ESPEJO_FICHEROS[@]}"; do
  [ -f "$ORIGEN_LIMPIO/$f" ] || continue
  mkdir -p "$(dirname "$f")"
  cp "$ORIGEN_LIMPIO/$f" "$f"
done
for d in "${ESPEJO_CARPETAS[@]}"; do
  [ -d "$ORIGEN_LIMPIO/$d" ] || continue
  rsync -a "$ORIGEN_LIMPIO/$d/" "./$d/"     # sin borrar: lo propio del espejo se queda
done

SELLO="$(sed -n 's/.*admiranext-version[^>]*content="\([^"]*\)".*/\1/p' "$ORIGEN_LIMPIO/index.html" | head -1)"
[ -n "$SELLO" ] || { echo "✗ El origen publicado no declara versión" >&2; exit 1; }

# Sello y novedades del origen, conservando quién publica el espejo.
SELLO="$SELLO" ORIGEN_LIMPIO="$ORIGEN_LIMPIO" python3 - <<'PYSELLO'
import json, os
from pathlib import Path
sello = os.environ['SELLO']; origen = Path(os.environ['ORIGEN_LIMPIO'])
firma = json.loads(Path('release-signature.json').read_text())
firma['version'] = sello
Path('release-signature.json').write_text(json.dumps(firma, ensure_ascii=False, indent=2) + '\n')
try:
    suyas = json.loads((origen / 'novedades.json').read_text())
    mias = json.loads(Path('novedades.json').read_text())
    nuevas = {k: v for k, v in suyas.items() if k != '_como' and k not in mias}
    if nuevas:   # las novedades del origen que faltan van arriba; el resto se queda como estaba
        como = mias.pop('_como', suyas.get('_como', ''))
        mias = {'_como': como, **nuevas, **mias}
        Path('novedades.json').write_text(json.dumps(mias, ensure_ascii=False, indent=2) + '\n')
except FileNotFoundError:
    pass
PYSELLO

SELLO="$SELLO" ORIGEN_SHA="$ORIGEN_SHA" python3 "$AQUI/sello-y-verja.py"
python3 install-live-presence.py
ORIGEN_FULL_SHA="$ORIGEN_FULL_SHA" SELLO="$SELLO" python3 - <<'PYVERSION'
import json,os
from datetime import datetime,timezone
from pathlib import Path
signature=json.loads(Path('release-signature.json').read_text())
version=os.environ['SELLO']; source=os.environ['ORIGEN_FULL_SHA']
assert signature['version']==version
out={**signature,'deployedAt':datetime.now(timezone.utc).isoformat(),'git':source,'gitFull':source,'gitShort':source[:7],'dirty':False,'mirrorOf':'https://www.xpaceos.com/','mirror':'parcial: portada y assets comunes','locale':'es'}
Path('version.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
PYVERSION
echo "→ Listo. Revisa con:  git status --short | head"
echo "   y publica con:     git push (Cloudflare Pages publica al llegar a main)"
