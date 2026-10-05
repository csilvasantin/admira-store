import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {interfaceTranslator} from './interface-language.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';

// Execute the actual UI controller with renderer and panel adapters injected. No
// WebGL/browser, external media, game loop or source files are changed by this
// harness; the fake DOM exercises observable scheduling and event propagation.
const source=fs.readFileSync(new URL('./life-ui.mjs?v=ipad-20261005-1',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'')
  .replace(/await import\('\.\/life-renderer\.mjs\?v=[^']+'\)/,'await loadRenderer()')
  .replace(/^export \{.*\};?\s*$/m,'');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const releaseInputs=html.match(/window\.__xtancoReleaseInputs=.*;/)?.[0];
const flush=async()=>{for(let i=0;i<5;i++)await Promise.resolve();};

function harness({load,loadParts,search=''}={}){
  let document;
  class Element {
    constructor(name){
      this.name=name;this.hidden=false;this.dataset={};this.attrs={};this.style={};this.children=new Map();this.appended=[];this.listeners={};this.firstChild={textContent:''};
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
    append(child){child.parent=this;this.appended.push(child);} prepend(child){child.parent=this;this.appended.unshift(child);}
    remove(){this.removed=true;if(this.parent)this.parent.appended=this.parent.appended.filter(child=>child!==this);this.parent=null;}
    replaceWith(next){const parent=this.parent;for(const [key,value]of parent.children)if(value===this)parent.children.set(key,next);next.parent=parent;this.parent=null;}
    show(){this.open=true;} close(){this.open=false;}
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
  document={body,activeElement:previous,hidden:false,documentElement:{lang:'es'},createElement:name=>{created.push(name);return new Element(name);},querySelector:()=>actions};
  const window=new Element('window');body.parent=window;
  let raw={active:true,vertical:'xtanco',iso:{cols:14,rows:8,ox:270,oy:185,tileW:80,tileH:28,wallH:165},
    game:{staff:[],custs:[{x:343,y:249,dir:1,st:'walk'}],gameTime:14,custIn:3}};
  window.__xtancoVisualState=()=>raw;
  const keys={KeyQ:true,KeyP:true},frames=new Map(),timers=new Map(),viewers=[],observers=[],panels=[],floating=[],registry=new Map();let previewStops=0;
  window.__shelfScreenPreview={stop(){previewStops++;}};
  const attachFloatingPanel=(panel,options)=>{
    const header=new Element('floating-header');if(!options.handle)panel.prepend(header);
    const closeButton=options.closeButton||new Element('floating-close');if(!options.closeButton)header.append(closeButton);
    const entry={panel,options,header,closeButton,disposed:false,restores:0,restore(){if(!this.disposed)this.restores++;},close(){if(this.disposed)return;if(options.onClose)options.onClose();else closeButton.emit('click');},dispose(){this.disposed=true;}};
    if(!options.closeButton)closeButton.onclick=()=>{if(!entry.disposed)options.onClose?.();};floating.push(entry);return entry;
  };
  const registerFloatingPanel=(id,entry)=>{registry.set(id,entry);return ()=>{if(registry.get(id)===entry)registry.delete(id);};};
  const part={id:'product-0-0',numeric_id:23,kind:'product',product_reference:'A02-01'},partsDoc={parts:[part]};
  const mountShelfProductPanel=(host,doc,options)=>{let enabled=!!options.autoOpen;const panel={host,doc,options,disposed:false,selections:[],enabled:()=>enabled,open(){enabled=true;host.emit('click');},select(part){if(!enabled)return;this.selections.push(part);options.onSelect(part);},close(){enabled=false;options.onSelect(null);options.onClose();host.emit('click');},dispose(){this.disposed=true;options.onSelect(null);}};panels.push(panel);return panel;};
  let clock=0,sequence=0,loads=0;
  const createLifeRenderer=options=>{
    const calls={render:0,dispose:0,updates:[],rotations:[],zooms:[],lights:[],presets:[],clearSelection:0,partMode:[],parts:[]};
    const viewer={calls,options,resize(){},update:value=>calls.updates.push(value),render:()=>calls.render++,dispose:()=>calls.dispose++,
      rotate:value=>calls.rotations.push(value),zoomBy:value=>calls.zooms.push(value),setLighting:value=>calls.lights.push(value),preset:value=>calls.presets.push(value),
      clearSelection(){calls.clearSelection++;options.onSelect(null);},setPartMode:value=>calls.partMode.push(value),selectPart:(id,num)=>calls.parts.push({id,num}),get snapshot(){return calls.updates.at(-1)||options.snapshot;}};
    viewers.push(viewer);return viewer;
  };
  const context=vm.createContext({interfaceTranslator,mountTierHud:()=>({setStatus(){},dispose(){}}),loadShelfParts:()=>loadParts?loadParts(partsDoc):Promise.resolve(partsDoc),mountShelfProductPanel,attachFloatingPanel,registerFloatingPanel,document,window,keys,createLifeSnapshot,createTierControls:()=>({element:new Element('tiers'),dispose(){}}),performance:{now:()=>clock},URLSearchParams,location:{search},
    console:{warn(){}},loadRenderer:()=>{loads++;return load?load({createLifeRenderer},loads):Promise.resolve({createLifeRenderer});},
    requestAnimationFrame:fn=>{const id=++sequence;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    setTimeout:(fn,delay)=>{const id=++sequence;timers.set(id,{fn,at:clock+delay});return id;},clearTimeout:id=>timers.delete(id),
    ResizeObserver:class {constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
  });
  assert.ok(releaseInputs,'the shared game must expose its explicit held-input release hook');
  vm.runInContext(releaseInputs,context);
  vm.runInContext(source+';globalThis.audit={open,close,subscribeLifeView,dialog:()=>dialog};',context);
  return {context,document,window,body,previous,keys,frames,timers,viewers,observers,created,panels,part,floating,registry,get previewStops(){return previewStops;},
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
  await h.open();h.floating.find(value=>value.panel===h.dialog.querySelector('.life-loading')&&!value.disposed).closeButton.emit('click');
  assert.equal(states.at(-1).reason,'','a DOM click event must not be mistaken for a close reason');
});

test('registered surface releases held movement keys, keeps local camera actions, and blocks underlying game events',async()=>{
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

test('Better contains only the registered scene while the shared HUD, Expert selector and CLI remain outside',async()=>{
  const h=harness();await h.open();
  assert.match(h.dialog.className,/visual-tier-surface/);assert.match(h.dialog.innerHTML,/02\.- BETTER · 16 BITS/);
  assert.doesNotMatch(h.dialog.innerHTML,/data-visual-mode|life-header|life-footer|Salir del comparador/);
  assert.ok(h.dialog.open);h.close();
});

test('Xtanco Best mounts closed component selection and uses numeric parts from a specific shelf instance',async()=>{
  const h=harness();h.setRaw({...h.raw,layout:[{id:'shelf-A',type:'shelves',col:4,row:1},{id:'shelf-B',type:'shelves',col:6,row:1}]});await h.open({tier:'best'});await flush();
  assert.equal(h.panels.length,1);const panel=h.panels[0],viewer=h.viewers[0];assert.equal(panel.enabled(),false);assert.equal(viewer.calls.partMode.at(-1),false);
  panel.open();assert.equal(viewer.calls.partMode.at(-1),true);viewer.options.onSelect({item:viewer.snapshot.layout[1],layoutId:'shelf-B',partNumericId:23});
  assert.equal(panel.selections.at(-1),h.part);assert.deepEqual(viewer.calls.parts.at(-1),{id:'shelf-B',num:23});assert.equal(h.dialog.querySelector('.life-selection').hidden,true);
  viewer.options.onSelect(null);assert.equal(panel.selections.at(-1),null);assert.deepEqual(viewer.calls.parts.at(-1),{id:null,num:null});
  panel.close();assert.equal(viewer.calls.partMode.at(-1),false);h.close();assert.equal(panel.disposed,true);
});

test('product deep link auto-opens selection only in Xtanco Best; stale parts cannot mount after close',async()=>{
  const linked=harness({search:'?visual=best&select=products'});await linked.open({tier:'best'});await flush();assert.equal(linked.panels[0].enabled(),true);linked.close();
  const better=harness({search:'?select=products'});await better.open();assert.equal(better.panels.length,0);better.close();
  const cafe=harness({search:'?select=products'});cafe.setRaw({...cafe.raw,vertical:'cafeteria'});await cafe.open({tier:'best'});assert.equal(cafe.panels.length,0);cafe.close();
  let resolveParts;const stale=harness({loadParts:doc=>new Promise(resolve=>{resolveParts=()=>resolve(doc);})});await stale.open({tier:'best'});stale.close();resolveParts();await flush();assert.equal(stale.panels.length,0);
});

test('the shelf window X removes the whole tool and its registered opener remounts actual component selection',async()=>{
  const h=harness();await h.open({tier:'best'});await flush();
  const first=h.panels[0],viewer=h.viewers[0],floating=h.floating.find(value=>value.panel===first.host),opener=h.registry.get('life-shelf-components');
  first.open();viewer.options.onSelect({item:{id:'shelves'},partNumericId:23});assert.equal(viewer.calls.parts.at(-1).num,23);
  const stops=h.previewStops;floating.closeButton.emit('click');
  assert.equal(first.disposed,true);assert.equal(first.host.removed,true);assert.equal(floating.disposed,true);assert.equal(viewer.calls.partMode.at(-1),false);assert.deepEqual(viewer.calls.parts.at(-1),{id:null,num:null});assert.equal(h.previewStops,stops+1);
  const counts={mode:viewer.calls.partMode.length,parts:viewer.calls.parts.length};
  first.options.onSelect(h.part);first.options.onClose();first.host.emit('click');
  assert.equal(viewer.calls.partMode.length,counts.mode);assert.equal(viewer.calls.parts.length,counts.parts);
  assert.equal(h.registry.get('life-shelf-components'),opener);opener.open();await flush();
  assert.equal(h.panels.length,2);const second=h.panels[1];assert.notEqual(second.host,first.host);assert.equal(second.enabled(),true);assert.equal(viewer.calls.partMode.at(-1),true);
  viewer.options.onSelect({item:{id:'shelves'},partNumericId:23});assert.equal(second.selections.at(-1),h.part);h.close();assert.equal(second.disposed,true);
});

test('the registered shelf opener expands a collapsed live launcher rather than creating a second tool',async()=>{
  const h=harness();await h.open({tier:'best'});await flush();const panel=h.panels[0];panel.open();panel.close();assert.equal(panel.enabled(),false);
  h.registry.get('life-shelf-components').open();await flush();assert.equal(panel.enabled(),true);assert.equal(h.panels.length,1);assert.equal(h.viewers[0].calls.partMode.at(-1),true);h.close();
});

test('a loading or failed components window retains its movable header and X; late loading cannot recreate a closed tool',async()=>{
  let finish;const pending=harness({loadParts:doc=>new Promise(resolve=>{finish=()=>resolve(doc);})});await pending.open({tier:'best'});
  const floating=pending.floating.find(value=>value.options.key==='xp-floating-life-shelf-v1');assert.ok(floating);assert.equal(floating.panel.dataset.state,'loading');assert.ok(floating.restores);
  floating.closeButton.emit('click');assert.equal(floating.disposed,true);assert.equal(floating.panel.removed,true);finish();await flush();assert.equal(pending.panels.length,0);pending.close();
  let attempts=0;const failed=harness({loadParts:doc=>++attempts===1?Promise.reject(new Error('parts unavailable')):Promise.resolve(doc)});await failed.open({tier:'best'});await flush();
  const errorWindow=failed.floating.find(value=>value.options.key==='xp-floating-life-shelf-v1');assert.equal(errorWindow.panel.dataset.state,'error');assert.equal(errorWindow.header.parent,errorWindow.panel);assert.match(errorWindow.panel.appended.find(value=>value.attrs.role==='status').textContent,/Avanzado.*Ventanas/);
  failed.registry.get('life-shelf-components').open();await flush();assert.equal(errorWindow.disposed,true);assert.equal(errorWindow.panel.removed,true);assert.equal(failed.panels.length,1);assert.equal(failed.panels[0].enabled(),true);failed.close();
});

test('closing the scene disposes every floating window, unregisters its openers and rejects stale shelf and renderer callbacks',async()=>{
  const h=harness({search:'?select=products'});await h.open({tier:'best'});await flush();
  const oldViewer=h.viewers[0],oldPanel=h.panels[0],entries=[...h.registry.values()];assert.equal(h.registry.size,2);
  h.close();assert.equal(h.registry.size,0);assert.ok(h.floating.every(value=>value.disposed));assert.equal(oldPanel.disposed,true);
  const calls={parts:oldViewer.calls.parts.length,mode:oldViewer.calls.partMode.length};
  oldPanel.options.onSelect(h.part);oldPanel.options.onClose();oldViewer.options.onSelect({actor:{label:'Stale'}});for(const entry of entries)entry.open();await flush();
  assert.equal(h.dialog,null);assert.equal(h.panels.length,1);assert.equal(h.viewers.length,1);assert.equal(oldViewer.calls.parts.length,calls.parts);assert.equal(oldViewer.calls.partMode.length,calls.mode);
  await h.open();const fresh=h.viewers[1];fresh.options.onSelect(null);assert.equal(h.dialog.querySelector('.life-selection').hidden,true);
  oldViewer.options.onSelect({actor:{label:'Stale'}});for(const entry of entries)entry.open();await flush();assert.equal(h.panels.length,1);assert.equal(h.dialog.querySelector('.life-selection').hidden,true);h.close();
});

test('Better labels the reversible empty presentation without claiming the live people are visible',async()=>{
  const h=harness();h.setRaw({...h.raw,moving:true,layout:[]});await h.open();h.frame(1100);
  assert.match(h.dialog.querySelector('.life-state').textContent,/Mudanza activa.*suelo y paredes/);
  assert.deepEqual(h.viewers[0].calls.updates.at(-1).actors,[]);h.close();
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
  const loading=h.dialog.querySelector('.life-loading');assert.equal(loading.hidden,false);assert.equal(loading.querySelector('.life-retry').hidden,false);
  loading.querySelector('.life-retry').emit('click');await flush();
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
  assert.equal(h.frames.size,0);assert.equal(dialog.querySelector('.life-loading').querySelector('.life-retry').hidden,false);h.close();assert.equal(viewer.calls.dispose,1);
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
  original.querySelector('.life-loading').querySelector('.life-retry').emit('click');await flush();
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
  assert.match(h.dialog.querySelector('.life-mapping-state').textContent,/exploración libre/);
  assert.equal(h.dialog.querySelectorAll('[data-preset]')[0].attrs['aria-pressed'],'false');h.close();
});

test('WebGL recovery uses a fresh canvas and ignores queued context loss from the disposed viewer',async()=>{
  const h=harness();await h.open({requestId:31});const oldCanvas=h.dialog.querySelector('canvas');
  h.dialog.querySelectorAll('[data-light]')[2].emit('click');
  h.viewers[0].options.onSelect({actor:{kind:'customer',label:'Ada'}});
  oldCanvas.emit('webglcontextlost');assert.equal(h.viewers[0].calls.dispose,1);
  assert.equal(h.dialog.querySelector('.life-selection').hidden,true);
  h.dialog.querySelector('.life-loading').querySelector('.life-retry').emit('click');await flush();
  const current=h.viewers[1];assert.notEqual(current.options.canvas,oldCanvas);
  assert.deepEqual(current.calls.lights,['night']);
  oldCanvas.emit('webglcontextlost');assert.equal(current.calls.dispose,0);assert.equal(h.frames.size,1);
  assert.equal(h.dialog.querySelector('.life-loading').hidden,true);h.close();
});
