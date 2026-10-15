// Matrix de los centros = la foto 360 real (Carlos, 15-oct-2026: «https://panorama-viewer-d8j.pages.dev/ es este
// el modo Matrix de Diagonal») y los tres combos de la barra también aquí («cuando paso de Paseo de Gracia a
// Diagonal se pierde la interface superior para seleccionar proyecto, local y calidad»).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
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
  assert.match(visor, /if \(enPanorama\(\)\) \{[\s\S]*?pano\.pintarPantalla\(p\.id, p\.contenido\.material\.map\)[\s\S]*?pano\.render\(\);\s*\} else renderer\.render\(scene, camera\);/);
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

test('en la foto 360 de Diagonal emiten sus seis pantallas: las del modelo, de izquierda a derecha', () => {
  const d634 = centros.find(c => c.id === 'd634').panorama;
  const geo = JSON.parse(readFileSync(aqui('./modelos/diagonal-634.geometry.json'), 'utf8'));
  const ids = [...geo.screens].sort((a, b) => a.position[0] - b.position[0]).map(s => s.id);
  assert.deepEqual(d634.base, [8192, 4096]);
  assert.deepEqual(d634.pantallas.map(p => p.id), ids, 'mismo orden que el modelo (2 + 1 + 3)');
  let antes = -1;
  for (const p of d634.pantallas) {
    assert.equal(p.esquinas.length, 4);
    for (const [x, y] of p.esquinas) assert.ok(x > 0 && x < 8192 && y > 0 && y < 4096);
    const [tl, tr, br, bl] = p.esquinas;
    assert.ok(tr[0] > tl[0] && br[0] > bl[0] && bl[1] > tl[1] && br[1] > tr[1], `${p.id}: esquinas en orden`);
    assert.ok(tl[0] >= antes, `${p.id}: a la derecha de la anterior`); antes = tl[0];
  }
  const pano = readFileSync(aqui('./panorama.mjs'), 'utf8');
  assert.match(pano, /ponerPantallas\(\[\.\.\.\(conf\.pantallas \|\| \[\]\), \.\.\.\(conf\.piezas \|\| \[\]\)\], conf\.base\)/);
  assert.match(visor, /const id = pano\.elegir\([\s\S]*?seleccionar\(id\);/, 'tocar una pantalla en la foto enseña su playlist');
});

test('las ventanas se mueven, cambian de tamaño, se cierran y vuelven desde el dock; el visor es oscuro con marca', () => {
  const v = readFileSync(aqui('./ventanas.mjs'), 'utf8'), css = readFileSync(aqui('./centros.css'), 'utf8');
  for (const que of ['vent-barra', 'vent-cerrar', 'vent-esquina', 'vent-dock', 'vent-abrir', 'setPointerCapture', 'localStorage']) assert.ok(v.includes(que), que);
  assert.match(visor, /montarVentanas\(\$\('#sc'\), \[\s*\{ el: \$\('\.ficha'\), id: 'ficha'[\s\S]*?id: 'pantallas'[\s\S]*?id: 'reproductor'/);
  assert.match(css, /\.vent\.vent-cerrada\{display:none!important\}/);
  assert.match(css, /#sc\{--panel:#0d1915e8;--linea:#2c463c;--tinta:#eef4ef;--suave:#a9bdb3;color:var\(--tinta\)\}/);
});

test('Diagonal es un clon de Paseo de Gràcia en el mostrador: TPV con el hilo musical e iPad con la gestión de colas', async () => {
  const d634 = centros.find(c => c.id === 'd634').panorama;
  assert.deepEqual(d634.piezas.filter(p => p.tipo !== 'eink').map(p => [p.id, p.tipo]), [['D634-TPV', 'tpv'], ['D634-IPAD', 'ipad']]);
  for (const p of d634.piezas) assert.equal(p.esquinas.length, 4);
  const html = readFileSync(aqui('./index.html'), 'utf8');
  assert.match(html, /window\.XpaceStarbucks=window\.XpaceStarbucks\|\|\{active:\(\)=>document\.documentElement\.dataset\.panorama==='1'\}/);
  assert.match(html, /<script defer src="\/admira-xp\/scripts\/ipad-cola\.js\?v=[^"]+"><\/script>/, 'el mismo gestor de colas que el iPad de Paseo de Gràcia');
  assert.match(visor, /if \(p\) \{ tocarPieza\(p\); return; \}/);
  const { lineas } = await import('./hilo-tpv.mjs');
  assert.deepEqual(lineas('Best Songs Of 1983! #music #80smusic #1983 #oldsong'), ['Best Songs Of 1983!']);
  assert.ok(readFileSync(aqui('./hilo-tpv.mjs'), 'utf8').includes("'/admira-xp/api/music-playlist'"), 'la misma playlist que el TPV de Paseo de Gràcia');
});

test('la playlist del hilo musical se deja leer desde xpaceos.com (sin funciones propias)', async t => {
  // La función vive en admira.store; el gemelo xpaceos no la publica (GitHub Pages) y la lee de allí.
  const ruta = new URL('../../functions/admira-xp/api/music-playlist.js', import.meta.url);
  if (!existsSync(ruta)) { t.skip('este repo no publica la función: la lee de admira.store'); return; }
  const { onRequest } = await import(ruta.href);
  const fuente = async () => ({ ok: true, json: async () => ({ ok: true, draft: { rev: 1, items: [] }, auto: [] }) });
  const r = await onRequest({ request: new Request('https://www.admira.store/admira-xp/api/music-playlist', { headers: { Origin: 'https://www.xpaceos.com' } }) }, fuente);
  assert.equal(r.headers.get('access-control-allow-origin'), 'https://www.xpaceos.com');
  const otro = await onRequest({ request: new Request('https://www.admira.store/admira-xp/api/music-playlist', { headers: { Origin: 'https://evil.example' } }) }, fuente);
  assert.equal(otro.headers.get('access-control-allow-origin'), null);
});

test('las 4 pantallas de tinta electrónica de la zona de los cafés de Diagonal, con las imágenes de Trinity en Stock', () => {
  const tinta = centros.find(c => c.id === 'd634').panorama.piezas.filter(p => p.tipo === 'eink');
  assert.deepEqual(tinta.map(p => p.id), ['D634-EINK-SUAU', 'D634-EINK-MITJA', 'D634-EINK-1971', 'D634-EINK-INTENS'], 'el de 1971 va después del de Mitjà: lo tapa');
  for (const p of tinta) { assert.match(p.imagen, /^https:\/\/stock\.admira\.store\/stock\/\d+-[a-z0-9]+\/asset\.png$/); assert.equal(p.esquinas.length, 4); }
  assert.match(readFileSync(aqui('./panorama.mjs'), 'utf8'), /depthTest: false \}\)\);\s*m\.renderOrder = 1 \+ cuadros\.size;/);
});

test('el visor abre con la interfaz limpia (como con H); H o ☰ ▤ ⌘ la abren', () => {
  const html = readFileSync(aqui('./index.html'), 'utf8'), css = readFileSync(aqui('./centros.css'), 'utf8');
  const ui = readFileSync(aqui('../../assets/interfaz-limpia.js'), 'utf8');
  assert.match(html, /<script src="\/assets\/interfaz-limpia\.js\?v=[^"]+"><\/script>/);
  assert.match(css, /html\.ui-limpia #sc \.vent,html\.ui-limpia #sc \.vent-dock\{display:none!important\}/);
  assert.match(ui, /e\.key\.toLowerCase\(\) !== 'h'/);
  assert.match(ui, /#topBar \[data-quad-toggle\], #topBar #pfOptions, #topBar #pfExpert/);
  assert.doesNotMatch(ui, /addEventListener\('xpace:shell-panel'/, 'la barra abre sola el panel ⌘ al cargar: eso no destapa');
});

test('Paseo de Gràcia 103 igual: sus 6 pantallas, el TPV y el iPad (horizontal) en la foto 360, desde la calibración del gemelo', () => {
  const pg = centros.find(c => c.id === 'pg103').panorama;
  const geo = JSON.parse(readFileSync(aqui('./modelos/paseo-gracia-103.geometry.json'), 'utf8'));
  assert.deepEqual(pg.base, [8192, 4096]);
  assert.deepEqual(pg.pantallas.map(p => p.id), [...geo.screens].sort((a, b) => a.position[0] - b.position[0]).map(s => s.id));
  assert.deepEqual(pg.piezas.map(p => [p.id, p.tipo, !!p.horizontal]), [['PG103-TPV', 'tpv', false], ['PG103-IPAD', 'ipad', true]]);
  for (const p of [...pg.pantallas, ...pg.piezas]) for (const [x, y] of p.esquinas) assert.ok(x >= 0 && x < 8192 && y > 0 && y < 4096, p.id);
  assert.match(readFileSync(aqui('./cola-ipad.mjs'), 'utf8'), /const W = horizontal \? 1024 : ANCHO, H = horizontal \? 768 : ALTO;/);
});
