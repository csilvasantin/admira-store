import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {componentsFor,componentLabel,breakdownURL,loadComponents} from './breakdown-model.mjs';
const read=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url)));
const data=read('./components.json'),registry=read('./registry.json');
const find=(number,id)=>componentsFor(data,{id:Object.keys(registry.numbers).find(key=>registry.numbers[key]===number),number}).groups.flatMap(group=>group.components).find(part=>part.id===id);
test('composition covers each immutable catalogue identity with bilingual parts and resolvable provenance',()=>{
 assert.equal(data.schema_version,1);assert.equal(data.assets.length,Object.keys(registry.numbers).length);assert.equal(new Set(data.assets.map(asset=>asset.id)).size,data.assets.length);
 function parts(list){assert.ok(list.length);assert.equal(new Set(list.map(part=>part.id)).size,list.length);for(const part of list){assert.ok(part.label.es&&part.label.en);assert.ok(part.quantity===null||(Number.isInteger(part.quantity)&&part.quantity>0));if(part.components){assert.equal(part.quantity_scope,'per_parent_unit');parts(part.components);}}}
 for(const asset of data.assets){assert.equal(registry.numbers[asset.id],asset.number);assert.equal(asset.profile,'best');assert.equal(asset.basis,'model');assert.ok(asset.source.length);for(const path of asset.source){assert.match(path,/^[\w./-]+$/);assert.ok(!path.includes('..'));assert.ok(fs.existsSync(new URL('../'+path,import.meta.url)));}for(const group of asset.groups){assert.ok(group.label.es&&group.label.en);parts(group.components);}}
 assert.equal(componentsFor(data,{id:'native:shelves',number:1}),null);
});
test('detailed shelf and water rack quantities agree with their model manifests',()=>{
 const shelf=read('./assets/catalog/02/best.manifest.json');assert.equal(find(2,'shelves').quantity,shelf.shelf_levels);assert.equal(['bottles','pouches','cartons'].reduce((sum,id)=>sum+find(2,id).quantity,0),shelf.display_products);
 const rack=read('./starbucks/manifest.json').units.find(unit=>unit.asset_number===50);assert.equal(find(50,'bottles').quantity,rack.visual_filling.bottle_count);
 assert.match(find(2,'bottles').note.es,/stock/);assert.match(find(50,'bottles').note.en,/stock/);
});
test('shareable breakdown links retain venue branding and target the same Best asset in either language',()=>{
 const url=breakdownURL('https://www.xpaceos.com/inventario/?marca=Admira&asset=1&quality=better#mostrador',{id:'native:shelves',number:2},'en');assert.equal(url.searchParams.get('marca'),'Admira');assert.equal(url.searchParams.get('asset'),'2');assert.equal(url.searchParams.get('quality'),'best');assert.equal(url.searchParams.get('view'),'breakdown');assert.equal(url.searchParams.get('lang'),'en');assert.equal(url.hash,'#catalog');assert.equal(componentLabel({es:'Baldas',en:'Shelves'},'en'),'Shelves');
});
test('composition loading reports HTTP failures and rejects incompatible datasets',async()=>{
 await assert.rejects(loadComponents(async()=>({ok:false})),/unavailable/);await assert.rejects(loadComponents(async()=>({ok:true,json:async()=>({schema_version:9,assets:[]})})),/unsupported/);assert.equal(await loadComponents(async()=>({ok:true,json:async()=>data})),data);
});
