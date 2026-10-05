import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STARBUCKS_IPAD_ID as id,STARBUCKS_IPAD_MAPPING,STARBUCKS_IPAD_PLAYLIST,withStarbucksIPad} from './starbucks-ipad.mjs';
import {DEVICE_IDS,assignedPlaylist,changeDeviceLayout,emptyDeviceLayout} from './device-layout.mjs';
import {validateMapping} from './matrix-mapping.mjs';
import {inventoryRows} from '../../inventario/workspace-model.mjs';
import {numberedCatalog} from '../../inventario/model.mjs';
import './starbucks-room.js';
const json=file=>JSON.parse(readFileSync(new URL(file,import.meta.url)));
test('empty landscape surface seeds once without replacing saved calibration or other players',()=>{
 assert.equal(DEVICE_IDS.length,8);assert.equal(assignedPlaylist(emptyDeviceLayout(),id),'ipad');
 assert.deepEqual(STARBUCKS_IPAD_PLAYLIST.tracks,[]);
 const original={version:1,capture:'alsea-starbucks-360',players:[]},next=withStarbucksIPad(original);
 assert.equal(original.players.length,0);assert.equal(next.players[0].playerId,'');assert.equal(next.players[0].width/next.players[0].height,4/3);
 next.players[0].corners[0].yaw=31;assert.equal(withStarbucksIPad(next),next);assert.equal(STARBUCKS_IPAD_MAPPING.players[0].corners[0].yaw,19.564034);validateMapping(next);
 const full={...original,players:Array.from({length:24},(_,i)=>({id:'old-'+i}))};assert.equal(withStarbucksIPad(full),full);
 for(const [file,value] of [['starbucks-ipad-mapping.json',STARBUCKS_IPAD_MAPPING],['starbucks-ipad-playlist.json',STARBUCKS_IPAD_PLAYLIST]])assert.deepEqual(json('../'+file),value);
});
test('iPad groups only on explicit assignment and reset restores its own empty base',()=>{
 let config=changeDeviceLayout(emptyDeviceLayout(),{action:'assign',device_ids:[id],playlist_id:'wall'});
 assert.equal(assignedPlaylist(config,id),'wall');assert.equal(assignedPlaylist(config,'starbucks-tpv-01'),'tpv');
 config=changeDeviceLayout(config,{action:'reset',device_ids:[id]});assert.equal(assignedPlaylist(config,id),'ipad');
});
test('one iPad CI counts once and is a horizontal drop target in every room quality',()=>{
 const manifest=json('../../inventario/starbucks/manifest.json'),registry=json('../../inventario/registry.json'),catalog=json('../../inventario/catalog.json');
 const assets=numberedCatalog(catalog.native,[],registry),unit=manifest.units.find(u=>u.device_id===id);
 assert.equal(unit.itil_code,'PDG103-IPAD-01');assert.equal(unit.physical_installation_verified,false);assert.equal(unit.asset_number,52);
 const rows=inventoryRows({space:'starbucks_pg103',assets,units:[unit],devices:STARBUCKS_IPAD_MAPPING.players,layout:globalThis.XpaceStarbucks.layout()});
 assert.equal(rows.filter(r=>r.id===id).length,1);assert.equal(rows.find(r=>r.id===id).virtual,true);
 for(const quality of ['good','better','best']){const faces=globalThis.XpaceStarbucks.build(undefined,{quality}).flatMap(g=>g.parts).filter(p=>p.device==='ipad');assert.equal(faces.length,1);assert.ok(faces[0].w>faces[0].h);assert.equal(globalThis.XpaceStarbucks.screenId(faces[0].device),id);}
});
