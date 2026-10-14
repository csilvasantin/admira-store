// Correcciones de Carlos al laboratorio con sus fotos (14-oct-2026, 18:39): la mesa larga llega al
// final de la pared I y se junta con la otra en L, y la nevera da la espalda a los paneles 3D (pared I),
// con la puerta hacia la sala. Más: lo que una pantalla emite EN VIVO no lo tapa el mural.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePlan, escenaDesdePlano, frenteMueble, inwardNormal } from './plano3d.mjs';
import { planoPublico } from '../plano-publico.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
const LAB = JSON.parse(read('data/xpacios/lab-gran-de-gracia-51.json'));
const mueble = (plan, re) => plan.mobiliario.find(m => re.test(m.nombre));

test('the long desk runs to the end of wall I and meets the other desk in an L, without overlapping', () => {
  const larga = mueble(LAB, /mesa larga/i), otra = LAB.mobiliario.find(m => /^mesa$/i.test(m.nombre));
  assert.equal(larga.x, 0); assert.equal(larga.y, 0, 'reaches the corner with wall F');
  assert.ok(Math.abs(larga.y + larga.d - mueble(LAB, /nevera/i).y) < 0.06, 'and still stops at the fridge');
  assert.equal(otra.y, 0); assert.equal(otra.x, larga.x + larga.w, 'the other desk starts where the long one ends: an L');
  assert.deepEqual(validatePlan(LAB).errores, []);
});

test('a piece of furniture can name the wall it backs onto; the fridge faces the room from wall I', () => {
  const e = escenaDesdePlano(LAB);
  const nevera = e.muebles.find(m => m.tipo === 'nevera');
  assert.equal(nevera.frente, 'I');
  assert.deepEqual(nevera.n, inwardNormal(LAB.paredes.find(w => w.id === 'I')));
  // Sin `pared`, en esa esquina ganaba la pared P por muy poco: por eso hace falta decirlo.
  const sinPared = { ...mueble(LAB, /nevera/i) }; delete sinPared.pared;
  assert.equal(frenteMueble(sinPared, LAB).pared, 'P');
  const mala = { ...LAB, mobiliario: LAB.mobiliario.map(m => (/nevera/i.test(m.nombre) ? { ...m, pared: 'X' } : m)) };
  assert.match(validatePlan(mala).errores.join(' '), /pared que no está en el plano: «X»/);
});

test('the public plan keeps the wall a piece of furniture backs onto (geometry, not inventory)', () => {
  const completo = { ...LAB, publico: undefined, mobiliario: LAB.mobiliario.map(m => ({ ...m, id: m.nombre.toLowerCase().replace(/\W+/g, '-') })) };
  delete completo.publico;
  const pub = planoPublico(completo);
  assert.equal(mueble(pub, /nevera/i).pared, 'I');
  assert.ok(!('pared' in mueble(pub, /recreativa/i)), 'no wall invented for the others');
});

test('a screen already showing a live signal keeps it when the one-canvas mural mounts later', () => {
  const motor = read('xpacios/gran-de-gracia-51/escena3d.mjs');
  assert.match(motor, /e\.vivo = vivo;/);
  assert.match(motor, /if \(!e\.vivo\) volverAlLienzo\(e\)/, 'ponerLienzo skips live screens');
  assert.match(motor, /e\.url = null; e\.vivo = false;/, 'a live video that fails is no longer live');
});
