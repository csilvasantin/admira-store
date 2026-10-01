import * as T from './premium-three.mjs';
import {GLTFLoader} from './vendor/GLTFLoader.mjs';

const buffers=new Map();
const assetURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='api.admira.store'&&/^\/stock\/asset\/[\w-]+$/.test(u.pathname)?u.href:null;}catch{return null;}};
const posterURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&((u.hostname==='api.admira.store'&&/^\/stock\/(poster|asset)\/[\w-]+$/.test(u.pathname))||(u.hostname==='stock.admira.store'&&u.pathname.startsWith('/stock/')))?u.href:null;}catch{return null;}};
export function pixeriaFurnitureAsset(value){
  const url=assetURL(value?.url);
  if(!url||value?.type!=='furni'||!/^\w[\w-]{0,119}$/.test(value.id)||new URL(url).pathname.split('/').at(-1)!==value.id)return null;
  const model=value.mime==='model/gltf-binary',image=/^image\/(png|jpeg|webp|gif)$/.test(value.mime||'');
  if(!model&&!image)return null;
  let dimensions;try{dimensions=JSON.parse(value.prompt||'{}').dimensionsCm;}catch{}
  const fp=Array.isArray(value.fp)&&value.fp.length===2&&value.fp.every(n=>Number.isFinite(n)&&n>=.1&&n<=10)?[...value.fp]:Array.isArray(dimensions)&&dimensions.length===3&&dimensions.slice(0,2).every(n=>Number.isFinite(n)&&n>=10&&n<=1000)?dimensions.slice(0,2).map(n=>n/100):[1,1];
  return {assetId:value.id,label:String(value.title||'PixerIA').slice(0,120),fp,source:'PixerIA',assetUrl:url,modelUrl:model?url:null,img:model?posterURL(value.poster)||posterURL(value.thumbnail):url,format:model?'3D':'image',ph:Math.max(12,Math.min(200,Number(value.ph)||46))};
}
async function modelBuffer(url){
  if(!assetURL(url))throw Error('asset');
  if(!buffers.has(url))buffers.set(url,(async()=>{
    const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('asset');
    if(Number(r.headers.get('Content-Length'))>25*1024*1024)throw Error('asset');
    const data=await r.arrayBuffer();if(data.byteLength<20||data.byteLength>25*1024*1024)throw Error('asset');
    const header=new DataView(data);if(header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==data.byteLength)throw Error('asset');
    return data;
  })().catch(e=>{buffers.delete(url);throw e;}));
  // Bound retained source buffers; scene-owned geometry is disposed separately.
  if(buffers.size>24)buffers.delete(buffers.keys().next().value);
  return buffers.get(url);
}
export function fitPixeriaModel(asset,fp){
  const box=new T.Box3().setFromObject(asset),size=box.getSize(new T.Vector3());
  if(![size.x,size.y,size.z].every(Number.isFinite)||size.y<=0||Math.max(size.x,size.z)<=0)throw Error('asset');
  const factor=Math.min(fp[0]/Math.max(size.x,.001),fp[1]/Math.max(size.z,.001));
  const fitted=new T.Group();fitted.add(asset);fitted.scale.setScalar(factor);
  fitted.position.set((fp[0]-size.x*factor)/2-box.min.x*factor,-box.min.y*factor,(fp[1]-size.z*factor)/2-box.min.z*factor);
  fitted.userData.pixeria=true;fitted.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return fitted;
}
export function disposePixeriaModel(root){root?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}}});}
export async function loadPixeriaFurniture(item){
  if(item.modelUrl){
    const data=await modelBuffer(item.modelUrl),parsed=await new GLTFLoader().parseAsync(data,new URL('.',item.modelUrl).href);
    try{return fitPixeriaModel(parsed.scene,item.fp||[1,1]);}catch(e){disposePixeriaModel(parsed.scene);throw e;}
  }
  if(!posterURL(item.img))throw Error('asset');
  const map=await new T.TextureLoader().loadAsync(item.img);map.colorSpace=T.SRGBColorSpace;
  const [w,d]=item.fp||[1,1],width=Math.min(w,d),height=Math.min(3,width*map.image.height/map.image.width);
  const root=new T.Group(),plane=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshStandardMaterial({map,transparent:true,side:T.DoubleSide,roughness:.8}));
  plane.position.set(w/2,height/2,d/2);root.add(plane);root.userData.pixeria=true;return root;
}
export async function checkPixeriaFurniture(asset){
  // Decode before publishing an instance, so a broken source never saves as a
  // silently substituted cabinet. Parsing the original GLB also checks meshes.
  const preview=await loadPixeriaFurniture(asset);disposePixeriaModel(preview);return true;
}
