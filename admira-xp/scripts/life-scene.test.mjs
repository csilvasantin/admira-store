import test from 'node:test';
import assert from 'node:assert/strict';
import {createLifeScene} from './life-scene.mjs';

// Canvas drawing is procedural; these offline tests exercise ownership and
// geometry contracts. Actual shading and composition are reviewed in WebGL.
const canvasFactory=()=>({width:0,height:0,getContext:()=>new Proxy({},{
  get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>(target[key]=value,true)
})});
const input={cols:14,rows:8,wallHeight:3.25,inside:2,entries:17,
  layout:[{id:'counter',type:'counter',col:1,row:2,sx:1.2,sy:.9,rot:1,flipX:true,label:'Caja'},
    {id:'shelf',type:'shelves',col:4,row:1},{id:'wine',type:'wineRack',col:6,row:1},
    {id:'lamp',type:'floorLamp',col:10,row:5},{id:'screen',type:'tft',col:9,row:0,ph:.8,wallY:2.2},
    {id:'assistant',type:'metahuman',col:13,row:3}],
  actors:[{id:'ana',label:'Ana',kind:'staff',col:2,row:3,heading:0,walking:false,
    color:'#648f78',skin:'#c68642',hair:'#443322',pants:'#334455',shoes:'#223344',scale:.9,accessory:1}]
};
const meshes=model=>{const result=[];model.scene.traverse(o=>{if(o.isMesh)result.push(o);});return result;};

test('Life preserves raw grid transforms, live metadata and source immutability',()=>{
  const raw=structuredClone(input),original=JSON.stringify(raw),model=createLifeScene(raw,{canvasFactory});
  const counter=model.scene.getObjectByName('furniture:counter');
  assert.deepEqual(counter.position.toArray(),[1,0,2]);assert.deepEqual(counter.scale.toArray(),[-1.2,.9,1.2]);assert.equal(counter.rotation.y,-Math.PI/2);
  assert.equal(counter.userData.layoutId,'counter');assert.equal(model.snapshot.entries,17);
  assert.equal(model.snapshot.actors[0].label,'Ana');assert.equal(model.snapshot.actors[0].hair,'#443322');assert.equal(model.snapshot.actors[0].scale,.9);
  const uuids=model.world.children.map(o=>o.uuid),actor=model.actors.children[0];
  model.update({...raw,projection:{width:800,height:600,ox:450,oy:120,tileW:90,tileH:30}});
  assert.deepEqual(model.world.children.map(o=>o.uuid),uuids);assert.equal(model.actors.children[0],actor);
  assert.equal(JSON.stringify(raw),original);model.dispose();
});

test('Screens share one portrait canvas and exactly one external player draw',()=>{
  const model=createLifeScene(input,{canvasFactory});
  const screens=meshes(model).filter(o=>o.material.map?.image?.width===512&&o.material.map?.image?.height===768);
  assert.ok(screens.length>=4);assert.equal(new Set(screens.map(o=>o.material.map)).size,1);
  let draws=0;model.refreshMedia({draw(ctx,width,height){draws++;assert.equal(width,512);assert.equal(height,768);}});
  assert.equal(draws,1);const uuids=meshes(model).map(o=>o.uuid);
  for(const mode of ['sunset','night','day'])model.setLighting(mode);
  assert.deepEqual(meshes(model).map(o=>o.uuid),uuids);model.dispose();
});

test('Pose interpolation follows snapshots without advancing source positions or counters',()=>{
  const raw=structuredClone(input),model=createLifeScene(raw,{canvasFactory}),actor=model.actors.children[0];
  model.animate(1000);
  const moved={...raw,actors:[{...raw.actors[0],col:2.6,row:3.4,heading:.8,walking:true}]};
  const source=JSON.stringify(moved);model.update(moved);model.animate(1050);
  assert.equal(model.actors.children[0],actor);assert.ok(actor.position.x>2&&actor.position.x<2.6);
  assert.ok(actor.rotation.y>0&&actor.rotation.y<.8);assert.notEqual(actor.userData.legs[0].rotation.x,0);
  assert.equal(model.snapshot.actors[0].col,2.6);assert.equal(model.snapshot.entries,17);
  model.animate(1100);assert.deepEqual(actor.position.toArray(),[2.6,0,3.4]);assert.equal(JSON.stringify(moved),source);
  model.update({...moved,actors:[{...moved.actors[0],col:9,row:7}]});assert.deepEqual(actor.position.toArray(),[9,0,7]);
  model.dispose();
});

test('Layout churn and actor appearance replacement release owned resources',()=>{
  const model=createLifeScene(input,{canvasFactory}),baseline=model.resources;
  let actorInstancesDisposed=0;
  model.actors.children[0].traverse(o=>{if(o.isInstancedMesh)o.addEventListener('dispose',()=>actorInstancesDisposed++);});
  for(let i=0;i<12;i++)model.update({...input,
    layout:input.layout.map(item=>({...item,col:item.col+(i%2)*.2})),
    actors:[{...input.actors[0],id:`visitor-${i}`,color:i%2?'#776644':'#448877'}]
  });
  assert.ok(actorInstancesDisposed>0);assert.deepEqual(model.resources,baseline);assert.equal(model.actors.children.length,1);
  const sharedGeometry=meshes(model)[0].geometry;let geometryDisposed=0;sharedGeometry.addEventListener('dispose',()=>geometryDisposed++);
  model.dispose();model.dispose();assert.equal(geometryDisposed,1);assert.equal(model.scene.children.length,0);
  assert.deepEqual(model.resources,{geometry:0,materials:0,textures:0});
});
