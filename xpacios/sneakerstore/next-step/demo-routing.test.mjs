import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../../assets/xpace-shell.js', import.meta.url), 'utf8');
const capture = source.slice(source.indexOf("    doc.addEventListener('submit', e =>", source.indexOf('function wireCli()')), source.indexOf('    let history = [];', source.indexOf('function wireCli()')));
function submit(path, value, ownForm = true) {
  const form = {}, input = {value}; let handler;
  vm.runInNewContext(capture, {form, input, root:{location:{pathname:path}}, doc:{addEventListener(type, callback, capturePhase) {
    assert.equal(type, 'submit'); assert.equal(capturePhase, true); handler = callback;
  }}});
  handler({target:ownForm ? form : {}});
  return input.value;
}
test('SneakerStore owns its campaign commands before the global suite', () => {
  for (const command of ['/demo', '/demo sneakers pausa', '/demo sneaker reiniciar', '/demo next-step parar', '/demo nextstep'])
    assert.equal(submit('/xpacios/sneakerstore/', command), command.slice(1));
});
test('global demos, other routes and unrelated forms retain suite routing', () => {
  for (const command of ['/demo global', '/demo studio', '/demo sneakers-other'])
    assert.equal(submit('/xpacios/sneakerstore/', command), command);
  assert.equal(submit('/otro/', '/demo sneakers'), '/demo sneakers');
  assert.equal(submit('/xpacios/sneakerstore/', '/demo sneakers', false), '/demo sneakers');
  assert.equal(submit('/otro/', '/demo taza'), 'demo taza');
});
