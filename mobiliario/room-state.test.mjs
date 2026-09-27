import test from 'node:test';
import assert from 'node:assert/strict';
import { eraStatus, nextSweep } from './room-state.mjs';

test('una sala a medias no se anuncia como una sola época', () => {
  const mixed = eraStatus([64, 32, 32, 32, 32, 32]);
  assert.equal(mixed.mixed, true);
  assert.equal(mixed.label, 'mezcla');
  const same = eraStatus([8, 8, 8]);
  assert.equal(same.mixed, false);
  assert.equal(same.bits, 8);
});

test('un clic durante el barrido sustituye el destino', () => {
  assert.equal(nextSweep(64, 8), 64);
  assert.equal(nextSweep(null, 16), 16);
});
