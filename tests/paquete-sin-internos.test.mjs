// Lo interno del repo no se publica (Carlos, 30-oct-2026): el login solo protege páginas, así que un .md,
// .sh o .py del paquete se descargaría sin sesión. Se prueba el script real sobre todo lo que hay en el repo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {withTransportSecurity} from '../functions/_seguridad.js';

const repo = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = '.github/quitar-internos.sh';

function ficheros(dir, salida = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) ficheros(ruta, salida);
    else salida.push(relative(paqueteActual, ruta).split('\\').join('/'));
  }
  return salida;
}

let paqueteActual = '';
function paqueteDelRepo() {
  const raiz = mkdtempSync(join(tmpdir(), 'admira-store-paquete-'));
  const seguidos = execFileSync('git', ['ls-files'], {cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28}).split('\n').filter(Boolean);
  // Vacíos: aquí importa qué se publica, no lo que contiene cada fichero.
  for (const fichero of seguidos) {
    mkdirSync(dirname(join(raiz, fichero)), {recursive: true});
    writeFileSync(join(raiz, fichero), '');
  }
  return raiz;
}

test('el paquete sale sin lo interno y con todo lo que la web necesita', () => {
  paqueteActual = paqueteDelRepo();
  try {
    const r = spawnSync('bash', [join(repo, SCRIPT), paqueteActual], {encoding: 'utf8'});
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const publicados = ficheros(paqueteActual);
    const conjunto = new Set(publicados);

    const internos = publicados.filter((f) =>
      /\.(sh|py)$/.test(f) ||
      /\.test\.(mjs|js|py)$/.test(f) ||
      /(^|\/)(\.wrangler|\.claude)\//.test(f) ||
      /(^|\/)(wrangler\.toml|\.gitignore|\.gitattributes|\.gitkeep|\.nojekyll)$/.test(f) ||
      /^(scripts|docs|scan\/worker|admira-xp\/docs\/handoffs)\//.test(f));
    assert.deepEqual(internos, [], 'interno dentro del paquete');

    const markdownFuera = publicados.filter((f) =>
      f.endsWith('.md') &&
      !f.startsWith('admira-xp/docs/') && !f.startsWith('mcp/') &&
      f !== 'admira-xp/scripts/best-production.md' && !/(^|\/)LICENSE[^/]*$/i.test(f));
    assert.deepEqual(markdownFuera, [], 'markdown que la web no enlaza');

    for (const necesario of [
      'index.html', 'robots.txt', 'sitemap.xml', 'llms.txt', '404.html', '_headers', '_redirects', 'gate.js',
      'functions/_middleware.js', 'functions/_perimetro.js', 'mcp/manifest.json', 'mcp/index.html',
      'admira-xp/index.html', 'admira-xp/docs/matrix-mcp.md', 'admira-xp/scripts/best-production.md',
      'admira-xp/assets/people/best-v1/LICENSE.md', 'xpacios/index.html', 'assets/xpace-shell.js',
    ]) assert.ok(conjunto.has(necesario), `falta ${necesario}`);
  } finally {
    rmSync(paqueteActual, {recursive: true, force: true});
  }
});

test('el script se niega a trabajar sobre algo que no es un paquete', () => {
  const vacio = mkdtempSync(join(tmpdir(), 'admira-store-vacio-'));
  try {
    assert.notEqual(spawnSync('bash', [join(repo, SCRIPT), vacio], {encoding: 'utf8'}).status, 0);
  } finally {
    rmSync(vacio, {recursive: true, force: true});
  }
});

test('el despliegue llama al script antes de publicar', () => {
  const flujo = readFileSync(join(repo, '.github/workflows/cloudflare-pages.yml'), 'utf8');
  const quitar = flujo.indexOf('bash .github/quitar-internos.sh _site');
  assert.ok(quitar > 0, 'cloudflare-pages.yml no llama a quitar-internos.sh');
  assert.ok(quitar > flujo.indexOf('git archive HEAD'), 'se quita después de sacar el paquete');
  assert.ok(quitar < flujo.indexOf('wrangler@4 pages deploy'), 'se quita antes de publicar');
});

test('la caché de wrangler no vuelve al repo', () => {
  const seguidos = execFileSync('git', ['ls-files'], {cwd: repo, encoding: 'utf8', maxBuffer: 1 << 28});
  assert.doesNotMatch(seguidos, /(^|\/)\.wrangler\//m);
});

test('toda respuesta lleva HSTS y conserva estado, cuerpo y cookies', async () => {
  const original = new Response('hola', {status: 403, headers: {'content-type': 'text/plain'}});
  original.headers.append('set-cookie', 'a=1');
  original.headers.append('set-cookie', 'b=2');
  const segura = withTransportSecurity(original);
  assert.equal(segura.status, 403);
  assert.match(segura.headers.get('strict-transport-security'), /^max-age=\d{7,}$/);
  assert.doesNotMatch(segura.headers.get('strict-transport-security'), /includeSubDomains|preload/);
  assert.deepEqual(segura.headers.getSetCookie(), ['a=1', 'b=2']);
  assert.equal(await segura.text(), 'hola');

  const redireccion = withTransportSecurity(new Response(null, {status: 302, headers: {location: '/auth/login'}}));
  assert.equal(redireccion.status, 302);
  assert.equal(redireccion.headers.get('location'), '/auth/login');
  assert.ok(redireccion.headers.get('strict-transport-security'));
});
