// Voz del tótem (7-oct-2026): el gemelo dice el «say» de Admingo/quiosco SOLO si viene de ainimation.studio y responde con acuse.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../admira-xp/scripts/totem-kiosko.js', import.meta.url), 'utf8');
function gemelo({ muted = false } = {}) {
  const listeners = {}, spoken = [], acks = [];
  const el = () => ({ style: {}, classList: { toggle() {}, add() {} }, appendChild() {}, addEventListener() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], innerHTML: '' });
  const w = {localStorage:{getItem:k=>k==='xpace:voz-admirito'?'navegador':null},
    addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); }, dispatchEvent() {},
    speechSynthesis: { getVoices: () => [{ lang: 'es-ES', name: 'Mónica' }, { lang: 'en-GB', name: 'Daniel' }], cancel() {}, speak: (u) => spoken.push(u) },
    SpeechSynthesisUtterance: function (t) { this.text = t; }, location: { search: '' }, setInterval() {}, setTimeout() {},
  };
  w.window = w;
  const doc = { readyState: 'loading', addEventListener() {}, createElement: el, getElementById: () => null, body: el(), head: el(), querySelector: () => null };
  const ctx = vm.createContext({ window: w, localStorage:w.localStorage, location:w.location, document: doc, homeMusicMuted: muted, showEv() {}, URLSearchParams, URL, CustomEvent: function () {}, Intl, console, setInterval() {}, setTimeout() {}, clearTimeout() {}, lang: 'es' });
  vm.runInContext(code, ctx);
  const send = (origin, data) => (listeners.message || []).forEach((f) => f({ origin, data, source: { postMessage: (m, o) => acks.push({ m, o }) } }));
  return { send, spoken, acks };
}

test('un say de www.ainimation.studio habla en es-ES y responde say-ack al mismo origen', () => {
  const g = gemelo();
  g.send('https://www.ainimation.studio', { source: 'admingo', type: 'say', id: 'say-1', text: '¡Gracias! Tu pedido es el A001', lang: 'es-ES' });
  assert.equal(g.spoken.length, 1); assert.equal(g.spoken[0].lang, 'es-ES'); assert.equal(g.spoken[0].voice.name, 'Mónica');
  assert.deepEqual(JSON.parse(JSON.stringify(g.acks[0])), { m: { source: 'xpaceos-totem', type: 'say-ack', id: 'say-1', spoken: true, via: 'speech-es-ES' }, o: 'https://www.ainimation.studio' });
});

test('otros orígenes se ignoran (sin voz y sin acuse: el quiosco usará su voz)', () => {
  const g = gemelo();
  for (const o of ['https://evil.example', 'https://ainimation.studio.evil.com', 'http://www.ainimation.studio'])
    g.send(o, { source: 'admingo', type: 'say', id: 'x', text: 'hola' });
  assert.equal(g.spoken.length, 0); assert.equal(g.acks.length, 0);
});

test('el quiosco también puede pedir voz; con el gemelo en silencio hay acuse pero no suena', () => {
  const g = gemelo({ muted: true });
  g.send('https://ainimation.studio', { source: 'ainimation-xperiencia', type: 'say', id: 'k1', text: 'A002', lang: 'es-ES' });
  assert.equal(g.spoken.length, 0); assert.equal(g.acks[0].m.via, 'muted'); assert.equal(g.acks[0].m.spoken, false);
});
