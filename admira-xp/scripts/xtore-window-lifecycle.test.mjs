// Execute the real receiver against an in-process DOM and paired-window fixture.
// No camera permission or live browser state is involved.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {drawAnonymous,drawStatistics,drawStreet} from './xtore-demo.mjs';
import {AudienceSessionState} from './audience-session.mjs';
import {DoohHistoryState,renderDoohHistory} from './dooh-history.mjs';
import * as core from './xtore-window-core.mjs';
const source=readFileSync(new URL('./xtore-window.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function fixture(t,{own='https://www.xpaceos.com',analyzer='https://admira.tv',hasOpener=true}={}){
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
  let focused=0;const peer={closed:false,focus:()=>focused++,postMessage:(data,origin)=>sent.push({data,origin})};
  const session='00000000-0000-0000-0000-000000000001';
  const location={origin:own,search:`?virtualPlayer=${core.SCREEN}&twinOrigin=${encodeURIComponent(analyzer)}&twinSession=${session}`};
  const opened=[];const window={opener:hasOpener?peer:null,open:(...args)=>{opened.push(args);return peer;},addEventListener:(name,fn)=>{listeners[name]=fn;},dispatchEvent:e=>events.push(e.type)};
  vm.runInNewContext(source,{...core,DoohHistoryState,renderDoohHistory,AudienceSessionState,drawAnonymous,drawStatistics,drawStreet,document,window,location,crypto,Date,URL,URLSearchParams,Event,ImageBitmap:class{},
    setInterval:fn=>timers.push(fn),movableWindow:()=>({restore(){}}),
    createExteriorProgram:({onState})=>({update(value){calls.update.push(value);onState('Estado de regla');},draw(){calls.draw++;return true;},clear(){calls.clear++;},destroy(){calls.destroy++;}})});
  let seq=0;
  const receive=(event,extra={},overrides={})=>listeners.message({source:peer,origin:'https://admira.tv',data:{source:'admira-xtore-twin',screen:core.SCREEN,session,event,seq:++seq,ts:Date.now(),...extra},...overrides});
  const tick=ms=>{t.mock.timers.tick(ms);for(const fn of timers)fn();};
  return {window,receive,tick,calls,node,listeners,sent,events,opened,focused:()=>focused};
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

test('demo toggle owns all four surfaces and persists on lost connection without leaking fallback pixels',t=>{
 const f=fixture(t),api=f.window.__xtoreWindowPlayer;assert.equal(api.demoActive(),false);
 assert.equal(api.drawScreen({},160,90,'anonymous'),false);api.toggleDemo();assert.equal(api.demoActive(),true);
 let images=0;const texts=[];const ctx={save(){},restore(){},fillRect(){},strokeRect(){},fillText:s=>texts.push(s),drawImage(){images++;}};
 f.receive('ready');f.receive('traffic',{traffic:traffic()});api.drawScreen(ctx,160,90,'anonymous');
 assert.equal(images,0);assert.ok(texts.includes('Persona'));
 f.node('xtore-disconnect').onclick();assert.equal(api.demoActive(),true);api.drawScreen(ctx,160,90,'anonymous');assert.ok(texts.includes('Sin detecciones recientes'));
 api.toggleDemo();assert.equal(api.demoActive(),false);assert.equal(api.drawScreen(ctx,160,90,'statistics'),false);
});

test('history uses the authenticated pair, requests persisted buckets and clears on disconnect',t=>{
 const f=fixture(t),api=f.window.__xtoreWindowPlayer;
 const history={schema:'admira.dooh-history.v1',site:'admira-xperience-santa-rosa-19',source:'puerta-cam',timezone:'Europe/Madrid',loaded:true,busy:false,error:null,updatedAt:10000,from:0,to:11000,pending:2,lost:0,expired:0,rows:[{hour:0,kind:'person',source:'detector',total:7}]};
 f.receive('history',{history});assert.equal(api.history(),null);
 f.receive('ready');assert.equal(f.sent.at(-1).data.event,'history-request');
 f.receive('history',{history},{origin:'https://evil.test'});assert.equal(api.history(),null);
 f.receive('history',{history});assert.equal(api.history().rows[0].total,7);assert.equal(api.exterior(),null);
 f.receive('statistics',{passages:{person:100,car:0,motorcycle:0,bicycle:0,scooter:0}});assert.equal(api.history().rows[0].total,7);
 api.requestHistory();assert.equal(f.sent.at(-1).data.event,'history-request');
 f.tick(4000);assert.equal(api.history(),null);
 f.receive('ready');f.receive('history',{history});assert.equal(api.history().rows[0].total,7);
 f.node('xtore-disconnect').onclick();assert.equal(api.history(),null);
});


test('reconnecting after loss of opener preserves local analyzer and opens a normal named tab',t=>{
 const f=fixture(t,{own:'http://localhost:8772',analyzer:'http://localhost:8766',hasOpener:false});
 f.node('xtore-connect').onclick();assert.equal(f.opened.length,1);assert.equal(f.opened[0].length,2);
 const url=new URL(f.opened[0][0]);assert.equal(url.origin,'http://localhost:8766');assert.equal(url.searchParams.get('twinOrigin'),'http://localhost:8772');
 assert.match(url.searchParams.get('twinSession'),/^[0-9a-f-]{36}$/);assert.equal(f.sent.at(-1).origin,url.origin);
 f.node('xtore-connect').onclick();assert.equal(f.opened.length,1);assert.equal(f.focused(),1);
 assert.match(f.node('xtore-window-panel').innerHTML,/id="xtore-digital-twin" href="https:\/\/digitaltwin.ieu.ai\/" target="_blank" rel="noopener noreferrer"/);
});
test('production cannot be redirected to a local or unrelated analyzer',()=>{
 assert.equal(core.analyzerOriginFor('https://www.xpaceos.com','http://localhost:8766','https://evil.test'),'https://admira.tv');
 assert.equal(core.analyzerOriginFor('http://localhost:8772','https://evil.test','https://evil.test'),'https://admira.tv');
 assert.equal(core.analyzerOriginFor('http://localhost:8772','http://localhost:8766','http://localhost:8768'),'http://localhost:8768');
 assert.equal(core.analyzerOriginFor('https://xpaceos.com','https://www.admira.tv',null),'https://www.admira.tv');
});
