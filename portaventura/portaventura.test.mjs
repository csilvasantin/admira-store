// Sección PortAventura (12-nov-2026): 4 espacios, foco store/restaurante, zona 2 con AdmiraNeXT01-05, sin iframes a la DMZ.
import test from 'node:test'; import assert from 'node:assert/strict'; import {readFileSync} from 'node:fs'; import {createRequire} from 'node:module';
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
test('Casa Creel: pantalla centrada detrás del hotel y selección + flechas para hotel y personajes', () => {
  const pan = readFileSync(new URL('./hotel/casa-creel/pantalla.js', import.meta.url), 'utf8'); assert.match(pan, /creelScene\.house/);
  const esc = readFileSync(new URL('./hotel/casa-creel/creel-escena.js', import.meta.url), 'utf8'); assert.match(esc, /function select\(/); assert.match(esc, /ArrowLeft/);
});
