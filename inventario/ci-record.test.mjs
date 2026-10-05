import test from 'node:test';
import assert from 'node:assert/strict';
import {recordURL, recordFields, redactPrivateInventoryFields, assertCode} from './ci-record.mjs';

test('assertCode rejects injection', () => {
  assert.throws(() => assertCode('<script>'), /Invalid/);
  assert.equal(assertCode('CAF-BAR-01'), 'CAF-BAR-01');
  assert.equal(assertCode('BCN-001'), 'BCN-001');
});

test('recordURL never forwards secrets', () => {
  const url = new URL(recordURL('BCN-002', 'https://www.admira.store/inventario/?token=x&lang=es'));
  assert.equal(url.searchParams.get('code'), 'BCN-002');
  assert.equal(url.searchParams.has('token'), false);
});

test('recordFields always protects purchase data', () => {
  const fields = recordFields({
    code: 'BCN-001', instance: 'net', asset: 1, location: 'XP-002',
    observed_zone: '', observed_zone_en: '', dimensions: null, confirmed_on: '2026-10-05', history: []
  });
  assert.ok(fields.every(([, v]) => !/ADM-NETW|serial/i.test(String(v)) || /Yokup/.test(String(v))));
});

test('redactPrivateInventoryFields clears warranty keys', () => {
  assert.deepEqual(redactPrivateInventoryFields({garantia: 'x', serial: 'y', ok: 1}), {garantia: '', serial: '', ok: 1});
});
