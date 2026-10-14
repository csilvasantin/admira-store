// Versión pública de los planos de Xpacio (DCL-6ae9d5b0e2d48ee2fd9c7b19): criterio del ITIL de Yokup,
// ningún mapa público de qué pantalla real hay en qué pared.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { planoPublico, direccionPublica, nombrePublico, CAMPOS_PRIVADOS } from './plano-publico.mjs';
import { escenaDesdePlano, validatePlan } from './gran-de-gracia-51/plano3d.mjs';

const PUBLICO = JSON.parse(readFileSync(new URL('../data/xpacios/lab-gran-de-gracia-51.json', import.meta.url), 'utf8'));
const COMPLETO = {
  ...PUBLICO, nombre: 'Laboratorio AdmiraNeXT · Gran de Gràcia 51', direccion: 'Carrer Gran de Gràcia 51, 1.ª planta · 08012 Barcelona',
  yokup: { site_id: 'x', portal: 'https://admira.app/retailer#itil' }, contenidos: { instalacion: 'starbucks-six' },
  paredes: PUBLICO.paredes.map(w => ({ ...w, nombre: `Pared con puesto de Carlos ${w.id}` })),
  mobiliario: PUBLICO.mobiliario.map((m, i) => ({ ...m, id: i ? m.id : 'mesa-carlos', nombre: i ? m.nombre : 'Mesa · puesto de Carlos' })),
  pantallas: PUBLICO.pantallas.map((s, i) => ({ ...s, id: `macmini-starbucks-${i}`, screenId: `macmini-starbucks-${i}`, itil: `GDG51-PAN-0${i + 1}`, subgrupo: 'H-mini', estado: 'en servicio' })),
  dispositivos: PUBLICO.dispositivos.map((d, i) => ({ ...d, itil: `GDG51-PLY-0${i + 1}`, fleet: 'MacMini', rol: d.rol === 'portátil' ? 'portátil con pantalla integrada' : 'player V–H–V del puesto de Carlos' })),
};
delete COMPLETO.publico;
const claves = (o, out = new Set()) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { out.add(k); claves(v, out); } return out; };

test('the public plan keeps the geometry and drops ITIL codes, screenIds, Yokup, contents and the exact address', () => {
  const p = planoPublico(COMPLETO);
  assert.equal(p.publico, true);
  for (const k of CAMPOS_PRIVADOS) assert.ok(!claves(p).has(k), k);
  const texto = JSON.stringify(p);
  for (const x of ['GDG51', 'macmini-starbucks', '08012', 'Carrer', 'Carlos', '1.ª planta', 'MacMini']) assert.ok(!texto.includes(x), x);
  assert.equal(p.nombre, 'Laboratorio AdmiraNeXT · Gran de Gràcia');
  assert.equal(p.direccion, 'Gran de Gràcia · Barcelona');
  assert.deepEqual(p.paredes.map(w => [w.id, w.a, w.b]), COMPLETO.paredes.map(w => [w.id, w.a, w.b]));
  assert.deepEqual(p.pantallas.map(s => [s.pared, s.s, s.z, s.orientacion, s.pulgadas]), COMPLETO.pantallas.map(s => [s.pared, s.s, s.z, s.orientacion, s.pulgadas]));
  assert.deepEqual(p.pantallas.map(s => s.id), ['pantalla-1', 'pantalla-2', 'pantalla-3', 'pantalla-4', 'pantalla-5', 'pantalla-6', 'pantalla-7']);
  assert.deepEqual(validatePlan(p).errores, []);
  const e = escenaDesdePlano(p, { colocacion: { macmini: 'bajo-mesa' } });
  assert.equal(e.pantallas.length, 7);
  assert.equal(e.pantallas.filter(x => x.portatil).length, 1, 'the laptop is still drawn as a laptop');
  assert.ok(e.pantallas.every(x => x.textura === null), 'no capture URL carries a screenId');
  assert.deepEqual(e.grupos.map(g => g.composicion), ['V–H–V', 'V–H–V']);
  assert.deepEqual(planoPublico(p), p, 'idempotent');
});

test('public names and addresses keep the street and the city, without numbers, floors or postcodes', () => {
  assert.equal(direccionPublica('Carrer Gran de Gràcia 51, 1.ª planta · 08012 Barcelona'), 'Gran de Gràcia · Barcelona');
  assert.equal(direccionPublica('Paseo de Gracia 103 · 08008 Barcelona'), 'Gracia · Barcelona');
  assert.equal(direccionPublica('Calle Santa Rosa 19, Barcelona'), 'Santa Rosa · Barcelona');
  assert.equal(direccionPublica(''), '');
  assert.equal(nombrePublico('Laboratorio AdmiraNeXT · Gran de Gràcia 51'), 'Laboratorio AdmiraNeXT · Gran de Gràcia');
  assert.equal(nombrePublico('Starbucks Paseo de Gracia 103'), 'Starbucks Paseo de Gracia');
  const propio = planoPublico({ ...COMPLETO, publico: { nombre: 'Lab', direccion: 'Barcelona' } });
  assert.equal(propio.nombre, 'Lab');
  assert.equal(propio.direccion, 'Barcelona');
});
