import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {createLifeScene} from '../admira-xp/scripts/life-scene.mjs';
import {counterURL} from '../admira-xp/scripts/counter-asset.mjs';
const input={cols:8,rows:8,layout:[{id:'counter',type:'counter',col:2,row:3,rot:1,sx:1.2,sy:.9}]};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
const asset=()=>{const root=new T.Group();const screen=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial());screen.name='screen_tpv_main';screen.userData.mediaSurface='existing_shared_player';root.add(screen);return root;};
test('Blender replacement retains instance identity/transforms and reconnects its screen without mutating simulation',async()=>{
 const original=JSON.stringify(input),glb=asset(),model=createLifeScene(input,{canvasFactory:()=>null,loadCounter:async()=>glb});
 const root=model.world.getObjectByName('furniture:counter'),position=root.position.toArray(),scale=root.scale.toArray(),rotation=root.rotation.y;
 await flush();assert.equal(root.userData.assetStatus,'ready');assert.equal(root.children[0],glb);
 assert.deepEqual(root.position.toArray(),position);assert.deepEqual(root.scale.toArray(),scale);assert.equal(root.rotation.y,rotation);assert.equal(root.userData.layoutId,'counter');assert.equal(JSON.stringify(input),original);model.dispose();
});
test('late loading cannot resurrect a removed counter or a disposed scene',async()=>{
 for(const dispose of [false,true]){
  let resolve;const glb=asset(),model=createLifeScene(input,{canvasFactory:()=>null,loadCounter:()=>new Promise(r=>{resolve=r;})});
  await flush();if(dispose)model.dispose();else model.update({...input,layout:[]});
  resolve(glb);await flush();assert.equal(glb.parent,null);if(!dispose)assert.equal(model.world.getObjectByName('furniture:counter'),undefined);model.dispose();
 }
});
test('a failed asset keeps the procedural fallback and reports its status',async()=>{
 const model=createLifeScene(input,{canvasFactory:()=>null,loadCounter:async()=>{throw Error('offline');}});await flush();
 const root=model.world.getObjectByName('furniture:counter');assert.equal(root.userData.assetStatus,'fallback');assert.ok(root.children.length);model.dispose();
});
test('all exported profiles preserve number 1, closed rear geometry and embedded textures without studio objects',()=>{
 let previous=0;
 for(const tier of ['good','better','best']){
  const b=fs.readFileSync(new URL(`./assets/mostrador/counter-interpreted-${tier}.glb`,import.meta.url));
  assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(8),b.length);
  const gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  const root=gltf.nodes.find(n=>n.extras?.inventoryNumber===1);assert.equal(root.extras.inventoryId,'native:counter');
  for(const name of ['rear_service_door_0','rear_service_door_1','rear_service_drawer','screen_tpv_main'])assert.ok(gltf.nodes.some(n=>n.name===name));
  assert.ok(gltf.images.every(i=>Number.isInteger(i.bufferView)&&!i.uri));assert.equal(gltf.cameras?.length||0,0);
  assert.ok(b.length>previous);previous=b.length;
 }
 assert.throws(()=>counterURL('../secret'));assert.match(counterURL('best'),/inventario\/assets\/mostrador\/counter-interpreted-best.glb$/);
});
