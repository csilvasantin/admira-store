import test from 'node:test';
import assert from 'node:assert/strict';
import {physicalIPadTracks,createIPadPlaylistWatch,IPAD_SCREEN,IPAD_POLL_MS} from '../admira-xp/scripts/ipad-physical-playlist.mjs';
import {onRequest,IPAD_SOURCE} from '../functions/admira-xp/api/ipad-playlist.js';
const item=id=>({id:'stock-'+id,stockId:id,title:id,asset:'https://api.admira.store/stock/asset/'+id,assetType:'video',seconds:10});
const playlist=(items,auto=[])=>({ok:true,draft:{screen:IPAD_SCREEN,items,rev:10},auto});
test('physical draft then auto keeps order and removes duplicate stock IDs without importing a catalogue',()=>{
 assert.deepEqual(physicalIPadTracks(playlist([item('one'),item('two')],[item('one')])).map(t=>t.id),['one','two']);
 assert.throws(()=>physicalIPadTracks(playlist([{...item('bad'),asset:'http://example.com/video.mp4'}])));
 assert.throws(()=>physicalIPadTracks({ok:false}));assert.throws(()=>physicalIPadTracks({ok:true,draft:{items:[]}}));
 assert.deepEqual(physicalIPadTracks(playlist([])),[]);
});
test('proxy reads only the fixed physical screen, returns no operator metadata and rejects writes',async()=>{
 const calls=[],fetcher=async(url,options)=>{calls.push({url,options});return Response.json(playlist([item('one'),item('two')]));};
 const response=await onRequest({request:new Request('https://www.admira.store/admira-xp/api/ipad-playlist?screen=other',{headers:{Authorization:'Bearer private'}})},fetcher);
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.screen,IPAD_SCREEN);assert.deepEqual(data.tracks.map(t=>t.id),['one','two']);assert.equal(data.draft,undefined);
 assert.equal(calls[0].url,IPAD_SOURCE);assert.equal(calls[0].options.headers.Authorization,undefined);
 assert.equal((await onRequest({request:new Request('https://example.com',{method:'POST'})},fetcher)).status,405);assert.equal(calls.length,1);
 assert.equal((await onRequest({request:new Request('https://example.com')},async()=>Response.json({ok:false}))).status,502);
});
test('one bounded watcher serves all consumers, retains last valid list on failure and stops after unsubscribe',async()=>{
 const timers=new Map();let seq=0,mode='valid',calls=0;
 const clock={setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
 const fetcher=async()=>{calls++;if(mode==='offline')throw Error('offline');return Response.json(mode==='malformed'?{ok:true,screen:IPAD_SCREEN,tracks:[{id:'broken'}]}:{ok:true,screen:IPAD_SCREEN,tracks:physicalIPadTracks(playlist([item('one'),item('two')]))});};
 const watch=createIPadPlaylistWatch({fetcher,timers:clock}),a=[],b=[];
 const stopA=watch(v=>a.push(v));const flush=()=>new Promise(setImmediate);await flush();const stopB=watch(v=>b.push(v));assert.equal(calls,1);assert.deepEqual(b.at(-1).tracks.map(t=>t.id),['one','two']);
 const tick=async()=>{const entry=[...timers].find(([,t])=>t.ms===IPAD_POLL_MS);assert.ok(entry);timers.delete(entry[0]);entry[1].fn();await flush();};
 mode='offline';await tick();assert.equal(a.at(-1).error,true);assert.deepEqual(a.at(-1).tracks.map(t=>t.id),['one','two']);
 mode='malformed';await tick();assert.equal(b.at(-1).error,true);assert.equal(b.at(-1).tracks.length,2);
 mode='valid';await tick();assert.equal(a.at(-1).error,false);stopA();assert.equal(timers.size,1);stopB();assert.equal(timers.size,0);
});

test('first unavailable read reports no fabricated playlist before any physical snapshot',async()=>{
 const pending=new Map(),seen=[];let seq=0;
 const timers={setTimeout(fn,ms){const id=++seq;pending.set(id,{fn,ms});return id;},clearTimeout:id=>pending.delete(id)};
 const watch=createIPadPlaylistWatch({fetcher:async()=>{throw Error('offline');},timers});const stop=watch(v=>seen.push(v));await new Promise(setImmediate);
 assert.equal(seen.length,1);assert.equal(seen[0].error,true);assert.equal(seen[0].tracks,null);stop();assert.equal(pending.size,0);
});
