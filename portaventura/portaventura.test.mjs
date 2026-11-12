// Sección PortAventura (12-nov-2026): 4 espacios, foco store/restaurante, zona 2 con AdmiraNeXT01-05, sin iframes a la DMZ.
import test from 'node:test'; import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs'; import {createRequire} from 'node:module';
const require = createRequire(import.meta.url); const PA = require('./pa.js'); const Gemelo = require('../xpacios/gemelo/gemelo.js');
test('4 espacios en orden, foco en store y restaurante', () => {
  assert.deepEqual(PA.ESPACIOS.map(x => x.id), ['store', 'restaurante', 'hotel', 'atraccion']);
  assert.deepEqual(PA.ESPACIOS.filter(x => x.foco).map(x => x.id), ['store', 'restaurante']);
  for (const x of PA.ESPACIOS) assert.match(x.dmz, /^https:\/\/www\.portaventuranext\.com\/dmz\//);
});
test('store y restaurante tienen gemelo válido para el creador', () => {
  for (const id of ['store', 'restaurante']) { const b = Gemelo.normaliza(PA.borrador(PA.espacio(id))); assert.equal(b.items.length, PA.espacio(id).gemelo.items.length); assert.ok(Gemelo.cuenta(b).pantallas >= 4); }
});
test('hotel = interactivo de la cocina; zona 2 = 5 PCs y 8 pantallas', () => {
  assert.equal(PA.espacio('hotel').interactivo, '/supercomputer/pc-cocina/');
  assert.deepEqual(PA.ZONA2.map(p => p.pc), ['01', '02', '03', '04', '05']);
  assert.equal(PA.ZONA2.flatMap(p => p.pant).length, 8);
});
test('ninguna página incrusta la DMZ (Access no deja iframes)', () => {
  const js = readFileSync(new URL('./pagina.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /iframe[^>]*x\.dmz/);
  const sel = readFileSync(new URL('../admira-xp/scripts/project-selector.mjs', import.meta.url), 'utf8');
  assert.match(sel, /f\.src=cv\.here\|\|cv\.url/);
});
