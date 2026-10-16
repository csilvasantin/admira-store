// La puerta de Google Maps (Carlos, 15-oct-2026): «la selección del local desde Store nos tiene que llevar a la
// puerta de Google Maps y si pulsamos en la puerta entramos en el gemelo digital». Primero Paseo de Gràcia 103.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { puertaDe, siguienteSeguro, urlPuerta, conPuerta, proyectar, quadWarp, enlaceMaps, PAGINA_PUERTA } from '../assets/puertas.mjs';

const leer = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const datos = JSON.parse(leer('data/puertas.json'));
const O = 'https://www.admira.store';

test('Paseo de Gràcia 103 tiene puerta: local demo-starbucks, loc alsea-sbux-021, dirección y fachada calibrada', () => {
  const p = puertaDe(datos.puertas, { venue: 'demo-starbucks' });
  assert.equal(p, puertaDe(datos.puertas, { loc: 'alsea-sbux-021' }));
  assert.match(p.direccion, /Passeig de Gràcia 103/);
  assert.equal(p.entrada.pano, 'bNZ9QjiL55gYQ2iyOhSqMw');
  assert.equal(p.puerta.esquinas.length, 4);
  assert.notEqual(puertaDe(datos.puertas, { venue: 'starbucks-diagonal-634' }), p, 'Diagonal tiene la suya (16-oct-2026)');
});

test('la fachada cae donde la pinta admira.tv (DoohSurfaces.project, POV 218,70/5,17, zoom 1,167, 1512 × 917)', () => {
  const p = puertaDe(datos.puertas, { venue: 'demo-starbucks' });
  // Lo que da admira-tv/adcelerate/demo/js/dooh-surfaces.js con las mismas esquinas (comprobado el 15-oct-2026).
  const esperado = [[684.1, 442.3], [1065.9, 447.6], [1065.9, 604.9], [684.1, 608.6]];
  p.puerta.esquinas.forEach(([h, i], n) => {
    const [x, y] = proyectar(h, i, { heading: 218.70, pitch: 5.17 }, 1.167, 1512, 917);
    assert.ok(Math.abs(x - esperado[n][0]) < 0.1 && Math.abs(y - esperado[n][1]) < 0.1, `esquina ${n}: ${x.toFixed(1)},${y.toFixed(1)}`);
  });
  assert.equal(proyectar(40, 0, { heading: 223, pitch: 3 }, 1.6, 1000, 600), null, 'detrás de la cámara no se pinta');
  assert.match(quadWarp(200, 80, [[0, 0], [200, 0], [200, 80], [0, 80]]), /^matrix3d\(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1\)$/);
});

test('la puerta sólo lleva al gemelo de este dominio', () => {
  assert.equal(siguienteSeguro('/admira-xp/?loc=alsea-sbux-021&quality=matrix', O), '/admira-xp/?loc=alsea-sbux-021&quality=matrix');
  assert.equal(siguienteSeguro('/xpacios/starbucks-centros/?centro=d634', O), '/xpacios/starbucks-centros/?centro=d634');
  for (const malo of ['https://evil.example/admira-xp/', 'javascript:alert(1)', PAGINA_PUERTA + '?venue=x', '/auth/login', '//evil.example/admira-xp/'])
    assert.equal(siguienteSeguro(malo, O), null, malo);
});

test('elegir Paseo de Gràcia 103 en un combo lleva antes a su calle; los locales sin puerta, directos', async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => datos });
  const gemelo = O + '/admira-xp/?autostart=cafeteria&loc=alsea-sbux-021&project=starbucks&quality=matrix&circuit=alsea_starbucks&venue=demo-starbucks';
  const a = await conPuerta({ id: 'demo-starbucks' }, gemelo, { fetchImpl, origen: O });
  const u = new URL(a, O);
  assert.equal(u.pathname, PAGINA_PUERTA);
  assert.equal(u.searchParams.get('venue'), 'demo-starbucks');
  assert.equal(new URL(u.searchParams.get('next'), O).searchParams.get('quality'), 'matrix', 'la calidad elegida llega al gemelo');
  // Diagonal 634 y Gran de Gràcia 51 también tienen puerta (16-oct-2026); un local sin ella va directo.
  const d634 = O + '/xpacios/starbucks-centros/?loc=starbucks-diagonal-634&quality=matrix';
  const b = new URL(await conPuerta({ id: 'starbucks-diagonal-634' }, d634, { fetchImpl, origen: O }), O);
  assert.equal(b.pathname, PAGINA_PUERTA); assert.equal(b.searchParams.get('venue'), 'starbucks-diagonal-634');
  assert.equal(b.searchParams.get('next'), '/xpacios/starbucks-centros/?loc=starbucks-diagonal-634&quality=matrix', 'y la puerta lleva a su gemelo');
  const gdg = O + '/xpacios/gran-de-gracia-51/?loc=lab-gran-de-gracia-51';
  const c = new URL(await conPuerta({ id: 'lab-gran-de-gracia-51' }, gdg, { fetchImpl, origen: O }), O);
  assert.equal(c.pathname, PAGINA_PUERTA); assert.equal(c.searchParams.get('venue'), 'lab-gran-de-gracia-51');
  assert.equal(c.searchParams.get('next'), '/xpacios/gran-de-gracia-51/?loc=lab-gran-de-gracia-51', 'y la puerta lleva al laboratorio');
  const sin = O + '/xpacios/altadis-18/?loc=local-sin-puerta';
  assert.equal(await conPuerta({ id: 'local-sin-puerta' }, sin, { fetchImpl, origen: O }), sin);
  assert.equal(urlPuerta('demo-starbucks', '/admira-xp/?x=1', 'en'), '/xpacios/puerta/?venue=demo-starbucks&next=%2Fadmira-xp%2F%3Fx%3D1&lang=en');
});

test('la página de la puerta: clave de Maps desde admira.tv (no copiada aquí), combos, fachada y salida sin Maps', () => {
  const html = leer('xpacios/puerta/index.html'), js = leer('xpacios/puerta/puerta.mjs');
  assert.match(html, /<script src="https:\/\/admira\.tv\/adcelerate\/demo\/js\/maps-clave\.js\?v=[^"]+"><\/script>/);
  assert.doesNotMatch(html + js, /AIza[0-9A-Za-z_-]{20,}/, 'ninguna clave de Google en este repo');
  assert.match(js, /montarCombos\(\{/);
  assert.match(js, /window\.gm_authFailure = \(\) => sinMaps/);
  assert.match(js, /enlacePuerta\.className = 'puerta-local'/);
  assert.match(enlaceMaps({ pano: 'P', pov: { heading: 223, pitch: 3 } }), /^https:\/\/www\.google\.com\/maps\/@\?api=1&map_action=pano&pano=P&heading=223&pitch=3$/);
  assert.match(leer('admira-xp/scripts/project-selector.mjs'), /location\.assign\(await conPuerta\(venue,href\)\)/);
  assert.match(leer('assets/xpace-combos.mjs'), /location\.assign\(await conPuerta\(v, href\)\)/);
});

test('Diagonal 634 tiene puerta: su calle en Street View y la fachada de Alta Diagonal calibrada con la misma proyección', () => {
  const p = datos.puertas.find(x => x.locales.includes('starbucks-diagonal-634'));
  assert.ok(p, 'puerta de Diagonal');
  assert.equal(p.direccion, 'Avinguda Diagonal 634 · 08017 Barcelona');
  assert.equal(p.entrada.pano, 'gFiiBKarazJa69Mjl_uFtg'); assert.equal(p.puerta.pano, p.entrada.pano);
  assert.equal(p.puerta.esquinas.length, 4);
  // Con el POV de la calibración (336/6, zoom 1, calle de 1265 × 750) las esquinas caen en el escaparate marcado.
  const marcado = [[373.1, 352.1], [795.5, 342.5], [795.5, 488.4], [373.1, 498.0]];
  p.puerta.esquinas.forEach(([h, i], n) => {
    const [x, y] = proyectar(h, i, { heading: 336, pitch: 6 }, 1, 1265, 750);
    assert.ok(Math.abs(x - marcado[n][0]) < 0.5 && Math.abs(y - marcado[n][1]) < 0.5, `esquina ${n}`);
  });
});

test('Gran de Gràcia 51 tiene puerta: el portal del número 51, calibrado con la misma proyección', () => {
  const p = puertaDe(datos.puertas, { venue: 'lab-gran-de-gracia-51' });
  assert.ok(p, 'puerta del laboratorio');
  assert.equal(p, puertaDe(datos.puertas, { loc: 'lab-gran-de-gracia-51' }));
  assert.equal(p.direccion, 'Carrer Gran de Gràcia 51 · 08012 Barcelona');
  assert.equal(p.entrada.pano, 'Gmb3bqHoEMTDO-Dqp6CkNA'); assert.equal(p.puerta.pano, p.entrada.pano);
  assert.equal(p.puerta.esquinas.length, 4);
  // Con el POV de la calibración (237/8, zoom 1, calle de 1265 × 750) las esquinas caen en el portal marcado.
  const marcado = [[480, 287], [633, 287], [633, 612], [472, 614]];
  p.puerta.esquinas.forEach(([h, i], n) => {
    const [x, y] = proyectar(h, i, { heading: 237, pitch: 8 }, 1, 1265, 750);
    assert.ok(Math.abs(x - marcado[n][0]) < 0.5 && Math.abs(y - marcado[n][1]) < 0.5, `esquina ${n}`);
  });
  assert.ok(proyectar(...p.puerta.esquinas[0], p.entrada.pov, p.entrada.pov.zoom, 1265, 750), 'la entrada mira al portal');
});
