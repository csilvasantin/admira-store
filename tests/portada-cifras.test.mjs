// Las cifras de la portada cuentan lo mismo en todas partes (Carlos, 21-oct-2026): cabecera, tarjeta admira.store y
// tarjeta admira.biz salen del mismo catálogo; la cabecera distingue total y en vivo, y admira.biz no enseña un 0.
// (Hasta el 21-nov-2026 el inventario lo enseñaba la tarjeta admira.app; con la suite de cinco pasa a admira.biz.)
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('la cabecera distingue superficies totales y en vivo, en los dos idiomas', () => {
  assert.match(html, /'hero\.pulse': '● EN PRODUCCIÓN · \{n\} GEMELOS · \{s\} SUPERFICIES · \{l\} EN VIVO'/);
  assert.match(html, /'hero\.pulse': '● IN PRODUCTION · \{n\} TWINS · \{s\} SURFACES · \{l\} LIVE'/);
  assert.match(html, /hp\.textContent = live \? fmt\('hero\.pulse', \{ '\{n\}': nf\(gemelosData\.length\), '\{s\}': nf\(surf\), '\{l\}': nf\(live\) \}\) : fmt\('hero\.pulseIdle', \{ '\{n\}': nf\(gemelosData\.length\), '\{s\}': nf\(surf\) \}\)/, 'sin vivas, la cabecera no dice «0 en vivo»');
  assert.match(html, /'hero\.pulseIdle': '● EN PRODUCCIÓN · \{n\} GEMELOS · \{s\} SUPERFICIES'/);
  assert.match(html, /'hero\.pulseIdle': '● IN PRODUCTION · \{n\} TWINS · \{s\} SURFACES'/);
});

test('la tarjeta admira.biz dice el inventario total y las vivas; sin vivas, lo dice con palabras y no con un 0', () => {
  assert.match(html, /'pulse\.biz': '\{s\} superficies como inventario · \{l\} en vivo'/);
  assert.match(html, /'pulse\.bizIdle': '\{s\} superficies como inventario · ninguna en vivo ahora'/);
  assert.match(html, /'pulse\.biz': '\{s\} surfaces as inventory · \{l\} live'/);
  assert.match(html, /'pulse\.bizIdle': '\{s\} surfaces as inventory · none live right now'/);
  assert.match(html, /pulseSet\('pulse-biz', live \? fmt\('pulse\.biz', \{ '\{s\}': nf\(surf\), '\{l\}': nf\(live\) \}\) : fmt\('pulse\.bizIdle', \{ '\{s\}': nf\(surf\) \}\)\)/);
  assert.doesNotMatch(html, /superficies vivas como inventario/);
});

test('cabecera, admira.store y la galería cuentan el mismo catálogo (gemelosData) con separador de miles', () => {
  const bloque = html.slice(html.indexOf('function renderPulses()'), html.indexOf('async function loadOnAir()'));
  assert.match(bloque, /const surf = gemelosData\.reduce/);
  assert.match(bloque, /pulseSet\('pulse-live', fmt\('pulse\.live', \{ '\{n\}': gemelosData\.length\.toLocaleString/);
  assert.match(html, /replace\('\{n\}', gemelosData\.length\.toLocaleString\(document\.documentElement\.lang\)\)\.replace\('\{s\}', totalSurf\.toLocaleString\(document\.documentElement\.lang\)\)/);
});
