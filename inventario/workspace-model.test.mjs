import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {inventoryRows} from './workspace-model.mjs';import {numberedCatalog} from './model.mjs';
import {STARBUCKS_WALL_MAPPING} from '../admira-xp/scripts/starbucks-screens.mjs';import {STARBUCKS_TPV_MAPPING} from '../admira-xp/scripts/starbucks-tpv.mjs';
const json=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url))),catalog=json('./catalog.json'),assets=numberedCatalog(catalog.native,json('./pixeria-cache.json').items,json('./registry.json'));
test('count reflects units, not models; duplicate IDs and absent IDs are ignored',()=>{
 const rows=inventoryRows({space:'xtanco',assets,layout:[{id:'a',type:'counter'},{id:'b',type:'counter'},{id:'a',type:'counter'},{}]});assert.equal(rows.length,2);assert.equal(rows[0].asset,rows[1].asset);assert.deepEqual(inventoryRows({assets}),[]);
});
test('retained removals count once and belong to the supplied Xpace ledger',()=>{
 const removed={shelves:{id:'shelves',type:'shelves'}};const rows=inventoryRows({space:'xtanco',assets,layout:[{id:'counter',type:'counter'},{id:'shelves',type:'shelves'}],removed});assert.equal(rows.length,2);assert.equal(rows[1].retired,true);assert.equal(rows[1].placed,false);assert.equal(inventoryRows({space:'other',assets,layout:[],removed:{}}).length,0);
});
test('Starbucks count includes 12 registered units and 8 other IoT records, preserving permanent model IDs',()=>{
 const units=json('./starbucks/manifest.json').units,devices=[...STARBUCKS_WALL_MAPPING.players,...STARBUCKS_TPV_MAPPING.players,{id:'starbucks-alsea-paseo-de-gracia',name:'Altavoz'}];
 const rows=inventoryRows({space:'starbucks_pg103',assets,units,devices,layout:[{id:'sb-pillar',type:'shelves'},...units.map(unit=>({id:unit.instance_id,type:'counter'}))]});assert.equal(rows.length,20);assert.equal(rows.filter(row=>row.virtual).length,9);assert.equal(rows.find(row=>row.id==='sb-mugs').asset.number,47);assert.equal(rows.filter(row=>row.asset?.number===49).length,4);assert.ok(rows.every(row=>!row.asset||row.asset.number>=44));assert.ok(rows.every(row=>row.id!=='sb-pillar'));
 const other=inventoryRows({space:'xtanco',assets,units,devices,layout:catalog.layouts.xtanco});assert.ok(other.every(row=>!row.id.startsWith('sb-')&&!row.virtual));
});
test('explicit imports add a unit to their target only; unnumbered units keep their identity',()=>{
 const layout=[{id:'own',type:'custom',label:'Pieza propia'}];const rows=inventoryRows({space:'xtanco',assets,layout});assert.equal(rows[0].id,'own');assert.equal(rows[0].asset,undefined);assert.equal(rows[0].name,'Pieza propia');assert.equal(inventoryRows({space:'other',assets,layout:[]}).length,0);
});
