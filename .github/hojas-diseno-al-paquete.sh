#!/usr/bin/env bash
# hojas-diseno-al-paquete.sh <_site> — Hojas del sistema de diseño dentro del paquete (Carlos, 23-oct-2026).
# ---------------------------------------------------------------------------
# tokens.css y nav.css (4,5 KB cada una) viven en el repo admira-design y se servían desde
# www.carlossilva.info (GitHub Pages). Como bloquean la pintura, cada visita en frío pagaba una
# conexión y un TTFB más antes del primer pintado (Lighthouse). En cada despliegue se copian al
# paquete y los dos <link> de la portada pasan a locales, con la huella del contenido en ?v=.
# El origen sigue siendo uno: el repo admira-design; aquí no se edita nada a mano.
# Si el origen no responde, el paquete sale como estaba (hojas remotas) y se avisa: nunca se
# publica una portada sin hojas.
set -uo pipefail
SITE="${1:?uso: hojas-diseno-al-paquete.sh <_site>}"
ORIGEN="${HOJAS_ORIGEN:-https://www.carlossilva.info/admira-design}"
PORTADA="$SITE/index.html"
[ -f "$PORTADA" ] || { echo "✗ no hay $PORTADA" >&2; exit 1; }
DEST="$SITE/assets/admira-design"
mkdir -p "$DEST"
for f in tokens.css nav.css; do
  if curl -fsSL --retry 3 --max-time 20 "$ORIGEN/$f" -o "$DEST/$f" && [ -s "$DEST/$f" ] && grep -q '{' "$DEST/$f"; then
    v="$(shasum "$DEST/$f" | cut -c1-8)"
    sed -i.bak "s#https://www\.carlossilva\.info/admira-design/$f\"#/assets/admira-design/$f?v=$v\"#g" "$PORTADA" && rm -f "$PORTADA.bak"
    echo "· $f copiada al paquete ($(wc -c < "$DEST/$f" | tr -d ' ') B, v=$v)"
  else
    rm -f "$DEST/$f"
    echo "⚠ $f no se pudo traer de $ORIGEN: la portada sale con la hoja remota" >&2
  fi
done
# Si las dos hojas quedaron locales, el preconnect al origen sobra.
if ! grep -q 'carlossilva\.info/admira-design' "$PORTADA"; then
  sed -i.bak '/rel="preconnect" href="https:\/\/www\.carlossilva\.info"/d' "$PORTADA" && rm -f "$PORTADA.bak"
fi
echo "· hojas en la portada: $(grep -o 'href="[^"]*admira-design/[^"]*"' "$PORTADA" | tr '\n' ' ')"
