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
  assert.match(visor, /if \(enPanorama\(\)\) \{[\s\S]*?pano\.pintarPantalla\(p\.id, (?:reaccionEn\(p\.id\) \|\| )?p\.contenido\.material\.map\)[\s\S]*?pano\.render\(\);\s*\} else renderer\.render\(scene, camera\);/);
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
  assert.deepEqual(d634.piezas.filter(p => p.tipo !== 'eink').map(p => [p.id, p.tipo]), [['D634-TPV', 'tpv'], ['D634-IPAD', 'ipad'], ['D634-CAJA', 'caja'], ['D634-KIOSKO', 'kiosko']]);
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

test('cada local con su cola: Diagonal pide y ve sus pedidos en su sala, Paseo de Gràcia en la suya', async () => {
  const sala = id => centros.find(c => c.id === id).panorama.piezas.filter(p => p.cola).map(p => [p.id, p.cola]);
  assert.deepEqual(sala('d634'), [['D634-IPAD', 'starbucks-diagonal-634'], ['D634-KIOSKO', 'starbucks-diagonal-634']]);
  assert.deepEqual(sala('pg103'), [['PG103-IPAD', 'starbucks-paseo-de-gracia']]);
  assert.match(visor, /crearColaIPad\(\{ horizontal: !!p\.horizontal, sala: p\.cola \|\| null \}\)/);
  const { crearColaIPad } = await import('./cola-ipad.mjs');
  const pedidas = [], ctx = new Proxy({}, { get: () => () => {} });
  const doc = { createElement: () => ({ getContext: () => ctx }) };
  const gestor = { sala: s => pedidas.push(s), data: () => ({ recibido: [], preparando: [{ numero: 'A001' }], listo: [] }), open: () => pedidas.push('abierto') };
  const ipad = crearColaIPad({ doc, cola: () => gestor, sala: 'starbucks-diagonal-634' });
  assert.equal(ipad.pedidos, 1); assert.equal(ipad.abrir(), true);
  assert.ok(pedidas.includes('abierto') && pedidas.filter(s => s !== 'abierto').every(s => s === 'starbucks-diagonal-634'), 'el gestor lee y abre la sala del local');
});

test('el quiosco de pedidos de la pared de Diagonal: el de Paseo de Gràcia con su sala, y avisa de cada pedido', async () => {
  const k = centros.find(c => c.id === 'd634').panorama.piezas.find(p => p.tipo === 'kiosko');
  assert.equal(k.esquinas.length, 4);
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = k.esquinas;
  assert.ok(x0 > 6105 && x1 < 6440 && y0 > 1695 && y3 < 2235, 'dentro de la pared oscura, entre la cristalera y la columna');
  assert.ok(Math.abs(((y3 - y0 + y2 - y1) / 2) / ((x1 - x0 + x2 - x3) / 2) - 16 / 9) < 0.1, 'vertical 9:16, como el tótem');
  const { urlKiosko, pedidoDe } = await import('./kiosko.mjs');
  const u = new URL(urlKiosko({ sala: k.cola }));
  assert.equal(u.origin + u.pathname, 'https://www.ainimation.studio/xperiencias/kiosko-pedido/');
  assert.deepEqual(Object.fromEntries(u.searchParams), { store: 'starbucks-diagonal-634', marca: 'starbucks', lang: 'es', host: 'gemelo', formato: 'vertical', w: '1080', h: '1920' });
  const tote = readFileSync(aqui('../../admira-xp/scripts/totem-kiosko.js'), 'utf8');
  assert.ok(tote.includes("KIOSK_BASE='https://www.ainimation.studio/xperiencias/kiosko-pedido/'"), 'el mismo quiosco que el tótem de Paseo de Gràcia');
  const marco = {}, msg = (origin, data, source = marco) => ({ origin, data, source });
  const order = { id: 'k1', number: 'A012', store: 'starbucks-diagonal-634' };
  assert.deepEqual(pedidoDe(msg('https://www.ainimation.studio', { source: 'ainimation-xperiencia', event: 'order', order }), marco), order);
  assert.equal(pedidoDe(msg('https://example.com', { source: 'ainimation-xperiencia', event: 'order', order }), marco), null);
  assert.equal(pedidoDe(msg('https://www.ainimation.studio', { source: 'ainimation-xperiencia', event: 'order', order }, {}), marco), null, 'solo su iframe');
  assert.equal(pedidoDe(msg('https://www.ainimation.studio', { source: 'ainimation-xperiencia', event: 'ready' }), marco), null);
  assert.match(visor, /else if \(p\.tipo === 'kiosko'\) texturaPieza\(p\)\.userData\.fuente\.abrir\(\);/);
});

test('el hilo musical de cada local se edita como en Paseo de Gràcia: su playlist, su mando y su editor', async () => {
  // El visor pone proyecto y local en la dirección: de ahí sacan su ámbito la playlist y el editor del mando.
  assert.match(visor, /actualizarURL\(\{ centro: c\.id, project: local \? 'starbucks' : null, venue: local, loc: null \}\);/);
  assert.equal(centros.find(c => c.id === 'd634').locales[0], 'starbucks-diagonal-634');
  assert.equal(centros.find(c => c.id === 'pg103').locales[0], 'alsea-sbux-021');
  const { playlistContext } = await import('../../admira-xp/scripts/context-playlist-client.mjs');
  assert.deepEqual(playlistContext('https://www.admira.store/xpacios/starbucks-centros/?centro=d634&project=starbucks&venue=starbucks-diagonal-634'), { projectId: 'starbucks', venueId: 'starbucks-diagonal-634', channelId: 'music' });
  // El mismo módulo (misma URL con su ?v=) que importa el editor del mando: un solo cliente por canal.
  const editor = readFileSync(aqui('../../admira-xp/scripts/context-playlist-editor.mjs'), 'utf8');
  const v = editor.match(/from '\.\/context-playlist-client\.mjs(\?v=[^']+)'/)[1];
  assert.ok(visor.includes(`import { contextPlaylist } from '/admira-xp/scripts/context-playlist-client.mjs${v}';`));
  assert.ok(readFileSync(aqui('./mando-tpv.mjs'), 'utf8').includes("import { mountMusicRemote } from '/admira-xp/scripts/music-remote.mjs"), 'el mando de Paseo de Gràcia');
  assert.match(visor, /if \(p\.tipo === 'tpv'\) \{ piezas\.mando = piezas\.mando \|\| crearMandoTPV\(\{ musica: piezas\.tpv\.musica, alEnfocar: enfocarTPV \}\); piezas\.mando\.abrir\(/);

  // El TPV: la publicada de siempre hasta que llega la del local; la del local manda; vacía, calla.
  const oidos = [];
  globalThis.Audio = class { constructor() { this.paused = true; this.currentTime = 0; } addEventListener() {} play() { this.paused = false; oidos.push(this.src); return Promise.resolve(); } pause() { this.paused = true; } removeAttribute(k) { delete this[k]; } };
  globalThis.Image = class {};
  const ctx = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  const doc = { createElement: () => ({ getContext: () => ctx }) };
  const publicada = [{ title: 'PG 1', url: 'https://x/pg1.mp3' }, { title: 'PG 2', url: 'https://x/pg2.mp3' }];
  let avisar = null; const lista = { subscribe(f) { avisar = f; f({ data: null, tracks: [], error: 'login_required' }); return () => {}; } };
  const { crearHiloTPV } = await import('./hilo-tpv.mjs');
  const tpv = crearHiloTPV({ doc, lista, origenes: ['/api'], fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true, tracks: publicada }) }) });
  await tpv.listo;
  assert.equal(tpv.propia, false); assert.deepEqual(tpv.musica.getTracks().map(t => t.title), ['PG 1', 'PG 2']);
  const estados = []; tpv.musica.subscribe(e => estados.push(e));
  avisar({ data: { revision: 1 }, tracks: [{ title: 'Diagonal 1', url: 'https://x/d1.mp3' }, { title: 'Diagonal 2', url: 'https://x/d2.mp3' }] });
  assert.equal(tpv.propia, true); assert.deepEqual(tpv.musica.getTracks().map(t => t.title), ['Diagonal 1', 'Diagonal 2']);
  await tpv.musica.jump('https://x/d2.mp3'); assert.equal(tpv.musica.state().title, 'Diagonal 2'); assert.equal(tpv.sonando, true);
  assert.equal(tpv.musica.next(), true); assert.equal(tpv.musica.state().title, 'Diagonal 1');
  avisar({ data: { revision: 2 }, tracks: [{ title: 'Diagonal 1', url: 'https://x/d1.mp3' }, { title: 'Nueva', url: 'https://x/n.mp3' }] });
  assert.equal(tpv.musica.state().title, 'Diagonal 1', 'la que suena sigue si continúa en la lista');
  avisar({ data: { revision: 3, empty: true }, tracks: [] });
  assert.equal(tpv.pistas, 0); assert.equal(tpv.sonando, false, 'playlist vacía: se para, sin relleno automático');
  assert.ok(estados.length >= 4, 'el mando se entera de cada cambio');
  delete globalThis.Audio; delete globalThis.Image;
});

test('el foco del mando: ◎ a la izquierda de «Hilo musical · centro» lleva el TPV al centro del hueco libre, de cerca', () => {
  const mando = readFileSync(aqui('./mando-tpv.mjs'), 'utf8'), pano = readFileSync(aqui('./panorama.mjs'), 'utf8');
  assert.match(mando, /<header><button class="sc-mando-foco" type="button" aria-label="Foco: el TPV en el centro, de cerca" aria-pressed="false">◎<\/button><strong><\/strong>/, 'pequeño, a la izquierda del título');
  assert.match(mando, /foco\.addEventListener\('click', \(\) => \{ const on = !enFoco; ponerFoco\(on\); alEnfocar\(on\); \}\);/);
  assert.match(visor, /crearMandoTPV\(\{ musica: piezas\.tpv\.musica, alEnfocar: enfocarTPV \}\)/);
  assert.match(visor, /return pano\.enfocar\(tpv\.id, \{ x, y \}\);/, 'en el centro del hueco que deja el mando');
  assert.match(visor, /if \(!on\) \{ const v = vistaAntesDelFoco; vistaAntesDelFoco = null; return v \? pano\.irA\(v\) : null; \}/, 'otra vez: la vista de antes');
  assert.match(pano, /function enfocar\(id, \{ alto = 0\.28, x = 0\.5, y = 0\.5, dur = 700 \} = \{\}\)/);
  assert.match(pano, /render\(\) \{ avanzar\(\); mirar\(\); renderer\.render\(escena, camara\); \}/, 'el giro es suave');
  assert.match(pano, /girar\(dx, dy, alto\) \{\n      anim = null;/, 'arrastrar corta el giro');
  assert.match(readFileSync(aqui('./centros.css'), 'utf8'), /\.sc-mando\.sc-mando--foco\{background:transparent;justify-content:flex-end/, 'con foco, el mando se aparta');
});

test('el mostrador de Diagonal como el de Paseo de Gràcia: iPad horizontal encima de la vitrina y la música en el TPV de la cola', () => {
  const pz = Object.fromEntries(centros.find(c => c.id === 'd634').panorama.piezas.map(p => [p.id, p]));
  assert.equal(pz['D634-IPAD'].horizontal, true, 'horizontal, como el de Paseo de Gràcia');
  assert.deepEqual(pz['D634-IPAD'].esquinas, [[3471, 2043], [3598, 2046], [3581, 2117], [3448, 2115]], 'el marco de encima de la vitrina');
  assert.deepEqual(pz['D634-TPV'].esquinas, [[3171, 2095], [3231, 2098], [3196, 2222], [3123, 2217]], 'el TPV donde estaba la cola');
});

test('la caja de Diagonal: el muffin y el agua de la vitrina a la cesta, con el IF·THEN·DO THAT de Paseo de Gràcia', async () => {
  const d634 = centros.find(c => c.id === 'd634').panorama, pz = Object.fromEntries(d634.piezas.map(p => [p.id, p]));
  assert.equal(pz['D634-CAJA'].tipo, 'caja');
  assert.deepEqual(pz['D634-CAJA'].esquinas, [[2892, 2085], [2934, 2087], [2909, 2187], [2868, 2184]], 'el otro TPV, donde estaba la música');
  assert.deepEqual(d634.productos.map(p => p.id), ['muffin', 'water'], 'un muffin de la vitrina y las botellas de agua');
  for (const p of d634.productos) for (const [x, y] of p.esquinas) assert.ok(x > 3300 && x < 3900 && y > 2190 && y < 2590, p.id);
  // Las mismas reglas, pantallas y oferta que en el gemelo de Paseo de Gràcia.
  const caja = readFileSync(aqui('./caja-tpv.mjs'), 'utf8');
  assert.match(caja, /import \{ retailRulebook, createRetailRulePlayer, waterOfferScreens \} from '\.\.\/\.\.\/admira-xp\/scripts\/retail-rules\.mjs/);
  assert.match(visor, /mapaPantallas\(\{ muro: \(centro\.panorama\.pantallas \|\| \[\]\)\.map\(x => x\.id\), caja: p\.id, ipad: ipad && ipad\.id \}\)/);
  assert.match(visor, /pano\.pintarPantalla\(p\.id, reaccionEn\(p\.id\) \|\| p\.contenido\.material\.map\);/, 'las reacciones tapan las pantallas del muro');
  assert.match(visor, /if \(ev\.type === 'pointerup' && sobreLaCaja\(ev\)\) \{ if \(piezas\.caja\.soltar\(prod\.id\)\)/, 'se suelta en la caja');
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  const { crearCajaTPV, mapaPantallas } = await import('./caja-tpv.mjs');
  assert.deepEqual(mapaPantallas({ muro: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'], caja: 'K', ipad: 'I' }), { 'starbucks-wall-01': 'M1', 'starbucks-wall-02': 'M2', 'starbucks-wall-03': 'M3', 'starbucks-wall-04': 'M4', 'starbucks-wall-05': 'M5', 'starbucks-wall-06': 'M6', 'starbucks-tpv-01': 'K', 'starbucks-ipad-01': 'I' });
  const ctx = new Proxy({}, { get: () => () => {} }), guardado = new Map(), eventos = [];
  const doc = { documentElement: { lang: 'es' }, body: { append() {} }, createElement: tag => tag === 'canvas' ? { getContext: () => ctx } : { hidden: false, dataset: {}, addEventListener() {}, pause() {}, load() {}, removeAttribute() {} } };
  const win = { sessionStorage: { getItem: k => guardado.get(k) || null, setItem: (k, v) => guardado.set(k, v) }, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o.detail; } }, dispatchEvent: e => eventos.push(e) };
  globalThis.Image = class { set src(v) { this.s = v; } };
  const libro = { state: () => ({ rules: [] }), selectActions: () => [] };
  const c = crearCajaTPV({ doc, win, T: {}, clave: 'starbucks-diagonal-634:D634-CAJA', mapa: {}, reglas: () => libro });
  c.coger('muffin'); assert.equal(c.soltar('muffin'), true); assert.deepEqual(c.cesta.lines, [{ id: 'muffin', quantity: 1 }]);
  assert.equal(c.soltar('water'), true); assert.equal(c.quedanAgua, 12, 'quedan 12 de 13 botellas');
  assert.ok(guardado.get('xpaceos.pos-basket.v1:starbucks-diagonal-634:D634-CAJA'), 'la cesta es la de Diagonal, no la de Paseo de Gràcia');
  assert.deepEqual(eventos.map(e => e.detail.productId), ['muffin', 'water']);
  c.vaciar(); assert.deepEqual(c.cesta.lines, []); assert.equal(c.quedanAgua, 13);
  delete globalThis.Image;
});

test('el mando y la cesta son ventanas: se mueven por la cabecera, cambian de tamaño y la playlist se quita con la papelera a la izquierda', () => {
  const movible = readFileSync(aqui('./movible.mjs'), 'utf8'), mando = readFileSync(aqui('./mando-tpv.mjs'), 'utf8'), css = readFileSync(aqui('./centros.css'), 'utf8');
  assert.match(movible, /asa\.addEventListener\('pointerdown'/, 'arrastrar por la cabecera');
  assert.match(movible, /esquina\.className = 'vent-esquina'/, 'la esquina para cambiar el tamaño (también con el dedo)');
  assert.match(movible, /asa\.addEventListener\('dblclick'/, 'doble clic: a su sitio');
  assert.match(mando, /hacerMovible\(modal\.querySelector\('\.sc-mando-caja'\), modal\.querySelector\('header'\), \{ clave: 'sc-mando-tpv-v1'/);
  assert.match(visor, /hacerMovible\(ventanaCesta\.querySelector\('\.sc-mando-caja'\), ventanaCesta\.querySelector\('header'\), \{ clave: 'sc-cesta-v1' \}\)/);
  assert.match(css, /\.sc-mando \.context-playlist-editor li>button\[data-playlist-remove\]\{order:-1;/, 'la papelera, a la izquierda de cada canción');
  assert.match(css, /button\[data-playlist-remove\]::before\{content:"🗑"/);
});

test('el quiosco y el iPad también son ventanas: asa encima para moverlos y esquina para el tamaño, sin perder su forma', () => {
  const kiosko = readFileSync(aqui('./kiosko.mjs'), 'utf8'), movible = readFileSync(aqui('./movible.mjs'), 'utf8');
  assert.match(kiosko, /hacerMovible\(caja, asa, \{ clave: 'sc-kiosko-v1', proporcion: 9 \/ 16, arriba: 34 \}\)/, 'el quiosco, vertical 9:16');
  assert.match(visor, /hacerMovible\(caja, asa, \{ clave: 'sc-ipad-v1', proporcion: 4 \/ 3, arriba: 34 \}\)/, 'el iPad, 4:3');
  assert.match(visor, /else ipadMovible\(\); \}/, 'al abrir el iPad');
  assert.match(movible, /if \(proporcion\) Object\.assign\(caja\.style, \{ height: 'auto', maxHeight: 'none' \}\);/, 'el alto lo pone la proporción');
});

test('el editor de la playlist dice qué canciones ya están y enseña la que se añade (el caso del #1985)', () => {
  const ed = readFileSync(aqui('../../admira-xp/scripts/context-playlist-editor.mjs'), 'utf8');
  assert.match(ed, /if\(inPlaylist\(item\.id\)\)\{add\.disabled=true;add\.textContent=t\('Ya en la playlist ✓','Already in the playlist ✓'\);/);
  assert.match(ed, /const inPlaylist=id=>\(client\.state\(\)\.tracks\|\|\[\]\)\.some\(track=>\(track\.stockId\|\|track\.id\)===id\);/);
  assert.match(ed, /if\(operation==='add'\)showTrack\(id\);/, 'tras añadir, la lista baja hasta la nueva');
  assert.match(readFileSync(aqui('../../admira-xp/scripts/context-playlist.css'), 'utf8'), /\.context-playlist-editor li\.is-new\{/);
});

test('cada canción de la playlist y de la búsqueda lleva su previo: la carátula de Stock o una nota si es solo audio', () => {
  const ed = readFileSync(aqui('../../admira-xp/scripts/context-playlist-editor.mjs'), 'utf8');
  assert.match(ed, /function preview\(item\)\{const box=make\('span'\);box\.className='context-playlist-thumb';/);
  assert.match(ed, /if\(item\.cover\)\{const img=make\('img'\);img\.width=44;img\.height=44;[^}]*img\.src=item\.cover;/, 'miniatura de 44 px aunque falte la hoja');
  assert.match(ed, /context-playlist\.css\?v=previos-\d+'/, 'la hoja nueva, no la guardada');
  assert.match(ed, /row\.append\(preview\(track\)\);/, 'en la lista');
  assert.match(ed, /row\.append\(preview\(item\),name,add,link\);/, 'en la búsqueda');
  assert.match(readFileSync(aqui('../../admira-xp/scripts/context-playlist.css'), 'utf8'), /\.context-playlist-thumb img\{width:100%;height:100%;object-fit:cover/);
});

test('la playlist de Paseo de Gràcia en el gemelo, igual: papelera a la izquierda en el editor común y la ficha del TPV movible', () => {
  const css = readFileSync(aqui('../../admira-xp/scripts/context-playlist.css'), 'utf8'), sl = readFileSync(aqui('../../admira-xp/scripts/screen-light.mjs'), 'utf8');
  assert.match(css, /\.context-playlist-editor li>button\[data-playlist-remove\]\{order:-1;/, 'en todos los editores, no solo en el visor');
  assert.match(readFileSync(aqui('../../admira-xp/scripts/context-playlist-editor.mjs'), 'utf8'), /context-playlist\.css\?v=previos-2/);
  assert.match(sl, /c\.node\.style\.transform='translate\('\+Math\.round\(p\.x\+\(c\.offset\?\.x\|\|0\)\)/, 'el gemelo suma el desplazamiento del usuario');
  assert.match(sl, /kicker\.addEventListener\('pointerdown',e=>\{if\(!c\.remote\|\|e\.button!==0\)return;/, 'se arrastra por la cabecera la ficha con mando');
  assert.match(readFileSync(aqui('../../admira-xp/index.html'), 'utf8'), /scripts\/screen-light\.css\?v=ficha-movible-1/);
});
