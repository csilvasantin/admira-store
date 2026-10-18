// Gemelo 3D de Starbucks Paseo de Gracia desde su plano canónico (admira.xpacio-plano/1),
// con el mismo motor que el laboratorio Gran de Gràcia 51: plano público, escena, vistas y página.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePlan, escenaDesdePlano, vistaPuerta, vistaWebcam, vistaAlzado, tipoMueble } from '../gran-de-gracia-51/plano3d.mjs';
import { CAMPOS_PRIVADOS } from '../plano-publico.mjs';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const read = p => readFileSync(repo + p, 'utf8');
const PUBLICO = JSON.parse(read('data/xpacios/alsea-sbux-021.json'));
const LAB = JSON.parse(read('data/xpacios/lab-gran-de-gracia-51.json'));

test('the repository keeps only the public Starbucks plan: valid geometry, six screens, nothing of the ITIL map', () => {
  const { errores, avisos } = validatePlan(PUBLICO);
  assert.deepEqual(errores, []);
  assert.deepEqual(avisos, [], 'walls run clockwise and close');
  assert.equal(PUBLICO.id, 'alsea-sbux-021');
  assert.equal(PUBLICO.publico, true);
  assert.equal(PUBLICO.pantallas.length, 6);
  // La foto 360 (panorama) apunta a ficheros que ya son públicos en el visor de centros (paseo-gracia-103.webp, PG103-…):
  // el número de la calle no puede salir en el resto del plano.
  const { panorama, ...resto } = PUBLICO, texto = JSON.stringify(resto);
  assert.ok(panorama && panorama.src.startsWith('/xpacios/starbucks-centros/referencias/'), 'la 360 es la del visor de centros');
  for (const campo of CAMPOS_PRIVADOS) assert.ok(!JSON.stringify(PUBLICO).includes(`"${campo}"`), campo);
  for (const exacto of ['macstudio-starbucks', 'macmini-starbucks', '103', '08008', 'starbucks-six.json']) assert.ok(!texto.includes(exacto), exacto);
});

test('the mural doble H hangs over the bar on wall F as V–H–V–V–H–V, clear of the counter', () => {
  const e = escenaDesdePlano(PUBLICO);
  assert.ok(e.pantallas.every(p => p.pared === 'F'));
  assert.equal(e.grupos.length, 1);
  assert.equal(e.grupos[0].composicion, 'V–H–V–V–H–V');
  const barra = e.muebles.find(m => m.tipo === 'barra');
  assert.ok(barra && barra.frente === 'F' && barra.apoyado, 'the bar stands against wall F');
  for (const p of e.pantallas) {
    assert.equal(p.apoyo, null, `${p.id} hangs on the wall, it does not stand on the bar`);
    assert.ok(p.z > barra.alto + 0.5, `${p.id} clears the counter`);
    assert.ok(p.x0 >= barra.x - 0.01 && p.x1 <= barra.x + barra.w + 0.01, `${p.id} stays over the bar`);
  }
});

test('café furniture is recognised and the lab keeps its types', () => {
  const tipos = escenaDesdePlano(PUBLICO).muebles.map(m => m.tipo).sort();
  // Desde el 18-10-2026 el plano trae también las tres cestas y el iPad (piezas del catálogo 52–55).
  assert.deepEqual(tipos, ['barra', 'caja', 'cesta', 'cesta', 'cesta', 'estanteria', 'ipad', 'mesa', 'mesa', 'pilar', 'vitrina']);
  assert.deepEqual(LAB.mobiliario.map(tipoMueble), ['mesa', 'mesa', 'nevera', 'recreativa', 'mueble', 'silla', 'silla']);
});

test('views: from the street door, plan and elevations; no webcam view without a webcam', () => {
  const e = escenaDesdePlano(PUBLICO);
  const puerta = vistaPuerta(e);
  assert.ok(puerta && puerta.pared === 'C', 'the street door is on wall C');
  assert.equal(vistaWebcam(e), null);
  assert.equal(vistaAlzado(e, 'F').ancho, 14);
  assert.deepEqual(e.paredes.map(w => w.id), ['F', 'D', 'P', 'C']);
});

test('the page uses the shared engine with the café finish, the current shell and no exact address', () => {
  const html = read('xpacios/starbucks-paseo-de-gracia/index.html');
  const lab = read('xpacios/gran-de-gracia-51/index.html');
  const portada = read('index.html');
  const shell = (portada.match(/\/assets\/xpace-shell\.js\?v=([^"'&\s]+)/) || [])[1];
  assert.ok(html.includes(`/assets/xpace-shell.js?v=${shell}`), 'current shell release');
  assert.match(html, /XPACIO_GEMELO=\{loc:'alsea-sbux-021',tema:'cafeteria'/);
  const motor = s => (s.match(/gemelo\.mjs\?v=([^"']+)/) || [])[1];
  assert.equal(motor(html), motor(lab), 'both pages load the same engine release');
  for (const exacta of ['Paseo de Gracia 103', '08008', 'admira.biz/plano.html', 'macstudio-starbucks']) assert.ok(!html.includes(exacta), exacta);
  const lista = read('xpacios/index.html');
  assert.match(lista, /href="\/xpacios\/starbucks-paseo-de-gracia\/"/);
  assert.ok(!/Paseo de Gracia 103|08008/.test(lista), 'the public listing does not expose the exact address');
});
