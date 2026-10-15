// La página de los centros Starbucks: pública como el resto de /xpacios, con el shell vigente, enlazada
// desde /xpacios/, con cada centro, su modelo y sus programas válidos y los medios que reproduce a mano.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validarPrograma, cicloDe, piezaDe } from './reproductor.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const aqui = fileURLToPath(new URL('./', import.meta.url));
const leer = p => readFileSync(repo + p, 'utf8');
const json = p => JSON.parse(readFileSync(aqui + p, 'utf8'));
const CENTROS = json('centros.json').centros;

test('the page: public like the other xpacios, current shell, one module, canonical, linked from /xpacios/', () => {
  const html = leer('xpacios/starbucks-centros/index.html');
  const portada = leer('index.html');
  const shell = (portada.match(/\/assets\/xpace-shell\.js\?v=([^"'&\s]+)/) || [])[1];
  assert.ok(html.includes(`/assets/xpace-shell.js?v=${shell}`), 'current shell release');
  assert.doesNotMatch(html, /gate\.js|auth-gate|\/auth\/login/, 'no access gate: /xpacios is public');
  assert.equal((html.match(/<script type="module"/g) || []).length, 1);
  assert.match(html, /<script type="module" src="\.\/visor\.mjs\?v=/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.admira\.store\/xpacios\/starbucks-centros\/">/);
  assert.match(html, /<meta name="admiranext-version" content="v\.\d\d\.\d\d\.\d{4}\.r\d+\.\d\d:\d\d">/);
  for (const id of ['play', 'reiniciar', 'siguiente', 'programa', 'tramos', 'cabezal', 'lista', 'detalle', 'gesto']) assert.match(html, new RegExp(`id="${id}"`), `control #${id}`);
  assert.match(html, /data-modo="3d"[\s\S]*data-modo="matrix"/);
  assert.match(leer('xpacios/index.html'), /href="\/xpacios\/starbucks-centros\/\?centro=pg103"/);
  assert.match(leer('xpacios/index.html'), /href="\/xpacios\/starbucks-centros\/\?centro=d634"/);
});

test('three options: Paseo de Gràcia 103 and Diagonal 634 with their models; Gran de Gràcia 51 opens its own twin', () => {
  assert.deepEqual(CENTROS.map(c => c.id), ['pg103', 'd634', 'gdg51']);
  const pg = CENTROS.find(c => c.id === 'pg103'), d = CENTROS.find(c => c.id === 'd634'), g = CENTROS.find(c => c.id === 'gdg51');
  assert.equal(pg.catalogo, 'alsea-sbux-021');
  assert.equal(d.catalogo, null, 'Diagonal 634 is not in the catalogue');
  assert.match(d.identidad, /L’Illa Diagonal 557/);
  assert.match(d.identidad, /Gran de Gràcia 51/);
  assert.equal(g.enlace, '/xpacios/gran-de-gracia-51/');
  assert.ok(existsSync(repo + 'xpacios/gran-de-gracia-51/index.html'));
  assert.match(g.pendiente, /4 pantallas horizontales y 2 verticales/);
});

test('every program of every centre plays on its own model: valid, bound screen by screen, media present', () => {
  for (const c of CENTROS.filter(x => !x.enlace)) {
    const geo = json(c.geometria);
    assert.equal(geo.screens.length, 6);
    for (const ruta of c.programas) {
      const p = json(ruta);
      assert.equal(p.centro, c.id, `${p.id} belongs to ${c.id}`);
      assert.deepEqual(validarPrograma(p, geo.screens), [], p.id);
      assert.equal(p.vinculacionFisica, 'pendiente');
      assert.ok(cicloDe(p) > 0);
      for (const tr of p.tramos) for (const a of p.asociaciones) {
        const pz = piezaDe(tr, a.pantalla);
        if (/^https:\/\//.test(pz.src)) assert.match(pz.src, /^https:\/\/stock\.admira\.store\//, 'remote media come from the stock CDN (CORS open)');
        else { assert.ok(existsSync(aqui + pz.src), `${pz.src} is in the page folder`); assert.ok(statSync(aqui + pz.src).size > 100_000); }
        assert.deepEqual([pz.ancho, pz.alto], [1080, 1920], 'portrait 9:16, the format of the six menu screens');
      }
    }
  }
});

test('the viewer keeps Matrix honest: green outlines of the room, screens still showing their video', () => {
  const visor = readFileSync(aqui + 'visor.mjs', 'utf8');
  assert.match(visor, /new T\.EdgesGeometry\(g\)/, 'room structure as clean outlines, not triangle wireframe');
  assert.doesNotMatch(visor, /wireframe\s*[:=]\s*true/);
  assert.match(visor, /raiz\.userData\.lineas\.visible = matrix/);
  assert.match(visor, /new T\.VideoTexture\(m\.video\)/);
  assert.match(visor, /toneMapped: false, fog: false, polygonOffset: true/, 'video is unlit, unfogged and above the glass');
  assert.match(visor, /ajusteSinRecorte\(\[p\.ancho, p\.alto\], medio\)/, 'fit without crop on every frame');
  assert.match(visor, /p\.ultima \|\| p\.cargando/, 'keeps the last frame until the next piece has an image');
});
