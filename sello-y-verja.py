#!/usr/bin/env python3
"""Sella el espejo y le retira la verja. Lo llama sync-desde-xpaceos.sh.

Dos cosas que un `rsync` no puede hacer solo:

1. EL SELLO. Un espejo sin sello propio miente sobre cuándo se publicó: diría la
   fecha de xpaceos.com, no la de esta copia. Va en formato canónico de la
   norma 07 — v.DD.MM.AAAA.rN.HH:MM — y anota de qué commit del origen viene.

2. LA VERJA — RETIRADA POR DECISIÓN DE CARLOS (2026-08-05). admira.store es
   ahora PÚBLICA, como el xpaceos.com que refleja: si el dominio existe para
   que alguien lo teclee y vea XpaceOS, una pantalla de acceso lo contradice.
   El primer espejado se la quitó sin querer y se repuso a propósito, para que
   aflojar un control de acceso fuera una decisión y no un descuido; tomada la
   decisión, esta función se asegura de que NO vuelva en cada sincronización.
   `gate.js` se conserva en el repo: revertir es volver a poner una línea.
   admira.studio y admira.app mantienen su verja — esto es sólo admira.store.
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

# La verja se RETIRA, no se repone: decisión de Carlos del 2026-08-05. Se borra
# también cualquier resto de espejados anteriores, para que una copia vieja no
# la reintroduzca en silencio.
antes = "gate.js" in s
s = re.sub(r'[ \t]*<script[^>]*src="/gate\.js"[^>]*>\s*</script>\n?', "", s)
verja = "retirada" if antes else "sin verja (pública)"

# El ancla se busca DESPUÉS de retirar la verja: calcularla antes dejaba
# offsets apuntando a un texto que ya había cambiado.
ancla = (re.search(r'[ \t]*<meta name="viewport"[^>]*>\n', s)
         or re.search(r'[ \t]*<meta charset[^>]*>\n', s))
if not ancla:
    sys.exit("✗ No hay dónde anclar el sello en index.html")

bloque = (
    f'  <meta name="admiranext-version" content="{SELLO}"/>\n'
    f'  <!-- Espejo de www.xpaceos.com ({ORIGEN_SHA}), sincronizado con\n'
    f'       sync-desde-xpaceos.sh. No editar a mano: el siguiente espejado lo pisa. -->\n'
)
s = s[:ancla.end()] + bloque + s[ancla.end():]
open(DESTINO, "w", encoding="utf-8").write(s)
print(f"  sello {SELLO} · espejo de xpaceos@{ORIGEN_SHA} · verja {verja}")
