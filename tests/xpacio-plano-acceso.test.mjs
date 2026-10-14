// Planos de Xpacio y espejo de admira.tv detrás de la sesión del perímetro (DCL-6ae9d5b0e2d48ee2fd9c7b19).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as plano } from '../functions/data/xpacios/[id].js';
import { onRequestGet as senal, senalLimpia, SIGNAGE_NOW } from '../functions/xpacios/senal.js';

const env = { PERIMETRO_SIGNING_KEY: 'k'.repeat(64), WHITELIST_SITE_TOKEN: 't'.repeat(64) };
const PUBLICO = JSON.parse(readFileSync(new URL('../data/xpacios/lab-gran-de-gracia-51.json', import.meta.url), 'utf8'));
const COMPLETO = { ...PUBLICO, direccion: 'Calle de Prueba 1 · 08000 Barcelona', pantallas: PUBLICO.pantallas.map((s, i) => ({ ...s, itil: `TEST-PAN-0${i + 1}`, screenId: `prueba-pantalla-${i}` })) };
delete COMPLETO.publico;

async function cookie(email, aud = 'admira-store') {
  const b64 = s => Buffer.from(s).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = b64(JSON.stringify({ v: 1, aud, email, sub: '1', iat: now, exp: now + 3600 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.PERIMETRO_SIGNING_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('perimetro:' + payload))).toString('base64url');
  return `__Host-perimetro_session=${payload}.${sig}`;
}
const lista = (extra = async () => { throw new Error('sin red'); }) => async (url, opts) => {
  const u = new URL(url);
  if (u.pathname === '/access') { const email = u.searchParams.get('email'); return Response.json({ ok: true, allowed: email === 'csilva@admira.com', superuser: email === 'csilva@admira.com' }); }
  return extra(url, opts);
};
const ctx = (path, headers = {}, cuerpo = COMPLETO, status = 200) => ({
  request: new Request('https://www.admira.store' + path, { headers }), env, params: { id: path.split('/').pop() },
  next: async () => (status === 200 ? Response.json(cuerpo) : new Response('no', { status })),
});

test('without a session /data/xpacios/<id>.json answers the public plan, never cached for others', async () => {
  const r = await plano(ctx('/data/xpacios/lab-gran-de-gracia-51.json'), lista());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-xpacio-acceso'), 'publico');
  assert.equal(r.headers.get('cache-control'), 'private, no-store');
  assert.equal(r.headers.get('vary'), 'Cookie');
  const j = await r.json();
  assert.equal(j.publico, true);
  assert.ok(!JSON.stringify(j).includes('TEST-PAN') && !JSON.stringify(j).includes('prueba-pantalla'));
  const falsa = await plano(ctx('/data/xpacios/lab-gran-de-gracia-51.json', { Cookie: '__Host-perimetro_session=eyJ2IjoxfQ.firmafalsa' }), lista());
  assert.equal((await falsa.json()).publico, true, 'a forged cookie is no session');
  const otraWeb = await plano(ctx('/data/xpacios/lab-gran-de-gracia-51.json', { Cookie: await cookie('csilva@admira.com', 'xpaceos') }), lista());
  assert.equal((await otraWeb.json()).publico, true, 'a session of another site is no session here');
});

test('with a session of this site the full plan goes through; bad ids and missing plans are not invented', async () => {
  const r = await plano(ctx('/data/xpacios/lab-gran-de-gracia-51.json', { Cookie: await cookie('csilva@admira.com') }), lista());
  assert.equal(r.headers.get('x-xpacio-acceso'), 'sesion');
  assert.equal((await r.json()).pantallas[0].itil, 'TEST-PAN-01');
  assert.equal((await plano(ctx('/data/xpacios/..%2Fsecreto.json'), lista())).status, 404);
  assert.equal((await plano(ctx('/data/xpacios/no-existe.json', {}, null, 404), lista())).status, 404);
});

test('/xpacios/senal needs a session and returns only the asset on air, without IP, device or health', async () => {
  const sinSesion = await senal({ request: new Request('https://www.admira.store/xpacios/senal?screen=prueba-pantalla-0'), env }, lista());
  assert.equal(sinSesion.status, 401);
  const pedidas = [];
  const upstream = async url => { pedidas.push(url); return Response.json({ ok: true, screen: 'prueba-pantalla-0', ip: '203.0.113.9', producer: 'p-1', device: { hardware: { cores: 8 } }, health: { stalls: 1 }, lastSeen: 1700000000000, standby: false,
    item: { id: 'a1', url: 'https://api.admira.store/stock/asset/a1', type: 'video', name: 'Pieza', ts: 1700000000000, startedAt: 1699999990000, dur: 15, aud: { faces: 2 } } }); };
  const conSesion = { Cookie: await cookie('csilva@admira.com') };
  const r = await senal({ request: new Request('https://www.admira.store/xpacios/senal?screen=prueba-pantalla-0', { headers: conSesion }), env }, lista(upstream));
  assert.equal(r.status, 200);
  assert.deepEqual(pedidas, [`${SIGNAGE_NOW}?screen=prueba-pantalla-0`]);
  const j = await r.json();
  assert.deepEqual(Object.keys(j).sort(), ['item', 'lastSeen', 'screen', 'standby']);
  assert.deepEqual(Object.keys(j.item).sort(), ['dur', 'id', 'name', 'startedAt', 'ts', 'type', 'url']);
  assert.ok(!JSON.stringify(j).includes('203.0.113.9'));
  const mala = await senal({ request: new Request('https://www.admira.store/xpacios/senal?screen=../x', { headers: conSesion }), env }, lista(upstream));
  assert.equal(mala.status, 400);
  assert.equal(senalLimpia('s', { item: { url: 'javascript:alert(1)' } }).item, null);
  assert.equal(senalLimpia('s', null).item, null);
});
