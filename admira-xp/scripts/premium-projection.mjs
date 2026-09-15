import * as T from './premium-three.mjs';
import {normalizeProjection} from './premium-model.mjs';
export function projectionScale(projection){
  const p=normalizeProjection(projection);if(!p)throw new TypeError('Invalid isometric projection');
  const scale=p.tileW/Math.SQRT2,elevation=Math.asin(p.tileH/p.tileW);
  return {pixelsPerUnit:scale,pixelsPerHeightUnit:scale*Math.cos(elevation),elevation};
}
/** Pixel-identical to toIso(): col is world X; row is world Z; height is world Y. */
export function configureIntegratedCamera(camera,projection){
  const p=normalizeProjection(projection),{pixelsPerUnit:scale,elevation}=projectionScale(p);
  const radius=250,horizontal=radius*Math.cos(elevation)/Math.SQRT2;
  camera.position.set(horizontal,radius*Math.sin(elevation),horizontal);camera.up.set(0,1,0);camera.lookAt(0,0,0);
  camera.near=.1;camera.far=1000;
  camera.left=-p.ox/scale;camera.right=(p.width-p.ox)/scale;
  camera.top=p.oy/scale;camera.bottom=(p.oy-p.height)/scale;
  camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  return camera;
}
export function projectWorld(camera,point,width,height){
  const p=new T.Vector3(point.x??point.col??0,point.y??point.height??0,point.z??point.row??0).project(camera);
  return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,depth:p.z};
}
export function unprojectToFloor(camera,x,y,width,height,floorHeight=0){
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(x/width*2-1,1-y/height*2),camera);
  const result=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-floorHeight),new T.Vector3());
  return result?{col:result.x,row:result.z,height:result.y}:null;
}
/** Good applies scale/rotation in Canvas pixel coordinates, not around world Y. */
export function legacyFurnitureTransform(projection,{col=0,row=0,sx=1,sy=1,flipX=false,rot=0}={}){
  const {elevation}=projectionScale(projection),s=Math.sin(elevation),c=Math.cos(elevation),q=Math.SQRT1_2;
  const cameraBasis=new T.Matrix4().makeBasis(new T.Vector3(q,0,-q),new T.Vector3(-s*q,c,-s*q),new T.Vector3(c*q,s,c*q));
  const transform=cameraBasis.clone().multiply(new T.Matrix4().makeRotationZ(-rot*Math.PI/2)).multiply(new T.Matrix4().makeScale((flipX?-1:1)*sx,sy,1)).multiply(cameraBasis.clone().invert());
  return new T.Matrix4().makeTranslation(col,0,row).multiply(transform);
}
