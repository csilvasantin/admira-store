import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {qualityProfiles,HIPERREAL_BATCHES,hasHiperreal,isPhotoreal,twinQualityChain,HIPERREAL_REVISION} from './quality-model.mjs';
import {furnitureURL,cloneTwinFurniture} from '../admira-xp/scripts/furniture-asset.mjs';
import {counterURL,hiperrealExtrasBase} from '../admira-xp/scripts/counter-asset.mjs';

const glb=url=>{const bytes=fs.readFileSync(url);assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);return {bytes,doc:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))};};
const local=href=>{const u=new URL(href);u.search='';return u;};

test('r22 · Mostrador (pieza 1) gains Hiperreal: allowed quality, twin Best chain Hiperreal -> Best, same IDs',async()=>{
 assert.deepEqual([...HIPERREAL_BATCHES[7]],[1]);assert.equal(hasHiperreal(1),true);
 assert.deepEqual(qualityProfiles(1),['good','better','best','hiperreal']);assert.equal(isPhotoreal(1,'hiperreal'),true);assert.equal(isPhotoreal(1,'matrix'),false);
 assert.deepEqual(twinQualityChain(1),['hiperreal','best']);assert.deepEqual(twinQualityChain(1,'better'),['better']);
 assert.match(furnitureURL(1,'hiperreal'),/inventario\/assets\/mostrador\/counter-interpreted-hiperreal\.glb\?v=hiperreal-tanda7-20261008-1$/);
 assert.equal(furnitureURL(1,'best'),counterURL('best'));assert.throws(()=>counterURL('matrix'));assert.throws(()=>counterURL('../x'));
 assert.equal(hiperrealExtrasBase(1),'/inventario/assets/mostrador/hiperreal/');assert.equal(hiperrealExtrasBase(7),'/inventario/assets/catalog/07/hiperreal/');
 const tried=[];const root=await cloneTwinFurniture(1,'best',async(n,q)=>{tried.push(q);if(q==='hiperreal')throw Error('offline');return {userData:{}};});
 assert.deepEqual(tried,['hiperreal','best']);assert.equal(root.userData.assetQuality,'best');
 const web=glb(local(furnitureURL(1,'hiperreal'))),hd=glb(new URL('./assets/mostrador/hiperreal/hiperreal-hd.glb',import.meta.url)),best=glb(local(counterURL('best')));
 assert.ok(web.bytes.length<=5e6,'web ≤ 5 MB');assert.ok(hd.bytes.length>web.bytes.length);assert.ok(web.doc.extensionsUsed.includes('EXT_texture_webp'));
 for(const {doc} of [web,hd]){
  const names=new Set(doc.nodes.map(n=>n.name));for(const node of best.doc.nodes)assert.ok(names.has(node.name),'keeps Best node '+node.name);
  assert.ok(!names.has('studio_ground_not_exported'),'studio ground stays out');
  const root=doc.nodes.find(n=>n.extras?.inventoryNumber===1);assert.ok(root);assert.equal(root.extras.inventoryId,'native:counter');assert.equal(root.extras.assetId,'xtanco.counter.interpreted.v1');
  assert.ok(doc.nodes.some(n=>n.extras?.mediaSurface==='existing_shared_player'),'TPV keeps its live media surface');
  for(const n of best.doc.nodes.filter(n=>n.extras?.componentId))assert.equal(doc.nodes.find(m=>m.name===n.name).extras.componentId,n.extras.componentId);
 }
 const manifest=JSON.parse(fs.readFileSync(new URL('./assets/mostrador/counter-interpreted-hiperreal.manifest.json',import.meta.url)));
 assert.equal(manifest.quality,'hiperreal');assert.equal(manifest.inventory_number,1);assert.equal(manifest.inventory_id,'native:counter');
 for(const name of manifest.hiperreal.textures)assert.ok(fs.existsSync(new URL('./assets/hiperreal-tex/'+name,import.meta.url)),name);
 assert.ok(fs.existsSync(local(furnitureURL(1,'hiperreal','blend'))));
 assert.ok(fs.existsSync(new URL('./assets/mostrador/hiperreal/preview/hiperreal-1-comparativa.jpg',import.meta.url)));
});

test('r22 · small glass in the web LOD becomes opaque gloss (2 bottles, 19/20/23 lamps); HD keeps real glass; big glass (46) untouched',()=>{
 for(const n of [2,19,20,23])assert.ok(HIPERREAL_REVISION[n]>=(n===2?3:2));
 const pad=n=>String(n).padStart(2,'0');
 for(const n of [2,19,20,23]){
  const web=glb(local(furnitureURL(n,'hiperreal'))).doc,hd=glb(new URL(`./assets/catalog/${pad(n)}/hiperreal/hiperreal-hd.glb`,import.meta.url)).doc;
  assert.ok(!web.materials.some(m=>m.extensions?.KHR_materials_transmission),n+' web: no transmission left');
  assert.ok(web.materials.some(m=>m.extras?.hiperreal_web==='glass->gloss'),n+' web: converted');
  assert.ok(hd.materials.some(m=>m.extensions?.KHR_materials_transmission),n+' HD keeps glass');
 }
 assert.ok(glb(local(furnitureURL(46,'hiperreal'))).doc.materials.some(m=>m.extensions?.KHR_materials_transmission),'46 showcase glass stays');
});
