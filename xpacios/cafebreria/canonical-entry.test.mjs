import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Cafebrería canonical entry retains the original scene and common XpaceOS editor',()=>{
  const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
  assert.match(html,/canonical" href="https:\/\/www\.xpaceos\.com\/xpacios\/cafebreria\//);
  assert.match(html,/xpace-shell\.js/);
  assert.match(html,/cafe-edit/);
  assert.match(html,/cafe-inventory/);
  const runtime=fs.readFileSync(new URL('./cafe.mjs',import.meta.url),'utf8');
  assert.match(runtime,/scene\.glb/);
  assert.match(runtime,/mountDistribuit/);
  assert.match(runtime,/surroundings:true/);
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
