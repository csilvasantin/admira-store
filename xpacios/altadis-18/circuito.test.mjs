// Circuito «Altadis España · 10 Xtancos» (misión DCL-a6cb621be0ce5932f50960de, tarea b): lectura
// de ?loc= / ?circuito= / ?marca=, orden del recorrido, respaldo si el índice da 404, el local en
// la ficha y el tipo de espacio con marca. Puro: sin navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {
  circuitoDesdeURL, marcaDesdeURL, tipoInicial, normalizarCircuito, validarCircuito, cargarCircuito, fuentesCircuito,
  buscarLocal, localDeEspacio, vecinoLocal, resolverInicio, tituloLocal, enlaceMapa, formatoDeLocal, slug,
  SCHEMA_CIRCUITO, CIRCUITO, CIRCUITO_COMPARTIDO, CIRCUITO_LOCAL, TIPO_DE_MARCA,
} from './circuito.mjs';
import { queryEspacio, formatoDe, ESPERA_COMPARTIDO_MS } from './espacios.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
const RESPALDO = JSON.parse(read('xpacios/altadis-18/planos/altadis-espana-10.json'));
const INDICE = JSON.parse(read('xpacios/altadis-18/planos/altadis-18.json'));
const clon = o => JSON.parse(JSON.stringify(o));

// Reparto previsto del encargo: tourOrder · ciudad · formato.
const REPARTO = [[1, 'A Coruña', '07'], [2, 'Bilbao', '17'], [3, 'Barcelona', '01'], [4, 'Zaragoza', '16'], [5, 'Madrid', '08'],
  [6, 'València', '10'], [7, 'Palma', '13'], [8, 'Sevilla', '18'], [9, 'Málaga', '12'], [10, 'Granada', '09']];

// Respuestas falsas de fetch, como en espacios.test.mjs: url → { status, tipo, cuerpo }.
function falso(mapa) {
  const pedidas = [];
  const fetchImpl = async (url, opts) => {
    pedidas.push({ url, opts });
    const r = mapa[url];
    if (!r) return { ok: false, status: 404, headers: { get: () => 'text/html' }, json: async () => { throw new Error('html'); } };
    return { ok: (r.status || 200) < 400, status: r.status || 200, headers: { get: () => r.tipo || 'application/json' }, json: async () => clon(r.cuerpo) };
  };
  return { fetchImpl, pedidas };
}

// El índice real del equipo de admira.biz (el respaldo es su copia), en otro orden para probar el
// orden de tour. GENERICO: un índice sin nombres propios ni direcciones ni enlaces.
const { respaldo: _r, _nota: _n, ...SIN_MARCA_DE_RESPALDO } = RESPALDO;
const REAL = { ...clon(SIN_MARCA_DE_RESPALDO), locales: clon(RESPALDO.locales).reverse() };
const GENERICO = { ...clon(SIN_MARCA_DE_RESPALDO), locales: RESPALDO.locales.map(({ nombre, direccion, mapa, ...l }) => clon(l)) };

test('URL: ?loc= and ?circuito=altadis_espana ask for the circuit; a malformed loc or another circuit do not', () => {
  assert.deepEqual(circuitoDesdeURL('?espacio=altadis-xtanco-08&loc=altadis-es-05-madrid&marca=altadis'), { loc: 'altadis-es-05-madrid', circuito: false, pide: true });
  assert.deepEqual(circuitoDesdeURL('?circuito=altadis_espana'), { loc: null, circuito: true, pide: true });
  assert.deepEqual(circuitoDesdeURL('?circuito=alsea_mexico'), { loc: null, circuito: false, pide: false });
  assert.deepEqual(circuitoDesdeURL('?loc=../../etc/passwd'), { loc: null, circuito: false, pide: false });
  assert.deepEqual(circuitoDesdeURL('?loc=<script>'), { loc: null, circuito: false, pide: false });
  assert.deepEqual(circuitoDesdeURL(''), { loc: null, circuito: false, pide: false }, 'without loc nothing changes');
  assert.equal(marcaDesdeURL('?marca=altadis'), 'altadis');
  assert.equal(marcaDesdeURL('?marca=Altadis'), 'altadis');
  assert.equal(marcaDesdeURL('?marca=alsea'), 'starbucks', 'alsea is Starbucks, as in the shell');
  assert.equal(marcaDesdeURL('?lang=en'), null);
});

test('space type with a brand: Altadis opens on Xtanco; an explicit type or space wins; no brand stays as before', () => {
  assert.equal(TIPO_DE_MARCA.altadis, 'xtanco');
  assert.equal(tipoInicial('?marca=altadis'), 'xtanco');
  assert.equal(tipoInicial('?marca=ALTADIS&lang=en'), 'xtanco');
  assert.equal(tipoInicial('?marca=altadis&tipo=cafe'), 'cafe', 'an explicit ?tipo= wins');
  assert.equal(tipoInicial('?marca=altadis&espacio=altadis-cafe-04'), 'cafe', 'the requested space wins');
  assert.equal(tipoInicial('?tipo=cafe'), 'cafe');
  assert.equal(tipoInicial(''), 'xtanco');
  assert.equal(tipoInicial('?marca=starbucks'), 'xtanco', 'other brands keep the default for now');
  assert.equal(tipoInicial('?tipo=otro&marca=altadis'), 'xtanco');
});

test('local fallback: a copy of the real index, the planned split, 10 Xtancos in 10 cities, valid for the contract', () => {
  assert.deepEqual(validarCircuito(RESPALDO), []);
  assert.equal(RESPALDO.schema, SCHEMA_CIRCUITO);
  assert.equal(RESPALDO.circuito, CIRCUITO);
  assert.equal(RESPALDO.respaldo, true);
  const c = normalizarCircuito(RESPALDO);
  assert.deepEqual(c.avisos, []);
  assert.deepEqual(c.locales.map(l => [l.tourOrder, l.ciudad, l.formato.slice(-2)]), REPARTO);
  for (const l of c.locales) {
    assert.ok(l.nombre && l.direccion, `${l.id}: real name and address, also if admira.biz fails`);
    assert.equal(l.espacio, `altadis-xtanco-${l.formato.slice(-2)}`);
    assert.equal(l.id, `altadis-es-${String(l.tourOrder).padStart(2, '0')}-${slug(l.ciudad)}`);
    assert.ok(formatoDe(INDICE, l.formato), `${l.formato} is one of the 18`);
    const [lng, lat] = l.coords;
    assert.ok(lng > -10 && lng < 4.5 && lat > 35.5 && lat < 44, `${l.ciudad} is in Spain`);
    assert.equal(l.mapa, `https://www.admira.biz/?circuit=altadis_espana&loc=${l.id}&marca=altadis`, 'same map link as the real index');
    assert.equal(l.mapa, enlaceMapa(l), 'and the one built when the index brings none');
  }
  assert.equal(new Set(c.locales.map(l => l.formato)).size, 10, 'each estanco a different format');
  assert.equal(c.locales.find(l => l.id === 'altadis-es-05-madrid').espacio, 'altadis-xtanco-08', 'the Madrid link of the brief');
});

test('circuit order: tour order whatever the index order, wrap-around arrows, invalid locales dropped with a warning', () => {
  const c = normalizarCircuito(REAL);
  assert.deepEqual(c.locales.map(l => l.tourOrder), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 'sorted by tourOrder');
  const madrid = buscarLocal(c, 'altadis-es-05-madrid');
  assert.equal(vecinoLocal(c, madrid.id, 1).ciudad, 'València');
  assert.equal(vecinoLocal(c, madrid.id, -1).ciudad, 'Zaragoza');
  assert.equal(vecinoLocal(c, 'altadis-es-10-granada', 1).ciudad, 'A Coruña', 'after the 10th, the 1st');
  assert.equal(vecinoLocal(c, 'altadis-es-01-a-coruna', -1).ciudad, 'Granada');
  assert.equal(vecinoLocal(c, null, 0).ciudad, 'A Coruña', 'the tour starts at the first');
  assert.equal(vecinoLocal(c, null, 1).ciudad, 'A Coruña');
  assert.equal(vecinoLocal(c, null, -1).ciudad, 'Granada');
  assert.equal(vecinoLocal({ locales: [] }, null, 1), null);
  // The tour visits the 10, each with its own format, and comes back.
  let l = vecinoLocal(c, null, 0); const vistos = [];
  for (let i = 0; i < 10; i++) { vistos.push(`${l.ciudad}:${formatoDeLocal(l)}`); l = vecinoLocal(c, l.id, 1); }
  assert.deepEqual(vistos, REPARTO.map(([, ciudad, f]) => `${ciudad}:cliente-${f}`));
  assert.equal(l.ciudad, 'A Coruña');

  const malo = clon(REAL);
  malo.locales.push({ ...malo.locales[0] });                                           // repeated id
  malo.locales.push({ id: 'cafe-1', ciudad: 'Madrid', tourOrder: 11, espacio: 'altadis-cafe-08' });  // not a Xtanco
  malo.locales.push({ ciudad: 'Toledo', tourOrder: 12, espacio: 'altadis-xtanco-02' });              // no id
  malo.locales.push({ id: 'sin-orden', ciudad: 'Cuenca', espacio: 'altadis-xtanco-03', formato: 'cliente-04', mapa: 'javascript:alert(1)' });
  const n = normalizarCircuito(malo);
  assert.equal(n.locales.length, 11);
  assert.equal(n.locales.at(-1).id, 'sin-orden', 'without tourOrder, last');
  assert.equal(n.locales.at(-1).formato, 'cliente-03', 'the format follows the space that opens');
  assert.equal(n.locales.at(-1).mapa, 'https://www.admira.biz/?circuit=altadis_espana&loc=sin-orden&marca=altadis', 'a bad link becomes the map of that local');
  assert.equal(n.avisos.length, 4);
  assert.ok(n.avisos.some(a => /repetido/.test(a)) && n.avisos.some(a => /no abre un Xtanco/.test(a)) && n.avisos.some(a => /sin id/.test(a)) && n.avisos.some(a => /cliente-04/.test(a)));
  assert.match(validarCircuito({ ...clon(REAL), schema: 'otro' })[0], /admira\.circuito-demo\/1/);
  assert.match(validarCircuito({ ...clon(REAL), circuito: 'alsea_mexico' })[0], /altadis_espana/);
  assert.match(validarCircuito({ ...clon(REAL), locales: [] })[0], /no trae locales/);
});

test('index sources: the real one in admira.biz first; a 404 falls back to the local copy without marking admira.biz down', async () => {
  assert.deepEqual(fuentesCircuito(), [
    { fuente: 'compartido', url: CIRCUITO_COMPARTIDO, timeoutMs: ESPERA_COMPARTIDO_MS },
    { fuente: 'local', url: CIRCUITO_LOCAL },
  ]);
  assert.equal(CIRCUITO_COMPARTIDO, 'https://www.admira.biz/data/xpacios/altadis-espana-10.json');
  // Today: admira.biz answers 404 (Pages HTML or JSON) → the local copy.
  const memoria = new Set();
  for (const r404 of [undefined, { status: 404, cuerpo: { error: 'not found' } }]) {
    const { fetchImpl, pedidas } = falso({ ...(r404 ? { [CIRCUITO_COMPARTIDO]: r404 } : {}), [CIRCUITO_LOCAL]: { cuerpo: RESPALDO } });
    const r = await cargarCircuito({ fetchImpl, memoria });
    assert.equal(r.fuente, 'local');
    assert.equal(r.respaldo, true);
    assert.equal(r.circuito.locales.length, 10);
    assert.deepEqual(pedidas.map(p => p.url), [CIRCUITO_COMPARTIDO, CIRCUITO_LOCAL], 'the real one is always tried first');
    assert.match(r.fallos[0].error, /HTTP 404|HTML/);
  }
  assert.equal(memoria.size, 0, 'a missing circuit index does not send the 36 plans to the local copy');
  // Once published, the real one wins.
  const real = await cargarCircuito({ fetchImpl: falso({ [CIRCUITO_COMPARTIDO]: { cuerpo: REAL }, [CIRCUITO_LOCAL]: { cuerpo: RESPALDO } }).fetchImpl });
  assert.equal(real.fuente, 'compartido');
  assert.equal(real.respaldo, false);
  assert.equal(real.circuito.locales[4].nombre, 'Estanco Exp. nº 167 · Fuencarral');
  // A real one that does not follow the contract → the copy.
  const otro = await cargarCircuito({ fetchImpl: falso({ [CIRCUITO_COMPARTIDO]: { cuerpo: { ...REAL, schema: 'otro' } }, [CIRCUITO_LOCAL]: { cuerpo: RESPALDO } }).fetchImpl });
  assert.equal(otro.fuente, 'local');
  assert.match(otro.fallos[0].error, /no válido/);
  // Nothing at all → error (the page ignores the loc and stays as without it).
  await assert.rejects(cargarCircuito({ fetchImpl: falso({}).fetchImpl }), /Ninguna fuente sirvió/);
});

test('loc: a known local opens with its format; an unknown one is ignored; the fallback matches by city; the URL space wins', () => {
  const real = normalizarCircuito(REAL), respaldo = normalizarCircuito(RESPALDO);
  const a = resolverInicio(real, { loc: 'altadis-es-05-madrid', espacio: 'altadis-xtanco-08' });
  assert.deepEqual([a.local.ciudad, a.espacio, a.corregido], ['Madrid', 'altadis-xtanco-08', false]);
  const b = resolverInicio(real, { loc: 'altadis-es-05-madrid' });
  assert.equal(b.espacio, 'altadis-xtanco-08', 'without espacio, the local\'s');
  assert.deepEqual(resolverInicio(real, { loc: 'no-existe' }), { local: null, espacio: null, corregido: false, origen: null });
  assert.equal(buscarLocal(real, 'otro-05-madrid'), null, 'the real index only by id');
  assert.equal(buscarLocal(real, null), null);
  // Fallback: the real map id is unknown to the copy; its city ends the id.
  const c = resolverInicio(respaldo, { loc: 'altadis-es-1-a-coruna' }, { flexible: true });
  assert.deepEqual([c.local.ciudad, c.local.id, c.corregido, c.origen], ['A Coruña', 'altadis-es-1-a-coruna', true, 'altadis-es-01-a-coruna'], 'keeps the URL id');
  assert.equal(buscarLocal(respaldo, 'estanco-coruna', { flexible: true }).ciudad, 'A Coruña');
  assert.equal(buscarLocal(respaldo, 'estanco-malaga-centro', { flexible: true }), null);
  // The map link carries the real split: if it differs from the copy, the URL space wins for that local.
  const d = resolverInicio(respaldo, { loc: 'altadis-es-05-madrid', espacio: 'altadis-xtanco-03' });
  assert.deepEqual([d.local.espacio, d.local.formato, d.espacio, d.corregido], ['altadis-xtanco-03', 'cliente-03', 'altadis-xtanco-03', true]);
  // ?circuito= with a space: the local of that space; a Starbucks space does not enter the circuit.
  assert.equal(resolverInicio(real, { espacio: 'altadis-xtanco-13' }).local.ciudad, 'Palma');
  assert.deepEqual(resolverInicio(real, { espacio: 'altadis-cafe-13' }), { local: null, espacio: null, corregido: false, origen: null });
  assert.equal(resolverInicio(real, { loc: 'altadis-es-07-palma', espacio: 'altadis-cafe-13' }).espacio, 'altadis-xtanco-13');
  assert.equal(localDeEspacio(real, 'altadis-xtanco-02'), null, 'format 02 is not in the circuit');
});

test('card texts and links: «Estanco <name> · <city>», its address, the map and shareable URLs', () => {
  const real = normalizarCircuito(REAL), respaldo = normalizarCircuito(RESPALDO);
  const madrid = buscarLocal(real, 'altadis-es-05-madrid');
  // Real names as they are, in both languages: no «Estanco Estanc…», «Estanco Tabacos Estanco…» or «Tobacconist El Palacio…».
  const titulos = en => real.locales.map(l => tituloLocal(l, en));
  assert.deepEqual(titulos(false), [
    'Estanco Riego de Agua · A Coruña', 'Estanco Exp. nº 2 · Bidebarrieta · Bilbao', 'Estanc Gran de Gràcia 61 · Barcelona',
    'Estanco nº 53 · San Ignacio de Loyola · Zaragoza', 'Estanco Exp. nº 167 · Fuencarral · Madrid', 'Estanco Del Carmen · València',
    "Estanc de l'Olivar · Exp. nº 21 · Palma", 'El Palacio del Fumador · Sevilla', 'Tabacos Estanco Larios · Málaga',
    'Estanco Reyes Católicos · Exp. nº 24 · Granada']);
  assert.deepEqual(titulos(true), titulos(false), 'a proper name is not translated');
  for (const t of titulos(false)) assert.doesNotMatch(t, /^(Estanco|Tobacconist) (Estanc|Estanco|Tabacos|El )/, t);
  assert.equal(tituloLocal(madrid, false, { ciudad: false }), 'Estanco Exp. nº 167 · Fuencarral', 'the gallery puts the city apart');
  assert.equal(tituloLocal({ nombre: 'Estanco de Madrid', ciudad: 'Madrid' }), 'Estanco de Madrid', 'no «Madrid · Madrid»');
  // Only the generic name (an index without a proper name) gets «Estanco de / Tobacconist in».
  const generico = normalizarCircuito(GENERICO);
  assert.equal(tituloLocal(buscarLocal(generico, 'altadis-es-08-sevilla')), 'Estanco de Sevilla');
  assert.equal(tituloLocal(buscarLocal(generico, 'altadis-es-08-sevilla'), true), 'Tobacconist in Sevilla');
  assert.equal(tituloLocal(buscarLocal(generico, 'altadis-es-08-sevilla'), false, { ciudad: false }), 'Estanco de Sevilla');
  assert.equal(tituloLocal(null), '');
  assert.equal(madrid.direccion, 'Calle de Fuencarral 2 · 28004 Madrid');
  assert.equal(madrid.mapa, 'https://www.admira.biz/?circuit=altadis_espana&loc=altadis-es-05-madrid&marca=altadis', 'the map link of the index');
  assert.equal(buscarLocal(generico, 'altadis-es-05-madrid').mapa, madrid.mapa, 'without a link, the same one is built');
  assert.equal(enlaceMapa({ id: 'altadis-es-05-madrid' }), 'https://www.admira.biz/?circuit=altadis_espana&loc=altadis-es-05-madrid&marca=altadis');
  assert.equal(enlaceMapa(null), 'https://www.admira.biz/?circuit=altadis_espana&marca=altadis');
  assert.equal(queryEspacio({ espacio: 'altadis-xtanco-08', loc: 'altadis-es-05-madrid', marca: 'altadis' }), '?espacio=altadis-xtanco-08&loc=altadis-es-05-madrid&marca=altadis');
  assert.equal(queryEspacio({ circuito: 'altadis_espana', lang: 'en' }), '?circuito=altadis_espana&lang=en');
  assert.equal(queryEspacio({ espacio: 'altadis-cafe-03', lang: 'en', auto: true }), '?espacio=altadis-cafe-03&lang=en&auto=1', 'unchanged without loc');
});

test('«Volver al mapa» only goes to https://www.admira.biz/: a link to another domain is replaced by the local map', () => {
  const conMapa = mapa => normalizarCircuito({ ...clon(REAL), locales: [{ ...clon(RESPALDO.locales[4]), mapa }] }).locales[0].mapa;
  const propio = 'https://www.admira.biz/?circuit=altadis_espana&loc=altadis-es-05-madrid&marca=altadis';
  assert.equal(conMapa('https://www.admira.biz/mapa.html?circuit=altadis_espana'), 'https://www.admira.biz/mapa.html?circuit=altadis_espana', 'any admira.biz page is fine');
  for (const ajeno of ['https://evil.example/?circuit=altadis_espana', 'https://www.admira.biz.evil.example/', 'https://admira.biz/', 'https://www.admira.biz@evil.example/',
    'http://www.admira.biz/', '//www.admira.biz/', 'javascript:alert(1)', 'https://www.admira.biz/"><script>', null]) {
    assert.equal(conMapa(ajeno), propio, String(ajeno));
  }
});

test('the page: local block above the format with «Volver al mapa» ES/EN, circuit mode in the viewer, brand tokens in the CSS', () => {
  const html = read('xpacios/altadis-18/index.html');
  const local = html.indexOf('id="f-local"'), formato = html.indexOf('id="f-eyebrow"');
  assert.ok(local > 0 && local < formato, 'the estanco goes above the format');
  assert.match(html, /<div id="f-local" class="estanco" hidden>/, 'hidden without loc');
  assert.match(html, /id="f-mapa"[^>]*data-es="← Volver al mapa" data-en="← Back to the map"/);
  assert.equal((html.match(/class="grupo grupo-tipo"/g) || []).length, 2, 'both type toggles can hide in circuit mode');
  assert.match(html, /data-salir-circuito hidden/);
  const visor = read('xpacios/altadis-18/visor.mjs');
  const versiones = new Set([...visor.matchAll(/from '\.\/[a-z]+\.mjs\?v=([^']+)'/g)].map(m => m[1]));
  assert.equal(versiones.size, 1, 'one module version: espacios.mjs is not loaded twice');
  assert.match(read('xpacios/altadis-18/circuito.mjs'), new RegExp(`espacios\\.mjs\\?v=${[...versiones][0]}'`));
  assert.match(html, new RegExp(`visor\\.mjs\\?v=${[...versiones][0]}"`));
  assert.match(visor, /const circuito = pedidoCircuito\.pide \? cargarCircuito\(\)/, 'the circuit index only when the URL asks for it');
  assert.match(visor, /if \(st\.enCircuito\) \{ const l = vecinoLocal\(st\.circuito, st\.local\?\.id, d\)/, 'arrows and the tour follow the circuit');
  assert.match(visor, /if \(st\.local\) u\.searchParams\.set\('loc', st\.local\.id\)/, 'changing space updates loc');
  assert.match(visor, /if \(!inicio\.local && !pedidoCircuito\.circuito\) return null/, 'an unknown loc is ignored');
  assert.match(visor, /tipo: tipoInicial\(location\.search\)/);
  const css = read('xpacios/altadis-18/altadis.css');
  const marca = css.slice(css.indexOf(':root[data-mb-marca]{'));
  for (const token of ['--mb-fondo', '--mb-superficie', '--mb-borde', '--mbx-ink', '--mbx-brand', '--mbx-on-brand', '--mb-secundario', '--mb-acento']) assert.ok(marca.includes(`var(${token}`), token);
  assert.match(css, /#a18\[data-circuito\] \.grupo-tipo\{display:none\}/);
  assert.match(css, /\.estanco\{[^}]*background:var\(--local\)/);
  assert.doesNotMatch(css.slice(0, css.indexOf(':root[data-mb-marca]{')), /#14262a;border|background:#0b1518|background:#0f4a3a/, 'colours go through tokens so the brand can take them');
});

test('the shell applies ?marca=altadis on this page: it loads the white label; a circuit loc alone does not', () => {
  const require = createRequire(import.meta.url);
  const SHELL = require(repo + 'assets/xpace-shell.js');
  const memoria = () => ({ getItem: () => null, setItem() {}, removeItem() {} });
  assert.ok(SHELL.wantsBrand('?espacio=altadis-xtanco-08&loc=altadis-es-05-madrid&marca=altadis', memoria()));
  assert.equal(SHELL.wantsBrand('?espacio=altadis-xtanco-08&loc=altadis-es-05-madrid', memoria()), false, 'a circuit loc alone does not ask for a brand');
  const html = read('xpacios/altadis-18/index.html');
  assert.match(html, /<script defer src="\/assets\/xpace-shell\.js\?v=/, 'the page loads the common shell, which inserts marca-blanca.js');
});
