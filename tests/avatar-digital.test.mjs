import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {onRequest, sheetAnswer} from '../functions/avatar-ask.js';

const require = createRequire(import.meta.url);
const shell = require('../assets/xpace-shell.js');
const avatar = require('../assets/avatar-digital.js');

test('el shell reconoce el interruptor y /cli [good|better|best], no el resto de /cli', () => {
  assert.equal(shell.isAvatarCommand('/avatarDigital'), true);
  assert.equal(shell.isAvatarCommand('/digitalAvatar off'), true);
  assert.equal(shell.isAvatarCommand('avatarDigital on'), true);
  assert.equal(shell.isAvatarCommand('/cli ayudante'), true);
  assert.equal(shell.isAvatarCommand('/cli helper mostrar'), true);
  assert.equal(shell.isAvatarCommand('/CLI@bot ayudante'), true);
  assert.equal(shell.isAvatarCommand('/cli distribuir'), false);
  // Carlos (4-oct-2026): /cli solo dice el estado del avatar, como en admira.app (tool #33).
  assert.equal(shell.isAvatarCommand('/cli'), true);
  assert.equal(shell.isAvatarCommand('/cli good'), true);
  assert.equal(shell.isAvatarCommand('/cli best'), true);
  assert.equal(shell.isAvatarCommand('/cli good extra'), false);
  assert.equal(shell.isAvatarCommand('/status'), false);
  assert.equal(shell.isAvatarCommand(''), false);
  assert.equal(shell.isAvatarCommand('/avatar'), true);
  assert.equal(shell.isAvatarCommand('/avatar good'), true);
  assert.equal(shell.isAvatarCommand('/avatar better'), true);
  assert.equal(shell.isAvatarCommand('/avatar best'), true);
  assert.equal(shell.isAvatarCommand('/avatarON'), true);
  assert.equal(shell.isAvatarCommand('/avatarOFF'), true);
  assert.equal(shell.isAvatarCommand('/avatar quizas'), false);
});

test('on/off/alternar y la línea en el idioma de la página', () => {
  assert.equal(avatar.decide('/avatarDigital'), 'toggle');
  assert.equal(avatar.decide('/avatarDigital encender'), 'on');
  assert.equal(avatar.decide('/cli ayudante apagar'), 'off');
  assert.equal(avatar.decide('/digitalAvatar mostrar'), 'on');
  assert.equal(avatar.decide('/digitalAvatar ocultar'), 'off');
  assert.equal(avatar.decide('/avatarDigital quizas'), 'bad');
  assert.equal(avatar.decide('/marca on'), null);
  assert.equal(avatar.line('on', 'es'), 'Avatar digital activado');
  assert.equal(avatar.line('on', 'en'), 'Digital avatar on');
  assert.equal(avatar.line('off', 'en'), 'Digital avatar off');
  assert.equal(avatar.line('off', 'es'), 'Avatar digital desactivado');
});

test('sin cerebro se contesta con la ficha y no se inventa otra cosa', () => {
  assert.match(sheetAnswer('¿Qué es XpaceOS?', 'es'), /xpaceos\.com/);
  assert.match(sheetAnswer('What is Pixeria?', 'en'), /pixeria\.com/);
  assert.match(sheetAnswer('¿cuánto cuesta el plano premium?', 'es'), /no consta en la ficha/i);
});

test('el proxy devuelve solo texto: el audio del cerebro no sale', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ok: true, answer: 'XpaceOS es la tienda.', audioBase64: 'A'.repeat(80), mime: 'audio/mpeg'}),
  });
  const request = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: '¿Qué es XpaceOS?', lang: 'es'}),
  });
  const response = await onRequest({request}, fetchImpl);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.text, 'XpaceOS es la tienda.');
  assert.equal(JSON.stringify(body).includes('audioBase64'), false);
});

test('si el cerebro dice que no consta y la ficha sí lo tiene, manda la ficha', async () => {
  const fetchImpl = async () => ({ok: true, json: async () => ({answer: 'No consta en la ficha.', audioBase64: 'qq'})});
  const request = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: '¿Qué es XpaceOS?', lang: 'es'}),
  });
  const body = await (await onRequest({request}, fetchImpl)).json();
  assert.match(body.text, /xpaceos\.com/);
  assert.equal(JSON.stringify(body).includes('audioBase64'), false);
});

test('un saludo o «isn\'t in the sheet» no tapa la ficha', async () => {
  const greet = async () => ({ok: true, json: async () => ({answer: 'Entendido. Soy el avatar de AdmiraNeXT. Dime en qué te puedo ayudar.'})});
  const isnt = async () => ({ok: true, json: async () => ({answer: "I'm sorry, that information isn't in the sheet."})});
  const es = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: '¿Qué es Yokup?', lang: 'es'}),
  });
  const en = new Request('https://www.xpaceos.com/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: 'What is Store?', lang: 'en'}),
  });
  assert.match((await (await onRequest({request: es}, greet)).json()).text, /yokup\.com/i);
  assert.match((await (await onRequest({request: en}, isnt)).json()).text, /xpaceos\.com/i);
});

test('si el cerebro falla, queda la ficha', async () => {
  const request = new Request('https://preview.xpaceos.pages.dev/avatar-ask', {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify({question: 'yokup', lang: 'en'}),
  });
  const response = await onRequest({request}, async () => { throw new Error('red'); });
  const body = await response.json();
  assert.match(body.text, /yokup\.com/i);
  assert.equal('audioBase64' in body, false);
});

test('la ficha viaja en context y la pregunta llega entera al cerebro, sin voz', async () => {
  let sent = null;
  const fetchImpl = async (url, init) => { sent = JSON.parse(init.body); return {ok: true, json: async () => ({answer: 'Yokup (yokup.com) es la bandeja de la flota.'})}; };
  const question = '¿Qué es Yokup? ' + 'x'.repeat(300);
  const request = new Request('https://www.xpaceos.com/avatar-ask', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({question, lang: 'es'})});
  const body = await (await onRequest({request}, fetchImpl)).json();
  assert.equal(sent.question, question.trim());
  assert.ok(sent.context.length > 200 && sent.context.length <= 2000);
  assert.match(sent.context, /cuatro pilares/);
  assert.equal(sent.strict, true);
  assert.equal(sent.voice, false);
  assert.equal(sent.sector, 'generic');
  assert.equal('room' in sent, false);
  assert.match(body.text, /yokup/i);
});
