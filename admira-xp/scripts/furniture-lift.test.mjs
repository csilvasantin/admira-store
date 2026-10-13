import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LIFT_STEP,LIFT_HEIGHT,DRAG_SLOP,footprintAt,poseAtCentre,findLanding,liftFrame,mountFurnitureLift} from './furniture-lift.mjs';
import {validateFurniturePlacement,sameFurniturePose} from './distribuit.mjs';
import {furnitureBounds,hangsOnWall,standsOnFloor,isWallFurniture} from './furniture-geometry.mjs';
import {projectMatrixFloor,unprojectMatrixFloor} from './matrix-floor.mjs';

const close=(actual,expected,eps=1e-9)=>assert.ok(Math.abs(actual-expected)<eps,`${actual} != ${expected}`);
const plant={id:'plant',type:'plant',col:1,row:1,rot:0,sx:1,sy:1,label:'Planta'};
const counter={id:'counter',type:'counter',col:6,row:2,rot:0,sx:1,sy:1,label:'Mostrador'};
const room=(layout,extra={})=>({roomId:'room',active:true,cols:14,rows:8,layout,footprints:{},hardness:{fixed:[]},...extra});

test('the floor under the pointer is the exact inverse of the room projection, inside and beyond the walls',()=>{
  for(const [col,row] of [[0,0],[14,8],[7,4],[3.25,6.75],[13.5,.25],[.1,7.9]]){
    const p=projectMatrixFloor(col,row),back=unprojectMatrixFloor(p.x,p.y);
    close(back.col,col,1e-9);close(back.row,row,1e-9);
  }
  const scaled=projectMatrixFloor(10,4,20,10),inverse=unprojectMatrixFloor(scaled.x,scaled.y,20,10);close(inverse.col,10);close(inverse.row,4);
  // A pointer past a wall still pulls towards it: the result is not clamped.
  const outside=unprojectMatrixFloor(.99,.5);assert.ok(outside.col>10&&outside.row<1,JSON.stringify(outside));
  assert.ok(unprojectMatrixFloor(.02,.9).row>8);
});

test('a footprint turns around its own origin and a piece is centred where the hand is, never outside the room',()=>{
  const box=footprintAt(counter,0,{});assert.deepEqual([box.cols,box.rows,box.col,box.row],[1,2,.5,1]);
  const turned=footprintAt(counter,1,{});close(turned.cols,2);close(turned.rows,1);
  assert.deepEqual(footprintAt(counter,5,{}),turned);assert.deepEqual(footprintAt(counter,-3,{}),turned);
  const scene=room([counter]);
  for(const rot of [0,1,2,3]){
    const pose=poseAtCentre(counter,{col:7,row:4},rot,scene),bounds=furnitureBounds({...counter,...pose},{});
    close((bounds.minCol+bounds.maxCol)/2,7);close((bounds.minRow+bounds.maxRow)/2,4);assert.equal(pose.rot,rot);
  }
  for(const centre of [{col:-9,row:-9},{col:99,row:99},{col:-1,row:4},{col:7,row:20}])for(const rot of [0,1,2,3]){
    const pose=poseAtCentre(counter,centre,rot,scene),bounds=furnitureBounds({...counter,...pose},{});
    assert.ok(bounds.minCol>=-1e-9&&bounds.minRow>=-1e-9&&bounds.maxCol<=14+1e-9&&bounds.maxRow<=8+1e-9,JSON.stringify({centre,rot,bounds}));
  }
  const wide=poseAtCentre({...counter,sx:2},{col:0,row:0},0,scene);close(wide.centre.col,1);close(wide.centre.row,2);
});

test('a lifted piece lands on the nearest quarter tile, or on the closest free one within reach',()=>{
  const scene=room([plant,counter]),from={col:1,row:1,rot:0,sx:1,sy:1};
  const free=findLanding(scene,'plant',{col:3.1,row:4.38,rot:0},{from});
  assert.equal(free.ok,true);assert.equal(free.nudged,false);assert.deepEqual(free.target,{col:3,row:4.5,rot:0});assert.deepEqual([free.position.col,free.position.row],[3,4.5]);
  // On top of the counter (6..7 × 2..4): the nearest free tile wins, a quarter step at a time.
  const magnet=findLanding(scene,'plant',{col:6.1,row:2.1,rot:0},{from});
  assert.equal(magnet.ok,true);assert.equal(magnet.nudged,true);
  assert.equal(validateFurniturePlacement(scene,'plant',magnet.target,{from}).ok,true);
  assert.ok(Math.hypot(magnet.target.col-6.1,magnet.target.row-2.1)<=1);
  for(const value of [magnet.target.col,magnet.target.row])close(value/LIFT_STEP,Math.round(value/LIFT_STEP));
  // The closest one: nothing free is nearer than the chosen tile.
  const distance=Math.hypot(magnet.target.col-6.1,magnet.target.row-2.1);
  for(let col=4;col<=8;col+=LIFT_STEP)for(let row=0;row<=5;row+=LIFT_STEP){
    if(Math.hypot(col-6.1,row-2.1)<distance-1e-9)assert.equal(validateFurniturePlacement(scene,'plant',{col,row,rot:0},{from}).ok,false,`${col},${row}`);
  }
  // No room within reach: the answer says why and which piece is in the way.
  const wall=room([plant,{id:'block',type:'custom',fp:[6,6],col:4,row:1,label:'Isla'}]);
  const blocked=findLanding(wall,'plant',{col:6.5,row:3.5,rot:0},{from});
  assert.equal(blocked.ok,false);assert.equal(blocked.reason,'occupied');assert.equal(blocked.obstacle,'block');assert.equal(blocked.nudged,false);assert.deepEqual(blocked.target,{col:6.5,row:3.5,rot:0});
  assert.equal(findLanding(wall,'plant',{col:6.5,row:3.5,rot:0},{from,reach:4}).ok,true);
  // A fixed piece is never searched for.
  assert.equal(findLanding(room([{...plant,locked:true}]),'plant',{col:3,row:3,rot:0},{from}).reason,'fixed');
  assert.equal(findLanding(scene,'ghost',{col:3,row:3,rot:0}).reason,'missing');
});

test('landing validates only the destination: move and turn together, walls and locked pieces stay, the totem stands',()=>{
  const scene=room([plant,counter,{id:'led',type:'led',col:0,row:0},{id:'mupi',type:'metahuman',mount:'wall',col:9,row:5},{id:'tablet',type:'tablet',mount:'wall',col:12,row:6},{id:'rug',type:'rug',col:3,row:5}]);
  const both=validateFurniturePlacement(scene,'counter',{col:9,row:1,rot:1});assert.equal(both.ok,true);assert.deepEqual(both.position,{col:9,row:1,rot:1,sx:1,sy:1});
  assert.equal(validateFurniturePlacement(scene,'counter',{col:9,row:1,rot:5}).position.rot,1);assert.equal(validateFurniturePlacement(scene,'counter',{col:9,row:1,rot:-1}).position.rot,3);
  assert.equal(validateFurniturePlacement(scene,'counter',{col:9,row:1,rot:.5}).reason,'invalid');assert.equal(validateFurniturePlacement(scene,'counter',{col:NaN,row:1}).reason,'invalid');
  assert.equal(validateFurniturePlacement(scene,'counter',null).reason,'invalid');
  // Carried over the plant that a push along the floor would hit.
  assert.equal(validateFurniturePlacement(room([plant,{...counter,col:0,row:0}]),'counter',{col:4,row:0}).ok,true);
  assert.equal(validateFurniturePlacement(scene,'counter',{col:13.5,row:2}).reason,'bounds');assert.equal(validateFurniturePlacement(scene,'counter',{col:1,row:0}).reason,'occupied');
  assert.equal(validateFurniturePlacement(scene,'led',{col:2,row:0}).reason,'fixed');assert.equal(validateFurniturePlacement(room([{...plant,locked:true}]),'plant',{col:3,row:3}).reason,'fixed');
  // The Creator catalog lists the Mupi and the tablet as wall-mounted; here they stand, move and occupy.
  for(const item of scene.layout.filter(item=>['mupi','tablet'].includes(item.id))){assert.equal(isWallFurniture(item),true);assert.equal(hangsOnWall(item),false);assert.equal(standsOnFloor(item),true);}
  assert.equal(validateFurniturePlacement(scene,'mupi',{col:3,row:2}).ok,true);
  const onTotem=validateFurniturePlacement(scene,'plant',{col:9,row:5});assert.equal(onTotem.reason,'occupied');assert.equal(onTotem.obstacle,'mupi');
  assert.equal(hangsOnWall({type:'custom',mount:'wall'}),true);assert.equal(hangsOnWall({type:'aroma'}),true);assert.equal(standsOnFloor({type:'rug'}),false);assert.equal(standsOnFloor(null),false);
  // Rugs and wall pieces never block a landing; fixed architecture does.
  assert.equal(validateFurniturePlacement(scene,'plant',{col:3,row:5}).ok,true);assert.equal(validateFurniturePlacement(scene,'plant',{col:0,row:0}).ok,true);
  const pillar=validateFurniturePlacement(room([plant],{hardness:{fixed:['5,5']}}),'plant',{col:4.5,row:4.5});assert.equal(pillar.reason,'occupied');assert.equal(pillar.obstacle,'hardness:5,5');
  const before=JSON.stringify(scene);validateFurniturePlacement(scene,'counter',{col:9,row:1,rot:1});assert.equal(JSON.stringify(scene),before);
});

test('in the hand a piece rises with a small overshoot, leans against its motion, and settles with one squash',()=>{
  const held={phase:'held',started:1000,base:0,from:{x:0,y:0},tilt:-3,turned:0};
  close(liftFrame(held,1000).lift,0);
  const mid=liftFrame(held,1095),top=liftFrame(held,1190);
  assert.ok(mid.lift>.5&&top.lift>.99&&top.lift<1.04);assert.equal(mid.front,true);assert.equal(mid.state,'held');assert.equal(mid.tilt,-3);assert.equal(mid.done,false);
  assert.ok(Math.max(...Array.from({length:40},(_,i)=>liftFrame(held,1000+i*5).lift))>1,'the rise overshoots before it rests');
  for(const now of [1500,3000,9000]){const frame=liftFrame(held,now);assert.ok(Math.abs(frame.lift-1)<=.031);assert.ok(frame.sx>1&&frame.sx===frame.sy,'closer to the eye, never deformed');}
  assert.equal(liftFrame({...held,calm:true},3000).lift,1);assert.equal(liftFrame({...held,calm:true},3000).tilt,0);
  // A quarter turn in the air narrows the picture for an instant and is over in a moment.
  const turning=liftFrame({...held,turned:2000},2085);assert.ok(turning.sx<turning.sy*.9);assert.equal(liftFrame({...held,turned:2000},2400).sx,liftFrame(held,2400).sx);
  const settling={phase:'settling',started:5000,base:1,from:{x:40,y:-20},tilt:4,turned:0};
  const start=liftFrame(settling,5000);close(start.lift,1);close(start.x,40);close(start.y,-20);assert.equal(start.state,'settling');assert.equal(start.front,true);
  let previous=start;
  for(let now=5010;now<=5220;now+=10){const frame=liftFrame(settling,now);assert.ok(frame.lift<=previous.lift+1e-9&&Math.abs(frame.x)<=Math.abs(previous.x)+1e-9);previous=frame;}
  const landed=liftFrame(settling,5225);close(landed.lift,0,1e-6);close(landed.x,0,1e-6);close(landed.y,0,1e-6);close(landed.tilt,0,1e-6);
  const squash=liftFrame(settling,5262);assert.ok(squash.sy<1&&squash.sx>1);assert.equal(squash.front,false,'on the floor it sorts with the room again');assert.equal(squash.done,false);
  const end=liftFrame(settling,5300);assert.equal(end.done,true);close(end.sx,1);close(end.sy,1);close(end.lift,0,1e-6);
  // A hop (keyboard, turn, undo) leaves the floor and returns in the same gesture.
  const hop={phase:'hop',started:0,base:0,from:{x:-60,y:30},tilt:0,turned:0};
  close(liftFrame(hop,0).lift,0);assert.ok(liftFrame(hop,140).lift>.5);close(liftFrame(hop,0).x,-60);assert.equal(liftFrame(hop,380).done,true);close(liftFrame(hop,380).x,0,1e-6);
});

// ── The hand over a minimal page ────────────────────────────────────────────────────────────────
class Node{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.dataset={};this.style={};this.listeners={};this.hidden=false;this.textContent='';const names=new Set();
    this.classList={add:name=>names.add(name),remove:name=>names.delete(name),contains:name=>names.has(name),toggle:(name,on)=>{(on===undefined?!names.has(name):on)?names.add(name):names.delete(name);}};}
  setAttribute(name,value){this.attrs[name]=String(value);}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;}
  addEventListener(type,listener,options){(this.listeners[type]??=[]).push(listener);options?.signal?.addEventListener('abort',()=>{this.listeners[type]=this.listeners[type].filter(fn=>fn!==listener);});}
  emit(type,event={}){for(const listener of [...(this.listeners[type]||[])])listener(event);}
  getBoundingClientRect(){return {left:0,top:0,right:1000,bottom:600,width:1000,height:600};}
  get clientWidth(){return 1000;}get clientHeight(){return 600;}get offsetWidth(){return 120;}get offsetHeight(){return 30;}
  setPointerCapture(id){this.captured=id;}releasePointerCapture(){this.captured=null;}closest(){return null;}
}
function stage(layout,{lang='es'}={}){
  let now=1000,timers=[];
  const container=new Node('scene'),keys=new Node('window');
  const win={performance:{now:()=>now},setTimeout:(fn,ms)=>{timers.push({fn,at:now+ms});return timers.length;},clearTimeout:id=>{if(timers[id-1])timers[id-1].fn=()=>{};},addEventListener:(type,fn,options)=>keys.addEventListener(type,fn,options),matchMedia:()=>({matches:false})};
  const doc={createElement:tag=>new Node(tag),createElementNS:(_,tag)=>new Node(tag),documentElement:{lang}};
  const state={layout:layout.map(item=>({...item})),begun:0,ended:0,placed:[],fail:null};
  const bridge={
    read(){return room(state.layout.map(item=>({...item})));},
    begin(){state.begun++;return {n:state.begun};},end(token){if(token)state.ended++;},
    async place({roomId,id,from,col,row,rot}){
      if(state.fail)throw Error(state.fail);
      const scene=this.read(),item=scene.layout.find(value=>value.id===id);
      if(roomId!=='room'||!item||!sameFurniturePose(item,from))throw Error('changed');
      const result=validateFurniturePlacement(scene,id,{col,row,rot},{from});if(!result.ok)throw Error(result.reason);
      state.layout=state.layout.map(value=>value.id===id?{...value,...result.position}:value);state.placed.push({id,...result.position});return {ok:true,...result.position};
    }
  };
  const changes=[];let lift;
  const furniture={picked:null,updates:0,scene:null,views:{},pick(){return this.picked;},
    piece(id){const item=state.layout.find(value=>value.id===id);return item?{id,node:new Node('button'),placement:{number:7,label:item.label||item.type},rect:{left:100,right:180,top:120,bottom:260}}:null;},
    update(){this.updates++;const scene={cols:14,rows:8,layout:state.layout.map(item=>({...item}))};this.scene=lift.decorate(scene);this.views=Object.fromEntries(this.scene.layout.map(item=>[item.id,lift.present({id:String(item.id)})]));}};
  lift=mountFurnitureLift({container,furniture,bridge,win,doc,onChange:value=>changes.push(value)});
  const at=(col,row)=>{const p=projectMatrixFloor(col,row);return {clientX:p.x*1000,clientY:p.y*600};};
  const pointer=(type,point,extra={})=>container.emit(type,{type,isPrimary:true,pointerType:'mouse',button:0,buttons:['pointerup','pointercancel'].includes(type)?0:1,pointerId:1,target:{closest:()=>null},preventDefault(){},stopPropagation(){},...point,...extra});
  return {container,keys,furniture,bridge,state,changes,lift,at,pointer,
    get toast(){return container.children.find(node=>node.className==='furniture-lift-toast');},get bar(){return container.children.find(node=>node.className==='furniture-lift-bar');},
    get ghost(){return container.children.find(node=>node.attrs.class==='furniture-lift-floor').children.find(node=>node.attrs.class==='lift-ghost');},
    item:id=>state.layout.find(item=>item.id===id),drawn:id=>furniture.scene.layout.find(item=>item.id===id),
    tick(ms=16){now+=ms;for(const timer of timers.splice(0).filter(timer=>timer.at>now?(timers.push(timer),false):true))timer.fn();furniture.update();},
    key(key,extra={}){let stopped=false;const event={key,target:{closest:()=>null},preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){stopped=true;},...extra};keys.emit('keydown',event);return stopped;},
    // Take a piece by the centre of its footprint and carry it over the centre of another floor point.
    grab(id){const item=this.item(id),box=footprintAt(item,item.rot||0,{});furniture.picked=id;const from=at(item.col+box.col,item.row+box.row);pointer('pointerdown',from);pointer('pointermove',{clientX:from.clientX+DRAG_SLOP+1,clientY:from.clientY});pointer('pointermove',from);},
    carry(col,row){pointer('pointermove',at(col,row));this.tick();},
    async drop(){pointer('pointerup',{});await new Promise(resolve=>setImmediate(resolve));this.tick();}};
}

test('a piece is taken, carried over the others and set down: only the landing is saved, and the edit is closed',async()=>{
  const h=stage([plant,counter]);
  h.furniture.picked='plant';const origin=h.at(1.5,1.5);
  h.pointer('pointerdown',origin);assert.equal(h.lift.state().holding,null);assert.equal(h.state.begun,0,'a press is not yet an edit');
  h.pointer('pointermove',{clientX:origin.clientX+2,clientY:origin.clientY});assert.equal(h.lift.state().holding,null,'inside the slop it is still a click');
  h.pointer('pointermove',{clientX:origin.clientX+DRAG_SLOP+1,clientY:origin.clientY});
  assert.equal(h.lift.state().holding,'plant');assert.equal(h.state.begun,1);assert.equal(h.container.captured,1);assert.equal(h.container.dataset.liftCursor,'grabbing');assert.equal(h.lift.live(),true);
  assert.match(h.toast.textContent,/Arrastra para levantarla/);
  // Over the counter and beyond: the picture follows the hand continuously while nothing is saved.
  h.carry(6.5,3);assert.equal(h.state.placed.length,0);assert.deepEqual([h.item('plant').col,h.item('plant').row],[1,1]);
  h.carry(10.13,5.38);
  close(h.drawn('plant').col,9.63,1e-6);close(h.drawn('plant').row,4.88,1e-6);
  assert.deepEqual(h.lift.state().landing,{ok:true,reason:'',nudged:false,col:9.75,row:5,rot:0});
  h.tick(300);const view=h.furniture.views.plant;
  assert.equal(view.state,'held');assert.equal(view.pose.front,true);assert.ok(view.pose.y<-600*LIFT_HEIGHT*.9&&view.pose.lift>.95,'raised off the floor');assert.equal(view.pose.floorY,0,'its shadow stays on the floor');
  assert.equal(h.ghost.dataset.valid,'1');assert.ok(h.ghost.attrs.points.split(' ').length===4);
  await h.drop();
  assert.deepEqual(h.state.placed,[{id:'plant',col:9.75,row:5,rot:0,sx:1,sy:1}]);assert.equal(h.lift.state().canUndo,true);assert.match(h.toast.textContent,/Planta · colocada/);
  // It glides from where it was seen to its tile, then the edit ends and the room owns it again.
  assert.equal(h.furniture.views.plant.state,'settling');assert.deepEqual([h.drawn('plant').col,h.drawn('plant').row],[9.75,5]);assert.equal(h.state.ended,0);
  h.tick(400);h.tick();
  assert.equal(h.lift.state().holding,null);assert.equal(h.lift.live(),false);assert.equal(h.state.ended,1);assert.equal(h.furniture.views.plant.state,'selected');assert.equal(h.container.dataset.liftCursor,'');
  assert.equal(h.container.captured,null);assert.ok(h.changes.length>0);
});

test('an occupied spot pulls to the nearest free tile; with none in reach the piece flies back and nothing is saved',async()=>{
  const h=stage([plant,counter]);h.grab('plant');h.carry(6.5,3);
  const landing=h.lift.state().landing;assert.equal(landing.ok,true);assert.equal(landing.nudged,true);
  await h.drop();assert.equal(h.state.placed.length,1);assert.deepEqual([h.state.placed[0].col,h.state.placed[0].row],[landing.col,landing.row]);
  const island={id:'block',type:'custom',fp:[6,6],col:4,row:1,label:'Isla'},crowded=stage([plant,island]);
  crowded.grab('plant');crowded.carry(7,4);
  assert.equal(crowded.lift.state().landing.ok,false);assert.equal(crowded.ghost.dataset.valid,'0');assert.equal(crowded.furniture.views.block.state,'blocking','the piece in the way is pointed out');
  await crowded.drop();
  assert.equal(crowded.state.placed.length,0);assert.match(crowded.toast.textContent,/Ahí no cabe: choca con 7 · Isla\./);assert.equal(crowded.toast.dataset.tone,'warn');
  assert.deepEqual([crowded.drawn('plant').col,crowded.drawn('plant').row],[1,1]);crowded.tick(400);crowded.tick();
  assert.equal(crowded.state.ended,1);assert.equal(crowded.lift.state().canUndo,false);assert.equal(crowded.furniture.views.block,null);
});

test('R and the wheel turn the piece in the air, Escape cancels, and a failed save returns it with a reason',async()=>{
  const h=stage([plant,counter]);h.grab('counter');h.carry(10,4);
  assert.equal(h.key('r'),true);h.tick();assert.equal(h.lift.state().landing.rot,1);assert.equal(h.drawn('counter').rot,1);
  let prevented=false;h.container.emit('wheel',{deltaY:120,preventDefault(){prevented=true;}});h.tick();assert.equal(prevented,true);assert.equal(h.lift.state().landing.rot,2);
  h.container.emit('wheel',{deltaY:120,preventDefault(){}});h.tick();assert.equal(h.lift.state().landing.rot,2,'one notch of the wheel is one quarter turn');
  assert.equal(h.key('R',{shiftKey:true}),true);h.tick();assert.equal(h.lift.state().landing.rot,1);
  await h.drop();assert.deepEqual(h.state.placed.at(-1),{id:'counter',col:11,row:3.5,rot:1,sx:1,sy:1});
  const bounds=furnitureBounds(h.item('counter'),{});close((bounds.minCol+bounds.maxCol)/2,10);close((bounds.minRow+bounds.maxRow)/2,4);
  h.tick(400);h.tick();
  h.grab('plant');h.carry(4,6);assert.equal(h.key('Escape'),true);h.tick();
  assert.equal(h.state.placed.length,1);assert.deepEqual([h.drawn('plant').col,h.drawn('plant').row],[1,1]);h.tick(400);h.tick();assert.equal(h.state.ended,2);assert.equal(h.lift.state().holding,null);
  h.state.fail='changed';h.grab('plant');h.carry(4,6);await h.drop();
  assert.match(h.toast.textContent,/La pieza ha cambiado/);assert.deepEqual([h.item('plant').col,h.item('plant').row],[1,1]);h.tick(400);h.tick();assert.equal(h.state.ended,3);
  h.state.fail='quota';h.grab('plant');h.carry(4,6);await h.drop();assert.match(h.toast.textContent,/No se ha podido guardar/);h.tick(400);h.tick();assert.equal(h.state.ended,h.state.begun);
  // Typing in a field never moves furniture.
  h.grab('plant');assert.equal(h.key('r',{target:{closest:()=>({})}}),false);h.pointer('pointercancel',{});h.tick(400);h.tick();assert.equal(h.state.ended,h.state.begun);
});

test('pieces on the wall and locked ones refuse the hand without opening an edit; the Mupi can be carried',async()=>{
  const h=stage([plant,{id:'led',type:'led',col:0,row:0,label:'LED Banner'},{id:'safe',type:'custom',fp:[1,1],col:5,row:5,locked:true,label:'Caja fuerte'},{id:'mupi',type:'metahuman',mount:'wall',col:9,row:5,label:'Mupi'}]);
  for(const id of ['led','safe']){
    h.furniture.picked=id;h.pointer('pointerdown',h.at(3,3));h.pointer('pointermove',h.at(4,4));
    assert.equal(h.lift.state().holding,null);assert.equal(h.state.begun,h.state.ended,'the edit it opened is closed at once');
    assert.match(h.toast.textContent,/va fija en la pared o está bloqueada/);assert.equal(h.furniture.views[id].state,'refused');assert.equal(h.lift.state().selected,id);
    h.pointer('pointerup',{});h.tick(500);
  }
  h.tick(500);assert.match(h.bar.children[0].textContent,/Caja fuerte · fija/);assert.equal(h.bar.children[1].hidden,true,'a fixed piece offers no turn');
  h.grab('mupi');h.carry(3,3);await h.drop();assert.deepEqual([h.item('mupi').col,h.item('mupi').row],[2.5,2.5]);
});

test('a click chooses a piece, arrows move it a quarter tile, R turns it in place and undo walks back each step',async()=>{
  const h=stage([plant,counter]);
  h.furniture.picked='plant';h.pointer('pointerdown',h.at(1.5,1.5));h.pointer('pointerup',{});
  assert.equal(h.lift.state().selected,'plant');assert.equal(h.state.begun,0);h.tick();assert.equal(h.furniture.views.plant.state,'selected');
  assert.equal(h.bar.hidden,false);assert.equal(h.bar.children[0].textContent,'7 · Planta');assert.equal(h.bar.children[2].hidden,true,'nothing to undo yet');
  const settle=async()=>{await new Promise(resolve=>setImmediate(resolve));h.tick();h.tick(500);h.tick();};
  assert.equal(h.key('ArrowRight'),true);await settle();assert.deepEqual([h.item('plant').col,h.item('plant').row],[1.25,1]);
  h.key('ArrowDown');await settle();h.key('ArrowLeft');await settle();h.key('ArrowUp');await settle();assert.deepEqual([h.item('plant').col,h.item('plant').row],[1,1]);
  assert.equal(h.state.begun,4);assert.equal(h.state.ended,4);assert.equal(h.bar.children[2].hidden,false);
  // Out of the room: refused with a shake, nothing saved.
  h.key('ArrowUp');await settle();h.key('ArrowUp');await settle();h.key('ArrowUp');await settle();h.key('ArrowUp');await settle();assert.equal(h.item('plant').row,0);
  const saved=h.state.placed.length;h.key('ArrowUp');await settle();assert.equal(h.state.placed.length,saved);assert.match(h.toast.textContent,/Ahí se sale de la sala/);
  // The counter turns about the centre of its footprint.
  h.lift.select('counter');const before=furnitureBounds(h.item('counter'),{});
  h.key('r');await settle();const after=furnitureBounds(h.item('counter'),{});
  assert.equal(h.item('counter').rot,1);close((after.minCol+after.maxCol)/2,(before.minCol+before.maxCol)/2);close((after.minRow+after.maxRow)/2,(before.minRow+before.maxRow)/2);
  assert.equal(h.key('z',{metaKey:true}),true);await settle();assert.equal(h.item('counter').rot,0);assert.deepEqual([h.item('counter').col,h.item('counter').row],[6,2]);assert.match(h.toast.textContent,/Deshecho · 7 · Mostrador/);
  assert.equal(h.key('z',{ctrlKey:true}),true);await settle();assert.equal(h.item('plant').row,.25);
  // A step whose piece was moved elsewhere in the meantime is dropped, never forced.
  h.state.layout=h.state.layout.map(item=>item.id==='plant'?{...item,col:12,row:6}:item);
  assert.equal(await h.lift.undo(),false);assert.match(h.toast.textContent,/La pieza ha cambiado/);assert.deepEqual([h.item('plant').col,h.item('plant').row],[12,6]);
  // Escape lets go of the choice and the keys go back to the game.
  h.lift.select('plant');assert.equal(h.key('Escape'),true);assert.equal(h.lift.state().selected,null);assert.equal(h.key('ArrowLeft'),false);assert.equal(h.key('Escape'),false);
  // A click on empty floor does the same.
  h.lift.select('plant');h.furniture.picked=null;h.pointer('pointerdown',h.at(12,1));assert.equal(h.lift.state().selected,null);
});

test('a press whose release never arrived cannot lift a piece, and a hand that lost its button lets go',async()=>{
  const h=stage([plant,counter]),origin=h.at(1.5,1.5);
  // Ctrl+click on macOS, or a button released over another panel: the scene never sees the pointerup.
  h.furniture.picked='plant';h.pointer('pointerdown',origin);
  h.pointer('pointermove',h.at(6,5),{buttons:0});assert.equal(h.lift.state().holding,null);assert.equal(h.state.begun,0);
  h.pointer('pointermove',h.at(9,5));assert.equal(h.lift.state().holding,null,'the stale press is forgotten, not resumed');assert.equal(h.state.begun,0);
  h.pointer('pointerdown',origin);h.container.emit('contextmenu',{preventDefault(){}});h.pointer('pointermove',h.at(9,5));assert.equal(h.lift.state().holding,null);
  // A finger keeps contact without a mouse button: touch drags are not affected.
  h.pointer('pointerdown',origin,{pointerType:'touch'});h.pointer('pointermove',h.at(4,4),{pointerType:'touch',buttons:0});assert.equal(h.lift.state().holding,'plant');
  h.pointer('pointercancel',{},{pointerType:'touch'});h.tick(400);h.tick();assert.equal(h.state.ended,1);
  // In the air and the button is gone: the piece goes back; nothing is saved by the next click.
  h.grab('plant');h.carry(8,5);assert.equal(h.lift.state().holding,'plant');
  h.pointer('pointermove',h.at(9,5),{buttons:0});h.tick();
  assert.deepEqual([h.drawn('plant').col,h.drawn('plant').row],[1,1]);h.tick(400);h.tick();
  assert.equal(h.lift.state().holding,null);assert.equal(h.state.placed.length,0);assert.equal(h.state.ended,h.state.begun);
  let contextPrevented=false;h.grab('plant');h.container.emit('contextmenu',{preventDefault(){contextPrevented=true;}});assert.equal(contextPrevented,true,'no browser menu over a carried piece');
  h.pointer('pointercancel',{});h.tick(400);h.tick();
});

test('while a piece lands or is being saved, Escape and R stay with the hand and never reach the view',async()=>{
  const h=stage([plant,counter]);
  h.grab('plant');h.carry(4,6);
  // Saving: the bridge has not answered yet.
  h.pointer('pointerup',{});assert.equal(h.lift.state().busy,true);
  assert.equal(h.key('Escape'),true,'consumed: the view under it must not close');assert.equal(h.key('r'),true);assert.equal(h.lift.state().holding,'plant');
  await new Promise(resolve=>setImmediate(resolve));h.tick();
  assert.equal(h.state.placed.length,1,'the drop was not lost');assert.equal(h.furniture.views.plant.state,'settling');
  // Settling.
  assert.equal(h.key('Escape'),true);assert.equal(h.key('R'),true);h.tick(400);h.tick();
  assert.deepEqual([h.item('plant').col,h.item('plant').row,h.item('plant').rot],[3.5,5.5,0]);assert.equal(h.lift.state().selected,'plant');
  // A keyboard hop is the same: Escape waits for the piece to land.
  h.key('ArrowRight');await new Promise(resolve=>setImmediate(resolve));h.tick();assert.equal(h.key('Escape'),true);assert.equal(h.lift.state().selected,'plant');
  h.tick(500);h.tick();assert.equal(h.key('Escape'),true);assert.equal(h.lift.state().selected,null,'at rest, Escape lets go of the piece');
  // Holding R down is one quarter turn, in the air and on the floor.
  h.grab('counter');h.carry(10,4);h.key('r');h.key('r',{repeat:true});h.key('r',{repeat:true});h.tick();assert.equal(h.lift.state().landing.rot,1);
  h.pointer('pointercancel',{});h.tick(400);h.tick();
  h.lift.select('counter');assert.equal(h.key('r',{repeat:true}),true);await new Promise(resolve=>setImmediate(resolve));h.tick(500);h.tick();assert.equal(h.item('counter').rot,0);
});

test('undo waits for the room: a step is kept while the room cannot be read',async()=>{
  const h=stage([plant,counter]),settle=async()=>{await new Promise(resolve=>setImmediate(resolve));h.tick();h.tick(500);h.tick();};
  h.lift.select('plant');h.key('ArrowRight');await settle();h.key('ArrowRight');await settle();assert.equal(h.item('plant').col,1.5);
  const read=h.bridge.read;h.bridge.read=()=>({...read.call(h.bridge),active:false});
  assert.equal(await h.lift.undo(),false);assert.equal(await h.lift.undo(),false);assert.match(h.toast.textContent,/La sala no está lista/);assert.equal(h.lift.state().canUndo,true);
  h.bridge.read=read;
  assert.equal(await h.lift.undo(),true);await settle();assert.equal(await h.lift.undo(),true);await settle();assert.equal(h.item('plant').col,1);assert.equal(h.lift.state().canUndo,false);
  assert.equal(await h.lift.undo(),false);assert.match(h.toast.textContent,/No hay nada que deshacer/);
});

test('disposing in mid air closes the edit, removes every overlay and stops listening',()=>{
  const h=stage([plant,counter]);h.grab('plant');h.carry(5,5);
  assert.equal(h.container.children.length,4);
  h.lift.dispose();h.lift.dispose();
  assert.equal(h.state.ended,1);assert.equal(h.container.children.length,0);assert.equal(h.container.dataset.liftCursor,undefined);assert.equal(h.lift.live(),false);
  const scene={cols:14,rows:8,layout:[{...plant}]};assert.equal(h.lift.decorate(scene),scene);
  assert.equal(h.key('r'),false);h.furniture.picked='counter';h.pointer('pointerdown',h.at(6.5,3));h.pointer('pointermove',h.at(9,5));assert.equal(h.state.begun,1);
  assert.throws(()=>mountFurnitureLift({}),/Falta la escena/);
});

test('every edit that opens is closed exactly once, whatever the moment the view goes away',async()=>{
  for(const moment of ['held','saving','settling','hop']){
    const h=stage([plant,counter]);
    if(moment==='hop'){h.lift.select('plant');h.key('ArrowRight');await new Promise(resolve=>setImmediate(resolve));h.tick();}
    else{h.grab('plant');h.carry(4,6);if(moment!=='held')h.pointer('pointerup',{});if(moment==='settling'){await new Promise(resolve=>setImmediate(resolve));h.tick();}}
    assert.equal(h.state.begun,1,moment);assert.equal(h.state.ended,0,moment);
    h.lift.dispose();await new Promise(resolve=>setImmediate(resolve));h.lift.dispose();
    assert.equal(h.state.ended,1,moment);assert.equal(h.lift.live(),false);
  }
});

test('English copy, and the page bridge validates a landing with the same rule before saving it',async()=>{
  const h=stage([plant,{id:'block',type:'custom',fp:[6,6],col:4,row:1,label:'Island'}],{lang:'en'});
  h.grab('plant');assert.match(h.toast.textContent,/Drag to lift · R turns · Esc cancels/);h.carry(7,4);await h.drop();assert.match(h.toast.textContent,/No room there: it hits 7 · Island\./);
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),start=html.indexOf('  async place({roomId,id,from,col,row,rot,signal}){'),end=html.indexOf('  save(next,ledger=null,visibility=null){',start);
  assert.ok(start>0&&end>start);const body=html.slice(start,end);
  assert.match(body,/validateFurniturePlacement\(scene,id,\{col,row,rot\},\{from\}\)/);assert.match(body,/if\(!result\.ok\)throw Error\(result\.reason\|\|'invalid'\)/);
  assert.match(body,/if\(!scene\.active\|\|scene\.roomId!==roomId\)throw Error\('room'\)/);assert.match(body,/sameFurniturePose\(item,from\)\)throw Error\('changed'\)/);assert.match(body,/this\.save\(next,ledger\)/);
});
