import test from 'node:test';
import assert from 'node:assert/strict';
import { EPOCHS, applyEpoch, definePiece, displayName, sweepOrder } from './epoch.mjs';
import { FURNITURE } from '../mobiliario/catalog.mjs';

test('la escala tiene cuatro épocas y el apellido de la saga', () => {
  assert.deepEqual(EPOCHS.map((epoch) => epoch.bits), [8, 16, 32, 64]);
  assert.deepEqual(EPOCHS.map((epoch) => epoch.surname), ['80', '90', 'Actual', 'Matrix']);
  assert.equal(displayName('Silla', EPOCHS[0]), 'Silla 80');
  assert.equal(displayName('Silla', EPOCHS[1]), 'Silla 90');
  assert.equal(displayName('Silla', EPOCHS[2]), 'Silla Actual');
  assert.equal(displayName('Silla', EPOCHS[3]), 'Silla Matrix');
});

test('cambiar de época solo cambia la skin', () => {
  const chair = FURNITURE.find((piece) => piece.id === 'silla');
  const a = applyEpoch(chair, 8);
  const b = applyEpoch(chair, 64);
  assert.equal(a.id, b.id);
  assert.equal(a.silhouette, b.silhouette);
  assert.equal(a.color, b.color);
  assert.equal(a.x, b.x);
  assert.equal(a.y, b.y);
  assert.equal(a.fn, b.fn);
  assert.equal(a.fn, 'sentarse');
  assert.equal(a.name, 'Silla 80');
  assert.equal(b.name, 'Silla Matrix');
  assert.notEqual(a.skin.bits, b.skin.bits);
});

test('la planta testigo va siempre y abre el barrido', () => {
  assert.equal(FURNITURE.filter((piece) => piece.witness).length, 1);
  assert.equal(FURNITURE.find((piece) => piece.witness).saga, 'Planta');
  assert.equal(sweepOrder(FURNITURE)[0].id, 'planta');
  assert.equal(sweepOrder(FURNITURE).length, FURNITURE.length);
  assert.deepEqual(FURNITURE.map((piece) => piece.saga), ['Planta', 'Silla', 'Mesa', 'Sofá', 'Lámpara', 'Pantalla']);
});

test('el mismo registro vale para un gemelo de vehículo', () => {
  const car = definePiece({ id: 'coche', saga: 'Coche', silhouette: 'car', color: '#c0c4cc', role: 'vehicle', x: 10, y: 20, fn: 'circular' });
  const now = applyEpoch(car, 32);
  const matrix = applyEpoch(car, 64);
  assert.equal(now.role, 'vehicle');
  assert.equal(now.name, 'Coche Actual');
  assert.equal(matrix.name, 'Coche Matrix');
  assert.equal(now.x, 10);
  assert.equal(matrix.fn, 'circular');
});
