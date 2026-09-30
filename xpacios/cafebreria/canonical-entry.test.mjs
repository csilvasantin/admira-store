import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Cafebrería canonical entry opens its verified Good scene',()=>{
  const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
  const target='/admira-xp/?autostart=cafeteria&loc=cafebreria-barcelona';
  assert.match(html,/canonical" href="https:\/\/www\.xpaceos\.com\/xpacios\/cafebreria\//);
  assert.ok(html.includes(`url=${target.replace(/&/g,'&amp;')}`));
  assert.ok(html.includes(`location.replace('${target}')`));
});

test('Cafebrería replaces only the fallback LED identity',()=>{
  const scene=fs.readFileSync(new URL('../../admira-xp/index.html',import.meta.url),'utf8');
  assert.match(scene,/function activeLedMessages\(\)[\s\S]*isCafeteriaClient\(\)/);
  assert.match(scene,/CAFEBRERÍA/);
  assert.match(scene,/const msgs=activeLedMessages\(\)/);
  assert.match(scene,/currentVideoMsg/,'campaign and now-playing messages remain in the LED stream');
});

test('Cafebrería contextualizes delivery feedback without changing the shared flow',()=>{
  const scene=fs.readFileSync(new URL('../../admira-xp/index.html',import.meta.url),'utf8');
  assert.match(scene,/Café y despensa repuestos/);
  assert.match(scene,/isCafeteriaClient\(\).*Tabaco repuesto/);
});
