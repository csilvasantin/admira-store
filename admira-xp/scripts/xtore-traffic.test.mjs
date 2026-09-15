import test from 'node:test';
import assert from 'node:assert/strict';
import {TrafficState,validatedTraffic,MirrorSession,SCREEN,PassageState} from './xtore-window-core.mjs';
const track=(extra={})=>({id:1,kind:'person',box:[.1,.2,.2,.4],x:.2,y:.6,observedAt:9900,confirmed:true,...extra});
const frame=(extra={})=>({frameAt:10000,tracks:[track()],...extra});

test('wire schema admits only confirmed normalized geometry and explicit manual scooter tracks',()=>{
  assert.ok(validatedTraffic(frame(),10000));
  for(const extra of [{id:0},{id:1.5},{kind:'face'},{confirmed:false},{box:[-.1,.2,.2,.4]},
    {box:[.9,.2,.2,.4]},{box:[.1,.2,0,.4]},{x:.5},{y:NaN},{observedAt:10001},
    {observedAt:8500},{name:'unused private data'},{photo:'unused image'},{gender:'unused attribute'},
    {kind:'scooter'},{kind:'scooter',manual:false},{manual:true}]){
    assert.equal(validatedTraffic(frame({tracks:[track(extra)]}),10000),null,JSON.stringify(extra));
  }
  assert.ok(validatedTraffic(frame({tracks:[track({kind:'scooter',manual:true})]}),10000));
  assert.equal(validatedTraffic({...frame(),appearance:{}},10000),null);
  assert.equal(validatedTraffic(frame({tracks:[track(),track()]}),10000),null);
  assert.equal(validatedTraffic(frame({tracks:Array.from({length:101},(_,i)=>track({id:i+1}))}),10000),null);
  assert.equal(validatedTraffic(frame({frameAt:10001}),10000),null);
  assert.equal(validatedTraffic(frame({frameAt:8500,tracks:[]}),10000),null);
});

test('waiting, live empty, stale and disconnected stay distinguishable; frames cannot resurrect old tracks',()=>{
  let now=10000;const state=new TrafficState(()=>now);
  assert.equal(state.read().status,'disconnected');state.clear('waiting');
  assert.equal(state.read().status,'waiting');assert.equal(state.read().frameAt,null);
  assert.equal(state.update(frame()),true);assert.equal(state.read().tracks.length,1);
  now=10200;assert.equal(state.update(frame({frameAt:10200,tracks:[track({box:[.3,.2,.2,.4],x:.4,observedAt:10200})]})),true);
  assert.equal(state.read().tracks[0].x,.4);assert.equal(state.read().tracks[0].id,1);
  assert.equal(state.update(frame()),false);assert.equal(state.update(frame({frameAt:10200,tracks:[]})),false);
  now=11699;assert.equal(state.read().tracks.length,1);
  now=11700;assert.deepEqual(state.read(),{status:'stale',source:'puerta-cam',frameAt:10200,tracks:[]});
  assert.equal(state.update(frame({frameAt:10200,tracks:[]})),false);
  assert.equal(state.update(frame({frameAt:11700,tracks:[]})),true);assert.equal(state.read().status,'live');
  assert.equal(state.read().tracks.length,0);state.clear();assert.equal(state.read().status,'disconnected');
});

test('individual observation expiry is not extended by fresh frames, camera state or consumer mutation',()=>{
  let now=10000;const state=new TrafficState(()=>now),input=frame();state.update(input);
  input.tracks[0].observedAt=20000;input.tracks[0].box[0]=.5;
  assert.equal(state.read().tracks[0].observedAt,9900);assert.equal(state.read().tracks[0].box[0],.1);
  assert.throws(()=>{state.read().tracks[0].observedAt=20000;},TypeError);
  assert.throws(()=>{state.read().tracks[0].box[0]=.5;},TypeError);
  state.read().tracks.push(track({id:2}));assert.equal(state.read().tracks.length,1);
  now=11000;state.update(frame({frameAt:11000}));now=11400;
  assert.equal(state.read().status,'live');assert.deepEqual(state.read().tracks,[]);
  now=12500;assert.equal(state.read().status,'stale');
});

test('traffic is authenticated by the paired session and never mutates authoritative passage snapshots',()=>{
  const peer={},s=new MirrorSession({peer,origin:'https://admira.tv',session:'abc',now:()=>10000});
  const envelope={source:peer,origin:'https://admira.tv',data:{source:'admira-xtore-twin',screen:SCREEN,session:'abc',event:'traffic',seq:1,ts:10000,traffic:frame()}};
  for(const bad of [{source:{}},{origin:'https://evil.test'},{data:{...envelope.data,session:'other'}},{data:{...envelope.data,screen:'other'}}])assert.equal(s.receive({...envelope,...bad}),null);
  const traffic=new TrafficState(()=>10000),passages=new PassageState(()=>10000);
  passages.update({person:47,car:1,motorcycle:2,bicycle:3,scooter:4},10000,true);
  assert.equal(traffic.update(s.receive(envelope).traffic),true);assert.equal(s.receive(envelope),null);
  traffic.clear('stale');assert.equal(traffic.read().tracks.length,0);assert.equal(passages.read().person,47);
});
