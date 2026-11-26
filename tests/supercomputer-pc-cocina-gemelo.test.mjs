// Gemelo de AdmiraNeXT05 en AInimation Studio contra la API de PC-COCINA (functions/supercomputer/pc-cocina/api):
// mirar es público desde el dominio del gemelo, mandar pide el pase de GET enlace, y nadie más gana nada.
import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest, crearPase, leerPase, estadoPublico, NUBE, ORIGENES_GEMELO, PASE_TTL, ENLACE_PATH} from '../functions/supercomputer/pc-cocina/api/[[path]].js';

const GEMELO = 'https://www.ainimation.studio';
const env = {PERIMETRO_SIGNING_KEY:'k'.repeat(64), SUPERCOMPUTER_PC_COCINA_PROXY_KEY:'p'.repeat(40), WHITELIST_SITE_TOKEN:'w'.repeat(20)};
const llamada = (ruta, init = {}) => ({request:new Request('https://www.admira.store/supercomputer/pc-cocina/api/' + ruta, init), env, params:{path:ruta.split('?')[0].split('/')}});
const sinRed = async () => { throw new Error('sin red en el test'); };
const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(clave, mensaje) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(mensaje)));
}
// Cookie de sesión como la firma el perímetro (v1, aud = la web).
async function cookieSesion(email) {
  const now = Math.floor(Date.now() / 1000);
  const carga = b64u(new TextEncoder().encode(JSON.stringify({v:1, aud:'admira-store', email, sub:'s', iat:now, exp:now + 600})));
  return '__Host-perimetro_session=' + carga + '.' + await hmac(env.PERIMETRO_SIGNING_KEY, 'perimetro:' + carga);
}
// La nube y la lista de acceso, de mentira: apunta lo que le llega a la nube.
function red(respuestaNube) {
  const vistos = [];
  const f = async (url, init = {}) => {
    if (String(url).startsWith(NUBE)) { vistos.push({url:String(url), init}); return respuestaNube(String(url), init); }
    return Response.json({ok:true, allowed:true, superuser:false});   // lista de acceso
  };
  f.vistos = vistos;
  return f;
}
const ESTADO = {ok:true, ahora:1, visto:1, enLinea:true, miniaturas:['1'],
  deseado:{escena:{modo:'secuencia'}, luz:null, revision:5, por:'alguien@example.com', at:1},
  informe:{maquina:'PC-COCINA', escena:{modo:'secuencia'}, audio:{suena:1, salidas:['Altavoces (Realtek)']}}};

test('mirar es público desde el gemelo: estado con CORS, sin correo ni salidas de audio, y sin sesión', async () => {
  const f = red(() => Response.json(ESTADO));
  const r = await onRequest(llamada('estado', {headers:{Origin:GEMELO}}), f);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), GEMELO);
  assert.equal(r.headers.get('vary'), 'Origin');
  assert.equal(r.headers.get('access-control-allow-credentials'), null);
  const d = await r.json();
  assert.equal(d.enLinea, true);
  assert.equal(d.deseado.por, undefined);
  assert.equal(d.deseado.revision, 5);
  assert.equal(d.informe.audio.salidas, undefined);
  assert.equal(d.informe.audio.suena, 1);
  assert.equal(f.vistos[0].url, NUBE + '/estado');
  assert.equal(f.vistos[0].init.headers['X-Usuario'], 'gemelo-publico');
  assert.equal(ESTADO.deseado.por, 'alguien@example.com', 'no toca el objeto original');
});

test('las miniaturas también se ven desde el gemelo, tal cual', async () => {
  const f = red(() => new Response(new Uint8Array([255, 216, 255]), {headers:{'content-type':'image/jpeg'}}));
  const r = await onRequest(llamada('miniatura/3.jpg', {headers:{Origin:'https://ainimation.studio'}}), f);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/jpeg');
  assert.equal(r.headers.get('access-control-allow-origin'), 'https://ainimation.studio');
  assert.equal(new Uint8Array(await r.arrayBuffer()).length, 3);
});

test('otra web no mira ni manda: sin CORS, y sin sesión no pasa del 401/403', async () => {
  const r = await onRequest(llamada('estado', {headers:{Origin:'https://evil.example'}}), sinRed);
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  const p = await onRequest(llamada('escena', {method:'POST', headers:{Origin:'https://evil.example'}, body:'{}'}), sinRed);
  assert.equal(p.status, 403);
  // Un pase válido no sirve desde otro origen.
  const {pase} = await crearPase(env, 'carlos@example.com');
  const q = await onRequest(llamada('escena', {method:'POST', headers:{Origin:'https://evil.example', Authorization:'Bearer ' + pase}, body:'{}'}), sinRed);
  assert.equal(q.status, 403);
  // Ni sin cabecera Origin (curl): sigue pidiendo la sesión.
  const s = await onRequest(llamada('estado'), sinRed);
  assert.equal(s.status, 401);
});

test('mandar desde el gemelo sin pase: 401 con la dirección del enlace, y no se llama a la nube', async () => {
  for (const auth of [undefined, 'Bearer gm_x.y', 'Bearer sc_' + 'a'.repeat(64)]) {
    const headers = {Origin:GEMELO, ...(auth ? {Authorization:auth} : {})};
    const r = await onRequest(llamada('luz', {method:'POST', headers, body:'{}'}), sinRed);
    assert.equal(r.status, 401);
    const d = await r.json();
    assert.equal(d.error, 'enlace_required');
    assert.equal(d.enlace, 'https://www.admira.store' + ENLACE_PATH + '?o=' + encodeURIComponent(GEMELO));
    assert.equal(r.headers.get('access-control-allow-origin'), GEMELO);
  }
});

test('mandar desde el gemelo con pase: llega a la nube con el correo del pase', async () => {
  const f = red(() => Response.json({ok:true, deseado:{revision:9}}));
  const {pase} = await crearPase(env, 'carlos@example.com');
  const r = await onRequest(llamada('escena', {method:'POST', headers:{Origin:GEMELO, Authorization:'Bearer ' + pase, 'Content-Type':'application/json'}, body:'{"modo":"identificar"}'}), f);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), GEMELO);
  assert.equal(f.vistos.length, 1);
  assert.equal(f.vistos[0].url, NUBE + '/escena');
  assert.equal(f.vistos[0].init.method, 'POST');
  assert.equal(f.vistos[0].init.body, '{"modo":"identificar"}');
  assert.equal(f.vistos[0].init.headers['X-Usuario'], 'carlos@example.com');
  assert.equal(f.vistos[0].init.headers['X-Proxy-Key'], env.SUPERCOMPUTER_PC_COCINA_PROXY_KEY);
});

test('el pase caduca, no admite retoques y no vale con otra clave', async () => {
  const ahora = 1_800_000_000;
  const {pase, exp} = await crearPase(env, 'carlos@example.com', ahora);
  assert.equal(exp, ahora + PASE_TTL);
  assert.deepEqual(await leerPase(pase, env, ahora + 10), {email:'carlos@example.com', exp});
  assert.equal(await leerPase(pase, env, ahora + PASE_TTL), null, 'caducado');
  assert.equal(await leerPase(pase, {...env, PERIMETRO_SIGNING_KEY:'x'.repeat(64)}, ahora + 10), null, 'otra clave');
  assert.equal(await leerPase(pase.slice(0, -2) + 'AA', env, ahora + 10), null, 'firma retocada');
  // Carga cambiada (otro correo) con la firma antigua.
  const otra = b64u(new TextEncoder().encode(JSON.stringify({v:1, aud:'gemelo:pc-cocina', email:'otro@example.com', iat:ahora, exp})));
  assert.equal(await leerPase('gm_' + otra + pase.slice(pase.lastIndexOf('.')), env, ahora + 10), null, 'carga retocada');
  // Una cookie de sesión del perímetro no es un pase.
  const cookie = (await cookieSesion('carlos@example.com')).split('=')[1];
  assert.equal(await leerPase('gm_' + cookie, env), null);
  for (const basura of ['', null, 'gm_', 'gm_.', 'x'.repeat(2000)]) assert.equal(await leerPase(basura, env), null);
});

test('preflight: solo para el gemelo y solo para lo que puede pedir', async () => {
  const pre = (ruta, origen, metodo) => onRequest(llamada(ruta, {method:'OPTIONS', headers:{Origin:origen, 'Access-Control-Request-Method':metodo}}), sinRed);
  const ok = await pre('escena', GEMELO, 'POST');
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('access-control-allow-origin'), GEMELO);
  assert.match(ok.headers.get('access-control-allow-headers'), /Authorization/);
  assert.equal((await pre('estado', GEMELO, 'GET')).status, 204);
  assert.equal((await pre('maquina', GEMELO, 'POST')).status, 403);
  assert.equal((await pre('enlace', GEMELO, 'GET')).status, 403);
  const mal = await pre('escena', 'https://evil.example', 'POST');
  assert.equal(mal.status, 403);
  assert.equal(mal.headers.get('access-control-allow-origin'), null);
});

test('enlace: sin sesión manda al login y vuelve al mismo enlace', async () => {
  const r = await onRequest(llamada('enlace?o=' + encodeURIComponent(GEMELO)), sinRed);
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), '/auth/login?return_to=' + encodeURIComponent(ENLACE_PATH + '?o=' + encodeURIComponent(GEMELO)));
});

test('enlace: solo entrega el pase a los orígenes del gemelo', async () => {
  for (const o of ['https://evil.example', '', 'https://www.ainimation.studio.evil.example', 'null']) {
    const r = await onRequest(llamada('enlace?o=' + encodeURIComponent(o), {headers:{Cookie:await cookieSesion('carlos-origen@example.com')}}), red(() => Response.json({})));
    assert.equal(r.status, 403, o);
  }
  assert.deepEqual(ORIGENES_GEMELO, ['https://www.ainimation.studio', 'https://ainimation.studio']);
});

test('enlace: con sesión entrega un pase válido por postMessage solo al origen del gemelo', async () => {
  const r = await onRequest(llamada('enlace?o=' + encodeURIComponent(GEMELO), {headers:{Cookie:await cookieSesion('carlos-enlace@example.com')}}), red(() => Response.json({})));
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /frame-ancestors 'none'/);
  const nonce = /script-src 'nonce-([^']+)'/.exec(csp)[1];
  const html = await r.text();
  assert.ok(html.includes(`<script nonce="${nonce}">`));
  assert.ok(html.includes('window.opener.postMessage(d.mensaje,d.origen)'));
  const datos = JSON.parse(/const d=(\{.*?\}),m=/s.exec(html)[1]);
  assert.equal(datos.origen, GEMELO);
  assert.equal(datos.mensaje.type, 'admira:supercomputer:pase');
  assert.equal(datos.mensaje.email, 'carlos-enlace@example.com');
  assert.deepEqual(await leerPase(datos.mensaje.pase, env), {email:'carlos-enlace@example.com', exp:datos.mensaje.exp});
});

test('enlace: solo GET; y el método que no toca sigue fuera', async () => {
  assert.equal((await onRequest(llamada('enlace?o=' + encodeURIComponent(GEMELO), {method:'POST', body:'{}'}), sinRed)).status, 405);
  assert.equal((await onRequest(llamada('estado', {method:'DELETE', headers:{Origin:GEMELO}}), sinRed)).status, 405);
  assert.equal((await onRequest(llamada('maquina', {headers:{Origin:GEMELO}}), sinRed)).status, 405);
  assert.equal((await onRequest(llamada('otra-cosa', {headers:{Origin:GEMELO}}), sinRed)).status, 404);
});

test('la propia web sigue igual: con sesión, estado completo (con «por») y POST con su origen', async () => {
  const f = red(() => Response.json(ESTADO));
  const Cookie = await cookieSesion('carlos-web@example.com');
  const r = await onRequest(llamada('estado', {headers:{Cookie}}), f);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).deseado.por, 'alguien@example.com');
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  const p = await onRequest(llamada('luz', {method:'POST', headers:{Cookie, Origin:'https://www.admira.store'}, body:'{}'}), f);
  assert.equal(p.status, 200);
  assert.equal(f.vistos.at(-1).init.headers['X-Usuario'], 'carlos-web@example.com');
});

test('estadoPublico aguanta formas raras', () => {
  assert.equal(estadoPublico(null), null);
  assert.deepEqual(estadoPublico({ok:true, deseado:null, informe:null}), {ok:true, deseado:null, informe:null});
  assert.deepEqual(estadoPublico({informe:{audio:null}}), {informe:{audio:null}});
});
