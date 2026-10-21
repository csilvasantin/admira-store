// La suite de la portada enseña las cinco soluciones de hoy, en el orden de la
// cadena, con «estás aquí» en admira.store (18-oct-2026). Las frases de cada una
// son las del RoadMap de AdmiraNeXT (functions/_roadmap.js, SOLUCIONES).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const seccion = html.slice(html.indexOf('<section id="plataforma">'), html.indexOf('</section>', html.indexOf('<section id="plataforma">')));
const CINCO = ['admira.studio', 'admira.store', 'admira.tv', 'admira.app', 'admira.biz'];

function diccionario(ancla) {
  const a = html.indexOf(ancla);
  assert.ok(a > 0, ancla);
  const b = html.indexOf("'platform.flow':", a);
  return html.slice(a, html.indexOf('\n', b));
}

test('cinco fichas en el orden de la cadena y ninguna de admira.live', () => {
  const titulos = [...seccion.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
  assert.deepEqual(titulos, CINCO);
  assert.deepEqual([...seccion.matchAll(/<div class="lnum">([A-Z])<\/div>/g)].map(m => m[1]), ['A', 'B', 'C', 'D', 'E']);
  assert.doesNotMatch(seccion, /admira\.live/);
  for (const dominio of CINCO) assert.match(seccion, new RegExp(`href="https://(www\\.)?${dominio.replace('.', '\\.')}/"`));
});

test('«estás aquí» va en la ficha de admira.store', () => {
  const aqui = seccion.slice(seccion.indexOf('<div class="layer here">'));
  assert.match(aqui.slice(0, aqui.indexOf('</div>\n      <div class="layer')), /<h3>admira\.store<\/h3>/);
  assert.equal((seccion.match(/class="layer here"/g) || []).length, 1);
});

test('cada solución lleva su frase del RoadMap en castellano y en inglés', () => {
  const es = diccionario("'platform.title': '<span class=\"num\">01</span>La plataforma");
  const en = diccionario("'platform.title': '<span class=\"num\">01</span>The AdmiraNext platform");
  for (const frase of ['Creación y Adaptación de Contenidos', 'Distribución, Gestión y Visualización', 'Reproducción, Emisión y Proof of Play', 'Instalaciones, Mantenimiento y Gestión', 'Nuevos ingresos con DooH y Retail Media']) {
    assert.ok(es.includes(frase) && seccion.includes(frase), frase);
  }
  for (const frase of ['Content Creation and Adaptation', 'Distribution, Management and Visualization', 'Playback, Broadcast and Proof of Play', 'Installations, Maintenance and Management', 'New revenue with DooH and Retail Media']) {
    assert.ok(en.includes(frase), frase);
  }
  for (const clave of ['storeKind', 'storeCopy', 'appKind', 'appCopy', 'bizKind', 'bizCopy']) {
    assert.ok(es.includes(`'platform.${clave}'`) && en.includes(`'platform.${clave}'`), clave);
    assert.match(seccion, new RegExp(`data-i18n(-html)?="platform\\.${clave}"`));
  }
  assert.doesNotMatch(html, /platform\.xpace/);
});

test('el inventario vivo se pinta en la ficha de admira.biz', () => {
  const biz = seccion.slice(seccion.indexOf('<h3>admira.biz</h3>'));
  assert.match(biz, /id="pulse-biz"/);
  assert.match(html, /pulseSet\('pulse-biz', fmt\('pulse\.biz'/);
  assert.doesNotMatch(html, /pulse-app|'pulse\.app'/);
});
