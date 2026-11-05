// Puente EN VIVO del Stream Deck: functions/objeto/stream-deck/api/[[path]].js
import test from 'node:test';
import assert from 'node:assert/strict';
import {onRequest, destinoStreamDeck} from '../functions/objeto/stream-deck/api/[[path]].js';

const env = {SUPERCOMPUTER_PROXY_KEY:'p'.repeat(40)};
const llamada = (ruta, init = {}) => ({request:new Request('https://www.admira.store/objeto/stream-deck/api/' + ruta, init), env, params:{path:ruta.split('/')}});

test('rutas del puente Stream Deck', () => {
  assert.equal(destinoStreamDeck('POST', 'face'), '/streamdeck');
  assert.equal(destinoStreamDeck('POST', 'maquina'), '/streamdeck');
  assert.equal(destinoStreamDeck('GET', 'face.png'), '/streamdeck/face.png');
  assert.equal(destinoStreamDeck('GET', 'estado'), '/streamdeck/estado');
  for (const [m, r] of [['GET', 'face'], ['POST', 'estado'], ['GET', '../estado'], ['POST', 'face.png']]) assert.equal(destinoStreamDeck(m, r), null);
});

test('POST sin Bearer sc_ no llega a la nube', async () => {
  const r = await onRequest(llamada('face', {method:'POST', body:'{}'}), async () => { throw new Error('no'); });
  assert.equal(r.status, 401);
});

test('GET face.png es público y firma con la clave de proxy en el servidor', async () => {
  let visto;
  const r = await onRequest(llamada('face.png'), async (u, init) => { visto = {u, init}; return new Response('png', {headers:{'content-type':'image/png', etag:'"x"'}}); });
  assert.equal(r.status, 200);
  assert.match(visto.u, /\/streamdeck\/face\.png$/);
  assert.equal(visto.init.headers['X-Proxy-Key'], env.SUPERCOMPUTER_PROXY_KEY);
  assert.equal(r.headers.get('etag'), '"x"');
});
