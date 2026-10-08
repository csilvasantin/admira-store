import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {qualityProfiles,selectedQuality,isPhotoreal} from './quality-model.mjs';
import {furnitureURL} from '../admira-xp/scripts/furniture-asset.mjs';

const glb=url=>{const bytes=fs.readFileSync(url);assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);return {bytes,doc:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)))};};

test('Hiperreal is the fifth finish of piece 47 with its own versioned GLB and Blender source',()=>{
 assert.deepEqual(qualityProfiles(47),['good','better','best','matrix','hiperreal']);
 assert.equal(selectedQuality(47,'hiperreal'),'hiperreal');assert.equal(selectedQuality(99,'hiperreal'),'best');// every catalog piece 1–52 has Hiperreal now; 99 does not exist
 assert.equal(isPhotoreal(47,'hiperreal'),true);assert.equal(isPhotoreal(47,'matrix'),true);assert.equal(isPhotoreal(47,'best'),false);assert.equal(isPhotoreal(99,'hiperreal'),false);
 for(const extension of ['glb','blend']){const url=new URL(furnitureURL(47,'hiperreal',extension));assert.match(url.pathname,new RegExp('/47/hiperreal\\.'+extension+'$'));assert.equal(url.searchParams.get('v'),'coffee47-hiperreal-20261008-1');assert.ok(fs.existsSync(url),url.pathname+' missing');}
});

test('Hiperreal web and HD GLBs keep the 115 product identities, embed textures and stay lighter than Matrix',()=>{
 const web=glb(new URL(furnitureURL(47,'hiperreal'))),hd=glb(new URL('./assets/catalog/47/hiperreal/hiperreal-hd.glb',import.meta.url)),matrix=fs.statSync(new URL(furnitureURL(47,'matrix'))).size;
 for(const {doc} of [web,hd]){
  const products=doc.nodes.filter(node=>node.extras?.visual_only===true);
  assert.equal(products.length,115);assert.equal(new Set(products.map(node=>node.extras.component_id)).size,115);assert.equal(new Set(products.map(node=>node.extras.sku)).size,26);
  assert.ok(products.every(node=>node.extras.hiperreal_variation===true&&node.children?.length>0));
  assert.ok(doc.nodes.some(node=>node.extras?.inventoryNumber===47&&node.extras?.inventoryId==='native:starbucksShelves'));
  assert.ok(doc.images.length>0&&doc.images.every(image=>'bufferView' in image&&!image.uri));assert.ok(doc.buffers.every(buffer=>!buffer.uri));
  assert.ok(doc.extensionsUsed.includes('KHR_materials_clearcoat'));
 }
 assert.ok(web.doc.extensionsUsed.includes('EXT_texture_webp'));
 assert.ok(web.bytes.length<8e6,'web GLB must stay under 8 MB');assert.ok(web.bytes.length<matrix/2,'web GLB lighter than Matrix');
 assert.ok(hd.bytes.length>web.bytes.length*3,'HD keeps 2K-4K textures');
 const hdOak=hd.doc.images.find(image=>/oak_honey_basecolor/.test(image.name||''));assert.ok(hdOak,'HD keeps the 4K honey-oak basecolor');
});

test('Hiperreal studio lighting ships a local CC0 HDRI',()=>{
 const hdr=fs.readFileSync(new URL('./assets/catalog/47/hiperreal/comfy_cafe_1k.hdr',import.meta.url));
 assert.match(hdr.toString('ascii',0,10),/^#\?RADIANCE|^#\?RGBE/);
 const source=fs.readFileSync(new URL('./matrix-rendering.mjs',import.meta.url),'utf8');
 assert.match(source,/createHiperrealStudio/);assert.match(source,/assets\/catalog\/47\/hiperreal\/comfy_cafe_1k\.hdr/);
});
