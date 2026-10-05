import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
test('Matrix windows retain feature-specific reopeners and dispose registrations with the scene',()=>{
  const map=read('./matrix-panorama.mjs?v=windows-menu-1'),playlist=read('./device-editor.mjs?v=windows-menu-1'),incidents=read('./starbucks-incidents.mjs?v=windows-menu-1');
  assert.match(map,/menu:'matrix-map',onOpen:.*incidents\?\.close\(\);cancel\(\);panel\.hidden=false/);
  assert.match(map,/mappingWindow\.dispose\(\)/);
  assert.match(playlist,/menu:'matrix-playlist',onOpen:openPanel/);
  assert.match(playlist,/onOpen\(\);enabled=true;surface\.classList\.add\('device-layout-active'\)/);
  assert.match(map,/onOpen:\(\)=>setScreenNumbersVisible\(true\)/);
  assert.match(playlist,/if\(first\)render\(\);else playbackChanged\(\)/,'reopening a hidden editor keeps its current draft');
  assert.match(incidents,/menu:'matrix-incidents',onOpen:.*panel\.hidden=false;refresh\(\)/);
  for(const source of [playlist,incidents])assert.match(source,/floating\.dispose\(\)/);
  assert.match(playlist,/if\(action==='close'\)\{panel\.hidden=true;return;\}/,'closing a playlist leaves playback alive');
  assert.match(incidents,/if\(action==='close'\)\{panel\.hidden=true;return;\}/,'closing an incident editor does not send a ticket');
});

test('Distribuir movement uses scene bounds and its own close/dispose lifecycle',()=>{
  const source=read('./distribuit-ui.mjs?v=windows-menu-1');
  assert.match(source,/attachFloatingPanel\(host,\{[^\n]*bounds:stage/);
  assert.match(source,/closeButton:host\.querySelector\('\[data-action="close"\]'\)/);
  assert.match(source,/host\.querySelector\('\[data-action="close"\]'\)\.onclick=onClose/);
  assert.match(source,/dispose\(\)\{[^}]*floating\.dispose\(\);canvas\.setAttribute/);
  assert.doesNotMatch(source,/menu:/,'Life owns the persistent opener after this editor has been disposed');
});

test('Best keeps metadata readable by Expert while dismissible errors preserve their message and controls',()=>{
  const source=read('./best-preview-ui.mjs?v=windows-menu-1'),furniture=read('./matrix-furniture.mjs');
  assert.match(source,/<figcaption style="display:none">Inventario compartido/);
  assert.match(source,/<p class="matrix-furniture-selection"[^>]*style="display:none"/);
  assert.match(furniture,/status\.style\.display='none'/);
  assert.match(source,/best-people-status'\)\?\.style\?\.setProperty\('display','none'\)/);
  assert.match(source,/querySelector\('\.best-image-error-message'\)\.textContent=message/);
  assert.doesNotMatch(source,/querySelector\('\.best-image-error'\)\.textContent=/,'error updates cannot erase the close handle');
});
