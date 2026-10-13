import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {mountMatrixFurniture,planMatrixFurniture,placementZone,withHiperreal,screenIdFor,screenSize,screenPool,FLOOR_Z,SHADOW_Z,POOL_Z,HELD_Z} from './matrix-furniture.mjs';
import {MATRIX_ATLAS_URL,MATRIX_ATLAS_SIZE,MATRIX_PHOTO_PIECES,MATRIX_ARCHITECTURE_DETAILS} from './matrix-photo-pieces.mjs';
import {quadTransform} from './matrix-mapping.mjs';
import {isBestWalkable} from './best-live-people.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';
import {projectMatrixFloor,MATRIX_FLOOR_POLYGON} from './matrix-floor.mjs';
import {executeInventoryCommand} from '../../inventario/command.mjs';

const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const chairIdentity='pixeria:1780691765844-ex3huq';
const views=number=>Array.from({length:4},(_,rotation)=>({rotation,url:`assets/matrix-furniture/catalog/${String(number).padStart(2,'0')}-r${rotation}.png`,width:384,height:384,anchor:[192,300],pixelsPerGridUnit:150}));
const catalog={items:[
  {number:1,inventoryId:'native:counter',name:'Mostrador',views:views(1)},
  {number:9,inventoryId:'native:plant',name:'Planta',views:views(9)},
  {number:12,inventoryId:'native:led',name:'LED Banner',views:views(12)},
  {number:13,inventoryId:'native:tft',name:'Pantalla',views:views(13)},
  {number:43,inventoryId:chairIdentity,name:'Silla de madera',bounds_gltf:{min:[0,0,0],max:[1,2,1]},views:views(43)}
]};
const counter={id:'counter',type:'counter',col:1,row:2,sx:1,sy:1,rot:0,fp:[1,2],label:'Mostrador'};
const chair=(id='chair-1',col=7,row=4,rot=0)=>({id,type:'custom',col,row,rot,sx:1,sy:1,fp:[1,1],img:'https://api.admira.store/stock/asset/1780691765844-ex3huq',label:'Silla de madera'});
const scene=layout=>({cols:14,rows:8,layout});
const state=layout=>({active:true,iso,layout,footprints:{},hardness:{blocked:[]},game:{staff:[],custs:[],passersby:[],custIn:0,gameTime:12}});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const flush=()=>new Promise(resolve=>setImmediate(resolve));

class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.parent=null;this.style={};this.dataset={};this.attrs={};this.events=new Map();this.hidden=false;}
  setAttribute(name,value){this.attrs[name]=String(value);}
  getAttribute(name){return this.attrs[name];}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  addEventListener(type,listener){this.events.set(type,listener);}
  click(){this.events.get('click')?.({stopPropagation(){}});}
  querySelector(selector){return this.children.find(child=>child.tagName===selector)||this.children.map(child=>child.querySelector(selector)).find(Boolean)||null;}
  // What the Hiperreal screens and the pointer need from a page: a canvas that records, a box and ancestry.
  getContext(){if(this.tagName!=='canvas')return null;this.calls??=[];const calls=this.calls;return this.context??=new Proxy({},{get:(target,key)=>key in target?target[key]:(...args)=>{calls.push([key,...args]);return {addColorStop(){}};},set:(target,key,value)=>{target[key]=value;return true;}});}
  getBoundingClientRect(){return this.rect||{left:0,top:0,width:0,height:0};}
  closest(selector){for(let node=this;node;node=node.parent)if(selector.includes('data-instance-id')?String(node.className||'').split(' ').includes('matrix-furniture-item')&&node.dataset.instanceId!==undefined:false)return node;return null;}
  contains(other){for(let node=other;node;node=node.parent)if(node===this)return true;return false;}
  get clientWidth(){return this.className==='matrix-furniture-layer'?1600:undefined;}get clientHeight(){return this.className==='matrix-furniture-layer'?1000:undefined;}
}
function harness(initial=state([counter]),options={}){
  const previousDocument=globalThis.document,container=new Element('scene'),frames=new Map(),ready=[],selections=[],cancelled=[];let nextFrame=0,current=initial;
  globalThis.document={hidden:false,createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)};
  const furniture=mountMatrixFurniture(container,{getState:()=>current,load:async()=>catalog,onReady:error=>ready.push(error),onSelect:selection=>selections.push(selection),requestFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},cancelFrame:id=>{frames.delete(id);cancelled.push(id);},...options});
  return {container,furniture,ready,selections,frames,cancelled,setState:value=>{current=value;},get layer(){return container.children.find(n=>n.className==='matrix-furniture-layer');},get status(){return container.children.find(n=>n.className==='matrix-furniture-status');},get buttons(){return this.layer?.children.filter(n=>n.tagName==='button')||[];},loaded(){for(const node of this.buttons)node.querySelector('img')?.onload?.();},cleanup(){furniture.dispose();globalThis.document=previousDocument;}};
}

test('the empty Avenida Admira floor corners and their interpolated positions anchor the entire shared room',()=>{
  const corners=[[0,0,.348,.318],[14,0,.966,.720],[14,8,.570,.943],[0,8,.020,.531]];
  for(const [col,row,x,y]of corners){const point=projectMatrixFloor(col,row);close(point.x,x);close(point.y,y);}
  assert.deepEqual(MATRIX_FLOOR_POLYGON,corners.map(([, ,x,y])=>[x,y]));
  for(const [col,row,x,y]of [[7,4,.476,.628],[7,0,.657,.519],[14,4,.768,.8315],[3.5,2,.41625,.472375]]){
    const point=projectMatrixFloor(col,row);close(point.x,x);close(point.y,y);
  }
  close(projectMatrixFloor(7,4).depth,.5);
  assert.deepEqual(projectMatrixFloor(14,8,28,16),projectMatrixFloor(7,4));
  assert.deepEqual(projectMatrixFloor(-5,-5),projectMatrixFloor(0,0));assert.deepEqual(projectMatrixFloor(99,99),projectMatrixFloor(14,8));
});

test('the shared inventory identities retain distinct instances on the actual floor and reversible independent movement',()=>{
  const added={...counter,id:'new-counter',col:8,row:5},input=scene([counter,added]),before=JSON.stringify(input);
  const [original,duplicate]=planMatrixFurniture(input,catalog);
  assert.deepEqual([original.id,duplicate.id],['counter','new-counter']);assert.deepEqual([original.number,duplicate.number],[1,1]);
  for(const [placement,col,row] of [[original,1.5,3],[duplicate,8.5,6]]){
    const center=projectMatrixFloor(col,row);close(placement.anchor.x,center.x);close(placement.anchor.y,center.y);close(placement.anchor.depth,center.depth);
  }
  const moved=planMatrixFurniture(scene([{...counter,col:2},added]),catalog);
  assert.deepEqual(moved[1],duplicate);assert.notDeepEqual(moved[0].anchor,original.anchor);
  assert.equal(JSON.stringify(input),before);
  for(const placement of [original,duplicate]){close(placement.left+placement.width*placement.origin[0],placement.anchor.x);close(placement.top+placement.height*placement.origin[1],placement.anchor.y);}
});

test('wall photographs keep their mounting offset while following the same calibrated layout displacement',()=>{
  const item={id:'led',type:'led',col:0,row:0},[original]=planMatrixFurniture(scene([item]),catalog);
  close(original.anchor.x,MATRIX_PHOTO_PIECES.led.target[0]);close(original.anchor.y,MATRIX_PHOTO_PIECES.led.target[1]);
  const [moved]=planMatrixFurniture(scene([{...item,col:2}]),catalog),before=projectMatrixFloor(0,0),after=projectMatrixFloor(2,0);
  close(moved.anchor.x-original.anchor.x,after.x-before.x);close(moved.anchor.y-original.anchor.y,after.y-before.y);assert.equal(placementZone(moved),null);
});

test('all four rotations resolve the correct catalog perspective, including negative rotations and mirroring',()=>{
  for(const rot of [0,1,2,3,-1,4]){
    const item={...chair(),rot,flipX:true,sx:1.25,sy:.8},input=scene([item]),before=JSON.stringify(input);
    const [placement]=planMatrixFurniture(input,catalog),expected=((rot%4)+4)%4;
    assert.equal(placement.kind,'sprite');assert.equal(placement.view.rotation,expected);assert.match(placement.url,new RegExp(`43-r${expected}\\.png$`));
    assert.equal(placement.flip,true);assert.equal(placement.sx,1.25);assert.equal(placement.sy,.8);
    close(placement.left+placement.width*placement.origin[0],placement.anchor.x);close(placement.top+placement.height*placement.origin[1],placement.anchor.y);
    assert.equal(JSON.stringify(input),before);
  }
  assert.equal(planMatrixFurniture(scene([{...counter,rot:1}]),catalog)[0].kind,'sprite');
});

test('custom model display height respects the shared Pixeria height without moving its floor pivot or double scaling',()=>{
  const item={...chair(),sx:1.25,sy:.8},[base]=planMatrixFurniture(scene([item]),catalog),before=JSON.stringify(item);
  for(const [ph,factor]of [[1,.5],[2,1],[4,2]]){
    const [sized]=planMatrixFurniture(scene([{...item,ph}]),catalog);
    close(sized.width,base.width*factor);close(sized.height,base.height*factor);assert.deepEqual(sized.anchor,base.anchor);
    close(sized.left+sized.width*sized.origin[0],base.anchor.x);close(sized.top+sized.height*sized.origin[1],base.anchor.y);
    assert.equal(sized.sx,1.25);assert.equal(sized.sy,.8);
  }
  const [invalid]=planMatrixFurniture(scene([{...item,ph:NaN}]),catalog);close(invalid.width,base.width);assert.equal(JSON.stringify(item),before);
});

test('unsupported pieces stay explicitly unsupported while wall screens create no floor obstacle',()=>{
  const [unknown]=planMatrixFurniture(scene([{id:'unknown',type:'unknown',col:1,row:1}]),catalog);
  assert.equal(unknown.unsupported,true);assert.equal(placementZone(unknown),null);
  const [screen]=planMatrixFurniture(scene([{id:'screen',type:'tft',col:3,row:0,wallY:2}]),catalog);
  assert.equal(screen.wall,true);assert.equal(placementZone(screen),null);
  const [floor]=planMatrixFurniture(scene([chair()]),catalog),zone=placementZone(floor);
  const center={x:zone.reduce((sum,p)=>sum+p[0],0)/4,y:zone.reduce((sum,p)=>sum+p[1],0)/4};
  assert.equal(zone.length,4);assert.equal(isBestWalkable(center,[zone],MATRIX_FLOOR_POLYGON),false);assert.equal(isBestWalkable(center,[],MATRIX_FLOOR_POLYGON),true);
});

test('projected furniture footprints follow physical scale, rotation and mirror instead of sprite image size',()=>{
  for(const rot of [0,1,2,3])for(const flipX of [false,true]){
    const item={...chair(),col:7,row:4,rot,flipX,sx:1.4,sy:2,fp:[2,1]},input=scene([item]);
    const [placement]=planMatrixFurniture(input,catalog),[box]=buildCustomerNavigation(input,{radius:0}).obstacles;
    const expected=[[box.minCol,box.minRow],[box.maxCol,box.minRow],[box.maxCol,box.maxRow],[box.minCol,box.maxRow]]
      .map(([col,row])=>{const p=projectMatrixFloor(col,row);return [p.x,p.y];});
    assert.deepEqual(placementZone(placement),expected);
    // Image cropping and vertical model height never widen a floor obstacle.
    const [tall]=planMatrixFurniture(scene([{...item,ph:8}]),catalog);
    assert.deepEqual(placementZone(tall),expected);
  }
  const rugs={items:[...catalog.items,{number:7,inventoryId:'native:rug',name:'Alfombra',views:views(7)}]};
  const [rug]=planMatrixFurniture(scene([{id:'rug',type:'rug',col:4,row:4,fp:[2,2]}]),rugs);
  assert.equal(placementZone(rug),null);
});

test('photographic ground contacts stay inside the real footprint after position, scale and mirror edits',()=>{
  const actualCatalog=JSON.parse(fs.readFileSync(new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url),'utf8'));
  const inputPhotos=Object.entries(MATRIX_PHOTO_PIECES).filter(([,photo])=>!photo.wall);
  let calibrated=0,fallback=0;
  const inside=(zone,point)=>{
    for(let i=0;i<zone.length;i++){
      const a=zone[i],b=zone[(i+1)%zone.length];
      assert.ok((b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0])>=-1e-10,'a photographed foot must stay within the physical floor polygon');
    }
  };
  for(const [id,photo] of inputPhotos)for(const flipX of [false,true])for(const [sx,sy] of [[1,1],[.8,.8],[1.3,1.4]]){
    const type=id.startsWith('plant')?'plant':id,item={id,type,col:6,row:3,flipX,sx,sy,rot:0};
    const [placement]=planMatrixFurniture(scene([item]),actualCatalog),zone=placementZone(placement);
    if(placement.kind==='sprite'){
      assert.equal(placement.photoFallback,'orientation-fit');assert.equal(placement.view.rotation,0);assert.equal(placement.flip,flipX);fallback++;continue;
    }
    calibrated++;assert.equal(placement.groundSupports.length,photo.ground.length);
    assert.ok(placement.groundScale/photo.scale>=.60,'keep photograph size or use the real 3D catalog view');
    close(placement.width/(placement.box.width/MATRIX_ATLAS_SIZE[0]),placement.height/(placement.box.height/MATRIX_ATLAS_SIZE[1]));
    for(let index=0;index<photo.ground.length;index++){
      const source=photo.ground[index];
      // Reconstruct what the SVG crop and final CSS transform actually display,
      // independently of the helper's reported calibrated ground coordinates.
      const localX=placement.left+placement.width*(source[0]-placement.box.x)/placement.box.width;
      const localY=placement.top+placement.height*(source[1]-placement.box.y)/placement.box.height;
      const displayed=[placement.anchor.x+(localX-placement.anchor.x)*sx*(placement.flip?-1:1),placement.anchor.y+(localY-placement.anchor.y)*sy];
      inside(zone,displayed);close(displayed[0],placement.groundSupports[index][0]);close(displayed[1],placement.groundSupports[index][1]);
    }
    const rotated=planMatrixFurniture(scene([{...item,rot:1}]),actualCatalog)[0];
    assert.equal(rotated.kind,'sprite');assert.equal(rotated.view.rotation,1);assert.equal(rotated.flip,flipX);
  }
  assert.ok(calibrated>40);assert.ok(fallback>0,'an incompatible mirrored perspective falls back without shrinking excessively');
});

test('shelving mirrors its photographic orientation declaratively and composes inventory mirroring',()=>{
  const actualCatalog=JSON.parse(fs.readFileSync(new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url),'utf8'));
  for(const flipX of [false,true]){
    const [placement]=planMatrixFurniture(scene([{id:'shelves',type:'shelves',col:6,row:3,flipX}]),actualCatalog);
    if(!flipX){assert.equal(placement.kind,'photo');assert.equal(placement.flip,true);assert.ok(placement.groundScale/.94>.75);}
    else{assert.equal(placement.kind,'sprite');assert.equal(placement.photoFallback,'orientation-fit');assert.equal(placement.flip,true);}
  }
});

test('photo buttons clip the shared transparent atlas with isolated SVG IDs and preserve accessible inventory identification',async()=>{
  const h=harness(state([counter,{...counter,id:'counter-copy',col:7,row:4}]));
  try{
    await flush();assert.equal(h.furniture.count,2);assert.deepEqual(h.ready,['']);
    const clips=h.buttons.map(node=>node.querySelector('clipPath').id);assert.equal(new Set(clips).size,2);
    for(const [index,node]of h.buttons.entries()){
      assert.equal(node.getAttribute('aria-label'),'1. Mostrador');assert.equal(node.dataset.inventoryNumber,'1');
      const image=node.querySelector('image');assert.equal(image.getAttribute('href'),MATRIX_ATLAS_URL);
      assert.equal(image.getAttribute('clip-path'),`url(#${clips[index]})`);assert.equal(image.getAttribute('width'),String(MATRIX_ATLAS_SIZE[0]));
      assert.ok(node.querySelector('polygon').getAttribute('points').split(' ').length>=3);
    }
    h.buttons[1].click();assert.deepEqual(h.selections.at(-1),{id:'counter-copy',number:1,label:'Mostrador'});
  }finally{h.cleanup();}
});

test('solid furniture occludes visitors behind its front edge while wall depth is unchanged',async()=>{
  const layout=[counter,chair(),{id:'led',type:'led',col:2,row:0}],h=harness(state(layout));
  try{
    await flush();h.loaded();
    const plan=planMatrixFurniture({cols:14,rows:8,layout},catalog);
    for(const placement of plan){
      const node=h.buttons.find(node=>node.dataset.instanceId===placement.id);
      const depth=placement.wall?placement.anchor.y:Math.max(...placementZone(placement).map(point=>point[1]));
      assert.equal(Number(node.getAttribute('data-furniture-depth-y')),depth);
      assert.equal(node.style.zIndex,String(10+Math.round(depth*1000)));
      if(!placement.wall){
        assert.deepEqual(JSON.parse(node.getAttribute('data-furniture-floor-zone')),placementZone(placement));
        const visitorBehind=10+Math.round((depth-.002)*1000),visitorAhead=10+Math.round((depth+.002)*1000);
        assert.ok(visitorBehind<Number(node.style.zIndex));assert.ok(visitorAhead>Number(node.style.zIndex));
      }
    }
  }finally{h.cleanup();}
});

test('real CLI add/remove/undo updates Matrix with stable numbers and restores both individual chair instances',async()=>{
  const storage=new Map(),context=vm.createContext({localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},addEventListener(){},dispatchEvent(){},Event:class{}});
  vm.runInContext(fs.readFileSync(new URL('../../inventario/store.js',import.meta.url),'utf8'),context);
  const current=state([counter]),h=harness(current);let ids=0;
  const assets=[{id:'native:counter',number:1,name:'Mostrador',type:'counter',fp:[1,2],mount:'floor'},{id:chairIdentity,number:43,name:'Silla de madera',type:'custom',img:chair().img,fp:[1,1],ph:46,mount:'floor'}];
  const command=text=>executeInventoryCommand(text,{store:context.XpaceInventory,space:'xtanco',getLayout:()=>current.layout,getRoom:()=>({cols:14,rows:8}),applyLayout:next=>{current.layout=next;},load:async()=>({assets}),makeId:()=>`new-${++ids}`});
  try{
    await flush();assert.equal((await command('/inventario añadir 43')).ok,true);assert.equal((await command('/inventario añadir silla de madera')).ok,true);
    const originalPositions=structuredClone(current.layout);h.furniture.update();h.loaded();assert.equal(h.furniture.count,3);assert.equal(h.buttons.filter(b=>b.dataset.inventoryNumber==='43').length,2);
    const selected=h.buttons.find(b=>b.dataset.inventoryNumber==='43');selected.click();
    assert.equal((await command('/inventario eliminar 43')).ok,true);h.furniture.update();assert.equal(h.furniture.count,1);assert.equal(h.selections.at(-1),null);
    assert.equal((await command('/inventario deshacer')).ok,true);h.furniture.update();h.loaded();assert.equal(h.furniture.count,3);assert.deepEqual(current.layout,originalPositions);
    assert.equal((await command('/inventario eliminar mostrador')).ok,true);h.furniture.update();assert.equal(h.buttons.some(b=>b.dataset.inventoryNumber==='1'),false);
  }finally{h.cleanup();}
});

test('mudanza removes all inventory and presentation obstacles and restores the same instance IDs afterwards',async()=>{
  const initial=state([counter,chair()]),before=JSON.stringify(initial),h=harness(initial);
  try{
    await flush();h.loaded();const originalIds=h.buttons.map(b=>b.dataset.instanceId);assert.equal(h.furniture.count,2);
    h.setState({...initial,moving:true,layout:[]});h.furniture.update();assert.equal(h.furniture.count,0);assert.deepEqual(h.furniture.zones,[]);assert.equal(h.buttons.length,0);
    assert.ok(h.layer.children.filter(node=>node.className.includes('matrix-architecture-detail')).every(node=>node.hidden));
    h.setState(initial);h.furniture.update();h.loaded();assert.deepEqual(h.buttons.map(b=>b.dataset.instanceId),originalIds);assert.equal(h.furniture.count,2);assert.equal(JSON.stringify(initial),before);
  }finally{h.cleanup();}
});

test('removed and rotated sprites ignore stale asynchronous callbacks, and disposing cancels frames and detaches callbacks',async()=>{
  const initial=state([chair()]),h=harness(initial);
  try{
    await flush();const image=h.buttons[0].querySelector('img'),oldLoad=image.onload;
    h.setState(state([{...chair(),rot:1}]));h.furniture.update();oldLoad();assert.equal(h.furniture.count,0);
    const currentImage=h.buttons[0].querySelector('img');currentImage.onload();assert.equal(h.furniture.count,1);
    h.setState(state([]));h.furniture.update();const caption=h.status.textContent;currentImage.onerror?.();assert.equal(h.status.textContent,caption);assert.equal(h.furniture.count,0);
    h.setState(initial);h.furniture.update();const finalImage=h.buttons[0].querySelector('img'),lateLoad=finalImage.onload;
    h.furniture.dispose();h.furniture.dispose();h.furniture.update();lateLoad();
    assert.equal(finalImage.onload,null);assert.equal(finalImage.onerror,null);assert.equal(h.container.children.length,0);assert.equal(h.frames.size,0);assert.equal(h.cancelled.length,1);assert.deepEqual(h.furniture.zones,[]);
  }finally{h.cleanup();}
});

test('asset failure reports an actionable error and disposal before loading prevents a late mount',async()=>{
  const failing=harness(undefined,{load:async()=>{throw Error('offline');}});
  try{await flush();assert.match(failing.status.textContent,/No se ha podido cargar.*reintenta/);assert.equal(failing.ready.length,1);assert.match(failing.ready[0],/No se ha podido/);assert.equal(failing.frames.size,0);}finally{failing.cleanup();}
  let resolve;const pending=new Promise(done=>{resolve=done;}),late=harness(undefined,{load:()=>pending});
  try{await flush();late.furniture.dispose();resolve(catalog);await flush();assert.equal(late.container.children.length,0);assert.equal(late.ready.length,0);assert.equal(late.frames.size,0);}finally{late.cleanup();}
});

test('failed sprites are not counted as visible and report the missing representation',async()=>{
  const h=harness(state([chair()]));
  try{await flush();assert.match(h.status.textContent,/1 cargando/);assert.deepEqual(h.furniture.zones,[]);h.buttons[0].querySelector('img').onerror();assert.equal(h.furniture.count,0);assert.deepEqual(h.furniture.zones,[]);assert.equal(h.buttons[0].hidden,true);assert.match(h.status.textContent,/1 sin representación/);assert.match(h.ready[0],/No se han podido cargar/);}finally{h.cleanup();}
});

test('leaving the active Xtanco clears its objects, collision zones and selection until a new snapshot is available',async()=>{
  const initial=state([counter]),h=harness(initial);
  try{
    await flush();h.buttons[0].click();assert.equal(h.furniture.count,1);assert.equal(h.furniture.zones.length,1);
    h.setState({...initial,active:false});h.furniture.update();assert.equal(h.furniture.count,0);assert.deepEqual(h.furniture.zones,[]);assert.equal(h.buttons.length,0);assert.equal(h.selections.at(-1),null);
    assert.ok(h.layer.children.filter(node=>node.className.includes('matrix-architecture-detail')).every(node=>node.hidden));
    assert.match(h.status.textContent,/Esperando al Xtanco/);
    h.setState(initial);h.furniture.update();assert.equal(h.furniture.count,1);assert.equal(h.buttons[0].dataset.instanceId,'counter');
  }finally{h.cleanup();}
});

test('selection describes the current item after a rename and disposal clears selected and counted furniture',async()=>{
  const h=harness(state([counter]));
  try{
    await flush();const original=h.buttons[0];h.setState(state([{...counter,label:'Caja principal'}]));h.furniture.update();
    assert.equal(h.buttons[0],original);original.click();assert.deepEqual(h.selections.at(-1),{id:'counter',number:1,label:'Caja principal'});
    assert.equal(original.getAttribute('aria-label'),'1. Caja principal');
    h.furniture.dispose();assert.equal(h.furniture.count,0);assert.deepEqual(h.furniture.zones,[]);assert.equal(h.selections.at(-1),null);assert.equal(h.container.children.length,0);
  }finally{h.cleanup();}
});

test('published Matrix catalog covers all 43 stable identities and four real transparent PNGs per model',()=>{
  const manifest=JSON.parse(fs.readFileSync(new URL('../assets/matrix-furniture/catalog/manifest.json',import.meta.url),'utf8'));
  const registry=JSON.parse(fs.readFileSync(new URL('../../inventario/registry.json',import.meta.url),'utf8'));
  assert.equal(manifest.items.length,43);assert.equal(new Set(manifest.items.map(item=>item.inventoryId)).size,43);
  assert.deepEqual(manifest.items.map(item=>item.number).sort((a,b)=>a-b),Array.from({length:43},(_,index)=>index+1));
  const paths=new Set();
  for(const item of manifest.items){
    assert.equal(registry.numbers[item.inventoryId],item.number);assert.deepEqual(item.views.map(view=>view.rotation).sort(),[0,1,2,3]);
    for(const view of item.views){
      assert.match(view.url,/^assets\/matrix-furniture\/catalog\/\d{2}-r[0-3]\.png$/);assert.ok(!paths.has(view.url));paths.add(view.url);
      const png=fs.readFileSync(new URL('../'+view.url,import.meta.url));
      assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),view.width);assert.equal(png.readUInt32BE(20),view.height);assert.equal(png[25],6,'PNG must contain an alpha channel');
      assert.equal(createHash('sha256').update(png).digest('hex'),view.sha256);assert.ok(view.pixelsPerGridUnit>0);assert.equal(view.anchor.length,2);assert.ok(view.anchor.every(Number.isFinite));
    }
    const source=fs.readFileSync(new URL('../../'+item.source,import.meta.url));assert.equal(createHash('sha256').update(source).digest('hex'),item.sourceSha256);
  }
  assert.equal(paths.size,172);assert.ok(fs.statSync(fileURLToPath(MATRIX_ATLAS_URL)).size>0);
});

// ── Best · Hiperreal vivo ───────────────────────────────────────────────────────────────────────
const readJSON=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const baseCatalog=()=>readJSON('../assets/matrix-furniture/catalog/manifest.json'),hiperrealManifest=()=>readJSON('../assets/matrix-furniture/hiperreal/manifest.json');
const SCREENED={1:1,4:1,7:1,12:1,13:1,14:1,15:1,18:1,30:1,41:1};
const near=(actual,expected,eps)=>assert.ok(Math.abs(actual-expected)<eps,`${actual} != ${expected}`);

test('the Hiperreal renders cover the 43 models in four turns, each with its floor shadow and measured screens',()=>{
  const manifest=hiperrealManifest(),base=baseCatalog(),byNumber=new Map(base.items.map(item=>[item.number,item]));
  assert.equal(manifest.items.length,43);assert.deepEqual(manifest.items.map(item=>item.inventoryId),base.items.map(item=>item.inventoryId));
  assert.match(manifest.generator,/render_hiperreal_sprites\.py$/);assert.ok(fs.existsSync(new URL('../../'+manifest.generator,import.meta.url)));
  const paths=new Set();let bytes=0;
  const webp=(url,width,height,sha256)=>{
    assert.ok(!paths.has(url),url);paths.add(url);
    const file=fs.readFileSync(new URL('../'+url,import.meta.url));bytes+=file.length;
    assert.equal(file.subarray(0,4).toString(),'RIFF');assert.equal(file.subarray(8,12).toString(),'WEBP');
    // Lossy with alpha: the extended header carries the canvas size and the alpha flag.
    assert.equal(file.subarray(12,16).toString(),'VP8X');assert.ok(file[20]&0x10,'alpha channel');
    assert.equal(1+file.readUIntLE(24,3),width);assert.equal(1+file.readUIntLE(27,3),height);
    assert.equal(createHash('sha256').update(file).digest('hex'),sha256);assert.ok(file.length<220*1024,`${url} weighs ${file.length}`);
  };
  for(const item of manifest.items){
    const reference=byNumber.get(item.number);assert.equal(item.inventoryId,reference.inventoryId);assert.deepEqual(item.footprint,reference.footprint);
    assert.deepEqual(item.views.map(view=>view.rotation),[0,1,2,3]);
    const source=fs.readFileSync(new URL('../../'+item.source,import.meta.url));assert.equal(createHash('sha256').update(source).digest('hex'),item.sourceSha256);
    for(const view of item.views){
      const number=String(item.number).padStart(2,'0'),old=reference.views.find(value=>value.rotation===view.rotation);
      assert.equal(view.url,`assets/matrix-furniture/hiperreal/${number}-r${view.rotation}.webp`);webp(view.url,view.width,view.height,view.sha256);
      assert.equal(view.width,1024);assert.ok(view.anchor.every(Number.isFinite)&&view.floorCenter.every(Number.isFinite));
      // Same camera as the base catalog, each model framed to its own bounds: the scale on the floor travels with the view.
      assert.ok(view.pixelsPerGridUnit>0&&old.pixelsPerGridUnit>0);
      const shadow=view.shadow;assert.equal(shadow.url,`assets/matrix-furniture/hiperreal/${number}-r${view.rotation}-s.webp`);webp(shadow.url,shadow.width,shadow.height,shadow.sha256);
      assert.ok(shadow.pixelsPerGridUnit>0&&shadow.pixelsPerGridUnit<view.pixelsPerGridUnit,'a wider frame, so the shadow has room');assert.ok(shadow.anchor.every(Number.isFinite));
      assert.ok(Array.isArray(view.screens));
      for(const screen of view.screens){
        assert.ok(SCREENED[item.number],`${item.number} has no screen`);assert.ok(screen.aspect>0&&screen.facing>.12);assert.equal(screen.quad.length,4);
        for(const [x,y] of screen.quad){assert.ok(x>=0&&x<=view.width&&y>=0&&y<=view.height);}
        assert.ok(quadTransform(screen.quad.map(([x,y])=>({x,y})),384,216),'a convex aperture a picture can be mapped onto');
        // Read as a visitor reads it: the top edge above the bottom one, left before right.
        assert.ok(screen.quad[0][0]<screen.quad[1][0]&&screen.quad[3][0]<screen.quad[2][0]&&screen.quad[0][1]<screen.quad[3][1]&&screen.quad[1][1]<screen.quad[2][1]);
      }
    }
    // A screen faces the camera in the two turns that show the front of the piece, and never in the other two.
    assert.deepEqual(item.views.map(view=>view.screens.length),SCREENED[item.number]?[1,0,0,1]:[0,0,0,0],`${item.number} ${item.name}`);
  }
  assert.equal(paths.size,344);assert.ok(bytes<16*1024*1024,`${bytes} bytes`);
  assert.deepEqual(fs.readdirSync(new URL('../assets/matrix-furniture/hiperreal/',import.meta.url)).filter(name=>name.endsWith('.webp')).length,344,'no stray renders');
});

test('the plan draws turned pieces from the Hiperreal renders, with their shadow and screens, and keeps the photographs',()=>{
  const rich=withHiperreal(baseCatalog(),hiperrealManifest()),plain=baseCatalog();
  assert.equal(rich.hiperreal.size,43);assert.equal(rich.items,plain.items.length&&rich.items);
  const at=(item,catalog=rich)=>planMatrixFurniture(scene([item]),catalog)[0];
  for(const rot of [1,2,3]){
    const p=at({...counter,col:6,row:3,rot});
    assert.equal(p.kind,'sprite');assert.match(p.url,new RegExp(`/assets/matrix-furniture/hiperreal/01-r${rot}\\.webp$`));assert.match(p.shadow.url,new RegExp(`/hiperreal/01-r${rot}-s\\.webp$`));
    close(p.left+p.width*p.origin[0],p.anchor.x);close(p.top+p.height*p.origin[1],p.anchor.y);
    // The shadow hangs from the same floor origin, at the same scale on the floor.
    close(p.shadow.left+p.shadow.width*p.shadow.origin[0],p.anchor.x);close(p.shadow.top+p.shadow.height*p.shadow.origin[1],p.anchor.y);
    near(p.shadow.width/p.width,(p.view.shadow.width/p.view.shadow.pixelsPerGridUnit)/(p.view.width/p.view.pixelsPerGridUnit),1e-9);
    // Same size on the floor as the base catalog draws it.
    const old=at({...counter,col:6,row:3,rot},plain);near(p.width,old.width,1e-6);near(p.left,old.left,2e-3);near(p.top,old.top,2e-3);assert.equal(old.shadow,null);assert.match(old.url,/catalog\/01-r\d\.png$/);
    assert.equal(p.screens.length,rot===3?1:0);
  }
  const screen=at({...counter,col:6,row:3,rot:3}).screens[0];
  assert.equal(screen.id,'inventory:counter');near(screen.aspect,1.8168,1e-3);assert.ok(screen.quad.flat().every(value=>value>0&&value<1));
  // Photographs stay at the original turn; they borrow the shadow of their model and bring their own screens.
  const photo=at(counter);assert.equal(photo.kind,'photo');assert.match(photo.shadow.url,/hiperreal\/01-r0-s\.webp$/);assert.deepEqual(photo.screens,[]);
  const origin=projectMatrixFloor(counter.col,counter.row);close(photo.shadow.left+photo.shadow.width*photo.shadow.origin[0],origin.x);close(photo.shadow.top+photo.shadow.height*photo.shadow.origin[1],origin.y);
  for(const [type,id,aspect] of [['metahuman','metahuman',9/16],['manager','inventory:piece',16/10],['lottery','inventory:piece',1.3],['turnKiosk','inventory:piece',2/3],['led','inventory:piece',9/16]]){
    const p=at({id:'piece',type,col:6,row:3,rot:0});assert.equal(p.kind,'photo',type);assert.equal(p.screens.length,1);assert.equal(p.screens[0].id,id);close(p.screens[0].aspect,aspect);
    assert.ok(p.screens[0].quad.flat().every(value=>value>=0&&value<=1),type);assert.ok(quadTransform(p.screens[0].quad.map(([x,y])=>({x:x*100,y:y*100})),216,384));
  }
  assert.equal(at({id:'tv',type:'tft',col:4,row:0,rot:0}).screens[0].id,'escaparate');assert.equal(at({id:'tv',type:'tft',col:4,row:0,rot:1}).screens.length,0);
  assert.equal(screenIdFor({id:'a',type:'metahuman'}),'metahuman');assert.equal(screenIdFor({id:'a',type:'tft'}),'escaparate');assert.equal(screenIdFor({id:'a',type:'counter'}),'inventory:a');assert.equal(screenIdFor({id:'a',type:'custom'},'side'),'inventory:a:side');
  // What hangs on a wall or lies on the floor casts no rendered shadow; a rug is painted under everything.
  for(const type of ['led','tft','aroma'])assert.equal(at({id:'w',type,col:3,row:0}).shadow,null,type);
  const rugs=withHiperreal({...plain,items:plain.items},hiperrealManifest()),rug=at({id:'rug',type:'rug',col:4,row:4,fp:[2,2]},rugs);assert.equal(rug.floor,true);assert.equal(rug.shadow,null);assert.equal(at(counter).floor,false);
  // The shadow follows the floor footprint: mirror and width scale it, height never does.
  const wide=at({...chair(),rot:1,sx:1.5,sy:2,flipX:true});assert.deepEqual([wide.shadow.sx,wide.shadow.sy],[-1.5,1.5]);assert.equal(wide.sy,2);
  const tall=at({...chair(),rot:1,ph:4}),short=at({...chair(),rot:1,ph:2});close(tall.shadow.width,short.shadow.width*2);
  // Without the renders the old catalog still works, wall screen included.
  const legacy=at({id:'tv',type:'tft',col:4,row:0,rot:0},plain);assert.match(legacy.url,/catalog\/13-r0\.png$/);assert.equal(legacy.screens.length,1);assert.equal(legacy.screens[0].id,'escaparate');close(legacy.screens[0].quad[0][0],125/384);
  for(const broken of [null,{},{items:'x'},{items:[{inventoryId:'native:counter',views:[{rotation:0}]},{inventoryId:7,views:[]},null]}])assert.equal(withHiperreal(plain,broken).hiperreal.size,0);
  assert.equal(at({...counter,rot:1},withHiperreal(plain,{items:[]})).shadow,null);
});

test('a screen is as long as any other and as wide as its panel; its light pools one tile in front, inside the room',()=>{
  assert.deepEqual(screenSize(9/16),[216,384]);assert.deepEqual(screenSize(16/9),[384,216]);assert.deepEqual(screenSize(1),[384,384]);assert.deepEqual(screenSize(24.3),[384,16]);assert.deepEqual(screenSize(.01),[8,384]);assert.deepEqual(screenSize(NaN),[216,384]);
  assert.ok(FLOOR_Z<SHADOW_Z&&SHADOW_Z<POOL_Z&&POOL_Z<10&&HELD_Z>1100,'rug, shadow and light under every piece; a carried piece over the room');
  const room={cols:14,rows:8},box={minCol:5,maxCol:6,minRow:3,maxRow:4};
  // A top edge that falls to the right is a panel facing the left of the picture: the light goes towards +row.
  const left=screenPool({footprint:box,flip:false,wall:false},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room),centre=projectMatrixFloor(5.5,4.85);close(left.x,centre.x);close(left.y,centre.y);
  const right=screenPool({footprint:box,flip:false,wall:false},[[.2,.4],[.8,.2],[.8,.7],[.2,.9]],room),other=projectMatrixFloor(6.85,3.5);close(right.x,other.x);close(right.y,other.y);
  // A mirrored piece shows the other side: the pool changes side with it.
  close(screenPool({footprint:box,flip:true,wall:false},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room).x,other.x);
  // The floor axes of the disc are those of the room, measured where the projection is not clamped.
  const u=projectMatrixFloor(6.5,4.85),v=projectMatrixFloor(5.5,5.85);close(left.u[0],u.x-centre.x);close(left.u[1],u.y-centre.y);close(left.v[0],v.x-centre.x);close(left.v[1],v.y-centre.y);
  const edge=screenPool({footprint:{minCol:5,maxCol:6,minRow:6.1,maxRow:7.1},flip:false,wall:false},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room);
  assert.ok(Math.hypot(...edge.u)>.01&&Math.hypot(...edge.v)>.01,'never a collapsed disc by the wall');
  // Facing the open side of the room, on a wall, or without a footprint: no pool.
  assert.equal(screenPool({footprint:{minCol:5,maxCol:6,minRow:7,maxRow:8},flip:false,wall:false},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room),null);
  assert.equal(screenPool({footprint:{minCol:13,maxCol:14,minRow:3,maxRow:4},flip:false,wall:false},[[.2,.4],[.8,.2],[.8,.7],[.2,.9]],room),null);
  assert.equal(screenPool({footprint:box,flip:false,wall:true},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room),null);assert.equal(screenPool({footprint:null,flip:false,wall:false},[[.2,.2],[.8,.4],[.8,.9],[.2,.7]],room),null);
});

test('the two framed prints are the wall players of Good and every measured screen sits inside its own cut-out',()=>{
  const framed=MATRIX_ARCHITECTURE_DETAILS.filter(detail=>detail.screens);
  assert.deepEqual(framed.map(detail=>[detail.screens[0].id,detail.screens[0].aspect]),[['ds1',9/16],['ds2',4/5]]);
  const inside=(polygon,[x,y])=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}return hit;};
  const pieces=[...framed,...Object.values(MATRIX_PHOTO_PIECES).filter(piece=>piece.screens)];assert.equal(pieces.length,7);
  for(const piece of pieces)for(const screen of piece.screens){
    assert.equal(screen.quad.length,4);assert.ok(Object.isFrozen(screen)&&Object.isFrozen(screen.quad));
    for(const point of screen.quad)assert.ok(piece.polygons.some(polygon=>inside(polygon,point)),`${piece.number??screen.id} ${point}`);
    assert.ok(quadTransform(screen.quad.map(([x,y])=>({x,y})),216,384));
    // Top-left, top-right, bottom-right, bottom-left as a visitor reads the panel.
    assert.ok(screen.quad[0][0]<screen.quad[1][0]&&screen.quad[0][1]<screen.quad[3][1]&&screen.quad[1][1]<screen.quad[2][1]);
  }
  // The left print hangs clear of the door at the canonical layout, still on the green wall.
  const left=framed[0];assert.ok(left.target[0]>.15&&left.target[0]<.2&&left.target[1]<.37);
});

function screenStage(layout,options={}){
  const rich=withHiperreal(baseCatalog(),hiperrealManifest()),painted=[];
  const h=harness(state(layout),{load:async()=>rich,paintScreen:(ctx,w,h,screen)=>{painted.push({...screen,w,h});return options.lit?options.lit(screen):true;},...options.mount});
  const canvases=()=>{const out=[];const walk=node=>{for(const child of node.children){if(child.tagName==='canvas'&&child.dataset.mediaScreen)out.push(child);walk(child);}};walk(h.layer);return out;};
  const frame=now=>{const [id,callback]=[...h.frames][0];h.frames.delete(id);callback(now);};
  return {h,painted,canvases,frame,find:name=>h.layer.children.filter(node=>String(node.className).split(' ').includes(name))};
}
const mupi={id:'metahuman',type:'metahuman',col:5,row:3,rot:0,sx:1,sy:1,label:'Metahuman AI'};

test('every screen is a canvas on the aperture of its piece, painted each frame by the room players, with glow and pool',async()=>{
  const s=screenStage([mupi,{...counter,rot:3},{id:'led',type:'led',col:0,row:0},{id:'rug',type:'rug',col:9,row:5,fp:[2,2]}]);
  try{
    await flush();s.h.loaded();s.h.furniture.update();
    assert.deepEqual(s.canvases().map(canvas=>canvas.dataset.mediaScreen).sort(),['ds1','ds2','inventory:counter','inventory:led','metahuman']);
    const totem=s.canvases().find(canvas=>canvas.dataset.mediaScreen==='metahuman');
    assert.deepEqual([totem.width,totem.height],[216,384]);assert.equal(totem.className,'matrix-furniture-screen');assert.match(totem.style.cssText,/pointer-events:auto/);assert.equal(totem.parent.dataset.instanceId,'metahuman');
    assert.match(totem.style.transform,/^matrix3d\(/,'mapped onto the aperture at the size of the room');
    const wide=s.canvases().find(canvas=>canvas.dataset.mediaScreen==='inventory:counter');assert.equal(wide.width,384);assert.ok(wide.height<wide.width);
    // Behind each one, a blurred copy of its own picture; in front of standing pieces, a pool on the floor.
    assert.equal(totem.parent.children.filter(node=>node.className==='matrix-screen-glow').length,1);
    assert.equal(s.find('matrix-screen-pool').length,2,'the totem and the counter stand on the floor; wall screens light no floor');
    for(const pool of s.find('matrix-screen-pool')){assert.equal(pool.style.zIndex,String(POOL_Z));assert.match(pool.style.transform,/^translate\(-50%,-50%\) matrix\(/);}
    // Rendered shadows under every standing piece; the rug under them all.
    assert.deepEqual(s.find('matrix-furniture-shadow').map(node=>node.src.split('/').pop()).sort(),['01-r3-s.webp','14-r0-s.webp']);
    for(const shadow of s.find('matrix-furniture-shadow')){assert.equal(shadow.style.zIndex,String(SHADOW_Z));assert.equal(shadow.getAttribute('aria-hidden'),'true');}
    assert.equal(s.h.buttons.find(node=>node.dataset.instanceId==='rug').style.zIndex,String(FLOOR_Z));assert.equal(s.h.buttons.find(node=>node.dataset.instanceId==='led').dataset.wall,'1');
    assert.deepEqual(s.h.furniture.screens().map(screen=>screen.id).sort(),['ds1','ds2','inventory:counter','inventory:led','metahuman']);
    assert.equal(s.h.furniture.screens().find(screen=>screen.id==='metahuman').pieceId,'metahuman');assert.equal(s.h.furniture.screens().find(screen=>screen.id==='ds1').pieceId,null);
    // One frame: the layout is read and every screen is offered to the painter with its identity and shape.
    s.frame(1000);
    assert.deepEqual(s.painted.map(screen=>screen.id).sort(),['ds1','ds2','inventory:counter','inventory:led','metahuman']);
    const asked=s.painted.find(screen=>screen.id==='metahuman');assert.deepEqual([asked.w,asked.h,asked.aspect,asked.item.type,asked.label],[216,384,9/16,'metahuman','Metahuman AI']);
    assert.equal(s.painted.find(screen=>screen.id==='ds2').aspect,4/5);assert.equal(s.painted.find(screen=>screen.id==='ds1').item,null);
    for(const canvas of s.canvases()){assert.equal(canvas.dataset.lit,'1');assert.equal(canvas.calls[0][0],'clearRect');assert.equal(canvas.calls.at(-1)[0],'drawImage','the pane of glass goes over the picture');}
    assert.ok(totem.parent.children.find(node=>node.className==='matrix-screen-glow').dataset.lit==='1');assert.ok(s.find('matrix-screen-pool').every(pool=>pool.dataset.lit==='1'));
    // Screens are painted at the pace of video, the layout at the pace of the shop.
    const before=s.painted.length;s.frame(1010);assert.equal(s.painted.length,before,'not twice within a video frame');s.frame(1040);assert.equal(s.painted.length,before+5);
    s.h.furniture.dispose();assert.equal(s.h.container.children.length,0);
  }finally{s.h.cleanup();}
});

test('a dark screen shows the drawing of its own piece, the totem rests, and the light can be switched off',async()=>{
  let light=true;const s=screenStage([mupi,{id:'desk',type:'manager',col:5,row:6,rot:0,label:'Escritorio'}],{lit:()=>false,mount:{light:()=>light}});
  try{
    await flush();s.h.loaded();s.h.furniture.update();s.frame(1000);
    const [desk,totem]=['inventory:desk','metahuman'].map(id=>s.canvases().find(canvas=>canvas.dataset.mediaScreen===id));
    assert.equal(desk.dataset.lit,'0','transparent: the photograph shows through');assert.deepEqual(desk.calls.map(call=>call[0]),['clearRect']);
    assert.equal(totem.dataset.lit,'1','the totem never shows the grey placeholder of its photograph');assert.ok(totem.calls.some(call=>call[0]==='fillText'&&call[1]==='Metahuman AI'));
    assert.equal(s.canvases().find(canvas=>canvas.dataset.mediaScreen==='ds1').dataset.lit,'0','the framed print stays a print');
    light=false;s.frame(1100);
    assert.equal(totem.parent.children.find(node=>node.className==='matrix-screen-glow').dataset.lit,'0');assert.ok(s.find('matrix-screen-pool').every(pool=>pool.dataset.lit==='0'));assert.equal(totem.dataset.lit,'1');
  }finally{s.h.cleanup();}
});

test('a page pinned on a screen is an inert frame on the same aperture, sized as it is seen, and leaves with its pin',async()=>{
  let page={src:'https://example.com/kiosk?lang=es',title:'Quiosco de pedido'};const asked=[];
  const s=screenStage([mupi],{mount:{webScreen:screen=>{asked.push(screen);return screen.id==='metahuman'?page:null;}}});
  try{
    await flush();s.h.furniture.update();
    const node=s.h.buttons[0],frame=()=>node.children.find(child=>child.tagName==='iframe');
    assert.ok(frame());assert.equal(frame().src,page.src);assert.equal(frame().title,'Quiosco de pedido');assert.equal(frame().inert,true);assert.equal(frame().tabIndex,-1);assert.equal(frame().className,'matrix-furniture-web');
    assert.match(frame().style.cssText,/pointer-events:none/);assert.equal(frame().getAttribute('allow'),'autoplay','shown, not given a microphone or a camera');assert.equal(frame().dataset.ready,'0');
    assert.match(frame().style.transform,/^matrix3d\(/);assert.ok(Number(frame().width)>=24&&Number(frame().height)>Number(frame().width),'a portrait panel at the size it is seen');
    assert.equal(node.children.indexOf(frame())>node.children.findIndex(child=>child.tagName==='canvas'),true,'over its own canvas');
    assert.equal(s.h.furniture.screens().find(screen=>screen.id==='metahuman').web,true);assert.ok(asked.some(screen=>screen.id==='metahuman'&&screen.aspect===9/16));
    frame().events.get('load')();assert.equal(frame().dataset.ready,'1');
    const same=frame();s.h.furniture.update();assert.equal(frame(),same,'the page is not reloaded by a layout pass');
    page={src:'https://example.com/canal',title:'Canal'};s.h.furniture.update();assert.equal(frame(),same);assert.equal(frame().src,'https://example.com/canal');assert.equal(frame().dataset.ready,'0');
    // Only https pages; anything else is not framed.
    for(const src of ['http://example.com','javascript:alert(1)','blob:https://x/y','']){page={src,title:'x'};s.h.furniture.update();assert.equal(frame(),undefined,src);}
    page={src:'https://example.com/kiosk',title:'Quiosco'};s.h.furniture.update();assert.ok(frame());page=null;s.h.furniture.update();assert.equal(frame(),undefined);
    assert.equal(s.h.furniture.screens().find(screen=>screen.id==='metahuman').web,false);
  }finally{s.h.cleanup();}
});

test('a carried piece is drawn where the hand says, over the room, with its shadow left on the floor',async()=>{
  let draft=null,view=null,live=false;const seen=[];
  const s=screenStage([{...counter,rot:1},chair()],{mount:{decorate:scene=>{seen.push(scene.layout.length);return draft?{...scene,layout:scene.layout.map(item=>item.id==='counter'?{...item,...draft}:item)}:scene;},present:p=>p.id==='counter'?view:p.id==='chair-1'?{state:'blocking'}:null,live:()=>live}});
  try{
    await flush();s.h.loaded();s.h.furniture.update();
    const node=s.h.buttons.find(button=>button.dataset.instanceId==='counter'),shadow=s.find('matrix-furniture-shadow').find(image=>/01-r1-s/.test(image.src)),rest=node.style.zIndex,left=node.style.left;
    assert.equal(node.dataset.lift,'');assert.equal(node.style.translate,'');assert.equal(s.h.buttons.find(button=>button.dataset.instanceId==='chair-1').dataset.lift,'blocking');
    draft={col:9.4,row:4.2};view={state:'held',pose:{x:0,y:-40,floorY:0,tilt:-2.5,sx:1.03,sy:1.03,lift:1,front:true}};s.h.furniture.update();
    assert.notEqual(node.style.left,left,'the plan follows the piece before anything is saved');assert.equal(node.style.zIndex,String(HELD_Z));assert.equal(node.dataset.lift,'held');
    assert.equal(node.style.translate,'0.00px -40.00px');assert.equal(node.style.rotate,'-2.500deg');assert.equal(node.style.scale,'1.0300 1.0300');assert.match(node.style.transform,/^scale\(/,'its own mirror and size are untouched');
    assert.equal(shadow.style.translate,'0.00px 0.00px','the shadow follows sideways, never up');assert.equal(shadow.dataset.lift,'held');assert.equal(shadow.style.zIndex,String(SHADOW_Z));
    // A quarter turn in the air swaps the picture and its shadow; the hand keeps hold of the new one.
    draft={col:9.4,row:4.2,rot:2};s.h.furniture.update();
    const turned=s.h.buttons.find(button=>button.dataset.instanceId==='counter');assert.notEqual(turned,node);assert.match(turned.querySelector('img').src,/01-r2\.webp$/);assert.equal(turned.dataset.lift,'held');assert.equal(turned.style.zIndex,String(HELD_Z));
    assert.deepEqual(s.find('matrix-furniture-shadow').map(image=>image.src.split('/').pop()).sort(),['01-r2-s.webp','43-r0-s.webp']);
    // Settling: back in the order of the room for the last instants, then released.
    view={state:'settling',pose:{x:3,y:0,floorY:0,tilt:0,sx:1.02,sy:.96,lift:0,front:false}};s.h.furniture.update();assert.notEqual(turned.style.zIndex,String(HELD_Z));assert.equal(turned.dataset.lift,'settling');
    draft=null;view=null;s.h.furniture.update();
    const back=s.h.buttons.find(button=>button.dataset.instanceId==='counter');assert.equal(back.style.zIndex,rest);assert.equal(back.style.left,left);assert.equal(back.style.translate,'');assert.equal(back.style.scale,'');assert.equal(back.dataset.lift,'');
    // While the hand is busy the layout is read every frame; otherwise ten times a second.
    const passes=()=>seen.length;let count=passes();s.frame(5000);assert.equal(passes(),count+1);count=passes();s.frame(5016);assert.equal(passes(),count,'idle: not yet');
    live=true;s.frame(5032);s.frame(5048);assert.equal(passes(),count+2);
    assert.equal(s.h.furniture.piece('counter').placement.id,'counter');assert.equal(s.h.furniture.piece('nobody'),null);assert.equal(s.h.furniture.scene.cols,14);
  }finally{s.h.cleanup();}
});

test('the pointer chooses by what is really drawn: the cut-out of a photograph, never the empty corner of its box',async()=>{
  const s=screenStage([mupi,{...counter,col:4,row:3}]);
  try{
    await flush();s.h.furniture.update();
    const [totem,desk]=['metahuman','counter'].map(id=>s.h.buttons.find(button=>button.dataset.instanceId===id));
    totem.rect={left:100,top:100,width:100,height:200};desk.rect={left:100,top:100,width:200,height:200};
    const stack=[];globalThis.document.elementsFromPoint=()=>stack;
    const box=s.h.furniture.piece('metahuman').placement.box,inside=([x,y])=>[100+(x-box.x)/box.width*100,100+(y-box.y)/box.height*200];
    // The centre of the totem photograph is totem; its top-right corner is empty.
    stack.push(totem,desk);const [cx,cy]=inside([730,480]);assert.equal(s.h.furniture.pick(cx,cy),'metahuman');
    const [ex,ey]=inside([box.x+box.width-1,box.y+1]);assert.notEqual(s.h.furniture.pick(ex,ey),'metahuman','through the transparent corner to whatever is behind');
    assert.equal(s.h.furniture.pick(5,5),null);stack.length=0;assert.equal(s.h.furniture.pick(cx,cy),null);
    // A screen answers for itself unless a nearer piece really covers that point.
    const canvas=s.canvases().find(node=>node.dataset.mediaScreen==='metahuman');
    stack.push(canvas,totem);assert.equal(s.h.furniture.screenAt(cx,cy),'metahuman');
    stack.length=0;stack.push(totem,canvas);assert.equal(s.h.furniture.screenAt(cx,cy),null,'covered by the piece in front');
    stack.length=0;stack.push(totem,canvas);assert.equal(s.h.furniture.screenAt(ex,ey),'metahuman','seen through its empty corner');
    assert.deepEqual(s.h.furniture.piece('metahuman').rect,{left:100,right:200,top:100,bottom:300});
  }finally{delete globalThis.document?.elementsFromPoint;s.h.cleanup();}
});
