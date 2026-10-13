import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {projectMatrixFloor,MATRIX_FLOOR_POLYGON} from './matrix-floor.mjs';

const source=fs.readFileSync(new URL('./best-preview-ui.mjs?v=ipad-20261005-1',import.meta.url),'utf8');
function harness({cached=false,broken=false,showFailure=false,peopleFailure=false,furnitureFailure=false,furniturePending=false,search='',vertical='xtanco',starbucks=false,editor=null,alive=true}={}){
  let document,releases=0;
  const layers=[],furnitureLayers=[],floating=[],lifts=[],playerSets=[],cards=[],order=[];
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
  window.__xtancoReleaseInputs=()=>releases++;window.__xtancoVisualState=()=>({vertical});
  const createBestPeopleLayer=({container,getFurnitureZones,projectFloor,floorPolygon})=>{
    if(peopleFailure)throw Error('people failure');
    const layer={container,getFurnitureZones,projectFloor,floorPolygon,disposed:false,dispose(){this.disposed=true;}};layers.push(layer);return layer;
  };
  const mountMatrixFurniture=(container,options)=>{
    const {onReady,onSelect}=options;
    if(furnitureFailure)throw Error('furniture failure');
    const layer={container,onReady,onSelect,options,zones:[],count:43,disposed:false,screenAt:()=>layer.under||null,dispose(){this.disposed=true;order.push('furniture');}};
    furnitureLayers.push(layer);if(!furniturePending)onReady();return layer;
  };
  // Hiperreal vivo: the hand, the room players and the on-air cards. `alive:false` is a page without them.
  const mountFurnitureLift=options=>{const lift={options,holding:null,disposed:false,decorate:scene=>({...scene,decorated:true}),present:placement=>({state:'hover',id:placement.id}),live:()=>true,state:()=>({holding:lift.holding}),dispose(){this.disposed=true;order.push('lift');}};lifts.push(lift);return lift;};
  const createXtancoPlayers=options=>{const players={options,drawn:[],disposed:false,draw(ctx,w,h,id,meta){this.drawn.push({id,w,h,meta});return id!=='dark';},dispose(){this.disposed=true;order.push('players');}};playerSets.push(players);return players;};
  const mountBestOnAir=options=>{const onAir={options,lit:true,disposed:false,light(){return this.lit;},dispose(){this.disposed=true;order.push('cards');}};cards.push(onAir);return onAir;};
  if(editor)window.__xtancoFurnitureEditor=editor;
  const lifeCalls=[];let lifeListener;
  const attachFloatingPanel=(panel,options)=>{const tool={panel,options,disposed:false,open(){if(!this.disposed)options.onOpen?.();},close(){if(!this.disposed)panel.hidden=true;},dispose(){this.disposed=true;}};floating.push(tool);return tool;};
  const context=vm.createContext({XpaceStarbucks:{active:()=>starbucks},URLSearchParams,location:{search},subscribeLifeView:fn=>{lifeListener=fn;return()=>{};},openLifeView:options=>{lifeCalls.push({action:'open',options});},closeLifeView:reason=>lifeCalls.push({action:'close',reason}),mountTierHud:()=>({setStatus(){},dispose(){}}),attachFloatingPanel,document,window,createBestPeopleLayer,mountMatrixFurniture,projectMatrixFloor,MATRIX_FLOOR_POLYGON,...(alive?{mountFurnitureLift,createXtancoPlayers,mountBestOnAir}:{})});
  vm.runInContext(source.replace(/^import .*;\n/gm,'').replace(/export function /g,'function ')+';globalThis.audit={openBestView,closeBestView,subscribeBestView,get dialog(){return dialog;}};',context);
  return {body,window,document,previous,layers,furnitureLayers,floating,lifts,playerSets,cards,order,lifeCalls,lifeState:state=>lifeListener(state),get releases(){return releases;},get dialog(){return context.audit.dialog;},open:options=>context.audit.openBestView(options),close:reason=>context.audit.closeBestView(reason),subscribe:fn=>context.audit.subscribeBestView(fn)};
}

test('component deep link delegates Xtanco Best to the live scene and forwards its lifecycle',()=>{
  const h=harness({search:'?visual=best&select=products'}),states=[];h.subscribe(state=>states.push(state));h.open({requestId:31});assert.equal(h.dialog,undefined);assert.equal(h.lifeCalls[0].options.tier,'best');assert.equal(h.lifeCalls[0].options.requestId,31);
  h.lifeState({open:true,busy:false,requestId:31});assert.equal(states.at(-1).requestId,31);h.close('switch');assert.deepEqual(h.lifeCalls[1],{action:'close',reason:'switch'});
  const cafe=harness({search:'?select=products',vertical:'cafeteria'});cafe.open();assert.equal(cafe.lifeCalls.length,0);assert.ok(cafe.dialog);cafe.close();
});

test('Best uses only the empty Avenida Admira room so removed furniture cannot remain in the backdrop',()=>{
  const h=harness();h.open({requestId:8});
  assert.equal(h.dialog.className,'matrix-dialog best-dialog visual-tier-surface');
  assert.match(h.dialog.innerHTML,/03\.- BEST · 32 BITS · MOBILIARIO EDITABLE/);
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
  assert.equal(states.at(-1).busy,false);assert.match(states.at(-1).error,/visitantes de Best/);assert.equal(h.layers.length,0);
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
  assert.equal(states.at(-1).busy,false);assert.match(states.at(-1).error,/mobiliario de Best.*No hay conexión/);
  assert.equal(h.dialog.querySelector('.best-image-error').hidden,false);
  h.furnitureLayers[0].onReady();assert.ok(states.at(-1).error);
  h.close();assert.equal(h.layers[0].disposed,true);assert.equal(h.furnitureLayers[0].disposed,true);
  const sync=harness({cached:true,furnitureFailure:true}),syncStates=[];sync.subscribe(s=>syncStates.push({...s}));sync.open();
  assert.equal(syncStates.at(-1).busy,false);assert.match(syncStates.at(-1).error,/mobiliario de Best/);assert.equal(sync.layers.length,0);
});

test('the loading error is dismissible and reopenable within Best and is disposed with the scene',()=>{
  const h=harness({cached:true,broken:true});h.open();
  const tool=h.floating[0],dialog=h.dialog;
  assert.equal(tool.panel,dialog.querySelector('.best-image-error'));
  assert.equal(tool.options.bounds,dialog.querySelector('.best-stage'));
  assert.equal(tool.options.menu,'best-error');assert.equal(tool.panel.hidden,false);
  assert.match(dialog.querySelector('.best-image-error-message').textContent,/Avenida Admira/);
  tool.close();assert.equal(tool.panel.hidden,true);assert.equal(h.dialog,dialog);
  tool.open();assert.equal(tool.panel.hidden,false);h.close();assert.equal(tool.disposed,true);
  tool.open();assert.equal(h.dialog,null);
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

test('Hiperreal vivo: the tobacconist gets its players, its on-air cards and the hand, and loses them in order',()=>{
  const editor={place(){},read(){},begin(){},end(){}},h=harness({cached:true,editor});h.open({requestId:21});
  const furniture=h.furnitureLayers[0],container=furniture.container;
  assert.equal(h.playerSets.length,1);assert.equal(h.playerSets[0].options.win,h.window);
  assert.equal(h.lifts.length,1);assert.equal(h.lifts[0].options.container,container);assert.equal(h.lifts[0].options.furniture,furniture);assert.equal(h.lifts[0].options.bridge,editor);
  assert.equal(h.cards.length,1);assert.equal(h.cards[0].options.stage,container);assert.equal(h.cards[0].options.players,h.playerSets[0]);
  const stage=h.window.XpaceHiperreal;assert.deepEqual(Object.keys(stage).sort(),['furniture','lift','players','screens']);
  assert.ok(stage.players===h.playerSets[0]&&stage.screens===h.cards[0]&&stage.lift===h.lifts[0]&&stage.furniture===furniture);
  // The pieces ask the hand late: it is mounted after them.
  const scene={layout:[]};assert.equal(furniture.options.decorate(scene).decorated,true);assert.deepEqual(furniture.options.present({id:'a'}),{state:'hover',id:'a'});assert.equal(furniture.options.live(),true);
  assert.equal(furniture.options.light(),true);h.cards[0].lit=false;assert.equal(furniture.options.light(),false);
  // A preview wins; then the room players; a screen showing a page paints nothing of its own.
  const drawn=[];h.window.XpaceScreenMedia={draw:(ctx,w,h,id)=>{drawn.push(id);return id==='previewed';},previewed:id=>id==='previewed'};
  const screen=id=>({id,aspect:9/16,item:{type:'metahuman'},label:'Tótem'}),paint=id=>furniture.options.paintScreen({},216,384,screen(id));
  assert.equal(paint('previewed'),true);assert.equal(h.playerSets[0].drawn.length,0);
  assert.equal(paint('metahuman'),true);assert.deepEqual(h.playerSets[0].drawn.map(entry=>[entry.id,entry.w,entry.h,entry.meta.aspect]),[['metahuman',216,384,9/16]]);
  assert.equal(paint('dark'),false);assert.deepEqual(drawn,['previewed','metahuman','dark']);
  h.window.__xtancoSurfaceWeb=id=>id==='metahuman'?{src:'https://example.com/kiosk',title:'Quiosco'}:null;
  assert.deepEqual(furniture.options.webScreen(screen('metahuman')),{src:'https://example.com/kiosk',title:'Quiosco'});assert.equal(furniture.options.webScreen(screen('ds1')),null);
  const before=h.playerSets[0].drawn.length;assert.equal(paint('metahuman'),false);assert.equal(h.playerSets[0].drawn.length,before,'no second video under a page');
  assert.equal(furniture.options.webScreen(screen('previewed')),null,'a preview also wins over the page');
  assert.deepEqual(h.cards[0].options.web('metahuman'),{src:'https://example.com/kiosk',title:'Quiosco'});
  // The cards keep quiet while a piece is in the hand.
  assert.equal(h.cards[0].options.busy(),false);h.lifts[0].holding='counter';assert.equal(h.cards[0].options.busy(),true);
  // A page on the totem is touched apart: double click opens it at touch size, never while carrying.
  const touched=[];h.window.XpaceTotemKiosk={touch:on=>touched.push(on)};furniture.under='metahuman';
  container.emit('dblclick',{clientX:5,clientY:5});assert.deepEqual(touched,[],'not with a piece in the hand');
  h.lifts[0].holding=null;container.emit('dblclick',{clientX:5,clientY:5});assert.deepEqual(touched,[true]);
  furniture.under='ds1';container.emit('dblclick',{clientX:5,clientY:5});assert.deepEqual(touched,[true]);
  // Media dropped on the room finds the screen the pieces say is there.
  furniture.under='inventory:led';assert.equal(h.window.XpaceSceneScreens.screenAt(3,4),'inventory:led');
  h.close();
  assert.deepEqual(h.order,['lift','cards','players','furniture'],'the hand closes its edit and the players stop before the pieces go');
  assert.equal(h.window.XpaceHiperreal,undefined);assert.equal(h.window.XpaceSceneScreens,undefined);assert.ok(h.lifts[0].disposed&&h.cards[0].disposed&&h.playerSets[0].disposed);
});

test('Hiperreal vivo never blocks Best: no editor, another vertical or a page without the new modules still open the room',()=>{
  const bare=harness({cached:true}),states=[];bare.subscribe(state=>states.push({...state}));bare.open();
  assert.equal(bare.lifts.length,0,'without the editing bridge there is no hand');assert.equal(bare.playerSets.length,1);assert.equal(bare.cards.length,1);assert.equal(bare.window.XpaceHiperreal.lift,undefined);
  assert.equal(states.at(-1).busy,false);assert.equal(states.at(-1).error,'');
  const scene={layout:[]};assert.equal(bare.furnitureLayers[0].options.decorate(scene),scene);assert.equal(bare.furnitureLayers[0].options.present({id:'a'}),null);assert.equal(bare.furnitureLayers[0].options.live(),false);
  assert.equal(bare.cards[0].options.busy(),false);bare.close();
  const old={read(){},begin(){},end(){}},legacy=harness({cached:true,editor:old});legacy.open();assert.equal(legacy.lifts.length,0,'an editor that cannot place a lifted piece is not used');legacy.close();
  const cafe=harness({cached:true,vertical:'cafeteria',editor:{place(){}}});cafe.open();
  assert.equal(cafe.playerSets.length,0,'the tobacconist tags and house schedule belong to the tobacconist');assert.equal(cafe.lifts.length,1);assert.equal(cafe.cards[0].options.players,undefined);
  assert.equal(cafe.furnitureLayers[0].options.paintScreen({},10,10,{id:'metahuman'}),false);cafe.close();
  const plain=harness({cached:true,alive:false,editor:{place(){}}}),seen=[];plain.subscribe(state=>seen.push({...state}));plain.open();
  assert.equal(seen.at(-1).busy,false);assert.equal(seen.at(-1).error,'');assert.equal(plain.layers.length,1);assert.equal(plain.window.XpaceHiperreal.furniture,plain.furnitureLayers[0]);
  for(const part of ['players','screens','lift'])assert.ok(plain.window.XpaceHiperreal[part]==null,part);
  plain.close();assert.equal(plain.furnitureLayers[0].disposed,true);
});
