// Portada (Carlos, 15-oct-2026): sin modo Experto, con la pastilla de idioma ENG/ESP en el sitio de ⌘,
// y filtrada por la marca con la que se entra (la marca puesta a mano hace de cliente).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const shell = require('../assets/xpace-shell.js');
const leer = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const SHELL = leer('assets/xpace-shell.js');

test('on the home page the ⌘ slot is the language pill, same class and box; other pages keep ⌘', () => {
  const es = shell.markup({}, { lang: 'es', portada: true }).bar, en = shell.markup({}, { lang: 'en', portada: true }).bar;
  assert.match(es, /<button type="button" class="quad-icon xs-lang-pill" id="pfLang"[^>]*aria-label="Cambiar a inglés"[^>]*>ENG<\/button>/);
  assert.match(en, /id="pfLang"[^>]*aria-label="Switch to Spanish"[^>]*>ESP<\/button>/);
  for (const bar of [es, en]) {
    assert.doesNotMatch(bar, /id="pfExpert"|data-quad-toggle="expert"|⌘/, 'no Expert on the home page');
    assert.match(bar, /data-quad-toggle="right"/, 'the advanced menu stays');
    assert.doesNotMatch(bar.match(/id="pfLang"[^>]*/)[0], /data-quad-toggle/, 'the pill opens no panel');
  }
  const otra = shell.markup({}, { lang: 'es' }).bar;
  assert.match(otra, /<button\b[^>]*id="pfExpert"[^>]*>⌘<\/button>/);
  assert.doesNotMatch(otra, /pfLang/);
});

test('the home page is "/" (or /index.html), not framed and not an embed; a page can say so itself', () => {
  const w = (pathname, o = {}) => ({ location: { pathname, search: o.search || '' }, top: 1, self: o.framed ? 2 : 1, XPACE_SHELL: o.cfg });
  assert.equal(shell.esPortada(w('/')), true);
  assert.equal(shell.esPortada(w('/index.html')), true);
  assert.equal(shell.esPortada(w('/help/')), false);
  assert.equal(shell.esPortada(w('/admira-xp/')), false);
  assert.equal(shell.esPortada(w('/', { framed: true })), false);
  assert.equal(shell.esPortada(w('/', { search: '?embed=1' })), false);
  assert.equal(shell.esPortada(w('/', { search: '?ax_demo=store' })), false, 'the native walkthrough keeps Expert');
  assert.equal(shell.esPortada(w('/', { cfg: { portada: false } })), false);
  assert.equal(shell.esPortada(w('/ayuda/', { cfg: { portada: true } })), true);
});

test('the home page does not load the shared Expert engine and the pill switches language like /idioma', () => {
  const suite = SHELL.slice(SHELL.indexOf('  function suiteExperto() {'), SHELL.indexOf('  function suiteExperto() {') + 400);
  assert.match(suite, /if \(esPortada\(root\)\) return;/);
  assert.match(SHELL, /markup\(cfg, \{lang: lang\(\), version: [^}]*portada: esPortada\(root\)\}\)/);
  assert.match(SHELL, /const propio = doc\.getElementById\('lang-toggle'\);\s*if \(propio\) propio\.click\(\); else shared\.language\('\/idioma'\);/);
  assert.match(SHELL, /new MutationObserver\(pintar\)\.observe\(html, \{attributes: true, attributeFilter: \['lang'\]\}\)/);
});

// ── La marca puesta a mano hace de cliente (assets/xpace-cliente.js) ──
async function cliente({ marca = null, manual = null, cliente = null } = {}) {
  const store = new Map(Object.entries({ 'mb:marca': marca, 'mb:manual': manual }).filter(([, v]) => v != null));
  const oyentes = new Map();
  const document = {
    readyState: 'complete', body: {}, documentElement: {},
    addEventListener: (n, f) => oyentes.set(n, [...(oyentes.get(n) || []), f]),
    dispatchEvent: e => { for (const f of oyentes.get(e.type) || []) f(e); return true; },
    querySelectorAll: () => [],
  };
  const mapeo = JSON.parse(leer('data/clientes-mapeo.json'));
  const ctx = {
    document, location: { href: 'https://www.admira.store/' + (cliente ? '?cliente=' + cliente : ''), search: cliente ? '?cliente=' + cliente : '' },
    sessionStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) },
    history: { replaceState() {}, state: null }, URL, URLSearchParams, setTimeout, clearTimeout, Promise, JSON,
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    MutationObserver: class { observe() {} },
    fetch: async url => (String(url).includes('clientes-mapeo') ? { ok: true, json: async () => mapeo } : { ok: false, status: 401, json: async () => ({}) }),
  };
  ctx.window = ctx;
  vm.runInNewContext(leer('assets/xpace-cliente.js'), ctx);
  await ctx.XpaceCliente.cuando();
  return { api: ctx.XpaceCliente, store, document };
}

test('entering with the Starbucks brand by hand, lists show Starbucks; as Admira or with a project brand, everything', async () => {
  assert.equal((await cliente({ marca: 'starbucks', manual: '1' })).api.activo(), 'starbucks');
  assert.equal((await cliente({ marca: 'altadis', manual: '1' })).api.activo(), 'altadis');
  for (const c of [{}, { marca: 'starbucks' }, { marca: 'starbucks', manual: 'off' }, { marca: 'admira', manual: '1' }, { marca: 'starbucks', manual: '1', cliente: 'admira' }])
    assert.equal((await cliente(c)).api.activo(), null, JSON.stringify(c));
  const sb = (await cliente({ marca: 'starbucks', manual: '1' })).api;
  const altadis = { id: 'a1', name: 'Estanco Altadis Gràcia', kind: 'Altadis · estanco' }, starbucks = { id: 's1', name: 'Starbucks Paseo de Gracia', kind: 'Starbucks · café' }, generico = { id: 'g1', name: 'Xtanco Barcelona', kind: 'Xtanco' };
  assert.deepEqual(sb.filtrar([altadis, starbucks, generico]).map(x => x.id), ['s1', 'g1'], 'another client hidden; generic Admira content stays');
});

test('the client follows the brand: /marca off brings everything back', async () => {
  const { api, store, document } = await cliente({ marca: 'starbucks', manual: '1' });
  assert.equal(api.activo(), 'starbucks');
  store.set('mb:manual', 'off'); store.delete('mb:marca');
  document.dispatchEvent({ type: 'admira:marca' });
  assert.equal(api.activo(), null);
});

test('the shell loads the client filter when a brand was set by hand', () => {
  assert.match(SHELL, /if \(!id\) \{ try \{ if \(session && session\.getItem\('mb:manual'\) === '1'\) id = session\.getItem\('mb:marca'\) \|\| ''; \} catch \(_\) \{\} \}/);
});

test('the home reference twin and its links follow the client: Starbucks opens Starbucks, otherwise the Xtanco', () => {
  const portada = leer('index.html');
  assert.match(portada, /starbucks: \{ url: '\/admira-xp\/\?autostart=cafeteria&loc=alsea-sbux-021&project=starbucks&from=portada&visual=hiperreal'/);
  assert.match(portada, /function prTwinUrl\(id\)\{ const ref = !id && prReferencia\(\); if \(ref\) return ref\.url;/);
  assert.match(portada, /if \(typeof prEnlacesReferencia === 'function'\) prEnlacesReferencia\(\);\n\}\);/, 'recomputed when the client changes');
  const fijos = portada.match(/href="\/admira-xp\/\?autostart=xtanco&amp;from=portada&amp;visual=hiperreal"/g) || [];
  assert.ok(fijos.length >= 3, 'the Xtanco stays the default link for Admira and Altadis');
});
