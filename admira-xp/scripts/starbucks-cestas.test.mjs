import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import './starbucks-room.js';
import {STARBUCKS_CATALOG_BODY} from './life-scene.mjs';
import {CATALOG_COLLISION_BOUNDS} from './catalog-collision-bounds.mjs';
import {furnitureURL} from './furniture-asset.mjs';
import {assetForInstance} from '../../inventario/model.mjs';

// Cestas trenzadas del Starbucks Paseo de Gràcia desde las fotos de Carlos (17-10-2026).
// Woven baskets of the Paseo de Gràcia Starbucks, from Carlos's 17-10-2026 photos.
const room=globalThis.XpaceStarbucks;
const json=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const BASKETS={'sb-cup-basket':['native:starbucksCupBasket',53],'sb-snack-basket':['native:starbucksSnackBasket',54],'sb-coffee-basket':['native:starbucksCoffeeBasket',55]};
const extent=group=>({minX:Math.min(...group.parts.map(p=>p.x)),maxX:Math.max(...group.parts.map(p=>p.x+p.w)),minZ:Math.min(...group.parts.map(p=>p.z)),maxZ:Math.max(...group.parts.map(p=>p.z+p.d))});
const overlap=(a,b)=>a.minX<b.maxX&&b.minX<a.maxX&&a.minZ<b.maxZ&&b.minZ<a.maxZ;

test('the three baskets are placed in the twin with catalog models 53, 54 and 55',()=>{
 const registry=json('../../inventario/registry.json'),layout=room.layout();
 for(const [id,[asset,number]] of Object.entries(BASKETS)){
  const item=layout.find(i=>i.id===id);assert.ok(item,id);
  assert.equal(assetForInstance(item),asset);assert.equal(registry.numbers[asset],number);
  assert.equal(STARBUCKS_CATALOG_BODY[id],Infinity);assert.deepEqual(item.fp,[.64,.64]);
  const bounds=CATALOG_COLLISION_BOUNDS[asset];assert.ok(bounds[0]>-.05&&bounds[1]<.7&&bounds[2]>-.05&&bounds[3]<.7,asset);
  for(const tier of ['good','better','best'])assert.match(furnitureURL(number,tier),new RegExp(`/catalog/${number}/${tier}\\.glb$`));
  const manifest=json(`../../inventario/assets/catalog/${number}/best.manifest.json`);
  assert.equal(manifest.id,asset);assert.equal(manifest.origin,'footprint_corner');assert.equal(manifest.measured,false);assert.equal(manifest.stock_quantity_verified,false);
 }
});

test('baskets keep clear of the pillar, the counter, the shelf and each other in every style',()=>{
 for(const quality of ['good','better','best']){
  const groups=room.build(room.layout(),{quality}),byId=Object.fromEntries(groups.filter(g=>g.item).map(g=>[g.id,extent(g)]));
  const fixed=['sb-pillar','sb-pos','sb-mugs','sb-table-a'].map(id=>byId[id]),baskets=Object.keys(BASKETS).map(id=>byId[id]);
  for(const b of baskets){assert.ok(b.maxX-b.minX<=.64&&b.maxZ-b.minZ<=.64);for(const f of fixed)assert.equal(overlap(b,f),false);}
  for(let i=0;i<baskets.length;i++)for(let j=i+1;j<baskets.length;j++)assert.equal(overlap(baskets[i],baskets[j]),false);
 }
});

test('basket models carry their products as separate, unverified visual items',()=>{
 const counts={53:28,54:26,55:11};
 for(const [number,count] of Object.entries(counts)){
  const manifest=json(`../../inventario/assets/catalog/${number}/best.manifest.json`);
  assert.equal(manifest.visual_cup_count??manifest.visual_bag_count,count);assert.deepEqual(manifest.footprint_m,[.64,.64]);
 }
 assert.equal(json('../../inventario/assets/catalog/54/best.manifest.json').snack_brands_confirmed,false);
});
