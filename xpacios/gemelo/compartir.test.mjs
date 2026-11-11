// Gemelo compartible (Neo, 11-nov-2026): vista previa al compartir, imagen og e iframe.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {ficha, conEtiquetas, imagenDeDataUrl, IMAGEN_GENERICA} from '../../functions/xpacios/gemelo/_compartir.js';
import {onRequestGet as ver} from '../../functions/xpacios/gemelo/ver/[[path]].js';
import {onRequestGet as og} from '../../functions/xpacios/gemelo/og.js';

const G = createRequire(import.meta.url)('./gemelo.js');
const html = readFileSync(new URL('./ver/index.html', import.meta.url), 'utf8');
const gemelo = {nombre: 'Tienda <b>"X"</b>', ciudad: 'Barcelona', sector: 'tienda', fondo: {tipo: 'foto'}, items: [{t: 'pantalla'}, {t: 'videowall'}, {t: 'mesa'}]};
const api = (store) => async (u) => { const s = new URL(u).searchParams.get('screen'); return new Response(JSON.stringify({current: store[s] || null}), {headers: {'content-type': 'application/json'}}); };
const ctx = (url) => ({request: new Request(url), next: async () => new Response(html, {headers: {'content-type': 'text/html; charset=utf-8'}})});

test('la ficha cuenta pantallas y muebles y apunta a la imagen del gemelo', () => {
  const f = ficha('gm-tienda-x-1', gemelo);
  assert.match(f.descripcion, /^Barcelona · Tienda · 2 pantallas y 1 muebles/);
  assert.equal(f.imagen, 'https://www.admira.store/xpacios/gemelo/og?id=gm-tienda-x-1');
  assert.equal(ficha('gm-a', {fondo: {tipo: 'rejilla'}}).imagen, IMAGEN_GENERICA);
});

test('el visor sale del servidor con título y og del gemelo, escapados', async () => {
  const res = await ver(ctx('https://www.admira.store/xpacios/gemelo/ver/?id=gm-tienda-x-1'), api({'gemelo-gm-tienda-x-1': {gemelo}}));
  const out = await res.text();
  assert.match(out, /<title>Tienda &lt;b&gt;&quot;X&quot;&lt;\/b&gt; · Gemelo digital/);
  assert.match(out, /<meta property="og:image" content="https:\/\/www\.admira\.store\/xpacios\/gemelo\/og\?id=gm-tienda-x-1">/);
  assert.equal((out.match(/<meta name="description"/g) || []).length, 1);
  assert.doesNotMatch(out, /<b>"X"/);
});

test('sin id válido o sin gemelo, el visor sale tal cual', async () => {
  for (const u of ['https://www.admira.store/xpacios/gemelo/ver/?id=../x', 'https://www.admira.store/xpacios/gemelo/ver/?id=gm-nada']) {
    const out = await (await ver(ctx(u), api({}))).text();
    assert.match(out, /<title>Gemelo digital · admira\.store<\/title>/);
  }
});

test('og devuelve la foto publicada o la tarjeta genérica', async () => {
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64');
  const r = await og({request: new Request('https://www.admira.store/xpacios/gemelo/og?id=gm-a')}, api({'gemelo-gm-a-foto': {img: jpeg}}));
  assert.equal(r.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [0xff, 0xd8, 0xff, 0xd9]);
  const g = await og({request: new Request('https://www.admira.store/xpacios/gemelo/og?id=gm-b')}, api({}));
  assert.equal(g.status, 302);
  assert.equal(imagenDeDataUrl('data:text/html;base64,PGI+'), null);
});

test('enlace e iframe del gemelo; el visor se adapta al incrustarse', () => {
  assert.equal(G.enlace('gm-a'), 'https://www.admira.store/xpacios/gemelo/ver/?id=gm-a');
  assert.match(G.iframe('gm-a'), /^<iframe src="https:\/\/www\.admira\.store\/xpacios\/gemelo\/ver\/\?id=gm-a&embed=1"/);
  assert.match(html, /embed=1\/\.test\(location\.search\) \|\| window\.self !== window\.top/);
  assert.match(html, /id="compartirBtn"/);
});
