// Sección PortAventura (12-nov-2026): 4 espacios, foco store/restaurante, zona 2 con AdmiraNeXT01-05, sin iframes a la DMZ.
import test from 'node:test'; import assert from 'node:assert/strict'; import {readFileSync, existsSync} from 'node:fs'; import {createRequire} from 'node:module';
const require = createRequire(import.meta.url); const PA = require('./pa.js'); const Gemelo = require('../xpacios/gemelo/gemelo.js');
test('4 espacios en orden, foco en store y restaurante', () => {
  assert.deepEqual(PA.ESPACIOS.map(x => x.id), ['store', 'restaurante', 'hotel', 'atraccion']);
  assert.deepEqual(PA.ESPACIOS.filter(x => x.foco).map(x => x.id), ['store', 'restaurante']);
  for (const x of PA.ESPACIOS) assert.match(x.dmz, /^https:\/\/www\.portaventuranext\.com\/dmz\//);
});
test('store y restaurante tienen gemelo válido para el creador', () => {
  for (const id of ['restaurante']) { const b = Gemelo.normaliza(PA.borrador(PA.espacio(id))); assert.equal(b.items.length, PA.espacio(id).gemelo.items.length); assert.ok(Gemelo.cuenta(b).pantallas >= 4); }
});
test('zona 2 = 5 PCs y 8 pantallas', () => {
  assert.deepEqual(PA.ZONA2.map(p => p.pc), ['01', '02', '03', '04', '05']);
  assert.equal(PA.ZONA2.flatMap(p => p.pant).length, 8);
});
test('ninguna página incrusta la DMZ (Access no deja iframes)', () => {
  const js = readFileSync(new URL('./pagina.js', import.meta.url), 'utf8');
  assert.doesNotMatch(js, /iframe[^>]*x\.dmz/);
  const sel = readFileSync(new URL('../admira-xp/scripts/project-selector.mjs', import.meta.url), 'utf8');
  assert.match(sel, /f\.src=cv\.here\|\|cv\.url/);
});
test('la store es la tienda física 2D/3D (Hawkins), no el ecommerce', () => {
  const x = PA.espacio('store'); assert.equal(x.tienda, '/portaventura/store/hawkins/'); assert.deepEqual(x.vistas.map(v => v[0]), ['2d', '3d', 'recorrido']);
  const html = readFileSync(new URL('./store/hawkins/index.html', import.meta.url), 'utf8'); assert.match(html, /^<!doctype html>/i); assert.match(html, /maqueta-3d\.js/);
});
test('el restaurante es el gemelo 3D de Benny\'s, con todo en local', () => {
  assert.equal(PA.espacio('restaurante').tienda, '/portaventura/restaurante/bennys/');
  const html = readFileSync(new URL('./restaurante/bennys/index.html', import.meta.url), 'utf8');
  assert.match(html, /^<!doctype html>/i); assert.match(html, /import\('\.\/diner\.js'\)/); assert.doesNotMatch(html, /["']\/demo\//);
});
test('el hotel es Casa Creel (no el PC-Cocina), con todo en local', () => {
  const x = PA.espacio('hotel'); assert.equal(x.tienda, '/portaventura/hotel/casa-creel/'); assert.equal(x.interactivo, undefined);
  for (const f of ['./hotel/casa-creel/index.html', './hotel/casa-creel/dentro/index.html']) { const html = readFileSync(new URL(f, import.meta.url), 'utf8'); assert.match(html, /^<!doctype html>/i); assert.doesNotMatch(html, /["']\/demo\//); }
});
test('Xpace PortAventura: sin página intermedia, carga directa del destino propio (Neo 12-nov-2026)', () => {
  const sel = readFileSync(new URL('../admira-xp/scripts/project-selector.mjs', import.meta.url), 'utf8');
  assert.match(sel, /if\(st\.live\)abrir\(\)/);
  for (const h of ['/portaventura/store/hawkins/', '/portaventura/restaurante/bennys/', '/portaventura/hotel/casa-creel/?maqueta=1', '/portaventura/hotel/casa-creel/dentro/']) assert.ok(sel.includes(`here:'${h}'`), h);
});
test('Casa Creel: pantalla de fondo con fondo Stranger Things y conexión solo a admira.tv', () => {
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8'); assert.match(html, /id="creel-pantalla"/); assert.match(html, /pantalla\.js/);
  const js = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8'); assert.match(js, /admira\\\.tv\$/); assert.match(js, /get\("tv"\)/);
});
test('Casa Creel: personajes arrastrables y presencia (distancia a la casa) que manda en la pantalla', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /moveActor/); assert.match(esc, /creel-presencia/); assert.match(esc, /pointerdown/);
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8'); assert.match(pan, /addEventListener\("creel-presencia"/);
});
test('Casa Creel: el hotel se mueve en X e Y y la presencia se mide desde él', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /moveHouse/); assert.match(esc, /Math\.hypot\(a\.x - house\.x, a\.z - house\.z\)/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/creel.js', import.meta.url), 'utf8'), /uniforms\.offset, creelScene\.house\.x/);
});
test('Casa Creel: la pantalla va en la escena, de pie en el borde más lejano de la base', () => {
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8');
  assert.match(pan, /creel-camara/); assert.match(pan, /matrix\(/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8'), /new CustomEvent\("creel-camara"/);
});
test('Casa Creel: pantalla pegada al borde trasero de la parrilla (gira con ella) y selección + flechas', () => {
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8'); assert.match(pan, /window\.creelPantalla/); assert.doesNotMatch(pan, /creelScene\.house/);
  const cr = readFileSync(new URL('./hotel/casa-creel/creel.js', import.meta.url), 'utf8'); assert.match(cr, /-boardZ/); assert.match(cr, /creelPantalla/);
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8'); assert.match(esc, /function select\(/); assert.match(esc, /ArrowLeft/);
});
test('Barra superior: audio a la derecha de experto y menús por encima del gemelo abierto (Neo 12-nov-2026)', () => {
  const html = readFileSync(new URL('../admira-xp/index.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('id="pfExpert"') < html.indexOf('id="pfAudio"'));
  assert.match(html, /body\.xp-twin-open \.quad-menu/);
  assert.match(readFileSync(new URL('../admira-xp/scripts/project-selector.mjs', import.meta.url), 'utf8'), /xp-twin-open/);
});
test('Casa Creel ?maqueta=1: nada del cómic se pinta mientras carga la 3D (Neo 12-nov-2026)', () => {
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.indexOf('classList.add("solo-maqueta")') > -1 && head.indexOf('classList.add("solo-maqueta")') < head.indexOf('stylesheet'));
  assert.match(head, /\.solo-maqueta body :not\(dialog,dialog \*\)\{visibility:hidden\}/);
});
test('Casa Creel: botón «Hotel» al lado de Once para seleccionarlo y moverlo (Neo 12-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /🏠 Hotel/); assert.match(esc, /field\.append\(hotelBtn\)/); assert.match(esc, /select\(actor\.id\)/);
});
test('Casa Creel: grabar posición de hotel y personajes (localStorage) y Reiniciar la borra (Neo 12-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /Grabar posición/); assert.match(esc, /localStorage\.setItem\(GUARDA/); assert.match(esc, /localStorage\.getItem\(GUARDA/); assert.match(esc, /localStorage\.removeItem\(GUARDA/);
});
test('Casa Creel: clima real de PortAventura (Open-Meteo) en la pantalla y iconos para forzarlo (Neo 13-nov-2026)', () => {
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8');
  assert.match(html, /clima\.js/); for (const k of ['real','sol','lluvia','tormenta']) assert.match(html, new RegExp(`data-clima="${k}"`));
  assert.doesNotMatch(html, /Modelo conceptual a partir del Blender/);
  const cl = readFileSync(new URL('./hotel/casa-creel/clima.js', import.meta.url), 'utf8'); assert.match(cl, /api\.open-meteo\.com/); assert.match(cl, /latitude=41\.08/); assert.match(cl, /creel-clima/);
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8'); assert.match(pan, /function cielo/); assert.match(pan, /K\.hora\(\)/);
});
test('Casa Creel: pantalla LED de lado a lado (+20 % alto), título arriba y botón Conectar admira.tv (Neo 13-nov-2026)', () => {
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8');
  assert.match(pan, /const ANCHO = 48, ALTO = 18;/); assert.match(pan, /g\.translate\(W \/ 2, H \* \.2\)/); assert.match(pan, /localStorage\.setItem\("creel-tv"/);
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8'); assert.match(html, /Conectar admira\.tv/); assert.match(html, /id="creel-tv-url"/);
  const sel = readFileSync(new URL('../admira-xp/scripts/project-selector.mjs', import.meta.url), 'utf8'); assert.match(sel, /topSync/);
});
test('Hotel Creel: sin «Casa Creel» visible, clima solo en la pantalla y telón sin destellos en el Xpace (Neo 13-nov-2026)', () => {
  for (const f of ['./hotel/casa-creel/index.html','./hotel/casa-creel/dentro/index.html','./pa.js','./hotel/casa-creel/pantalla.js']) assert.doesNotMatch(readFileSync(new URL(f, import.meta.url), 'utf8'), /Casa Creel|CASA CREEL/);
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8'); assert.doesNotMatch(html, /creel-lluvia/); assert.match(html, /solo-maqueta:not\(\.creel-listo\) dialog\{visibility:hidden\}/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/creel.js', import.meta.url), 'utf8'), /type: "creel-listo"/);
  const xp = readFileSync(new URL('../admira-xp/index.html', import.meta.url), 'utf8'); assert.match(xp, /xp-pa-boot/);
  assert.match(readFileSync(new URL('../admira-xp/scripts/xtanco-premium-ui.mjs', import.meta.url), 'utf8'), /xp-pa-boot/);
});
test('Hotel Creel: Sol 3D real sobre la pantalla con slider de 24 h y previsión por horas (Neo 13-nov-2026)', () => {
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8');
  assert.match(html, /sol\.js/); assert.match(html, /id="creel-hora" type="range" min="0" max="1439"/); assert.match(html, /id="creel-prevision"/);
  assert.ok(html.indexOf('data-clima="tormenta"') < html.indexOf('id="creel-hora"') && html.indexOf('id="creel-hora"') < html.indexOf('PANTALLA LED'));
  const sol = readFileSync(new URL('./hotel/casa-creel/sol.js', import.meta.url), 'utf8'); assert.match(sol, /LAT = 41\.08/); assert.match(sol, /creel-hora/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/clima.js', import.meta.url), 'utf8'), /hourly=temperature_2m,weather_code/);
});
test('Hotel Creel: arco del Sol por encima de la pantalla y fichas gráficas de personajes (Neo 13-nov-2026)', () => {
  const sol = readFileSync(new URL('./hotel/casa-creel/sol.js', import.meta.url), 'utf8'); assert.match(sol, /const BASE = (\d+)/); assert.ok(+sol.match(/const BASE = (\d+)/)[1] > 18);
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8'); assert.match(esc, /creel-ficha/); assert.match(esc, /<svg viewBox="0 0 24 34"/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/detalle.css', import.meta.url), 'utf8'), /\.creel-solbar>small/);
});
test('Hotel Creel: foto del protagonista en cada botón sin cambiar su tamaño (Neo 13-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8'); assert.match(esc, /fotos\/\$\{slug\}\.jpg/); assert.match(esc, /fotos\/lego-\$\{slug\}\.webp/);
  assert.ok(existsSync(new URL('./hotel/casa-creel/fotos/lego-once.webp', import.meta.url)));
  assert.match(readFileSync(new URL('./hotel/casa-creel/detalle.css', import.meta.url), 'utf8'), /\.creel-ficha-foto\{flex:none;width:28px;height:34px/);
});

test('Hotel Creel: zona de influencia 6×4 ante la puerta que cambia de color y manda la cara del personaje a la pantalla (Carlos, 13-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /const ZONE = \{cols: 8, rows: 7, cell: 5 \/ board\.unitCm\}/);
  assert.match(esc, /z1: Math\.min\(z0 \+ d, board\.depth \/ board\.unitCm \/ 2\)/); // hasta el borde delantero de la base
  assert.match(esc, /z0 = house\.z \+ 4\.5/);                       // pegada al borde delantero de la huella del hotel
  assert.match(esc, /new CustomEvent\("creel-zona"/);
  assert.match(esc, /presence\(id\); updateZone\(id\);/);            // al arrastrar un personaje se reevalúa la zona
  assert.match(esc, /zone\(\) \{ return \{\.\.\.zoneRect\(\), actor: zoneActor\}; \}/);
  assert.match(esc, /creel-en-zona/);
  const js = readFileSync(new URL('./hotel/casa-creel/creel.js', import.meta.url), 'utf8');
  assert.match(js, /uniform vec4 zona;/); assert.match(js, /uniform float zonaOn;/);
  assert.match(js, /gl\.uniform4f\(uniforms\.zona, zr\.x0, zr\.z0, zr\.x1, zr\.z1\)/);
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8');
  assert.match(pan, /addEventListener\("creel-zona"/);
  assert.match(pan, /fotos\/\$\{slug\}\.jpg`, `\/portaventura\/hotel\/casa-creel\/fotos\/lego-\$\{slug\}\.webp`/);
  assert.match(pan, /if \(estado\.cara\) retrato\(cara\(estado\.cara\.slug\), estado\.cara\.quien, s\);/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/detalle.css', import.meta.url), 'utf8'), /\.creel-pin\.creel-en-zona/);
  assert.match(readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8'), /creel-escena\.js\?v=20261113-11/);
});

test('Hotel Creel: «Grabar posición» va entre «Activar sonido» y «Reiniciar escena» y la última posición se graba sola (Carlos, 13-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /missionControls\.insertBefore\(saveBtn, document\.getElementById\("creel-reset"\)\)/);
  assert.match(esc, /saveBtn\.className = "action creel-guardar-btn"/);
  assert.match(esc, /const grabarPronto = \(\) => \{ clearTimeout\(saveTimer\); saveTimer = setTimeout\(\(\) => grabar\(true\), 400\); \};/);
  assert.match(esc, /updateZone\(id\); grabarPronto\(\);/);            // al mover un personaje
  assert.match(esc, /updateZone\(\); grabarPronto\(\);/);              // al mover el hotel
  assert.match(esc, /clearTimeout\(saveTimer\);\n\s+try \{ localStorage\.removeItem\(GUARDA\)/); // reiniciar no vuelve a grabar
  assert.doesNotMatch(esc, /^\s*field\.append\(saveBtn\);/m);   // ya no vive en la rejilla de personajes
});

test('Hotel Creel: elegir una figura no mueve el mapa y pone su cara en la pantalla; botón Frontal junto a Interior (Carlos, 13-nov-2026)', () => {
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8');
  assert.match(esc, /button\.addEventListener\("click", \(\) => \{ activate\(actor, false\); select\(actor\.id\); \}\);/);
  assert.doesNotMatch(esc, /activate\(actor, true\)/);
  assert.match(esc, /new CustomEvent\("creel-personaje"/);
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8');
  assert.match(pan, /addEventListener\("creel-personaje"/);
  assert.match(pan, /estado\.cara = estado\.caraZona \|\| estado\.caraSel/);
  const html = readFileSync(new URL('./hotel/casa-creel/index.html', import.meta.url), 'utf8');
  assert.match(html, /Interior<\/a>\s*<button id="front-model" class="action" disabled>Frontal<\/button>/);
  const js = readFileSync(new URL('./hotel/casa-creel/creel.js', import.meta.url), 'utf8');
  assert.match(js, /"front-model"\]/); assert.match(js, /controls\["front-model"\]\.onclick = \(\) => \{ yaw = 0; pitch = \.3;/);
});
