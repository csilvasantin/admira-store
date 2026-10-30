#!/usr/bin/env bash
# quitar-internos.sh <paquete> — Lo interno del repo no se publica (Carlos, 30-oct-2026).
# ---------------------------------------------------------------------------
# El login solo protege páginas: un .md, .sh o .py del paquete se descarga sin sesión. Los assets
# tienen que seguir así porque los usan players, decks y agentes, de modo que lo interno se queda
# fuera del paquete. Se quitan instrucciones de agentes, handoffs, scripts de mantenimiento, fuentes
# de Blender, tests y configuración de workers. Vive en .github/ porque el espejo no toca esa carpeta.
# El perímetro niega lo mismo (isInternalPath en functions/_perimetro.js): Pages conserva hasta 7 días las
# copias de despliegues anteriores. tests/paquete-sin-internos.test.mjs obliga a que las dos reglas coincidan.
#
# Se conserva lo que la web enlaza: la documentación pública (admira-xp/docs/), la del MCP (mcp/),
# admira-xp/scripts/best-production.md (lo cita mcp/funcionalidades.json) y las licencias de los
# modelos, que tienen que viajar con ellos.
set -euo pipefail
cd "${1:?uso: quitar-internos.sh <dir-del-paquete>}"
[ -f index.html ] || { echo "✗ $PWD no parece un paquete: falta index.html" >&2; exit 1; }

# Carpetas enteras
rm -rf .claude .github docs scripts scan/worker tests admira-xp/docs/handoffs
find . -type d -name .wrangler -prune -exec rm -rf {} +

# Por tipo, en cualquier carpeta
find . -type f \( \
  -name '*.sh' -o -name '*.py' -o -name '*.test.mjs' -o -name '*.test.js' -o -name '*.test.py' -o \
  -name 'wrangler.toml' -o -name '.gitignore' -o -name '.gitattributes' -o -name '.gitkeep' -o -name '.nojekyll' \
\) -delete

# Markdown: solo lo que la web enlaza
find . -type f -name '*.md' \
  ! -path './admira-xp/docs/*' \
  ! -path './mcp/*' \
  ! -path './admira-xp/scripts/best-production.md' \
  ! -iname 'LICENSE*' \
  -delete

echo "✓ internos fuera del paquete"
