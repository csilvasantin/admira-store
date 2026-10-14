// Mural doble H como un solo lienzo (mejora 3 de la demo de Starbucks): instalación de la
// campaña, qué trozo enseña cada pantalla, UV del trozo y movimiento del titular.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { instalacionDe, repartoPantallas, uvDeRect, posiciones, CAMPANA_STARBUCKS_SIX } from './mural.mjs';
import { escenaDesdePlano } from '../gran-de-gracia-51/plano3d.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
const PUBLICO = JSON.parse(read('data/xpacios/alsea-sbux-021.json'));
// Lo esencial de https://www.admira.studio/adaptaciones/campanas/starbucks-six.json (revisión 2).
const IDS = ['macstudio-starbucks-vertical', 'macstudio-starbucks-horizontal', 'macstudio-starbucks-vertical-right', 'macmini-starbucks-vertical', 'macmini-starbucks-horizontal', 'macmini-starbucks-vertical-right'];
const CAMPANA = {
  schema: 'pixeria.installation-campaign.v1', id: 'starbucks-six', seconds: 24,
  installations: [
    { id: 'starbucks-six', phase: 'mural', width: 8160, height: 1920, screens: [
      { id: IDS[0], x: 0, y: 0, w: 1080, h: 1920 }, { id: IDS[1], x: 1080, y: 420, w: 1920, h: 1080 }, { id: IDS[2], x: 3000, y: 0, w: 1080, h: 1920 },
      { id: IDS[3], x: 4080, y: 0, w: 1080, h: 1920 }, { id: IDS[4], x: 5160, y: 420, w: 1920, h: 1080 }, { id: IDS[5], x: 7080, y: 0, w: 1080, h: 1920 },
    ] },
    { id: 'landscape', phase: 'unit', width: 1920, height: 1080, screens: [{ id: 'unidad', x: 0, y: 0, w: 1920, h: 1080 }] },
  ],
};

test('the mural installation is the 8160 × 1920 canvas with six screen rectangles', () => {
  const ins = instalacionDe(CAMPANA);
  assert.equal(ins.width, 8160); assert.equal(ins.height, 1920);
  assert.deepEqual(ins.screens.map(s => s.id), IDS);
  assert.equal(instalacionDe({ installations: [] }), null);
  assert.equal(instalacionDe(null), null);
  assert.equal(CAMPANA_STARBUCKS_SIX, 'https://www.admira.studio/adaptaciones/campanas/starbucks-six.json');
});

test('signed in, each screen takes its own rectangle by screenId', () => {
  const ins = instalacionDe(CAMPANA);
  const pantallas = IDS.map((id, i) => ({ id: `p${i}`, screenId: id, pared: 'F', s: i, orientacion: i % 3 === 1 ? 'horizontal' : 'vertical' })).reverse();
  const r = repartoPantallas(pantallas, ins);
  assert.equal(r.size, 6);
  assert.equal(r.get('p1').id, IDS[1]);
  assert.equal(r.get('p5').x, 7080);
});

test('public plan (no screenIds): screens match by their order along wall F, only if V–H–V–V–H–V agrees', () => {
  const ins = instalacionDe(CAMPANA);
  const e = escenaDesdePlano(PUBLICO);
  const r = repartoPantallas(e.pantallas, ins);
  assert.ok(r, 'the public twin gets the mural too');
  const orden = [...e.pantallas].sort((a, b) => a.s - b.s);
  assert.deepEqual(orden.map(p => r.get(p.id).id), IDS);
  for (const p of e.pantallas) assert.equal(p.orientacion === 'vertical', r.get(p.id).h > r.get(p.id).w);
  const girada = e.pantallas.map((p, i) => (i === 0 ? { ...p, orientacion: 'horizontal' } : p));
  assert.equal(repartoPantallas(girada, ins), null, 'no guessing when orientations disagree');
  assert.equal(repartoPantallas(e.pantallas.slice(1), ins), null, 'no guessing with a different count');
});

test('UVs of a rectangle follow the PlaneGeometry vertex order with v up', () => {
  assert.deepEqual(uvDeRect({ x: 1080, y: 420, w: 1920, h: 1080 }, 8160, 1920).map(v => Math.round(v * 1e4) / 1e4),
    [0.1324, 0.7813, 0.3676, 0.7813, 0.1324, 0.2188, 0.3676, 0.2188]);
  assert.deepEqual(uvDeRect({ x: 0, y: 0, w: 8160, h: 1920 }, 8160, 1920), [0, 1, 1, 1, 0, 0, 1, 0]);
});

test('the headline crosses the six screens left to right once per cycle', () => {
  const a = posiciones(0, { titular: 3000 }), b = posiciones(12, { titular: 3000 }), c = posiciones(24, { titular: 3000 });
  assert.equal(a.titularX, -3000, 'starts just off the left edge');
  assert.ok(b.titularX > 0 && b.titularX < 8160, 'mid-cycle it is on the mural');
  assert.equal(c.titularX, a.titularX, 'loops every 24 s');
  assert.ok(posiciones(6).titularX < posiciones(9).titularX, 'moves to the right');
  assert.ok(posiciones(6).cierreX > posiciones(9).cierreX, 'the closing line moves the other way');
});

test('the Starbucks page loads the mural after the engine; the engine shares one texture and lets live signal win', () => {
  const html = read('xpacios/starbucks-paseo-de-gracia/index.html');
  assert.ok(html.indexOf('gemelo.mjs?v=') < html.indexOf('mural-pagina.mjs?v='), 'engine first, then the mural');
  const motor = read('xpacios/gran-de-gracia-51/escena3d.mjs');
  assert.match(motor, /function ponerLienzo\(canvas, uvs\)/);
  assert.match(motor, /est\.fuente === 'vivo'/, 'only a live signal takes a screen off the mural');
  assert.match(read('xpacios/gran-de-gracia-51/gemelo.mjs'), /new CustomEvent\('xpacio:listo'/);
  assert.doesNotMatch(read('xpacios/gran-de-gracia-51/index.html'), /mural-pagina/, 'the lab has no mural');
});
