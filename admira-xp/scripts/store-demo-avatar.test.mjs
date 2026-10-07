import test from 'node:test';import assert from 'node:assert/strict';
import {bindStoreDemoAvatar} from './store-demo-avatar.mjs';
import {runStoreDemo} from './store-demo-bridge.mjs';
function fixture({api=true}={}){
 const listeners={},sent=[],calls=[],scripts=[];let observed,frame=null,closes=0;
 const wall={note:null,querySelector(selector){return selector==='.matrix-avatar-close'?{click(){closes++;}}:this.note;},appendChild(node){this.note=node;}};
 const engine={demo(text,log){calls.push(text);log.appendChild({textContent:'Prepared demo'});return {id:'store/voz'};},demoEstado:()=>({activo:false}),listo:async()=>{},subdemos:()=>({plataforma:'store',nombre:'Store',subdemos:[{id:'voz',nombre:'Voice',aliases:['voz']}]})};
 const root={location:{href:'https://www.admira.store/admira-xp/'},document:{documentElement:{lang:'es'},querySelectorAll:selector=>selector==='dialog[open]'?[]:(frame?[frame]:[]),createElement(tag){return tag==='ul'?{children:[],appendChild(el){this.children.push(el);},querySelector(){return null;}}:{dataset:{},style:{},setAttribute(){},remove(){}};},head:{appendChild(s){scripts.push(s);root.AdmiraExperto=engine;s.onload();}}},MutationObserver:class{constructor(fn){observed=fn;}observe(){}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},addEventListener(type,fn,capture){listeners[type]={fn,capture};},dispatchEvent(e){sent.push(e);}};
 if(api)root.AdmiraExperto=engine;
 const dispatch=async text=>{calls.push(text);return {ok:true,local:true};};
 const open=(notify=true)=>{frame={contentWindow:{postMessage:(d,o)=>sent.push({data:d,origin:o})},getAttribute:()=> 'https://digitalavatar.ai/nube.html',addEventListener(type,fn){listeners['frame-'+type]={fn};},closest(selector){return selector==='#starbucks-avatar-wall'?wall:null;}};if(notify)observed?.();return frame;};
 const message=(data,origin='https://digitalavatar.ai',source=frame?.contentWindow)=>{let stopped=0;listeners.message.fn({data,origin,source,stopImmediatePropagation(){stopped++;}});return stopped;};
 return {root,listeners,sent,calls,scripts,open,message,dispatch,wall,get closes(){return closes;}};
}
const flush=()=>new Promise(setImmediate);
test('opening the owned avatar preloads its API and catalog without executing a demo or duplicating binding',async()=>{
 const f=fixture({api:false});bindStoreDemoAvatar(f.root,{dispatch:f.dispatch});assert.equal(f.scripts.length,0);
 f.open();await flush();assert.equal(f.scripts.length,1);assert.equal(typeof f.root.AdmiraExperto.demo,'function');
 const catalog=f.sent.find(e=>e.data?.type==='da-subdemos');assert.equal(catalog.origin,'https://digitalavatar.ai');assert.deepEqual(catalog.data.subdemos[0],{n:1,id:'voz',nombre:'Voice',desc:'',aliases:['voz']});assert.deepEqual(f.calls,[]);
 const original=f.listeners.message.fn;bindStoreDemoAvatar(f.root,{dispatch:f.dispatch});assert.equal(f.listeners.message.fn,original);assert.equal(f.listeners.message.capture,true);
});
test('an early first request loads the absent engine exactly once before dispatching the prepared demo',async()=>{
 const f=fixture({api:false});bindStoreDemoAvatar(f.root,{dispatch:text=>runStoreDemo(text,{root:f.root})});const face=f.open(false);
 assert.equal(f.root.AdmiraExperto,undefined);assert.equal(f.scripts.length,0);
 assert.equal(f.message({type:'da-demo',texto:'/demo 1'},'https://digitalavatar.ai',face.contentWindow),1);await flush();assert.deepEqual(f.calls,['/demo 1']);assert.equal(f.scripts.length,1);
 assert.equal(f.sent.find(e=>e.type==='admira:demo-feedback').detail.ok,true);
 assert.equal(f.message({type:'da-demo',id:'store/voz'}),1);assert.equal(f.message({type:'da-demo',texto:'demo tpv'}),1);await flush();assert.deepEqual(f.calls,['/demo 1','/demo voz','/demo tpv']);
});
test('foreign origin/frame and malformed payloads cannot dispatch, navigate or consume avatar events',async()=>{
 const f=fixture();bindStoreDemoAvatar(f.root,{dispatch:f.dispatch});f.open();
 for(const [data,origin,source] of [[{type:'da-demo',texto:'/demo 1'},'https://digitalavatar.ai.evil.test',undefined],[{type:'da-demo',texto:'/demo 1'},'http://digitalavatar.ai',undefined],[{type:'da-demo',texto:'/demo 1'},'https://digitalavatar.ai',{}],[{type:'other',texto:'/demo 1'},'https://digitalavatar.ai',undefined],[{type:'da-demo',texto:'/demo 1\n/publish'},'https://digitalavatar.ai',undefined],[{type:'da-demo',id:'https://evil.test'},'https://digitalavatar.ai',undefined]])assert.equal(f.message(data,origin,source),0);
 await flush();assert.deepEqual(f.calls,[]);
});

test('an inert native wall preview does not publish its catalog or execute until the conversation opens',async()=>{
 const f=fixture();const face=f.open(false);face.inert=true;bindStoreDemoAvatar(f.root,{dispatch:f.dispatch});
 f.listeners.message.fn({origin:'https://digitalavatar.ai',source:face.contentWindow,data:{type:'da-demo',texto:'/demo 1'},stopImmediatePropagation(){throw Error('must stay ignored');}});
 await flush();assert.equal(f.sent.length,0);assert.deepEqual(f.calls,[]);
 f.open();await flush();assert.equal(f.sent.filter(e=>e.data?.type==='da-subdemos').length,1);assert.deepEqual(f.calls,[]);
});

test('help, status and failure remain visible in the conversation and ACK only the real outcome',async()=>{
 for(const [text,result]of [['/demo help',{ok:true,message:'Store 1 Voz · 2 Música'}],['/demo estado',{ok:true,demo:{activo:true},message:'Fase 2 · pausado'}],['/demo 99',{ok:false,message:'No disponible <unsafe>'}]]){
  const f=fixture();let resolve;
  bindStoreDemoAvatar(f.root,{dispatch:()=>new Promise(done=>{resolve=done;})});f.open();await flush();
  f.message({type:'da-demo',texto:text,requestId:'qa-1'});await flush();
  assert.equal(f.closes,0);assert.equal(f.sent.filter(e=>e.data?.type==='da-demo-result').length,0);
  resolve(result);await flush();assert.equal(f.closes,0);assert.equal(f.wall.note.textContent,result.message);assert.equal(f.wall.note.hidden,false);
  const ack=f.sent.find(e=>e.data?.type==='da-demo-result');assert.equal(ack.origin,'https://digitalavatar.ai');assert.equal(ack.data.requestId,'qa-1');assert.equal(ack.data.ok,result.ok);assert.equal(ack.data.message,result.message);
 }
});
test('a repeated request executes once and acknowledges twice; visual close waits for successful dispatch',async()=>{
 const f=fixture();let resolve,executions=0;
 bindStoreDemoAvatar(f.root,{dispatch:()=>{executions++;return new Promise(done=>{resolve=done;});}});f.open();await flush();
 const data={type:'da-demo',texto:'/demo auto',requestId:'qa-auto'};f.message(data);f.message(data);await flush();
 assert.equal(executions,1);assert.equal(f.closes,0);
 resolve({ok:true,demo:{activo:true,demo:'store/voz'},message:'Auto 1/5'});await flush();
 assert.equal(f.closes,1);assert.equal(f.sent.filter(e=>e.data?.type==='da-demo-result').length,2);
});
test('a rehearsal is placed inside the remaining native modal so controls escape body inertness',async()=>{
 const f=fixture();const panel={};let moved=0;const modal={matches:()=>true,contains:()=>false,appendChild(el){assert.equal(el,panel);moved++;}};
 f.root.document.querySelector=()=>panel;const original=f.root.document.querySelectorAll;f.root.document.querySelectorAll=s=>s==='dialog[open]'?[modal]:original(s);
 bindStoreDemoAvatar(f.root,{dispatch:async()=>({ok:true,demo:{id:'store/voz'},message:'Voz'})});f.open();f.message({type:'da-demo',texto:'/demo 1'});await flush();
 assert.equal(f.closes,1);assert.equal(moved,1);
});

test('invalid IDs and conflicting reuse never run an extra command, ACK payload sizes are bounded',async()=>{
 const f=fixture();bindStoreDemoAvatar(f.root,{dispatch:async text=>{f.calls.push(text);return {ok:true,message:'x'.repeat(5000),demo:{id:'store/voz',payload:'x'.repeat(9000)}};}});f.open();await flush();
 for(const requestId of ['',null,42,'invalid request','x'.repeat(129)])assert.equal(f.message({type:'da-demo',texto:'/demo 1',requestId}),1);
 await flush();assert.deepEqual(f.calls,[]);
 f.message({type:'da-demo',texto:'/demo 1',requestId:'valid.request:1-2_3'});await flush();
 const ack=f.sent.find(e=>e.data?.type==='da-demo-result').data;assert.equal(ack.message.length,4000);assert.equal(ack.result,null);
 f.message({type:'da-demo',texto:'/demo 2',requestId:'valid.request:1-2_3'});await flush();assert.deepEqual(f.calls,['/demo 1']);assert.equal(f.sent.filter(e=>e.data?.type==='da-demo-result').at(-1).data.ok,false);
});
test('128 retained request IDs prevent old duplicates from replaying after the request limit',async()=>{
 const f=fixture();bindStoreDemoAvatar(f.root,{dispatch:f.dispatch});f.open();await flush();
 for(let k=0;k<128;k++)f.message({type:'da-demo',texto:'/demo estado',requestId:'request-'+k});await flush();assert.equal(f.calls.length,128);
 f.message({type:'da-demo',texto:'/demo estado',requestId:'request-128'});f.message({type:'da-demo',texto:'/demo estado',requestId:'request-0'});await flush();assert.equal(f.calls.length,128);
 const rejected=f.sent.find(e=>e.data?.requestId==='request-128').data;assert.equal(rejected.ok,false);assert.match(rejected.message,/Recarga/);
});
