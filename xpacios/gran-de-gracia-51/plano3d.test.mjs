// Gemelo 3D del laboratorio Gran de Gràcia 51 (DCL-6ae9d5b0e2d48ee2fd9c7b19): el plano canónico
// admira.xpacio-plano/1, su paso a 3D y la elección de fuente (admira.biz compartido o copia local).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  SCHEMA, validatePlan, panelSize, footprint, wallSolids, escenaDesdePlano, colocarDispositivo,
  vistaWebcam, vistaAlzado, vistaPuerta, cargarPlano, comprobarSesion, PLANO_COMPARTIDO, PLANO_LOCAL, ALZADO_FONDO, inwardNormal,
} from './plano3d.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
// El repositorio es público: guarda la versión pública del plano. El completo (ITIL, screenIds,
// dirección) vive en admira.biz; aquí se reconstruye con datos de prueba para ejercitar ese camino.
const PUBLICO = JSON.parse(read('data/xpacios/lab-gran-de-gracia-51.json'));
const STARBUCKS_SIX = ['macmini-starbucks-vertical', 'macmini-starbucks-horizontal', 'macmini-starbucks-vertical-right',
  'macstudio-starbucks-vertical', 'macstudio-starbucks-horizontal', 'macstudio-starbucks-vertical-right'];
const PLAN = {
  ...PUBLICO, publico: undefined, direccion: 'Calle de Prueba 1 · 08000 Barcelona',
  pantallas: PUBLICO.pantallas.map((s, i) => ({ ...s, itil: `TEST-PAN-0${i + 1}`, ...(i < 6 ? { screenId: STARBUCKS_SIX[i] } : {}) })),
  dispositivos: PUBLICO.dispositivos.map((d, i) => ({ ...d, itil: `TEST-DEV-0${i + 1}` })),
};
delete PLAN.publico;
const cerca = (a, b, eps = 0.002) => Math.abs(a - b) <= eps;

test('the repository keeps the public lab plan: valid admira.xpacio-plano/1 geometry, 7 screens, no ITIL map', () => {
  const { errores, avisos } = validatePlan(PUBLICO);
  assert.deepEqual(errores, []);
  assert.deepEqual(avisos, [], 'walls run clockwise and close');
  assert.equal(PUBLICO.schema, SCHEMA);
  assert.equal(PUBLICO.id, 'lab-gran-de-gracia-51');
  assert.equal(PUBLICO.publico, true);
  assert.deepEqual(PUBLICO.paredes.map(w => w.id), ['F', 'D', 'P', 'I']);
  assert.equal(PUBLICO.pantallas.length, 7);
  assert.ok(PUBLICO.pantallas.some(s => s.pulgadas === 16.2 && /integrada/.test(s.nombre)));
  const texto = JSON.stringify(PUBLICO);
  for (const prohibido of ['"itil', 'screenId', 'yokup', 'GDG51', 'starbucks', '08012', 'Carrer', 'Carlos']) assert.ok(!texto.includes(prohibido), prohibido);
});

test('the copied plano-core geometry measures 27″ and 16,2″ panels like the 2D plan', () => {
  const h = panelSize({ pulgadas: 27 }), v = panelSize({ pulgadas: 27, orientacion: 'vertical' });
  assert.ok(cerca(h.w, 0.5977) && cerca(h.h, 0.3362), JSON.stringify(h));
  assert.ok(cerca(v.w, h.h) && cerca(v.h, h.w));
  const mbp = PLAN.pantallas.find(s => s.pulgadas === 16.2), f = footprint(mbp);
  assert.ok(cerca(f.w, 0.3455) && cerca(f.h, 0.2234), JSON.stringify(f));
});

test('walls keep their openings: solid parts plus openings fill each elevation', () => {
  assert.deepEqual(wallSolids(2, 3, []), [{ s0: 0, s1: 2, z0: 0, z1: 3 }]);
  const e = escenaDesdePlano(PLAN);
  for (const w of e.paredes) {
    const macizo = w.macizos.reduce((a, r) => a + (r.s1 - r.s0) * (r.z1 - r.z0), 0);
    const huecos = w.huecos.reduce((a, h) => a + h.ancho * h.alto, 0);
    assert.ok(cerca(macizo + huecos, w.len * w.alto, 1e-6), w.id);
  }
  assert.equal(e.paredes.find(w => w.id === 'I').macizos.length, 1, 'the 3D panel wall has no opening');
  assert.equal(e.paredes.find(w => w.id === 'D').huecos[0].id, 'pasillo');
});

test('screens stand on their desks, face the room and group as V–H–V per player', () => {
  const e = escenaDesdePlano(PLAN, { colocacion: { macmini: 'bajo-mesa' } });
  assert.equal(e.pantallas.length, 7);
  for (const p of e.pantallas) {
    assert.ok(p.centro[0] > 0 && p.centro[0] < e.sala.ancho && p.centro[1] > 0 && p.centro[1] < e.sala.fondo, `${p.id} inside the room`);
    assert.ok(p.apoyo, `${p.id} rests on a desk`);
    assert.ok(p.separacion > 0.05 && p.separacion < 0.7, `${p.id} between wall and desk edge`);
    const w = e.paredes.find(x => x.id === p.pared);
    assert.deepEqual(p.n, w.n);
    assert.ok(cerca(Math.sin(p.yaw), w.n[0], 1e-9) && cerca(Math.cos(p.yaw), w.n[1], 1e-9), `${p.id} faces inwards`);
  }
  assert.deepEqual(e.grupos.map(g => [g.id, g.pared, g.composicion, g.player]), [['mosaico-1', 'F', 'V–H–V', 'Mac mini'], ['mosaico-2', 'I', 'V–H–V', 'Mac Studio']]);
  assert.equal(e.pantallas.find(p => p.portatil)?.pulgadas, 16.2, 'the MacBook Pro 16 is drawn as a laptop');
  assert.equal(e.pantallas.find(p => p.screenId === 'macstudio-starbucks-horizontal').textura,
    'https://admira.studio/assets/demos/starbucks-six/captures-r2/starbucks-six-r2-frame-macstudio-starbucks-horizontal.jpg');
  assert.equal(e.pantallas.find(p => p.portatil).textura, null, 'no invented capture for the MacBook');
});

test('players and webcam are placed from their screens when the plan has no position', () => {
  const e = escenaDesdePlano(PLAN, { colocacion: { macmini: 'bajo-mesa' } });
  const d = id => e.dispositivos.find(x => x.id === id);
  assert.equal(d('webcam').colocacion, 'sobre-pantalla');
  assert.equal(e.pantallas.find(p => p.id === d('webcam').sobre).screenId, 'macmini-starbucks-horizontal', 'on the Mac mini H');
  assert.equal(d('macstudio').colocacion, 'sobre-mesa');
  assert.equal(d('macstudio').pos[2], 0.75, 'on the long desk top');
  assert.equal(d('macmini').colocacion, 'bajo-mesa');
  assert.equal(d('macmini').pos[2], 0);
  assert.equal(d('mbp16').colocacion, 'pantalla');
  assert.ok(e.dispositivos.filter(x => x.deducida).length === 3 && !d('webcam').deducida);
  const huerfano = colocarDispositivo({ id: 'x', nombre: 'Otro player', categoria: 'player' }, PLAN, e.pantallas);
  assert.equal(huerfano.colocacion, 'sin-posicion');
  assert.equal(huerfano.pos, null);
});

test('views: webcam pan follows the PTZ convention, elevations clip a band in front of the wall', () => {
  const e = escenaDesdePlano(PLAN);
  const dir = v => { const x = v.objetivo[0] - v.pos[0], y = v.objetivo[1] - v.pos[1]; const n = Math.hypot(x, y); return [x / n, y / n]; };
  const [nx, ny] = inwardNormal(PLAN.paredes[0]);
  const v0 = vistaWebcam(e, { pan: 0, tilt: 0 });
  assert.ok(cerca(dir(v0)[0], nx, 1e-9) && cerca(dir(v0)[1], ny, 1e-9), 'pan 0 looks into the room');
  const v90 = vistaWebcam(e, { pan: 90, tilt: 0 });
  assert.ok(dir(v90)[0] < -0.99, 'positive pan turns right, towards wall I');
  const cal = vistaWebcam(e, { pan: 60, tilt: 0, panCero: -27 }), raw = vistaWebcam(e, { pan: 33, tilt: 0 });
  assert.ok(cerca(dir(cal)[0], dir(raw)[0], 1e-9) && cal.panCero === -27);
  const a = vistaAlzado(e, 'I');
  assert.equal(a.tipo, 'alzado');
  assert.ok(cerca(a.far - a.near, ALZADO_FONDO + 0.6, 1e-9));
  assert.equal(vistaAlzado(e, 'Z'), null);
  assert.equal(vistaPuerta(e).hueco, 'pasillo');
});

function respuesta(cuerpo, { status = 200, tipo = 'application/json' } = {}) {
  return { ok: status >= 200 && status < 300, status, headers: { get: k => (k.toLowerCase() === 'content-type' ? tipo : null) }, json: async () => (typeof cuerpo === 'string' ? JSON.parse(cuerpo) : cuerpo) };
}

test('with a session the shared admira.biz plan wins; HTML, errors, other Xpacios or invalid plans fall back to the local copy', async () => {
  const ID = 'lab-gran-de-gracia-51';
  assert.equal(PLANO_COMPARTIDO(ID), 'https://www.admira.biz/data/xpacios/lab-gran-de-gracia-51.json');
  assert.equal(PLANO_LOCAL(ID), '/data/xpacios/lab-gran-de-gracia-51.json');
  const pedidas = [];
  const fetchCon = compartido => async url => { pedidas.push(url); return url.startsWith('https://') ? compartido() : respuesta(PLAN); };
  const ok = await cargarPlano(ID, { sesion: true, fetchImpl: fetchCon(() => respuesta({ ...PLAN, version: 'compartida' })) });
  assert.equal(ok.fuente, 'compartido');
  assert.equal(ok.acceso, 'sesion');
  assert.equal(ok.plan.version, 'compartida');
  assert.equal(ok.plan.pantallas[0].itil, 'TEST-PAN-01');
  assert.deepEqual(pedidas, [PLANO_COMPARTIDO(ID)], 'no local request when the shared plan is good');
  const casos = [
    ['HTML portal', () => respuesta('<!doctype html>', { tipo: 'text/html; charset=utf-8' }), /HTML/],
    ['404', () => respuesta({}, { status: 404 }), /HTTP 404/],
    ['network or CORS', () => { throw new TypeError('Failed to fetch'); }, /Failed to fetch/],
    ['other Xpacio', () => respuesta({ ...PLAN, id: 'alsea-sbux-021' }), /alsea-sbux-021/],
    ['invalid plan', () => respuesta({ ...PLAN, pantallas: [{ id: 'x', pared: 'Q' }] }), /no válido/],
  ];
  for (const [nombre, compartido, motivo] of casos) {
    const r = await cargarPlano(ID, { sesion: true, fetchImpl: fetchCon(compartido) });
    assert.equal(r.fuente, 'local', nombre);
    assert.equal(r.plan.id, ID, nombre);
    assert.equal(r.fallos.length, 1, nombre);
    assert.match(r.fallos[0].error, motivo, nombre);
  }
  const caducada = await cargarPlano(ID, { sesion: true, fetchImpl: async url => (url.startsWith('https://') ? respuesta({}, { status: 404 }) : respuesta(PUBLICO)) });
  assert.equal(caducada.acceso, 'publico', 'the server answered with the public plan: show the public view');
  await assert.rejects(cargarPlano(ID, { sesion: true, fetchImpl: async () => respuesta({}, { status: 500 }) }), e => e.fallos.length === 2);
  await assert.rejects(cargarPlano('../secreto', { fetchImpl: async () => respuesta(PLAN) }), /no válido/);
});

test('without a session only this site is asked, never admira.biz, and the plan is cut to its public version', async () => {
  const pedidas = [];
  const r = await cargarPlano('lab-gran-de-gracia-51', { fetchImpl: async url => { pedidas.push(url); return respuesta(PLAN); } });
  assert.deepEqual(pedidas, ['/data/xpacios/lab-gran-de-gracia-51.json']);
  assert.equal(r.acceso, 'publico');
  assert.equal(r.plan.publico, true);
  assert.ok(!JSON.stringify(r.plan).includes('TEST-PAN') && !JSON.stringify(r.plan).includes('starbucks'), 'no ITIL codes or screenIds even if the server sent them');
  assert.equal(r.plan.direccion, 'Prueba · Barcelona');
});

test('the session check reads /auth/session and treats any failure as no session', async () => {
  const con = res => ({ fetchImpl: async (url, opts) => { assert.equal(url, '/auth/session'); assert.equal(opts.credentials, 'same-origin'); return res(); } });
  assert.equal(await comprobarSesion(con(() => respuesta({ ok: true, email: 'x@admira.com' }))), true);
  assert.equal(await comprobarSesion(con(() => respuesta({ ok: false }, { status: 401 }))), false);
  assert.equal(await comprobarSesion(con(() => respuesta({ ok: false }))), false);
  assert.equal(await comprobarSesion(con(() => { throw new TypeError('offline'); })), false);
  assert.equal(await comprobarSesion(con(() => respuesta('<!doctype html>', { tipo: 'text/html' }))), false);
});

test('the page loads the shell, registers /redistribucion for the lab, hides the exact address and is listed', () => {
  const html = read('xpacios/gran-de-gracia-51/index.html');
  const portada = read('index.html');
  const version = (portada.match(/\/assets\/xpace-shell\.js\?v=([^"'&\s]+)/) || [])[1];
  assert.ok(html.includes(`/assets/xpace-shell.js?v=${version}`), 'current shell release');
  assert.match(html, /plano:'lab-gran-de-gracia-51'/);
  assert.match(html, /por confirmar con metro/);
  for (const exacta of ['Carrer', '08012', '1.ª planta', 'Gran de Gràcia 51', 'admira.biz/plano.html', 'retailer#itil']) assert.ok(!html.includes(exacta), exacta);
  const js = read('xpacios/gran-de-gracia-51/gemelo.mjs');
  assert.match(js, /https:\/\/www\.admira\.biz\/plano\.html\?locationId=/, 'the 2D plan link is added only with a session');
  assert.match(js, /https:\/\/admira\.app\/retailer#itil/);
  assert.doesNotMatch(js + html, /canal(\.html)?\?screen=/, 'never opens a real screen channel (it would broadcast as that screen)');
  const lista = read('xpacios/index.html');
  assert.match(lista, /href="\/xpacios\/gran-de-gracia-51\/"/);
  assert.ok(!/Gran de Gràcia 51|GDG51|CI ITIL/.test(lista), 'the public listing does not expose the exact address or the inventory');
});

// ── Orden «modelar» del Arquitecto (18-oct-2026): la colocación del gemelo sale del plano ──
import { layoutGemelo, modeloCatalogo, tipoMueble, TIPOS_MUEBLE } from './plano3d.mjs';
import '../../admira-xp/scripts/starbucks-room.js';

test('Paseo de Gràcia: the twin layout comes out of the plan, piece by piece (placement as data)', () => {
  const plan = JSON.parse(readFileSync(`${repo}data/xpacios/alsea-sbux-021.json`, 'utf8'));
  const desdePlano = new Map(layoutGemelo(plan).map(i => [i.id, i])), gemelo = globalThis.XpaceStarbucks.layout();
  assert.equal(desdePlano.size, gemelo.length);
  for (const it of gemelo) {
    const p = desdePlano.get(it.id);
    assert.ok(p, it.id);
    assert.deepEqual([p.type, p.inventoryAssetId, p.col, p.row, p.fp, p.mountY], [it.type, it.inventoryAssetId, it.col, it.row, it.fp, it.mountY], it.id);
  }
});

test('an explicit furniture type wins over the name, and catalogue pieces point at their 3D model', () => {
  assert.equal(tipoMueble({ id: 'x', nombre: 'Mesa', tipo: 'cesta' }), 'cesta');
  assert.equal(tipoMueble({ id: 'x', nombre: 'Mesa', tipo: 'inventado' }), 'mesa');
  assert.ok(TIPOS_MUEBLE.includes('ipad'));
  assert.equal(modeloCatalogo({ catalogo: { id: 'native:starbucksCupBasket', numero: 53 } }), '/inventario/assets/catalog/53/better.glb');
  assert.equal(modeloCatalogo({ catalogo: { id: 'native:x', numero: 0 } }), null);
  assert.equal(modeloCatalogo({}), null);
  const escena = escenaDesdePlano(JSON.parse(readFileSync(`${repo}data/xpacios/alsea-sbux-021.json`, 'utf8')));
  assert.deepEqual(escena.muebles.filter(m => m.catalogo).map(m => m.catalogo.numero), [52, 53, 54, 55]);
});
