import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../admira-xp/scripts/premium-three.mjs';
import {furnitureURL,inventoryIdFor} from '../admira-xp/scripts/furniture-asset.mjs';
import {createLifeScene} from '../admira-xp/scripts/life-scene.mjs';
const registry=JSON.parse(fs.readFileSync(new URL('./registry.json',import.meta.url)));
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
test('all 51 immutable inventory IDs have three usable GLBs and editable sources',()=>{
 for(const [id,n] of Object.entries(registry.numbers))for(const tier of ['good','better','best']){
  const b=fs.readFileSync(new URL(furnitureURL(n,tier)));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.length,b.readUInt32LE(8));
  const gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  assert.ok(gltf.nodes.some(o=>o.extras?.inventoryNumber===n&&o.extras.inventoryId===id));
  assert.ok(gltf.meshes.length);assert.equal(gltf.cameras?.length||0,0);
  for(const m of gltf.meshes)for(const p of m.primitives){const a=gltf.accessors[p.attributes.POSITION];assert.ok(a.count>=3);assert.ok([...a.min,...a.max].every(Number.isFinite));}
  assert.ok(fs.statSync(new URL(furnitureURL(n,tier,'blend'))).size>1000);
 }
 assert.throws(()=>furnitureURL(52));assert.throws(()=>furnitureURL(2,'../best'));
});
test('water rack keeps editable visual bottle identities and self-contained PBR textures',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('./starbucks/manifest.json',import.meta.url)));
 const unit=manifest.units.find(u=>u.itil_code==='PDG103-BOT-01');
 assert.equal(unit.instance_id,'sb-water-rack');assert.equal(unit.asset_number,50);
 assert.equal(manifest.units.length,11);assert.equal(new Set(manifest.units.map(u=>u.asset_number)).size,7);
 assert.equal(unit.visual_filling.bottle_count,19);assert.equal(unit.stock_quantity,undefined);
 for(const tier of ['good','better','best']){
  const b=fs.readFileSync(new URL(furnitureURL(50,tier))),gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
  const bottles=gltf.nodes.filter(node=>node.name?.startsWith('Solán de Cabras bottle ')&&node.children?.length);
  assert.equal(bottles.length,19);assert.equal(new Set(bottles.map(node=>node.extras?.bottle_instance)).size,19);
  assert.ok(bottles.every(node=>node.extras.stock_quantity_verified===false));
  assert.ok(gltf.images.length);assert.ok(gltf.images.every(image=>Number.isSafeInteger(image.bufferView)&&!image.uri&&['image/png','image/jpeg'].includes(image.mimeType)));
  assert.ok(gltf.materials.some(material=>material.pbrMetallicRoughness?.baseColorTexture));
  assert.ok(gltf.materials.some(material=>material.pbrMetallicRoughness?.metallicRoughnessTexture));
 }
 const bottle=fs.readFileSync(new URL('./assets/catalog/50/bottle.glb',import.meta.url));
 assert.equal(bottle.toString('ascii',0,4),'glTF');
 assert.ok(fs.statSync(new URL('./assets/catalog/50/bottle.blend',import.meta.url)).size>1000);
});
test('Pixeria identity resolves from the stock asset, independent of arbitrary instance ID',()=>{
 assert.equal(inventoryIdFor({id:'instance-928',type:'custom',img:'https://api.admira.store/stock/asset/1780691765844-ex3huq?v=22'}),'pixeria:1780691765844-ex3huq');
});
test('generic loader replaces every type but preserves placement and leaves unknown types intact',async()=>{
 const input={cols:8,rows:8,layout:[{id:'s',type:'shelves',col:2,row:3,rot:1,sx:1.3,sy:.9},{id:'p',type:'custom',col:4,row:4,img:'https://api.admira.store/stock/asset/missing'}]},requested=[];
 const model=createLifeScene(input,{canvasFactory:()=>null,loadFurniture:async item=>{requested.push(item.id);return item.id==='s'?new T.Group():null;}});const root=model.world.getObjectByName('furniture:s'),before=[...root.position,...root.scale,root.rotation.y];await flush();
 assert.deepEqual(requested,['s','p']);assert.equal(root.userData.assetStatus,'ready');assert.deepEqual([...root.position,...root.scale,root.rotation.y],before);assert.equal(model.world.getObjectByName('furniture:p').userData.assetStatus,'unregistered');assert.ok(model.world.getObjectByName('furniture:p').children.length);model.dispose();
});
test('replacement preserves door animation and media semantics',async()=>{
 const input={cols:8,rows:8,doorOpen:.5,layout:[{id:'door',type:'door',col:1,row:1},{id:'screen',type:'tft',col:2,row:0,wallY:2}]};let hinge,screen;
 const model=createLifeScene(input,{canvasFactory:()=>null,loadFurniture:async item=>{const a=new T.Group();if(item.type==='door'){hinge=new T.Group();hinge.userData.doorHinge=true;a.add(hinge);}else{screen=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial());screen.userData.mediaSurface='existing_shared_player';a.add(screen);}return a;}});await flush();assert.ok(Math.abs(hinge.rotation.y+.5*Math.PI*.48)<1e-10);assert.ok(screen.material.isMeshStandardMaterial);model.dispose();
});
test('late generic assets cannot reappear after a layout removal or disposal',async()=>{
 for(const dispose of [true,false]){let resolve;const asset=new T.Group(),model=createLifeScene({layout:[{id:'p',type:'plant'}]},{canvasFactory:()=>null,loadFurniture:()=>new Promise(r=>resolve=r)});await flush();if(dispose)model.dispose();else model.update({layout:[]});resolve(asset);await flush();assert.equal(asset.parent,null);model.dispose();}
});
test('exhibition does not read or write the live placement store',()=>{const code=fs.readFileSync(new URL('./conjunto/showroom.mjs',import.meta.url),'utf8');assert.doesNotMatch(code,/localStorage|XpaceInventory|saveLayout|shopLayout/);});
