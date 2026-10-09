import {surfaceHomography} from './surface-projection.mjs';
export const MATRIX_CAPTURE={id:'alsea-starbucks-360',source:'https://panorama-viewer-d8j.pages.dev/',image:'https://panorama-viewer-d8j.pages.dev/img/starbucks-demo.webp',yaw:160.4651749580645,pitch:-13.367460789032352,fov:100,sphereX:-3};
export const MAPPING_KEY='xpace_matrix_alsea_players_v1';
export function previewURL(value){
 if(!String(value||'').trim())return '';
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateMapping(value){
 if(!value||value.version!==1||value.capture!==MATRIX_CAPTURE.id||!Array.isArray(value.players)||value.players.length>24)throw Error('Invalid capture or player list');
 const ids=new Set();
 const players=value.players.map(p=>{
  if(!p||typeof p.id!=='string'||!p.id||p.id.length>100||ids.has(p.id)||!Array.isArray(p.corners)||p.corners.length!==4)throw Error('Invalid player');ids.add(p.id);
  const corners=p.corners.map(c=>{if(!c||!Number.isFinite(c.yaw)||!Number.isFinite(c.pitch)||Math.abs(c.pitch)>90||Math.abs(c.yaw)>360)throw Error('Invalid screen corner');return {yaw:c.yaw,pitch:c.pitch};});
  if(!surfaceHomography(tangentCorners(corners)))throw Error('Invalid screen aperture');
  const url=previewURL(p.url);if(url===null)throw Error('HTTPS preview URL required');
  if(!['frame','video','image'].includes(p.type))throw Error('Invalid preview type');
  const size={};if(p.width!==undefined||p.height!==undefined){if(!Number.isFinite(p.width)||!Number.isFinite(p.height)||p.width<64||p.height<64||p.width>4096||p.height>4096)throw Error('Invalid player dimensions');size.width=p.width;size.height=p.height;}
  return {...size,id:p.id,name:String(p.name||'Player').slice(0,100),playerId:String(p.playerId||'').slice(0,200),url,type:p.type,corners};
 });
 return {version:1,capture:MATRIX_CAPTURE.id,players};
}
// Validate rays on their common tangent plane, including calibrated screens crossing ±180°.
function tangentCorners(corners){
 const radians=Math.PI/180,rays=corners.map(c=>{const yaw=c.yaw*radians,pitch=c.pitch*radians;return [Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)];});
 const sum=rays.reduce((a,r)=>a.map((v,i)=>v+r[i]),[0,0,0]),length=Math.hypot(...sum);if(length<1e-10)return [];
 const n=sum.map(v=>v/length),axis=Math.abs(n[1])<.99?[0,1,0]:[1,0,0],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
 const r=cross(axis,n),norm=Math.hypot(...r),right=r.map(v=>v/norm),up=cross(n,right);
 return rays.map(ray=>{const d=dot(ray,n);return d>1e-10?{x:dot(ray,right)/d,y:dot(ray,up)/d}:null;});
}
// Homography from a unit rectangle to four viewport corners, in TL/TR/BR/BL order.
export function quadTransform(points,width=640,height=360){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const h=surfaceHomography(points);if(!h)return null;
 const matrix=[h[0]/width,h[3]/width,0,h[6]/width,h[1]/height,h[4]/height,0,h[7]/height,0,0,1,0,h[2],h[5],0,1];
 return matrix.every(Number.isFinite)?matrix:null;
}
