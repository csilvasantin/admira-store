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


def parse_js_object(block):
    """Lee pares clave: 'valor' de un objeto JS (I18N.es). Los valores pueden
    llevar HTML con comillas dobles; las simples van escapadas."""
    out = {}
    i, n = 0, len(block)
    while i < n:
        while i < n and block[i] in " \t\n\r,":
            i += 1
        if i >= n:
            break
        if block[i] in "'\"":
            q = block[i]
            i += 1
            key = []
            while i < n and block[i] != q:
                if block[i] == "\\" and i + 1 < n:
                    key.append(block[i + 1])
                    i += 2
                    continue
                key.append(block[i])
                i += 1
            key = "".join(key)
            i += 1
        else:
            m = re.match(r"[\w.]+", block[i:])
            if not m:
                i += 1
                continue
            key = m.group(0)
            i += m.end()
        while i < n and block[i] in " \t":
            i += 1
        if i >= n or block[i] != ":":
            continue
        i += 1
        while i < n and block[i] in " \t":
            i += 1
        if i >= n or block[i] not in "'\"`":
            continue
        q = block[i]
        i += 1
        val = []
        while i < n:
            if block[i] == "\\" and i + 1 < n:
                nxt = block[i + 1]
                val.append({"n": "\n", "t": "\t", "'": "'", '"': '"', "\\": "\\", "`": "`"}.get(nxt, nxt))
                i += 2
                continue
            if block[i] == q:
                i += 1
                break
            val.append(block[i])
            i += 1
        out[key] = "".join(val)
    return out


def bake_i18n(html, es, attr, html_inner):
    """Sustituye el interior de cada nodo con data-i18n / data-i18n-html."""
    n = 0

    def repl(m):
        nonlocal n
        key = m.group("key")
        if key not in es:
            return m.group(0)
        n += 1
        return m.group("open") + es[key] + m.group("close")

    if html_inner:
        pat = re.compile(
            r'(?P<open><(?P<tag>[a-zA-Z0-9]+)(?P<pre>[^>]*?)\s' + attr + r'="(?P<key>[^"]+)"(?P<post>[^>]*)>)'
            r'(?P<body>.*?)'
            r'(?P<close></(?P=tag)>)',
            re.S,
        )
    else:
        pat = re.compile(
            r'(?P<open><(?P<tag>[a-zA-Z0-9]+)(?P<pre>[^>]*?)\s' + attr + r'="(?P<key>[^"]+)"(?P<post>[^>]*)>)'
            r'(?P<body>[^<]*)'
            r'(?P<close></(?P=tag)>)',
            re.S,
        )
    return pat.sub(repl, html), n


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
if titulo:
    s = re.sub(r'(<meta name="twitter:title" content=")[^"]*(")', lambda m: m.group(1) + titulo.replace('"', '&quot;') + m.group(2), s, count=1)
    s = re.sub(r'(<meta property="og:image:alt" content=")[^"]*(")', lambda m: m.group(1) + titulo.replace('"', '&quot;') + m.group(2), s, count=1)
if descripcion:
    s = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")', lambda m: m.group(1) + descripcion + m.group(2), s, count=1)

# Hornear I18N.es en el HTML visible (DEC-0508 / FLT-1729). Sin esto el crawler,
# el primer paint y quien tenga JS apagado siguen viendo el inglés de xpaceos.com.
horneados = 0
es_dict = parse_js_object(es_block.group(1)) if es_block else {}
if es_dict:
    s, n_txt = bake_i18n(s, es_dict, "data-i18n", html_inner=False)
    s, n_html = bake_i18n(s, es_dict, "data-i18n-html", html_inner=True)
    horneados = n_txt + n_html

castellano = (
    f"html lang=es · título ES · {horneados} nodos horneados"
    if titulo else "html lang=es · título sin diccionario"
)
# — LA MARCA (Carlos, 21-oct-2026): admira.store tiene que decir «admira.store» en el título, la
#   cabecera, el pie y la tarjeta «estás aquí». xpaceos.com no se toca: la marca se cambia aquí,
#   en el espejo, después de cada sincronización. Si el origen cambia y un ancla deja de estar,
#   el espejado PARA (sys.exit) en vez de publicar un espejo a medias.
MARCA = "admira.store"
TITULO_STORE = "admira.store · El sistema operativo del comercio físico"
WORDMARK = '<span class="store-wordmark" aria-hidden="true">admira<b>.store</b></span>'


def exige(texto, viejo, nuevo, donde, veces=1):
    """Sustituye `viejo` por `nuevo` exigiendo que esté `veces` veces; si ya está `nuevo` (segunda pasada
    sin sincronizar), no toca nada. Cualquier otra cosa para el espejado."""
    n = texto.count(viejo)
    if n == 0 and nuevo in texto:
        return texto
    if n != veces:
        sys.exit(f"✗ Marca admira.store: esperaba {veces} vez/veces «{viejo[:60]}» en {donde} y hay {n}")
    return texto.replace(viejo, nuevo)


# Título y metadatos
s = re.sub(r'<title>[^<]*</title>', '<title>' + TITULO_STORE + '</title>', s, count=1)
for meta in ('og:title', 'twitter:title', 'og:image:alt'):
    s = re.sub(r'(<meta (?:property|name)="' + re.escape(meta) + r'" content=")[^"]*(")', lambda m: m.group(1) + TITULO_STORE + m.group(2), s, count=1)
s = re.sub(r'(<meta property="og:site_name" content=")[^"]*(")', r'\g<1>' + MARCA + r'\2', s, count=1)
# El título que de verdad se ve lo pone applyLanguage() desde el diccionario I18N (title: en es y en en):
# se cambia en los dos bloques; si no están, el espejado para.
TITULO_STORE_EN = "admira.store · The operating system of physical retail"
def titulo_del_bloque(texto, idioma, nuevo):
    patron = re.compile(r"(\n\s*" + idioma + r":\s*\{[^\n]*\n(?:(?!\n\s*(?:es|en):\s*\{).)*?\btitle:\s*')[^']*(')", re.S)
    texto, n = patron.subn(lambda m: m.group(1) + nuevo + m.group(2), texto, count=1)
    if n != 1:
        sys.exit(f"✗ Marca admira.store: no encuentro title: en el bloque I18N «{idioma}»")
    return texto
s = titulo_del_bloque(s, "es", TITULO_STORE)
s = titulo_del_bloque(s, "en", TITULO_STORE_EN)
# Cabecera propia (la que se ve antes de que cargue el shell y sin JS) y pie: la palabra en vez del logo de XpaceOS
s = exige(s, '<a class="brand-logo" href="#top" aria-label="XpaceOS">\n      <img src="/assets/xpaceos-logo-transparent.webp" alt="XpaceOS">\n    </a>',
          '<a class="brand-logo" href="#top" aria-label="' + MARCA + '">' + WORDMARK + '</a>', "la cabecera")
s = exige(s, '<a class="footer-logo" href="#top" aria-label="XpaceOS"><img src="/assets/xpaceos-logo-transparent.webp" alt="XpaceOS"></a>',
          '<a class="footer-logo" href="#top" aria-label="' + MARCA + '">' + WORDMARK + '</a>', "el pie")
s = exige(s, '<span>© 2026 ADmiraNeXT · XpaceOS</span>', '<span>© 2026 ADmiraNeXT · ' + MARCA + '</span>', "el pie")
# Tarjeta «estás aquí» (capa C de la suite): aquí estás en admira.store
s = exige(s, '<h3>admira.live</h3>\n        <div class="who dom"><span class="lbl" data-i18n="platform.brand">marca</span> · <a href="https://www.xpaceos.com" target="_blank" rel="noopener">XpaceOS.com</a></div>',
          '<h3>' + MARCA + '</h3>\n        <div class="who dom"><span class="lbl" data-i18n="platform.brand">marca</span> · <a href="https://www.admira.store/">' + MARCA + '</a></div>', "la tarjeta «estás aquí»")
s = exige(s, '<a class="more" href="https://admira.live/" target="_blank" rel="noopener">→ admira.live</a>', '<a class="more" href="https://www.admira.store/">→ ' + MARCA + '</a>', "la tarjeta «estás aquí»")
# El logo de XpaceOS ya no se usa en el espejo: su preload sobra (Chrome avisa en la consola en cada carga).
s = re.sub(r'[ \t]*<link rel="preload" as="image" href="/assets/xpaceos-logo-transparent\.webp"[^>]*>\n?', '', s, count=1)
# Estilo de la palabra (misma familia que el shell cuadrático)
s = exige(s, '.brand-logo img{display:block;width:100%;height:auto}',
          '.brand-logo img{display:block;width:100%;height:auto}\n  .store-wordmark{font:600 19px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;color:#e8f1ff;white-space:nowrap}.store-wordmark b{color:#5b9bff;font-weight:600}footer .footer-logo .store-wordmark{font-size:15px}', "los estilos")
# El shell común pinta la cabecera en vivo con «XpaceOS»: se le cambia el nombre y la etiqueta de versión.
SHELL = "assets/xpace-shell.js"
sh = open(SHELL, encoding="utf-8").read()
sh = exige(sh, '<span class="xs-brand-name">XpaceOS</span>', '<span class="xs-brand-name">' + MARCA + '</span>', SHELL)
sh = exige(sh, "data-shell-label-es=\"XpaceOS · volver al inicio\" data-shell-label-en=\"XpaceOS · back to home\" title=\"${T('XpaceOS · volver al inicio', 'XpaceOS · back to home')}\"",
           "data-shell-label-es=\"admira.store · volver al inicio\" data-shell-label-en=\"admira.store · back to home\" title=\"${T('admira.store · volver al inicio', 'admira.store · back to home')}\"", SHELL)
sh = exige(sh, "version: release ? 'XpaceOS ' + release : 'XpaceOS'", "version: release ? '" + MARCA + " ' + release : '" + MARCA + "'", SHELL)
open(SHELL, "w", encoding="utf-8").write(sh)
# El gemelo (admira-xp) lleva una copia en línea de esa barra, que debe decir lo mismo que el shell.
GEMELO = "admira-xp/index.html"
if os.path.exists(GEMELO):
    g = open(GEMELO, encoding="utf-8").read()
    g = exige(g, '<span class="xs-brand-name">XpaceOS</span>', '<span class="xs-brand-name">' + MARCA + '</span>', GEMELO)
    g = g.replace('data-shell-label-es="XpaceOS · volver al inicio" data-shell-label-en="XpaceOS · back to home"', 'data-shell-label-es="admira.store · volver al inicio" data-shell-label-en="admira.store · back to home"')
    g = g.replace('title="XpaceOS · volver al inicio"', 'title="admira.store · volver al inicio"')
    open(GEMELO, "w", encoding="utf-8").write(g)
# (El sello de caché del shell no se toca: Cloudflare Pages sirve los assets con must-revalidate, así que el
#  fichero nuevo llega sin cambiar la URL y todas las páginas siguen apuntando al mismo sello.)

open(DESTINO, "w", encoding="utf-8").write(s)
print(f"  sello {SELLO} · espejo de xpaceos@{ORIGEN_SHA} · verja {verja} · {castellano} · marca {MARCA}")
