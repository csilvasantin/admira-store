import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createLifeSnapshot} from './life-snapshot.mjs';

// Execute the actual UI controller with its sole renderer import injected. No
// WebGL/browser, external media, game loop or source files are changed by this
// harness; the fake DOM exercises observable scheduling and event propagation.
const source=fs.readFileSync(new URL('./life-ui.mjs',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'')
  .replace("await import('./life-renderer.mjs?v=tiers-linked-4')",'await loadRenderer()')
  .replace(/^export \{.*\};?\s*$/m,'');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const releaseInputs=html.match(/window\.__xtancoReleaseInputs=.*;/)?.[0];
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};

function harness({load,search=''}={}){
  let document;
  class Element {
    constructor(name){
      this.name=name;this.hidden=false;this.dataset={};this.attrs={};this.children=new Map();this.listeners={};
      const classes=new Set();this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)};
    }
    querySelector(key){if(!this.children.has(key)){const child=new Element(key);child.parent=this;this.children.set(key,child);}return this.children.get(key);}
    querySelectorAll(selector){
      const group={'[data-light]':['light',['day','sunset','night']],'[data-preset]':['preset',['mapped','home','floor','detail']],'[data-zoom]':['zoom',['in','out']]}[selector];
      return group?group[1].map(value=>{const button=this.querySelector(`${selector}:${value}`);button.dataset[group[0]]=value;return button;}):[];
    }
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    setAttribute(key,value){this.attrs[key]=value;}
    removeAttribute(key){delete this.attrs[key];}
    append(child){child.parent=this;} prepend(child){child.parent=this;}
    remove(){this.removed=true;this.parent=null;}
    replaceWith(next){const parent=this.parent;for(const [key,value]of parent.children)if(value===this)parent.children.set(key,next);next.parent=parent;this.parent=null;}
    showModal(){this.open=true;} close(){this.open=false;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {width:1000,height:700};}
    emit(type,properties={}){
      const event={type,target:this,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...properties};
      for(let node=this;node;node=node.parent){
        node[`on${type}`]?.(event);for(const listener of node.listeners[type]||[])listener(event);
        if(event.stopped)break;
      }
      return event;
    }
  }
  const body=new Element('body'),actions=new Element('actions'),previous=new Element('previous'),created=[];actions.parent=body;
  document={body,activeElement:previous,hidden:false,createElement:name=>{created.push(name);return new Element(name);},querySelector:()=>actions};
  const window=new Element('window');body.parent=window;
  let raw={active:true,iso:{cols:14,rows:8,ox:270,oy:185,tileW:80,tileH:28,wallH:165},
    game:{staff:[],custs:[{x:343,y:249,dir:1,st:'walk'}],gameTime:14,custIn:3}};
  window.__xtancoVisualState=()=>raw;
  const keys={KeyQ:true,KeyP:true},frames=new Map(),timers=new Map(),viewers=[],observers=[];
  let clock=0,sequence=0,loads=0;
  const createLifeRenderer=options=>{
    const calls={render:0,dispose:0,updates:[],rotations:[],zooms:[],lights:[],presets:[],clearSelection:0};
    const viewer={calls,options,resize(){},update:value=>calls.updates.push(value),render:()=>calls.render++,dispose:()=>calls.dispose++,
      rotate:value=>calls.rotations.push(value),zoomBy:value=>calls.zooms.push(value),setLighting:value=>calls.lights.push(value),preset:value=>calls.presets.push(value),
      clearSelection(){calls.clearSelection++;options.onSelect(null);}};
    viewers.push(viewer);return viewer;
  };
  const context=vm.createContext({document,window,keys,createLifeSnapshot,createTierControls:()=>({element:new Element('tiers'),dispose(){}}),performance:{now:()=>clock},URLSearchParams,location:{search},
    console:{warn(){}},loadRenderer:()=>{loads++;return load?load({createLifeRenderer},loads):Promise.resolve({createLifeRenderer});},
    requestAnimationFrame:fn=>{const id=++sequence;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:(fn,delay)=>{const id=++sequence;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),
    ResizeObserver:class {constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
  });
  assert.ok(releaseInputs,'the shared game must expose its explicit held-input release hook');
  vm.runInContext(releaseInputs,context);
  vm.runInContext(source+';globalThis.audit={open,close,subscribeLifeView,dialog:()=>dialog};',context);
  return {context,document,window,body,previous,keys,frames,timers,viewers,observers,created,
    get dialog(){return context.audit.dialog();},subscribe:listener=>context.audit.subscribeLifeView(listener),
    setRaw:value=>{raw=value;},get raw(){return raw;},
    async open(options){await context.audit.open(options);await flush();},close:()=>context.audit.close(),
    frame(time){clock=time;const first=frames.entries().next().value;assert.ok(first,'one frame must be scheduled');frames.delete(first[0]);first[1](time);},
    async timer(time){clock=time;for(const [id,timer]of [...timers])if(timer.at<=time){timers.delete(id);timer.fn();}await flush();}
  };
}

test('the reusable Life controller does not launch itself from URLs or create a separate trigger',()=>{
  for(const search of ['?visual=life','?visual=better','?visual=best']){
    const h=harness({search});assert.equal(h.dialog,undefined);assert.equal(h.viewers.length,0);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
    assert.deepEqual(h.created,[]);
  }
});

test('Life subscribers observe opening, ready and closing, and can unsubscribe',async()=>{
  const h=harness(),states=[];
  const unsubscribe=h.subscribe(state=>states.push({...state}));
  await h.open();assert.equal(states.length,2);
  assert.equal(states[0].open,true);assert.equal(states[0].busy,true);
  assert.equal(states[1].open,true);assert.equal(states[1].busy,false);assert.equal(states[1].error,'');
  h.close();assert.equal(states.at(-1).open,false);assert.equal(states.at(-1).busy,false);
  unsubscribe();const length=states.length;await h.open();h.close();assert.equal(states.length,length);
});

test('pagehide releases the real controller resources and publishes a distinct preference-preserving close reason',async()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));await h.open();
  h.window.emit('pagehide',{persisted:true});
  assert.equal(h.dialog,null);assert.equal(h.viewers[0].calls.dispose,1);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);
  assert.ok(h.observers.every(observer=>observer.disconnected));assert.equal(states.at(-1).open,false);assert.equal(states.at(-1).reason,'pagehide');
  await h.open();h.dialog.querySelector('.life-close').emit('click');
  assert.equal(states.at(-1).reason,'','a DOM click event must not be mistaken for a close reason');
});

test('modal releases held movement keys, keeps local camera actions, and blocks underlying game events',async()=>{
  const h=harness();await h.open();assert.deepEqual(h.keys,{KeyQ:false,KeyP:false});
  let leaked=0;for(const type of ['click','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','wheel','keydown','keyup'])h.body.addEventListener(type,()=>leaked++);
  const canvas=h.dialog.querySelector('canvas');
  const arrow=canvas.emit('keydown',{key:'ArrowLeft'});assert.equal(arrow.prevented,true);assert.deepEqual(h.viewers[0].calls.rotations,[1]);
  for(const type of ['click','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','wheel','keyup'])assert.equal(canvas.emit(type,{key:'q',code:'KeyQ'}).stopped,true);
  assert.equal(leaked,0);
  const light=h.dialog.querySelectorAll('[data-light]')[2];light.emit('click');assert.deepEqual(h.viewers[0].calls.lights,['night']);assert.equal(light.attrs['aria-pressed'],'true');
  h.close();
});

test('closing during the lazy import prevents late WebGL creation and restores previous focus',async()=>{
  let finish;const h=harness({load:module=>new Promise(resolve=>{finish=()=>resolve(module);})});
  await h.open();assert.equal(h.viewers.length,0);assert.ok(h.dialog);
  h.close();finish();await flush();
  assert.equal(h.viewers.length,0);assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);assert.equal(h.dialog,null);assert.equal(h.document.activeElement,h.previous);
});

test('normal close disposes once, removes resize observation and cancels rendering',async()=>{
  const h=harness();await h.open();h.frame(1100);assert.equal(h.viewers[0].calls.render,1);
  const staleFrame=[...h.frames.values()][0];h.close();h.close();staleFrame(2200);
  assert.equal(h.viewers[0].calls.dispose,1);assert.equal(h.viewers[0].calls.render,1);assert.equal(h.frames.size,0);
  assert.ok(h.observers.every(observer=>observer.disconnected));assert.equal(h.dialog,null);assert.equal(h.document.activeElement,h.previous);
});

test('the functional catalog is a normal documentation link, not a game command',async()=>{
  const h=harness();await h.open();
  assert.match(h.dialog.innerHTML,/<a class="life-functions" href="\/help\/funcionalidades\/" target="_blank" rel="noopener">/);
  let leaked=0;h.body.addEventListener('click',()=>leaked++);
  const click=h.dialog.querySelector('.life-functions').emit('click');
  assert.equal(click.prevented,false,'keep the normal browser link behavior');
  assert.equal(click.stopped,true,'do not activate a legacy canvas action underneath');
  assert.equal(leaked,0);assert.equal(h.viewers[0].calls.dispose,0);
  assert.ok(h.dialog.open,'documentation does not restart or close the twin');
  h.close();
});

test('game transitions without a representable snapshot close the view instead of showing stale moving actors',async()=>{
  const h=harness();await h.open();h.frame(1100);
  assert.match(h.dialog.querySelector('.life-state').textContent,/1 cliente en la simulación/);
  h.setRaw({...h.raw,active:false});h.frame(2200);
  assert.equal(h.dialog,null);assert.equal(h.frames.size,0);assert.equal(h.viewers[0].calls.dispose,1);assert.equal(h.viewers[0].calls.render,1);
});

test('failed module load exposes retry and the retry creates only one active viewer',async()=>{
  const h=harness({load:(module,attempt)=>attempt===1?Promise.reject(new Error('network unavailable')):Promise.resolve(module)});
  await h.open();assert.equal(h.viewers.length,0);assert.equal(h.frames.size,0);
  const loading=h.dialog.querySelector('.life-loading');assert.equal(loading.hidden,false);assert.equal(loading.querySelector('button').hidden,false);
  loading.querySelector('button').emit('click');await flush();
  assert.equal(h.viewers.length,1);assert.equal(h.frames.size,1);assert.equal(h.dialog.querySelector('.life-loading').hidden,true);h.close();
});

test('unavailable initial game cancels its connection polling when the user closes',async()=>{
  const h=harness();h.setRaw({active:false});await h.open();assert.equal(h.viewers.length,0);assert.equal(h.timers.size,1);
  h.close();await h.timer(40000);assert.equal(h.timers.size,0);assert.equal(h.viewers.length,0);assert.equal(h.dialog,null);
});

test('closing selection clears the renderer halo and context loss offers recovery without background frames',async()=>{
  const h=harness();await h.open();const viewer=h.viewers[0],dialog=h.dialog;
  viewer.options.onSelect({actor:{kind:'customer',label:'Ada'}});assert.equal(dialog.querySelector('.life-selection').hidden,false);
  dialog.querySelector('.life-selection-close').emit('click');assert.equal(viewer.calls.clearSelection,1);assert.equal(dialog.querySelector('.life-selection').hidden,true);
  const event=dialog.querySelector('canvas').emit('webglcontextlost');assert.equal(event.prevented,true);assert.equal(viewer.calls.dispose,1);
  assert.equal(h.frames.size,0);assert.equal(dialog.querySelector('.life-loading').querySelector('button').hidden,false);h.close();assert.equal(viewer.calls.dispose,1);
});

test('a scene-construction failure releases the newly allocated WebGL renderer before retry',()=>{
  const rendererSource=fs.readFileSync(new URL('./life-renderer.mjs',import.meta.url),'utf8')
    .replace(/^import .*;\n/gm,'').replace('export function createLifeRenderer','function createLifeRenderer');
  const calls=[];
  const context=vm.createContext({T:{WebGLRenderer:class {
    constructor(){this.shadowMap={};calls.push('allocate');}
    setClearColor(){}dispose(){calls.push('dispose');}forceContextLoss(){calls.push('release-context');}
  }},createLifeScene(){throw new Error('texture initialization failed');}});
  vm.runInContext(rendererSource,context);
  assert.throws(()=>context.createLifeRenderer({canvas:{},snapshot:{}}),/texture initialization failed/);
  assert.deepEqual(calls,['allocate','dispose','release-context']);
});

test('router abort cancels the real Life import and every event retains its opening requestId',async()=>{
  let finish;const h=harness({load:module=>new Promise(resolve=>{finish=()=>resolve(module);})});
  const states=[],controller=new AbortController();h.subscribe(state=>states.push(state));
  await h.open({signal:controller.signal,requestId:42});controller.abort();finish();await flush();
  assert.equal(h.dialog,null);assert.equal(h.viewers.length,0);assert.equal(h.frames.size,0);
  assert.ok(states.every(state=>state.requestId===42));assert.equal(states.at(-1).reason,'switch');
});

test('retry keeps the same dialog and router request instead of opening an unowned view',async()=>{
  const h=harness({load:(module,attempt)=>attempt===1?Promise.reject(new Error('network')):Promise.resolve(module)});
  const states=[],controller=new AbortController();h.subscribe(state=>states.push(state));
  await h.open({signal:controller.signal,requestId:17});const original=h.dialog;
  original.querySelector('.life-loading').querySelector('button').emit('click');await flush();
  assert.equal(h.dialog,original);assert.equal(h.viewers.length,1);
  assert.ok(states.every(state=>state.requestId===17&&state.open));
  controller.abort();assert.equal(h.dialog,null);assert.equal(h.viewers[0].calls.dispose,1);
});

test('mapping controls return to the reference and distinguish free camera exploration',async()=>{
  const h=harness();await h.open();const viewer=h.viewers[0];
  h.dialog.querySelector('canvas').emit('keydown',{key:'Home'});
  assert.deepEqual(viewer.calls.presets,['mapped']);
  viewer.options.onCameraChange({mode:'mapped'});
  assert.match(h.dialog.querySelector('.life-mapping-state').textContent,/cámara alineada/);
  viewer.options.onCameraChange({mode:'free'});
  assert.match(h.dialog.querySelector('.life-mapping-state').textContent,/Exploración libre/);
  assert.equal(h.dialog.querySelectorAll('[data-preset]')[0].attrs['aria-pressed'],'false');h.close();
});

test('WebGL recovery uses a fresh canvas and ignores queued context loss from the disposed viewer',async()=>{
  const h=harness();await h.open({requestId:31});const oldCanvas=h.dialog.querySelector('canvas');
  h.dialog.querySelectorAll('[data-light]')[2].emit('click');
  h.viewers[0].options.onSelect({actor:{kind:'customer',label:'Ada'}});
  oldCanvas.emit('webglcontextlost');assert.equal(h.viewers[0].calls.dispose,1);
  assert.equal(h.dialog.querySelector('.life-selection').hidden,true);
  h.dialog.querySelector('.life-loading').querySelector('button').emit('click');await flush();
  const current=h.viewers[1];assert.notEqual(current.options.canvas,oldCanvas);
  assert.deepEqual(current.calls.lights,['night']);
  oldCanvas.emit('webglcontextlost');assert.equal(current.calls.dispose,0);assert.equal(h.frames.size,1);
  assert.equal(h.dialog.querySelector('.life-loading').hidden,true);h.close();
});
