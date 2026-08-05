#!/usr/bin/env python3
"""Sella el espejo y le repone la verja. Lo llama sync-desde-xpaceos.sh.

Dos cosas que un `rsync` no puede hacer solo:

1. EL SELLO. Un espejo sin sello propio miente sobre cuándo se publicó: diría la
   fecha de xpaceos.com, no la de esta copia. Va en formato canónico de la
   norma 07 — v.DD.MM.AAAA.rN.HH:MM — y anota de qué commit del origen viene.

2. LA VERJA. xpaceos.com es PÚBLICA y su index.html no carga `gate.js`, así que
   espejar sin más le quitaba el control de acceso a admira.store sin que nadie
   lo hubiera decidido. Aflojar una verja es una decisión de Carlos, no el
   efecto secundario de una copia. Si algún día admira.store debe ser pública,
   se quita de aquí a conciencia — y así no se pierde de vista.
"""
import os
import re
import sys

SELLO = os.environ["SELLO"]
ORIGEN_SHA = os.environ["ORIGEN_SHA"]
DESTINO = "index.html"

s = open(DESTINO, encoding="utf-8").read()

# — limpieza de lo que puso el espejado anterior, para no acumular capas —
s = re.sub(r'[ \t]*<meta name="admiranext-version"[^>]*>\n?', "", s)
s = re.sub(r'[ \t]*<!-- Espejo de www\.xpaceos\.com[\s\S]*?-->\n?', "", s)
s = re.sub(r'[ \t]*<!-- Verja de acceso[\s\S]*?-->\n?', "", s)

ancla = (re.search(r'[ \t]*<meta name="viewport"[^>]*>\n', s)
         or re.search(r'[ \t]*<meta charset[^>]*>\n', s))
if not ancla:
    sys.exit("✗ No hay dónde anclar el sello en index.html")

bloque = (
    f'  <meta name="admiranext-version" content="AdmiraNeXT {SELLO}"/>\n'
    f'  <!-- Espejo de www.xpaceos.com ({ORIGEN_SHA}), sincronizado con\n'
    f'       sync-desde-xpaceos.sh. No editar a mano: el siguiente espejado lo pisa. -->\n'
)
if "gate.js" not in s:
    bloque += (
        '  <!-- Verja de acceso de admira.studio/store/app. La repone el espejado\n'
        '       en cada pasada: el origen (xpaceos.com) es público y no la lleva. -->\n'
        '  <script src="/gate.js"></script>\n'
    )
    verja = "repuesta"
else:
    verja = "ya estaba"

s = s[:ancla.end()] + bloque + s[ancla.end():]
open(DESTINO, "w", encoding="utf-8").write(s)
print(f"  sello {SELLO} · espejo de xpaceos@{ORIGEN_SHA} · verja {verja}")
