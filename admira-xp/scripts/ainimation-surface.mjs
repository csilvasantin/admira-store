import * as T from './premium-three.mjs';
import {surfaceHomography} from './surface-projection.mjs';
const visible=node=>{for(let p=node;p;p=p.parent)if(p.visible===false)return false;return true;};
export function findTouchSurface(world,id){let found=null;world?.traverse(node=>{if(node.isMesh&&node.userData.ainimationScreen===id&&visible(node))found=node;});return found;}
export function projectTouchSurface({world,actors,camera,canvas,id,occlusion=true}){
 const mesh=findTouchSurface(world,id);if(!mesh)return null;
 world.updateWorldMatrix(true,true);actors?.updateWorldMatrix(true,true);camera.updateMatrixWorld(true);
 const normal=new T.Vector3(0,0,1).applyNormalMatrix(new T.Matrix3().getNormalMatrix(mesh.matrixWorld));
 if(normal.dot(camera.getWorldDirection(new T.Vector3()))>=-.01)return null;
 const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return null;
 const local=[[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]],points=local.map(([x,y])=>new T.Vector3(x,y,0).applyMatrix4(mesh.matrixWorld));
 const ndc=points.map(p=>p.clone().project(camera));if(ndc.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.z< -1||p.z>1))return null;
 if(occlusion){
  const ray=new T.Raycaster();ray.near=camera.near;ray.far=camera.far;
  for(const [u,v] of [[0,0],[-.46,.46],[.46,.46],[.46,-.46],[-.46,-.46]]){
   const point=new T.Vector3(u,v,0).applyMatrix4(mesh.matrixWorld),projected=point.clone().project(camera);
   ray.setFromCamera(new T.Vector2(projected.x,projected.y),camera);
   const distance=point.clone().sub(ray.ray.origin).dot(ray.ray.direction);
   const obstruction=ray.intersectObjects([world,...(actors?[actors]:[])],true).find(hit=>hit.object!==mesh&&visible(hit.object)&&hit.distance<distance-.006&&!(hit.object.material?.transparent&&hit.object.material.opacity<.65));
   if(obstruction)return null;
  }
 }
 const corners=ndc.map(p=>({x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2}));
 return surfaceHomography(corners)?{corners,screen:id,location:mesh.userData.location,aperture:mesh.userData.aperture}:null;
}
export function surfaceCSS(corners,width,height){
 const h=surfaceHomography(corners);if(!h||width<=0||height<=0)return null;
 return 'matrix3d('+[h[0]/width,h[3]/width,0,h[6]/width,h[1]/height,h[4]/height,0,h[7]/height,0,0,1,0,h[2],h[5],0,1].join(',')+')';
}
