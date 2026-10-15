// Matrix de los centros = la foto 360 real (Carlos, 15-oct-2026: «https://panorama-viewer-d8j.pages.dev/ es este
// el modo Matrix de Diagonal») y los tres combos de la barra también aquí («cuando paso de Paseo de Gracia a
// Diagonal se pierde la interface superior para seleccionar proyecto, local y calidad»).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fuentesPanorama, FOV_MIN, FOV_MAX } from './panorama.mjs';
import { nombreLocal, CALIDADES } from '../../assets/xpace-combos.mjs';

const aqui = p => new URL(p, import.meta.url);
const centros = JSON.parse(readFileSync(aqui('./centros.json'), 'utf8')).centros;
const refs = JSON.parse(readFileSync(aqui('./referencias/referencias-arquitecto.json'), 'utf8')).references;
const visor = readFileSync(aqui('./visor.mjs'), 'utf8');

test('Paseo de Gràcia 103 y Diagonal 634 tienen su foto 360 con la vista guardada en el visor de panoramas', () => {
  const por = Object.fromEntries(centros.map(c => [c.id, c]));
  const vistaDe = centro => refs.find(r => r.center.replace('Gracia', 'Gràcia') === centro || r.center === centro).view;
  assert.deepEqual(por.pg103.panorama.vista, vistaDe('Paseo de Gracia 103'));
  assert.deepEqual(por.d634.panorama.vista, vistaDe('Diagonal 634'));
  for (const id of ['pg103', 'd634']) {
    const p = por[id].panorama;
    for (const f of [p.src, p.srcMovil, p.previa].filter(Boolean)) assert.ok(statSync(aqui('./' + f)).size > 300000, `${id}: ${f}`);
    assert.match(p.origen, /^https:\/\/panorama-viewer-d8j\.pages\.dev\/\?image=/);
  }
  assert.ok(!por.gdg51.panorama, 'el laboratorio enlaza su gemelo, no tiene foto 360');
});

test('se pide primero la previa y después la buena que admite la tarjeta (8K o 4K)', () => {
  const d634 = centros.find(c => c.id === 'd634').panorama;
  assert.deepEqual(fuentesPanorama(d634, 16384), ['referencias/diagonal-634.jpg', 'referencias/diagonal-634-8k.jpg']);
  assert.deepEqual(fuentesPanorama(d634, 4096), ['referencias/diagonal-634.jpg', 'referencias/diagonal-634-4k.jpg']);
  const pg = centros.find(c => c.id === 'pg103').panorama;
  assert.deepEqual(fuentesPanorama(pg, 8192), ['referencias/paseo-gracia-103.webp']);
  assert.deepEqual(fuentesPanorama(pg, 4096), ['referencias/paseo-gracia-103-4k.jpg']);
  assert.deepEqual([FOV_MIN, FOV_MAX], [30, 100], 'el mismo zoom que el visor de panoramas');
});

test('el visor usa la foto en Matrix y monta los tres combos; un local de esta página cambia de centro sin recargar', () => {
  assert.match(visor, /import \{ crearPanorama \} from '\.\/panorama\.mjs/);
  assert.match(visor, /if \(enPanorama\(\)\) pano\.render\(\); else renderer\.render\(scene, camera\);/);
  assert.match(visor, /import \{ montarCombos \} from '\/assets\/xpace-combos\.mjs/);
  assert.match(visor, /alCambiarCalidad: q => \{[^}]*modo = q === 'matrix' \? 'matrix' : '3d'/);
  assert.match(visor, /if \(u\.pathname !== location\.pathname \|\| !c\) return false;\s*cargarCentro\(c\.id\); return true;/);
});

test('los combos: las cuatro calidades del gemelo y el local sin repetir el Xpacio', () => {
  assert.deepEqual(CALIDADES.map(([id]) => id), ['good', 'better', 'best', 'matrix']);
  const proyectos = [{ id: 'starbucks', name: 'Starbucks' }];
  assert.equal(nombreLocal({ project_id: 'starbucks', name: 'Starbucks Diagonal 634 · Barcelona' }, proyectos), 'Diagonal 634 · Barcelona');
  assert.equal(nombreLocal({ project_id: 'starbucks', name: 'Gran de Gràcia 51 · laboratorio' }, proyectos), 'Gran de Gràcia 51 · laboratorio');
  const gdg = readFileSync(aqui('../gran-de-gracia-51/index.html'), 'utf8');
  assert.match(gdg, /montarCombos\(\{ proyecto: 'starbucks', local: \['lab-gran-de-gracia-51'\]/);
});
