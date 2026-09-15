// Execute the real receiver against an in-process DOM and paired-window fixture.
// No camera permission or live browser state is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as core from './xtore-window-core.mjs';
const source=readFileSync(new URL('./xtore-window.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function fixture(t){
  t.mock.timers.enable({apis:['Date'],now:10000});
  const nodes=new Map(),listeners={},timers=[],sent=[],events=[],calls={update:[],clear:0,destroy:0,draw:0};
  class Element{
    constructor(){this.children=[];this.hidden=false;this.open=false;this.textContent='';this.classList={contains:()=>false};}
    set id(id){this._id=id;nodes.set(id,this);}get id(){return this._id;}
    set innerHTML(value){this.html=value;for(const match of value.matchAll(/id="([^"]+)"/g))node(match[1]);}
    get innerHTML(){return this.html;}
    setAttribute(){}addEventListener(){}append(...values){this.children.push(...values);}prepend(...values){this.children.unshift(...values);}focus(){}click(){}
    querySelector(selector){return node(selector.startsWith('#')?selector.slice(1):selector);}
    getContext(){return {drawImage(){}};}
  }
  function node(id){if(!nodes.has(id)){const value=new Element();value.id=id;}return nodes.get(id);}
  const document={body:node('body'),getElementById:node,createElement:()=>new Element(),addEventListener(){},querySelectorAll:()=>[]};
  const peer={closed:false,postMessage:(data,origin)=>sent.push({data,origin})};
  const session='00000000-0000-0000-0000-000000000001';
  const location={origin:'https://www.xpaceos.com',search:`?virtualPlayer=${core.SCREEN}&twinOrigin=https%3A%2F%2Fadmira.tv&twinSession=${session}`};
  const window={opener:peer,addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:e=>events.push(e.type)};
  vm.runInNewContext(source,{...core,document,window,location,Date,URL,URLSearchParams,Event,ImageBitmap:class{},
    setInterval:fn=>timers.push(fn),movableWindow:()=>({restore(){}}),
    createExteriorProgram:({onState})=>({update(value){calls.update.push(value);onState('Estado de regla');},draw(){calls.draw++;return true;},clear(){calls.clear++;},destroy(){calls.destroy++;}})});
  let seq=0;
  const receive=(event,extra={},overrides={})=>listeners.message({source:peer,origin:'https://admira.tv',data:{source:'admira-xtore-twin',screen:core.SCREEN,session,event,seq:++seq,ts:Date.now(),...extra},...overrides});
  const tick=ms=>{t.mock.timers.tick(ms);for(const fn of timers)fn();};
  return {window,receive,tick,calls,node,listeners,sent,events};
}
const traffic=()=>({frameAt:Date.now(),tracks:[{id:1,kind:'person',box:[.1,.2,.2,.4],x:.2,y:.6,observedAt:Date.now(),confirmed:true}]});

test('receiver exposes authenticated traffic, expires it for the program and preserves the independent totals',t=>{
  const f=fixture(t),api=f.window.__xtoreWindowPlayer;
  f.receive('traffic',{traffic:traffic()});assert.equal(api.traffic().status,'disconnected');
  f.receive('ready');assert.equal(api.traffic().status,'waiting');
  f.receive('traffic',{traffic:traffic()},{origin:'https://evil.test'});assert.equal(api.traffic().status,'waiting');
  f.receive('statistics',{passages:{person:47,car:1,motorcycle:2,bicycle:3,scooter:4}});
  f.receive('traffic',{traffic:traffic()});assert.equal(api.traffic().tracks.length,1);
  f.tick(500);assert.equal(f.calls.update.at(-1).tracks.length,1);assert.equal(api.exterior(),47);
  f.receive('camera-off');assert.equal(api.traffic().tracks.length,1);assert.equal(api.exterior(),47);
  f.tick(1000);assert.equal(f.calls.update.at(-1).status,'stale');assert.equal(api.traffic().tracks.length,0);assert.equal(api.exterior(),47);
  f.receive('traffic',{traffic:traffic()});f.receive('traffic-off');assert.equal(api.traffic().status,'stale');assert.equal(api.exterior(),47);
  f.node('xtore-disconnect').onclick();assert.equal(api.traffic().status,'disconnected');assert.equal(api.exterior(),null);
});

test('conditional rendering is limited to the exterior and advanced rules start collapsed',t=>{
  const f=fixture(t),api=f.window.__xtoreWindowPlayer,ctx={save(){},restore(){},fillRect(){},fillText(){}};
  api.draw(ctx,100,100);assert.equal(f.calls.draw,0);
  api.draw(ctx,100,100,'interior');assert.equal(f.calls.draw,0);
  api.draw(ctx,100,100,'exterior');assert.equal(f.calls.draw,1);
  assert.equal(f.node('xtore-traffic').open,false);assert.match(f.node('xtore-traffic').innerHTML,/Reglas de exterior/);
  api.openCamera();assert.equal(f.node('xtore-camera').open,true);assert.equal(f.node('xtore-traffic').open,false);
});

test('leaving clears traffic; BFCache preserves a reusable program while permanent unload destroys it',t=>{
  const f=fixture(t);f.receive('ready');f.receive('traffic',{traffic:traffic()});
  f.listeners.pagehide({persisted:true});assert.equal(f.window.__xtoreWindowPlayer.traffic().status,'disconnected');assert.equal(f.calls.destroy,0);
  f.listeners.pagehide({persisted:false});assert.equal(f.calls.destroy,1);
});
