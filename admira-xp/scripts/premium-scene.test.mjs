import test from 'node:test';
import assert from 'node:assert/strict';
import {createPremiumScene,INTEGRATED_OPERATIONAL_TYPES} from './premium-scene.mjs';
import {normalizeSnapshot,actorGridPosition} from './premium-model.mjs';

const sceneInput={cols:14,rows:8,wallHeight:3.25,layout:[
  {id:'counter',type:'counter',col:1,row:2},{id:'shelves',type:'shelves',col:4,row:1},
  {id:'wine',type:'wineRack',col:6,row:1},{id:'lamp',type:'floorLamp',col:10,row:5}
],actors:[{id:'ana',kind:'staff',col:1.5,row:1.4,color:'#64a698'}]};
const canvasFactory=()=>({width:0,height:0,getContext(){return {fillRect(){},fillText(){},clearRect(){}};}});
const meshes=model=>{const out=[];model.scene.traverse(o=>{if(o.isMesh)out.push(o);});return out;};

test('Better and Best preserve scene identity, furniture transforms and actor positions',()=>{
  const model=createPremiumScene(sceneInput,{canvasFactory});const before=meshes(model),ids=before.map(o=>o.uuid);
  const counter=model.scene.getObjectByName('furniture:counter');assert.deepEqual(counter.position.toArray(),[1,0,2]);
  model.setMode('better');assert.deepEqual(meshes(model).map(o=>o.uuid),ids);
  assert.ok(before.filter(o=>o.userData.wire).every(o=>o.material.isMeshBasicMaterial));
  assert.ok(before.filter(o=>!o.userData.wire).every(o=>o.material===o.userData.bestMaterial));
  model.setMode('best');assert.ok(before.every(o=>o.material===o.userData.bestMaterial));
  assert.deepEqual(model.scene.getObjectByName('actor:ana').position.toArray(),[1.5,0,1.4]);model.dispose();
});

test('Advancing actor state neither rebuilds architecture nor alters input snapshots',()=>{
  const input=structuredClone(sceneInput),initial=JSON.stringify(input),model=createPremiumScene(input,{canvasFactory});
  const worldIds=model.world.children.map(o=>o.uuid),actor=model.scene.getObjectByName('actor:ana');
  model.update({...input,actors:[{...input.actors[0],col:2,row:3,walking:true}]});model.animate(240);
  assert.deepEqual(model.world.children.map(o=>o.uuid),worldIds);assert.equal(model.scene.getObjectByName('actor:ana'),actor);
  assert.deepEqual(actor.position.toArray(),[2,0,3]);assert.notEqual(actor.userData.legs[0].rotation.x,0);
  assert.equal(JSON.stringify(input),initial);model.dispose();
});

test('All connected screens use one media texture and one source draw per refresh',()=>{
  const model=createPremiumScene(sceneInput,{canvasFactory});const screenMaterials=meshes(model).filter(o=>!o.userData.wire&&o.material.map?.image?.height===768).map(o=>o.material);
  assert.ok(screenMaterials.length>=3);assert.equal(new Set(screenMaterials.map(m=>m.map)).size,1);
  let draws=0;model.refreshMedia({draw(ctx,w,h){draws++;assert.equal(w,512);assert.equal(h,768);}});assert.equal(draws,1);
  model.setMode('better');model.refreshMedia({draw(){draws++;}});assert.equal(draws,2);model.dispose();
});

test('Repeated layout updates and actor turnover release temporary GPU resources',()=>{
  const model=createPremiumScene(sceneInput,{canvasFactory}),initial=model.resources;
  for(let i=0;i<15;i++)model.update({...sceneInput,layout:sceneInput.layout.map(o=>({...o,col:o.col+i%2})),actors:[{...sceneInput.actors[0],id:`actor-${i}`} ]});
  assert.deepEqual(model.resources,initial);assert.equal(model.actors.children.length,1);
  const g=meshes(model)[0].geometry;let disposed=false;g.addEventListener('dispose',()=>{disposed=true;});model.dispose();assert.ok(disposed);assert.equal(model.scene.children.length,0);
});

test('Legacy isometric actor coordinates invert to the same grid location',()=>{
  const iso={ox:270,oy:185,tileW:80,tileH:28};const col=7.4,row=3.2;
  const p=actorGridPosition(iso.ox+(col-row)*40,iso.oy+(col+row)*14-27,iso,27);
  assert.ok(Math.abs(p.col-col)<1e-10);assert.ok(Math.abs(p.row-row)<1e-10);
});

test('Invalid renderer input is bounded without modifying caller data',()=>{
  const raw={cols:Infinity,rows:-3,layout:[{type:'custom',sx:-8,sy:Infinity,fp:[-1,99]}],actors:[{col:NaN,row:Infinity}]};
  const s=normalizeSnapshot(raw);assert.equal(s.cols,14);assert.equal(s.rows,4);assert.equal(s.layout[0].sx,.1);assert.deepEqual(s.layout[0].fp,[.1,10]);assert.equal(s.actors[0].col,0);
});

test('Converted wall heights and centers are consumed once, independently of furniture scale',()=>{
  const input={...sceneInput,elevation:.46,layout:[
    {id:'wall-screen',type:'tft',col:6,row:0,wallY:2.18,ph:1.78,sx:2,sy:3},
    {id:'wall-aroma',type:'aroma',col:11,row:2,wallY:2.62,ph:.67,sx:2,sy:4}
  ]};
  const model=createPremiumScene(input,{canvasFactory});model.scene.updateMatrixWorld(true);
  const screen=model.scene.getObjectByName('furniture:wall-screen'),aroma=model.scene.getObjectByName('furniture:wall-aroma');
  assert.equal(screen.position.y,2.18);assert.deepEqual(screen.scale.toArray(),[1,1,1]);
  const display=screen.children[0].children.find(o=>o.isMesh&&!o.userData.wire);
  assert.equal(display.scale.y,1.78);assert.equal(display.position.y,0);
  assert.ok(Math.abs(display.scale.x-1.78*(16/9)*Math.SQRT2*Math.cos(.46))<1e-10);
  assert.equal(aroma.position.y,2.62);assert.equal(aroma.position.z,0);assert.equal(aroma.children[0].scale.y,.67);assert.equal(aroma.children[0].position.y,0);
  assert.deepEqual(aroma.scale.toArray(),[1,1,1]);
  model.setMode('better');assert.equal(screen.position.y,2.18);assert.equal(aroma.position.y,2.62);model.dispose();
});

test('Integrated architecture excludes operational duplicates and leaves their original media owner untouched',()=>{
  const decorative=['plant','rug','vending','wineRack','magazines'];
  const layout=[...INTEGRATED_OPERATIONAL_TYPES,...decorative].map((type,i)=>({id:type,type,col:i%12,row:Math.floor(i/12)+1}));
  const input={...sceneInput,layout,projection:{width:800,height:500,ox:270,oy:185,tileW:80,tileH:28}};
  const model=createPremiumScene(input,{canvasFactory,integrated:true});
  for(const type of INTEGRATED_OPERATIONAL_TYPES)assert.equal(model.scene.getObjectByName(`furniture:${type}`),undefined,`${type} must remain in Good's operational overlay`);
  for(const type of decorative)assert.ok(model.scene.getObjectByName(`furniture:${type}`),`${type} must keep the premium finish`);
  assert.equal(model.actors.children.length,0);assert.equal(model.scene.getObjectByName('actor:ana'),undefined);
  assert.equal(model.scene.getObjectByName('fixture:camera'),undefined);
  assert.ok(model.scene.getObjectByName('architectural:window-support'));
  assert.ok(meshes(model).every(o=>o.material.map?.image?.height!==768));
  let draws=0;model.refreshMedia({draw(){draws++;}});assert.equal(draws,0);
  const door=model.scene.getObjectByName('architectural:door'),ids=meshes(model).map(o=>o.uuid);
  model.setMode('better');assert.deepEqual(meshes(model).map(o=>o.uuid),ids);
  model.update({...input,doorOpen:1,actors:[{id:'later',col:2,row:2}]});
  assert.equal(model.scene.getObjectByName('architectural:door'),door);assert.ok(door.rotation.y<-.7);assert.equal(model.actors.children.length,0);
  model.dispose();
});

test('Standalone presentation continues to include operational geometry, actors and camera',()=>{
  const model=createPremiumScene(sceneInput,{canvasFactory});
  assert.ok(model.scene.getObjectByName('furniture:counter'));assert.ok(model.scene.getObjectByName('furniture:shelves'));
  assert.ok(model.scene.getObjectByName('fixture:camera'));assert.equal(model.actors.children.length,1);model.dispose();
});
