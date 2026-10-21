// Las cifras de la portada cuentan lo mismo en todas partes (Carlos, 21-oct-2026): cabecera, tarjeta admira.live y
// tarjeta admira.app salen del mismo catálogo; la cabecera distingue total y en vivo, y admira.app no enseña un 0.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('la cabecera distingue superficies totales y en vivo, en los dos idiomas', () => {
  assert.match(html, /'hero\.pulse': '● EN PRODUCCIÓN · \{n\} GEMELOS · \{s\} SUPERFICIES · \{l\} EN VIVO'/);
  assert.match(html, /'hero\.pulse': '● IN PRODUCTION · \{n\} TWINS · \{s\} SURFACES · \{l\} LIVE'/);
  assert.match(html, /hp\.textContent = fmt\('hero\.pulse', \{ '\{n\}': nf\(gemelosData\.length\), '\{s\}': nf\(surf\), '\{l\}': nf\(live\) \}\)/);
});

test('la tarjeta admira.app dice el inventario total y las vivas; sin vivas, lo dice con palabras y no con un 0', () => {
  assert.match(html, /'pulse\.app': '\{s\} superficies como inventario · \{l\} en vivo'/);
  assert.match(html, /'pulse\.appIdle': '\{s\} superficies como inventario · ninguna en vivo ahora'/);
  assert.match(html, /'pulse\.app': '\{s\} surfaces as inventory · \{l\} live'/);
  assert.match(html, /'pulse\.appIdle': '\{s\} surfaces as inventory · none live right now'/);
  assert.match(html, /pulseSet\('pulse-app', live \? fmt\('pulse\.app', \{ '\{s\}': nf\(surf\), '\{l\}': nf\(live\) \}\) : fmt\('pulse\.appIdle', \{ '\{s\}': nf\(surf\) \}\)\)/);
  assert.doesNotMatch(html, /superficies vivas como inventario/);
});

test('cabecera, admira.live y la galería cuentan el mismo catálogo (gemelosData) con separador de miles', () => {
  const bloque = html.slice(html.indexOf('function renderPulses()'), html.indexOf('async function loadOnAir()'));
  assert.match(bloque, /const surf = gemelosData\.reduce/);
  assert.match(bloque, /pulseSet\('pulse-live', fmt\('pulse\.live', \{ '\{n\}': gemelosData\.length\.toLocaleString/);
  assert.match(html, /replace\('\{n\}', gemelosData\.length\.toLocaleString\(document\.documentElement\.lang\)\)\.replace\('\{s\}', totalSurf\.toLocaleString\(document\.documentElement\.lang\)\)/);
});
