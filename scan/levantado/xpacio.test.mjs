import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeSnapshot } from '../../admira-xp/scripts/premium-model.mjs';
import { FIELDS, SCHEMA, cellMeters, ficha, garantia } from './xpacio.mjs';

const doc = JSON.parse(fs.readFileSync(new URL('./xpacio.json', import.meta.url)));
const registry = JSON.parse(fs.readFileSync(new URL('../../inventario/registry.json', import.meta.url)));
const numbers = new Set(Object.values(registry.numbers));

test('la casilla está calibrada en metros y Xtanco lee el mismo plano', () => {
  assert.equal(doc.schema, SCHEMA);
  assert.equal(doc.source.video, null);
  assert.equal(doc.calibration.metersPerCell, 0.5);
  const meters = cellMeters(doc);
  assert.equal(meters.widthOk, true);
  assert.equal(meters.depthOk, true);
  assert.equal(doc.plan.widthM, doc.plan.cols * 0.5);
  assert.equal(doc.plan.depthM, doc.plan.rows * 0.5);
  const snap = normalizeSnapshot(doc.xtanco);
  assert.equal(snap.cols, doc.plan.cols);
  assert.equal(snap.rows, doc.plan.rows);
  assert.equal(snap.wallHeight, 2.7);
  assert.equal(snap.layout.length, doc.furniture.length);
  assert.equal(doc.planInput.href, '/scan/planos/');
  assert.equal(doc.planInput.applied, false);
});

test('cada mueble tiene la ficha de 14 campos y un número del registro', () => {
  assert.equal(FIELDS.length, 14);
  for (const item of doc.furniture) {
    const card = ficha(item);
    for (const field of FIELDS) assert.ok(field in card, item.identificador + ' ' + field);
    assert.equal(card.compra.ejemplo, true);
    assert.equal(garantia(item), 'en_garantia');
    assert.equal(card.garantia, 'en_garantia');
    assert.ok(numbers.has(item.numero), String(item.numero));
    assert.ok(item.numero < 44);
  }
  assert.equal(Object.values(registry.numbers).includes(44), false);
  assert.equal(doc.furniture.find((item) => item.numero === 9).tipo, 'planta');
  assert.equal(doc.furniture.find((item) => item.numero === 13).pantalla.circuito, 'Star Wars');
});
