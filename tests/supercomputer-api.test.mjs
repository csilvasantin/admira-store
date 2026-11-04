// API del gemelo de la Supercomputer (functions/supercomputer/api/[[path]].js): quién puede qué.
import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest, destinoGemelo, NUBE} from '../functions/supercomputer/api/[[path]].js';

const CLAVE = 'sc_' + 'a'.repeat(64);
const env = {PERIMETRO_SIGNING_KEY:'k'.repeat(64), SUPERCOMPUTER_PROXY_KEY:'p'.repeat(40)};
const llamada = (ruta, init = {}) => ({request:new Request('https://www.admira.store/supercomputer/api/' + ruta, init), env, params:{path:ruta.split('/')}});
const sinRed = async () => { throw new Error('sin red en el test'); };

test('el gemelo solo pide estado, miniaturas, escena y luz', () => {
  assert.equal(destinoGemelo('GET', 'estado'), '/estado');
  assert.equal(destinoGemelo('GET', 'miniatura/3.jpg'), '/miniatura/3.jpg');
  assert.equal(destinoGemelo('POST', 'escena'), '/escena');
  assert.equal(destinoGemelo('POST', 'luz'), '/luz');
  for (const [m, r] of [['GET', 'escena'], ['POST', 'estado'], ['GET', 'miniatura/0.jpg'], ['GET', 'miniatura/../x'], ['POST', 'maquina']]) {
    assert.equal(destinoGemelo(m, r), null, `${m} ${r}`);
  }
});

test('sin sesión, el gemelo recibe 401 con el login de la Supercomputer y no se llama a la nube', async () => {
  const r = await onRequest(llamada('estado'), sinRed);
  assert.equal(r.status, 401);
  assert.equal((await r.json()).login, '/auth/login?return_to=%2Fsupercomputer%2F');
});

test('un POST de otra web se rechaza antes de mirar la sesión', async () => {
  const r = await onRequest(llamada('escena', {method:'POST', headers:{Origin:'https://evil.example'}, body:'{}'}), sinRed);
  assert.equal(r.status, 403);
});

test('la máquina entra con su clave Bearer y su informe llega tal cual a la nube', async () => {
  let visto = null;
  const nube = async (url, init) => { visto = {url, init}; return Response.json({ok:true, deseado:null}); };
  const r = await onRequest(llamada('maquina', {method:'POST', headers:{Authorization:'Bearer ' + CLAVE}, body:'{"informe":{}}'}), nube);
  assert.equal(r.status, 200);
  assert.equal(visto.url, NUBE + '/maquina');
  assert.equal(visto.init.headers.Authorization, 'Bearer ' + CLAVE);
  assert.equal(visto.init.body, '{"informe":{}}');
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('la máquina sin clave, con otra forma de clave o con GET, no pasa', async () => {
  assert.equal((await onRequest(llamada('maquina', {method:'POST', body:'{}'}), sinRed)).status, 401);
  assert.equal((await onRequest(llamada('maquina', {method:'POST', headers:{Authorization:'Bearer mbl_x'}, body:'{}'}), sinRed)).status, 401);
  assert.equal((await onRequest(llamada('maquina'), sinRed)).status, 405);
});

test('si la nube no responde, 502 y no se cuelga', async () => {
  const r = await onRequest(llamada('maquina', {method:'POST', headers:{Authorization:'Bearer ' + CLAVE}, body:'{}'}), sinRed);
  assert.equal(r.status, 502);
});
