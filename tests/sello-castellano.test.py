#!/usr/bin/env python3
"""DEC-0508: el HTML visible de admira.store sale en castellano, sin esperar a JS."""
import os, sys, tempfile, shutil, subprocess, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

# Import helpers from the script by exec'ing the functions only.
src = open(os.path.join(ROOT, "sello-y-verja.py"), encoding="utf-8").read()
# Stop before SELLO = os.environ
mod = src.split("SELLO = os.environ")[0]
ns = {}
exec(mod, ns)
parse_js_object = ns["parse_js_object"]
bake_i18n = ns["bake_i18n"]

block = """
    title: 'Título ES',
    description: 'Desc ES',
    'hero.title': 'El sistema operativo<br>del <span class="grad">comercio físico</span>.',
    skip: 'Saltar al contenido',
"""
d = parse_js_object(block)
assert d["title"] == "Título ES", d
assert d["skip"] == "Saltar al contenido"
assert "comercio físico" in d["hero.title"]

html = '''<html lang="en">
<a data-i18n="skip">Skip to content</a>
<h1 data-i18n-html="hero.title">The operating system<br>for <span class="grad">physical retail</span>.</h1>
</html>'''
out, n = bake_i18n(html, d, "data-i18n", html_inner=False)
out, n2 = bake_i18n(out, d, "data-i18n-html", html_inner=True)
assert n == 1 and n2 == 1, (n, n2)
assert "Saltar al contenido" in out
assert "comercio físico" in out
assert "physical retail" not in out
print("ok sello-castellano")
