import test from 'node:test';
import assert from 'node:assert/strict';
import {SCREEN,MirrorSession,playbackState,targetTime,allowedOrigin,exteriorPassages,exteriorStatistics,PassageState,acceptsCameraFrame} from './xtore-window-core.mjs';
import {boundedPosition} from './floating-window.mjs';
const p={id:'bicycle',url:'https://stock.admira.store/video.mp4',type:'video',title:'Bici',position:90,duration:180,paused:false,rate:1,ts:10000,loop:false};
test('a fresh clean inference upgrades a newer raw preview without extending capture lifetime',()=>{
 // Raw @10500 arrives before analysis of the frame captured @10000 finishes.
 assert.equal(acceptsCameraFrame(10000,true,10500,false,10574),true);
 // Once clean, duplicates and older processed frames cannot roll it back.
 assert.equal(acceptsCameraFrame(10000,true,10000,true,10750),false);
 assert.equal(acceptsCameraFrame(9900,true,10000,true,10750),false);
 assert.equal(acceptsCameraFrame(10200,true,10000,true,10750),true);
 assert.equal(acceptsCameraFrame(10000,true,11000,false,11500),false);
 assert.equal(acceptsCameraFrame(10000,false,10500,false,10574),false);
 assert.equal(acceptsCameraFrame(NaN,true,10500,false,10574),false);
 assert.equal(acceptsCameraFrame(12000,true,10500,false,10574),false);
});
test('only the selected window, origin, session and virtual screen can drive a mirror',()=>{
 const peer={},s=new MirrorSession({peer,origin:'https://admira.tv',session:'abc',now:()=>10000});
 const message={source:peer,origin:'https://admira.tv',data:{source:'admira-xtore-twin',screen:SCREEN,session:'abc',event:'playback',seq:1,ts:10000}};
 for(const bad of [{source:{}},{origin:'https://evil.test'},{data:{...message.data,screen:'other'}},{data:{...message.data,session:'other'}}])assert.equal(s.receive({...message,...bad}),null);
 assert.equal(s.receive(message).event,'playback');assert.equal(s.receive(message),null);
 assert.equal(s.receive({...message,data:{...message.data,seq:2,ts:5000}}),null);
 assert.equal(s.receive({...message,data:{...message.data,seq:2,ts:12000}}),null);
});
test('stale and unsafe media cannot keep showing an old conditional decision',()=>{
 assert.ok(playbackState(p,11000));assert.equal(playbackState(p,12501),null);
 for(const bad of [{url:'javascript:alert(1)'},{url:'http://localhost/private'},{url:'https://user:secret@stock.admira.store/a'},{type:'interactive'},{position:NaN},{position:-1},{rate:100},{paused:'false'},{ts:15000}])assert.equal(playbackState({...p,...bad},10000),null);
});
test('mirror follows the source time, preserves bicycle midpoint and never restarts on presence renewal',()=>{
 assert.equal(targetTime(p,10500),90.5);
 assert.equal(targetTime({...p,position:91,ts:11000},11500),91.5);
 assert.equal(targetTime({...p,paused:true},12000),90);
 assert.equal(targetTime({...p,position:179.9},12000),179.95);
 assert.equal(targetTime({...p,position:0,loop:true},10000),0);
});
test('production only accepts Admira origins; local test origins cannot be enabled remotely',()=>{
 assert.equal(allowedOrigin('https://admira.tv','https://xpaceos.com'),true);
 assert.equal(allowedOrigin('https://admira.tv.evil.test','https://xpaceos.com'),false);
 assert.equal(allowedOrigin('http://localhost:8791','https://xpaceos.com'),false);
 assert.equal(allowedOrigin('http://localhost:8791','http://localhost:8792'),true);
});
test('exterior uses person passages, never current presence or simulated pedestrians',()=>{
 const totals={person:17,car:5,motorcycle:2,bicycle:1};
 assert.equal(exteriorPassages(totals,10000,10500),17);
 assert.equal(exteriorPassages(totals,10000,10500),17); // repeated reports are snapshots
 assert.equal(exteriorPassages({...totals,person:0},10600,11000),0); // source reset
 for(const data of [null,{person:17},{...totals,person:-1},{...totals,person:NaN},{...totals,person:1.5}])assert.equal(exteriorPassages(data,10000,10500),null);
 assert.equal(exteriorPassages(totals,10000,11500),null);
 assert.equal(exteriorPassages(totals,12000,10000),null);
});
test('floating tools keep their header reachable after dragging or viewport resize',()=>{
 assert.deepEqual(boundedPosition(-100,-40,360,500,1000,800),{x:8,y:8});
 assert.deepEqual(boundedPosition(900,750,360,500,1000,800),{x:632,y:292});
 assert.deepEqual(boundedPosition(200,400,360,500,300,250),{x:8,y:8});
});

test('DooH keeps all five categories, resets and absence distinct from zero',()=>{
 const counts={person:19,car:5,motorcycle:2,bicycle:3,scooter:4};
 assert.deepEqual(exteriorStatistics(counts,10000,10500),counts);
 assert.deepEqual(exteriorStatistics({...counts,scooter:0},10000,10500),{...counts,scooter:0});
 const {scooter,...legacy}=counts;
 assert.deepEqual(exteriorStatistics(legacy,10000,10500),{...legacy,scooter:null});
 assert.equal(exteriorStatistics({...counts,scooter:-1},10000,10500).scooter,null);
 assert.equal(exteriorStatistics(counts,10000,11500),null);
 assert.equal(exteriorStatistics({...counts,car:-1},10000,10500),null);
});

test('authoritative totals survive a camera pause, accept reset and cannot be rolled back by old camera data',()=>{
 let now=10000;const state=new PassageState(()=>now),counts={person:47,car:0,motorcycle:1,bicycle:3,scooter:0};
 assert.equal(state.update(counts,10000,true),true);now=12000;assert.equal(state.read().person,47);
 assert.equal(state.update({...counts,person:40},12000,false),false);assert.equal(state.read().person,47);
 assert.equal(state.update({...counts,person:0},12000,true),true);assert.equal(state.read().person,0);
 assert.equal(state.update(counts,10000,true),false);now=16000;assert.equal(state.read(),null);
 state.clear();now=20000;assert.equal(state.update(counts,20000,false),true);now=21500;assert.equal(state.read(),null);
});
