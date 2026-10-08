import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recordForUnit, recordURL, recordFields, redactPrivateInventoryFields, unitByInstance, publicRecord} from './ci-record.mjs';
import {recordFor} from '../ci-record.mjs';

const manifest = JSON.parse(readFileSync(new URL('./manifest.json', import.meta.url), 'utf8'));
const scene = JSON.parse(readFileSync(new URL('./scene.inventory.json', import.meta.url), 'utf8'));

test('Cafebrería registers a second locale beyond Starbucks PG103', () => {
  assert.equal(manifest.location_id, 'cafebreria-xpacio-001');
  assert.notEqual(manifest.location_id, 'alsea-sbux-021');
  assert.ok(manifest.units.length >= 8);
  assert.equal(new Set(manifest.units.map(u => u.itil_code)).size, manifest.units.length);
  assert.equal(new Set(manifest.units.map(u => u.instance_id)).size, manifest.units.length);
});

test('every registered unit exists in the 3D scene inventory', () => {
  const ids = new Set(scene.items.map(i => i.id));
  for (const unit of manifest.units) {
    assert.equal(unit.status, 'registered');
    assert.ok(ids.has(unit.instance_id), unit.instance_id);
    const record = recordForUnit(manifest, unit);
    assert.equal(record.code, unit.itil_code);
    assert.equal(record.location, 'cafebreria-xpacio-001');
    assert.equal(record.dimensions, null); // unverified field measurements
  }
});

test('public record fields never expose warranty or serial values', () => {
  const unit = unitByInstance(manifest, 'barra');
  const fields = recordFields(recordForUnit(manifest, unit));
  const byLabel = Object.fromEntries(fields);
  assert.equal(byLabel['Garantía y datos de compra'], 'Consultar en Yokup con acceso autorizado');
  assert.equal(byLabel['Nº de serie'], 'Consultar en Yokup con acceso autorizado');
  for (const [label, value] of fields) {
    if (/Garantía|serie|Serial|Warranty/i.test(label)) assert.match(String(value), /Yokup/);
    assert.doesNotMatch(String(value), /ADM-[A-Z]+-\d+/);
  }
});

test('Yokup links forward only code, lang and marca', () => {
  const url = new URL(recordURL('CAF-BAR-01', 'https://www.xpaceos.com/xpacios/cafebreria/?inventory=1&lang=en&marca=demo&token=secret'));
  assert.equal(url.origin, 'https://www.yokup.com');
  assert.equal(url.searchParams.get('code'), 'CAF-BAR-01');
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.searchParams.get('marca'), 'demo');
  assert.equal(url.searchParams.has('token'), false);
});

test('export redaction strips private inventory fields', () => {
  const cleaned = redactPrivateInventoryFields({
    id: 'barra', nombre: 'Barra', garantia: '2027-01-01', serial: 'SECRET-1', warranty_until: '2027-01-01', fabricante: 'Nogal'
  });
  assert.equal(cleaned.garantia, '');
  assert.equal(cleaned.serial, '');
  assert.equal(cleaned.warranty_until, '');
  assert.equal(cleaned.fabricante, 'Nogal');
});

test('publicRecord helper wires barra', () => {
  const pub = publicRecord(manifest, 'barra', false);
  assert.equal(pub.record.code, 'CAF-BAR-01');
  assert.match(pub.yokup, /code=CAF-BAR-01/);
});

test('Starbucks contract still resolves through shared module', () => {
  const sb = JSON.parse(readFileSync(new URL('../starbucks/manifest.json', import.meta.url), 'utf8'));
  const refs = JSON.parse(readFileSync(new URL('../starbucks/references.json', import.meta.url), 'utf8'));
  const registered = refs.items.filter(r => r.status === 'registered');
  assert.equal(registered.length, 12); // 44–50 + iPad horizontal 52 (12 registros: 2 mesas, 4 sillas)
  assert.equal(recordFor(sb, registered[0]).code, registered[0].itil_code);
});
