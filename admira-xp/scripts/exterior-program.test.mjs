import test from 'node:test';
import assert from 'node:assert/strict';
import {createExteriorProgram,exteriorChoice,resolveExteriorAssets,EXTERIOR_RULES} from './exterior-program.mjs';
const snapshot=(kind='person',at=10000)=>({status:'live',source:'puerta-cam',frameAt:at,tracks:[{id:1,kind,confirmed:true,observedAt:at,...(kind==='scooter'?{manual:true}:{})}]});
const item=kind=>({id:EXTERIOR_RULES[kind].id,type:'video',title:kind,url:`https://stock.admira.store/stock/${EXTERIOR_RULES[kind].id}/asset.mp4`});
test('exterior uses recent confirmed tracks, never totals, stale evidence or simulated people',()=>{
  assert.equal(exteriorChoice(snapshot(),11000).kind,'person');
  assert.equal(exteriorChoice(snapshot('scooter'),11000).kind,'scooter');
  assert.equal(exteriorChoice({...snapshot(),tracks:[{...snapshot('scooter').tracks[0],manual:false}]},11000),null);
  for(const bad of [{status:'stale'},{source:'simulation'},{frameAt:5000},{tracks:[]},{tracks:[{kind:'person',observedAt:5000,confirmed:true}]},{tracks:[{kind:'person',observedAt:10000,confirmed:false}]}])assert.equal(exteriorChoice({...snapshot(),...bad},11000),null);
  assert.equal(exteriorChoice(snapshot(),11500),null);
  assert.equal(exteriorChoice({...snapshot(),tracks:[...snapshot().tracks,...snapshot('car').tracks]},11000).kind,'car');
});
test('only existing verified rule IDs and visual Stock assets can be selected',()=>{
  assert.equal(resolveExteriorAssets([item('person')]).size,1);
  for(const bad of [{id:'other'},{type:'audio'},{url:'javascript:alert(1)'},{url:'https://evil.test/stock/a'},{url:'https://user:secret@stock.admira.store/stock/a'}])assert.equal(resolveExteriorAssets([{...item('person'),...bad}]).size,0);
});
function fixture(){
  let clock=10000,fetches=0;const nodes=[],states=[];
  const document={createElement(tag){const n={tagName:tag.toUpperCase(),listeners:{},paused:true,readyState:0,videoWidth:960,videoHeight:540,duration:100,currentTime:0,playCalls:0,pause(){this.paused=true;},play(){this.paused=false;this.readyState=2;this.playCalls++;return Promise.resolve();},load(){},removeAttribute(){},addEventListener(k,v){this.listeners[k]=v;}};nodes.push(n);return n;}};
  const player=createExteriorProgram({document,now:()=>clock,onState:s=>states.push(s),fetcher:async()=>{fetches++;return new Response(JSON.stringify({items:[item('person'),item('car'),item('bicycle')]}));}});
  const ctx={save(){},restore(){},fillRect(){},drawImage(){this.calls=(this.calls||0)+1;}};
  return {player,nodes,states,ctx,tick:n=>clock=n,fetches:()=>fetches};
}
test('presence renewal preserves playback; expiry returns to mirror and late loads cannot restart',async()=>{
  const f=fixture();f.player.update(snapshot('bicycle'));await new Promise(r=>setImmediate(r));
  assert.equal(f.nodes.length,1);const n=f.nodes[0];assert.equal(n.muted,true);n.listeners.loadedmetadata();
  assert.equal(n.currentTime,50);assert.equal(n.playCalls,1);assert.equal(f.player.draw(f.ctx,240,320),true);
  f.tick(10500);f.player.update(snapshot('bicycle',10500));assert.equal(f.nodes.length,1);assert.equal(n.playCalls,1);
  f.tick(12000);assert.equal(f.player.draw(f.ctx,240,320),false);assert.equal(n.paused,true);
  n.listeners.loadedmetadata();assert.equal(n.playCalls,1);f.player.destroy();
});
test('category switches only its own media and catalogue fetches never contain camera data',async()=>{
  const f=fixture();f.player.update(snapshot());await new Promise(r=>setImmediate(r));const person=f.nodes[0];person.listeners.loadedmetadata();
  f.player.update(snapshot('car'));assert.equal(person.paused,true);const car=f.nodes[1];car.listeners.loadedmetadata();
  assert.equal(f.player.draw(f.ctx,200,150),true);assert.equal(f.fetches(),1);
  f.player.clear();assert.equal(car.paused,true);assert.equal(f.player.draw(f.ctx,200,150),false);f.player.destroy();
});
