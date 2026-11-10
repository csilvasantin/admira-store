// Gemelo Objeto · Stream Deck (Carlos, 5-nov-2026)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'objeto/stream-deck/index.html'), 'utf8');
const xpace = readFileSync(join(root, 'assets/objeto-xpace.mjs'), 'utf8');
const selector = readFileSync(join(root, 'admira-xp/scripts/project-selector.mjs'), 'utf8');

test('Objeto Xpace apunta al gemelo Stream Deck', () => {
  assert.match(xpace, /OBJET_ID = 'objeto'/);
  assert.match(xpace, /id: 'stream-deck'/);
  assert.match(xpace, /url: '\/objeto\/stream-deck\/'/);
});

test('el gemelo Stream Deck es HUD 3D con serial AdmiraNeXT01 (antes METAHUMAN) e Indiana Jones', () => {
  assert.match(html, /CL37J1A02733/);
  assert.match(html, /Objeto · <span>Stream Deck<\/span>/);
  assert.match(html, /face-live\.png/);
  assert.match(html, /indiana-jones\.png/);
  assert.match(html, /three@0\.160\.0/);
  assert.match(html, /OrbitControls/);
  assert.match(html, /Cara desde foto AdmiraNeXT01/);
  assert.match(html, /EN VIVO · AdmiraNeXT01/);
  assert.doesNotMatch(html, /EN VIVO · METAHUMAN|<b>METAHUMAN<\/b>|· METAHUMAN ·/);
  assert.match(html, /\/objeto\/stream-deck\/api\/face\.png/);
  assert.match(html, /If-None-Match/);
  assert.match(html, /canonical" href="https:\/\/www\.admira\.store\/objeto\/stream-deck\/"/);
  assert.ok(existsSync(join(root, 'objeto/stream-deck/face-live.png')));
  assert.ok(existsSync(join(root, 'objeto/stream-deck/indiana-jones.png')));
  assert.ok(existsSync(join(root, 'objeto/stream-deck/metahuman-desk.jpg')));
  assert.ok(existsSync(join(root, 'objeto/stream-deck/perfil-metahuman.png')));
  assert.match(html, /RoundedBoxGeometry/);
  assert.match(html, /FACE_TILT\s*=\s*42/);
  assert.match(html, /perfil-metahuman\.png/);
  assert.match(html, /MeshBasicMaterial/);
  assert.match(html, /KEY_H\/2\+0\.001/);
});

test('el selector incrusta Objeto→Stream Deck sin salir del shell', () => {
  assert.match(selector, /OBJET_ID='objeto'/);
  assert.match(selector, /embedObjeto/);
  assert.match(selector, /objetoPane/);
  assert.match(selector, /\/objeto\/stream-deck\//);
});

test('el gemelo pinta la ficha de cada tecla que manda el puente (6-nov-2026)', () => {
  assert.match(html, /\/objeto\/stream-deck\/api\/estado/);
  assert.match(html, /keysMeta/);
  assert.match(html, /fichaTecla/);
  assert.match(html, /id="tip"/);
  assert.match(html, /id="perfilInfo"/);
  assert.match(html, /id="paginaInfo"/);
  assert.match(html, /id="vistoInfo"/);
  assert.match(html, /'profile\.openchild':'Carpeta'/);
  // La cara solo se baja cuando cambia el hash de la nube (el ETag es el hash entre comillas).
  assert.match(html, /'"'\+st\.hash\+'"'!==liveEtag/);
});
