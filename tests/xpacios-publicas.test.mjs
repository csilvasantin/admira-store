// Lo que la web anuncia como público tiene que abrirse sin login (Carlos, 30-oct-2026). Hasta hoy el servidor
// servía /xpacios/ pero una verja heredada de Pixeria, dentro de la página, mandaba al login en el navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {isPublicPath} from '../functions/_perimetro.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => readFileSync(join(repo, ruta), 'utf8');

function paginas(dir, salida = []) {
  for (const nombre of readdirSync(join(repo, dir))) {
    const ruta = join(dir, nombre);
    if (statSync(join(repo, ruta)).isDirectory()) paginas(ruta, salida);
    else if (nombre.endsWith('.html')) salida.push(relative(repo, join(repo, ruta)).split('\\').join('/'));
  }
  return salida;
}

test('ninguna página de /xpacios ni de /mcp lleva una verja propia', () => {
  const conVerja = [...paginas('xpacios'), ...paginas('mcp')]
    .filter((pagina) => /auth-gate\.js|GATE-INICIO|gate=off/.test(leer(pagina)));
  assert.deepEqual(conVerja, []);
});

test('todo lo que anuncian el sitemap y llms.txt es público para el servidor', () => {
  const anunciadas = [
    ...[...leer('sitemap.xml').matchAll(/<loc>https:\/\/www\.admira\.store(\/[^<]*)<\/loc>/g)].map((m) => m[1]),
    ...[...leer('llms.txt').matchAll(/https:\/\/www\.admira\.store(\/[^\s)]*\/)(?=[\s)]|$)/gm)].map((m) => m[1]),
  ];
  assert.ok(anunciadas.includes('/xpacios/'));
  assert.ok(anunciadas.includes('/mcp/'));
  assert.deepEqual(anunciadas.filter((ruta) => !isPublicPath(ruta)), []);
});

test('robots.txt y sitemap no ofrecen las apps internas', () => {
  const robots = leer('robots.txt');
  for (const app of ['crear', 'grok', 'xtanco-barcelona', 'xtanco-valencia']) {
    assert.match(robots, new RegExp(`^Disallow: /xpacios/${app}/$`, 'm'), app);
    assert.ok(!isPublicPath(`/xpacios/${app}/`), app);
  }
  assert.doesNotMatch(leer('sitemap.xml'), /\/xpacios\/(crear|grok|xtanco-)/);
});

// El índice de Xpacios es compartido y /xpacios/ es pública: leer es libre, escribir no.
test('crear un Xpacio pide sesión antes de tocar el índice compartido', () => {
  const html = leer('xpacios/index.html');
  const inicio = html.indexOf('async function newXpacio(){');
  const fin = html.indexOf('document.getElementById("newXpacioBtn")');
  assert.ok(inicio > 0 && fin > inicio);
  const crear = html.slice(inicio, fin);
  assert.ok(crear.indexOf('/auth/session') >= 0, 'comprueba la sesión');
  assert.ok(crear.indexOf('/auth/session') < crear.indexOf('prompt('), 'antes de preguntar nada');
  assert.ok(crear.indexOf('/auth/session') < crear.indexOf('saveIndex('), 'antes de escribir');
  assert.match(crear, /\/auth\/login\?return_to=/);
});

// Cada navegador que abre una de estas páginas cuenta como pantalla real de la flota.
test('ninguna página pública de /xpacios envía presencia ni proof-of-play de la flota', () => {
  const emisoras = paginas('xpacios')
    .filter((pagina) => isPublicPath('/' + pagina.replace(/index\.html$/, '')))
    .filter((pagina) => /\/xpl\/ping|FLEET\.pix\+"\/emit"/.test(leer(pagina)));
  assert.deepEqual(emisoras, []);
});

test('/xpacios/ sigue a la marca blanca: sin colores fijos en el titular ni en las tarjetas destacadas', () => {
  const html = leer('xpacios/index.html');
  assert.match(html, /:root\[data-mb-marca\]:not\(\[data-mb-alcance="barra"\]\)\{[^}]*--titulo:var\(--mbx-ink\)/);
  assert.match(html, /\.hero h1\{[^}]*color:var\(--titulo\)/);
  assert.match(html, /\.destacado\{[^}]*background:var\(--isla\)/);
  assert.doesNotMatch(html, /<section style="[^"]*background:#0b1b15/);
});
