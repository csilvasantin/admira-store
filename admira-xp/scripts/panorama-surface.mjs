import * as T from './premium-three.mjs';
import {surfaceHomography} from './surface-projection.mjs';

// One angular coordinate system for the original photograph, content and masks.
// The camera rotates/zooms at the capture origin; mesh tessellation is never UV evidence.
export const PHOTO_GRID=[2048,1024];
export const APERTURE_GUARD=.2;
export function panoramaRay([x,y],grid=PHOTO_GRID){const phi=x/grid[0]*Math.PI*2,theta=y/grid[1]*Math.PI;return [Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)];}
export function rayPhotoPoint(ray,grid=PHOTO_GRID){const n=Math.hypot(...ray);return [((Math.atan2(ray[2],ray[0])/(Math.PI*2)+1)%1)*grid[0],Math.acos(Math.max(-1,Math.min(1,ray[1]/n)))/Math.PI*grid[1]];}
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],normal=a=>{const d=Math.hypot(...a);return d>1e-12?a.map(v=>v/d):null;};
export function angularSurface(quad){
 if(!Array.isArray(quad)||quad.length!==4||quad.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))return null;
 const rays=quad.map(p=>panoramaRay(p)),n=normal(rays.reduce((s,r)=>s.map((v,i)=>v+r[i]),[0,0,0]));if(!n)return null;
 const right=normal(cross(Math.abs(n[1])<.99?[0,1,0]:[1,0,0],n)),up=cross(n,right);
 const points=rays.map(r=>{const d=dot(r,n);return d>1e-10?{x:dot(r,right)/d,y:dot(r,up)/d}:null;});
 const h=surfaceHomography([points[0],points[1],points[3],points[2]]);if(!h)return null;
 return {n,right,up,h,inverse:new T.Matrix3().set(...h).invert()};
}
// Used both by the shader and independent CPU containment checks.
export function apertureContains(point,polygon,guard=APERTURE_GUARD){
 let inside=false,min=Infinity;polygon=unwrapAperture(polygon);const center=polygon.reduce((s,p)=>s+p[0]/polygon.length,0),x=point[0]+Math.floor((center-point[0])/2048+.5)*2048,y=point[1];
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [ax,ay]=polygon[j],[bx,by]=polygon[i],dx=bx-ax,dy=by-ay,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/d)):0;
  min=Math.min(min,Math.hypot(x-ax-t*dx,y-ay-t*dy));if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside&&min>=guard;
}
export function unwrapAperture(polygon){const first=polygon[0]?.[0];return polygon.map(([x,y])=>[x+Math.floor((first-x)/2048+.5)*2048,y]);}
export function validAperture(polygon){
 if(!Array.isArray(polygon)||polygon.length<3||polygon.length>40||polygon.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[1]<0||p[1]>1024))return false;
 const p=unwrapAperture(polygon),turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 if(Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))<1e-8)return false;
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8)return false;
  for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const c=p[j],d=p[(j+1)%p.length];if(turn(a,b,c)*turn(a,b,d)<=0&&turn(c,d,a)*turn(c,d,b)<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1])))return false;}
 }
 return true;
}
const rayGLSL=`varying vec3 surfaceRay;
vec2 photoPoint(vec3 ray){vec3 d=normalize(ray);return vec2(fract(atan(d.z,d.x)/6.283185307179586+1.0)*2048.0,acos(clamp(d.y,-1.0,1.0))/3.141592653589793*1024.0);}`;
function angularMaterial(texture,{aperture=null,projection=null,crop=[0,0,1,1],guard=APERTURE_GUARD}={}){
 const material=new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,depthTest:false,depthWrite:false,toneMapped:false});
 const count=aperture?.length||0;
 material.customProgramCacheKey=()=>`angular-aperture-v1-${count}-${!!projection}`;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 surfaceRay;').replace('#include <begin_vertex>','#include <begin_vertex>\nsurfaceRay=(modelMatrix*vec4(position,1.0)).xyz;');
  let declarations=rayGLSL,clip='';
  if(aperture){
   shader.uniforms.aperture={value:aperture.map(p=>new T.Vector2(...p))};shader.uniforms.apertureGuard={value:guard};
   // Unwrap around the measured patch, so a panel may cross the panorama seam.
   shader.uniforms.patchCenter={value:aperture.reduce((s,p)=>s+p[0]/count,0)};
   declarations+=`\nuniform vec2 aperture[${count}];uniform float apertureGuard;uniform float patchCenter;`;
   clip=`pt.x+=floor((patchCenter-pt.x)/2048.0+0.5)*2048.0;bool inside=false;float edgeDistance=1.0e8;
    for(int i=0;i<${count};i++){vec2 a=aperture[i];vec2 b=aperture[${count-1}];if(i>0)b=aperture[i-1];vec2 ab=b-a;float t=clamp(dot(pt-a,ab)/max(dot(ab,ab),1.0e-12),0.0,1.0);edgeDistance=min(edgeDistance,length(pt-a-t*ab));if((a.y>pt.y)!=(b.y>pt.y)){float at=(b.x-a.x)*(pt.y-a.y)/(b.y-a.y)+a.x;if(pt.x<at)inside=!inside;}}
    if(!inside||edgeDistance<apertureGuard)discard;`;
  }
  let uv='vec2 sourceUV=vec2(fract(pt.x/2048.0),1.0-pt.y/1024.0);';
  if(projection){
   Object.assign(shader.uniforms,{surfaceNormal:{value:new T.Vector3(...projection.n)},surfaceRight:{value:new T.Vector3(...projection.right)},surfaceUp:{value:new T.Vector3(...projection.up)},surfaceInverse:{value:projection.inverse},sourceCrop:{value:new T.Vector4(...crop)}});
   declarations+='\nuniform vec3 surfaceNormal,surfaceRight,surfaceUp;uniform mat3 surfaceInverse;uniform vec4 sourceCrop;';
   uv=`vec3 d=normalize(surfaceRay);float plane=dot(d,surfaceNormal);if(plane<=0.0)discard;vec3 local=surfaceInverse*vec3(dot(d,surfaceRight)/plane,dot(d,surfaceUp)/plane,1.0);if(abs(local.z)<1.0e-8)discard;vec2 q=clamp(local.xy/local.z,0.0,1.0);vec2 sourceUV=vec2(sourceCrop.x+q.x*sourceCrop.z,1.0-sourceCrop.y-q.y*sourceCrop.w);`;
  }
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+declarations).replace('#include <map_fragment>',`#ifdef USE_MAP\nvec2 pt=photoPoint(surfaceRay);${clip}\n${uv}\ndiffuseColor*=texture2D(map,sourceUV);\n#endif`);
 };
 return material;
}
export function angularPhotographMaterial(){return angularMaterial(null);}
export function angularPatch(polygon,texture,{quad=null,crop,guard=APERTURE_GUARD,radius=9.98}={}){
 if(!validAperture(polygon)||!Number.isFinite(guard)||guard<0||!Number.isFinite(radius)||radius<=0)return null;
 if(quad&&(!Array.isArray(crop)||crop.length!==4||!crop.every(Number.isFinite)||crop[0]<0||crop[1]<0||crop[2]<=0||crop[3]<=0||crop[0]+crop[2]>1+1e-8||crop[1]+crop[3]>1+1e-8))return null;
 polygon=unwrapAperture(polygon);
 const projection=quad?angularSurface(quad):null;if(quad&&!projection)return null;
 // A padded angular rectangle covers the entire observed aperture, including bowed edges.
 const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]),x0=Math.min(...xs)-2,x1=Math.max(...xs)+2,y0=Math.max(0,Math.min(...ys)-2),y1=Math.min(1024,Math.max(...ys)+2),p=[],indices=[],steps=12;
 for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++)p.push(...panoramaRay([x0+(x1-x0)*x/steps,y0+(y1-y0)*y/steps]).map(n=>n*radius));
 for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){const a=y*(steps+1)+x,b=a+1,c=a+steps+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setIndex(indices);
 return new T.Mesh(geometry,angularMaterial(texture,{aperture:polygon,projection,crop,guard}));
}
