// Señal de REPOSO del Stream Deck XL (Carlos, 10-nov-2026): el deck en salvapantallas con la playlist
// admira-tv-streamdeck se ve en el gemelo como «REPOSO · playlist» y la pieza en emisión.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {leerReposo, normalizarPieza, haceCuanto, REPOSO_CADUCA_MS} from '../objeto/stream-deck/reposo.mjs';
import {onRequest, validarReposo} from '../functions/objeto/stream-deck/api/[[path]].js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'objeto/stream-deck/index.html'), 'utf8');
const doc = readFileSync(join(root, 'admira-xp/docs/objeto-stream-deck.md'), 'utf8');

const AHORA = 1794300123456;
const pieza = {id: '1791993523684-fts4hw', title: 'INST · Paseo Morning Roast A', sub: 'Admira Studio · Suno', seconds: 248,
  index: 0, total: 5, poster: 'https://stock.admira.store/stock/1791993523684-fts4hw/poster.jpg', desde: AHORA - 60000};
const estado = (reposo, extra = {}) => ({ok: true, ahora: AHORA, enLinea: true, visto: AHORA - 1000, reposo, ...extra});
const senal = (r = {}) => ({estado: 'reposo', desde: AHORA - 240000, ts: AHORA - 2000, fuente: 'elgato-screensaver',
  playlist: {screen: 'admira-tv-streamdeck', name: 'admira.tv StreamDeck', rev: 1794218481515, total: 5}, pieza, ...r});

test('sin señal de reposo el gemelo sigue como hoy (retrocompatible)', () => {
  assert.equal(leerReposo(estado(undefined)), null);
  assert.equal(leerReposo(estado(null)), null);
  assert.equal(leerReposo({ok: true, ahora: AHORA, enLinea: true, visto: AHORA, keys: {}}), null);
  assert.equal(leerReposo(estado(senal({estado: 'activo'}))), null);
  assert.equal(leerReposo(null), null);
});

test('reposo en línea y reciente: playlist y pieza en emisión', () => {
  const r = leerReposo(estado(senal()));
  assert.ok(r);
  assert.equal(r.playlist.screen, 'admira-tv-streamdeck');
  assert.equal(r.playlist.total, 5);
  assert.equal(r.pieza.title, 'INST · Paseo Morning Roast A');
  assert.equal(r.pieza.index, 0);
  assert.match(r.pieza.poster, /^https:\/\/stock\.admira\.store\//);
  assert.equal(r.fuente, 'elgato-screensaver');
});

test('la señal caduca: puente fuera de línea o ts viejo no enseñan REPOSO', () => {
  assert.equal(leerReposo(estado(senal(), {enLinea: false})), null);
  assert.equal(leerReposo(estado(senal({ts: AHORA - REPOSO_CADUCA_MS - 1}))), null);
  // Sin ts propio vale el último latido del puente (visto).
  assert.ok(leerReposo(estado(senal({ts: undefined}))));
});

test('reposo sin pieza o con datos sucios no rompe el gemelo', () => {
  const r = leerReposo(estado(senal({pieza: null, playlist: undefined})));
  assert.equal(r.pieza, null);
  assert.equal(r.playlist.screen, 'admira-tv-streamdeck');
  assert.equal(normalizarPieza({id: 'x', poster: 'javascript:alert(1)'}).poster, '');
  assert.equal(normalizarPieza({id: 'x', poster: 'http://inseguro/p.jpg'}).poster, '');
  assert.equal(normalizarPieza({}), null);
  assert.equal(normalizarPieza({title: 'a'.repeat(500)}).title.length, 120);
  assert.equal(haceCuanto(AHORA - 240000, AHORA), 'hace 4 min');
});

test('la API valida la forma de la señal y deja pasar el cuerpo de siempre', async () => {
  assert.equal(validarReposo(JSON.stringify({serial: 'CL37J1A02733', at: 1})), null);
  assert.equal(validarReposo(JSON.stringify({reposo: null})), null);
  assert.equal(validarReposo(JSON.stringify({reposo: senal()})), null);
  assert.equal(validarReposo(JSON.stringify({reposo: {estado: 'activo'}})), null);
  assert.equal(validarReposo(JSON.stringify({reposo: {estado: 'dormido'}})), 'reposo_estado');
  assert.equal(validarReposo(JSON.stringify({reposo: 'reposo'})), 'reposo');
  assert.equal(validarReposo(JSON.stringify({reposo: {estado: 'reposo', pieza: 'x'}})), 'reposo_pieza');
  assert.equal(validarReposo('no-json'), null);
  const env = {SUPERCOMPUTER_PROXY_KEY: 'p'.repeat(40)};
  const auth = 'Bearer sc_' + 'a'.repeat(64);
  const post = (body) => ({request: new Request('https://www.admira.store/objeto/stream-deck/api/face', {method: 'POST', headers: {Authorization: auth}, body: JSON.stringify(body)}), env, params: {path: ['face']}});
  const mala = await onRequest(post({serial: 'x', reposo: {estado: 'dormido'}}), async () => { throw new Error('no debe llegar a la nube'); });
  assert.equal(mala.status, 400);
  let enviado;
  const buena = await onRequest(post({serial: 'x', reposo: senal()}), async (u, init) => { enviado = JSON.parse(init.body); return Response.json({ok: true}); });
  assert.equal(buena.status, 200);
  assert.equal(enviado.reposo.estado, 'reposo');
  assert.equal(enviado.reposo.pieza.id, pieza.id);
});

test('el gemelo pinta REPOSO · playlist y la pieza; la doc trae el contrato', () => {
  assert.match(html, /from "\.\/reposo\.mjs\?v=\d+"/);
  assert.match(html, /leerReposo\(st\)/);
  assert.match(html, /'REPOSO · playlist'/);
  assert.match(html, /id="reposoCard"/);
  assert.match(html, /id="reposoInfo"/);
  assert.match(doc, /## Señal de reposo/);
  assert.match(doc, /## Rest signal/);
  assert.match(doc, /"estado": "reposo"/);
  assert.match(doc, /admira-tv-streamdeck/);
  assert.match(doc, /reposo\.json/);
});
