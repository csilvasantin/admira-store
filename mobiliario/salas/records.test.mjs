import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALSEA, FIELDS, XTANCO, ficha, garantia, health, reponerUrl, salida } from './records.mjs';

const registry = JSON.parse(fs.readFileSync(new URL('../../inventario/registry.json', import.meta.url)));
const numbers = new Set(Object.values(registry.numbers));

test('cada ficha tiene los catorce atributos y un número del registro', () => {
  assert.equal(FIELDS.length, 14);
  for (const item of [...ALSEA, ...XTANCO]) {
    const card = ficha(item);
    for (const field of FIELDS) assert.ok(field in card, item.identificador + ' ' + field);
    assert.equal(card.compra.ejemplo, true);
    assert.ok(numbers.has(item.numero), String(item.numero));
    if (item.tipo === 'pantalla') assert.ok(item.pantalla.circuito);
    else assert.equal(item.pantalla, null);
  }
  const demo = ALSEA.find((item) => item.identificador === 'alsea-menu-3');
  assert.equal(health(demo), 'rojo');
  assert.equal(garantia(demo), 'fuera');
  assert.equal(salida(demo), 'reponer');
  const shop = new URL(reponerUrl(demo));
  assert.equal(shop.origin, 'https://admira.shop');
  assert.equal(shop.pathname, '/p/ejemplo-pantalla/');
  assert.equal(shop.searchParams.get('origen'), 'yokup');
  assert.equal(shop.searchParams.get('equipo'), 'alsea-menu-3');
  assert.equal(shop.searchParams.get('local'), 'cafeteria-alsea');
  assert.equal(shop.searchParams.get('pantalla'), 'Pizarra 3');
  const planta = ALSEA.find((item) => item.identificador === 'alsea-planta');
  const sinPantalla = new URL(reponerUrl(planta));
  assert.equal(sinPantalla.searchParams.get('origen'), 'yokup');
  assert.equal(sinPantalla.searchParams.get('equipo'), 'alsea-planta');
  assert.equal(sinPantalla.searchParams.get('local'), 'cafeteria-alsea');
  assert.equal(sinPantalla.searchParams.get('pantalla'), null);
  const vacia = new URL(reponerUrl({ identificador: 'equipo-sin-datos', modeloTienda: 'ejemplo-pantalla' }));
  assert.equal(vacia.pathname, '/p/ejemplo-pantalla/');
  assert.equal(vacia.searchParams.get('origen'), 'yokup');
  assert.equal(vacia.searchParams.get('equipo'), 'equipo-sin-datos');
  assert.equal(vacia.searchParams.get('local'), null);
  assert.equal(vacia.searchParams.get('pantalla'), null);
  assert.equal(vacia.search, '?origen=yokup&equipo=equipo-sin-datos');
  assert.equal(demo.modeloEjemplo, true);
  assert.equal(health(ALSEA[0]), 'verde');
  assert.equal(garantia(ALSEA[0]), 'en_garantia');
});

test('Alsea reutiliza la base Xtanco y no inventa el 44', () => {
  assert.equal(ALSEA[0].numero, 1);
  assert.equal(XTANCO[0].numero, 1);
  assert.equal(ALSEA.find((item) => item.tipo === 'planta').numero, 9);
  assert.equal(XTANCO.find((item) => item.tipo === 'planta').numero, 9);
  assert.equal(ALSEA.filter((item) => item.numero === 13).length, 3);
  assert.ok([...ALSEA, ...XTANCO].every((item) => item.numero < 44));
  assert.equal(Object.values(registry.numbers).includes(44), false);
});
