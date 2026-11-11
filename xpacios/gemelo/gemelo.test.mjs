// Crea tu gemelo en 3 pasos (Neo, 11-nov-2026). Contrato: admira-xp/docs/gemelo-3-pasos.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {isPublicPath} from '../../functions/_perimetro.js';

const require = createRequire(import.meta.url);
const G = require('./gemelo.js');
const leer = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('el asistente son tres páginas separadas y un visor, todas públicas', () => {
  for (const [ruta, fichero] of [['/xpacios/gemelo/', 'index.html'], ['/xpacios/gemelo/1/', '1/index.html'], ['/xpacios/gemelo/2/', '2/index.html'], ['/xpacios/gemelo/3/', '3/index.html'], ['/xpacios/gemelo/ver/', 'ver/index.html']]) {
    assert.ok(isPublicPath(ruta), ruta + ' debe abrir sin sesión');
    const html = leer('./' + fichero);
    assert.match(html, /\/xpacios\/gemelo\/gemelo\.js\?v=/, fichero + ' carga la lógica común');
    assert.doesNotMatch(html, /href="#[a-z]/i, fichero + ': sin anclas internas');
  }
});

test('publicar pide sesión y vuelve al paso 3', () => {
  const p3 = leer('./3/index.html');
  assert.match(p3, /Gemelo\.sesion\(\)/);
  assert.match(p3, /\/auth\/login\?return_to=' \+ encodeURIComponent\('\/xpacios\/gemelo\/3\/'\)/);
});

test('normaliza descarta tipos desconocidos y encierra coordenadas, giro y textos', () => {
  const b = G.normaliza({nombre: '  Mi tienda  ', sector: 'nave', fondo: {tipo: 'foto', img: 'javascript:alert(1)'},
    items: [{t: 'pantalla', x: 2, y: -1, r: 100, n: 'x'.repeat(99)}, {t: 'misil', x: .5, y: .5}]});
  assert.equal(b.nombre, 'Mi tienda');
  assert.equal(b.sector, 'tienda');
  assert.equal(b.fondo.img, null);
  assert.equal(b.items.length, 1);
  assert.deepEqual([b.items[0].x, b.items[0].y, b.items[0].r, b.items[0].n.length], [1, 0, 90, 60]);
  assert.equal(G.normaliza({items: Array.from({length: 500}, () => ({t: 'mesa'}))}).items.length, G.MAX_ITEMS);
});

test('ids estables y validados; pasos bloqueados hasta tener nombre y elementos', () => {
  const id = G.nuevoId('Sneakers Santa Rosa 19', Date.UTC(2026, 10, 11));
  assert.match(id, G.ID_VALIDO);
  assert.ok(id.startsWith('gm-sneakers-santa-rosa-19-'));
  assert.equal(G.normaliza({id: '../../x'}).id, null);
  assert.equal(G.pasoListo(G.normaliza({}), 3), 1);
  assert.equal(G.pasoListo(G.normaliza({nombre: 'A'}), 3), 2);
  assert.equal(G.pasoListo(G.normaliza({nombre: 'A', items: [{t: 'mesa'}]}), 3), 3);
});

test('publicable no lleva la foto incrustada (va en su propia clave)', () => {
  const b = G.normaliza({nombre: 'A', fondo: {tipo: 'foto', img: 'data:image/jpeg;base64,AAAA', w: 4, h: 3}, items: [{t: 'pantalla'}]});
  const p = G.publicable(b);
  assert.equal(p.fondo.img, null);
  assert.equal(p.fondo.tipo, 'foto');
  assert.deepEqual(G.cuenta(b), {pantallas: 1, muebles: 0});
});

test('el índice de Xpacios ofrece el asistente y abre los gemelos en su visor', () => {
  const idx = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(idx, /href="\/xpacios\/gemelo\/"/);
  assert.match(idx, /x\.kind==="gemelo"\) return gemeloHTML\(x\)/);
  assert.match(idx, /\/xpacios\/gemelo\/ver\/\?id=/);
});

test('plantillas por sector: amueblan el local, con pantallas, sin marcas de cliente y conservando la foto', () => {
  const claves = Object.keys(G.PLANTILLAS);
  assert.deepEqual(claves, ['tienda', 'restaurante', 'hotel', 'estanco']);
  for (const k of claves) {
    const b = G.aplicaPlantilla({nombre: 'Mi local'}, k);
    assert.equal(b.plantilla, k);
    assert.equal(b.nombre, 'Mi local');
    assert.equal(b.items.length, G.PLANTILLAS[k].items.length, k + ': todos los elementos son de tipos conocidos');
    assert.ok(G.cuenta(b).pantallas >= 3, k + ': lleva pantallas');
    assert.doesNotMatch(JSON.stringify(G.PLANTILLAS[k]), /benny|creel|netflix|stranger|starbucks|xtanco|portaventura/i);
  }
  const conFoto = G.aplicaPlantilla({fondo: {tipo: 'foto', img: 'data:image/jpeg;base64,AAAA', w: 9, h: 6}}, 'hotel');
  assert.equal(conFoto.fondo.img, 'data:image/jpeg;base64,AAAA');
  assert.match(leer('./1/index.html'), /data-plantilla=/);
  // Los navegadores integrados cancelan confirm(): cambiar de plantilla se deshace, no se pregunta.
  assert.doesNotMatch(leer('./1/index.html'), /confirm\(/);
  assert.match(leer('./1/index.html'), /id="plDeshacer"/);
});
