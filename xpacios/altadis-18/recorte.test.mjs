// Recortes de un formato Altadis: cada pantalla física pinta su trozo del único vídeo del
// formato (offset/repeat de UV), el cubo LED en 4 caras y el ajuste de un medio de otra proporción.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ajusteMedio, uvRecorte, uvPlano, carasCubo, uvsFormato, erroresRecorte, coberturaLienzo, lienzoValido } from './recorte.mjs';
import { uvDeRect } from '../starbucks-paseo-de-gracia/mural.mjs';
import { uvValido, uvPorCara } from '../gran-de-gracia-51/escena3d.mjs';

const r4 = a => a.map(v => Math.round(v * 1e4) / 1e4);
const CELDAS_4X1 = [0, 1, 2, 3].map(c => ({ x: c * 960, y: 0, w: 960, h: 540 }));

test('VIDEOWALL 4X1 H: each of the four screens shows a quarter of the 3840 × 540 canvas', () => {
  const uvs = CELDAS_4X1.map(r => uvRecorte(r, [3840, 540]));
  assert.deepEqual(uvs.map(u => u.offset), [[0, 0], [0.25, 0], [0.5, 0], [0.75, 0]]);
  for (const u of uvs) assert.deepEqual(u.repeat, [0.25, 1]);
  assert.deepEqual(uvPlano(uvs[1]), [0.25, 1, 0.5, 1, 0.25, 0, 0.5, 0], 'PlaneGeometry order: top-left, top-right, bottom-left, bottom-right');
});

test('stacked grids: the top row of a 1X2 H is the upper half of the texture (v goes up)', () => {
  const arriba = uvRecorte({ x: 0, y: 0, w: 1920, h: 1080 }, [1920, 2160]);
  const abajo = uvRecorte({ x: 0, y: 1080, w: 1920, h: 1080 }, [1920, 2160]);
  assert.deepEqual(arriba, { offset: [0, 0.5], repeat: [1, 0.5] });
  assert.deepEqual(abajo, { offset: [0, 0], repeat: [1, 0.5] });
});

test('the whole canvas is the identity, and the UVs agree with the Starbucks one-canvas mural', () => {
  assert.deepEqual(uvPlano(uvRecorte({ x: 0, y: 0, w: 1080, h: 1920 }, [1080, 1920])), [0, 1, 1, 1, 0, 0, 1, 0]);
  const r = { x: 1080, y: 420, w: 1920, h: 1080 };
  assert.deepEqual(r4(uvPlano(uvRecorte(r, [8160, 1920]))), r4(uvDeRect(r, 8160, 1920)));
});

test('a medium of another aspect is covered and cropped centred; a native-size video is untouched', () => {
  assert.deepEqual(ajusteMedio([3840, 540], [3840, 540]), { offset: [0, 0], repeat: [1, 1] });
  assert.deepEqual(ajusteMedio([3840, 540], [1920, 270]), { offset: [0, 0], repeat: [1, 1] }, 'same aspect, any size');
  const a = ajusteMedio([3840, 540], [1920, 1080]);   // a 16:9 video on a 64:9 canvas: crop top and bottom
  assert.deepEqual(a, { offset: [0, 0.375], repeat: [1, 0.25] });
  const b = ajusteMedio([64, 384], [1080, 1920]);       // 9:16 video on the 1:6 gondola: crop the sides
  assert.deepEqual(r4([...b.offset, ...b.repeat]), [0.3519, 0, 0.2963, 1]);
  assert.deepEqual(ajusteMedio([3840, 540], [1920, 1080], 'stretch'), { offset: [0, 0], repeat: [1, 1] });
  const c = uvRecorte(CELDAS_4X1[3], [3840, 540], a);
  assert.deepEqual(c, { offset: [0.75, 0.375], repeat: [0.25, 0.25] }, 'the crop composes with the screen quarter');
});

test('LED cube 1600 × 600: four faces of 400 × 600, left to right, each with its own UVs', () => {
  const caras = carasCubo({ x: 0, y: 0, w: 1600, h: 600 });
  assert.deepEqual(caras.map(c => [c.x, c.w, c.h]), [[0, 400, 600], [400, 400, 600], [800, 400, 600], [1200, 400, 600]]);
  const uvs = uvsFormato([{ id: 'cubo', forma: 'cubo-4-caras', recorte: { x: 0, y: 0, w: 1600, h: 600 }, lienzo: [1600, 600] }]);
  const caraUV = uvs.get('cubo');
  assert.equal(caraUV.length, 4);
  assert.deepEqual(caraUV[2], [0.5, 1, 0.75, 1, 0.5, 0, 0.75, 0]);
  assert.deepEqual(carasCubo({ x: 0, y: 0, w: 1602, h: 600 }).reduce((s, c) => s + c.w, 0), 1602, 'odd widths still tile with no gap');
});

test('uvsFormato: one entry per physical screen; without a recorte a screen shows the whole canvas', () => {
  const ps = CELDAS_4X1.map((recorte, i) => ({ id: `p${i + 1}`, recorte, lienzo: [3840, 540] }));
  const m = uvsFormato(ps, { lienzo: [3840, 540], medio: [3840, 540] });
  assert.deepEqual([...m.keys()], ['p1', 'p2', 'p3', 'p4']);
  assert.deepEqual(m.get('p4'), [0.75, 1, 1, 1, 0.75, 0, 1, 0]);
  assert.deepEqual(uvsFormato([{ id: 'sola' }], { lienzo: [1080, 1920] }).get('sola'), [0, 1, 1, 1, 0, 0, 1, 0]);
  assert.equal(uvsFormato([{ id: 'x' }], {}).size, 0, 'no canvas, nothing to map');
});

test('recortes are validated in integer pixels inside the canvas', () => {
  assert.deepEqual(erroresRecorte({ x: 0, y: 0, w: 960, h: 540 }, [3840, 540]), []);
  assert.match(erroresRecorte({ x: 3000, y: 0, w: 960, h: 540 }, [3840, 540])[0], /se sale del lienzo/);
  assert.match(erroresRecorte({ x: 0.5, y: 0, w: 960, h: 540 }, [3840, 540])[0], /enteros/);
  assert.match(erroresRecorte({ x: 0, y: 0, w: 0, h: 540 }, [3840, 540])[0], /positivos/);
  assert.match(erroresRecorte({ x: 0, y: 0, w: 1, h: 1 }, [0, 540])[0], /lienzo/);
  assert.throws(() => uvRecorte({ x: 0, y: 0, w: 4000, h: 540 }, [3840, 540]), /se sale/);
  assert.equal(lienzoValido([1920, 1080]), true);
  assert.equal(lienzoValido([1920]), false);
});

test('coverage: the screens of a format tile the canvas; gaps and overlaps are reported', () => {
  assert.deepEqual(coberturaLienzo(CELDAS_4X1, [3840, 540]), { cubierto: 1, avisos: [] });
  assert.match(coberturaLienzo(CELDAS_4X1.slice(0, 3), [3840, 540]).avisos[0], /75 %/);
  assert.match(coberturaLienzo([CELDAS_4X1[0], { x: 900, y: 0, w: 960, h: 540 }], [3840, 540]).avisos[0], /se pisan/);
});

test('ponerUV of the engine: a cube keeps one UV set per face, also when they are Float32Array (its uv0)', () => {
  const caras = carasCubo({ x: 0, y: 0, w: 1600, h: 600 }).map(c => new Float32Array(uvPlano(uvRecorte(c, [1600, 600]))));
  assert.ok(uvValido(caras), 'a list of Float32Array is a valid cube UV set');
  const r = uvPorCara(caras, 4);
  assert.equal(r.length, 4);
  assert.deepEqual([...r[2]], [0.5, 1, 0.75, 1, 0.5, 0, 0.75, 0]);
  assert.ok(r.every(x => [...x].every(Number.isFinite)), 'no NaN');
  const plano = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
  assert.ok(uvValido(plano));
  assert.deepEqual(uvPorCara(plano, 4).map(x => [...x]), Array(4).fill([0, 1, 1, 1, 0, 0, 1, 0]), 'one flat set goes to every face');
  assert.deepEqual(uvPorCara([0.25, 1, 0.5, 1, 0.25, 0, 0.5, 0], 1), [[0.25, 1, 0.5, 1, 0.25, 0, 0.5, 0]]);
  assert.equal(uvValido([1, 2, 3]), false);
  assert.equal(uvValido([new Float32Array(3)]), false);
});
