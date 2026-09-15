import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './premium-three.mjs';
import {configureIntegratedCamera,projectionScale,projectWorld,unprojectToFloor,legacyFurnitureTransform} from './premium-projection.mjs';
import {normalizeSnapshot} from './premium-model.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const profiles=[{width:800,height:500,ox:270,oy:185,tileW:80,tileH:28},{width:1420,height:860,ox:630,oy:310,tileW:104,tileH:39},{width:390,height:720,ox:100,oy:240,tileW:44,tileH:22}];
test('Integrated camera reproduces toIso and vertical offsets for all ground corners and raised points',()=>{
  for(const p of profiles){const camera=configureIntegratedCamera(new T.OrthographicCamera(),p);const {pixelsPerHeightUnit}=projectionScale(p);
    for(const x of [-1,0,3.2,14])for(const z of [0,2.5,8])for(const y of [0,.4,2.2,3.25]){
      const result=projectWorld(camera,{x,y,z},p.width,p.height);
      near(result.x,p.ox+(x-z)*p.tileW/2);near(result.y,p.oy+(x+z)*p.tileH/2-y*pixelsPerHeightUnit);
    }
  }
});
test('Projection and floor unprojection round trip actor feet and furniture grid targets',()=>{
  for(const p of profiles){const camera=configureIntegratedCamera(new T.OrthographicCamera(),p);
    for(const [col,row,height] of [[0,0,0],[1,2,0],[13,3.35,0],[4.2,1.7,.5]]){
      const pos=projectWorld(camera,{col,row,height},p.width,p.height),ground=unprojectToFloor(camera,pos.x,pos.y,p.width,p.height,height);
      near(ground.col,col);near(ground.row,row);near(ground.height,height);
    }
  }
});
test('Viewport and isometric origin changes alter projection without changing scene coordinates',()=>{
  const camera=new T.OrthographicCamera(),a=profiles[0],b={...a,width:1200,height:800,ox:420,oy:260};
  configureIntegratedCamera(camera,a);const before=projectWorld(camera,{x:6,y:1,z:3},a.width,a.height);
  configureIntegratedCamera(camera,b);const after=projectWorld(camera,{x:6,y:1,z:3},b.width,b.height);
  near(after.x-before.x,150);near(after.y-before.y,75);
  assert.deepEqual(normalizeSnapshot({projection:b}).projection,b);
});
test('Invalid projection is rejected before a camera can silently misalign the interface',()=>{
  assert.equal(normalizeSnapshot({projection:{...profiles[0],tileW:0}}).projection,null);
  assert.throws(()=>projectionScale({...profiles[0],tileH:81}),/Invalid/);
});
test('Edited furniture uses the same screen-space flip, scaling and rotation as Good',()=>{
  const p=profiles[0],camera=configureIntegratedCamera(new T.OrthographicCamera(),p),heightUnit=projectionScale(p).pixelsPerHeightUnit;
  for(const rot of [0,1,2,3])for(const flipX of [true,false]){
    const item={col:4,row:2,sx:1.7,sy:.65,rot,flipX},matrix=legacyFurnitureTransform(p,item);
    for(const point of [[0,0,0],[1,0,2],[1,.8,2]]){
      const transformed=new T.Vector3(...point).applyMatrix4(matrix),actual=projectWorld(camera,transformed,p.width,p.height);
      const px=(point[0]-point[2])*p.tileW/2*item.sx*(flipX?-1:1),py=((point[0]+point[2])*p.tileH/2-point[1]*heightUnit)*item.sy;
      const angle=rot*Math.PI/2;
      near(actual.x,p.ox+(item.col-item.row)*p.tileW/2+Math.cos(angle)*px-Math.sin(angle)*py);
      near(actual.y,p.oy+(item.col+item.row)*p.tileH/2+Math.sin(angle)*px+Math.cos(angle)*py);
    }
  }
});
