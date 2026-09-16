import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TIER_STORAGE_KEY,requestedTier,createVisualTiers} from './xtanco-visual-tiers.mjs';

function memoryStorage(entries={}){
  const values=new Map(Object.entries(entries)),reads=[],writes=[];
  return {values,reads,writes,getItem(key){reads.push(key);return values.get(key)??null;},setItem(key,value){writes.push([key,value]);values.set(key,value);}};
}

// Model the Life controller's observable dialog lifecycle, not a second game
// or renderer. The module harness below runs the actual public selector.
function lifeFixture(){
  const listeners=new Set(),calls={open:0,close:0},requests=[];let opened=false;
  const emit=state=>{opened=state.open;for(const listener of listeners)listener(state);};
  return {calls,listeners,emit,requests,
    openLifeView(options={}){calls.open++;requests.push(options);if(opened)return;emit({open:true,busy:true,error:'',requestId:options.requestId});emit({open:true,busy:false,error:'',requestId:options.requestId});},
    closeLifeView(reason=''){calls.close++;emit({open:false,busy:false,error:'',reason,requestId:requests.at(-1)?.requestId});},
    subscribeLifeView(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
  };
}

function routerFixture(options={}){
  const life=lifeFixture(),best=lifeFixture(),storage=memoryStorage(),changes=[],bestRequests=[];
  const tiers=createVisualTiers({openBetter:life.openLifeView,closeBetter:life.closeLifeView,subscribeBetter:life.subscribeLifeView,storage,
    openBest:best.openLifeView,closeBest:best.closeLifeView,subscribeBest:best.subscribeLifeView,
    onChange:state=>changes.push({...state}),onBestRequested:()=>bestRequests.push(true),...options});
  return {life,best,storage,changes,bestRequests,tiers};
}

test('explicit visual links override preferences and the former Life URL aliases Better',()=>{
  const matrix=[['good','good'],['better','better'],['life','better'],['best','best'],['','good'],['wireframe','good'],['hybridBest','good'],['BEST','good']];
  for(const stored of [undefined,'good','better','best','life'])for(const [input,expected]of matrix){
    const storage=memoryStorage({[TIER_STORAGE_KEY]:stored,xtanco_visual_quality:'best'});
    assert.equal(requestedTier(`?from=portada&visual=${input}`,storage),expected,`${input} with stored ${stored}`);
    assert.deepEqual(storage.reads,[],'an explicit URL must not depend on storage access');
  }
});

test('versioned Better and Best preferences reopen their own view; former hybrid preferences never migrate',()=>{
  assert.equal(TIER_STORAGE_KEY,'xtanco_visual_tier_v2');
  for(const legacy of ['good','better','best']){
    const storage=memoryStorage({xtanco_visual_quality:legacy});
    assert.equal(requestedTier('',storage),'good');assert.deepEqual(storage.reads,[TIER_STORAGE_KEY]);
  }
  for(const [stored,expected]of [['good','good'],['better','better'],['best','best'],['life','good'],['unknown','good']]){
    assert.equal(requestedTier('',memoryStorage({[TIER_STORAGE_KEY]:stored})),expected);
  }
  assert.equal(requestedTier(),'good');
  assert.equal(requestedTier('?visual=life',{getItem(){throw Error('blocked');}}),'better');
  assert.equal(requestedTier('',{getItem(){throw Error('blocked');}}),'good');
});

test('Better opens the live view, and its own close event returns selection and preference to Good',async()=>{
  const f=routerFixture();assert.equal(f.tiers.mode,'good');
  await f.tiers.choose('life');assert.equal(f.life.calls.open,1);assert.equal(f.tiers.mode,'better');
  assert.equal(f.changes.at(-1).busy,false);assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'better');
  f.life.emit({open:false,busy:false,error:''});
  assert.equal(f.tiers.mode,'good');assert.equal(f.changes.at(-1).busy,false);assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
});

test('choosing an already open Better view is idempotent and cannot leave the selector busy',async()=>{
  const f=routerFixture();await f.tiers.choose('better');await f.tiers.choose('better');await f.tiers.choose('life');
  assert.equal(f.life.calls.open,1);assert.equal(f.tiers.mode,'better');assert.equal(f.changes.at(-1).busy,false);
});

test('Best opens only its injected static preview, persists Best and never opens the graphics view',async()=>{
  const f=routerFixture(),result=await f.tiers.choose('best');
  assert.equal(f.life.calls.open,0);assert.equal(f.best.calls.open,1);assert.equal(f.tiers.mode,'best');assert.equal(f.bestRequests.length,1);
  assert.equal(result.ok,true);assert.equal(result.availability,'preview');assert.equal(result.preview,true);
  assert.equal(f.changes.at(-1).busy,false);assert.match(f.changes.at(-1).notice,/Best.*previa estática.*no es.*interactivo/);
  assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'best');
  await f.tiers.choose('best');assert.equal(f.best.calls.open,1,'already open is idempotent');
  await f.tiers.choose('better');assert.equal(f.best.calls.close,1);assert.equal(f.tiers.availability,'interactive');
  await f.tiers.choose('best');assert.equal(f.life.calls.close,1);assert.equal(f.tiers.mode,'best');
  const source=fs.readFileSync(new URL('./xtanco-visual-tiers.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bimport\s|WebGLRenderer|createElement|createLifeRenderer/,'routing must not allocate graphics');
});

test('pagehide preserves either view preference but deliberate closes save Good',async()=>{
  for(const tier of ['better','best']){
    const f=routerFixture();await f.tiers.choose(tier);
    (tier==='better'?f.life:f.best).emit({open:false,busy:false,error:'',reason:'pagehide'});
    assert.equal(f.storage.values.get(TIER_STORAGE_KEY),tier);assert.equal(f.tiers.mode,'good');
    await f.tiers.choose(tier);await f.tiers.choose('good');
    assert.equal(f.tiers.mode,'good');assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
  }
});

test('unavailable storage cannot block navigation and failed opening falls back to Good with a retry notice',async()=>{
  const f=routerFixture({storage:{setItem(){throw Error('quota unavailable');}},openBetter(){throw Error('initialization failed');}});
  await assert.doesNotReject(()=>f.tiers.choose('better'));
  assert.equal(f.tiers.mode,'good');assert.equal(f.changes.at(-1).busy,false);assert.match(f.changes.at(-1).notice,/reintentar/);
  await assert.doesNotReject(()=>f.tiers.choose('best'));
});

test('an open Better error is visible, and disposal detaches its subscription and closes resources',async()=>{
  const f=routerFixture();await f.tiers.choose('better');f.life.emit({open:true,busy:false,error:'WebGL no disponible'});
  assert.equal(f.tiers.mode,'better');assert.equal(f.changes.at(-1).notice,'WebGL no disponible');
  const changes=f.changes.length;f.tiers.dispose();assert.equal(f.life.listeners.size,0);assert.equal(f.life.calls.close,1);
  assert.equal(f.best.listeners.size,0);
  f.life.emit({open:true,busy:false,error:''});assert.equal(f.changes.length,changes);
});

const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('Best without an initializer fails honestly and never borrows the Better renderer',async()=>{
  const f=routerFixture({openBest:undefined}),result=await f.tiers.choose('best');
  assert.equal(result.ok,false);assert.equal(result.mode,'good');assert.equal(result.preview,false);
  assert.equal(f.life.calls.open,0);assert.equal(f.best.calls.open,0);assert.match(result.notice,/Best no disponible/);
});

test('slow switches cancel immediately; late rejection or events cannot replace the newer view',{timeout:2000},async()=>{
  const pending=deferred();let slowOptions;
  const f=routerFixture({openBetter(options){slowOptions=options;return pending.promise;}});
  const first=f.tiers.choose('better'),duplicate=f.tiers.choose('life');
  assert.equal(first,duplicate,'pending same-tier requests share one promise');
  const best=await f.tiers.choose('best'),cancelled=await first;
  assert.equal(cancelled.cancelled,true);assert.equal(best.ok,true);assert.equal(slowOptions.signal.aborted,true);
  pending.reject(Error('late GPU failure'));await Promise.resolve();
  f.life.emit({open:true,busy:false,requestId:slowOptions.requestId});
  assert.equal(f.tiers.mode,'best');assert.equal(f.tiers.error,'');assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'best');
});

test('returning to the same tier ignores events and completion from its obsolete request',{timeout:2000},async()=>{
  const pending=deferred(),requests=[];
  const f=routerFixture({openBest(options){requests.push(options);return requests.length===1?pending.promise:undefined;}});
  const first=f.tiers.choose('best');await f.tiers.choose('better');await f.tiers.choose('best');
  assert.equal((await first).cancelled,true);assert.notEqual(requests[0].requestId,requests[1].requestId);
  f.best.emit({open:false,busy:false,error:'stale failure',requestId:requests[0].requestId});
  pending.resolve();await Promise.resolve();
  assert.equal(f.tiers.mode,'best');assert.equal(f.tiers.busy,false);assert.equal(f.tiers.error,'');
  f.best.emit({open:false,busy:false,requestId:requests[1].requestId});
  assert.equal(f.tiers.mode,'good');assert.equal(f.storage.values.get(TIER_STORAGE_KEY),'good');
});

test('close and dispose cancel pending opens, remove both subscriptions and never erase reload preference',{timeout:2000},async()=>{
  for(const end of ['close','dispose']){
    const pending=deferred();let options;
    const f=routerFixture({openBest(value){options=value;return pending.promise;}}),opening=f.tiers.choose('best');
    if(end==='close')await f.tiers.choose('good');else f.tiers.dispose();
    assert.equal((await opening).cancelled,true);assert.equal(options.signal.aborted,true);
    assert.equal(f.storage.values.get(TIER_STORAGE_KEY),end==='close'?'good':'best');
    if(end==='dispose'){
      const changes=f.changes.length;f.tiers.dispose();assert.equal((await f.tiers.choose('better')).ok,false);
      assert.equal(f.life.listeners.size,0);assert.equal(f.best.listeners.size,0);assert.equal(f.life.calls.open,0);assert.equal(f.changes.length,changes);
    }
    pending.resolve();await Promise.resolve();assert.equal(f.tiers.mode,'good');
  }
});

test('failed Best initialization returns Good while an open preview error stays visible without claiming success',async()=>{
  const failed=routerFixture({openBest(){return Promise.reject(Error('image setup failed'));}});
  const result=await failed.tiers.choose('best');assert.equal(result.ok,false);assert.equal(result.cancelled,undefined);
  assert.equal(failed.tiers.mode,'good');assert.equal(failed.best.calls.close,1);assert.equal(failed.tiers.busy,false);
  const f=routerFixture();await f.tiers.choose('best');f.best.emit({open:true,busy:false,error:'Image unavailable'});
  assert.equal(f.tiers.mode,'best');assert.equal(f.tiers.notice,'Image unavailable');assert.equal((await f.tiers.choose('best')).ok,false);
  f.best.emit({open:true,busy:false,error:''});assert.equal((await f.tiers.choose('best')).ok,true);
});

test('a mounted dialog is not ready: choose waits for renderer success or error after the opener returns',{timeout:2000},async()=>{
  for(const error of ['', 'GPU initialization failed']){
    let emit;
    const f=routerFixture({subscribeBetter(listener){emit=listener;return ()=>{};},openBetter({requestId}){emit({open:true,busy:true,requestId});}});
    let settled=false;const pending=f.tiers.choose('better').then(result=>{settled=true;return result;});
    await Promise.resolve();await Promise.resolve();assert.equal(settled,false);assert.equal(f.tiers.busy,true);
    emit({open:true,busy:false,error});const result=await pending;
    assert.equal(result.ok,!error);assert.equal(result.busy,false);assert.equal(result.error,error);
  }
});

test('a mounted but not ready view still cancels immediately on a new selection',{timeout:2000},async()=>{
  let emit;
  const f=routerFixture({subscribeBetter(listener){emit=listener;return ()=>{};},openBetter(){emit({open:true,busy:true});}});
  const pending=f.tiers.choose('better');await Promise.resolve();await f.tiers.choose('best');
  assert.equal((await pending).cancelled,true);assert.equal(f.tiers.mode,'best');
  emit({open:true,busy:false,error:'late GPU error'});assert.equal(f.tiers.error,'');
});

test('same-request retries await fresh readiness and can still cancel immediately',{timeout:2000},async()=>{
  for(const completion of ['success','error','cancel']){
    const f=routerFixture();await f.tiers.choose('better');
    const requestId=f.life.requests[0].requestId;
    f.life.emit({open:true,busy:false,error:'Initial renderer failure',requestId});
    assert.equal((await f.tiers.choose('better')).ok,false);
    f.life.emit({open:true,busy:true,error:'',requestId});
    const retry=f.tiers.choose('better');assert.equal(retry,f.tiers.choose('life'));
    let settled=false;retry.then(()=>{settled=true;});
    await Promise.resolve();await Promise.resolve();assert.equal(settled,false);
    assert.equal(f.life.calls.open,1,'retry retains the same owned dialog and request');
    if(completion==='cancel')await f.tiers.choose('best');
    else f.life.emit({open:true,busy:false,error:completion==='error'?'Retry failed':'',requestId});
    const result=await retry;
    assert.equal(result.ok,completion==='success');assert.equal(!!result.cancelled,completion==='cancel');
    f.tiers.dispose();
  }
});

const selectorSource=fs.readFileSync(new URL('./xtanco-premium-ui.mjs',import.meta.url),'utf8');
const controlsSource=fs.readFileSync(new URL('./visual-tier-controls.mjs',import.meta.url),'utf8');
function selectorHarness({search='',storage=memoryStorage(),storageBlocked=false}={}){
  const created=[],queries=[],life=lifeFixture(),best=lifeFixture(),windowEvents={};
  class Element {
    constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.listeners={};this.hidden=false;this.textContent='';
      const classes=new Set();this.classList={add:value=>classes.add(value),remove:value=>classes.delete(value),contains:value=>classes.has(value)};}
    setAttribute(key,value){this.attrs[key]=String(value);}
    set innerHTML(value){
      this.markup=value;this.children=[];
      for(const match of value.matchAll(/<(button|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)){
        const node=new Element(match[1]);node.parent=this;node.textContent=match[3].replace(/<[^>]+>/g,'');
        for(const attr of match[2].matchAll(/([\w-]+)="([^"]*)"/g)){
          node.setAttribute(attr[1],attr[2]);if(attr[1]==='data-visual-mode')node.dataset.visualMode=attr[2];
        }
        node.hidden=/\bhidden\b/.test(match[2]);this.children.push(node);
      }
    }
    querySelectorAll(selector){assert.equal(selector,'[data-visual-mode]');return this.children.filter(node=>node.dataset.visualMode);}
    querySelector(selector){assert.equal(selector,'.quality-status');return this.children.find(node=>node.attrs.class==='quality-status')??null;}
    remove(){if(this.parent){const siblings=this.parent.children,index=siblings.indexOf(this);if(index>=0)siblings.splice(index,1);}this.parent=null;}
    prepend(node){node.remove();node.parent=this;this.children.unshift(node);}
    append(node){node.remove();node.parent=this;this.children.push(node);}
    addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
    click(){const event={stopPropagation(){this.stopped=true;}};this.onclick?.(event);return event;}
  }
  const body=new Element('body'),actions=new Element('expert-actions'),advanced=new Element('advanced-actions');body.dataset.xtancoVisual='better';
  body.append(actions);body.append(advanced);
  const document={body,querySelector(selector){queries.push(selector);return selector==='#telegramDock .tg-actions'?actions:selector==='.quad-right'?advanced:null;},
    createElement(tag){created.push(tag);return new Element(tag);},getElementById(id){
      const find=node=>(node.id||node.attrs.id)===id?node:node.children.map(find).find(Boolean);
      return find(body)??null;
    }};
  const window={addEventListener(type,fn){(windowEvents[type]??=[]).push(fn);}};Object.defineProperty(window,'localStorage',{get(){if(storageBlocked)throw Error('denied');return storage;}});
  const context=vm.createContext({document,window,location:{search},createVisualTiers,requestedTier,...life,
    openBestView:best.openLifeView,closeBestView:best.closeLifeView,subscribeBestView:best.subscribeLifeView});
  vm.runInContext(controlsSource.replace(/export function /g,'function '),context);
  vm.runInContext(selectorSource.replace(/^import .*;\n/gm,''),context);
  const controls=actions.children[0];assert.ok(controls,'the selector must be inserted in the expert actions');
  return {body,actions,advanced,controls,advancedControls:advanced.children[0],document,window,storage,life,best,created,queries,
    get status(){return document.getElementById('xtanco-best-status');},
    pagehide(){for(const fn of windowEvents.pagehide||[])fn({persisted:false});},
    button:(tier,group=controls)=>group.querySelectorAll('[data-visual-mode]').find(node=>node.dataset.visualMode===tier)};
}

test('Advanced and Expert offer the same enabled Best preview and synchronize their pressed state',()=>{
  const h=selectorHarness({search:'?visual=best'});
  assert.deepEqual(h.queries,['#telegramDock .tg-actions','.quad-right']);assert.equal(h.controls.parent,h.actions);
  assert.equal(h.advancedControls.parent,h.advanced);
  assert.equal(h.controls.attrs.role,'group');assert.match(h.controls.attrs['aria-label'],/experto/);
  assert.match(h.advancedControls.attrs['aria-label'],/avanzado/);
  for(const group of [h.controls,h.advancedControls]){
    assert.notEqual(h.button('best',group).attrs['aria-disabled'],'true');assert.equal(h.button('best',group).attrs['aria-pressed'],'true');
    assert.match(h.button('best',group).attrs.title,/concepto estático, no operativo/);
  }
  assert.equal(h.status.hidden,false);assert.match(h.status.textContent,/previa estática.*no es.*interactivo/);
  assert.equal(h.best.calls.open,1);assert.equal(h.life.calls.open,0);assert.ok(h.created.every(tag=>tag==='div'),'selector creates no GPU canvas');
});

test('the Best status escapes dock clipping and disappears when returning to Good',async()=>{
  const h=selectorHarness({search:'?visual=best'}),status=h.status;
  assert.equal(status.parent,h.body,'the explanation must live outside the overflow-clipped expert dock');
  assert.equal(h.controls.querySelector('.quality-status'),null,'reparenting must remove the old nested node');
  assert.equal(status.attrs.role,'status');assert.equal(status.hidden,false);
  assert.equal(h.body.children.filter(node=>node.id==='xtanco-best-status').length,1);
  await h.window.__xtancoVisualTiers.choose('good');assert.equal(status.hidden,true);
  h.button('best').click();assert.equal(status.hidden,false);assert.equal(h.status,status);
});

test('public Better preserves the legacy Good renderer facade and exterior traffic styling',async()=>{
  const h=selectorHarness({search:'?visual=life'}),facade=h.window.__xtancoPremiumView;
  assert.equal(h.body.dataset.xtancoTier,'better');assert.equal(h.button('better').attrs['aria-pressed'],'true');
  assert.equal(h.controls.attrs['aria-busy'],'false');
  for(const tier of ['good','better','best']){
    await facade.open(tier);
    assert.equal(h.body.dataset.xtancoVisual,'good');assert.equal(facade.mode,'good');
    assert.equal(facade.begin(),false);assert.equal(facade.operationContext('device'),null);assert.equal(facade.paint(),undefined);
  }
  await facade.open();assert.equal(h.body.dataset.xtancoTier,'better');
  h.life.emit({open:false,busy:false,error:''});assert.equal(h.button('good').attrs['aria-pressed'],'true');
  await facade.close();assert.equal(h.body.dataset.xtancoTier,'good');
});

test('Expert and Advanced buttons consume game input and update together when Better closes',()=>{
  const h=selectorHarness();assert.equal(h.button('better').click().stopped,true);
  assert.equal(h.body.dataset.xtancoTier,'better');assert.equal(h.button('better').attrs['aria-pressed'],'true');
  assert.equal(h.button('better',h.advancedControls).attrs['aria-pressed'],'true');
  for(const group of [h.controls,h.advancedControls])for(const type of ['keydown','keyup','keypress']){
    const event={stopped:false,stopPropagation(){this.stopped=true;}};
    for(const handler of group.listeners[type]||[])handler(event);assert.equal(event.stopped,true);
  }
  h.life.closeLifeView();assert.equal(h.button('good').attrs['aria-pressed'],'true');assert.equal(h.button('better').attrs['aria-pressed'],'false');
  h.button('best',h.advancedControls).click();assert.equal(h.button('best').attrs['aria-pressed'],'true');assert.equal(h.best.calls.open,1);
});

test('selector boots safely with denied storage or stale legacy Best and never imports the retired controller',()=>{
  for(const options of [{storageBlocked:true},{storage:memoryStorage({xtanco_visual_quality:'best'})}]){
    const h=selectorHarness(options);assert.equal(h.body.dataset.xtancoTier,'good');assert.equal(h.life.calls.open,0);
  }
  const imports=[...selectorSource.matchAll(/^import .* from ['"]([^'"]+)['"]/gm)].map(match=>match[1]);
  assert.deepEqual(imports,['./life-ui.mjs?v=tiers-linked-4','./best-preview-ui.mjs?v=tiers-linked-4','./xtanco-visual-tiers.mjs?v=tiers-linked-4','./visual-tier-controls.mjs?v=tiers-linked-4']);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal([...html.matchAll(/<script\b[^>]*src="scripts\/xtanco-premium-ui\.mjs[^\"]*"/g)].length,1);
  assert.doesNotMatch(html,/<script\b[^>]*src="scripts\/life-ui\.mjs/);
});
