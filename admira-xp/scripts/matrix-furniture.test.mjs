import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {mountMatrixFurniture,planMatrixFurniture,placementZone} from './matrix-furniture.mjs';
import {MATRIX_ATLAS_URL,MATRIX_ATLAS_SIZE,MATRIX_PHOTO_PIECES} from './matrix-photo-pieces.mjs';
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
