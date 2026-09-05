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
# — el castellano (Carlos, 5-sep-2026): admira.store es el gemelo EN CASTELLANO de
#   xpaceos.com. El origen arranca en inglés (Shoptalk) y guarda el idioma elegido en
#   localStorage; aquí el HTML ya sale en castellano (html lang, título, descripción
#   del diccionario I18N.es) y el arranque por defecto es 'es'. Quien elija inglés en
#   admira.store lo conserva, igual que en el origen.
s = re.sub(r'<html lang="en">', '<html lang="es">', s, count=1)
s = s.replace("applyLanguage(localStorage.getItem('xpaceosLang') || 'en');", "applyLanguage(localStorage.getItem('xpaceosLang') || 'es');")
s = re.sub(r"applyLanguage\('en'\);", "applyLanguage('es');", s)
es_block = re.search(r"\n\s*es:\s*\{(.*?)\n\s*\}", s, re.S)
titulo = descripcion = None
if es_block:
    t = re.search(r"\btitle:\s*(['\"`])(.*?)\1\s*,", es_block.group(1))
    d = re.search(r"\bdescription:\s*(['\"`])(.*?)\1\s*,", es_block.group(1))
    if t:
        titulo = t.group(2).replace("\\'", "'")
        s = re.sub(r'<title>[^<]*</title>', lambda m: '<title>' + titulo + '</title>', s, count=1)
    if d:
        descripcion = d.group(2).replace("\\'", "'").replace('"', '&quot;')
        s = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + descripcion + m.group(2), s, count=1)
        s = re.sub(r'(<meta property="og:description" content=")[^"]*(")', lambda m: m.group(1) + descripcion + m.group(2), s, count=1)
    if titulo:
        s = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + titulo.replace('"', '&quot;') + m.group(2), s, count=1)
s = re.sub(r'(<meta property="og:locale" content=")[^"]+(")', r'\1es_ES\2', s, count=1)
s = re.sub(r'<link rel="canonical" href="[^"]+">', '<link rel="canonical" href="https://www.admira.store/">', s, count=1)
s = re.sub(r'(<meta property="og:url" content=")[^"]+(")', r'\1https://www.admira.store/\2', s, count=1)
castellano = "html lang=es · título ES" if titulo else "html lang=es · título sin diccionario"
open(DESTINO, "w", encoding="utf-8").write(s)
print(f"  sello {SELLO} · espejo de xpaceos@{ORIGEN_SHA} · verja {verja} · {castellano}")
