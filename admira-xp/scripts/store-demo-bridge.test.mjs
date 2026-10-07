import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVisualCommand,executeVisualCommand} from './xtanco-visual-command.mjs';
import {runStoreDemo,loadStoreDemoEngine,hasStoreRehearsal,STORE_DEMO_ENGINE_URL} from './store-demo-bridge.mjs';

function logDOM(){return {children:[],appendChild(el){this.children.push(el);},querySelector(selector){return this.children.find(el=>selector==='.err'&&el.className==='err')||null;}};}
function engineFixture(){
  const calls=[],native=[];let state={activo:false};
  const root={document:{createElement:()=>logDOM()},XpacePOSExperience:{demo:{state(){return {running:true};},stop(){native.push('stop');}}},AdmiraExperto:{
    demoEstado:()=>state,
    demo(command,log){calls.push(command);log.appendChild({textContent:'Local result',className:''});
      if(command==='/demo stop'){state={activo:false};return state;}
      if(command==='/demo pausa'){state={...state,pausado:true};return state;}
      if(command==='/demo resume'){state={...state,pausado:false};return state;}
      if(command==='/demo estado')return state;
      if(command==='/demo help')return null;
      state={activo:true,demo:'store/voz'};return {id:'store/voz'};
    }
  }};
  return {root,calls,native,setState(s){state=s;}};
}

test('local content commands delegate exact normalized text and do not choose global numbered solutions',async()=>{
  const f=engineFixture();
  for(const cmd of ['/demo 1','/demo 2','/demo 3','/demo 4','/demo 5','/demo locucion','/demo musica','/demo imagenes','/demo video','/demo caja','/demo auto','/demo todas']){
    const parsed=parseVisualCommand(cmd);assert.equal(parsed.guided,'suite');
    const answer=await runStoreDemo(parsed.text,{root:f.root});assert.equal(answer.ok,true);assert.equal(answer.local,true);assert.equal(answer.message,'Local result');
  }
  assert.equal(f.calls.length,12);assert.equal(f.native.length,12,'new rehearsals cancel the prior native journey');
  assert.equal(STORE_DEMO_ENGINE_URL,'https://www.admiranext.com/suite/experto.js');
  assert.equal(await loadStoreDemoEngine(f.root),f.root.AdmiraExperto);
});

test('help preserves native TPV; controls act on the running rehearsal without starting or stopping native players',async()=>{
  const f=engineFixture();await runStoreDemo('/demo help',{root:f.root});assert.deepEqual(f.native,[]);
  f.setState({activo:true,demo:'store/video'});
  for(const cmd of ['/demo pausa','/demo resume','/demo estado','/demo stop'])assert.equal((await runStoreDemo(cmd,{root:f.root})).ok,true);
  assert.equal(hasStoreRehearsal(f.root),false);assert.deepEqual(f.native,[]);
  const before=f.calls.length;
  for(const cmd of ['/demo pausa','/demo resume']){const answer=await runStoreDemo(cmd,{root:f.root});assert.equal(answer.ok,false);assert.match(answer.message,/sin pausa/);}
  assert.equal(f.calls.length,before);assert.deepEqual(f.native,[]);
});

test('the shipped dispatcher routes stop/status to the shared engine only while its rehearsal is active',async()=>{
  const f=engineFixture(),previous={api:globalThis.AdmiraExperto,doc:globalThis.document,pos:globalThis.XpacePOSExperience};
  Object.assign(globalThis,{AdmiraExperto:f.root.AdmiraExperto,document:f.root.document,XpacePOSExperience:{demo:{stop(){f.native.push('stop');},state(){return {phase:'travel'};}}}});
  try{
    f.setState({activo:true,demo:'store/voz'});await executeVisualCommand('/demo pausa');assert.equal(f.calls.at(-1),'/demo pausa');
    await executeVisualCommand('/demo@AdmiraXPBot estado');assert.equal(f.calls.at(-1),'/demo status');
    await executeVisualCommand('/demo stop');assert.equal(f.calls.at(-1),'/demo stop');assert.deepEqual(f.native,[]);
    await executeVisualCommand('/demo stop');assert.deepEqual(f.native,['stop']);
    assert.match((await executeVisualCommand('/demo estado')).message,/llevando a caja/);
    f.setState({activo:true});await executeVisualCommand('/demo tpv off');assert.deepEqual(f.native,['stop','stop'],'explicit native control ignores the common rehearsal');
  }finally{globalThis.AdmiraExperto=previous.api;globalThis.document=previous.doc;globalThis.XpacePOSExperience=previous.pos;}
});

test('lazy bootstrap coalesces concurrent requests, uses a fresh canonical HTTPS URL and leaves native CLI binding alone',async()=>{
  const m=await import('./store-demo-bridge.mjs?bootstrap-success');const f=engineFixture(),scripts=[];
  const root={document:{createElement(){return {dataset:{},remove(){}};},head:{appendChild(script){scripts.push(script);queueMicrotask(()=>{root.AdmiraExperto=f.root.AdmiraExperto;script.onload();});}}}};
  const [a,b]=await Promise.all([m.loadStoreDemoEngine(root),m.loadStoreDemoEngine(root)]);assert.equal(a,b);assert.equal(scripts.length,1);
  const script=scripts[0],url=new URL(script.src);assert.equal(url.origin,'https://www.admiranext.com');assert.equal(url.pathname,'/suite/experto.js');assert.match(url.searchParams.get('v'),/^store-local-autopilot-1-\d+$/);
  assert.equal(script.dataset.pata,'admira.store');assert.equal(script.dataset.panel,'#store-demo-engine');assert.equal(script.dataset.toggle,'');assert.equal(script.dataset.dock,'off');
});

test('load failures stay local, report failure honestly and retry instead of caching rejection',async()=>{
  const m=await import('./store-demo-bridge.mjs?bootstrap-failure');let attempts=0,removed=0,native=0;
  const root={XpacePOSExperience:{demo:{stop(){native++;}}},document:{createElement(){return {dataset:{},remove(){removed++;}};},head:{appendChild(script){attempts++;queueMicrotask(()=>script.onerror());}}}};
  for(let n=0;n<2;n++){const answer=await m.runStoreDemo('/demo 1',{root,lang:'en'});assert.equal(answer.ok,false);assert.equal(answer.local,true);assert.match(answer.message,/could not load/);}
  assert.equal(attempts,2);assert.equal(removed,2);assert.equal(native,0);
});

test('selecting a prepared management demo does not reset an idle native journey or its players',async()=>{
 const f=engineFixture();f.root.XpacePOSExperience.demo.state=()=>({phase:'idle',running:false,song:false});
 await runStoreDemo('/demo 1',{root:f.root});assert.deepEqual(f.native,[]);
});

 test('first Expert command waits for the definitive manifest before selecting a local number',async()=>{
 const f=engineFixture();let ready;f.root.AdmiraExperto.listo=()=>new Promise(resolve=>{ready=resolve;});
 const pending=runStoreDemo('/demo 1',{root:f.root});await new Promise(setImmediate);assert.deepEqual(f.calls,[]);assert.deepEqual(f.native,[]);ready();
 assert.equal((await pending).ok,true);assert.deepEqual(f.calls,['/demo 1']);
});
