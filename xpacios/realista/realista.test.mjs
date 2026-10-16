// Escena realista (misión DCL-a6cb621be0ce5932f50960de, 16-oct-2026): registro, elección de modo y
// su respaldo, acabado por local y colocación de los 18 formatos de Altadis en el Xtanco Best.
// Sin DOM ni WebGL: lo de three.js se comprueba en la prueba headless (doc del xpacio).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { escenaDesdePlano } from '../gran-de-gracia-51/plano3d.mjs';
import { uvsFormato } from '../altadis-18/recorte.mjs';
import { camaraEncuadre, MIN_REALISTA } from '../altadis-18/vista.mjs';
import { ZONAS } from '../altadis-18/espacios.mjs';
import { ESCENAS_REALISTAS, escenaRealista, validarEscena, zonaDe, modoDesdeURL, soporteRealista, elegirModo, acabadoPorId, ACABADOS, hashId, ESPERA_MODELO_MS } from './escenas-realistas.mjs';
import { displayPlacementForReference, geometriaDesdePantallas, TWIN_REFERENCES, FORMAT_REFERENCE_MAP, TRIAL_FIXTURE_POLICY } from './catalogo.mjs';
import { montarFormato, escenaMontada, dentroDeZona, paredesEscena, MARCO, girar } from './montaje.mjs';

const leer = f => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
const INDICE = leer('../altadis-18/planos/altadis-18.json');
const CIRCUITO = leer('../altadis-18/planos/altadis-espana-10.json');
const XTANCO = ESCENAS_REALISTAS.xtanco;
const r3 = v => Math.round(v * 1000) / 1000 + 0;

// Cajas (x, y arriba, z) de los muebles que se conservan en el GLB publicado (sha 77b4f4c7…),
// medidas de sus accesores el 16-oct-2026. Ninguna pantalla ni zona puede atravesarlos.
const MUEBLES_GLB = {
  mostrador: { min: [2, 0, 1.4], max: [5, 1.05, 2.11] },
  vitrina: { min: [1.9, 0, 0], max: [5.1, 2.1, 0.45] },
  expendedora: { min: [0.45, 0, 0], max: [1.35, 1.85, 0.81] },
  tpv: { min: [4.45, 1.05, 1.62], max: [4.75, 1.173, 1.87] },
  'pantalla-escaparate': { min: [0.15, 0, 1.38], max: [0.6, 1.9, 2.62] },
};
const corta = (a, b) => [0, 1, 2].every(i => a.min[i] < b.max[i] - 1e-9 && b.min[i] < a.max[i] - 1e-9);
const cajaZona = z => { const b = z.definition.mount.zone; return { min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] }; };
function cajaPantalla(p) {
  if (p.cubo) { const l = p.cubo.lado / 2; return { min: [p.centro[0] - l, p.z, p.centro[1] - l], max: [p.centro[0] + l, p.z1, p.centro[1] + l] }; }
  const hx = Math.abs(p.u[0]) * p.w / 2 + 0.03, hz = Math.abs(p.u[1]) * p.w / 2 + 0.03;
  return { min: [p.centro[0] - hx, p.z, p.centro[1] - hz], max: [p.centro[0] + hx, p.z1, p.centro[1] + hz] };
}

/** Las pantallas del formato en el gemelo de siempre (las que pinta el visor en Esquema). */
function delFormato(f) {
  const plan = leer(`../altadis-18/planos/${f.espacios.xtanco}.json`);
  const e = escenaDesdePlano(plan);
  return { plan, suyas: e.pantallas.filter(p => p.recorte || p.formato === plan.formato.id) };
}

// ── Registro ────────────────────────────────────────────────────────────────
test('registry: Xtanco is valid and points at the published Xtanco Best GLB; Starbucks is an empty, prepared slot', () => {
  assert.deepEqual(validarEscena(XTANCO), []);
  assert.equal(XTANCO.modelo.sha256, '77b4f4c7346c0dacf22c3d8573f1d80536d367d3b64874115443c1b420edbb85');
  assert.equal(XTANCO.modelo.bytes, 13035628);
  assert.match(XTANCO.modelo.urls[0], /^https:\/\/stock\.admira\.store\/stock\/1791411065310-v2jraa\//);
  assert.ok(XTANCO.inventada && XTANCO.nota.es.includes('inventada') && XTANCO.nota.en.includes('not the real shop'));
  assert.equal(escenaRealista('xtanco'), XTANCO);
  assert.ok(Object.hasOwn(ESCENAS_REALISTAS, 'cafe'), 'Starbucks keeps its slot');
  assert.equal(escenaRealista('cafe'), null);
  for (const raro of ['nada', '__proto__', 'constructor', '', null]) assert.equal(escenaRealista(raro), null);
  assert.ok(Object.isFrozen(ESCENAS_REALISTAS.xtanco.zonas[0].definition.mount.zone));
});

test('registry: every format zone of the Altadis index has a mount zone inside the room that no kept fixture crosses', () => {
  const ids = XTANCO.zonas.map(z => z.id);
  for (const z of ZONAS) assert.ok(ids.includes(z), z);
  for (const z of XTANCO.zonas) for (const [nombre, m] of Object.entries(MUEBLES_GLB)) assert.ok(!corta(cajaZona(z), m), `${z.id} × ${nombre}`);
  // Lo que se conserva es lo de Studio; lo que se sustituye, la pantalla de pared del modelo.
  assert.equal(XTANCO.muebles.sustituida, TRIAL_FIXTURE_POLICY.replacedDisplayRoot);
  for (const m of ['mostrador', 'vitrina', 'expendedora', 'tpv']) assert.ok(XTANCO.muebles.preservados.includes(m) && !XTANCO.muebles.movibles.includes(m));
});

test('registry: zonaDe follows the index zone first, then the Studio map, then the mural', () => {
  assert.equal(zonaDe(XTANCO, { formato: 'cliente-08', zona: 'cubo' }).id, 'cubo');
  assert.equal(zonaDe(XTANCO, { formato: 'cliente-03', zona: 'superstretch' }).id, 'superstretch', 'the index wins');
  assert.equal(zonaDe(XTANCO, 'cliente-12').id, 'columna');
  assert.equal(zonaDe(XTANCO, 'cliente-99').id, 'mural');
  assert.equal(zonaDe(null, 'cliente-01'), null);
  for (const f of INDICE.formatos) assert.equal(zonaDe(XTANCO, f).id, f.zona || FORMAT_REFERENCE_MAP[f.formato]);
});

test('registry: the scene walls are clockwise with their normal pointing inside, and the door is on the facade', () => {
  const ps = paredesEscena(XTANCO), n = Object.fromEntries(ps.map(w => [w.id, w.n.map(r3)]));
  assert.deepEqual(n, { fondo: [0, 1], fachada: [1, 0], derecha: [-1, 0], frente: [0, -1] });
  assert.equal(ps.find(w => w.id === 'fachada').huecos[0].tipo, 'puerta');
});

// ── Modo y respaldo ─────────────────────────────────────────────────────────
test('mode: Realista by default for Xtanco; Esquema when asked, when the GLB fails or is slow, without support, and for Starbucks', () => {
  assert.deepEqual(elegirModo({ tipo: 'xtanco' }), { modo: 'realista', motivo: 'defecto', disponible: true });
  assert.deepEqual(elegirModo({ tipo: 'xtanco', estado: 'listo', pedido: 'realista' }), { modo: 'realista', motivo: 'pedido', disponible: true });
  assert.deepEqual(elegirModo({ tipo: 'xtanco', estado: 'cargando' }), { modo: 'realista', motivo: 'defecto', disponible: true }, 'still loading: wait for it');
  assert.deepEqual(elegirModo({ tipo: 'xtanco', pedido: 'esquema', estado: 'listo' }), { modo: 'esquema', motivo: 'pedido', disponible: true });
  assert.deepEqual(elegirModo({ tipo: 'xtanco', estado: 'fallo' }), { modo: 'esquema', motivo: 'fallo', disponible: false });
  assert.deepEqual(elegirModo({ tipo: 'xtanco', estado: 'fallo', pedido: 'realista' }), { modo: 'esquema', motivo: 'fallo', disponible: false }, 'a failed model is never retried');
  assert.deepEqual(elegirModo({ tipo: 'xtanco', estado: 'lento' }), { modo: 'esquema', motivo: 'lento', disponible: true });
  assert.equal(elegirModo({ tipo: 'xtanco', estado: 'lento', pedido: 'realista' }).modo, 'realista', 'asked by hand: wait again');
  assert.deepEqual(elegirModo({ tipo: 'xtanco', soporte: { ok: false, motivo: 'texturas' } }), { modo: 'esquema', motivo: 'texturas', disponible: false });
  assert.deepEqual(elegirModo({ tipo: 'cafe' }), { modo: 'esquema', motivo: 'sin-escena', disponible: false });
  assert.deepEqual(elegirModo({ tipo: 'cafe', pedido: 'realista' }), { modo: 'esquema', motivo: 'sin-escena', disponible: false });
  assert.equal(ESPERA_MODELO_MS, 12000);
});

test('mode: ?escena= and browser support', () => {
  assert.equal(modoDesdeURL('?escena=realista'), 'realista');
  assert.equal(modoDesdeURL('?escena=Realistic&lang=en'), 'realista');
  assert.equal(modoDesdeURL('?escena=esquema'), 'esquema');
  assert.equal(modoDesdeURL('?escena=schematic'), 'esquema');
  assert.equal(modoDesdeURL('?escena=otra'), null);
  assert.equal(modoDesdeURL(''), null);
  assert.deepEqual(soporteRealista({}), { ok: true, motivo: null });
  assert.deepEqual(soporteRealista({ webgl2: true, maxTextura: 16384, memoria: 4 }), { ok: true, motivo: null });
  assert.equal(soporteRealista({ webgl2: false }).motivo, 'sin-webgl2');
  assert.equal(soporteRealista({ maxTextura: 2048 }).motivo, 'texturas');
  assert.equal(soporteRealista({ memoria: 1 }).motivo, 'memoria');
});

// ── Acabado por local ───────────────────────────────────────────────────────
test('finish: deterministic per id, from the palettes, with a bounded light intensity', () => {
  const a = acabadoPorId('altadis-es-03-barcelona');
  assert.deepEqual(acabadoPorId('altadis-es-03-barcelona'), a);
  assert.equal(hashId('abc'), hashId('abc'));
  assert.notEqual(hashId('abc'), hashId('abd'));
  for (const id of ['x', 'altadis-xtanco-01', 'ñandú', '']) {
    const f = acabadoPorId(id);
    assert.ok(ACABADOS.pared.some(p => p.color === f.colorPared && p.id === f.pared));
    assert.ok(ACABADOS.suelo.some(p => p.color === f.colorSuelo && p.id === f.suelo));
    assert.ok(['calida', 'fria'].includes(f.luz));
    assert.ok(f.intensidad >= 0.9 && f.intensidad <= 1.1, String(f.intensidad));
  }
});

test('finish: the 10 tobacconists of the circuit do not look like the same shop ten times', () => {
  const fs = CIRCUITO.locales.map(l => acabadoPorId(l.id));
  assert.equal(fs.length, 10);
  assert.equal(new Set(fs.map(f => `${f.pared}/${f.suelo}/${f.luz}`)).size, 10, 'no two identical finishes');
  assert.ok(new Set(fs.map(f => f.pared)).size >= 5, 'at least five wall colours');
  assert.ok(new Set(fs.map(f => f.suelo)).size >= 3, 'at least three floors');
  assert.deepEqual(new Set(fs.map(f => f.luz)), new Set(['calida', 'fria']), 'warm and cool light');
});

// ── Colocación de los 18 formatos (catalogo.mjs + montaje.mjs) ──────────────
test('placement: the 18 Altadis formats fit their zone at physical scale, same screens, crops, sizes and layout', () => {
  assert.equal(INDICE.formatos.length, 18);
  for (const f of INDICE.formatos) {
    const { plan, suyas } = delFormato(f);
    const m = montarFormato(suyas, XTANCO, f);
    assert.equal(m.zona.id, f.zona, f.formato);
    assert.equal(m.escala, 1, `${f.formato}: physical metres, never stretched`);
    assert.ok(dentroDeZona(m.pantallas, m.zona), `${f.formato} inside ${m.zona.id}`);
    assert.equal(m.pantallas.length, suyas.length, `${f.formato}: same physical screens`);
    for (const p of m.pantallas) {
      const o = suyas.find(s => s.id === p.id);
      assert.ok(o, p.id);
      assert.deepEqual(p.recorte, o.recorte); assert.deepEqual(p.lienzo, o.lienzo);
      assert.equal(p.tecnologia, o.tecnologia); assert.equal(p.forma, o.forma);
      assert.equal(r3(p.w), r3(o.w), `${p.id} width`); assert.equal(r3(p.h), r3(o.h), `${p.id} height`);
      assert.deepEqual(p.n, [0, 1], `${p.id} faces the camera side (+z)`);
      for (const [nombre, mueble] of Object.entries(MUEBLES_GLB)) assert.ok(!corta(cajaPantalla(p), mueble), `${p.id} crosses ${nombre}`);
    }
    // Misma disposición relativa (a 1 cm: el plano redondea al milímetro y se separan los solapes).
    if (suyas.length > 1) {
      const a = [...suyas].sort((x, y) => x.id.localeCompare(y.id)), b = [...m.pantallas].sort((x, y) => x.id.localeCompare(y.id));
      for (let i = 1; i < a.length; i++) {
        assert.ok(Math.abs((b[i].centro[0] - b[0].centro[0]) - ((a[i].x0 + a[i].x1) / 2 - (a[0].x0 + a[0].x1) / 2)) < 0.01, `${a[i].id} across`);
        assert.ok(Math.abs((b[i].centro[2] - b[0].centro[2]) - (a[i].centro[2] - a[0].centro[2])) < 0.01, `${a[i].id} height`);
      }
    }
    // El vídeo se reparte igual: las UV de cada pantalla son las del gemelo de siempre.
    const lienzo = [plan.formato.ancho, plan.formato.alto];
    assert.deepEqual(uvsFormato(m.pantallas, { lienzo, medio: lienzo }), uvsFormato(suyas, { lienzo, medio: lienzo }), `${f.formato} UVs`);
    const e = escenaMontada(XTANCO, m, { id: f.espacios.xtanco });
    assert.equal(e.realista, true); assert.equal(e.sala.ancho, 6); assert.equal(e.pantallas, m.pantallas);
  }
});

test('placement: the plan mounting height is kept when the zone allows it', () => {
  for (const id of ['cliente-03', 'cliente-09', 'cliente-12', 'cliente-16']) {
    const f = INDICE.formatos.find(x => x.formato === id), { suyas } = delFormato(f), m = montarFormato(suyas, XTANCO, f);
    assert.equal(r3(Math.min(...m.pantallas.map(p => p.z))), r3(Math.min(...suyas.map(p => p.z))), id);
  }
});

test('placement: the LED cube keeps its four faces in order and shows the room-facing face to the camera', () => {
  const f = INDICE.formatos.find(x => x.formato === 'cliente-08'), { suyas } = delFormato(f), m = montarFormato(suyas, XTANCO, f);
  const [p] = m.pantallas, o = suyas[0];
  assert.equal(p.forma, 'cubo-4-caras');
  assert.deepEqual(p.cubo.caras.map(c => c.recorte), o.cubo.caras.map(c => c.recorte), 'same strips, same order');
  const frente = p.cubo.caras.find(c => c.n[0] === 0 && c.n[1] === 1);
  assert.deepEqual(frente.recorte, o.recorte, 'the face that faced the room now faces the camera');
  // Cada cara sigue a la derecha de la anterior: la normal gira -90° (de +z a +x, de +x a -z…).
  for (let i = 0; i < 4; i++) { const a = p.cubo.caras[i].n, b = p.cubo.caras[(i + 1) % 4].n; assert.deepEqual(girar(a, -Math.PI / 2), b); }
  assert.equal(r3(p.cubo.lado), r3(o.cubo.lado)); assert.equal(r3(p.cubo.alto), r3(o.cubo.alto));
});

test('placement: sub-millimetre overlaps from the plan are separated, not rejected', () => {
  const p = (id, x0, w) => ({ id, x0, x1: x0 + w, w, h: 0.6, z: 1.2, z1: 1.8, centro: [x0 + w / 2, 0, 1.5] });
  const g = geometriaDesdePantallas([p('a', 0, 1.085), p('b', 1.0843, 1.085)]);
  assert.equal(r3(g.segments[1].wall.x), 1.085);
  assert.ok(g.pared.ancho >= 2.17 - 1e-9);
  assert.throws(() => geometriaDesdePantallas([]), /invalid-wall/);
  // Un solape de verdad (más de 1 cm) no se maquilla: la colocación lo rechaza.
  const malo = geometriaDesdePantallas([p('a', 0, 1), p('b', 0.5, 1)]);
  assert.throws(() => displayPlacementForReference(malo, XTANCO.zonas[1], { escala: 'fisica' }), /overlapping-segments|incomplete-wall/);
});

// Lo portado de Studio (gemelo-catalog.mjs) sigue comportándose como allí.
test('Studio port: fit mode fills the zone, keeps the native aspect and rejects what does not fit', () => {
  const muro = (cols, ancho, alto) => ({ pared: { ancho, alto }, segments: Array.from({ length: cols }, (_, i) => ({ n: i + 1, N: cols, wall: { x: i * ancho / cols, y: 0, w: ancho / cols, h: alto } })), source: 'named_demo_grid' });
  const pl = displayPlacementForReference(muro(4, 3840, 540), 'mural');
  assert.equal(r3(pl.width), 7.3); assert.equal(r3(pl.width / pl.height), r3(3840 / 540));
  assert.equal(pl.pieces.length, 4); assert.equal(pl.faceCount, 1);
  const cubo = displayPlacementForReference({ pared: { ancho: 1600, alto: 600 }, segments: [{ n: 1, wall: { x: 0, y: 0, w: 1600, h: 600 } }] }, 'cubo');
  assert.deepEqual(cubo.pieces.map(p => r3(p.rotation)), [0, r3(Math.PI / 2), r3(Math.PI), r3(-Math.PI / 2)]);
  assert.throws(() => displayPlacementForReference(muro(1, 1, 1), 'nada'), /invalid-reference/);
  assert.throws(() => displayPlacementForReference({ pared: { ancho: 2, alto: 1 }, segments: [{ n: 1, wall: { x: 0, y: 0, w: 1, h: 1 } }] }, 'mural'), /incomplete-wall/);
  // Físico: un mural que no cabe en la zona se reduce (k < 1) y queda dentro.
  const enorme = { ...muro(4, 8, 1), source: 'installation_layout', allowGaps: true };
  const red = displayPlacementForReference(enorme, XTANCO.zonas.find(z => z.id === 'mural'), { escala: 'fisica', marco: MARCO });
  assert.ok(red.physicalScale < 1 && red.width <= 5.45 + 1e-9);
  assert.equal(TWIN_REFERENCES.length, 6);
});

// ── Encuadre ────────────────────────────────────────────────────────────────
test('framing: in the realistic scene a tiny screen is framed with some of the shop around it; big walls are unchanged', () => {
  const tablet = INDICE.formatos.find(x => x.formato === 'cliente-07'), mural = INDICE.formatos.find(x => x.formato === 'cliente-17');
  const mt = montarFormato(delFormato(tablet).suyas, XTANCO, tablet), mm = montarFormato(delFormato(mural).suyas, XTANCO, mural);
  const sala = escenaMontada(XTANCO, mt).sala;
  assert.ok(camaraEncuadre(mt.pantallas, { sala, ...MIN_REALISTA }).dist > camaraEncuadre(mt.pantallas, { sala }).dist * 2);
  assert.equal(camaraEncuadre(mm.pantallas, { sala, ...MIN_REALISTA }).dist, camaraEncuadre(mm.pantallas, { sala }).dist);
  const c = camaraEncuadre(mm.pantallas, { sala });
  assert.equal(r3(c.az), r3(Math.PI / 2), 'front-on: the camera looks along -z at the screens');
});
