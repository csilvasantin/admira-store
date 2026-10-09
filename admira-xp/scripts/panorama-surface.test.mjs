import test from 'node:test';
import assert from 'node:assert/strict';
import {angularSurface,apertureContains,panoramaRay,rayPhotoPoint,unwrapAperture,angularPatch,validAperture} from './panorama-surface.mjs';
import * as T from './premium-three.mjs';
import {PANORAMA_MAP} from '../../xpacios/sneakerstore/next-step/panorama-map.mjs';
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
test('each calibrated screen has a finite inverse and recovers its source corners',()=>{
 for(const map of Object.values(PANORAMA_MAP))for(const s of map.surfaces){const p=angularSurface(s.quad);assert.ok(p,s.installation);for(let i=0;i<4;i++){const r=panoramaRay(s.quad[i]),d=dot(r,p.n),v=new T.Vector3(dot(r,p.right)/d,dot(r,p.up)/d,1).applyMatrix3(p.inverse);const uv=[v.x/v.z,v.y/v.z],wanted=[[0,0],[1,0],[0,1],[1,1]][i];assert.ok(Math.hypot(...uv.map((x,j)=>x-wanted[j]))<1e-8);}}
});
test('a rendered angular ray uses the same photographic pixel at every zoom and camera rotation',()=>{
 for(const yaw of [-3,-1,0,1,3])for(const pitch of [-1,0,1])for(const fov of [35,65,95])for(const aspect of [.5,1,2]){
  const camera=new T.PerspectiveCamera(fov,aspect,.1,20);camera.lookAt(Math.cos(pitch)*Math.cos(yaw),Math.sin(pitch),Math.cos(pitch)*Math.sin(yaw));camera.updateMatrixWorld();
  for(const [x,y]of [[0,0],[-.8,.6],[.75,-.7]]){const r=new T.Vector3(x,y,.5).unproject(camera).normalize(),photo=rayPhotoPoint(r.toArray()),back=panoramaRay(photo);assert.ok(Math.hypot(...back.map((v,i)=>v-r.getComponent(i)))<1e-10);}
 }
});
test('aperture clipping rejects outside and boundary paint, including the panorama seam',()=>{
 const polygon=[[2040,400],[8,400],[8,600],[2040,600]];assert.deepEqual(unwrapAperture(polygon),[[2040,400],[2056,400],[2056,600],[2040,600]]);
 assert.equal(apertureContains([0,500],polygon),true);for(const p of [[9,500],[2039,500],[0,399],[0,601],[2040,500]])assert.equal(apertureContains(p,polygon),false);
});
test('invalid screen mappings produce no paint',()=>{
 assert.equal(angularSurface([[1,1],[1,1],[1,1],[1,1]]),null);
 assert.equal(angularSurface([[1,1],[NaN,2],[3,4],[5,6]]),null);
 assert.equal(angularPatch([[0,0],[1,0],[NaN,1]],null),null);
 assert.equal(angularPatch([[0,0],[1,0],[1,1],[0,1]],null,{quad:[[1,1],[1,1],[1,1],[1,1]]}),null);
 assert.equal(validAperture([[0,0],[10,10],[0,10],[10,0]]),false);
 assert.equal(validAperture([null,[1,0],[1,1]]),false);
 for(const map of Object.values(PANORAMA_MAP)){for(const s of map.surfaces)assert.equal(validAperture(s.aperture),true);for(const p of map.occluders)assert.equal(validAperture(p),true);}
});
test('all rear views map the same three physical zones and never the masked master as one rectangle',()=>{
 for(const map of Object.values(PANORAMA_MAP)){const rear=map.surfaces.filter(s=>s.installation==='rear');assert.deepEqual(rear.map(s=>s.screen).sort(),[0,1,2]);}
});
