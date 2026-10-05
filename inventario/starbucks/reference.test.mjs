import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {indexReferences, referenceLabel, referencePhotoURL, selectReference, selectionURL, nameFor} from './reference-model.mjs';

const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url)));
const document = JSON.parse(await readFile(new URL('./references.json', import.meta.url)));
const index = indexReferences(document, manifest.units);
const base = 'https://www.xpaceos.com/inventario/starbucks/';

test('61 stable photographic references retain their number, identity and real image file', async () => {
  assert.equal(index.items.length, 61); assert.equal(index.byId.size, 61); assert.equal(index.byNumber.size, 61);
  assert.deepEqual(index.items.map(reference => reference.reference_number), Array.from({length:61}, (_, i) => i + 1));
  for (const reference of index.items) {
    assert.equal(reference.reference_id, 'PG103-' + referenceLabel(reference));
    assert.ok(reference.name && reference.name_en); assert.ok(reference.basis && reference.basis_en);
    assert.ok(['element','type','context','position_reference'].includes(reference.photo_scope));
    await access(new URL(reference.photo, import.meta.url));
    assert.match(referencePhotoURL(reference, base), /^https:\/\/www\.xpaceos\.com\/inventario\/starbucks\/photos\/.+\.(webp|png)$/);
  }
});

test('all 12 inventory units map to matching references without renumbering the seven models', () => {
  assert.equal(index.byCode.size, 12); assert.equal(manifest.units.length, 12);
  for (const unit of manifest.units) {
    const reference = index.byCode.get(unit.itil_code);
    assert.equal(reference.asset_number, unit.asset_number); assert.equal(reference.reference_id, unit.reference_id);
    assert.equal(reference.reference_number, unit.reference_number); assert.equal(reference.photo, unit.photo);
  }
  assert.deepEqual([...new Set(manifest.units.map(unit => unit.asset_number))], [44,45,46,47,48,49,50,52]);
  const sharedType = index.items.filter(reference => reference.asset_number === 48 || reference.asset_number === 49);
  assert.equal(sharedType.length, 6); assert.ok(sharedType.every(reference => reference.photo_scope === 'type' && reference.visible_quantity == null));
});

test('candidates and products select real-photo records without inventing a CI or 3D model', () => {
  const unregistered = index.items.filter(reference => reference.status !== 'registered');
  assert.equal(unregistered.length, 49);
  for (const reference of unregistered) {
    const selection = selectReference(index, manifest.units, new URLSearchParams({ref:reference.reference_id}));
    assert.equal(selection.view, 'references'); assert.equal(selection.reference, reference); assert.equal(selection.unit, null);
    assert.equal(reference.itil_code, undefined); assert.equal(reference.asset_number, undefined);
    assert.equal(reference.model3d, undefined); assert.equal(reference.master, undefined);
    const url = selectionURL(base + '?item=PDG103-BOT-01&lang=en', {...selection});
    assert.equal(url.searchParams.get('item'), null); assert.equal(url.searchParams.get('ref'), reference.reference_id);
    assert.equal(url.searchParams.get('lang'), 'en');
  }
});

test('legacy item and instance links select the same registered unit and preserve language', () => {
  for (const unit of manifest.units) for (const item of [unit.itil_code, unit.instance_id]) {
    const selection = selectReference(index, manifest.units, new URLSearchParams({item,lang:'en'}));
    assert.equal(selection.view, 'inventory'); assert.equal(selection.unit, unit);
    const url = selectionURL(base + '?lang=en', selection);
    assert.equal(url.searchParams.get('item'), unit.itil_code); assert.equal(url.searchParams.get('ref'), unit.reference_id);
    assert.equal(url.searchParams.get('lang'), 'en');
  }
  const ref = index.byCode.get('PDG103-BOT-01');
  assert.equal(nameFor(ref, null, 'en'), ref.name_en);
  assert.equal(nameFor(ref, null, 'es'), ref.name);
});

test('reference validation rejects missing photos, duplicate numbers and crossed inventory links', () => {
  const change = mutate => { const copy = structuredClone(document); mutate(copy); return copy; };
  assert.throws(() => indexReferences(change(copy => { delete copy.items[0].photo; }), manifest.units), /Reference photo/);
  assert.throws(() => indexReferences(change(copy => { copy.items[1].reference_id = copy.items[0].reference_id; copy.items[1].reference_number = copy.items[0].reference_number; }), manifest.units), /Duplicate reference/);
  assert.throws(() => indexReferences(change(copy => { copy.items[0].asset_number = 50; }), manifest.units), /does not match/);
  assert.throws(() => indexReferences(change(copy => { copy.items = copy.items.filter(item => item.itil_code !== manifest.units[0].itil_code); }), manifest.units), /no photographic reference/);
  assert.throws(() => indexReferences(change(copy => { copy.items.find(item => item.status === 'candidate').asset_number = 50; }), manifest.units), /Unregistered references/);
  assert.throws(() => referencePhotoURL({photo:'../assets/catalog/50/preview.png'}, base), /Reference photo/);
});
