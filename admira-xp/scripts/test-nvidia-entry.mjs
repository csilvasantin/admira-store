import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [entry, app, sitemap] = await Promise.all([
  readFile(new URL('../../nvidia/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../../sitemap.xml', import.meta.url), 'utf8'),
]);

assert.match(entry, /<html lang="en">/);
assert.match(entry, /canonical" href="https:\/\/www\.xpaceos\.com\/nvidia\/"/);
assert.match(entry, /\/admira-xp\/\?lang=en&amp;langlock=1&amp;build=20260905-0740/);
assert.doesNotMatch(entry, /play=shoptalk|nvidia=1/);
assert.match(app, /window\.XPACE_LANG_OVERRIDE/);
assert.match(app, /window\.XPACE_LANG_LOCKED/);
assert.match(app, /menuSel=lang==='en'\?1:0/);
assert.match(app, /if\(!_as && !_qs\.get\('play'\)/);
assert.match(app, /en:'Advanced options'/);
assert.match(app, /label:isEs\?'✏ Mobiliario':'✏ Furniture'/);
assert.match(app, /en\?'The screen sees you':'La pantalla te ve'/);
assert.match(app, /lang==='en'\?'RATE US':'QUÉ TAL'/);
assert.match(app, /'THIEF ENTERING'/);
assert.match(app, /lang==='en'\?'📦 Supplier deal: -50% restock!'/);
assert.match(app, /en\?'AUDIENCE · CPM':'AUDIENCIA · CPM'/);
assert.match(sitemap, /https:\/\/www\.xpaceos\.com\/nvidia\//);

console.log('NVIDIA maximized English Admira XP contracts: OK');
