import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createVisualTiers} from './xtanco-visual-tiers.mjs';
import {executeVisualCommand} from './xtanco-visual-command.mjs';

const source=fs.readFileSync(new URL('./best-preview-ui.mjs',import.meta.url),'utf8');
const controlSource=fs.readFileSync(new URL('./visual-tier-controls.mjs',import.meta.url),'utf8');
function harness({modalFailure=false,imageComplete=false,imageNaturalWidth=0}={}){
  let document,releaseCount=0;
  const created=[],selected=[];
  class Element{
    constructor(tag){this.tag=tag;this.attrs={};this.dataset={};this.children=[];this.queries=new Map();this.listeners={};this.hidden=false;}
    setAttribute(key,value){this.attrs[key]=String(value);}
    set innerHTML(value){
      this.markup=value;
      if(this.tag!=='div')return;
      this.children=[...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match=>{
        const button=new Element('button');button.parent=this;button.textContent=match[2].replace(/<[^>]+>/g,'');
        for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)){button.attrs[attr[1]]=attr[2];if(attr[1]==='data-visual-mode')button.dataset.visualMode=attr[2];}
        return button;
      });
    }
    get innerHTML(){return this.markup;}
    querySelector(selector){
      if(!this.queries.has(selector)){
        const child=new Element(selector==='img'?'img':selector);child.parent=this;
        if(selector==='img'){child.complete=imageComplete;child.naturalWidth=imageNaturalWidth;}
        if(selector==='.best-image-error')child.hidden=true;
        this.queries.set(selector,child);this.children.push(child);
      }
      return this.queries.get(selector);
    }
    querySelectorAll(selector){assert.equal(selector,'[data-visual-mode]');return this.children.filter(child=>child.dataset.visualMode);}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    append(child){child.remove();child.parent=this;this.children.push(child);}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
    showModal(){if(modalFailure)throw Error('showModal failed');this.open=true;}
    close(){this.open=false;}
    focus(){document.activeElement=this;}
    getContext(){throw Error('Best preview must not allocate graphics');}
    emit(type,props={}){
      const event={type,target:this,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};
      for(let node=this;node;node=node.parent){node[`on${type}`]?.(event);for(const fn of node.listeners[type]||[])fn(event);if(event.stopped)break;}
      return event;
    }
  }
  const body=new Element('body'),previous=new Element('previous'),window=new Element('window');body.parent=window;
  document={body,activeElement:previous,createElement(tag){created.push(tag);return new Element(tag);}};
  window.__xtancoReleaseInputs=()=>releaseCount++;
  window.__xtancoVisualTiers={choose:tier=>selected.push(tier)};
  window.__xtancoVisualState=()=>{throw Error('static preview must not read or invent game state');};
  const context=vm.createContext({document,window,fetch(){throw Error('No fetch or operational network calls');}});
  vm.runInContext(controlSource.replace(/export function /g,'function '),context);
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openBestView,closeBestView,subscribeBestView,get dialog(){return dialog;}};',context);
  return {body,window,document,previous,created,selected,context,get releases(){return releaseCount;},get dialog(){return context.audit.dialog;},
    open:options=>context.audit.openBestView(options),close:reason=>context.audit.closeBestView(reason),subscribe:fn=>context.audit.subscribeBestView(fn)};
}

test('Best remains dormant until opened and creates only a static dialog and selector, never GPU/media players',()=>{
  const h=harness();assert.deepEqual(h.created,[]);assert.equal(h.dialog,undefined);
  h.open({requestId:1});assert.deepEqual(h.created,['dialog','div']);assert.equal(h.dialog.open,true);assert.equal(h.releases,1);
  assert.match(h.dialog.innerHTML,/CONCEPTO ESTÁTICO · NO OPERATIVO/);
  assert.match(h.dialog.innerHTML,/no sigue la cámara, los muebles ni los clientes en tiempo real/);
  assert.match(h.dialog.innerHTML,/<img[^>]+best-xtanco-mapped-20260915\.png/);
  assert.doesNotMatch(h.dialog.innerHTML,/<(?:canvas|video|audio|iframe)\b/i);
  assert.doesNotMatch(source,/createLifeRenderer|WebGL|requestAnimationFrame|setInterval|__xtExec/);
});

test('Best emits the request identity, opens idempotently, restores focus and removes subscriptions',()=>{
  const h=harness(),states=[],unsubscribe=h.subscribe(state=>states.push({...state}));
  h.open({requestId:44});const dialog=h.dialog;h.open({requestId:45});
  assert.equal(h.dialog,dialog);assert.equal(states.length,1);assert.equal(states[0].requestId,44);assert.equal(states[0].open,true);
  assert.equal(states[0].busy,true);assert.equal(h.releases,1);
  dialog.querySelector('img').emit('load');assert.equal(states.length,2);assert.equal(states[1].busy,false);assert.equal(states[1].requestId,44);
  h.close('switch');h.close('switch');assert.equal(states.length,3);assert.equal(states[2].requestId,44);assert.equal(states[2].reason,'switch');assert.equal(states[2].busy,false);
  assert.equal(h.dialog,null);assert.equal(dialog.open,false);assert.equal(dialog.removed,true);assert.equal(h.document.activeElement,h.previous);
  unsubscribe();h.open({requestId:46});h.close();assert.equal(states.length,3);
});

test('an already aborted request never opens; abort of an active view cleans it without affecting later opens',()=>{
  const h=harness(),first=new AbortController();first.abort();h.open({signal:first.signal,requestId:1});assert.deepEqual(h.created,[]);
  const second=new AbortController();h.open({signal:second.signal,requestId:2});second.abort();assert.equal(h.dialog,null);
  const third=new AbortController();h.open({signal:third.signal,requestId:3});const dialog=h.dialog;
  second.abort();assert.equal(h.dialog,dialog);h.close();third.abort();assert.equal(h.dialog,null);
});

test('pointer, touch, wheel and keyboard events cannot leak into the underlying game',()=>{
  const h=harness();h.open();let leaked=0;
  const events=['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress'];
  for(const type of events)h.body.addEventListener(type,()=>leaked++);
  for(const type of events)assert.equal(h.dialog.querySelector('img').emit(type,{key:'q'}).stopped,true,type);
  assert.equal(leaked,0);assert.equal(h.dialog.open,true);
  const escape=h.dialog.emit('keydown',{key:'Escape'});assert.equal(escape.prevented,true);assert.equal(h.dialog,null);assert.equal(leaked,0);
});

test('native cancel, close button and pagehide publish distinct safe close events',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));
  h.open({requestId:1});assert.equal(h.dialog.emit('cancel').prevented,true);assert.equal(h.dialog,null);assert.equal(states.at(-1).reason,'');
  h.open({requestId:2});h.dialog.querySelector('.best-close').emit('click');assert.equal(states.at(-1).open,false);assert.equal(states.at(-1).requestId,2);
  h.open({requestId:3});h.window.emit('pagehide');assert.equal(h.dialog,null);assert.equal(states.at(-1).reason,'pagehide');assert.equal(states.at(-1).requestId,3);
});

test('image failure remains explicit and stale image load or error events cannot corrupt the next dialog',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:1});
  const oldImage=h.dialog.querySelector('img');oldImage.emit('error');assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);
  assert.match(states.at(-1).error,/imagen conceptual/);assert.equal(states.at(-1).requestId,1);assert.equal(states.at(-1).open,true);assert.equal(states.at(-1).busy,false);
  h.close();h.open({requestId:2});const count=states.length;oldImage.emit('error');oldImage.emit('load');assert.equal(states.length,count);
  assert.equal(states.at(-1).busy,true,'opening again must await its own image');
  assert.equal(h.dialog.querySelector('.best-image-error').hidden,true);
});

test('only a complete cached image with positive natural width can skip waiting for its load event',()=>{
  for(const [complete,width,ready]of [[true,640,true],[true,0,false],[false,640,false]]){
    const h=harness({imageComplete:complete,imageNaturalWidth:width}),states=[];h.subscribe(state=>states.push({...state}));h.open();
    assert.equal(states[0].busy,true);assert.equal(states.at(-1).busy,!ready);assert.equal(states.length,ready?2:1);h.close();
  }
});

test('/modo best waits for the real image and reports failure or cancellation without a false success',{timeout:2000},async()=>{
  for(const completion of ['load','error','close','switch']){
    const h=harness(),router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,openBetter(){},closeBetter(){}});
    let settled=false;const command=executeVisualCommand('/modo best',{router}).then(result=>{settled=true;return result;});
    await Promise.resolve();await Promise.resolve();assert.equal(settled,false);assert.equal(router.mode,'best');assert.equal(router.busy,true);
    const oldImage=h.dialog.querySelector('img');
    if(completion==='close')h.close();else if(completion==='switch')await router.choose('better');else oldImage.emit(completion);
    const result=await command;assert.equal(result.ok,completion==='load');
    if(completion==='load'){assert.equal(result.preview,true);assert.equal(result.availability,'preview');assert.equal(result.busy,false);}
    if(completion==='error'){assert.equal(router.busy,false);assert.match(router.error,/imagen conceptual/);assert.ok(h.dialog);}
    if(completion==='close'||completion==='switch'){
      assert.equal(result.cancelled,true);oldImage.emit('load');oldImage.emit('error');assert.equal(router.mode,completion==='close'?'good':'better');
    }
    assert.deepEqual(h.created,['dialog','div']);router.dispose();
  }
});

test('the three tier buttons forward exact local choices; documentation links retain browser navigation',()=>{
  const h=harness();h.open();
  const controls=h.dialog.querySelector('.best-navigation').children[0];
  for(const button of controls.querySelectorAll('[data-visual-mode]'))button.emit('click');
  assert.deepEqual(h.selected,['good','better','best']);
  const link=h.dialog.querySelector('.best-footer a'),event=link.emit('click');assert.equal(event.prevented,false);assert.equal(event.stopped,true);
  assert.match(h.dialog.innerHTML,/href="\/help\/funcionalidades\/" target="_blank" rel="noopener"/);
});

test('the real router returns to Good and cleans a failed dialog initialization',async()=>{
  const h=harness({modalFailure:true});
  const router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe});
  const result=await router.choose('best');assert.equal(result.ok,false);assert.equal(router.mode,'good');assert.equal(h.dialog,null);
  assert.equal(h.body.children.length,0);assert.equal(h.document.activeElement,h.previous);router.dispose();
});

test('switching from the actual Best selector closes its dialog and opens only the requested view',async()=>{
  const h=harness();let listener,betterOpen=0,betterClose=0;
  const router=createVisualTiers({openBest:h.open,closeBest:h.close,subscribeBest:h.subscribe,
    subscribeBetter(fn){listener=fn;return ()=>{};},
    openBetter({requestId}){betterOpen++;listener({open:true,busy:false,requestId});},
    closeBetter(){betterClose++;listener({open:false,busy:false});},
    onChange:state=>h.context.updateTierControls(state)});
  h.window.__xtancoVisualTiers=router;
  const first=router.choose('best');h.dialog.querySelector('img').emit('load');await first;const oldDialog=h.dialog;
  const buttons=oldDialog.querySelector('.best-navigation').children[0].querySelectorAll('[data-visual-mode]');
  assert.equal(buttons[2].attrs['aria-pressed'],'true');buttons[1].emit('click');await Promise.resolve();
  assert.equal(h.dialog,null);assert.equal(oldDialog.removed,true);assert.equal(router.mode,'better');assert.equal(betterOpen,1);
  const second=router.choose('best');h.dialog.querySelector('img').emit('load');await second;assert.equal(betterClose,1);assert.equal(router.availability,'preview');
  h.dialog.querySelector('.best-close').emit('click');assert.equal(router.mode,'good');assert.equal(h.dialog,null);router.dispose();
});
