// Peso de la portada (Carlos, 21-oct-2026): lo pesado va después del primer pintado.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('el catálogo de gemelos se pide después del primer pintado y la intro lleva su sello nuevo', () => {
  assert.match(html, /renderGemelos\(\);\n\/\/ El catálogo[^\n]*\n\(window\.requestAnimationFrame \? requestAnimationFrame\(\(\) => setTimeout\(loadGemelos, 0\)\) : loadGemelos\(\)\);/);
  assert.match(html, /intro-portada\.js\?v=20261021-intro-una-vez-1/);
  assert.doesNotMatch(html, /\nloadGemelos\(\);\n/, 'ya no se pide en cuanto se ejecuta el script');
});
