// Marca blanca en XpaceOS / admira.store (FLT-101337): un solo enganche (xpace-shell.js, que
// también carga el gemelo), nada de admiranext.com sin marca activa, catálogo comprobado
// antes de cargar nada, textos AA con cualquier marca y el verbo /marca (alias /brand).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const M = require(join(root, 'assets/marca-blanca.js'));
const SHELL = require(join(root, 'assets/xpace-shell.js'));
const read = file => readFileSync(join(root, file), 'utf8');
const STAMP = '?v=20261001-test';
const memory = (init = {}) => {
  const mem = new Map(Object.entries(init));
  return {mem, getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k)};
};
const pages = (() => {
  const out = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || name === 'node_modules') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full); else if (name.endsWith('.html')) out.push(relative(root, full));
    }
  };
  walk(root);
  return out;
})();
const ticks = async (n = 20) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

// Ejecuta un script en un navegador mínimo y anota todo lo que intenta cargar o pedir.
function browser({file, src, search = '', session = memory(), loadNodes = false, fetchImpl, topBar = false}) {
  const created = [], fetched = [], listeners = {};
  const listen = (name, fn) => { (listeners[name] || (listeners[name] = [])).push(fn); };
  const node = tag => ({tagName: tag.toUpperCase(), attrs: {}, style: {}, dataset: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, remove() {}});
  const append = n => { created.push(n); if (loadNodes && n.onload) setImmediate(() => n.onload()); };
  const document = {
    readyState: 'loading',
    currentScript: {src, dataset: {}},
    documentElement: {lang: 'es', style: {length: 0, setProperty() {}, removeProperty() {}}, classList: {add() {}, remove() {}, toggle() {}}, getAttribute: () => null, setAttribute() {}, removeAttribute() {}, appendChild: append},
    head: {append, appendChild: append},
    title: 'XpaceOS · Ayuda',
    createElement: tag => node(tag),
    querySelector: () => null, querySelectorAll: () => [],
    getElementById: id => (topBar && id === 'topBar' ? {id} : null),
    dispatchEvent() {}, addEventListener: listen,
  };
  const window = {document, sessionStorage: session, localStorage: memory(), location: {search, href: 'https://www.xpaceos.com/help/' + search, pathname: '/help/', origin: 'https://www.xpaceos.com'},
    setTimeout: () => 0, clearTimeout() {}, history: {replaceState() {}}, console, addEventListener: listen,
    fetch: url => { fetched.push(url); return fetchImpl ? fetchImpl(url) : new Promise(() => {}); }};
  window.window = window;
  window.self = window; window.top = window;
  const context = vm.createContext(Object.assign(window, {URL, URLSearchParams, CustomEvent: class {}, MutationObserver: class { observe() {} disconnect() {} }, Promise}));
  vm.runInContext(read(file), context);
  return {created, fetched, session, context, listeners};
}
const bootMarca = opts => browser(Object.assign({file: 'assets/marca-blanca.js', src: 'https://www.xpaceos.com/assets/marca-blanca.js' + STAMP}, opts));
// Única excepción (encargo avatar · 4-oct-2026): el shell inserta el cargador común del
// avatar de admiranext.com, que decide con la bandera del proyecto (apagada en XpaceOS).
// Se comprueba aparte que sea exactamente uno y nada más; el resto del contrato sigue igual.
const AVATAR_LOADER = 'https://www.admiranext.com/assets/avatar.js?v=20261006-avatar-nube-1';
// Segunda excepción, del mismo tipo (sello con novedades · 6-oct-2026): el cargador común del sello
// de versión, que solo lee el /version.json de ESTE sitio. Exactamente uno, y nada más.
const SELLO_LOADER = 'https://www.admiranext.com/assets/sello-novedades.js?v=20261006-options-sello-4';
const bootShell = opts => {
  const r = browser(Object.assign({file: 'assets/xpace-shell.js', src: 'https://www.xpaceos.com/assets/xpace-shell.js' + STAMP}, opts));
  const loaders = r.created.filter(n => n.tagName === 'SCRIPT' && (n.src === AVATAR_LOADER || n.src === SELLO_LOADER));
  assert.equal(loaders.filter(n => n.src === AVATAR_LOADER).length, 1, 'el shell inserta una vez el cargador del avatar');
  assert.equal(loaders.filter(n => n.src === SELLO_LOADER).length, 1, 'el shell inserta una vez el cargador del sello');
  // Contrato entregado: contraste local limitado al panel Experto, sin red externa.
  const legibility = r.created.filter(n => n.tagName === 'LINK' && n.href === '/assets/expert-legibility.css' + STAMP);
  assert.equal(legibility.length, 1, 'una hoja local de contraste Experto');
  // El mismo array: un cambio de proyecto inserta la marca después, y tiene que verse aquí.
  for (let i = r.created.length - 1; i >= 0; i--) if (loaders.includes(r.created[i]) || legibility.includes(r.created[i])) r.created.splice(i, 1);
  return r;
};
const json = (status, body) => Promise.resolve({ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body)});

test('sin marca activa XpaceOS no carga nada nuevo ni habla con admiranext.com', () => {
  for (const topBar of [false, true]) for (const [search, init] of [['', {}], ['?lang=es', {}], ['?gate=off', {}]]) {
    const r = bootShell({search, session: memory(init), topBar});
    assert.deepEqual(r.created, [], `${search}: el shell no inserta nada`);
    assert.deepEqual(r.fetched, []);
    assert.equal(typeof r.context.XpaceShell.cargarMarca, 'function', 'el CLI la carga al usar /marca');
    if (topBar) assert.equal(r.context.XpaceShell.inline, true, 'el gemelo: barra en línea, solo API y marca');
  }
  // marca-blanca.js es inerte sin marca (también con ?marca=admira/off, que la olvidan).
  for (const [search, init] of [['', {}], ['?marca=admira', {'mb:marca': 'lumbre'}], ['?marca=off', {'mb:marca': 'starbucks'}], ['?marca=', {}]]) {
    const r = bootMarca({search, session: memory(init)});
    assert.deepEqual(r.created, [], `${search}: nada insertado`);
    assert.deepEqual(r.fetched, [], `${search}: ninguna petición`);
    assert.equal(r.session.getItem('mb:marca'), null, `${search}: ninguna marca recordada`);
    assert.equal(r.context.AdmiraMarca.actual(), null);
  }
  // Ninguna página lleva los ficheros de marca blanca a mano: solo los carga el shell.
  for (const page of pages) {
    const html = read(page);
    assert.ok(!/admiranext\.com\/marcablanca\/marcablanca\.(?:css|js)/.test(html), `${page}: marcablanca estático`);
    assert.ok(!/marca-blanca\.(?:css|js)/.test(html), `${page}: marca-blanca.* solo a través de xpace-shell.js`);
  }
});

test('xpace-shell.js es el único enganche: ?marca= o una marca recordada cargan marca-blanca.js con su sello', () => {
  for (const topBar of [false, true]) for (const [search, init] of [['?marca=lumbre', {}], ['', {'mb:marca': 'starbucks'}], ['?marca=admira', {'mb:marca': 'lumbre'}]]) {
    const r = bootShell({search, session: memory(init), topBar});
    const scripts = r.created.filter(n => n.tagName === 'SCRIPT');
    assert.equal(scripts.length, 1, `${search}: un script`);
    assert.equal(scripts[0].src, '/assets/marca-blanca.js' + STAMP);
    assert.deepEqual(r.fetched, [], 'el shell nunca habla con admiranext.com');
  }
  // El gemelo carga el shell (modo barra en línea) con el sello vigente de la portada.
  const version = (read('index.html').match(/xpace-shell\.js\?v=([^"]+)"/) || [])[1];
  assert.match(read('admira-xp/index.html'), new RegExp(`<script defer src="/assets/xpace-shell\\.js\\?v=${version}" data-shell="inline"></script>`));
});

test('con marca se comprueba primero el catálogo; solo después el cargador y las dos hojas', async () => {
  let release;
  const gate = new Promise(r => { release = r; });
  const r = bootMarca({search: '?marca=Starbucks', loadNodes: true, fetchImpl: () => gate.then(() => json(200, {id: 'starbucks', nombre: 'Starbucks'}))});
  assert.deepEqual(r.fetched, [M.BASE + 'api/marcas/starbucks'], 'primera y única petición: la ficha del catálogo');
  assert.deepEqual(r.created, [], 'nada se carga antes de que el catálogo responda');
  release();
  await ticks();
  const script = r.created.find(n => n.tagName === 'SCRIPT');
  assert.ok(script && script.src === M.BASE + 'marcablanca.js', 'cargador común');
  assert.equal(script.attrs['data-mb-plataforma'], 'store');
  assert.equal(script.attrs['data-mb-auto'], 'false', 'XpaceOS aplica la marca tras comprobar el catálogo');
  const links = r.created.filter(n => n.tagName === 'LINK').map(n => n.href);
  assert.ok(links.includes(M.BASE + 'marcablanca.css'), 'hoja común');
  assert.ok(links.includes('https://www.xpaceos.com/assets/marca-blanca.css' + STAMP), 'hoja local con el mismo sello');
});

test('una marca desconocida o admiranext.com caído no aplican nada y se olvida el id desconocido', async () => {
  const unknown = bootMarca({search: '', session: memory({'mb:marca': 'noexiste'}), fetchImpl: () => json(404, {})});
  await ticks();
  assert.deepEqual(unknown.created, []);
  assert.equal(unknown.session.getItem('mb:marca'), null);
  assert.equal(unknown.context.AdmiraMarca.actual(), null);
  const down = bootMarca({search: '?marca=lumbre', fetchImpl: () => Promise.reject(new Error('offline'))});
  await ticks();
  assert.deepEqual(down.created, []);
  assert.deepEqual(down.fetched, [M.BASE + 'api/marcas/lumbre', M.BASE + 'clientes/lumbre.json'], 'API, respaldo estático y nada más');
  assert.equal(down.context.AdmiraMarca.actual(), null);
  assert.match(read('assets/marca-blanca.js'), /TIMEOUT = 8000/);
});

test('la decisión sigue al cargador común: ?marca= manda y se recuerda; admira/off la olvidan', () => {
  assert.deepEqual(M.decide('?marca=lumbre', memory()), {id: 'lumbre', remember: true});
  assert.deepEqual(M.decide('?marca=admira', memory({'mb:marca': 'lumbre'})), {id: null, forget: true});
  assert.deepEqual(M.decide('?marca=off', memory()), {id: null, forget: true});
  assert.deepEqual(M.decide('', memory({'mb:marca': 'brumelle'})), {id: 'brumelle'});
  assert.deepEqual(M.decide('?marca=<script>', memory({'mb:marca': 'brumelle'})), {id: 'brumelle'});
  assert.equal(M.SESSION_KEY, 'mb:marca');
  assert.equal(SHELL.MB_SESSION_KEY, 'mb:marca');
  assert.equal(M.PLATAFORMA, 'store');
  assert.ok(SHELL.wantsBrand('?marca=starbucks', memory()));
  assert.ok(SHELL.wantsBrand('', memory({'mb:marca': 'lumbre'})));
  assert.ok(SHELL.wantsBrand('?project=altadis', memory()));
  assert.ok(SHELL.wantsBrand('?loc=alsea-sbux-021', memory()));
  assert.ok(SHELL.wantsBrand('', memory({'mb:proyecto': 'starbucks'})));
  assert.ok(!SHELL.wantsBrand('?lang=en', memory()));
});

test('el proyecto aplica su marca, estancos vuelve a Admira y ?marca= gana', async () => {
  assert.deepEqual(M.decide('?project=starbucks', memory()), {id: 'starbucks', project: 'starbucks', fromProject: true});
  assert.deepEqual(M.decide('?project=starbucks-mexico', memory()), {id: 'starbucks', project: 'starbucks', fromProject: true});
  assert.deepEqual(M.decide('?loc=alsea-sbux-021&project=estancos', memory()), {id: 'starbucks', project: 'starbucks', fromProject: true});
  assert.deepEqual(M.decide('?project=altadis', memory()), {id: 'altadis', project: 'altadis', fromProject: true});
  assert.deepEqual(M.decide('?marca=lumbre&project=starbucks', memory()), {id: 'lumbre', remember: true, project: 'starbucks'});
  const held = memory({'mb:marca': 'lumbre', 'mb:proyecto': 'starbucks', 'mb:manual': '1'});
  assert.deepEqual(M.decide('?project=starbucks', held), {id: 'lumbre', project: 'starbucks', hold: true});
  assert.deepEqual(M.decide('?project=altadis', held), {id: 'altadis', project: 'altadis', fromProject: true});
  assert.deepEqual(M.decide('', memory({'mb:marca': 'starbucks', 'mb:proyecto': 'starbucks'})), {id: 'starbucks'});
  const quiet = bootMarca({search: '', session: memory()});
  assert.deepEqual(quiet.fetched, [], 'sin proyecto ni marca: cero peticiones');
  assert.deepEqual(bootShell({search: '?lang=es', session: memory()}).created, []);

  const wear = id => ({version: 1, aplicar: () => Promise.resolve({id, modo: 'marca', variables: {}, marca: {id, nombre: id}})});
  const brand = {id: 'starbucks', nombre: 'Starbucks', catalogo: {propuesta: true}};
  const sb = bootMarca({search: '?project=starbucks', loadNodes: true, fetchImpl: url => json(url.endsWith('/starbucks') ? 200 : 404, url.endsWith('/starbucks') ? brand : {})});
  assert.deepEqual(sb.fetched, [M.BASE + 'api/marcas/starbucks']);
  sb.context.MarcaBlanca = wear('starbucks');
  await ticks();
  assert.equal(sb.session.getItem('mb:marca'), 'starbucks');
  assert.equal(sb.session.getItem('mb:proyecto'), 'starbucks');
  assert.equal(sb.context.AdmiraMarca.actual().id, 'starbucks');

  const alt = bootMarca({search: '?project=altadis', loadNodes: true, fetchImpl: () => json(200, {id: 'altadis', nombre: 'Altadis'})});
  alt.context.MarcaBlanca = wear('altadis');
  await ticks();
  assert.equal(alt.session.getItem('mb:marca'), 'altadis');
  assert.equal(alt.context.AdmiraMarca.actual().id, 'altadis');

  const est = bootMarca({search: '?project=estancos', session: memory({'mb:marca': 'starbucks', 'mb:proyecto': 'starbucks'}), fetchImpl: () => json(404, {})});
  await ticks();
  assert.deepEqual(est.fetched, [M.BASE + 'api/marcas/estancos']);
  assert.deepEqual(est.created, []);
  assert.equal(est.session.getItem('mb:marca'), null, 'estancos quita la marca anterior');
  assert.equal(est.session.getItem('mb:proyecto'), 'estancos');
  assert.equal(est.context.AdmiraMarca.actual(), null);

  const again = bootMarca({search: '', session: memory({'mb:marca': 'altadis', 'mb:proyecto': 'altadis'}), fetchImpl: () => json(200, {id: 'altadis', nombre: 'Altadis'})});
  await ticks();
  assert.equal(again.session.getItem('mb:marca'), 'altadis', 'la recarga conserva la marca');

  const manual = bootMarca({search: '?marca=lumbre&project=starbucks', loadNodes: true, fetchImpl: url => json(200, {id: url.endsWith('/lumbre') ? 'lumbre' : 'starbucks', nombre: 'X'})});
  manual.context.MarcaBlanca = wear('lumbre');
  await ticks();
  assert.equal(manual.fetched[0], M.BASE + 'api/marcas/lumbre');
  assert.ok(!manual.fetched.includes(M.BASE + 'api/marcas/starbucks'));
  assert.equal(manual.session.getItem('mb:marca'), 'lumbre');
  assert.equal(manual.session.getItem('mb:manual'), '1');

  const shell = bootShell({search: '?project=starbucks', session: memory()});
  assert.equal(shell.created.filter(n => n.tagName === 'SCRIPT').length, 1);
  assert.equal(shell.created[0].src, '/assets/marca-blanca.js' + STAMP);
  assert.deepEqual(shell.fetched, [], 'el shell no habla con admiranext.com');

  const live = bootShell({search: '', session: memory(), loadNodes: true});
  assert.deepEqual(live.created.filter(n => /marca-blanca/.test(n.src || '')), []);
  live.listeners['xpaceos:project-change'][0]({detail: {id: 'altadis'}});
  await ticks();
  assert.ok(live.created.some(n => n.src === '/assets/marca-blanca.js' + STAMP), 'el cambio de proyecto carga la marca sin recargar');
  const cliente = bootShell({search: '', session: memory()});
  cliente.listeners['xpace:cliente'][0]({detail: {id: 'jti'}});
  assert.ok(cliente.created.some(n => n.src === '/assets/marca-blanca.js' + STAMP), 'xpace:cliente también carga la marca');
  const verb = bootMarca({search: '?project=starbucks', session: memory(), loadNodes: true, fetchImpl: url => json(String(url).endsWith('/lumbre') ? 200 : 404, String(url).endsWith('/lumbre') ? {id: 'lumbre', nombre: 'Lumbre'} : {})});
  verb.context.MarcaBlanca = wear('lumbre');
  await ticks();
  const turned = await verb.context.AdmiraMarca.activar('lumbre');
  assert.equal(turned.ok, true);
  assert.equal(verb.session.getItem('mb:manual'), '1', '/marca manda hasta el siguiente proyecto');
  assert.equal(verb.session.getItem('mb:marca'), 'lumbre');
  assert.match(read('admira-xp/scripts/project-selector.mjs'), /aplicarProyecto/);
});

test('los textos llegan a AA con marcas claras, oscuras y hostiles (Starbucks primero)', () => {
  const palettes = {
    starbucks: {modo: 'claro', primario: '#006241', 'primario-texto': '#FFFFFF', secundario: '#000000', acento: '#C58800', 'acento-texto': '#231800', fondo: '#FFFFFF', superficie: '#FFFFFF', 'superficie-alt': '#EEEFEF', texto: '#0F1C1D', 'texto-suave': '#576061', ok: '#2F7D4F', aviso: '#B7791F', error: '#C0392B', info: '#2B6CB0'},
    brumelle: {modo: 'oscuro', primario: '#D4FF3A', 'primario-texto': '#0A0A0A', secundario: '#F2EFE9', acento: '#FF3D7F', 'acento-texto': '#0A0A0A', fondo: '#0A0A0A', superficie: '#161616', 'superficie-alt': '#1F1F1F', texto: '#F2EFE9', 'texto-suave': '#A8A39A', ok: '#7EE08A', error: '#FF4D4D', info: '#6EA8FF'},
    hostil: {modo: 'claro', primario: '#FFE14D', 'primario-texto': '#FFFFFF', acento: '#FFF3B0', fondo: '#FFFFFF', superficie: '#FAFAFA', 'superficie-alt': '#F0F0F0', texto: '#BBBBBB', 'texto-suave': '#DDDDDD', ok: '#9BE29B', error: '#FFB3B3', info: '#A0D8FF'},
  };
  for (const [name, p] of Object.entries(palettes)) {
    const vars = Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'modo').map(([k, v]) => ['--mb-' + k, v]));
    const t = M.shellTokens(vars, p.modo);
    for (const token of ['--mbx-ink', '--mbx-mut', '--mbx-brand', '--mbx-accent', '--mbx-ok', '--mbx-error', '--mbx-warn', '--mbx-info']) {
      for (const bg of [p.fondo, p.superficie, p['superficie-alt']]) assert.ok(M.contrast(t[token], bg) >= 4.5, `${name} ${token} ${t[token]} sobre ${bg}`);
    }
    assert.ok(M.contrast(t['--mbx-on-brand'], t['--mbx-brand']) >= 4.5, `${name} texto sobre marca`);
  }
  const sb = M.shellTokens(Object.fromEntries(Object.entries(palettes.starbucks).filter(([k]) => k !== 'modo').map(([k, v]) => ['--mb-' + k, v])), 'claro');
  assert.equal(sb['--mbx-brand'], '#006241');
  assert.equal(sb['--mbx-accent'], '#006241', 'el dorado #C58800 no llega a AA sobre blanco: cede al verde');
});

test('la hoja local solo actúa bajo una marca store y nunca recolorea medios ni el 3D', () => {
  const css = read('assets/marca-blanca.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = css.replace(/@media[^{]*\{([\s\S]*?\})\s*\}/g, '$1').match(/[^{}]+\{[^{}]*\}/g);
  assert.ok(rules.length > 40);
  // Separa una lista de selectores por las comas de primer nivel (no las de :is()/:not()).
  const split = list => { const out = []; let depth = 0, cur = ''; for (const ch of list) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur); cur = ''; } else cur += ch; } return [...out, cur]; };
  for (const rule of rules) for (const sel of split(rule.slice(0, rule.indexOf('{')))) {
    assert.match(sel.trim(), /^:root\[data-mb-marca(?:="starbucks")?\]\[data-mb-plataforma="store"\]/, 'selector sin acotar: ' + sel.trim());
  }
  assert.ok(!/\bfilter\s*:\s*(?!none)/.test(css), 'sin filtros de color');
  assert.ok(!/mix-blend-mode\s*:\s*(?!normal)/.test(css));
  assert.ok(!/#c\b|canvas[^{]*\{[^}]*(background|color)/.test(css), 'el lienzo del gemelo no se toca');
  // El gemelo: --xp-* desde los tokens, en la barra, los paneles y la consola.
  assert.match(css, /#topBar\{\s*--xp-bg:var\(--mb-fondo\)/);
  assert.match(css, /:is\(\.quad-menu,\.xs-expert,#telegramDock,#characterDock\)\{\s*--xp-bg/);
  // La barra: logo del cliente y «powered by XpaceOS» discreto.
  assert.match(css, /\.xs-brand::before\{content:"powered by "/);
  assert.match(css, /\.mb-powered::before\{content:"powered by "/);
  const js = read('assets/marca-blanca.js');
  assert.match(js, /propuesta generada automáticamente, no es la marca oficial/);
  assert.match(js, /marca ficticia de ejemplo/);
  assert.doesNotMatch(js, /T\('Volver a Admira', 'Back to Admira'\)/);
  assert.doesNotMatch(js, /function backButton\(/, 'se retira el acceso duplicado de Opciones');
  assert.match(js, /current\.nombre \+ ' · '/, 'título «Nombre · título»');
});

// ─── Verbo /marca ───
const fakeMarca = (over = {}) => {
  const calls = [];
  const api = Object.assign({}, M, {
    actual: () => null,
    conocidas: () => [{id: 'admira', nombre: 'Admira'}, {id: 'lumbre', nombre: 'Lumbre Café', ejemplo: true}],
    listar: () => Promise.resolve([{id: 'admira', nombre: 'Admira'}, {id: 'lumbre', nombre: 'Lumbre Café', ejemplo: true}, {id: 'starbucks', nombre: 'Starbucks', propuesta: true}]),
    activar: id => { calls.push(['activar', id]); return Promise.resolve(id === 'lumbre' ? {ok: true, id, nombre: 'Lumbre Café', ejemplo: true} : id === 'caida' ? {ok: false, reason: 'network'} : {ok: false, reason: 'unknown', id}); },
    desactivar: () => { calls.push(['desactivar']); return {ok: true, changed: true, previous: {id: 'lumbre', nombre: 'Lumbre Café'}}; },
    analizar: url => { calls.push(['analizar', url]); return {ok: true, href: M.analyzerUrl(url), url}; },
  }, over);
  return {calls, api};
};
const run = async (arg, api, en = false) => { const lines = []; const r = await SHELL.runMarca(arg, api, en, l => lines.push(l)); return {r, text: lines.join('\n')}; };

test('/marca <id>, off, <web>, sola y basura, con los textos de admira.app y Pixeria', async () => {
  const {calls, api} = fakeMarca();
  let o = await run('lumbre', api);
  assert.ok(o.r.ok);
  assert.match(o.text, /Aplicando la marca lumbre…\nMarca Lumbre Café \(lumbre\) activa · marca ficticia de ejemplo\. Se mantiene al navegar en esta pestaña; \/marca off vuelve a Admira\./);
  o = await run('noexiste', api);
  assert.match(o.text, /no está en el catálogo de admiranext\.com\. No se ha aplicado nada/);
  o = await run('caida', api, true);
  assert.match(o.text, /Could not reach admiranext\.com/);
  o = await run('off', api);
  assert.deepEqual(calls.at(-1), ['desactivar']);
  assert.match(o.text, /Marca Lumbre Café desactivada: vuelve Admira/);
  o = await run('starbucks.es', api);
  assert.deepEqual(calls.at(-1), ['analizar', 'https://starbucks.es/']);
  assert.match(o.text, /otra pestaña: https:\/\/www\.admiranext\.com\/marcablanca\/\?web=https%3A%2F%2Fstarbucks\.es%2F/);
  o = await run('', fakeMarca({actual: () => ({id: 'starbucks', nombre: 'Starbucks', propuesta: true})}).api);
  assert.match(o.text, /Marca activa: Starbucks \(starbucks\) · propuesta automática, no es la marca oficial/);
  assert.match(o.text, /Disponibles: admira, lumbre \(ejemplo\), starbucks \(propuesta\)/);
  o = await run('', api, true);
  assert.match(o.text, /No white label: you see the Admira look/);
  o = await run('<img src=x>', api);
  assert.match(o.text, /Marca no válida: «<img src=x>»[\s\S]*off para volver a Admira/);
  o = await run('lumbre', null);
  assert.match(o.text, /aún no está lista/);
  // Los mismos textos que Pixeria (fuente de verdad compartida).
  const pixeria = '/Users/csilvasantin/Claude/worktrees/pixeria-shell/assets/expert-cli.js';
  try {
    const ref = readFileSync(pixeria, 'utf8');
    for (const phrase of ['Sin marca blanca: ves el aspecto de Admira.', 'No había ninguna marca blanca activa: ya ves Admira.', 'Allí se analiza la web y se guarda en el catálogo; después actívala aquí con /marca <id>.']) {
      assert.ok(ref.includes(phrase) && read('assets/xpace-shell.js').includes(phrase), phrase);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
});

test('/marca sin navegador (Telegram, MCP, /twin/cmd) responde con el enlace y no aplica nada', () => {
  let r = SHELL.remoteMarca('starbucks', false);
  assert.equal(r.url, 'https://www.xpaceos.com/admira-xp/?marca=starbucks');
  assert.match(r.message, /desde aquí no cambia ninguna pantalla/);
  r = SHELL.remoteMarca('off', true);
  assert.equal(r.url, 'https://www.xpaceos.com/admira-xp/?marca=admira');
  r = SHELL.remoteMarca('starbucks.es', false);
  assert.equal(r.url, 'https://www.admiranext.com/marcablanca/?web=https%3A%2F%2Fstarbucks.es%2F');
  r = SHELL.remoteMarca('', false);
  assert.match(r.message, /\?marca=<id>/);
  assert.equal(SHELL.remoteMarca('<img>', false).ok, false);
  const game = read('admira-xp/index.html');
  assert.match(game, /if\(\['marca','brand','marcablanca'\]\.includes\(cmd\)\)\{\s*const XS=window\.XpaceShell;\s*if\(XS&&typeof XS\.remoteMarca==='function'\) return XS\.remoteMarca/, '__xtExec');
  assert.match(game, /return \{ok:r\.ok,message:r\.message,data:\{url:r\.url\|\|null,applied:false\}\};/, 'xtAPI.command');
  assert.match(game, /window\.XpaceShell\.marca\(clean\.replace/, 'la consola local del gemelo la aplica en el navegador');
  assert.match(game, /\{title:'Marca blanca · White label \(admiranext\.com\/marcablanca\)',items:\['\/marca','\/marca starbucks','\/marca off','\/marca starbucks\.es','\/brand lumbre'\]\}/, '/help del gemelo');
});

test('/marca está en la ayuda y las superficies MCP; /brand es alias y Tab completa', () => {
  assert.ok(SHELL.MARCA_VERB.test('/marca') && SHELL.MARCA_VERB.test('/brand') && SHELL.MARCA_VERB.test('BRAND'));
  assert.ok(SHELL.SHELL_VERBS.includes('marca') && SHELL.SHELL_VERBS.includes('brand'));
  assert.deepEqual(SHELL.complete('/marca ', ['marca'], SHELL.BRAND_SEED).options, ['admira', 'lumbre', 'brumelle', 'frescaria', 'off']);
  assert.equal(SHELL.complete('/brand star', ['brand'], ['admira', 'starbucks']).value, '/brand starbucks');
  for (const [file, words] of [
    ['admira-xp/docs/marca-blanca.md', ['?marca=', '/marca off', 'Volver a Admira', 'powered by XpaceOS', 'Qué no cambia', 'xpace-shell.js', 'English']],
    ['help/index.html', ['/marca', 'Marca blanca', 'White label']],
    ['help/cli/index.html', ['/marca starbucks', 'Marca blanca', 'White label']],
    ['admira-xp/help.html', ['/marca', 'Marca blanca', 'White label']],
    ['mcp/llms.txt', ['/marca', 'White label']],
    ['mcp/index.html', ['/marca', 'Marca blanca']],
  ]) {
    const text = read(file);
    for (const w of words) assert.ok(text.includes(w), `${file}: ${w}`);
  }
  const catalog = JSON.parse(read('mcp/funcionalidades.json'));
  const commands = catalog.features.flatMap(f => f.commands.map(c => c.text));
  for (const c of ['/marca starbucks', '/marca off']) assert.ok(commands.includes(c), `funcionalidades.json: ${c}`);
});
