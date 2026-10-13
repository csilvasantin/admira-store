// Pin remoto con blob propio (13-oct-2026): el envoltorio de progreso de descarga (dlProgressScript)
// baja el vídeo, crea un blob y lo fija. Desde FLT-100904 el core rechazaba todo blob, así que el canal
// admira.tv por tag y el feed de admira.studio no fijaban nada en las pantallas de Good. Contrato:
// se fija el blob que crea ESTA pestaña, se sigue rechazando el ajeno y nada nuevo sale de la pestaña.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../admira-xp/index.html', import.meta.url), 'utf8');
function cut(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, start);
  return html.slice(a, b);
}
const core = cut('function dsMediaUrlPlayable(', '// Expuesto para el emisor del canal admira.tv');
const mirror = cut('function escaparateNowItem(){', 'async function emitEscaparateNow') + cut('function totemNowItem(){', 'async function emitTotemNow');
const wrapper = cut('<script id="dlProgressScript">', '</script>').replace('<script id="dlProgressScript">', '');

const STOCK = 'https://stock.admira.store/stock/1784305595269-eosf8v/asset.mp4?v=1690331';
const ROTATION = {kind: 'video', name: 'Rotación', src: 'https://www.admira.store/admira-xp/assets/videos/rotacion.mp4'};
const flush = () => new Promise(resolve => setImmediate(resolve));

function mundo({matrix = false, registry = true} = {}) {
  const blobs = [], fetched = [], previews = [];
  const media = () => ({src: '', volume: 1, load() {}, pause() {}, play: () => Promise.resolve(), removeAttribute() { this.src = ''; }});
  const node = () => ({style: {}, setAttribute() {}, appendChild() {}});
  const window = {};
  const fetch = url => {
    fetched.push(url);
    const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
    return Promise.resolve({ok: true, headers: {get: name => ({'content-length': '5', 'content-type': 'video/mp4'})[name] || null},
      body: {getReader: () => ({read: () => Promise.resolve(chunks.length ? {done: false, value: chunks.shift()} : {done: true})})}});
  };
  window.fetch = fetch;
  class TabURL extends URL { static createObjectURL(blob) { blobs.push(blob); return 'blob:https://www.admira.store/propio-' + blobs.length; } }
  const ctx = vm.createContext({
    window, fetch, Blob, console, URL: TabURL, setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame() {}, getComputedStyle: () => ({display: 'none'}),
    document: {body: {appendChild() {}}, createElementNS: node, getElementById: () => null},
    location: {href: 'https://www.admira.store/admira-xp/'},
    DS_PIN: Object.create(null), DS_SURFACE_MEDIA: Object.create(null), newMedia: media,
    dsMatrixOwnsScreens: () => matrix, dsPreviewMatrix: (id, track) => { previews.push({id, track}); return true; },
    dsSurfaceById: id => ['ds1', 'ds2', 'escaparate', 'metahuman'].includes(id) ? {id} : null,
    dsApplyAudioForPins() {},
    // Lo que el espejo cuenta cuando el escaparate no tiene pin: la rotación global.
    videoPlaying: true, dsMode: 'video', dsVideoIdx: 0, VIDEO_LIST: ['Rotación'], VIDEO_FILES: {'Rotación': 'assets/videos/rotacion.mp4'}, VIDEO_FILES_VERTICAL: {}, DS_IMPORT: {KIND: {}}, SIGNAGE_HD: {},
  });
  vm.runInContext('function dsEnsureSurfaceMedia(id){ return DS_SURFACE_MEDIA[id]||(DS_SURFACE_MEDIA[id]={kind:null,name:null,img:newMedia(),video:newMedia(),ready:false}); }', ctx);
  vm.runInContext(core + '\n' + mirror + '\nwindow.__dsPinSurfaceFromUrl=dsPinSurfaceFromUrl;', ctx);
  if (!registry) window.__dsOwnBlobs = undefined; // el envoltorio no puede registrar: el core no reconoce su blob
  const corePin = window.__dsPinSurfaceFromUrl;
  vm.runInContext(wrapper, ctx);
  const escaparateNow = () => ({...vm.runInContext('escaparateNowItem()', ctx)}), totemNow = () => ({...vm.runInContext('totemNowItem()', ctx)});
  return {ctx, window, blobs, fetched, previews, corePin, escaparateNow, totemNow, pin: (...args) => window.__dsPinSurfaceFromUrl(...args)};
}

test('el envoltorio de descarga fija en la pantalla el blob que crea esta pestaña', async () => {
  const w = mundo();
  assert.notEqual(w.window.__dsPinSurfaceFromUrl, w.corePin, 'el envoltorio sustituye al pin del core');
  assert.equal(w.pin('ds1', 'video', STOCK, 'Clip etiquetado'), true);
  assert.equal(w.ctx.DS_PIN.ds1, undefined, 'nada fijado hasta que termina la descarga');
  await flush();
  assert.deepEqual({...w.ctx.DS_PIN.ds1}, {name: 'Clip etiquetado', kind: 'video', remote: true});
  assert.equal(w.ctx.DS_SURFACE_MEDIA.ds1.video.src, 'blob:https://www.admira.store/propio-1');
  assert.equal(w.blobs[0].size, 5);
  assert.equal(w.blobs[0].type, 'video/mp4', 'el blob conserva el tipo que declara el servidor');
  assert.equal(w.window.__dlProgress.prog.ds1.pct, 100);
});

test('la segunda vez sale de la caché: no vuelve a descargar ni crea otro blob', async () => {
  const w = mundo();
  w.pin('ds1', 'video', STOCK, 'Clip'); await flush();
  assert.equal(w.pin('ds2', 'video', STOCK, 'Clip'), true);
  assert.deepEqual([w.fetched.length, w.blobs.length], [1, 1]);
  assert.equal(w.ctx.DS_SURFACE_MEDIA.ds2.video.src, 'blob:https://www.admira.store/propio-1');
  assert.equal(w.ctx.DS_PIN.ds2.remote, true);
});

test('un blob ajeno, y todo lo que no sea https, se sigue rechazando (FLT-100904)', async () => {
  const w = mundo();
  for (const bad of ['blob:https://www.admira.store/de-otra-pestana', 'blob:https://admira.studio/1b2c', 'data:video/mp4;base64,AAAA', 'about:blank', 'assets/videos/local.mp4', '']) {
    assert.ok(!w.pin('ds1', 'video', bad, 'Ajeno'), 'envoltorio: ' + bad);
    assert.ok(!w.corePin('ds1', 'video', bad, 'Ajeno'), 'core: ' + bad);
  }
  await flush();
  assert.equal(w.fetched.length, 0, 'sólo se descarga lo que el core fijaría tal cual');
  assert.equal(w.ctx.DS_PIN.ds1, undefined);
  assert.equal(w.ctx.DS_SURFACE_MEDIA.ds1, undefined);
  assert.equal(w.corePin('ds1', 'video', STOCK, 'Directo'), true, 'la URL https directa sigue valiendo');
});

test('un pin remoto no sale de la pestaña: los espejos del escaparate y del tótem cuentan lo mismo que sin él', async () => {
  const w = mundo();
  assert.deepEqual(w.escaparateNow(), ROTATION);
  w.pin('escaparate', 'video', STOCK, 'Clip del escaparate'); await flush();
  assert.match(w.ctx.DS_SURFACE_MEDIA.escaparate.video.src, /^blob:/);
  assert.equal(w.ctx.DS_PIN.escaparate.remote, true);
  assert.deepEqual(w.escaparateNow(), ROTATION, 'ni el blob ni su origen: la rotación global, como antes');
  w.ctx.videoPlaying = false;
  assert.deepEqual(w.escaparateNow(), {kind: 'idle', name: '', src: null});
  // Un pin local (arrastrado a la pantalla) se sigue espejando como siempre.
  w.ctx.DS_PIN.escaparate = {name: 'Rotación', kind: 'video'};
  assert.deepEqual(w.escaparateNow(), ROTATION);
  // El tótem, igual: su espejo no cambia con cada pieza del canal; un pin web o local sí se espeja.
  const idle = {kind: 'idle', name: '', src: null};
  assert.deepEqual(w.totemNow(), idle);
  w.pin('metahuman', 'video', STOCK, 'Clip del tótem'); await flush();
  assert.equal(w.ctx.DS_PIN.metahuman.remote, true);
  assert.deepEqual(w.totemNow(), idle);
  w.ctx.DS_PIN.metahuman = {kind: 'web', name: 'Quiosco', src: 'https://www.ainimation.studio/quiosco'};
  assert.deepEqual(w.totemNow(), {kind: 'web', name: 'Quiosco', src: 'https://www.ainimation.studio/quiosco'});
  w.ctx.DS_PIN.metahuman = {name: 'Rotación', kind: 'video'};
  assert.deepEqual(w.totemNow(), ROTATION);
});

test('Matrix sólo acepta https: un blob propio no llega a la vista compartida', async () => {
  const good = mundo();
  good.pin('ds1', 'video', STOCK, 'Clip'); await flush();
  const own = good.ctx.DS_SURFACE_MEDIA.ds1.video.src;
  const matrix = mundo({matrix: true});
  vm.runInContext('DS_OWN_BLOBS', matrix.ctx).add(own);
  assert.equal(matrix.corePin('ds1', 'video', own, 'Clip'), false);
  assert.equal(matrix.previews.length, 0);
  assert.equal(matrix.pin('ds1', 'video', STOCK, 'Clip'), true);
  assert.deepEqual(matrix.previews.map(p => p.track.url), [STOCK]);
  assert.equal(matrix.fetched.length, 0, 'en Matrix el envoltorio no descarga');
});

test('si el core no reconoce el blob, el envoltorio fija la URL de origen en vez de callar', async () => {
  const w = mundo({registry: false});
  w.pin('ds2', 'video', STOCK, 'Clip'); await flush();
  assert.equal(w.ctx.DS_SURFACE_MEDIA.ds2.video.src, STOCK);
  assert.deepEqual({...w.ctx.DS_PIN.ds2}, {name: 'Clip', kind: 'video', remote: true});
});
