import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Three from './premium-three.mjs';
import {mappedCameraFrame} from './life-camera.mjs';
import {createLifeSnapshot} from './life-snapshot.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const projection={width:800,height:500,ox:270,oy:185,tileW:80,tileH:28};
const snapshot=()=>({cols:14,rows:8,wallHeight:165/(80/Math.SQRT2*Math.sqrt(1-.35**2)),projection:{...projection},layout:[],actors:[]});
function cameraFrom(frame){
  const f=frame.frustum,camera=new Three.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,200);
  camera.position.set(frame.position.x,frame.position.y,frame.position.z);
  camera.lookAt(frame.target.x,frame.target.y,frame.target.z);camera.updateMatrixWorld(true);return camera;
}
function screen(camera,point,width,height){const ndc=new Three.Vector3(...point).project(camera);return {x:(ndc.x+1)*width/2,y:(1-ndc.y)*height/2};}
function expected(point,p,width,height){
  const [col,y,row]=point,k=p.tileW/Math.SQRT2,elevation=Math.asin(p.tileH/p.tileW);
  const scale=Math.min(width/p.width,height/p.height);
  return {x:(width-p.width*scale)/2+(p.ox+(col-row)*p.tileW/2)*scale,
    y:(height-p.height*scale)/2+(p.oy+(col+row)*p.tileH/2-y*k*Math.cos(elevation))*scale};
}

test('mapped orthographic axes reproduce Good toIso including signs, origins and vertical heights',()=>{
  for(const p of [projection,{...projection,tileW:96,tileH:48,ox:315,oy:230},{...projection,tileW:68,tileH:16,ox:190,oy:120}]){
    const s={...snapshot(),projection:p},before=JSON.stringify(s),frame=mappedCameraFrame(s,p.width,p.height),camera=cameraFrom(frame);
    near(frame.angle,Math.PI/4);near(Math.sin(frame.elevation),p.tileH/p.tileW);
    for(const point of [[0,0,0],[1,0,0],[0,0,1],[14,0,8],[3.25,1.7,6.5],[0,s.wallHeight,0]]){
      const actual=screen(camera,point,p.width,p.height),reference=expected(point,p,p.width,p.height);near(actual.x,reference.x);near(actual.y,reference.y);
    }
    assert.equal(JSON.stringify(s),before);
    const origin=screen(camera,[0,0,0],p.width,p.height),col=screen(camera,[1,0,0],p.width,p.height),row=screen(camera,[0,0,1],p.width,p.height);
    assert.ok(col.x>origin.x&&row.x<origin.x&&col.y>origin.y&&row.y>origin.y);
  }
});

test('viewport changes contain the same Good rectangle without changing registration or stretching',()=>{
  for(const [width,height]of [[1280,720],[390,700],[800,500],[2000,400]]){
    const frame=mappedCameraFrame(snapshot(),width,height),camera=cameraFrom(frame);
    assert.equal(frame.registration,'good-canvas-contain');
    for(const point of [[0,0,0],[14,0,0],[0,0,8],[14,0,8],[8,2,2]]){
      const actual=screen(camera,point,width,height),reference=expected(point,projection,width,height);near(actual.x,reference.x);near(actual.y,reference.y);
    }
  }
});

test('the live snapshot preserves Good projection and maps actor anchors without changing game state',()=>{
  const iso={...projection,cols:14,rows:8,wallH:165},col=5.2,row=3.4;
  const input={active:true,iso,projection,game:{staff:[{hired:true,x:iso.ox+(col-row)*iso.tileW/2-7,y:iso.oy+(col+row)*iso.tileH/2-20}],custs:[]}};
  const before=JSON.stringify(input),s=createLifeSnapshot()(input),camera=cameraFrom(mappedCameraFrame(s,800,500)),actor=s.actors[0];
  const actual=screen(camera,[actor.col,0,actor.row],800,500);
  near(actual.x,input.game.staff[0].x+7);near(actual.y,input.game.staff[0].y+20);assert.equal(JSON.stringify(input),before);
  near(screen(camera,[0,s.wallHeight,0],800,500).y,iso.oy-iso.wallH);
});

test('missing projection is explicitly room-fit and never claims exact Canvas registration',()=>{
  const frame=mappedCameraFrame({cols:14,rows:8,elevation:.42});near(frame.elevation,.42);assert.equal(frame.frustum,null);assert.equal(frame.registration,'room-fit');
  for(const value of [undefined,{}, {...projection,tileW:0},{...projection,tileH:80},{...projection,width:0}]){
    const f=mappedCameraFrame({...snapshot(),projection:value});assert.equal(f.frustum,null);assert.equal(f.registration,'room-fit');assert.ok(Number.isFinite(f.elevation));
  }
});

// Real Three camera/math and the shipped event controller; only GPU drawing and
// scene construction are stubbed. There is no browser, media or simulation.
const rendererSource=fs.readFileSync(new URL('./life-renderer.mjs',import.meta.url),'utf8')
  .replace(/^import .*;\n/gm,'').replace('export function createLifeRenderer','function createLifeRenderer');
function harness(options={}){
  const handlers=new Map(),states=[],calls={media:0,animate:0,disposed:0},canvas={clientWidth:800,clientHeight:500,
    addEventListener:(type,handler)=>handlers.set(type,handler),removeEventListener:type=>handlers.delete(type),
    setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:800,height:500})};
  const model={snapshot:snapshot(),scene:new Three.Scene(),world:new Three.Group(),actors:new Three.Group(),
    update(value){this.snapshot=value;},animate(){calls.animate++;},refreshMedia(){calls.media++;},setLighting(){},dispose(){calls.disposed++;}};
  model.scene.add(model.world,model.actors);
  const T={...Three,WebGLRenderer:class{constructor(){this.shadowMap={};}setClearColor(){}setPixelRatio(){}setSize(){}render(scene,camera){calls.camera=camera;}dispose(){}forceContextLoss(){}}};
  const context=vm.createContext({T,createLifeScene:(_,sceneOptions)=>{calls.sceneOptions=sceneOptions;return model;},mappedCameraFrame,performance:{now:()=>0}});
  vm.runInContext(rendererSource,context);
  const viewer=context.createLifeRenderer({canvas,snapshot:model.snapshot,onCameraChange:state=>states.push(state),...options});
  return {viewer,states,calls,model,handlers,emit(type,properties={}){handlers.get(type)({button:0,pointerId:1,clientX:100,clientY:100,preventDefault(){},...properties});}};
}

test('renderer starts mapped, exposes immutable state and instantly restores exact framing after free presets',()=>{
  const h=harness();assert.equal(h.viewer.cameraState.mode,'mapped');assert.equal(h.states[0].mode,'mapped');
  assert.equal(Object.isFrozen(h.viewer.cameraState),true);assert.throws(()=>{h.viewer.cameraState.mode='free';},TypeError);
  assert.equal(Object.getOwnPropertyDescriptor(h.viewer,'cameraState').set,undefined);
  for(const preset of ['home','floor','detail']){
    h.viewer.preset(preset);assert.equal(h.viewer.cameraState.mode,'free');assert.equal(h.viewer.cameraState.registration,'room-fit');
    h.viewer.preset('mapped');h.viewer.render(1000);assert.equal(h.viewer.cameraState.mode,'mapped');
    const actual=screen(h.calls.camera,[4,1.2,3],800,500),reference=expected([4,1.2,3],projection,800,500);near(actual.x,reference.x);near(actual.y,reference.y);
  }
  const changed={...snapshot(),projection:{...projection,tileH:36}};h.viewer.update(changed);h.viewer.render(2000);
  near(h.viewer.cameraState.elevation,Math.asin(36/80));assert.equal(h.viewer.snapshot,changed);h.viewer.dispose();assert.equal(h.handlers.size,0);assert.equal(h.calls.disposed,1);
});

test('rotation, zoom, wheel, drag, pan and pinch leave mapped mode; a click does not',()=>{
  for(const action of [h=>h.viewer.rotate(1),h=>h.viewer.zoomBy(1.2),h=>h.emit('wheel',{deltaY:20}),
    h=>{h.emit('pointerdown');h.emit('pointermove',{clientX:130});},
    h=>{h.emit('pointerdown',{shiftKey:true});h.emit('pointermove',{clientY:130});},
    h=>{h.emit('pointerdown');h.emit('pointerdown',{pointerId:2,clientX:200});h.emit('pointermove',{pointerId:2,clientX:230});}
  ]){const h=harness();action(h);assert.equal(h.viewer.cameraState.mode,'free');assert.equal(h.states.at(-1).mode,'free');h.viewer.dispose();}
  const h=harness();h.emit('pointerdown');h.emit('pointermove',{clientX:102});h.emit('pointerup',{clientX:102});
  assert.equal(h.viewer.cameraState.mode,'mapped');assert.equal(h.states.length,1);h.viewer.dispose();
});

test('renderer reserves human loading for Best and reports actual current asset readiness',()=>{
  const better=harness(),best=harness({assetQuality:'best'});
  assert.equal(better.calls.sceneOptions.assetQuality,'better');assert.equal(better.calls.sceneOptions.loadPerson,null);
  assert.equal(best.calls.sceneOptions.assetQuality,'best');assert.equal(typeof best.calls.sceneOptions.loadPerson,'function');
  const people=['ready','ready','loading','fallback',undefined].map(status=>{const actor=new Three.Group();actor.userData.personAssetStatus=status;best.model.actors.add(actor);return actor;});
  assert.equal(best.viewer.bestPeopleCount,2);assert.deepEqual({...best.viewer.bestPeopleStatus},{ready:2,loading:1,fallback:1,total:4});
  people[0].removeFromParent();people[2].userData.personAssetStatus='ready';
  assert.equal(best.viewer.bestPeopleCount,2);assert.deepEqual({...best.viewer.bestPeopleStatus},{ready:2,loading:0,fallback:1,total:3});
  better.viewer.dispose();best.viewer.dispose();
});
