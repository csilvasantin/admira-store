import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceHomography,projectSurfacePoint} from './surface-projection.mjs';
import * as T from './premium-three.mjs';

const quad=[{x:45,y:38},{x:330,y:76},{x:290,y:270},{x:55,y:245}];
const contained=(points,p)=>{
 const crosses=points.map((a,i)=>{const b=points[(i+1)%4];return ((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))/Math.hypot(b.x-a.x,b.y-a.y);});
 return crosses.every(v=>v>=-1e-7)||crosses.every(v=>v<=1e-7);
};
test('active-aperture transform keeps edges and every interior point within the physical quad',()=>{
 for(const points of [quad,[...quad].reverse(),quad.map(p=>({x:p.x*1e-6,y:p.y*1e-6})),quad.map(p=>({x:p.x+1e8,y:p.y-1e8}))]){
  const h=surfaceHomography(points);assert.ok(h);
  [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{const p=projectSurfacePoint(h,u,v);assert.ok(Math.hypot(p.x-points[i].x,p.y-points[i].y)<1e-7);});
  for(let y=0;y<=20;y++)for(let x=0;x<=20;x++)assert.ok(contained(points,projectSurfacePoint(h,x/20,y/20)));
 }
});
test('invalid physical apertures fail closed instead of producing folded or infinite content',()=>{
 const invalid=[null,[],[null,...quad.slice(1)],quad.map(p=>({...p,x:Infinity})),quad.map(p=>({...p,y:NaN})),[quad[0],quad[2],quad[1],quad[3]],Array(4).fill({x:1,y:1}),[{x:0,y:0},{x:1,y:0},{x:.5,y:.2},{x:0,y:1}],[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}]];
 for(const points of invalid)assert.equal(surfaceHomography(points),null);
 assert.equal(projectSurfacePoint([1,0,0,0,1,0,-2,0,1],.5,.5),null);
 assert.equal(projectSurfacePoint([1,0,0,0,1,0,-2,0,1],1,.5),null);
 assert.equal(projectSurfacePoint(Array(9).fill(NaN),0,0),null);
 const valid=surfaceHomography(quad);
 for(const [u,v]of [[-.001,.5],[1.001,.5],[.5,-.001],[.5,1.001]])assert.equal(projectSurfacePoint(valid,u,v),null);
});
test('the same aperture retains containment while the panorama camera turns, tilts, zooms and resizes',()=>{
 const rays=[[-.20,.22,1],[.28,.18,1],[.24,-.24,1],[-.18,-.19,1]].map(p=>new T.Vector3(...p).normalize());
 let checks=0;
 for(const yaw of [-.25,0,.25])for(const pitch of [-.18,0,.18])for(const fov of [35,65,95])for(const [width,height]of [[320,640],[1280,720],[1920,1080]]){
  const camera=new T.PerspectiveCamera(fov,width/height,.1,20);camera.lookAt(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camera.updateMatrixWorld(true);
  const points=rays.map(ray=>{const p=ray.clone().project(camera);return {x:(p.x+1)*width/2,y:(1-p.y)*height/2};}),h=surfaceHomography(points);assert.ok(h);
  for(let y=0;y<=10;y++)for(let x=0;x<=10;x++)assert.ok(contained(points,projectSurfacePoint(h,x/10,y/10)));
  checks++;
 }
 assert.equal(checks,81);
});
