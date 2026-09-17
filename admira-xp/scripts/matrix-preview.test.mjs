import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {projectMatrixFloor,MATRIX_FLOOR_POLYGON} from './matrix-floor.mjs';

const source=fs.readFileSync(new URL('./matrix-preview-ui.mjs',import.meta.url),'utf8');
function harness({cached=false,broken=false,showFailure=false,peopleFailure=false,furnitureFailure=false,furniturePending=false}={}){
  let document,releases=0;
  const layers=[],furnitureLayers=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.queries=new Map();this.listeners={};this.attrs={};const classes=new Set();this.classList={add:name=>classes.add(name),contains:name=>classes.has(name)};}
    setAttribute(name,value){this.attrs[name]=String(value);}
    querySelector(selector){
      if(!this.queries.has(selector)){
        const child=new Element(selector);child.parent=this;
        if(selector==='.matrix-reference-clean'){child.complete=cached;child.naturalWidth=broken?0:1504;}
        this.queries.set(selector,child);this.children.push(child);
      }
      return this.queries.get(selector);
    }
    append(child){child.parent=this;this.children.push(child);}
    addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
    show(){if(showFailure)throw Error('dialog failure');this.open=true;}
    close(){this.open=false;}
    remove(){this.removed=true;if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
    focus(){document.activeElement=this;}
    getBoundingClientRect(){return {width:1000,height:625};}
    emit(type,props={}){
      const event={type,stopped:false,prevented:false,stopPropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...props};
      for(let node=this;node;node=node.parent){for(const fn of node.listeners[type]||[])fn(event);if(event.stopped)break;}
      return event;
    }
  }
  const body=new Element('body'),previous=new Element('previous'),window=new Element('window');body.parent=window;
  document={body,activeElement:previous,createElement:tag=>new Element(tag)};
  window.__xtancoReleaseInputs=()=>releases++;
  const createBestPeopleLayer=({container,getFurnitureZones,projectFloor,floorPolygon})=>{
    if(peopleFailure)throw Error('people failure');
    const layer={container,getFurnitureZones,projectFloor,floorPolygon,disposed:false,dispose(){this.disposed=true;}};layers.push(layer);return layer;
  };
  const mountMatrixFurniture=(container,{onReady,onSelect})=>{
    if(furnitureFailure)throw Error('furniture failure');
    const layer={container,onReady,onSelect,zones:[],count:43,disposed:false,dispose(){this.disposed=true;}};
    furnitureLayers.push(layer);if(!furniturePending)onReady();return layer;
  };
  const context=vm.createContext({document,window,createBestPeopleLayer,mountMatrixFurniture,projectMatrixFloor,MATRIX_FLOOR_POLYGON});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openMatrixView,closeMatrixView,subscribeMatrixView,get dialog(){return dialog;}};',context);
  return {body,window,document,previous,layers,furnitureLayers,get releases(){return releases;},get dialog(){return context.audit.dialog;},open:options=>context.audit.openMatrixView(options),close:reason=>context.audit.closeMatrixView(reason),subscribe:fn=>context.audit.subscribeMatrixView(fn)};
}

test('Matrix uses only the empty Avenida Admira room so removed furniture cannot remain in the backdrop',()=>{
  const h=harness();h.open({requestId:8});
  assert.equal(h.dialog.className,'matrix-dialog best-dialog visual-tier-surface');
  assert.match(h.dialog.innerHTML,/04\.- MATRIX · MOBILIARIO EDITABLE/);
  assert.match(h.dialog.innerHTML,/Inventario compartido · \/inventario/);
  const file='best-xtanco-avenida-admira-mudanza-20260915.png';
  assert.ok(h.dialog.innerHTML.includes(file));assert.ok(fs.existsSync(new URL(`../assets/${file}`,import.meta.url)));
  assert.doesNotMatch(h.dialog.innerHTML,/framelock|best-reference-filled|best-reference-empty|ESCENA FIJA/);
  assert.equal((h.dialog.innerHTML.match(/<img /g)||[]).length,1);
  assert.equal(h.releases,1);assert.equal(h.dialog.open,true);assert.equal(h.layers.length,0);
});

test('image readiness creates one live people layer and retains its request identity',()=>{
  const h=harness(),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:41});
  const image=h.dialog.querySelector('.matrix-reference-clean');image.onload();image.onload();h.open({requestId:42});
  assert.equal(h.layers.length,1);assert.equal(h.furnitureLayers.length,1);assert.deepEqual(states.map(s=>s.busy),[true,false]);
  assert.ok(states.every(s=>s.requestId===41));assert.equal(states.at(-1).error,'');
});

test('cached images settle readiness immediately and cached failures report an error',()=>{
  for(const broken of [false,true]){
    const h=harness({cached:true,broken}),states=[];h.subscribe(state=>states.push({...state}));h.open({requestId:3});
    assert.deepEqual(states.map(s=>s.busy),[true,false]);assert.equal(h.layers.length,broken?0:1);
    assert.equal(!!states.at(-1).error,broken);
    if(broken){assert.match(states.at(-1).error,/Avenida Admira/);assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);}
  }
});

test('abort prevents opening or cleans the active view, and stale image callbacks cannot affect its replacement',()=>{
  const h=harness(),aborted=new AbortController();aborted.abort();h.open({signal:aborted.signal});assert.equal(h.dialog,undefined);
  const active=new AbortController();h.open({signal:active.signal,requestId:5});
  const old=h.dialog,image=old.querySelector('.matrix-reference-clean'),staleLoad=image.onload,staleError=image.onerror;
  image.onload();active.abort();assert.equal(h.dialog,null);assert.equal(h.layers[0].disposed,true);assert.equal(h.furnitureLayers[0].disposed,true);assert.equal(old.removed,true);
  assert.equal(image.onload,null);assert.equal(image.onerror,null);
  const states=[];h.subscribe(s=>states.push({...s}));h.open({requestId:6});staleLoad();staleError();
  assert.equal(h.layers.length,1);assert.equal(states.length,1);assert.equal(states[0].busy,true);assert.equal(states[0].requestId,6);
});

test('scene input stays local and Escape closes without altering the shared scene',()=>{
  const h=harness();h.open();let leaked=0;
  for(const type of ['click','dblclick','pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','touchstart','touchmove','touchend','wheel','contextmenu','keydown','keyup','keypress']){
    h.body.addEventListener(type,()=>leaked++);assert.equal(h.dialog.querySelector('.best-stage').emit(type,{key:'q'}).stopped,true,type);
  }
  assert.equal(leaked,0);assert.equal(h.dialog.emit('keydown',{key:'Escape'}).prevented,true);
  assert.equal(h.dialog,null);assert.equal(h.document.activeElement,h.previous);
});

test('pagehide releases visitors and observers, preserving its close reason',()=>{
  const h=harness({cached:true}),states=[],unsubscribe=h.subscribe(s=>states.push({...s}));h.open();
  const dialog=h.dialog;h.window.emit('pagehide');h.close('pagehide');
  assert.equal(h.layers[0].disposed,true);assert.equal(h.furnitureLayers[0].disposed,true);assert.equal(dialog.removed,true);assert.equal(states.at(-1).reason,'pagehide');
  assert.equal(states.at(-1).open,false);unsubscribe();const count=states.length;h.open();h.close();assert.equal(states.length,count);
});

test('opening failure removes its dialog and restores focus before propagating the error',()=>{
  const h=harness({showFailure:true});assert.throws(()=>h.open(),/dialog failure/);
  assert.equal(h.dialog,null);assert.equal(h.body.children.length,0);assert.equal(h.document.activeElement,h.previous);assert.equal(h.layers.length,0);
});

test('people-layer failure settles with an explicit error instead of reporting live visitors',()=>{
  const h=harness({cached:true,peopleFailure:true}),states=[];h.subscribe(s=>states.push({...s}));h.open();
  assert.equal(states.at(-1).busy,false);assert.match(states.at(-1).error,/visitantes de Matrix/);assert.equal(h.layers.length,0);
});

test('readiness waits for furniture assets and visitors share the room projection',()=>{
  const h=harness({cached:true,furniturePending:true}),states=[];h.subscribe(s=>states.push({...s}));h.open({requestId:11});
  assert.equal(states.at(-1).busy,true);assert.equal(h.layers.length,1);
  const layer=h.furnitureLayers[0],people=h.layers[0];
  assert.equal(people.container,layer.container);
  assert.equal(people.projectFloor,projectMatrixFloor);
  layer.onReady();layer.onReady();assert.deepEqual(states.map(s=>s.busy),[true,false]);
});

test('furniture failure reports an explicit error, never a successful ready scene',()=>{
  const h=harness({cached:true,furniturePending:true}),states=[];h.subscribe(s=>states.push({...s}));h.open();
  h.furnitureLayers[0].onReady('No hay conexión');
  assert.equal(states.at(-1).busy,false);assert.match(states.at(-1).error,/mobiliario de Matrix.*No hay conexión/);
  assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);
  h.furnitureLayers[0].onReady();assert.ok(states.at(-1).error);
  h.close();assert.equal(h.layers[0].disposed,true);assert.equal(h.furnitureLayers[0].disposed,true);
  const sync=harness({cached:true,furnitureFailure:true}),syncStates=[];sync.subscribe(s=>syncStates.push({...s}));sync.open();
  assert.equal(syncStates.at(-1).busy,false);assert.match(syncStates.at(-1).error,/mobiliario de Matrix/);assert.equal(sync.layers.length,0);
});

test('late furniture callbacks cannot change the next view and pending furniture is disposed on abort',()=>{
  const h=harness({cached:true,furniturePending:true}),states=[],controller=new AbortController();h.subscribe(s=>states.push({...s}));h.open({requestId:12,signal:controller.signal});
  const old=h.furnitureLayers[0];controller.abort();assert.equal(old.disposed,true);
  h.open({requestId:13});const count=states.length;
  old.onReady();old.onReady('stale failure');old.onSelect({number:1,label:'Mostrador'});
  assert.equal(states.length,count);assert.equal(states.at(-1).requestId,13);assert.equal(states.at(-1).busy,true);
  assert.equal(h.dialog.querySelector('.matrix-furniture-selection').textContent,undefined);
  h.furnitureLayers[1].onReady();assert.equal(states.at(-1).error,'');assert.equal(states.at(-1).busy,false);
});

test('selecting a piece shows its inventory number and safe command hint without injecting markup',()=>{
  const h=harness({cached:true});h.open();
  h.furnitureLayers[0].onSelect({id:'mostrador',number:1,label:'Mostrador <b>retail</b>'});
  const selection=h.dialog.querySelector('.matrix-furniture-selection');
  assert.equal(selection.hidden,false);assert.equal(selection.textContent,'1 · Mostrador <b>retail</b> · /inventario eliminar 1');
  assert.equal(selection.innerHTML,undefined);
  h.furnitureLayers[0].onSelect(null);assert.equal(selection.hidden,true);assert.equal(selection.textContent,'');
});
