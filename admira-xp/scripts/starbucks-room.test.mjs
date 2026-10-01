import test from 'node:test';
import assert from 'node:assert/strict';
import './starbucks-room.js';
import {createLifeScene} from './life-scene.mjs';
import {createSceneSnapshot} from './xtanco-scene-snapshot.mjs';
const room=globalThis.XpaceStarbucks;
test('six menus retain street numbering and 3 / 1 / 2 groups across all styles',()=>{
 for(const quality of ['good','better','best']){
  const parts=room.build(room.layout(),{quality}).flatMap(g=>g.parts),screens=parts.filter(x=>typeof x.device==='number');
  assert.deepEqual(screens.map(x=>x.device),[6,5,4,3,2,1]);assert.deepEqual(screens.map(x=>x.group),[2,2,null,1,1,1]);
  assert.equal(parts.filter(x=>x.device==='pos').length,1);
 }
});
test('venue profile survives the shared snapshot and creates Starbucks, not tobacco furniture',()=>{
 const layout=room.layout(),original=JSON.stringify(layout);
 const raw=createSceneSnapshot()({venue:room.id,active:true,iso:{cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:0,oy:0},game:{staff:[],custs:[]},layout});
 assert.equal(raw.venue,room.id);
 for(const quality of ['better','best']){
  const model=createLifeScene(raw,{assetQuality:quality,canvasFactory:()=>null});
  assert.ok(model.scene.getObjectByName('starbucks:sb-pos'));assert.ok(model.scene.getObjectByName('starbucks:sb-pastry'));
  assert.equal(model.scene.getObjectByName('furniture:lottery'),undefined);
  model.update({...raw,layout:layout.filter(x=>x.id!=='sb-mugs')});assert.equal(model.scene.getObjectByName('starbucks:sb-mugs'),undefined);
  model.dispose();
 }
 assert.equal(JSON.stringify(layout),original);
});
test('moving mode removes equipment but retains the architectural shell',()=>{
 const groups=room.build(room.layout(),{moving:true});assert.deepEqual(groups.map(x=>x.id),['architecture']);assert.equal(groups.flatMap(x=>x.parts).filter(x=>x.device).length,0);
});
