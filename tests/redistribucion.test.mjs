// /redistribucion (FLT-102063): desde admira.store se abre en admira.biz el plano en planta y
// alzado del Xpacio, en modo obras. El Xpacio sale del argumento, del ?loc= del gemelo o, si
// solo hay uno con plano, de ese; uno sin plano no navega.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const SHELL = require(join(root, 'assets/xpace-shell.js'));
const URL_PG103 = 'https://www.admira.biz/plano.html?locationId=alsea-sbux-021&modo=obra&lang=';

test('planoTarget resolves aliases, accents and the twin loc to the admira.biz plan', () => {
  for (const args of ['starbucks', 'Starbucks Paseo de Gracia', 'pg103', 'alsea-sbux-021', 'xpacio=paseo de gracia', 'PASEO DE GRÀCIA 103']) {
    const r = SHELL.planoTarget(args, '', 'es');
    assert.equal(r.ok, true, args);
    assert.equal(r.url, URL_PG103 + 'es', args);
  }
  assert.equal(SHELL.planoTarget('', '?autostart=xtanco&visual=matrix&loc=alsea-sbux-021', 'en').url, URL_PG103 + 'en');
  assert.equal(SHELL.planoTarget('', '', 'es').id, 'alsea-sbux-021', 'a single plan is the default');
});

test('an Xpacio without a plan does not navigate and lists the ones that have one', () => {
  const r = SHELL.planoTarget('mercadona', '', 'es');
  assert.equal(r.ok, false);
  assert.equal(r.asked, 'mercadona');
  assert.match(r.list, /Starbucks Paseo de Gracia 103/);
  assert.equal(SHELL.planoTarget('', '?loc=xtanco-valencia', 'es').ok, false);
});

test('the shell registers /redistribucion with the accented alias the suite engine needs', () => {
  const src = readFileSync(join(root, 'assets/xpace-shell.js'), 'utf8');
  assert.match(src, /id: 'redistribucion',\s*aliases: \['redistribución', 'redistribuir', 'plano', 'obras'\]/);
  assert.match(src, /planoTarget\(args, root\.location\.search, lang\(\)\)/);
});
