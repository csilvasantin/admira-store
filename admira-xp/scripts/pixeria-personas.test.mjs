import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizePersonaStyle,keyChroma} from './pixeria-personas.mjs';

test('the Grok style card is normalised to the vocabulary Better and Best understand', () => {
  const s=normalizePersonaStyle({gender:'m',age:'senior',hairstyle:'bald',outfit:'suit',accessory:'bag',palette:{skin:'#d4b8a3',hair:'#d4d4d4',color:'#c8c8c8',pants:'nope',shoes:'#2a2a2a'}});
  assert.deepEqual({...s,palette:{...s.palette}},{gender:'m',age:'senior',hairstyle:'short',outfit:'jacket',accessory:'backpack',height:1,width:1,
    palette:{skin:'#d4b8a3',hair:'#d4d4d4',color:'#c8c8c8',pants:'#4a4a4a',shoes:'#2a2a2a'}});
  assert.equal(normalizePersonaStyle({gender:'f',age:'teen'}).age,'adult');
  assert.equal(normalizePersonaStyle(null),null);
});

test('chroma key drops the green background, keeps skin and cloth and despills the edge', () => {
  const px=new Uint8ClampedArray([0,255,0,255, 30,160,40,255, 200,150,120,255, 99,108,64,255]);
  keyChroma(px);
  assert.equal(px[3],0);                 // pure chroma → transparent
  assert.equal(px[7],0);                 // shadowed chroma → transparent
  assert.equal(px[11],255);              // skin stays opaque
  assert.equal(px[15],255);              // olive cloth (#636c40) stays opaque
  assert.ok(px[13]<=px[12]+6);           // despill: green no longer dominates
});

test('a Pixeria persona flows from the Good customer to every tier', () => {
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/c\.pixeriaPersonaId=entry&&entry\.persona&&entry\.id\?String\(entry\.id\):null;/);
  const snapshot=readFileSync(new URL('./life-snapshot.mjs',import.meta.url),'utf8');
  assert.match(snapshot,/visitorProfileId:'px:'\+pixeriaPersonaId,visitorStyle:pixeriaStyle/);
  const people=readFileSync(new URL('./best-live-people.mjs',import.meta.url),'utf8');
  assert.match(people,/pixeriaWalkSheet\(pxId\)/);
  const registry=readFileSync(new URL('./pixeria-personas.mjs',import.meta.url),'utf8');
  assert.match(registry,/LOCAL_WORKER=\/\^http:\\\/\\\/\(127\\\.0\\\.0\\\.1\|localhost\):\\d\+\$\//,'only local workers may override the production one');
});
