import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STARBUCKS_TPV_PLAYLIST as playlist,STARBUCKS_TPV_MAPPING as mapping,withStarbucksTPV} from './starbucks-tpv.mjs';
import {STARBUCKS_WALL_MAPPING} from './starbucks-screens.mjs';
import {validateMapping,quadTransform} from './matrix-mapping.mjs';
import {screenSlice} from './screen-display.mjs';
test('published POS contracts match runtime; separate local advert on a valid portrait quad',async()=>{
 for(const [name,value] of [['starbucks-tpv-playlist.json',playlist],['starbucks-tpv-mapping.json',mapping]])assert.deepEqual(JSON.parse(await readFile(new URL('../'+name,import.meta.url))),value);
 assert.deepEqual(playlist.tracks.map(t=>t.stockNumber),[1315,1317]);
 const [p]=validateMapping(mapping).players;assert.equal(p.playerId,'');assert.equal(new URL(p.url).protocol,'https:');assert.equal(p.width/p.height,360/640);assert.ok(quadTransform(p.corners.map(c=>({x:c.yaw,y:c.pitch}))));
 for(const mode of ['individual','groups','total'])assert.equal(screenSlice(p.id,mode),null);
});
test('seeding TPV preserves user wall data, does not duplicate a customized TPV and respects capacity',()=>{
 const old=structuredClone(STARBUCKS_WALL_MAPPING);old.players[0].name='Custom';const snapshot=structuredClone(old);const next=withStarbucksTPV(old);assert.deepEqual(old,snapshot);assert.equal(next.players.length,7);assert.deepEqual(next.players.slice(0,6),old.players);
 next.players[6].url='https://example.com/custom.mp4';next.players[6].corners[0].yaw+=1;assert.equal(withStarbucksTPV(next),next);assert.notEqual(next.players[6].corners[0].yaw,mapping.players[0].corners[0].yaw);
 const full={...old,players:Array.from({length:24},(_,i)=>({...old.players[0],id:'custom-'+i}))};assert.equal(withStarbucksTPV(full),full);
});
