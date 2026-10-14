// Espejo de admira.tv en el gemelo (DCL-6ae9d5b0e2d48ee2fd9c7b19): leer lo que emite una pantalla real
// sin emitir nunca en su nombre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoSenal, urlAdmiraTv, FRESCURA_MS, REFRESCO_MS, ADMIRA_TV } from './espejo.mjs';

const CAPTURA = 'https://admira.studio/assets/demos/starbucks-six/captures-r2/starbucks-six-r2-frame-macmini-starbucks-vertical.jpg';
const AHORA = 1_800_000_000_000;

test('a fresh /signage/now item is mirrored live; anything else falls back to the r2 capture and says why', () => {
  const vivo = estadoSenal({ item: { id: 'a1', url: 'https://api.admira.store/stock/asset/a1', type: 'video', name: 'Frappuccino', ts: AHORA - 5000, startedAt: AHORA - 9000 } }, { ahora: AHORA, captura: CAPTURA });
  assert.deepEqual([vivo.fuente, vivo.tipo, vivo.url, vivo.startedAt], ['vivo', 'video', 'https://api.admira.store/stock/asset/a1', AHORA - 9000]);
  assert.match(vivo.rotulo, /^en vivo · Frappuccino/);
  assert.equal(estadoSenal({ item: { url: 'https://x.test/i.jpg', type: 'image', ts: AHORA } }, { ahora: AHORA }).tipo, 'imagen');
  const casos = [
    [null, /sin conexión/], [{ item: null }, /^sin señal/], [{ standby: true, item: { url: 'https://x.test/a.mp4', ts: AHORA } }, /standby/],
    [{ item: { url: 'https://x.test/a.mp4', type: 'video', ts: AHORA - FRESCURA_MS - 1 } }, /sin señal reciente/],
    [{ item: { url: 'https://x.test/a.mp3', type: 'audio', ts: AHORA } }, /audio/], [{ item: { url: 'http://x.test/a.jpg', ts: AHORA } }, /no reproducible/],
    [{ item: { url: 'javascript:alert(1)', ts: AHORA } }, /no reproducible/],
  ];
  for (const [resp, motivo] of casos) {
    const e = estadoSenal(resp, { ahora: AHORA, captura: CAPTURA });
    assert.equal(e.fuente, 'captura', JSON.stringify(resp));
    assert.equal(e.url, CAPTURA);
    assert.match(e.motivo, motivo);
    assert.match(e.rotulo, /captura del 13-oct$/);
  }
  assert.equal(estadoSenal(null, { ahora: AHORA }).fuente, 'nada', 'no capture: nothing to show, but it is said');
  assert.ok(REFRESCO_MS >= 15000, 'moderate refresh');
});

test('admira.tv links never carry a real screen: the home page, or the canal of a registered virtual player', () => {
  for (const real of ['macmini-starbucks-vertical', 'macstudio-starbucks-horizontal-right', '', undefined]) {
    const r = urlAdmiraTv({ screenId: real, playerVirtual: undefined });
    assert.deepEqual(r, { url: ADMIRA_TV, canal: false });
  }
  for (const malo of ['macmini-starbucks-vertical', 'virtual-', 'virtual-../x', 'virtual-a?machine=mbp', 'xvirtual-gdg51-v1', 'VIRTUAL-GDG51-V1']) {
    assert.equal(urlAdmiraTv({ screenId: 'macmini-starbucks-vertical', playerVirtual: malo }).url, ADMIRA_TV, malo);
  }
  const v = urlAdmiraTv({ screenId: 'macmini-starbucks-vertical', playerVirtual: 'virtual-gdg51-mini-v1' });
  assert.equal(v.canal, true);
  const u = new URL(v.url);
  assert.equal(u.origin + u.pathname, 'https://admira.tv/canal.html');
  assert.equal(u.searchParams.get('screen'), 'virtual-gdg51-mini-v1');
  assert.equal(u.searchParams.get('playerType'), 'virtual');
  assert.equal(u.searchParams.has('machine'), false);
  assert.equal(u.searchParams.has('rundown'), false);
  assert.ok(!v.url.includes('starbucks'), 'the real screenId never reaches the URL');
});
