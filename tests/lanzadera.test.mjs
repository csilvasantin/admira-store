// AdmiraDesk · lanzadera (26-nov-2026): una sola fuente (lanzadera.json), una sola ruta de acción y paridad
// entre el Stream Deck XL (ruta de máquina) y el gemelo de control (ruta con login). Todo en seco y sin red.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import cfg from '../control/admiradesk/lanzadera.json' with {type: 'json'};
import * as L from '../control/admiradesk/lanzadera.mjs';
import {onRequest as apiGemelo} from '../functions/control/admiradesk/api/[[path]].js';
import {onRequest as apiObjeto, lanzaderaMaquina} from '../functions/objeto/stream-deck/api/[[path]].js';
import {almacenMemoria, ejecutar, enVivo, STOCK} from '../functions/_lanzadera.js';
import {isPublicPath, isDocumentPath, isInternalPath} from '../functions/_perimetro.js';

const SITE = 'https://www.admira.store';
const CLAVE = 'Bearer sc_' + 'a'.repeat(64);
const stock = JSON.parse(readFileSync(new URL('./fixtures/lanzadera-stock.json', import.meta.url), 'utf8'));
const red = [];
const fetcher = async (url) => { if (String(url).startsWith(STOCK)) return Response.json(stock); red.push(String(url)); throw new Error('sin red'); };
const sesion = async () => ({email: 'prueba@admira'});

function gemelo(almacen, ahora) {
  return async (ruta, cuerpo) => {
    const init = cuerpo ? {method: 'POST', headers: {Origin: SITE, 'Content-Type': 'application/json'}, body: JSON.stringify(cuerpo)} : {};
    const r = await apiGemelo({request: new Request(SITE + '/control/admiradesk/api/' + ruta, init), env: {}, params: {path: [ruta]}}, fetcher, {readSession: sesion, almacen, ahora: ahora()});
    return r.json();
  };
}
function fisico(almacen, ahora) {
  return async (ruta, cuerpo) => {
    const init = {method: cuerpo ? 'POST' : 'GET', headers: {Authorization: CLAVE}, body: cuerpo ? JSON.stringify(cuerpo) : undefined};
    const r = await lanzaderaMaquina(new Request(SITE + '/objeto/stream-deck/api/lanzadera/' + ruta, init), {}, ruta, fetcher, {almacen, ahora: ahora()});
    return r.json();
  };
}

test('lanzadera.json es válida, 8×4 y sin pilares', () => {
  assert.deepEqual(L.validar(cfg), []);
  for (const p of ['inicio', 'show', 'demos', 'contenidos', 'equipos', 'sala']) assert.ok(cfg.paginas[p], p);
  assert.doesNotMatch(JSON.stringify(cfg), /mac\s*studio|macstudio|mac\s*mini|macmini/i);
  assert.deepEqual(cfg.pcsEnergia, ['01', '02', '03', '04', '05']);
  assert.doesNotMatch(JSON.stringify(cfg), /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|([0-9a-f]{2}:){5}[0-9a-f]{2}/i, 'sin IPs ni MACs');
});

test('validar rechaza un pilar, una energía fuera de 01-05 y una URL no https', () => {
  const malo = structuredClone(cfg);
  malo.carruseles.zona.destinos.push({e: 'MacStudio', pantalla: 'macstudio-a', pc: '06'});
  malo.sala.contenidos.x = {titulo: 'x', url: 'http://x'};
  const e = L.validar(malo).join(' | ');
  assert.match(e, /pilar/); assert.match(e, /pc fuera de 01-05/); assert.match(e, /no https/);
});

test('las teclas de energía piden doble pulsación dentro de la ventana', () => {
  let e = L.estadoInicial(cfg); const ctx = (ahora) => ({ahora, piezas: []});
  e = L.pulsar(cfg, e, {tecla: '5,1'}, ctx(0)).estado;            // Equipos
  e = L.pulsar(cfg, e, {tecla: '1,3'}, ctx(1)).estado;            // marca 01
  let r = L.pulsar(cfg, e, {tecla: '2,0'}, ctx(10));               // Apagar: arma
  assert.equal(r.respuesta.resultado, 'armado'); assert.equal(r.ordenes.length, 0);
  const tarde = L.pulsar(cfg, r.estado, {tecla: '2,0'}, ctx(10 + cfg.dobleToqueMs + 1));
  assert.equal(tarde.ordenes.length, 0, 'fuera de la ventana vuelve a armar');
  const otra = L.pulsar(cfg, r.estado, {tecla: '1,0'}, ctx(20));   // otra tecla de energía no confirma
  assert.equal(otra.ordenes.length, 0);
  r = L.pulsar(cfg, r.estado, {tecla: '2,0'}, ctx(500));
  assert.deepEqual(r.ordenes, [{via: 'panel', ruta: '/apagar', cuerpo: {pcs: ['01']}}]);
});

test('energía solo sobre PCs 01-05 (las verticales no cuentan)', () => {
  let e = L.estadoInicial(cfg); const c = {ahora: 0, piezas: []};
  e = L.pulsar(cfg, e, {tecla: '5,1'}, c).estado;
  e.sel.zona = {'01V': true, '03V': true};
  const r = L.pulsar(cfg, e, {tecla: '1,0'}, c);
  assert.equal(r.respuesta.resultado, 'sin-destino'); assert.equal(r.ordenes.length, 0);
});

test('pieza #streamdeck: sincro (playat) entre PCs y loop en verticales', () => {
  const piezas = L.piezasDeStock(stock);
  assert.deepEqual(piezas.map((p) => p.num), [102, 103, 101], 'prioridad y lo último primero; sin ocultas');
  let e = L.estadoInicial(cfg); const c = {ahora: 0, piezas};
  e = L.pulsar(cfg, e, {tecla: '4,1'}, c).estado;
  e.sel.zona = {'02': true, '03': true, '01V': true};
  const r = L.pulsar(cfg, e, {tecla: '1,0'}, c);
  assert.deepEqual(r.ordenes, [
    {via: 'cmd', id: 'admiranext02-a', cmd: 'playat-102', sincro: true},
    {via: 'cmd', id: 'admiranext03-a', cmd: 'playat-102', sincro: true},
    {via: 'cmd', id: 'admiranext01-b', cmd: 'loop102', sincro: undefined}]);
});

test('Sala Terminator: abre contenidos de la lista blanca en Philips y Pizarra (Chrome del MBP14)', () => {
  let e = L.estadoInicial(cfg); const c = {ahora: 0, piezas: []};
  e = L.pulsar(cfg, e, {tecla: '6,1'}, c).estado;
  assert.equal(L.pulsar(cfg, e, {tecla: '1,0'}, c).respuesta.resultado, 'sin-destino');
  e = L.pulsar(cfg, e, {tecla: '3,3'}, c).estado;   // Ambas
  assert.deepEqual(L.pulsar(cfg, e, {tecla: '1,0'}, c).ordenes, [
    {via: 'cmd', id: 'terminator-philips-vigilante', cmd: 'abrir-canal'},
    {via: 'cmd', id: 'terminator-pizarra-vigilante', cmd: 'abrir-canal'}]);
});

test('PARIDAD: misma secuencia en el físico y en el gemelo = mismas órdenes y misma cara, tecla a tecla', async () => {
  const secuencia = ['1,3', '2,3', '7,3', '3,3', '0,3', '1,3', '3,1', '4,1', '1,0', '7,2', '0,0', '5,1', '2,0', '2,0', '6,1', '3,3', '2,0', '0,0', '1,1', '2,0', '0,0'];
  const correr = async (via) => {
    const almacen = almacenMemoria(); let t = Date.UTC(2026, 10, 26, 11); const ahora = () => t;
    const api = via === 'fisico' ? fisico(almacen, ahora) : gemelo(almacen, ahora);
    const pasos = [];
    for (const tecla of secuencia) { t += 700; const r = await api('pulsar', {tecla, dry: true}); pasos.push({ordenes: r.ordenes.map(({simulado, ...o}) => o), huella: r.huella, teclas: r.teclas, origen: r.ultima.origen}); }
    return pasos;
  };
  const a = await correr('fisico'), b = await correr('gemelo');
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.deepEqual(a[i].ordenes, b[i].ordenes, 'órdenes del paso ' + (i + 1));
    assert.equal(a[i].huella, b[i].huella, 'cara del paso ' + (i + 1));
    assert.deepEqual(a[i].teclas.map((t) => t.svg), b[i].teclas.map((t) => t.svg));
    assert.equal(a[i].origen, 'fisico'); assert.equal(b[i].origen, 'gemelo');
  }
  assert.ok(a.some((p) => p.ordenes.length), 'la secuencia genera órdenes');
  assert.deepEqual(red, [], 'en seco no sale nada a la red');
});

test('SINCRONÍA: lo que se pulsa en una cara se ve en la otra (mismo estado)', async () => {
  const almacen = almacenMemoria(); const ahora = () => 1000;
  const F = fisico(almacen, ahora), G = gemelo(almacen, ahora);
  await F('pulsar', {tecla: '6,1'});
  assert.equal((await G('cara')).pagina, 'sala');
  await G('pulsar', {tecla: '0,0'});
  const cf = await F('cara'), cg = await G('cara');
  assert.equal(cf.pagina, 'inicio'); assert.equal(cf.huella, cg.huella);
  assert.equal(cg.ultima.origen, 'gemelo');
});

test('seguridad: el gemelo de control exige login, mismo origen y cuenta con escritura', async () => {
  const almacen = almacenMemoria();
  const pedir = (init, opciones) => apiGemelo({request: new Request(SITE + '/control/admiradesk/api/pulsar', init), env: {}, params: {path: ['pulsar']}}, fetcher, {almacen, ...opciones});
  const cuerpo = JSON.stringify({tecla: '1,1'});
  assert.equal((await pedir({method: 'POST', headers: {Origin: SITE}, body: cuerpo}, {readSession: async () => null})).status, 401);
  assert.equal((await pedir({method: 'POST', headers: {Origin: 'https://malo.example'}, body: cuerpo}, {readSession: sesion})).status, 403);
  assert.equal((await pedir({method: 'POST', headers: {Origin: SITE}, body: cuerpo}, {readSession: async () => ({email: 'x', lectura: true})})).status, 403);
  const sinNube = await apiGemelo({request: new Request(SITE + '/control/admiradesk/api/cara'), env: {}, params: {path: ['cara']}}, fetcher, {readSession: sesion});
  assert.equal(sinNube.status, 503, 'sin clave de la nube no hay control');
});

test('seguridad: la ruta de máquina exige la clave Bearer y no abre CORS al gemelo público', async () => {
  const r = await apiObjeto({request: new Request(SITE + '/objeto/stream-deck/api/lanzadera/cara', {headers: {Origin: 'https://www.ainimation.studio'}}), env: {}, params: {path: ['lanzadera', 'cara']}}, fetcher);
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  const p = await apiObjeto({request: new Request(SITE + '/objeto/stream-deck/api/lanzadera/pulsar', {method: 'POST', body: '{"tecla":"1,1"}'}), env: {}, params: {path: ['lanzadera', 'pulsar']}}, fetcher);
  assert.equal(p.status, 401);
});

test('perímetro: /control/admiradesk/ y su API van tras el login de Google', () => {
  for (const ruta of ['/control/admiradesk/', '/control/admiradesk/api/cara', '/control/admiradesk/api/pulsar']) {
    assert.equal(isPublicPath(ruta), false, ruta);
    assert.equal(isDocumentPath(ruta), true, ruta + ' es documento: sin sesión el perímetro manda al login');
  }
  assert.equal(isInternalPath('/scripts/lanzadera-local.mjs'), true, 'la vista local no se publica');
});

test('en vivo solo con LANZADERA_EN_VIVO=1 y sin dry; en seco no se envía nada', async () => {
  assert.equal(enVivo({}, {}), false);
  assert.equal(enVivo({LANZADERA_EN_VIVO: '1'}, {dry: true}), false);
  assert.equal(enVivo({LANZADERA_EN_VIVO: '1'}, {}), true);
  const r = await ejecutar([{via: 'cmd', id: 'admiranext02-a', cmd: 'next'}], {}, async () => { throw new Error('no debería llamar'); }, true);
  assert.equal(r.dry, true); assert.equal(r.ok, 1);
  const sinPanel = await ejecutar([{via: 'panel', ruta: '/apagar', cuerpo: {pcs: ['01']}}], {LANZADERA_EN_VIVO: '1'}, fetcher, false);
  assert.equal(sinPanel.detalle[0].error, 'panel_no_configurado');
});

test('cara: 32 teclas con SVG 144×144, flecha y respuesta pintadas igual para todos', () => {
  const c = L.cara(cfg, L.estadoInicial(cfg), {ahora: 0, piezas: []});
  assert.equal(c.length, 32);
  for (const t of c) assert.match(t.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="144" height="144"/);
  assert.equal(L.huella(c), L.huella(L.cara(cfg, L.estadoInicial(cfg), {ahora: 0, piezas: []})));
  assert.doesNotMatch(c.map((t) => t.svg).join(''), /<script|href=/i, 'sin scripts ni recursos externos');
});
