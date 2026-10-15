// Reproductor de los centros Starbucks: asociaciones pantalla ↔ playlist, tiempos del ciclo y control
// de los vídeos (arranque a la vez, cambio de pieza sin negro, deriva, autoplay bloqueado, pausa, errores).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  piezaDe, cicloDe, tramoEn, marcasDe, validarPrograma, ajusteSinRecorte, correccion,
  programaDesdeMCP, crearReproductor, DERIVA,
} from './reproductor.mjs';

const leer = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const PG = leer('./programas/starbucks-pg103-historia-r6.json');
const PG_MCP = leer('./programas/starbucks-pg103-sincroia-mcp.json');
const D = leer('./programas/starbucks-d634-adaptacion-r1.json');
const GEO_PG = leer('./modelos/paseo-gracia-103.geometry.json');
const GEO_D = leer('./modelos/diagonal-634.geometry.json');
const ORIGEN = leer('./programas/origen-playlist-starbucks-pg103-r6.json');

test('PG103: each of the six model screens is explicitly bound to its slot of the r6 playlist, left to right', () => {
  assert.deepEqual(validarPrograma(PG, GEO_PG.screens), []);
  const porX = [...GEO_PG.screens].sort((a, b) => a.position[0] - b.position[0]).map(s => s.id);
  assert.deepEqual(PG.asociaciones.map(a => a.pantalla), porX, 'MENU-01..06 run left to right');
  PG.asociaciones.forEach((a, i) => {
    assert.equal(a.origen, `starbucks-pg103-p${i + 1}`);
    assert.equal(a.canal, 'starbucks-pg103');
    assert.equal(a.dispositivoFisico, null, 'the physical device is still to be verified');
    assert.equal(a.grupo, GEO_PG.screens.find(s => s.id === a.pantalla).group, 'keeps the 2 + 1 + 3 grouping');
    assert.match(piezaDe(PG.tramos[0], a.pantalla).src, new RegExp(`pg103-p${i + 1}-1080x1920\\.mp4$`));
  });
  assert.equal(PG.revision, ORIGEN.revision);
  assert.equal(PG.vinculacionFisica, 'pendiente');
});

test('PG103 r6 keeps the campaign timing: 24 s synchronised mural + 8 s individual piece = 32 s cycle', () => {
  assert.equal(cicloDe(PG), ORIGEN.totalSeconds);
  assert.deepEqual(marcasDe(PG).map(m => [m.id, m.desde, m.hasta]), [['mural', 0, 24], ['individual', 24, 32]]);
  const comun = new Set(PG.asociaciones.map(a => piezaDe(PG.tramos[1], a.pantalla).src));
  assert.equal(comun.size, 1, 'the individual piece is one shared video for the six screens');
  for (const tr of PG.tramos) for (const a of PG.asociaciones) {
    const pz = piezaDe(tr, a.pantalla);
    assert.deepEqual([pz.ancho, pz.alto], [1080, 1920], 'original resolution');
    assert.equal(pz.segundos, tr.segundos);
  }
});

test('Diagonal 634: an independent adaptation, not the Paseo de Gràcia playlist, on its own six screens', () => {
  assert.deepEqual(validarPrograma(D, GEO_D.screens), []);
  assert.equal(D.centro, 'd634');
  assert.equal(D.fuente.tipo, 'adaptacion');
  const srcs = D.tramos.flatMap(tr => D.asociaciones.map(a => piezaDe(tr, a.pantalla).src));
  assert.ok(srcs.every(s => !/pg103|historia-r6/.test(s)), 'no Paseo de Gràcia media');
  assert.ok(srcs.every(s => s.startsWith('https://stock.admira.store/')), 'brand content already hosted with CORS');
  assert.ok(!srcs.some(s => s.includes('1790708944451-w4c36z')), 'the conditional Christmas piece is left out');
  assert.equal(Math.round(cicloDe(D) * 100) / 100, 35.25);
  D.asociaciones.forEach((a, i) => assert.match(piezaDe(D.tramos[0], a.pantalla).titulo, new RegExp(`pantalla ${i + 1} de 6`), 'sincro panel n on screen n'));
  assert.ok(D.asociaciones.every(a => a.pantalla.startsWith('D634-') && a.canal === 'starbucks-d634-adaptacion'));
});

test('the cycle clock: where every instant falls, across cycles', () => {
  const at = t => { const p = tramoEn(PG, t); return [p.tramo.id, Math.round(p.local * 100) / 100, p.vuelta]; };
  assert.deepEqual(at(0), ['mural', 0, 0]);
  assert.deepEqual(at(23.99), ['mural', 23.99, 0]);
  assert.deepEqual(at(24), ['individual', 0, 0]);
  assert.deepEqual(at(31.5), ['individual', 7.5, 0]);
  assert.deepEqual(at(32), ['mural', 0, 1]);
  assert.deepEqual(at(32 * 5 + 25), ['individual', 1, 5]);
  assert.equal(tramoEn(PG, 10).restante, 14);
});

test('fit without crop or distortion: native when the aspect matches, otherwise bands, never a crop', () => {
  assert.deepEqual(ajusteSinRecorte([1080, 1920], [1080, 1920]), { modo: 'nativo', escala: [1, 1] });
  const h = ajusteSinRecorte([1080, 1920], [1920, 1080]);
  assert.equal(h.modo, 'encaje');
  assert.equal(h.escala[0], 1);
  assert.ok(h.escala[1] < 1 && Math.abs(h.escala[1] - (1080 / 1920) / (1920 / 1080)) < 1e-9, 'a landscape piece on a portrait screen keeps its width and gets bands');
  const v = ajusteSinRecorte([1920, 1080], [1080, 1920]);
  assert.ok(v.escala[0] < 1 && v.escala[1] === 1);
});

test('drift: tolerated, then corrected by rate, then by a seek', () => {
  assert.equal(correccion(10, 10.03).accion, 'nada');
  const delante = correccion(10, 10.2);
  assert.equal(delante.accion, 'ritmo'); assert.ok(delante.ritmo < 1 && delante.ritmo >= 1 - DERIVA.maxAjuste);
  const detras = correccion(10, 9.9);
  assert.equal(detras.accion, 'ritmo'); assert.ok(detras.ritmo > 1);
  assert.deepEqual(correccion(10, 11).accion, 'salto');
});

test('the live MCP sincroIA playlist is rebuilt screen by screen; a state that does not fit keeps the copy', () => {
  const estado = { revision: 50, updatedAt: '2026-10-15T00:00:00Z', playlists: { sincroIA: { tracks: [6, 3, 1, 5, 2, 4].map(n => ({ stockId: 's' + n, title: `Sincro 6 · Nueva · pantalla ${n} de 6`, url: `https://stock.admira.store/stock/s${n}/asset.mp4` })) } } };
  const vivo = programaDesdeMCP(estado, PG_MCP);
  assert.equal(vivo.revision, 50); assert.equal(vivo.fuente.vivo, true);
  PG_MCP.asociaciones.forEach((a, i) => assert.equal(piezaDe(vivo.tramos[0], a.pantalla).id, 's' + (i + 1)));
  assert.deepEqual(validarPrograma(vivo, GEO_PG.screens), []);
  assert.equal(programaDesdeMCP({ playlists: { sincroIA: { tracks: estado.playlists.sincroIA.tracks.slice(1) } } }, PG_MCP), null);
  assert.equal(programaDesdeMCP({ playlists: { sincroIA: { tracks: estado.playlists.sincroIA.tracks.map(t => ({ ...t, url: t.url.replace('https', 'http') })) } } }, PG_MCP), null);
  assert.equal(programaDesdeMCP({}, PG_MCP), null);
});

test('validation names what would break playback', () => {
  const roto = JSON.parse(JSON.stringify(PG));
  roto.asociaciones.pop();
  delete roto.tramos[0].piezas['PG103-MENU-02'];
  const e = validarPrograma(roto, GEO_PG.screens).join(' | ');
  assert.match(e, /pantalla del modelo sin playlist: «PG103-MENU-06»/);
  assert.match(e, /tramo «mural» sin pieza para «PG103-MENU-02»/);
});

// ── Control de vídeos con vídeos y reloj simulados ──
function fabrica({ bloquea = false, duraciones = {} } = {}) {
  const creados = [];
  const crearVideo = url => {
    const ev = {};
    const v = {
      url, src: url, currentTime: 0, duration: duraciones[url.split('?')[0].split('/').pop()] ?? (url.includes('entrada') ? 8 : 24), readyState: 4, paused: true, seeking: false, playbackRate: 1, error: null, bloquea,
      addEventListener(n, f) { (ev[n] ||= []).push(f); }, removeEventListener(n, f) { ev[n] = (ev[n] || []).filter(x => x !== f); },
      emit(n) { for (const f of ev[n] || []) f(); },
      play() { if (v.bloquea) return Promise.reject(Object.assign(new Error('autoplay'), { name: 'NotAllowedError' })); v.paused = false; return Promise.resolve(); },
      pause() { v.paused = true; }, load() {}, removeAttribute() {},
    };
    creados.push(v); return v;
  };
  return { crearVideo, creados };
}
const esperarMicro = () => new Promise(r => setImmediate(r));

test('the six screens start together, change piece together and the next piece waits on its first frame', async () => {
  let ahora = 100;
  const { crearVideo, creados } = fabrica();
  const r = crearReproductor({ programa: PG, base: 'http://x/xpacios/starbucks-centros/', crearVideo, ahora: () => ahora });
  assert.equal(creados.length, 7, 'six mural slices + one shared individual piece');
  await r.iniciar(0.01); await esperarMicro();
  const mural = PG.asociaciones.map(a => r.medioDe(a.pantalla).video);
  assert.equal(new Set(mural).size, 6);
  assert.ok(mural.every(v => !v.paused && v.currentTime === 0), 'all six mural videos playing from 0');
  // Los vídeos avanzan con el reloj; 1,0 s antes del cambio la pieza individual ya espera en su fotograma 0.
  ahora += 23; mural.forEach(v => { v.currentTime = 23; }); r.tick();
  const entrada = creados.find(v => v.url.includes('entrada'));
  entrada.currentTime = 3; ahora += 0.2; mural.forEach(v => { v.currentTime = 23.2; }); r.tick();
  assert.equal(entrada.currentTime, 0, 'prerolled to its first frame before the cut');
  // Cambio de tramo: los seis murales paran, la pieza común suena en las seis.
  ahora += 1.0; r.tick(); await esperarMicro();
  assert.equal(r.estado().pos.tramo.id, 'individual');
  assert.ok(mural.every(v => v.paused));
  assert.ok(PG.asociaciones.every(a => r.medioDe(a.pantalla).video === entrada) && !entrada.paused);
  // Fin del ciclo: los murales vuelven a su fotograma 0 antes de la vuelta 2.
  mural.forEach(v => { v.currentTime = 24; });
  ahora += 6.9; entrada.currentTime = 6.9; r.tick();
  assert.ok(mural.every(v => v.currentTime === 0));
  ahora += 1.0; r.tick(); await esperarMicro();
  assert.equal(r.estado().pos.vuelta, 1);
  assert.ok(mural.every(v => !v.paused) && entrada.paused);
});

test('a drifting screen is pulled back by rate, a lost one by a seek', async () => {
  let ahora = 0;
  const { crearVideo } = fabrica();
  const r = crearReproductor({ programa: PG, crearVideo, ahora: () => ahora });
  await r.iniciar(0.01); await esperarMicro();
  const [a, b, c] = PG.asociaciones.map(x => r.medioDe(x.pantalla).video);
  ahora = 5; a.currentTime = 5.15; b.currentTime = 6.5; c.currentTime = 5.01; r.tick();
  assert.ok(a.playbackRate < 1, 'ahead by 150 ms: slowed down');
  assert.equal(Math.round(b.currentTime * 100) / 100, 5.03, 'ahead by 1.5 s: seeked to the clock');
  assert.equal(c.playbackRate, 1, 'within tolerance: untouched');
  a.currentTime = 5.0; r.tick();
  assert.equal(a.playbackRate, 1, 'back in sync: normal rate');
});

test('autoplay blocked by the browser is reported and resumed with a gesture', async () => {
  let ahora = 0; const avisos = [];
  const { crearVideo, creados } = fabrica({ bloquea: true });
  const r = crearReproductor({ programa: PG, crearVideo, ahora: () => ahora, avisar: tipo => avisos.push(tipo) });
  await r.iniciar(0.01); await esperarMicro();
  assert.ok(avisos.includes('bloqueado') && r.bloqueado);
  creados.forEach(v => { v.bloquea = false; });
  r.desbloquear(); await esperarMicro();
  assert.ok(!r.bloqueado);
  assert.ok(PG.asociaciones.every(x => !r.medioDe(x.pantalla).video.paused));
});

test('pause freezes the clock and every screen; play resumes at the same point; restart goes back to 0', async () => {
  let ahora = 0;
  const { crearVideo, creados } = fabrica();
  const r = crearReproductor({ programa: PG, crearVideo, ahora: () => ahora });
  await r.iniciar(0.01); await esperarMicro();
  ahora = 7; r.tick(); r.pausar();
  assert.ok(creados.every(v => v.paused));
  ahora = 50; assert.equal(r.estado().t, 7, 'clock frozen while paused');
  r.reproducir(); ahora = 51; assert.equal(r.estado().t, 8);
  r.siguiente(); assert.equal(r.estado().pos.tramo.id, 'individual');
  r.reiniciar(); assert.equal(Math.round(r.estado().t), 0);
});

test('a piece that keeps failing after its retries is reported and the other screens keep playing', async () => {
  let ahora = 0; const errores = [];
  const { crearVideo } = fabrica();
  const r = crearReproductor({ programa: PG, crearVideo, ahora: () => ahora, reintentos: [0, 0], avisar: (tipo, m) => { if (tipo === 'error') errores.push(m.src); } });
  await r.iniciar(0.01); await esperarMicro();
  const roto = r.medioDe('PG103-MENU-03');
  for (let i = 0; i < 2; i++) { roto.video.error = { code: 4 }; roto.video.emit('error'); await new Promise(res => setTimeout(res, 5)); }
  assert.deepEqual(errores, [], 'not reported while it still has retries');
  assert.match(roto.video.src, /intento=2$/, 'each retry asks for the same file with a different URL');
  roto.video.error = { code: 4 }; roto.video.emit('error');
  assert.deepEqual(errores, [roto.src]);
  assert.equal(r.estado().errores.length, 1);
  ahora = 2; r.tick();
  assert.ok(PG.asociaciones.filter(a => a.pantalla !== 'PG103-MENU-03').every(a => !r.medioDe(a.pantalla).video.paused));
});

test('a «segundos: medio» section takes the measured length of its videos', async () => {
  let ahora = 0;
  const { crearVideo } = fabrica({ duraciones: { 'asset.mp4': 21.16 } });
  const r = crearReproductor({ programa: PG_MCP, crearVideo, ahora: () => ahora });
  await r.iniciar(0.01);
  assert.equal(r.estado().ciclo, 21.16);
});

test('a transient load failure (browser check, cached failure) recovers by itself and is not reported', async () => {
  let ahora = 0; const errores = [];
  const { crearVideo } = fabrica();
  const r = crearReproductor({ programa: D, crearVideo, ahora: () => ahora, reintentos: [0], avisar: (tipo, m) => { if (tipo === 'error') errores.push(m.src); } });
  await r.iniciar(0.01); await esperarMicro();
  const frapp = [...r.medios.values()].find(m => m.pieza.titulo.includes('Frappuccino'));
  frapp.video.error = { code: 4 }; frapp.video.emit('error');
  assert.equal(frapp.estado, 'cargando');
  await new Promise(res => setTimeout(res, 5));
  assert.match(frapp.video.src, /\?v=\d+&intento=1$/);
  frapp.video.error = null; frapp.video.emit('loadeddata');
  assert.equal(frapp.estado, 'listo');
  ahora = 21.5; r.tick(); await esperarMicro();
  assert.equal(r.estado().pos.tramo.id, 'frappuccino');
  assert.ok(D.asociaciones.every(a => r.medioDe(a.pantalla) === frapp) && !frapp.video.paused, 'the six screens play it');
  assert.deepEqual(errores, []);
});

test('a screen whose video stops advancing is put back in place by the watchdog', async () => {
  let ahora = 0; const avisos = [];
  const { crearVideo } = fabrica();
  const r = crearReproductor({ programa: PG, crearVideo, ahora: () => ahora, avisar: (tipo, d) => { if (tipo === 'aviso') avisos.push(d.motivo); } });
  await r.iniciar(0.01); await esperarMicro();
  const vs = PG.asociaciones.map(a => r.medioDe(a.pantalla).video);
  // Todos avanzan con el reloj salvo el 1, que se queda clavado en 3,0 s.
  for (const t of [3, 3.5, 4]) { ahora = t; vs.forEach((v, i) => { v.currentTime = i === 0 ? 3 : t; }); r.tick(); }
  assert.deepEqual(avisos, [], 'one second without advancing is still tolerated');
  ahora = 4.6; vs.forEach((v, i) => { v.currentTime = i === 0 ? 3 : 4.6; }); r.tick(); await esperarMicro();
  assert.ok(avisos.includes('vídeo parado: se recoloca'));
  assert.ok(Math.abs(vs[0].currentTime - 4.65) < 0.01, 'moved back to the clock');
  assert.ok(!vs[0].paused, 'and playing again');
  assert.ok(vs.slice(1).every(v => v.currentTime === 4.6), 'the others are untouched');
});
