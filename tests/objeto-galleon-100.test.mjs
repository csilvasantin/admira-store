// Gemelo Objeto · Corsair Galleon 100 SD: señal real por defecto y estado del teclado físico (encargo #7569, Neo, 13-nov-2026)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'objeto/galleon-100/index.html'), 'utf8');
const twin = readFileSync(join(root, 'objeto/galleon-100/twin.mjs'), 'utf8');
const playlist = readFileSync(join(root, 'objeto/galleon-100/playlist.mjs'), 'utf8');
const xpace = readFileSync(join(root, 'assets/objeto-xpace.mjs'), 'utf8');

test('Objeto Xpace apunta al gemelo Galleon y la página carga la señal del player de Admira TV', () => {
  assert.match(xpace, /id: 'galleon-100'/);
  assert.match(html, /src="https:\/\/admira\.tv\/galleon\.html"/);
  assert.match(html, /src="https:\/\/admira\.tv\/mando\?embed=galleon&amp;screen=corsair-galleon-100"/);
  assert.match(html, /<p id="physical" role="status">/);
  assert.match(html, /<label>Señal <select id="playlist"><\/select><\/label>/);
});

test('por defecto el gemelo enseña la señal real (la misma que el teclado) y la playlist de prueba es opcional', () => {
  assert.match(playlist, /export const LIVE = 'live'/);
  assert.match(playlist, /let entries = initial\.slice\(\), current = -1/);
  assert.match(playlist, /if \(current < 0\) feed\.contentWindow\?\.postMessage\(\{ type: 'admira:galleon:live' \}, origin\)/);
  assert.match(playlist, /new Option\('Señal real del player \(lo mismo que el teclado\)', LIVE\)/);
  assert.match(playlist, /picker\.value === LIVE \? live\(\) : select\(Number\(picker\.value\)\)/);
});

test('el gemelo cuenta la fuente en antena y el estado del teclado físico desde /signage/now, nunca desde sí mismo', () => {
  assert.match(twin, /https:\/\/api\.admira\.store\/signage\/now\?screen=corsair-galleon-100/);
  assert.match(twin, /Teclado físico: en antena/);
  assert.match(twin, /cediendo el USB/);
  assert.match(twin, /air\?\.source === 'twin' \? 'Playlist de prueba' : air\?\.source === 'playout' \? 'Playout de la flota' : 'Señal real del teclado'/);
  assert.match(twin, /landscape\.width !== 720 \|\| landscape\.height !== 384 \|\| portrait\.width !== 480 \|\| portrait\.height !== 640/);
});
