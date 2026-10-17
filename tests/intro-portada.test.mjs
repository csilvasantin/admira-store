// Intro en vídeo de la portada (17-oct-2026): una vez por sesión, se salta, respeta «reducir movimiento»,
// sale en el idioma de la portada (español o inglés) y sirve 1080p o 720p. Contrato: admira-xp/docs/intro-portada.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync, statSync} from 'node:fs';

const require = createRequire(import.meta.url);
const intro = require('../assets/intro-portada.js');
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('la portada carga la intro con versión y sin bloquear el render', () => {
  const html = read('index.html');
  assert.match(html, /<script defer src="\/assets\/intro-portada\.js\?v=[^"]+"><\/script>/);
  assert.ok(html.indexOf('/assets/xpace-lang.js') < html.indexOf('/assets/intro-portada.js'), 'el idioma se resuelve antes');
});

test('sale la primera vez, en español y en inglés, y no se repite en la misma sesión', () => {
  for (const lang of ['es', 'en']) {
    assert.equal(intro.shouldShow({search: '', lang, reducedMotion: false, seen: false}), true, lang);
    assert.equal(intro.shouldShow({search: '', lang, reducedMotion: false, seen: true}), false, lang);
  }
});

test('no sale con «reducir movimiento» ni en un idioma sin vídeo; ?intro=0 la quita y ?intro=1 la fuerza', () => {
  assert.equal(intro.shouldShow({search: '', lang: 'es', reducedMotion: true, seen: false}), false);
  assert.equal(intro.shouldShow({search: '', lang: 'en', reducedMotion: true, seen: false}), false);
  assert.equal(intro.shouldShow({search: '', lang: 'fr', reducedMotion: false, seen: false}), false);
  assert.equal(intro.shouldShow({search: '?intro=0', lang: 'en', reducedMotion: false, seen: false}), false);
  assert.equal(intro.shouldShow({search: '?intro=1', lang: 'en', reducedMotion: true, seen: true}), true);
});

test('el vídeo va en el idioma de la portada: 1080p en pantallas grandes y 720p en el resto', () => {
  assert.equal(intro.pickSource(1920, 1, 'es'), intro.SOURCES.es[1080]);
  assert.equal(intro.pickSource(1440, 2, 'es'), intro.SOURCES.es[1080]);
  assert.equal(intro.pickSource(390, 3, 'es'), intro.SOURCES.es[720]);
  assert.equal(intro.pickSource(1280, 1, 'es'), intro.SOURCES.es[720]);
  assert.equal(intro.pickSource(1920, 1, 'en'), '/assets/video/intro-xpaceos-a-en-1080.mp4');
  assert.equal(intro.pickSource(1280, 1, 'en'), '/assets/video/intro-xpaceos-a-en-720.mp4');
  assert.equal(intro.pickSource(1920, 1), intro.SOURCES.es[1080], 'sin idioma, el español');
});

test('los vídeos de los dos idiomas existen, son distintos y pesan menos de 10 MB', () => {
  const all = Object.values(intro.SOURCES).flatMap(set => Object.values(set));
  assert.equal(all.length, 4);
  assert.equal(new Set(all).size, 4);
  for (const src of all) {
    const size = statSync(new URL('..' + src, import.meta.url)).size;
    assert.ok(size > 100_000 && size < 10_000_000, src + ' pesa ' + size);
  }
});

test('se puede saltar con botón o Esc, en los dos idiomas, y no tapa la portada si el vídeo no arranca', () => {
  const src = read('assets/intro-portada.js');
  assert.match(src, /Saltar intro/);
  assert.match(src, /Skip intro/);
  assert.match(src, /e\.key === 'Escape'/);
  assert.match(src, /video\.addEventListener\('ended', close\)/);
  assert.match(src, /video\.addEventListener\('error', close\)/);
  assert.match(src, /p\.catch\(close\)/);
  assert.match(src, /setItem\(SEEN_KEY, all\.join\(','\)\)/, 'recuerda los idiomas vistos');
  assert.match(src, /pickSource\(win\.innerWidth, win\.devicePixelRatio, lang\)/, 'el vídeo sigue al idioma resuelto');
});

test('una música por idioma: castellano campanas, inglés pulso; ?musica= la fija o la quita', () => {
  assert.equal(intro.pickMusic('', 'es'), 'campanas');
  assert.equal(intro.pickMusic('', 'en'), 'pulso');
  assert.equal(intro.pickMusic('', 'fr'), 'campanas', 'otro idioma: la del castellano');
  assert.equal(intro.pickMusic('?musica=pulso', 'es'), 'pulso');
  assert.equal(intro.pickMusic('?musica=0', 'en'), '');
  assert.equal(intro.pickMusic('?musica=otra', 'en'), 'pulso', 'un valor desconocido no cambia la del idioma');
  const src = read('assets/intro-portada.js');
  assert.doesNotMatch(src, /MUSIC_KEY/, 'ya no alterna ni guarda la última');
  assert.match(src, /const nextTrack = pickMusic\(win\.location\.search, next\);/, 'al cambiar de idioma cambia también la música');
});

test('las dos músicas existen, son distintas y pesan menos de 1 MB', () => {
  const all = Object.values(intro.MUSIC);
  assert.deepEqual(Object.keys(intro.MUSIC), ['campanas', 'pulso']);
  for (const src of Object.values(intro.MUSIC)) assert.match(src, /\.mp4$/, 'en .mp4: Cloudflare no sirve .m4a por rangos');
  assert.equal(new Set(all).size, 2);
  for (const src of all) {
    const size = statSync(new URL('..' + src, import.meta.url)).size;
    assert.ok(size > 50_000 && size < 1_000_000, src + ' pesa ' + size);
  }
});

test('el sonido intenta arrancar, queda un botón en los dos idiomas y se para al cerrar', () => {
  const src = read('assets/intro-portada.js');
  for (const text of ['Activar sonido', 'Silenciar', 'Turn sound on', 'Mute']) assert.ok(src.includes(text), text);
  assert.match(src, /audio\.currentTime = video\.currentTime/, 'el audio sigue al vídeo');
  assert.match(src, /p\.catch\(\(\) => \{ soundOn = false; paintSound\(\); \}\)/, 'si el navegador no deja sonar, se queda en silencio con el botón');
  assert.match(src, /if \(audio\) \{ try \{ audio\.pause\(\); \} catch \(_\) \{\} \}/, 'al cerrar se para la música');
});

test('solo con el look por defecto: con una marca blanca activa no sale', () => {
  assert.equal(intro.activeBrand('', ''), '');
  assert.equal(intro.activeBrand('?marca=starbucks', ''), 'starbucks');
  assert.equal(intro.activeBrand('?marca=admira', 'starbucks'), '', '?marca=admira es el modo por defecto');
  assert.equal(intro.activeBrand('?marca=off', 'altadis'), '');
  assert.equal(intro.activeBrand('?project=starbucks', ''), 'starbucks');
  assert.equal(intro.activeBrand('?loc=alsea-sbux-021', ''), 'starbucks');
  assert.equal(intro.activeBrand('', 'altadis'), 'altadis', 'marca recordada en la pestaña');
  assert.equal(intro.activeBrand('', 'default'), '');
  const base = {search: '', lang: 'es', reducedMotion: false, seen: false};
  assert.equal(intro.shouldShow({...base, brand: ''}), true);
  assert.equal(intro.shouldShow({...base, brand: 'starbucks'}), false);
  assert.equal(intro.shouldShow({...base, brand: 'starbucks', search: '?intro=1'}), true, '?intro=1 la fuerza igual');
});

test('una vez por idioma: al pasar a castellano sale en castellano si aún no se ha visto en él', () => {
  assert.deepEqual(intro.parseSeen(''), []);
  assert.deepEqual(intro.parseSeen('1'), [], 'el «1» antiguo no dice el idioma');
  assert.deepEqual(intro.parseSeen('en'), ['en']);
  assert.deepEqual(intro.parseSeen('es,en'), ['es', 'en']);
  assert.deepEqual(intro.parseSeen('fr,en'), ['en']);
  const src = read('assets/intro-portada.js');
  assert.match(src, /addEventListener\('admira:languagechange'/, 'sigue el cambio de idioma de la portada y de /idioma');
  assert.match(src, /if \(current\) current\.setLang\(next\); else tryOpen\(next\)/);
  assert.match(src, /seen: seenNow\(\)\.includes\(lang\)/, 'vista por idioma');
  assert.match(src, /const at = video\.currentTime;[\s\S]*video\.currentTime = at/, 'con la intro en marcha cambia el vídeo sin perder el segundo');
});
