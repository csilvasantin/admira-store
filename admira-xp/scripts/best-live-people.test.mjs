import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BEST_HARDNESS_ZONES,isBestWalkable,projectBestFloor,resolveBestHardness,segmentCrossesBestHardness} from './best-live-people.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';
import {visitorProfileById} from './visitor-profiles.mjs';
import {buildCustomerNavigation} from './customer-navigation.mjs';
import {createCustomerMotion} from './customer-motion.mjs';

// Isolate rendering from profile assignment: the original collision cases still
// exercise the legacy fallback, while atlas cases supply a canonical snapshot.
const source=readFileSync(new URL('./best-live-people.mjs',import.meta.url),'utf8');
function layerFactory(snapshotFactory=createLifeSnapshot,profileLookup=()=>null,navigationFactory=buildCustomerNavigation,motionFactory=createCustomerMotion){
  return new Function('createLifeSnapshot','visitorProfileById','buildCustomerNavigation','createCustomerMotion',source.replace(/^import .*;\n/gm,'').replace(/\bexport /g,'')+'\nreturn createBestPeopleLayer;')(snapshotFactory,profileLookup,navigationFactory,motionFactory);
}
const createBestPeopleLayer=layerFactory();
const imagesUnder=node=>node.tag==='img'?[node]:(node.children||[]).flatMap(imagesUnder);

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('the Good grid maps into the four measured floor corners of the approved Best perspective',()=>{
  const point=([x,y])=>[(x*1672-84)/1504,(y*941-.5)/940];
  for(const [col,row,[x,y]] of [[0,0,point([.355,.245])],[14,0,point([.905,.505])],[0,8,point([.085,.525])],[14,8,point([.605,.925])]]){
    const point=projectBestFloor(col,row);near(point.x,x);near(point.y,y);
  }
  const center=projectBestFloor(7,4),expected=point([.4875,.55]);near(center.x,expected[0]);near(center.y,expected[1]);near(center.depth,.5);
  assert.deepEqual(projectBestFloor(-10,-10),projectBestFloor(0,0));
  assert.deepEqual(projectBestFloor(99,99),projectBestFloor(14,8));
});

test('the Best plate has calibrated hard furniture footprints and every resolved foot point stays on open floor',()=>{
  for(const zone of BEST_HARDNESS_ZONES){
    const point={x:zone.reduce((sum,p)=>sum+p[0],0)/zone.length,y:zone.reduce((sum,p)=>sum+p[1],0)/zone.length,depth:.5};
    assert.equal(isBestWalkable(point),false);assert.equal(isBestWalkable(resolveBestHardness(point)),true);
  }
  assert.equal(segmentCrossesBestHardness({x:.46,y:.49},{x:.46,y:.63}),true);
});

test('dynamic furniture removal releases its footprint and crossing path without changing fixed-plate defaults',()=>{
  const zone=BEST_HARDNESS_ZONES[3],point={x:zone.reduce((sum,p)=>sum+p[0],0)/zone.length,y:zone.reduce((sum,p)=>sum+p[1],0)/zone.length,depth:.5};
  const zones=[zone],before=JSON.stringify(zones),from={...point,x:point.x-.07},to={...point,x:point.x+.07};
  assert.equal(isBestWalkable(point,zones),false);
  assert.equal(segmentCrossesBestHardness(from,to,zones),true);
  assert.notDeepEqual(resolveBestHardness(point,zones),point);
  assert.equal(isBestWalkable(point,[]),true);
  assert.equal(segmentCrossesBestHardness(from,to,[]),false);
  assert.equal(resolveBestHardness(point,[]),point);
  assert.equal(isBestWalkable(point),false);
  assert.equal(isBestWalkable({x:-1,y:-1},[]),false);
  assert.equal(JSON.stringify(zones),before);
});

test('an independently calibrated room supplies its own walkable floor, obstacle resolution and movement segments',()=>{
  const floor=Object.freeze([[.7,.1],[.95,.1],[.95,.3],[.7,.3]].map(Object.freeze));
  const from={x:.75,y:.2,depth:.4},to={x:.9,y:.2,depth:.6},zone=[[.8,.15],[.85,.15],[.85,.25],[.8,.25]],before=JSON.stringify({floor,zone});
  assert.equal(isBestWalkable(from,[]),false);assert.equal(isBestWalkable(from,[],floor),true);
  assert.equal(segmentCrossesBestHardness(from,to,[],floor),false);assert.equal(segmentCrossesBestHardness(from,to,[zone],floor),true);
  const resolved=resolveBestHardness({x:.825,y:.2,depth:.5},[zone],floor);assert.equal(isBestWalkable(resolved,[zone],floor),true);
  const farAway=resolveBestHardness({x:.1,y:.9,depth:.5},[],floor);assert.equal(isBestWalkable(farAway,[],floor),true);
  assert.equal(JSON.stringify({floor,zone}),before);
});

const iso={cols:14,rows:8,tileW:80,tileH:28,wallH:165,ox:270,oy:185};
const at=(col,row)=>({x:iso.ox+(col-row)*iso.tileW/2-7,y:iso.oy+(col+row)*iso.tileH/2-20});
function fixture(){
  return {active:true,iso,layout:[],footprints:{},realTrafficActive:false,game:{
    staff:[{...at(3,2),hired:true,name:'Player',shirt:0,hair:3,role:3,dir:1,look:{skin:0,pants:2,shoes:1}}],
    custs:[{...at(6,4),id:12,dir:-1,st:'browse',look:{shirt:2,hair:1,skin:4,pants:3,shoes:2}}],
    passersby:[{...at(15,4),outside:true,dir:1,look:{shirt:4,hair:5,skin:1}}],custIn:1,gameTime:14,doorAnim:0
  }};
}

test('the overlay follows live actor positions, excludes outdoor traffic and disposes every DOM resource',()=>{
  const originalDocument=globalThis.document,frames=[],cancelled=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
    setAttribute(name,value){(this.attrs??={})[name]=String(value);}
    append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;this.removed=true;}
  }
  globalThis.document={hidden:false,createElement:tag=>new Element(tag)};
  try{
    const state=fixture(),container=new Element('scene');
    const people=createBestPeopleLayer({container,getState:()=>state,now:()=>0,requestFrame:callback=>(frames.push(callback),frames.length),cancelFrame:id=>cancelled.push(id)});
    const layer=container.children.find(node=>node.className==='best-people-layer'),status=container.children.find(node=>node.className==='best-people-status');
    assert.equal(people.count,1);assert.equal(layer.children.length,1);assert.match(status.textContent,/1 cliente simulado/);
    assert.match(status.textContent,/colisiones activas/);assert.equal(container.children.filter(node=>node.className==='best-depth-occluder').length,0);
    assert.equal(layer.children.some(node=>node.className.includes('passerby')),false);
    assert.match(imagesUnder(layer.children[0])[0].src,/best-person-(?:male-rust|female-denim)-20260915\.png/);
    const customer=layer.children.find(node=>node.className.includes('kind-customer')),left=customer.style.left;
    Object.assign(state.game.custs[0],at(7,4));people.update(100);frames.at(-1)(200);
    assert.notEqual(customer.style.left,left);assert.match(customer.className,/is-walking/);
    people.dispose();people.dispose();assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
  }finally{globalThis.document=originalDocument;}
});

test('children use real child cutouts and deterministic age variation instead of scaled adult sprites',()=>{
  const originalDocument=globalThis.document,frames=[];
  class Element{
    constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent){const index=this.parent.children.indexOf(this);if(index>=0)this.parent.children.splice(index,1);}this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:tag=>new Element(tag)};
  try{
    const state=fixture();Object.assign(state.game.custs[0].look,{age:'nino',gender:'f'});state.layout=[{id:'obstacle',type:'custom',col:5.5,row:3.5,fp:[1,1]}];
    const container=new Element('scene'),people=createBestPeopleLayer({container,getState:()=>state,now:()=>0,requestFrame:callback=>(frames.push(callback),frames.length),cancelFrame:()=>{}});
    const child=container.children.find(node=>node.className==='best-people-layer').children[0];
    assert.match(child.className,/is-child/);assert.match(imagesUnder(child)[0].src,/best-person-child-ochre-20260915\.png/);
    assert.ok(Number(child.style.values['--person-scale'])<.8);assert.ok(child.hidden===false);
    people.dispose();
  }finally{globalThis.document=originalDocument;}
});

test('Matrix uses actual inventory geometry even while furniture images are unavailable and clears actors on mudanza',()=>{
  const originalDocument=globalThis.document,frames=new Map(),cancelled=[];let nextFrame=0;
  class Element{
    constructor(){this.children=[];this.parent=null;this.attrs={};this.style={setProperty(){}};}
    setAttribute(k,v){this.attrs[k]=v;} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:()=>new Element()};
  try{
    const state=fixture(),container=new Element();state.layout=[{id:'solid',type:'custom',col:5.5,row:3.5,fp:[1,1]}];
    const before=JSON.stringify(state),navigation=buildCustomerNavigation({...state,cols:14,rows:8});
    const people=createBestPeopleLayer({container,getState:()=>state,now:()=>0,
      requestFrame:callback=>{frames.set(++nextFrame,callback);return nextFrame;},cancelFrame:id=>{cancelled.push(id);frames.delete(id);}});
    const layer=container.children.find(node=>node.className==='best-people-layer'),person=layer.children[0];
    const coordinate=()=>({col:Number(person.attrs['data-visitor-col']),row:Number(person.attrs['data-visitor-row'])});
    assert.equal(people.count,1);assert.equal(navigation.isWalkable(coordinate()),true);
    assert.equal(JSON.stringify(state),before);
    state.layout=[];people.update(100);for(let t=116;t<1500;t+=16)frames.get(nextFrame)(t);
    assert.ok(Math.hypot(coordinate().col-6,coordinate().row-4)<.01);
    assert.doesNotMatch(person.className,/is-repositioning/);
    state.moving=true;people.update(1500);assert.equal(people.count,0);assert.equal(layer.children.length,0);
    people.dispose();people.dispose();people.update();
    assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
  }finally{globalThis.document=originalDocument;}
});

test('a supplied floor projector drives visitor feet and transitions without pulling them back onto the legacy photograph',()=>{
  const originalDocument=globalThis.document,calls=[];
  class Element{
    constructor(){this.children=[];this.parent=null;this.style={setProperty(){}};}
    setAttribute(){} append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
    remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}
  }
  globalThis.document={hidden:false,createElement:()=>new Element()};
  try{
    const state=fixture(),container=new Element(),floorPolygon=[[.7,.1],[.95,.1],[.95,.3],[.7,.3]];
    const projectFloor=(col,row,cols,rows)=>{calls.push([col,row,cols,rows]);return {x:.72+col*.012,y:.12+row*.015,depth:(col/cols+row/rows)/2};};
    const people=createBestPeopleLayer({container,getState:()=>state,now:()=>0,projectFloor,floorPolygon,requestFrame:()=>1,cancelFrame:()=>{}});
    const person=container.children.find(node=>node.className==='best-people-layer').children[0];
    assert.deepEqual(calls,[[6,4,14,8]]);near(parseFloat(person.style.left),79.2);near(parseFloat(person.style.top),18);
    Object.assign(state.game.custs[0],at(7,4));people.update(100);for(let time=116;time<2100;time+=16)people.update(time);
    assert.ok(Math.abs(calls.at(-1)[0]-7)<.00001);near(parseFloat(person.style.left),80.4);near(parseFloat(person.style.top),18);assert.doesNotMatch(person.className,/is-repositioning/);
    assert.equal(person.style.zIndex,'190');people.dispose();assert.equal(container.children.length,0);
  }finally{globalThis.document=originalDocument;}
});

class VisitorElement{
  constructor(tag){this.tag=tag;this.children=[];this.parent=null;this.attrs={};this.style={values:{},setProperty:(name,value)=>{this.style.values[name]=value;}};}
  setAttribute(name,value){this.attrs[name]=String(value);}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  remove(){if(this.parent){const at=this.parent.children.indexOf(this);if(at>=0)this.parent.children.splice(at,1);}this.parent=null;}
}
const visitor=(id,profileId)=>({id,visitorProfileId:profileId,kind:'customer',col:6,row:4,scale:1,age:'adulto',gender:'m',heading:0,walking:true});
function withVisitorLayer(actors,run,lookup=visitorProfileById){
  const originalDocument=globalThis.document,container=new VisitorElement('scene'),cancelled=[];
  globalThis.document={hidden:false,createElement:tag=>new VisitorElement(tag)};
  const scene={cols:14,rows:8,actors,hardness:{blocked:[]},source:'xtanco-running-game'};
  const create=layerFactory(()=>()=>scene,lookup);
  const people=create({container,getState:()=>({}),now:()=>0,requestFrame:()=>1,cancelFrame:id=>cancelled.push(id)});
  const layer=container.children.find(node=>node.className==='best-people-layer'),status=container.children.find(node=>node.className==='best-people-status');
  try{return run({scene,container,people,layer,status,cancelled});}
  finally{people.dispose();globalThis.document=originalDocument;}
}
function finishImage(image){image.naturalWidth=1536;image.naturalHeight=1536;image.onload?.();}

test('Matrix shows all 24 shared profiles as independent atlas cells without adding simulated actors',()=>{
  const ids=['a','b','c','d'].flatMap(prefix=>Array.from({length:6},(_,index)=>`${prefix}${index+1}`));
  const actors=ids.map((id,index)=>visitor(`customer-${index}`,id)),before=JSON.stringify(actors);
  withVisitorLayer(actors,({people,layer,status})=>{
    assert.equal(people.count,24);assert.equal(layer.children.length,24);
    for(let index=0;index<24;index++){
      const node=layer.children[index],image=imagesUnder(node)[0],profile=visitorProfileById(ids[index]);
      assert.equal(node.attrs['data-visitor-profile-id'],ids[index]);
      assert.equal(image.src,profile.sprite.atlas);
      const [x,y,width,height]=profile.sprite.crop;
      assert.equal(image.style.width,`${profile.sprite.atlasWidth/width*100}%`);assert.equal(image.style.height,`${profile.sprite.atlasHeight/height*100}%`);
      assert.equal(image.style.left,`${-x/width*100}%`);assert.equal(image.style.top,`${-y/height*100}%`);
      finishImage(image);
      assert.equal(image.parent.style.values['--visitor-cell-aspect'],String(width/height));
      assert.equal(node.attrs['data-visitor-image-state'],'ready');
    }
    assert.match(status.textContent,/24 clientes simulados · 24 perfiles distintos/);
    assert.equal(status.attrs['data-distinct-profiles'],'24');
    assert.equal(new Set(layer.children.map(node=>node.style.values['--visitor-walk-phase'])).size,24);
    const phases=layer.children.map(node=>parseFloat(node.style.values['--visitor-walk-phase']));
    assert.ok(Math.max(...phases)-Math.min(...phases)>.75);
    assert.ok(new Set(layer.children.map(node=>node.style.values['--visitor-walk-duration'])).size>1);
    assert.equal(JSON.stringify(actors),before);
  });
});

test('grid-only atlases still clip exactly one cell and malformed contour metadata falls back to the grid',()=>{
  for(const crop of [undefined,[-1,0,200,480],[0,0,200,1025],[0,0,NaN,480],[0,0,0,480]]){
    const profile={...visitorProfileById('b5'),sprite:{...visitorProfileById('b5').sprite,crop}};
    withVisitorLayer([visitor('grid','b5')],({layer})=>{
      const image=imagesUnder(layer.children[0])[0];
      assert.equal(image.style.width,'300%');assert.equal(image.style.height,'200%');
      assert.equal(image.style.left,'-100%');assert.equal(image.style.top,'-100%');
      finishImage(image);assert.equal(image.parent.style.values['--visitor-cell-aspect'],String(2/3));
    },()=>profile);
  }
});

test('an atlas error falls back only that visitor, reports the actual variety and does not reload the failure every frame',()=>{
  const actors=[visitor('one','a1'),visitor('two','a2')];
  withVisitorLayer(actors,({people,layer,status})=>{
    const first=layer.children[0],second=layer.children[1],image=imagesUnder(first)[0],otherImage=imagesUnder(second)[0];
    finishImage(otherImage);
    image.onerror();
    assert.match(image.src,/best-person-male-rust-20260915\.png$/);
    assert.equal(first.attrs['data-visitor-image-state'],'fallback-loading');
    assert.equal(first.attrs['data-visitor-requested-profile-id'],'a1');
    assert.match(first.attrs['data-visitor-profile-id'],/^legacy:/);
    assert.equal(image.style.width,'100%');assert.equal(image.style.height,'100%');assert.equal(image.style.left,'0');
    finishImage(image);people.update();
    assert.equal(imagesUnder(first)[0],image);assert.equal(first.attrs['data-visitor-image-state'],'fallback');
    assert.equal(second.attrs['data-visitor-profile-id'],'a2');
    assert.match(status.textContent,/2 perfiles distintos · 1 con imagen de reserva/);
    assert.equal(status.attrs['data-fallback-count'],'1');
    // A missing legacy image remains a visible status failure, never a false
    // successful atlas count or an infinite onerror loop.
    image.onerror();assert.equal(image.onerror instanceof Function,true);
    assert.match(status.textContent,/1 perfil distinto · 1 sin imagen/);
    assert.equal(first.attrs['data-visitor-image-state'],'failed');
  });
});

test('reusing an actor identity updates its appearance in place and ignores late callbacks from the previous atlas',()=>{
  const actor=visitor('persistent','a1');
  withVisitorLayer([actor],({people,layer,status})=>{
    const node=layer.children[0],previousImage=imagesUnder(node)[0],lateLoad=previousImage.onload,lateError=previousImage.onerror;
    Object.assign(actor,{visitorProfileId:'c6',age:'nino',scale:.72,gender:'f',heading:Math.PI});people.update();
    const currentImage=imagesUnder(node)[0];
    assert.equal(layer.children[0],node);assert.notEqual(currentImage,previousImage);
    assert.equal(previousImage.onload,null);assert.equal(previousImage.onerror,null);assert.equal(previousImage.parent.parent,null);
    assert.equal(node.attrs['data-visitor-profile-id'],'c6');assert.match(node.className,/is-child/);
    assert.ok(Math.abs(Number(node.style.values['--person-scale-x']))>0);
    lateLoad();lateError();
    assert.equal(node.attrs['data-visitor-profile-id'],'c6');assert.equal(currentImage.src,visitorProfileById('c6').sprite.atlas);
    finishImage(currentImage);assert.match(status.textContent,/1 perfil distinto/);
  });
});

test('unknown and malformed profile cells retain the correct legacy child image',()=>{
  const actor={...visitor('child','missing'),age:'nino',scale:.72,gender:'f'};
  for(const lookup of [()=>null,()=>({id:'broken',sprite:{atlas:'atlas.png',column:3,row:0,columns:3,rows:2}})]){
    withVisitorLayer([actor],({layer,status})=>{
      const node=layer.children[0],image=imagesUnder(node)[0];
      assert.match(image.src,/best-person-child-ochre-20260915\.png$/);assert.equal(image.className,'best-person-sprite');
      finishImage(image);assert.match(status.textContent,/1 perfil distinto · 1 con imagen de reserva/);
    },lookup);
  }
});

test('Matrix treats nino and child as equivalent silhouettes, scales and fallback cutouts',()=>{
  // Scale 1 deliberately isolates the age alias from the secondary scale<.8
  // check; the shared snapshot normally supplies .72 for either child alias.
  const actor={...visitor('child','missing'),age:'nino',scale:1,gender:'f'};
  withVisitorLayer([actor],({people,layer})=>{
    const node=layer.children[0],image=imagesUnder(node)[0],scale=node.style.values['--person-scale'];
    actor.age='child';people.update();
    assert.match(node.className,/is-child/);assert.equal(node.style.values['--person-scale'],scale);
    assert.equal(imagesUnder(node)[0],image);assert.match(image.src,/best-person-child-ochre-20260915\.png$/);
  },()=>null);
});

test('removal and disposal release all atlas callbacks and late image events cannot resurrect visitor status',()=>{
  withVisitorLayer([visitor('one','a1'),visitor('two','b1')],({scene,people,layer,status,container,cancelled})=>{
    const removedImage=imagesUnder(layer.children[0])[0],lateRemovedLoad=removedImage.onload;
    scene.actors.splice(0,1);people.update();
    assert.equal(people.count,1);assert.equal(removedImage.onload,null);assert.equal(removedImage.onerror,null);
    lateRemovedLoad();assert.match(status.textContent,/1 cliente simulado/);
    const image=imagesUnder(layer.children[0])[0],lateLoad=image.onload,lateError=image.onerror;
    people.dispose();const disposedStatus=status.textContent;
    assert.equal(people.count,0);assert.equal(image.onload,null);assert.equal(image.onerror,null);
    assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
    lateLoad();lateError();people.update();people.dispose();
    assert.equal(status.textContent,disposedStatus);assert.equal(container.children.length,0);assert.equal(cancelled.length,1);
  });
});


test('Matrix follows each safe leg around a counter at render rate, keeps a body margin and stops its gait on arrival',()=>{
  const originalDocument=globalThis.document,container=new VisitorElement('scene');let callback;
  globalThis.document={hidden:false,createElement:tag=>new VisitorElement(tag)};
  const actor={...visitor('walker','a1'),col:2,row:4},scene={cols:14,rows:8,actors:[actor],layout:[{id:'counter',type:'custom',col:5,row:3,fp:[2,2]}],hardness:{blocked:[]}};
  const sourceBefore=JSON.stringify(scene),navigation=buildCustomerNavigation(scene),create=layerFactory(()=>()=>scene,visitorProfileById);
  const people=create({container,getState:()=>({}),now:()=>0,requestFrame:fn=>(callback=fn,1),cancelFrame:()=>{}});
  try{
    const node=container.children.find(n=>n.className==='best-people-layer').children[0];
    const coordinate=()=>({col:Number(node.attrs['data-visitor-col']),row:Number(node.attrs['data-visitor-row'])});
    let previous=coordinate(),detoured=false,samples=0;
    actor.col=10;actor.walking=false;people.update(100);
    const targetBefore=JSON.stringify(scene);
    for(let time=116;time<5000;time+=16){
      callback(time);const current=coordinate();
      assert.equal(navigation.isWalkable(current),true);
      assert.equal(navigation.segmentClear(previous,current),true,`unsafe rendered segment at ${time}ms`);
      const projected=projectBestFloor(current.col,current.row,scene.cols,scene.rows);
      assert.equal(parseFloat(node.style.left),projected.x*100,'CSS must preserve the navigation clearance');
      assert.equal(parseFloat(node.style.top),projected.y*100,'CSS must preserve the navigation clearance');
      assert.ok(Math.hypot(current.col-previous.col,current.row-previous.row)<.13,'no corner-to-corner teleport');
      if(current.row<2.76||current.row>5.24)detoured=true;
      assert.doesNotMatch(node.className,/is-repositioning/);previous=current;samples++;
    }
    assert.ok(samples>250);assert.equal(detoured,true);assert.ok(Math.hypot(previous.col-10,previous.row-4)<.01);
    assert.equal(node.attrs['data-visitor-motion'],'standing');assert.equal(node.style.values['--visitor-bob'],'0%');
    assert.equal(JSON.stringify(scene),targetBefore);assert.notEqual(targetBefore,sourceBefore);
  }finally{people.dispose();globalThis.document=originalDocument;}
});

test('Matrix waits on its own side of an impassable obstacle instead of jumping to the target',()=>{
  const originalDocument=globalThis.document,container=new VisitorElement('scene');let callback;
  globalThis.document={hidden:false,createElement:tag=>new VisitorElement(tag)};
  const actor={...visitor('waiting','b1'),col:2,row:4},scene={cols:14,rows:8,actors:[actor],layout:[{id:'wall',type:'custom',col:5,row:0,fp:[1,8]}]};
  const create=layerFactory(()=>()=>scene,visitorProfileById),people=create({container,getState:()=>({}),now:()=>0,requestFrame:fn=>(callback=fn,1),cancelFrame:()=>{}});
  try{
    const node=container.children.find(n=>n.className==='best-people-layer').children[0];
    actor.col=10;people.update(100);
    for(let time=116;time<1200;time+=16)callback(time);
    assert.equal(Number(node.attrs['data-visitor-col']),2);assert.equal(Number(node.attrs['data-visitor-row']),4);
    assert.equal(node.attrs['data-visitor-motion'],'waiting');assert.doesNotMatch(node.className,/is-walking/);
    assert.equal(node.style.values['--visitor-bob'],'0%');
  }finally{people.dispose();globalThis.document=originalDocument;}
});


test('Matrix retains a navigation graph while geometry is unchanged and invalidates it on inventory edits',()=>{
  const originalDocument=globalThis.document,container=new VisitorElement('scene'),seen=[];
  globalThis.document={hidden:false,createElement:tag=>new VisitorElement(tag)};
  const actor={...visitor('cached','a1'),col:2,row:4},scene={cols:14,rows:8,actors:[actor],layout:[]};
  const motionFactory=(actor,options)=>{
    seen.push(options.navigation);const actual=createCustomerMotion(actor,options);
    return {advance:time=>actual.advance(time),update:(actor,options)=>{seen.push(options.navigation);return actual.update(actor,options);}};
  };
  const create=layerFactory(()=>()=>scene,visitorProfileById,buildCustomerNavigation,motionFactory);
  const people=create({container,getState:()=>({}),now:()=>0,requestFrame:()=>1,cancelFrame:()=>{}});
  try{
    people.update(100);people.update(200);assert.equal(seen.length,3);assert.equal(new Set(seen).size,1);
    scene.layout.push({id:'counter',type:'counter',col:5,row:3,fp:[1,2]});people.update(300);
    assert.notEqual(seen[3],seen[0]);people.update(400);assert.equal(seen[4],seen[3]);
  }finally{people.dispose();globalThis.document=originalDocument;}
});


test('Matrix resumes a hidden tab at its previous pose and releases the visibility listener on disposal',()=>{
  const originalDocument=globalThis.document,container=new VisitorElement('scene'),listeners=new Map();let callback,time=0;
  globalThis.document={hidden:false,createElement:tag=>new VisitorElement(tag),addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{assert.equal(listeners.get(name),fn);listeners.delete(name);}};
  const actor={...visitor('resumed','a1'),col:2,row:4},scene={cols:14,rows:8,actors:[actor],layout:[]};
  const create=layerFactory(()=>()=>scene,visitorProfileById),people=create({container,getState:()=>({}),now:()=>time,requestFrame:fn=>(callback=fn,1),cancelFrame:()=>{}});
  try{
    const node=container.children.find(n=>n.className==='best-people-layer').children[0],coordinate=()=>Number(node.attrs['data-visitor-col']);
    actor.col=10;time=100;people.update(time);time=116;callback(time);const before=coordinate();
    document.hidden=true;listeners.get('visibilitychange')();time=60000;callback(time);assert.equal(coordinate(),before);
    document.hidden=false;listeners.get('visibilitychange')();callback(time);assert.equal(coordinate(),before);
    time+=16;callback(time);assert.ok(coordinate()>before);assert.ok(coordinate()-before<.03);
    people.dispose();assert.equal(listeners.size,0);
  }finally{people.dispose();globalThis.document=originalDocument;}
});
