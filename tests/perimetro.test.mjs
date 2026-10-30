import test from 'node:test';
import assert from 'node:assert/strict';
import {perimetro, siteForHost, isPublicPath, isInternalPath, safeReturnTo, servedPath} from '../functions/_perimetro.js';

const env = {PERIMETRO_SIGNING_KEY:'k'.repeat(64), WHITELIST_SITE_TOKEN:'t'.repeat(64)};
const ctx = (url, headers = {}) => ({
  request:new Request(url, {headers}), env,
  next:async () => new Response('<html>contenido</html>', {headers:{'content-type':'text/html'}})
});
const noFetch = async () => { throw new Error('sin red en el test'); };

test('cada dominio es su web; pages.dev y previews también; lo demás no', () => {
  assert.equal(siteForHost('www.xpaceos.com').id, 'xpaceos');
  assert.equal(siteForHost('www.admira.store').id, 'admira-store');
  assert.equal(siteForHost('abc123.xpaceos.pages.dev').id, 'xpaceos');
  assert.equal(siteForHost('evil-xpaceos.pages.dev'), null);
  assert.equal(siteForHost('ejemplo.com'), null);
});

test('rutas públicas acordadas: gemelo, xpacios y MCP', () => {
  assert.ok(isPublicPath('/admira-xp/'));
  assert.ok(isPublicPath('/admira-xp/index.html'));
  assert.ok(isPublicPath('/xpacios/cafebreria/'));
  assert.ok(isPublicPath('/mcp/'));
  assert.ok(isPublicPath('/avatar-ask'));
  assert.ok(!isPublicPath('/avatar-ask-falso'));
  assert.ok(!isPublicPath('/'));
  assert.ok(!isPublicPath('/admira-xpfalso/'));
});

test('la pregunta del avatar no exige sesión y no abre la portada', async () => {
  assert.equal((await perimetro(ctx('https://www.xpaceos.com/avatar-ask', {Accept:'application/json'}), noFetch)).status, 200);
  assert.equal((await perimetro(ctx('https://abc.xpaceos.pages.dev/avatar-ask', {Accept:'*/*'}), noFetch)).status, 200);
});

test('sin sesión, la portada redirige al login y no entrega el HTML', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/inventario/', {Accept:'*/*'}), noFetch);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), 'https://www.xpaceos.com/auth/login?return_to=%2Finventario%2F');
});

test('el apex manda al login del canónico', async () => {
  const r = await perimetro(ctx('https://admira.store/'), noFetch);
  assert.equal(r.headers.get('location'), 'https://www.admira.store/auth/login?return_to=%2F');
});

test('el gemelo y los assets salen sin sesión', async () => {
  assert.equal((await perimetro(ctx('https://www.xpaceos.com/admira-xp/'), noFetch)).status, 200);
  // El asset sale con su tipo real: un .png que llegara como HTML sería la portada en fallback (404 desde el 22-oct-2026).
  const png = {request:new Request('https://www.xpaceos.com/assets/logo.png'), env, next:async () => new Response('x', {headers:{'content-type':'image/png'}})};
  assert.equal((await perimetro(png, noFetch)).status, 200);
});

test('una cookie falsificada no abre nada', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:'__Host-perimetro_session=eyJ2IjoxfQ.firmafalsa'}), noFetch);
  assert.equal(r.status, 302);
});

test('host desconocido → 421', async () => {
  assert.equal((await perimetro(ctx('https://otro.example/'), noFetch)).status, 421);
});

test('la página de login lleva el callback del propio host', async () => {
  const r = await perimetro(ctx('https://www.admira.store/auth/login?return_to=%2Fx'), noFetch);
  assert.equal(r.status, 401);
  const html = await r.text();
  assert.match(html, /data-login_uri="https:\/\/www\.admira\.store\/auth\/callback"/);
  assert.match(r.headers.get('set-cookie'), /__Host-perimetro_nonce=/);
});

test('callback sin credencial válida no da sesión', async () => {
  const form = new FormData(); form.set('credential', 'a.b.c');
  const request = new Request('https://www.xpaceos.com/auth/callback', {method:'POST', body:form});
  const r = await perimetro({request, env, next:async () => new Response('x')}, noFetch);
  assert.equal(r.status, 401);
  assert.doesNotMatch(r.headers.get('set-cookie') || '', /__Host-perimetro_session=[^;]/);
});

test('return_to no puede salir del sitio', () => {
  assert.equal(safeReturnTo('//evil.com'), '/');
  assert.equal(safeReturnTo('https://evil.com'), '/');
  assert.equal(safeReturnTo('/%2F%2Fevil.com'), '/');
  assert.equal(safeReturnTo('/auth/callback'), '/');
  assert.equal(safeReturnTo('/xpacios/?a=1'), '/xpacios/?a=1');
});

test('/auth/permisos sin sesión manda al login', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/auth/permisos'), noFetch);
  assert.equal(r.status, 302);
  assert.match(r.headers.get('location'), /\/auth\/login/);
});

async function sesion(email, aud = 'xpaceos') {
  const b64 = (s) => Buffer.from(s).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = b64(JSON.stringify({v:1, aud, email, sub:'1', iat:now, exp:now + 3600}));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.PERIMETRO_SIGNING_KEY), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('perimetro:' + payload))).toString('base64url');
  return `__Host-perimetro_session=${payload}.${sig}`;
}
const lista = (grants) => async (url, opts = {}) => {
  const u = new URL(url);
  if (u.pathname === '/access') {
    const email = u.searchParams.get('email');
    const owner = email === 'csilva@admira.com';
    return Response.json({ok:true, allowed:owner || grants.includes(email), superuser:owner});
  }
  if (u.pathname === '/sites') return Response.json({ok:true, owners:['csilva@admira.com'], users:['ana@admira.com', 'luis@admira.com'], sites:{xpaceos:grants}});
  if (u.pathname === '/site-grant') { const b = JSON.parse(opts.body); grants.push(b.email); return Response.json({ok:true}); }
  throw new Error('inesperado ' + url);
};

test('con sesión y permiso, la portada sale; con sesión de otra web, no', async () => {
  const f = lista(['ana@admira.com']);
  const ok = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('ana@admira.com')}), f);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('cache-control'), 'private, no-store');
  const otra = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('ana@admira.com', 'admira-store')}), f);
  assert.equal(otra.status, 302);
});

test('sesión válida pero sin casilla → login', async () => {
  const r = await perimetro(ctx('https://www.xpaceos.com/', {Cookie:await sesion('luis@admira.com')}), lista([]));
  assert.equal(r.status, 302);
});

test('/auth/permisos: superuser ve las casillas y puede dar acceso; usuario normal, 403', async () => {
  const grants = [];
  const f = lista(grants);
  const page = await perimetro(ctx('https://www.xpaceos.com/auth/permisos', {Cookie:await sesion('csilva@admira.com')}), f);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /luis@admira\.com/);
  assert.match(html, /owner · siempre/);
  const form = new FormData(); form.set('email', 'luis@admira.com'); form.set('allow', '1');
  const post = await perimetro({request:new Request('https://www.xpaceos.com/auth/permisos', {method:'POST', body:form, headers:{Cookie:await sesion('csilva@admira.com'), Origin:'https://www.xpaceos.com'}}), env, next:async () => new Response('x')}, f);
  assert.equal(post.status, 200);
  assert.deepEqual(grants, ['luis@admira.com']);
  const csrf = await perimetro({request:new Request('https://www.xpaceos.com/auth/permisos', {method:'POST', body:form, headers:{Cookie:await sesion('csilva@admira.com'), Origin:'https://evil.example'}}), env, next:async () => new Response('x')}, f);
  assert.equal(csrf.status, 403);
  grants.push('ana@admira.com');
  const normal = await perimetro(ctx('https://www.xpaceos.com/auth/permisos', {Cookie:await sesion('ana@admira.com')}), f);
  assert.equal(normal.status, 403);
});

// ── Entrada de servicio de agentes (/auth/agente) ──
const TOKEN = 'a'.repeat(48);
const envAgente = {...env, ADMIRA_AGENT_LOGIN_TOKEN:TOKEN};
const pide = (url, init = {}, e = envAgente) => ({
  request:new Request(url, init), env:e,
  next:async () => new Response('<html>contenido</html>', {headers:{'content-type':'text/html'}})
});
const registro = (usos) => async (url, opts = {}) => {
  if (new URL(url).pathname === '/agent-log') { usos.push(JSON.parse(opts.body)); return Response.json({ok:true}); }
  throw new Error('inesperado ' + url);
};
const cookieDe = (r) => r.headers.get('set-cookie').split(';')[0];

test('sin secret configurado, la entrada de agentes no existe', async () => {
  const r = await perimetro(pide('https://www.xpaceos.com/auth/agente', {method:'POST', headers:{Authorization:`Bearer ${TOKEN}`}}, env), noFetch);
  assert.equal(r.status, 404);
  const corto = await perimetro(pide('https://www.xpaceos.com/auth/agente', {}, {...env, ADMIRA_AGENT_LOGIN_TOKEN:'corto'}), noFetch);
  assert.equal(corto.status, 404);
});

test('token correcto por Bearer: 200 JSON, cookie, entra en la portada y queda registrado', async () => {
  const usos = [];
  const f = registro(usos);
  const login = await perimetro(pide('https://www.xpaceos.com/auth/agente', {method:'POST', headers:{Authorization:`Bearer ${TOKEN}`, 'X-Agente':'NeoMBP14', 'X-Return-To':'/inventario/'}}), f);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), {ok:true, email:'agentes@silicio.admiranext.com', name:'NeoMBP14', agent:true});
  assert.match(login.headers.get('set-cookie'), /^__Host-perimetro_session=.+; Path=\/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax$/);
  assert.equal(usos.length, 1);
  assert.equal(usos[0].ok, true);
  assert.equal(usos[0].agente, 'NeoMBP14');
  assert.equal(usos[0].site, 'xpaceos');
  assert.ok(!JSON.stringify(usos).includes(TOKEN));
  const Cookie = cookieDe(login);
  // La sesión de agente no consulta la lista: ni /access ni red.
  const portada = await perimetro(pide('https://www.xpaceos.com/', {headers:{Cookie}}), noFetch);
  assert.equal(portada.status, 200);
  const quien = await perimetro(pide('https://www.xpaceos.com/auth/session', {headers:{Cookie}}), noFetch);
  assert.deepEqual(await quien.json(), {ok:true, email:'agentes@silicio.admiranext.com', site:'xpaceos', agent:true});
  assert.equal(quien.headers.get('set-cookie'), null, 'agent lifetime is not extended');
});

test('Bearer sin X-Agente → 200 con nombre «agente»', async () => {
  const usos = [];
  const f = registro(usos);
  const login = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST', headers:{Authorization:`Bearer ${TOKEN}`}}), f);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), {ok:true, email:'agentes@silicio.admiranext.com', name:'agente', agent:true});
  assert.match(login.headers.get('set-cookie'), /^__Host-perimetro_session=/);
  assert.equal(usos[0].agente, 'agente');
});

test('token por formulario también entra; token malo, no, y queda registrado el intento', async () => {
  const usos = [];
  const f = registro(usos);
  const bueno = new FormData(); bueno.set('token', TOKEN); bueno.set('agente', 'TrinityMBP14');
  const ok = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST', body:bueno, headers:{Origin:'https://www.admira.store'}}), f);
  assert.equal(ok.status, 303);
  const malo = new FormData(); malo.set('token', 'b'.repeat(48)); malo.set('agente', 'Intruso');
  const no = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST', body:malo}), f);
  assert.equal(no.status, 401);
  assert.equal(no.headers.get('set-cookie'), null);
  assert.match(await no.text(), /Token no válido/);
  const bearerMalo = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST', headers:{Authorization:'Bearer ' + 'c'.repeat(48)}}), f);
  assert.equal(bearerMalo.status, 401);
  const vacio = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST'}), f);
  assert.equal(vacio.status, 401);
  assert.deepEqual(usos.map((u) => u.ok), [true, false, false, false]);
  const ajeno = await perimetro(pide('https://www.admira.store/auth/agente', {method:'POST', body:bueno, headers:{Origin:'https://evil.example'}}), f);
  assert.equal(ajeno.status, 403);
});

test('el token no se acepta en la URL y sin él la web sigue pidiendo Google', async () => {
  const f = registro([]);
  const enUrl = await perimetro(pide(`https://www.xpaceos.com/auth/agente?token=${TOKEN}`), f);
  assert.equal(enUrl.status, 200);
  assert.equal(enUrl.headers.get('set-cookie'), null);
  assert.ok(!(await enUrl.text()).includes(TOKEN));
  const portada = await perimetro(pide(`https://www.xpaceos.com/?token=${TOKEN}`, {headers:{Authorization:`Bearer ${TOKEN}`}}), f);
  assert.equal(portada.status, 302);
  assert.match(portada.headers.get('location'), /\/auth\/login/);
});

test('la sesión de agente es de su web, no gestiona permisos y muere al cambiar el token', async () => {
  const f = registro([]);
  const login = await perimetro(pide('https://www.xpaceos.com/auth/agente', {method:'POST', headers:{Authorization:`Bearer ${TOKEN}`}}), f);
  const Cookie = cookieDe(login);
  const otraWeb = await perimetro(pide('https://www.admira.store/', {headers:{Cookie}}), noFetch);
  assert.equal(otraWeb.status, 302);
  const permisos = await perimetro(pide('https://www.xpaceos.com/auth/permisos', {headers:{Cookie}}), noFetch);
  assert.equal(permisos.status, 403);
  const rotado = {...env, ADMIRA_AGENT_LOGIN_TOKEN:'z'.repeat(48)};
  assert.equal((await perimetro(pide('https://www.xpaceos.com/', {headers:{Cookie}}, rotado), noFetch)).status, 302);
  assert.equal((await perimetro(pide('https://www.xpaceos.com/', {headers:{Cookie}}, env), noFetch)).status, 302);
});

test('una sesión de Google con el correo de agente, sin huella, no entra', async () => {
  const todos = async () => Response.json({ok:true, allowed:true, superuser:true});
  const r = await perimetro(pide('https://www.xpaceos.com/', {headers:{Cookie:await sesion('agentes@silicio.admiranext.com')}}), todos);
  assert.equal(r.status, 302);
});

// ── Fuga del login (DEC-mvjb0o1k2pn8, 22-oct-2026): un asset inexistente no devuelve la portada ──
const fallbackPortada = (url, headers = {}) => ({
  request:new Request(url, {headers}), env,
  next:async () => new Response('<html>portada privada</html>', {status:200, headers:{'content-type':'text/html; charset=utf-8'}})
});
const assetReal = (url, type) => ({
  request:new Request(url), env,
  next:async () => new Response('x', {status:200, headers:{'content-type':type}})
});

test('un asset que no existe y vuelve como HTML (fallback a index.html) es 404, no la portada', async () => {
  for (const path of ['/zzz.txt', '/qqq.json', '/help/zzz.css', '/llms.txt']) {
    const r = await perimetro(fallbackPortada('https://www.admira.store' + path), noFetch);
    assert.equal(r.status, 404, path);
    assert.doesNotMatch(await r.text(), /portada/, path);
  }
});

test('los assets reales y las páginas públicas siguen saliendo', async () => {
  assert.equal((await perimetro(assetReal('https://www.admira.store/assets/logo.png', 'image/png'), noFetch)).status, 200);
  assert.equal((await perimetro(assetReal('https://www.admira.store/version.json', 'application/json'), noFetch)).status, 200);
  assert.equal((await perimetro(assetReal('https://www.admira.store/robots.txt', 'text/plain'), noFetch)).status, 200);
  assert.equal((await perimetro(fallbackPortada('https://www.admira.store/admira-xp/'), noFetch)).status, 200);
  assert.equal((await perimetro(fallbackPortada('https://www.admira.store/xpacios/'), noFetch)).status, 200);
  assert.equal((await perimetro(fallbackPortada('https://www.admira.store/mcp/'), noFetch)).status, 200);
  const raiz = await perimetro(fallbackPortada('https://www.admira.store/'), noFetch);
  assert.equal(raiz.status, 302);
});

// ── /xpacios es público salvo sus herramientas internas (Carlos, 30-oct-2026) ──
test('crear, grok y los dos Xtanco los cierra el servidor; el resto de /xpacios sigue público', async () => {
  const privadas = ['/xpacios/crear', '/xpacios/crear/', '/xpacios/crear/phone.html', '/xpacios/grok', '/xpacios/grok/', '/xpacios/xtanco-barcelona/', '/xpacios/xtanco-barcelona/?xpacio=x&go=decorar', '/xpacios/xtanco-valencia/'];
  for (const ruta of privadas) {
    assert.ok(!isPublicPath(ruta.split('?')[0]), ruta);
    const r = await perimetro(fallbackPortada('https://www.admira.store' + ruta, {Accept:'*/*'}), noFetch);
    assert.equal(r.status, 302, ruta);
    assert.match(r.headers.get('location'), /\/auth\/login/, ruta);
  }
  for (const ruta of ['/xpacios', '/xpacios/', '/xpacios/sneakerstore/', '/xpacios/crear-otro/', '/xpacios/grokbot/', '/xpacios/xtanco-otro/']) {
    assert.ok(isPublicPath(ruta), ruta);
    assert.equal((await perimetro(fallbackPortada('https://www.admira.store' + ruta, {'Sec-Fetch-Dest':'document', Accept:'text/html'}), noFetch)).status, 200, ruta);
  }
  // Sus assets no son páginas: siguen saliendo sin sesión, como todos.
  assert.equal((await perimetro(assetReal('https://www.admira.store/xpacios/crear/modelo.bin', 'application/octet-stream'), noFetch)).status, 200);
  // Con sesión y permiso, abren.
  const f = lista(['ana@admira.com']);
  const Cookie = await sesion('ana@admira.com', 'admira-store');
  for (const ruta of ['/xpacios/crear/', '/xpacios/xtanco-barcelona/']) {
    const r = await perimetro(fallbackPortada('https://www.admira.store' + ruta, {Cookie, 'Sec-Fetch-Dest':'document', Accept:'text/html'}), f);
    assert.equal(r.status, 200, ruta);
    assert.equal(r.headers.get('cache-control'), 'private, no-store', ruta);
  }
});

// Pages conserva hasta 7 días los assets de despliegues anteriores y los sigue sirviendo con un 200 (30-oct-2026).
test('lo interno da 404 aunque Pages aún conserve una copia, con sesión o sin ella', async () => {
  const conservado = (ruta, headers = {}) => assetReal('https://www.admira.store' + ruta, 'text/plain');
  for (const ruta of ['/AGENTS.md', '/HANDOFF.md', '/README.md', '/deploy.sh', '/sello-y-verja.py', '/.gitattributes', '/scripts/google-redirects.sh', '/release-preflight.test.mjs', '/scan/worker/.wrangler/cache/wrangler-account.json', '/admira-xp/docs/handoffs/2026-10-09-sneakerstore-demo.md', '/xpacios/CHANGELOG.md', '/admira-xp/tools/taller-3d/taller.py', '/%64eploy.sh', '/mcp/..%2FAGENTS.md', '/deploy.sh/']) {
    const r = await perimetro(conservado(ruta), noFetch);
    assert.equal(r.status, 404, ruta);
    assert.equal(r.headers.get('cache-control'), 'no-store', ruta);
    assert.equal(await r.text(), 'Not found', ruta);
  }
  const Cookie = await sesion('ana@admira.com', 'admira-store');
  const conSesion = {request:new Request('https://www.admira.store/deploy.sh', {headers:{Cookie}}), env, next:async () => new Response('secreto', {headers:{'content-type':'text/plain'}})};
  assert.equal((await perimetro(conSesion, lista(['ana@admira.com']))).status, 404);
});

test('lo que la web enlaza no cuenta como interno', async () => {
  for (const ruta of ['/admira-xp/docs/matrix-mcp.md', '/mcp/demo-engine.md', '/admira-xp/scripts/best-production.md', '/admira-xp/assets/people/best-v1/LICENSE.md', '/mcp/manifest.json', '/doc/', '/llms.txt', '/index.html', '/admira-xp/scripts/demo-tour.mjs']) {
    assert.ok(!isInternalPath(ruta), ruta);
  }
  assert.equal((await perimetro(assetReal('https://www.admira.store/admira-xp/docs/matrix-mcp.md', 'text/markdown'), noFetch)).status, 200);
});

test('se decide sobre la ruta que se va a servir, no sobre cómo llega escrita', () => {
  const casos = {
    '/': '/', '/mcp/': '/mcp/', '/mcp': '/mcp', '/xpacios/crear/phone.html': '/xpacios/crear/phone.html',
    '/xpacios//crear/': '/xpacios/crear/', '/xpacios/%63rear/': '/xpacios/crear/', '/xpacios/crear%2F': '/xpacios/crear/',
    '/mcp/..%2Fleads.html': '/leads.html', '/mcp/..%252Fleads.html': '/leads.html', '/mcp/..%5Cleads.html': '/leads.html',
    '/mcp/%2e%2e%2f': '/', '/mcp/..': '/', '/mcp/.': '/mcp/', '/assets/mi%20logo.png': '/assets/mi logo.png',
    '/mcp/%3F%2F..%2F..%2Fleads.html': '/leads.html', '/mal%ZZcodificada/': '/',
  };
  for (const [entrada, esperada] of Object.entries(casos)) assert.equal(servedPath(entrada), esperada, entrada);
});

test('codificar la ruta o doblar barras no abre nada privado', async () => {
  const DOCUMENTO = {'Sec-Fetch-Dest':'document', Accept:'text/html'};
  for (const ruta of [
    '/xpacios//crear/', '/xpacios/%63rear/', '/xpacios/crear%2F', '/xpacios/crear/%2e/', '/xpacios//grok/', '/xpacios/%67rok/',
    '/mcp/..%2Fleads.html', '/mcp/..%2F', '/mcp/..%252Fleads.html', '/mcp/..%5Cleads.html', '/mcp/%3F%2F..%2F..%2Fleads.html',
    '/xpacios/..%2Finventario/', '/admira-xp//', '/admira-xp/%69ndex.html', '/mcp/mal%ZZ',
  ]) {
    for (const headers of [DOCUMENTO, {Accept:'*/*'}]) {
      // Sin cabeceras de documento, /admira-xp// es el gemelo incrustado: público como siempre.
      if (ruta.startsWith('/admira-xp') && headers !== DOCUMENTO) continue;
      const r = await perimetro(fallbackPortada('https://www.admira.store' + ruta, headers), noFetch);
      assert.equal(r.status, 302, `${ruta} ${JSON.stringify(headers)}`);
      assert.match(r.headers.get('location'), /\/auth\/login/, ruta);
    }
  }
  // Una ruta pública escrita con acentos o codificada sigue abriendo.
  for (const ruta of ['/xpacios/caf%C3%A9/', '/mcp//', '/%6Dcp/']) {
    assert.equal((await perimetro(fallbackPortada('https://www.admira.store' + ruta, DOCUMENTO), noFetch)).status, 200, ruta);
  }
  assert.equal((await perimetro(assetReal('https://www.admira.store/assets/mi%20logo.png', 'image/png'), noFetch)).status, 200);
});

// ── Solicitar acceso desde el login (Carlos, 30-oct-2026) ──
const solicitud = (campos, headers = {Origin:'https://www.admira.store'}, base = 'https://www.admira.store') => {
  const body = new FormData();
  for (const [campo, valor] of Object.entries(campos)) body.set(campo, valor);
  return {request:new Request(base + '/auth/solicitar-acceso', {method:'POST', body, headers}), env, next:async () => new Response('x')};
};
const completa = {name:'Ana Prueba', email:'ana@example.com', company:'Ejemplo SL', notes:'Quiero ver el gemelo', consent:'1', return_to:'/xpacios/crear/'};
const recogeLeads = (leads, respuesta = () => Response.json({ok:true})) => async (url, opts = {}) => {
  leads.push({url:String(url), origin:opts.headers?.Origin, body:JSON.parse(opts.body)});
  return respuesta();
};

test('el login ofrece solicitar acceso con consentimiento obligatorio y sin aflojar su CSP', async () => {
  const r = await perimetro(ctx('https://www.admira.store/auth/login?return_to=%2Fxpacios%2Fcrear%2F'), noFetch);
  const html = await r.text();
  assert.match(html, /<form method="post" action="\/auth\/solicitar-acceso">/);
  assert.match(html, /name="return_to" value="\/xpacios\/crear\/"/);
  assert.match(html, /<input type="checkbox" name="consent" value="1" required>/);
  assert.match(html, /info@admira\.com/);
  assert.match(html, /¿No tienes acceso\? Solicítalo/);
  const csp = r.headers.get('content-security-policy');
  assert.doesNotMatch(csp, /unsafe-inline'[^;]*script|script-src[^;]*unsafe/);
  assert.match(csp, /form-action 'self'/);
  const en = await perimetro(ctx('https://www.admira.store/auth/login?return_to=%2Fmcp%2F%3Flang%3Den'), noFetch);
  assert.match(await en.text(), /No access\? Request it/);
});

test('una solicitud completa llega al mismo /lead, con su origen, y no da sesión', async () => {
  const leads = [];
  const r = await perimetro(solicitud(completa), recogeLeads(leads));
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Solicitud recibida/);
  assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].url, 'https://api.admira.store/lead');
  assert.equal(leads[0].origin, 'https://www.admira.store');
  const {body} = leads[0];
  assert.equal(body.name, 'Ana Prueba');
  assert.equal(body.email, 'ana@example.com');
  assert.equal(body.company, 'Ejemplo SL');
  assert.equal(body.consent, true);
  assert.equal(body.source, 'admira-store-login');
  assert.match(body.notes, /Solicitud de acceso a admira\.store/);
  assert.match(body.notes, /ruta pedida: \/xpacios\/crear\//);
  assert.match(body.notes, /Quiero ver el gemelo/);
});

test('sin nombre, email válido o consentimiento no sale nada y se conserva lo escrito', async () => {
  const casos = [
    [{...completa, name:' '}, /Pon tu nombre/],
    [{...completa, email:'no-es-un-correo'}, /Pon un email válido/],
    [{...completa, consent:''}, /Marca la casilla/],
  ];
  for (const [campos, aviso] of casos) {
    const leads = [];
    const r = await perimetro(solicitud(campos), recogeLeads(leads));
    assert.equal(r.status, 400);
    assert.deepEqual(leads, []);
    const html = await r.text();
    assert.match(html, aviso);
    assert.match(html, /<details class="ask" open>/);
    assert.match(html, /Ejemplo SL/);
  }
  const sinCasilla = {...completa};
  delete sinCasilla.consent;
  assert.equal((await perimetro(solicitud(sinCasilla), noFetch)).status, 400);
});

test('lo escrito vuelve escapado', async () => {
  const r = await perimetro(solicitud({...completa, company:'"><script>alert(1)</script>', consent:''}), noFetch);
  const html = await r.text();
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&quot;&gt;&lt;script&gt;alert\(1\)/);
});

test('el campo trampa contesta como si nada y no envía', async () => {
  const leads = [];
  const r = await perimetro(solicitud({...completa, web:'https://spam.example'}), recogeLeads(leads));
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Solicitud recibida/);
  assert.deepEqual(leads, []);
});

test('si /lead falla se avisa y se conserva lo escrito', async () => {
  const caido = await perimetro(solicitud(completa), recogeLeads([], () => new Response('x', {status:500})));
  assert.equal(caido.status, 502);
  const html = await caido.text();
  assert.match(html, /No se pudo enviar/);
  assert.match(html, /Ana Prueba/);
  assert.equal((await perimetro(solicitud(completa), noFetch)).status, 502);
});

test('otro origen no puede enviar, GET vuelve al login y la vista en inglés contesta en inglés', async () => {
  const ajeno = await perimetro(solicitud(completa, {Origin:'https://evil.example'}), noFetch);
  assert.equal(ajeno.status, 403);
  const get = await perimetro(ctx('https://www.admira.store/auth/solicitar-acceso'), noFetch);
  assert.equal(get.status, 302);
  assert.equal(get.headers.get('location'), '/auth/login');
  const leads = [];
  const en = await perimetro(solicitud({...completa, return_to:'/mcp/?lang=en'}), recogeLeads(leads));
  assert.match(await en.text(), /Request received/);
  assert.equal(leads[0].body.source, 'admira-store-login');
});

test('cada web firma su solicitud', async () => {
  const leads = [];
  await perimetro(solicitud(completa, {Origin:'https://www.xpaceos.com'}, 'https://www.xpaceos.com'), recogeLeads(leads));
  assert.equal(leads[0].body.source, 'xpaceos-login');
  assert.match(leads[0].body.notes, /Solicitud de acceso a XpaceOS/);
});
