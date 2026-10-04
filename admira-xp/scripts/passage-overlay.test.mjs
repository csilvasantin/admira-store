import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './premium-three.mjs';
import {appendPassageOverlay} from './passage-overlay.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import {physicalColliders} from './physical-colliders.mjs';
import {furnitureBounds,isSolidFurniture} from './furniture-geometry.mjs';
import {mappedCameraFrame,fitBoxFrame} from './life-camera.mjs';

test('free passage displays exact body diameters, circular joins and aligned floor/volume along every segment',()=>{
  for(const [actor,radius]of [['human',.72],['unitree',.52]]){
    const group=new T.Group(),route=[{col:16,row:3},{col:13,row:3},{col:9,row:5}];
    appendPassageOverlay(group,{status:'clear',actor,radius,route,origin:route[0],target:route.at(-1),blockers:[]});group.updateMatrixWorld(true);
    const role=name=>group.children.filter(c=>c.userData.passageRole===name);
    assert.equal(role('route:volume').length,2);assert.equal(role('route:floor').length,2);assert.equal(role('route:join').length,3);assert.equal(role('route:join-volume').length,3);
    assert.equal(role('origin:volume')[0].geometry.parameters.radiusTop,radius);assert.equal(role('target:volume')[0].geometry.parameters.radiusTop,radius);
    for(const [i,mesh]of role('route:floor').entries()){
      const a=route[i],b=route[i+1],dx=b.col-a.col,dz=b.row-a.row,length=Math.hypot(dx,dz),position=mesh.geometry.attributes.position,p=new T.Vector3();
      assert.equal(mesh.geometry.parameters.width,radius*2);assert.equal(role('route:volume')[i].geometry.parameters.width,radius*2);
      for(let v=0;v<position.count;v++){p.fromBufferAttribute(position,v).applyMatrix4(mesh.matrixWorld);const cross=((p.x-(a.col+b.col)/2)*dz-(p.z-(a.row+b.row)/2)*dx)/length;assert.ok(Math.abs(Math.abs(cross)-radius)<1e-6,'floor strip stays aligned with the body volume');}
    }
    for(const c of group.children){c.geometry.dispose();c.material.dispose();}
  }
});

test('blocked diagnostics highlight the physical blockers without drawing an invented route or spawning actor clones',()=>{
  const group=new T.Group(),blocker={id:'geometry:counter',itemId:'counter',minCol:3.1,maxCol:5.4,minRow:2.9,maxRow:4.17};
  const result={status:'blocked',actor:'unitree',radius:.52,origin:{col:16,row:3.35},target:{col:7,row:4},route:null,blockers:[blocker]},before=JSON.stringify(result);
  appendPassageOverlay(group,result);const meshes=group.children.filter(c=>c.userData.passageRole==='blocker');assert.equal(meshes.length,1);
  assert.ok(Math.abs(meshes[0].geometry.parameters.width-2.3)<1e-8);assert.ok(Math.abs(meshes[0].geometry.parameters.depth-1.27)<1e-8);assert.equal(meshes[0].userData.itemId,'counter');
  assert.equal(group.children.some(c=>c.userData.passageRole.startsWith('route:')),false);assert.equal(group.children.some(c=>c.userData.actor),false);assert.equal(JSON.stringify(result),before);
  for(const c of group.children){c.geometry.dispose();c.material.dispose();}
  const unavailable=new T.Group();appendPassageOverlay(unavailable,{...result,status:'unavailable'});assert.equal(unavailable.children.length,0);
});

test('the existing renderer clears and disposes every diagnostic resource when the map is hidden or the viewer closes',()=>{
  const source=fs.readFileSync(new URL('./life-renderer.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function createLifeRenderer','function createLifeRenderer');
  const architecture={id:'linked-wall',itemId:'pillar',kind:'architecture',minCol:8.25,maxCol:8.6,minRow:1.7,maxRow:6.2};
  const hardness={id:'linked-hardness',itemId:'fixed-floor',kind:'hardness',minCol:9.75,maxCol:10.25,minRow:6.5,maxRow:7.25};
  const staleFurniture={id:'geometry:saved-furniture',itemId:'target',kind:'furniture',minCol:6.25,maxCol:6.6,minRow:2.7,maxRow:5.2};
  const scene={active:true,roomId:'test',cols:14,rows:8,wallHeight:3,layout:[],actors:[],doorRow:3.35,doorHalfWidth:1,doorOpen:0,colliders:[architecture,staleFurniture],hardness:{fixed:[],colliders:[hardness]}};
  const model={snapshot:scene,scene:new T.Scene(),world:new T.Group(),actors:new T.Group(),update(){},setLighting(){},dispose(){this.disposed=true;}};model.scene.add(model.world,model.actors);
  const canvas={clientWidth:800,clientHeight:500,addEventListener(){},removeEventListener(){}};
  const graphics={...T,WebGLRenderer:class{constructor(){this.shadowMap={};}setClearColor(){}setPixelRatio(){}setSize(){}dispose(){}forceContextLoss(){}}};
  const context=vm.createContext({T:graphics,createLifeScene:()=>model,mappedCameraFrame,fitBoxFrame,createLibraryRuntime:()=>({dispose(){}}),physicalColliders,furnitureBounds,isSolidFurniture,appendPassageOverlay,performance:{now:()=>0}});
  vm.runInContext(source,context);const viewer=context.createLifeRenderer({canvas,snapshot:scene});
  const passage={status:'clear',actor:'human',radius:.72,doorMode:'open',route:[{col:16,row:3.35},{col:7,row:4}],origin:{col:16,row:3.35},target:{col:7,row:4},blockers:[]};
  viewer.setEditorOverlay({scene,showMap:true,passage});const overlay=model.scene.getObjectByName('distribuit:hardness');assert.ok(overlay.children.some(c=>c.userData.passageRole==='route:volume'));
  const showsBounds=box=>overlay.children.some(child=>{
    if(!child.isLine||child.isLineSegments)return false;
    const p=child.geometry.attributes.position,cols=Array.from({length:p.count},(_,i)=>p.getX(i)),rows=Array.from({length:p.count},(_,i)=>p.getZ(i));
    return Math.abs(Math.min(...cols)-box.minCol)<1e-6&&Math.abs(Math.max(...cols)-box.maxCol)<1e-6&&Math.abs(Math.min(...rows)-box.minRow)<1e-6&&Math.abs(Math.max(...rows)-box.maxRow)<1e-6;
  });
  assert.equal(showsBounds(architecture),true,'an inventory link must not hide structural collision geometry');assert.equal(showsBounds(hardness),true,'fixed hardness retains linked bounds');assert.equal(showsBounds(staleFurniture),false,'the saved pose envelope must not survive a furniture preview');
  assert.equal(model.world.children.length,0);assert.equal(model.actors.children.length,0);assert.equal(scene.doorOpen,0);
  let disposedGeometry=0,disposedMaterial=0;const count=overlay.children.length;
  for(const child of overlay.children){child.geometry.addEventListener('dispose',()=>disposedGeometry++);child.material.addEventListener('dispose',()=>disposedMaterial++);}
  viewer.setEditorOverlay({scene,showMap:false,passage});assert.equal(overlay.children.length,0);assert.equal(disposedGeometry,count);assert.equal(disposedMaterial,count);
  viewer.setEditorOverlay({scene,showMap:true,passage});const closingCount=overlay.children.length;
  for(const child of overlay.children){child.geometry.addEventListener('dispose',()=>disposedGeometry++);child.material.addEventListener('dispose',()=>disposedMaterial++);}
  viewer.dispose();assert.equal(disposedGeometry,count+closingCount);assert.equal(disposedMaterial,count+closingCount);assert.equal(overlay.parent,null);assert.equal(model.disposed,true);
});
