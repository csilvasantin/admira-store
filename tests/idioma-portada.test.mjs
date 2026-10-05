// Idioma compartido: la portada y el resto de páginas con contenido bilingüe propio
// leen la misma clave que escribe /idioma en ⌘ Experto, siguen el mismo evento y
// conservan el idioma al recargar. Contrato: admira-xp/docs/options-language.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';

const require = createRequire(import.meta.url);
const shell = require('../assets/xpace-shell.js');
const XpaceLang = require('../assets/xpace-lang.js');
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

const PAGES = ['index.html', 'lenovo/index.html', 'help/index.html', 'help/cli/index.html', 'doc/index.html', 'backoffice/index.html'];
const LEGACY = /(?:get|set|remove)Item\(\s*['"](?:xpaceosLang|xpace_lang|loyalty_admin_lang)['"]/;

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {map, getItem: k => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k)};
}
function fakeWindow(href, storage) {
  const win = new EventTarget();
  win.location = {href};
  win.localStorage = storage;
  win.history = {state: null, replaceState(state, _, url) { this.state = state; win.location.href = url; }};
  return win;
}

test('la portada y el shell comparten clave de idioma y evento', () => {
  assert.equal(shell.LANG_KEY, 'xtanco_lang');
  assert.equal(XpaceLang.LANG_KEY, shell.LANG_KEY);
  assert.equal(XpaceLang.LANG_EVENT, shell.LANG_EVENT);
  assert.equal(shell.LANG_EVENT, 'admira:languagechange');
  const storage = memoryStorage();
  shell.languageCommand('/idioma ENG', {storage, url: 'https://www.xpaceos.com/'});
  assert.equal(storage.getItem(XpaceLang.LANG_KEY), 'en');
});

test('el shell avisa a la página tras /idioma con el evento compartido', () => {
  const source = read('assets/xpace-shell.js');
  const apply = source.slice(source.indexOf('shared.language = (text, apply)'), source.indexOf('// Cliente activo'));
  assert.match(apply, /root\.dispatchEvent\(new CustomEvent\(LANG_EVENT, \{detail: \{lang: next, source: 'xpace-shell'\}\}\)\)/);
});

test('las páginas bilingües cargan xpace-lang.js de forma síncrona y no usan claves antiguas', () => {
  for (const page of PAGES) {
    const html = read(page);
    const tag = html.match(/<script src="\/assets\/xpace-lang\.js\?v=[^"]+"><\/script>/);
    assert.ok(tag, page + ' carga /assets/xpace-lang.js sin defer');
    assert.ok(html.indexOf(tag[0]) < html.search(/XpaceLang\.(bind|resolve)\(/), page + ' carga el helper antes de usarlo');
    assert.doesNotMatch(html, LEGACY, page + ' no lee ni escribe claves de idioma antiguas');
  }
  assert.doesNotMatch(read('lead-form.js'), LEGACY);
  const portada = read('index.html');
  assert.match(portada, /window\.XpaceLang\.bind\(applyLanguage, \{ source: 'portada', fallback: 'es' \}\)/);
  const apply = portada.slice(portada.indexOf('function applyLanguage(lang)'), portada.indexOf('// El formulario de contacto de la home'));
  assert.doesNotMatch(apply, /localStorage/, 'applyLanguage sólo pinta; guardar lo hace XpaceLang');
});

test('/idioma ENG en ⌘ Experto traduce la portada y persiste al recargar', () => {
  const storage = memoryStorage();
  const win = fakeWindow('https://www.xpaceos.com/', storage);
  const applied = [];
  XpaceLang.bind(next => applied.push(next), {window: win, source: 'portada', fallback: 'es'});
  assert.deepEqual(applied, ['es']);
  assert.equal(storage.getItem('xtanco_lang'), null, 'quien no elige conserva el idioma por defecto de cada página');
  // Lo que hace el shell: guarda, reescribe la URL y emite el evento.
  shell.languageCommand('/idioma ENG', {storage, url: win.location.href, history: win.history,
    apply: next => win.dispatchEvent(new CustomEvent(shell.LANG_EVENT, {detail: {lang: next, source: 'xpace-shell'}}))});
  assert.deepEqual(applied, ['es', 'en'], 'el contenido de la portada cambia sin recargar');
  // Recarga con la URL reescrita (?lang=en) y sin ella.
  for (const href of [win.location.href, 'https://www.xpaceos.com/']) {
    const after = [];
    XpaceLang.bind(next => after.push(next), {window: fakeWindow(href, storage), source: 'portada', fallback: 'es'});
    assert.deepEqual(after, ['en'], 'tras recargar sigue en inglés: ' + href);
  }
});

test('?lang= manda en la visita y el botón de la página actualiza URL y preferencia', () => {
  const storage = memoryStorage({xtanco_lang: 'en'});
  assert.equal(XpaceLang.resolve({url: 'https://www.xpaceos.com/?lang=es', storage, fallback: 'en'}), 'es');
  assert.equal(XpaceLang.resolve({url: 'https://www.xpaceos.com/?lang=ENG', storage}), 'en');
  const win = fakeWindow('https://www.xpaceos.com/?lang=es&langlock=1#demo', storage);
  const applied = [], heard = [];
  win.addEventListener(XpaceLang.LANG_EVENT, ev => heard.push(ev.detail));
  const page = XpaceLang.bind(next => applied.push(next), {window: win, source: 'portada', fallback: 'es'});
  assert.equal(page.get(), 'es');
  page.set('en');
  assert.deepEqual(applied, ['es', 'en']);
  assert.equal(storage.getItem('xtanco_lang'), 'en');
  const url = new URL(win.location.href);
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(url.searchParams.has('langlock'), false);
  assert.equal(url.hash, '#demo');
  assert.deepEqual(heard, [{lang: 'en', source: 'portada'}], 'avisa una vez y no se repinta con su propio evento');
});

test('xpaceosLang migra a xtanco_lang una sola vez y no vuelve a competir', () => {
  const storage = memoryStorage({xpaceosLang: 'en', xpace_lang: 'es'});
  assert.equal(XpaceLang.resolve({url: 'https://www.xpaceos.com/', storage, fallback: 'es'}), 'en');
  assert.equal(storage.getItem('xtanco_lang'), 'en');
  assert.equal(storage.getItem('xpaceosLang'), null);
  assert.equal(storage.getItem('xpace_lang'), null);
  // Una clave antigua que reaparezca (p. ej. del espejo aún sin sincronizar) no pisa la preferencia.
  storage.setItem('xpaceosLang', 'es');
  assert.equal(XpaceLang.resolve({url: 'https://www.xpaceos.com/', storage, fallback: 'es'}), 'en');
  assert.equal(storage.getItem('xpaceosLang'), null);
  // Sin almacenamiento disponible, la página sigue funcionando con su idioma por defecto.
  const blocked = {getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() {}};
  assert.equal(XpaceLang.resolve({url: 'https://www.xpaceos.com/', storage: blocked, fallback: 'es'}), 'es');
  assert.equal(XpaceLang.remember('en', {url: 'https://www.xpaceos.com/', storage: blocked}), 'en');
});


test('/idioma sin arg alterna; typo languague y pegados funcionan', () => {
  const storage = memoryStorage();
  const r1 = shell.languageCommand('/idioma', {storage, url: 'https://www.xpaceos.com/', lang: 'es',
    apply: () => {}});
  assert.equal(r1.ok, true);
  assert.equal(r1.language, 'en');
  assert.equal(r1.message, 'Language: English');
  const r2 = shell.languageCommand('/languague', {storage, url: 'https://www.xpaceos.com/', lang: 'en',
    apply: () => {}});
  assert.equal(r2.language, 'es');
  assert.equal(r2.message, 'Idioma: español');
  assert.equal(shell.languageCommand('idiomaESP', {storage, url: 'https://www.xpaceos.com/', lang: 'en', apply: () => {}}).language, 'es');
  assert.equal(shell.languageCommand('/languageENG', {storage, url: 'https://www.xpaceos.com/', lang: 'es', apply: () => {}}).language, 'en');
  assert.equal(shell.languageCommand('/idioma foo', {storage, url: 'https://www.xpaceos.com/', lang: 'es', apply: () => {}}).ok, false);
});
