import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {inventoryName,inventoryCategory,inventoryCaption,localizedRow,cafeRecordName} from './labels.mjs';
import {inventoryRows} from './workspace-model.mjs';import {numberedCatalog} from './model.mjs';
const json=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url))),catalog=json('./catalog.json'),registry=json('./registry.json'),assets=numberedCatalog(catalog.native,json('./pixeria-cache.json').items,registry);
test('all authored catalogue, layout and café names have English presentation; canonical data remains Spanish',()=>{
 for(const a of assets)assert.ok(inventoryName(a.name,'en')!==a.name||['Cactus','LED Banner'].includes(a.name),a.name);
 for(const layout of Object.values(catalog.layouts))for(const item of layout)assert.ok(inventoryName(item.label,'en')!==item.label||['LED Banner','Metahuman AI'].includes(item.label),item.label);
 for(const r of json('./cafebreria/scene.inventory.json').items){assert.notEqual(cafeRecordName(r,r,'en'),r.nombre,r.id);assert.equal(cafeRecordName(r,r,'es'),r.nombre);}
});
test('Starbucks names, model, category and counter follow locale while IDs and canonical sources stay unchanged',()=>{
 const input={space:'starbucks_pg103',assets,units:json('./starbucks/manifest.json').units,layout:[{id:'sb-pastry',type:'counter',label:'Vitrina · Bollería y bebidas'}]},raw=inventoryRows(input),before=JSON.stringify(input),en=raw.map(r=>localizedRow(r,'en')),es=raw.map(r=>localizedRow(r,'es'));
 const selected=en.find(r=>r.id==='sb-pastry');assert.equal(selected.name,'Display case · Pastries and drinks');assert.equal(selected.asset.name,'Starbucks display case');assert.equal(selected.category,'Furniture');assert.equal(selected.code,'PDG103-VIT-01');assert.equal(es.find(r=>r.id==='sb-pastry').name,'Vitrina · Bollería y bebidas');assert.deepEqual(en.map(r=>r.id),es.map(r=>r.id));assert.equal(JSON.stringify(input),before);assert.equal(inventoryCaption(19,'es'),'Inventario/ITIL · 19 elementos');assert.equal(inventoryCaption(19,'en'),'Inventory/ITIL · 19 items');assert.equal(inventoryCategory('Iluminacion','es'),'Iluminación');
});
test('custom names and untranslated identifiers survive both language changes and exports',()=>{
 const original={id:'barra',nombre:'Barra frente verde friso + encimera roble'},custom={...original,nombre:'Mi barra personal'};
 for(const lang of ['en','es']){assert.equal(cafeRecordName(custom,original,lang),custom.nombre);assert.equal(cafeRecordName({nombre:'Nombre importado'},undefined,lang),'Nombre importado');assert.equal(localizedRow({name:'Nombre importado',item:{type:'custom'},category:'Pixeria'},lang).name,'Nombre importado');}
 assert.equal(inventoryName('PDG103-VIT-01','en'),'PDG103-VIT-01');
});
