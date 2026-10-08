import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {qualityProfiles,HIPERREAL_BATCHES,HIPERREAL_ASSET_NUMBERS,hasHiperreal,isPhotoreal,twinQualityChain} from './quality-model.mjs';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs';

const glb=url=>{const bytes=fs.readFileSync(url);assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);return {bytes,doc:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))};};
const TANDA1=[19,20,21,22,23,24,25,26,27];

test('batch 4 adds Hiperreal to the first Pixeria pieces (19–27); Matrix stays exclusive to 47',()=>{
 assert.deepEqual([...HIPERREAL_BATCHES[4]],TANDA1);for(const n of [44,45,46,47,48,49,50,52])assert.ok(HIPERREAL_ASSET_NUMBERS.includes(n));
 for(const n of TANDA1){assert.deepEqual(qualityProfiles(n),['good','better','best','hiperreal']);assert.equal(isPhotoreal(n,'hiperreal'),true);assert.equal(isPhotoreal(n,'matrix'),false);assert.deepEqual(twinQualityChain(n),['hiperreal','best']);}
 assert.deepEqual(twinQualityChain(47),['hiperreal','matrix','best']);assert.deepEqual(twinQualityChain(1),['hiperreal','best']);assert.deepEqual(twinQualityChain(44,'better'),['better']);
 assert.equal(hasHiperreal(1),true);
});

test('batch 4 web GLBs are light WebP LODs that keep every node and inventory identity of Best',()=>{
 for(const n of TANDA1){
  const url=new URL(furnitureURL(n,'hiperreal'));assert.equal(url.searchParams.get('v'),'hiperreal-tanda4-20261008-'+([19,20,23,27].includes(n)?2:1));
  const web=glb(url),hd=glb(new URL(`./assets/catalog/${String(n).padStart(2,"0")}/hiperreal/hiperreal-hd.glb`,import.meta.url)),best=glb(new URL(furnitureURL(n,'best')));
  assert.ok(web.bytes.length<=5e6,n+' web GLB ≤ 5 MB');assert.ok(hd.bytes.length>web.bytes.length,n+' HD heavier than web');
  assert.ok(web.doc.extensionsUsed.includes('EXT_texture_webp'));assert.ok(web.doc.images.every(image=>'bufferView' in image&&!image.uri));
  for(const {doc} of [web,hd]){
   // 2: best.glb merges parts by finish; Hiperreal is built from best.blend and keeps every separate part.
   if(n===2)assert.ok(doc.nodes.length>=best.doc.nodes.length,'2 keeps at least as many parts as Best');
   else{const names=new Set(doc.nodes.map(node=>node.name));for(const node of best.doc.nodes)assert.ok(names.has(node.name),n+' keeps Best node '+node.name);}
   assert.ok(doc.nodes.some(node=>node.extras?.inventoryNumber===n),n+' inventoryNumber preserved');
   assert.ok(doc.extensionsUsed.includes('KHR_materials_clearcoat'));
  }
  const manifest=JSON.parse(fs.readFileSync(new URL(`./assets/catalog/${String(n).padStart(2,"0")}/hiperreal.manifest.json`,import.meta.url)));
  assert.equal(manifest.number,n);assert.equal(manifest.tier,'hiperreal');assert.equal(manifest.batch,4);
  for(const name of manifest.textures)assert.ok(fs.existsSync(new URL('./assets/hiperreal-tex/'+name,import.meta.url)),name+' shared texture');
  assert.ok(fs.existsSync(new URL(furnitureURL(n,'hiperreal','blend'))));
  assert.ok(fs.existsSync(new URL(`./assets/catalog/${String(n).padStart(2,"0")}/hiperreal/preview/hiperreal-${n}-comparativa.jpg`,import.meta.url)),n+' comparison');
 }
 const ipad=glb(new URL(furnitureURL(52,'hiperreal'))).doc;assert.ok(ipad.nodes.some(node=>node.extras?.mediaSurface==='landscape_ipad'&&node.extras?.surfaceId==='starbucks-ipad-01'),'iPad keeps its live screen surface');
});
