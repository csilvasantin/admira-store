import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createVisualTiers} from './xtanco-visual-tiers.mjs';
import {executeVisualCommand} from './xtanco-visual-command.mjs';
const source=fs.readFileSync(new URL('./best-preview-ui.mjs',import.meta.url),'utf8');
function harness({modalFailure=false,immediate=false}={}){
 let document,releases=0;
 const created=[],layers=[];
 class Element{
  constructor(tag){this.tag=tag;this.attrs={};this.children=[];this.queries=new Map();this.listeners={};const classes=new Set();this.classList={add:value=>classes.add(value),contains:value=>classes.has(value)};}
  setAttribute(key,value){this.attrs[key]=String(value);}
  querySelector(selector){if(!this.queries.has(selector)){const child=new Element(selector);child.parent=this;this.queries.set(selector,child);this.children.push(child);}return this.queries.get(selector);}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  append(child){child.remove();child.parent=this;this.children.push(child);}
  remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
  show(){if(modalFailure)throw Error('show failed');this.open=true;}
  close(){this.open=false;}
  focus(){document.activeElement=this;}
  getBoundingClientRect(){return {width:1000,height:625};}
  emit(type,props={}){const event={type,target:this,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};for(let node=this;node;node=node.parent){for(const fn of node.listeners[type]||[])fn(event);if(event.stopped)break;}return event;}
 }
 const body=new Element('body'),previous=new Element('previous'),window=new Element('window');body.parent=window;
 document={body,activeElement:previous,createElement(tag){created.push(tag);return new Element(tag);}};
 window.__xtancoReleaseInputs=()=>releases++;
 function mountInventoryBest(container,onReady){const layer={container,onReady,disposed:false};layers.push(layer);if(immediate)onReady();return()=>{layer.disposed=true;};}
 const context=vm.createContext({mountTierHud:()=>({setStatus(){},dispose(){}}),document,window,mountInventoryBest});
 vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openBestView,closeBestView,subscribeBestView,get dialog(){return dialog;}};',context);
 return {body,window,document,previous,created,layers,get releases(){return releases;},get dialog(){return context.audit.dialog;},open:options=>context.audit.openBestView(options),close:reason=>context.audit.closeBestView(reason),subscribe:fn=>context.audit.subscribeBestView(fn)};
}

test('Best starts one live 3D view without an inventory flag or a static image',()=>{
 const h=harness();assert.deepEqual(h.created,[]);h.open({requestId:1});
 assert.deepEqual(h.created,['dialog']);assert.equal(h.dialog.open,true);assert.equal(h.releases,1);assert.equal(h.layers.length,1);
 assert.match(h.dialog.attrs['aria-label'],/3D en vivo/);assert.match(h.dialog.innerHTML,/BEST · 32 BITS · 3D EN VIVO/);
 assert.doesNotMatch(h.dialog.innerHTML,/<img|<video|<audio|<iframe/);assert.doesNotMatch(source,/URLSearchParams|createBestPeopleLayer/);
 assert.equal(h.dialog.classList.contains('is-visible'),true);
});

test('readiness retains request identity, is idempotent and closing releases resources and focus',()=>{
 const h=harness(),states=[],unsubscribe=h.subscribe(state=>states.push({...state}));h.open({requestId:44});const dialog=h.dialog;h.open({requestId:45});
 assert.equal(h.layers.length,1);assert.equal(states.length,1);assert.equal(states[0].requestId,44);assert.equal(states[0].busy,true);
 h.layers[0].onReady();assert.equal(states.length,2);assert.equal(states[1].busy,false);assert.equal(states[1].requestId,44);
 h.close('switch');h.close('switch');assert.equal(states.length,3);assert.equal(states[2].reason,'switch');assert.equal(h.layers[0].disposed,true);
 assert.equal(dialog.removed,true);assert.equal(h.document.activeElement,h.previous);
 unsubscribe();h.open();h.close();assert.equal(states.length,3);
});

test('immediate renderer readiness cannot be overwritten by a later busy announcement',()=>{
 const h=harness({immediate:true}),states=[];h.subscribe(s=>states.push(s));h.open();assert.deepEqual(states.map(s=>s.busy),[true,false]);
});

test('aborted requests do not mount and stale callbacks never affect the next view',()=>{
 const h=harness(),first=new AbortController();first.abort();h.open({signal:first.signal});assert.equal(h.layers.length,0);
 const second=new AbortController();h.open({signal:second.signal,requestId:2});second.abort();assert.equal(h.dialog,null);assert.equal(h.layers[0].disposed,true);
 const states=[];h.subscribe(s=>states.push(s));h.open({requestId:3});h.layers[0].onReady('stale error');assert.equal(states.length,1);assert.equal(states[0].busy,true);
 h.layers[1].onReady();assert.equal(states.at(-1).error,'');assert.equal(states.at(-1).requestId,3);
});

test('scene interactions cannot leak into the underlying game and Escape returns focus',()=>{
 const h=harness();h.open();let leaked=0;
 for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress']){h.body.addEventListener(type,()=>leaked++);assert.equal(h.dialog.querySelector('.best-stage').emit(type,{key:'q'}).stopped,true,type);}
 assert.equal(leaked,0);const escape=h.dialog.emit('keydown',{key:'Escape'});assert.equal(escape.prevented,true);assert.equal(h.dialog,null);assert.equal(h.document.activeElement,h.previous);
});

test('pagehide releases the active renderer without hiding the shared Expert menu',()=>{
 const h=harness(),states=[];h.subscribe(s=>states.push(s));h.open({requestId:3});assert.doesNotMatch(h.dialog.innerHTML,/data-visual-mode|best-header|best-footer/);
 h.window.emit('pagehide');assert.equal(h.dialog,null);assert.equal(h.layers[0].disposed,true);assert.equal(states.at(-1).reason,'pagehide');
});

test('/modo best waits for a rendered frame and handles failure or cancellation',{timeout:2000},async()=>{
 for(const completion of ['ready','error','close','switch']){
  const h=harness(),router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,openBetter(){},closeBetter(){}});let settled=false;
  const command=executeVisualCommand('/modo best',{router}).then(result=>{settled=true;return result;});await Promise.resolve();await Promise.resolve();assert.equal(settled,false);assert.equal(router.busy,true);
  if(completion==='close')h.close();else if(completion==='switch')await router.choose('better');else h.layers[0].onReady(completion==='error'?'No se ha podido abrir Best 3D.':'');
  const result=await command;assert.equal(result.ok,completion==='ready');
  if(completion==='ready'){assert.equal(result.preview,true);assert.equal(result.busy,false);}
  if(completion==='error'){assert.equal(router.busy,false);assert.match(router.error,/Best 3D/);assert.ok(h.dialog);}
  if(completion==='close'||completion==='switch'){assert.equal(result.cancelled,true);h.layers[0].onReady();assert.equal(router.mode,completion==='close'?'good':'better');}
  router.dispose();
 }
});

test('dialog creation failure is cleaned by the router',async()=>{
 const h=harness({modalFailure:true}),router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe});
 const result=await router.choose('best');assert.equal(result.ok,false);assert.equal(router.mode,'good');assert.equal(h.dialog,null);assert.equal(h.body.children.length,0);assert.equal(h.layers.length,0);router.dispose();
});

test('switching Best and Better through the shared router releases exactly one renderer',async()=>{
 const h=harness();let listener,betterOpen=0,betterClose=0;
 const router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,subscribeBetter(fn){listener=fn;return()=>{};},openBetter({requestId}){betterOpen++;listener({open:true,busy:false,requestId});},closeBetter(){betterClose++;listener({open:false,busy:false});}});
 const first=router.choose('best');h.layers[0].onReady();await first;await router.choose('better');assert.equal(h.layers[0].disposed,true);assert.equal(betterOpen,1);
 const second=router.choose('best');h.layers[1].onReady();await second;assert.equal(betterClose,1);await router.choose('good');assert.equal(h.layers[1].disposed,true);router.dispose();
});
